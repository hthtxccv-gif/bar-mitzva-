(async () => {
  const $ = id => document.getElementById(id);
  const login = $("login"), dash = $("dash"), msg = $("msg");
  if (!isConfigured()) { login.hidden = false; $("loginError").hidden = false;
    $("loginError").textContent = "יש להגדיר את המפתח הציבורי בקובץ js/config.js"; return; }

  function show(session) {
    login.hidden = !!session; dash.hidden = !session;
    if (session) load(); else { $("orders").replaceChildren(); $("byProduct").replaceChildren(); }
  }

  async function load() {
    msg.textContent = "טוען…";
    const [pr, or] = await Promise.all([
      db.from("products").select("id,name,price").order("id"),
      db.from("orders").select("id,customer_name,class_name,created_at,products(name,price)")
        .order("created_at", { ascending: false })
    ]);
    if (pr.error || or.error) { msg.textContent = "שגיאה בטעינת הנתונים (ייתכן שאין הרשאה)."; return; }
    msg.textContent = or.data.length ? "" : "אין הזמנות עדיין.";

    const prod = o => Array.isArray(o.products) ? o.products[0] : o.products;
    const sums = new Map(pr.data.map(p => [p.id, { name: p.name, n: 0, sum: 0 }]));
    let total = 0;
    const rows = or.data.map(o => {
      const p = prod(o) || { name: "?", price: 0 };
      total += p.price;
      return [o.customer_name, o.class_name, p.name, fmtPrice(p.price),
        new Date(o.created_at).toLocaleString("he-IL")];
    });
    or.data.forEach(o => {
      const p = prod(o); if (!p) return;
      const s = [...sums.values()].find(x => x.name === p.name);
      if (s) { s.n++; s.sum += p.price; }
    });

    $("tCount").textContent = or.data.length;
    $("tSum").textContent = fmtPrice(total);
    fill($("byProduct"), [...sums.values()].map(s => [s.name, s.n, fmtPrice(s.sum)]));
    fill($("orders"), rows);
  }

  function fill(tbody, rows) {
    tbody.replaceChildren(...rows.map(r => {
      const tr = document.createElement("tr");
      r.forEach(c => tr.append(h("td", String(c))));
      return tr;
    }));
  }

  $("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const le = $("loginError"); le.hidden = true;
    const { error } = await db.auth.signInWithPassword({
      email: $("email").value.trim(), password: $("password").value });
    if (error) { le.textContent = "אימייל או סיסמה שגויים."; le.hidden = false; }
    else $("password").value = "";
  });

  $("logout").addEventListener("click", () => db.auth.signOut());
  db.auth.onAuthStateChange((_e, session) => show(session));
  const { data } = await db.auth.getSession();
  show(data.session);
})();
