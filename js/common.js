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
