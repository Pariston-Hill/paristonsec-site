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

const posts = window.postsData || [];

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
  const renderToggleState = (lang) => {
    btn.dataset.lang = lang;
    btn.setAttribute("aria-label", lang === "en" ? "Switch language to Chinese" : "Switch language to English");
    btn.setAttribute("title", lang === "en" ? "Switch to Chinese" : "Switch to English");
    btn.innerHTML = `
      <span class="lang-toggle-slider" aria-hidden="true"></span>
      <span class="lang-toggle-option" data-lang-option="en">English</span>
      <span class="lang-toggle-option" data-lang-option="zh">中文</span>
    `;
  };

  renderToggleState(currentLang);
  btn.addEventListener("click", () => {
    const next = getLanguage() === "en" ? "zh" : "en";
    setLanguage(next);
    applyStaticTranslations(next);
    if (page === "post") {
      renderSinglePost(next);
    } else {
      renderCards(page, next);
    }
    renderToggleState(next);
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
  const postId = params.get("id") || document.body.dataset.postId;
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
    const assetBase = document.body.dataset.assetBase || "";
    bodyEl.innerHTML = post.contentHtml[lang].replaceAll('src="assets/', `src="${assetBase}assets/`);
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
  const lang = "en";
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
