import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function findImagesDir() {
  const base = path.resolve("z:/Github/Current_Study_Project");
  const dir = fs.readdirSync(base, { withFileTypes: true })
    .find((entry) => entry.isDirectory() && entry.name.startsWith("000_"));
  if (!dir) throw new Error("Images directory 000_* not found");
  return path.join(base, dir.name);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function adjustMarkdownHeadings(markdown) {
  return markdown
    .split("\n")
    .map((line) => {
      const match = line.match(/^(#{1,6})(\s+.*)$/);
      if (!match) return line;
      const level = match[1].length;
      if (level >= 4) return line;
      return `${"#".repeat(level + 1)}${match[2]}`;
    })
    .join("\n");
}

function preprocessMarkdown(markdown, postSlug) {
  let text = stripDuplicateTail(markdown);
  text = adjustMarkdownHeadings(text);

  text = text.replace(/!\[\[([^\]]+)\]\]/g, (_, name) => {
    const file = name.trim();
    return `\n\n![${file}](assets/posts/${postSlug}/${file})\n\n`;
  });

  text = text.replace(/\[\[([^\]]+)\]\]/g, "$1");
  return text;
}

function normalizeBlockHtml(html) {
  return html.replace(/>\s+</g, ">\n<").replace(/\n{3,}/g, "\n\n");
}

function postProcessHtml(html) {
  return normalizeBlockHtml(
    html
    .replace(
      /<p>([^<]*?)!\[([^\]]*)\]\(([^)]+)\)([^<]*?)<\/p>/g,
      (_, before, alt, src, after) => {
        const chunks = [];
        const lead = before.replace(/\n/g, " ").trim();
        const tail = after.replace(/\n/g, " ").trim();
        if (lead) chunks.push(`<p>${lead}</p>`);
        chunks.push(`<img alt="${alt.replace(/"/g, "&quot;")}" src="${src}"/>`);
        if (tail) chunks.push(`<p>${tail}</p>`);
        return chunks.join("\n");
      }
    )
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2"/>')
  );
}

function excerptFromMarkdown(markdown, maxLen = 220) {
  const plain = markdown
    .replace(/!\[\[[^\]]+\]\]/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*`\-\d\.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length <= maxLen ? plain : `${plain.slice(0, maxLen).trim()}...`;
}

function configureMarked() {
  const renderer = new marked.Renderer();

  renderer.code = ({ text, lang }) => {
    const language = (lang || "").trim();
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const cls = language ? ` class="language-${language}"` : "";
    return `<pre><code${cls}>${escaped}</code></pre>`;
  };

  renderer.image = ({ href, title, text }) => {
    const alt = (text || "").replace(/"/g, "&quot;");
    const titleAttr = title ? ` title="${title.replace(/"/g, "&quot;")}"` : "";
    return `<img alt="${alt}" src="${href}"${titleAttr}/>`;
  };

  marked.setOptions({
    gfm: true,
    breaks: false,
    renderer
  });
}

