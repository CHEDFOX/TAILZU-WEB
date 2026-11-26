// THE CARD the footer's links open on screen (#sheet). A link with data-sheet opens it instead of going to its page:
// "faq" shows the list in <template id="faqList">; a path (/support, /privacy …) is fetched and its <main> shown, set
// in the site's type, with a link to the full page under it. Esc, the close button or a click outside closes it, and
// focus goes back to the link. If the page cannot be read, the card says so and offers the full page.
const sheet = document.getElementById("sheet");
if (sheet) {
  const title = document.getElementById("sheetTitle"), body = document.getElementById("sheetBody"), full = document.getElementById("sheetFull");
  const cache = new Map();
  let from = null;
  const NAMES = { faq: "Questions", "/support": "Support", "/pricing": "Pricing", "/privacy": "Privacy", "/terms": "Terms" };

  async function content(key) {
    if (key === "faq") {
      const t = document.getElementById("faqList");
      return t ? t.innerHTML : "";
    }
    if (cache.has(key)) return cache.get(key);
    const r = await fetch(key, { credentials: "same-origin" });
    if (!r.ok) throw new Error(r.status);
    const doc = new DOMParser().parseFromString(await r.text(), "text/html");
    const main = doc.querySelector("main") || doc.body;
    main.querySelectorAll("script, style, link, iframe, object, embed, noscript").forEach((n) => n.remove());
    main.querySelectorAll("*").forEach((n) => { for (const a of [...n.attributes]) if (/^on/i.test(a.name) || a.name === "style") n.removeAttribute(a.name); });
    const html = main.innerHTML;
    cache.set(key, html);
    return html;
  }
  async function open(key, link) {
    from = link;
    title.textContent = NAMES[key] || link.textContent;
    full.hidden = key === "faq"; full.href = key;
    body.innerHTML = '<p class="sheet-load">Loading…</p>';
    sheet.hidden = false; void sheet.offsetWidth; sheet.classList.add("on");
    document.documentElement.style.overflow = "hidden";
    sheet.querySelector(".sheet-x").focus();
    try { body.innerHTML = await content(key); }
    catch (e) { body.innerHTML = '<p class="sheet-load">This could not be loaded just now.</p>'; full.hidden = false; }
    body.scrollTop = 0;
  }
  function close() {
    if (sheet.hidden) return;
    sheet.classList.remove("on");
    document.documentElement.style.overflow = "";
    setTimeout(() => { sheet.hidden = true; body.innerHTML = ""; }, 250);
    if (from) from.focus();
  }
  document.querySelectorAll("[data-sheet]").forEach((a) => a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;   // a new tab still opens the page itself
    e.preventDefault(); open(a.dataset.sheet, a);
  }));
  sheet.addEventListener("click", (e) => { if (e.target === sheet) close(); });
  sheet.querySelector(".sheet-x").addEventListener("click", close);
  addEventListener("keydown", (e) => {
    if (sheet.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "Tab") {   // focus stays in the card
      const f = [...sheet.querySelectorAll("button, a[href]:not([hidden]), summary, [tabindex]")].filter((n) => n.offsetParent);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
}
