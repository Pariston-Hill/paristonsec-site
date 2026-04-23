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
      <h3><a href="post.html?id=${encodeURIComponent(post.id)}">${post.title[lang]}</a></h3>
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
  const descEl = document.getElementById("post-desc");
  const codeEl = document.getElementById("post-code");
  if (!titleEl || !metaEl || !descEl || !codeEl) return;

  if (!post) {
    titleEl.textContent = t("post_not_found", lang);
    metaEl.textContent = t("invalid_post", lang);
    descEl.textContent = t("post_hint", lang);
    codeEl.textContent = t("no_code", lang);
    return;
  }

  titleEl.textContent = post.title[lang];
  metaEl.textContent = `Category: ${post.categoryLabel[lang]} | Date: ${post.date}`;
  descEl.textContent = post.content[lang];
  codeEl.textContent = post.code;
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