function copyImages(markdown, imagesDir, assetDir) {
  fs.mkdirSync(assetDir, { recursive: true });
  const refs = [...markdown.matchAll(/!\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim());
  const unique = [...new Set(refs)];
  const copied = [];

  for (const file of unique) {
    const src = path.join(imagesDir, file);
    const dest = path.join(assetDir, file);
    if (!fs.existsSync(src)) {
      console.warn(`[warn] missing image: ${file}`);
      continue;
    }
    fs.copyFileSync(src, dest);
    copied.push(file);
  }

  return copied;
}

function loadPostsData() {
  const file = path.join(ROOT, "posts-data.js");
  const raw = fs.readFileSync(file, "utf8");
  const start = raw.indexOf("window.postsData = [");
  const end = raw.indexOf("];\n\n(function normalizePostsData");
  if (start === -1 || end === -1) {
    throw new Error("Unable to parse posts-data.js");
  }
  const json = raw.slice(start + "window.postsData = ".length, end + 1);
  return { file, raw, posts: JSON.parse(json) };
}

function savePostsData({ file, raw, posts }) {
  const start = raw.indexOf("window.postsData = [");
  const end = raw.indexOf("];\n\n(function normalizePostsData");
  const updated =
    raw.slice(0, start) +
    `window.postsData = ${JSON.stringify(posts, null, 2)}` +
    raw.slice(end + 1);
  fs.writeFileSync(file, updated, "utf8");
}

const POST_NAV = `        <a href="../../index.html" data-nav="blog" data-i18n="nav_blog">Blog</a>
        <a href="../../web.html" data-nav="web" data-i18n="nav_web">Web Security</a>
        <a href="../../pentest.html" data-nav="pentest" data-i18n="nav_pentest">Penetration Testing</a>
        <a href="../../exploit-research.html" data-nav="exploit-research" data-i18n="nav_exploit_research">Exploit Research</a>
        <a href="../../ad.html" data-nav="ad" data-i18n="nav_ad">Active Directory</a>`;

const ROOT_NAV = `        <a href="index.html" data-nav="blog" data-i18n="nav_blog">Blog</a>
        <a href="web.html" data-nav="web" data-i18n="nav_web">Web Security</a>
        <a href="pentest.html" data-nav="pentest" data-i18n="nav_pentest">Penetration Testing</a>
        <a href="exploit-research.html" data-nav="exploit-research" data-i18n="nav_exploit_research">Exploit Research</a>
        <a href="ad.html" data-nav="ad" data-i18n="nav_ad">Active Directory</a>`;

function createPostHtml(post) {
  const title = post.title.en;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - Red Team Notes</title>
  <link rel="stylesheet" href="../../style.css?v=20260521-01" />
</head>
<body data-page="post" data-post-id="${post.id}" data-asset-base="../../">
  <div class="site-layout">
    <aside class="sidebar">
      <div class="avatar" aria-hidden="true"></div>
      <h1 class="site-title" data-i18n="site_title">Red Team Notes</h1>
      <p class="intro" data-i18n="intro_1">Cybersecurity practitioner focused on offensive security.</p>
      <p class="intro" data-i18n="intro_2">Specialized in vulnerability research, exploit development, and real-world attack simulation. Experienced in web exploitation, Active Directory attacks, and red teaming methodologies.</p>
      <p class="intro" data-i18n="intro_3">This platform serves as a personal knowledge base documenting attack techniques, lab reproductions, and security insights.</p>
      <div class="tags">
        <span data-i18n="tag_web">Web Security</span><span data-i18n="tag_pentest">Penetration Testing</span><span data-i18n="tag_ad">Active Directory</span><span data-i18n="tag_redteam">Red Teaming</span><span data-i18n="tag_exploit">Exploit Development</span><span data-i18n="tag_network">Network Security</span><span data-i18n="tag_python">Python</span><span data-i18n="tag_linux">Linux</span><span data-i18n="tag_ctf">CTF</span>
      </div>
      <a class="github-link" href="https://github.com/Pariston-Hill" target="_blank" rel="noreferrer" data-i18n="github_link">GitHub / Pariston-Hill</a>
    </aside>
    <main class="main">
      <header class="top-nav">
${POST_NAV}
        <button id="lang-toggle" class="lang-toggle" type="button">中文</button>
      </header>
      <article class="post-article">
        <h2 id="post-title">Loading...</h2>
        <p id="post-meta" class="post-meta"></p>
        <div id="post-body" class="post-body"><p id="post-desc"></p><pre id="post-code-block"><code id="post-code"></code></pre></div>
      </article>
    </main>
  </div>
  <script src="../../posts-data.js?v=20260521-01"></script>
  <script src="../../script.js?v=20260521-01"></script>
</body>
</html>
`;

  const outPath = path.join(ROOT, post.href);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, "utf8");
}

function createCategoryPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exploit Research - Red Team Notes</title>
  <link rel="stylesheet" href="style.css?v=20260521-01" />
</head>
<body data-page="exploit-research">
  <div class="site-layout">
    <aside class="sidebar">
      <div class="avatar" aria-hidden="true"></div>
      <h1 class="site-title" data-i18n="site_title">Red Team Notes</h1>
      <p class="intro" data-i18n="intro_1">Cybersecurity practitioner focused on offensive security.</p>
      <p class="intro" data-i18n="intro_2">Specialized in vulnerability research, exploit development, and real-world attack simulation. Experienced in web exploitation, Active Directory attacks, and red teaming methodologies.</p>
      <p class="intro" data-i18n="intro_3">This platform serves as a personal knowledge base documenting attack techniques, lab reproductions, and security insights.</p>
      <div class="tags">
        <span data-i18n="tag_web">Web Security</span><span data-i18n="tag_pentest">Penetration Testing</span><span data-i18n="tag_ad">Active Directory</span><span data-i18n="tag_redteam">Red Teaming</span><span data-i18n="tag_exploit">Exploit Development</span><span data-i18n="tag_network">Network Security</span><span data-i18n="tag_python">Python</span><span data-i18n="tag_linux">Linux</span><span data-i18n="tag_ctf">CTF</span>
      </div>
      <a class="github-link" href="https://github.com/Pariston-Hill" target="_blank" rel="noreferrer" data-i18n="github_link">GitHub / Pariston-Hill</a>
    </aside>

    <main class="main">
      <header class="top-nav">
${ROOT_NAV}
        <button id="lang-toggle" class="lang-toggle" type="button">中文</button>
      </header>

      <section class="content-head">
        <h2 data-i18n="exploit_research_title">Exploit Research</h2>
        <p data-i18n="exploit_research_desc">White-box auditing, vulnerability discovery, and end-to-end exploit development notes.</p>
      </section>

      <section id="post-grid" class="post-grid"></section>
    </main>
  </div>

  <script src="posts-data.js?v=20260521-01"></script>
  <script src="script.js?v=20260521-01"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, "exploit-research.html"), html, "utf8");
}

function patchSiteNavigation() {
  const rootNavPattern =
    /<header class="top-nav">\s*<a href="(?:\.\.\/\.\.\/)?index\.html"[\s\S]*?<a href="(?:\.\.\/\.\.\/)?ad\.html" data-nav="ad"[^>]*>[\s\S]*?<\/a>\s*<button id="lang-toggle"/g;

  const walk = (dir, acc = []) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, acc);
      else if (entry.name.endsWith(".html")) acc.push(full);
    }
    return acc;
  };

  const htmlFiles = [
    ...["index.html", "web.html", "pentest.html", "ad.html", "post.html"].map((name) =>
      path.join(ROOT, name)
    ),
    ...walk(path.join(ROOT, "posts"))
  ];

  for (const file of htmlFiles) {
    let content = fs.readFileSync(file, "utf8");
    if (!content.includes('data-nav="ad"')) continue;
    const navBlock = file.includes(path.join("posts", path.sep))
      ? POST_NAV
      : ROOT_NAV;
    const updated = content.replace(rootNavPattern, `<header class="top-nav">\n${navBlock}\n        <button id="lang-toggle"`);
    if (updated !== content) {
      fs.writeFileSync(file, updated, "utf8");
    }
  }
}

function buildHtmlFromMarkdown(markdown, postSlug) {
  const processed = preprocessMarkdown(markdown, postSlug);
  return postProcessHtml(marked.parse(processed));
}

export function importPost({
  markdownPath,
  markdownPathEn,
  id,
  title,
  category,
  categoryLabel,
  date,
  imagesDir
}) {
  configureMarked();
  const markdownZh = fs.readFileSync(markdownPath, "utf8");
  const postSlug = id;
  const assetDir = path.join(ROOT, "assets/posts", postSlug);
  const copied = copyImages(markdownZh, imagesDir, assetDir);
  if (markdownPathEn) {
    copyImages(fs.readFileSync(markdownPathEn, "utf8"), imagesDir, assetDir);
  }

  const htmlZh = buildHtmlFromMarkdown(markdownZh, postSlug);
  const htmlEn = markdownPathEn
    ? buildHtmlFromMarkdown(fs.readFileSync(markdownPathEn, "utf8"), postSlug)
    : htmlZh;
  const descriptionZh = excerptFromMarkdown(markdownZh);
  const descriptionEn = markdownPathEn
    ? excerptFromMarkdown(fs.readFileSync(markdownPathEn, "utf8"))
    : descriptionZh;

  const post = {
    id,
    href: `posts/exploit-research/${id}.html`,
    title,
    category,
    categoryLabel,
    description: { en: descriptionEn, zh: descriptionZh },
    date,
    content: { en: descriptionEn, zh: descriptionZh },
    code: "",
    contentHtml: { en: htmlEn, zh: htmlZh }
  };

  const { file, raw, posts } = loadPostsData();
  if (posts.some((item) => item.id === id)) {
    const index = posts.findIndex((item) => item.id === id);
    posts[index] = post;
  } else {
    posts.unshift(post);
  }
  savePostsData({ file, raw, posts });
  createPostHtml(post);
  createCategoryPage();
  patchSiteNavigation();

  return { post, copiedImages: copied.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const markdownPathZh =
    process.argv[2] ||
    "z:/Github/Current_Study_Project/003_OSWE/04 - 靶机练习/001_ManageEngine - AMUserResourcesSYncServlet SQL.md";
  const markdownPathEn =
    process.argv[3] ||
    path.join(ROOT, "content/manageengine-amuserresourcesyncservlet-sql.en.md");

  const result = importPost({
    markdownPath: markdownPathZh,
    markdownPathEn: fs.existsSync(markdownPathEn) ? markdownPathEn : undefined,
    id: "manageengine-amuserresourcesyncservlet-sql",
    title: {
      en: "ManageEngine AMUserResourcesSyncServlet SQL Injection",
      zh: "ManageEngine AMUserResourcesSyncServlet SQL 注入"
    },
    category: "exploit-research",
    categoryLabel: {
      en: "Exploit Research",
      zh: "漏洞利用研究"
    },
    date: "2026-05-21",
    imagesDir: findImagesDir()
  });

  console.log(`Imported ${result.post.id}, images: ${result.copiedImages}`);
}
