const CLASSES = ["ז׳ 1", "ז׳ 2", "ז׳ 3"];
const isConfigured = () =>
  !!window.APP_CONFIG.SUPABASE_PUBLISHABLE_KEY &&
  !window.APP_CONFIG.SUPABASE_PUBLISHABLE_KEY.startsWith("PASTE_");
const db = window.supabase.createClient(
  window.APP_CONFIG.SUPABASE_URL,
  window.APP_CONFIG.SUPABASE_PUBLISHABLE_KEY || "missing"
);
const fmtPrice = n => Number(n).toLocaleString("he-IL") + " ₪";
const normalizeName = s => String(s).trim().replace(/\s+/g, " ");

function h(tag, text, cls) {
  const e = document.createElement(tag);
  if (text != null) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

function productImg(url, alt) {
  const box = h("div", null, "thumb");
  const u = (url || "").trim();
  if (!/^https:\/\//i.test(u)) { box.classList.add("empty"); return box; }
  const img = document.createElement("img");
  img.src = u; img.alt = alt; img.loading = "lazy"; img.decoding = "async";
  img.addEventListener("error", () => { img.remove(); box.classList.add("empty"); });
  box.append(img);
  return box;
}
