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
                return { id: o.id, cells: [o.customer_name, o.class_name, p.name, fmtPrice(p.price),
                    new Date(o.created_at).toLocaleString("he-IL")] };
            });
            or.data.forEach(o => {
                const p = prod(o); if (!p) return;
                const s = [...sums.values()].find(x => x.name === p.name);
                if (s) { s.n++; s.sum += p.price; }
            });

            $("tCount").textContent = or.data.length;
            $("tSum").textContent = fmtPrice(total);
            fill($("byProduct"), [...sums.values()].map(s => [s.name, s.n, fmtPrice(s.sum)]));
            fillOrders(rows);
        }

        function fill(tbody, rows) {
            tbody.replaceChildren(...rows.map(r => {
                const tr = document.createElement("tr");
                r.forEach(c => tr.append(h("td", String(c))));
                return tr;
            }));
        }

        function fillOrders(rows) {
            $("orders").replaceChildren(...rows.map(r => {
                const tr = document.createElement("tr");
                r.cells.forEach(c => tr.append(h("td", String(c))));
                const td = document.createElement("td");
                const box = h("div", null, "acts");
                const e = h("button", "עריכה", "btn ghost small");
                e.type = "button";
                e.addEventListener("click", () => edit(r, e));
                const b = h("button", "מחיקה", "btn danger");
                b.type = "button";
                b.addEventListener("click", () => del(r, b));
                box.append(e, b); td.append(box); tr.append(td);
                return tr;
            }));
        }
        async function edit(r, b) {
            const input = prompt("שם חדש להזמנה:", r.cells[0]);
            if (input === null) return;
            const name = normalizeName(input);
            if (name.length < 2 || name.length > 60) { msg.textContent = "השם חייב להכיל בין 2 ל-60 תווים."; return; }
            if (name === r.cells[0]) return;
            b.disabled = true;
            const { data, error } = await db.from("orders")
            .update({ customer_name: name }).eq("id", r.id).select("id");
            if (error && error.code === "23505") { b.disabled = false; msg.textContent = "כבר קיימת הזמנה על שם זה."; return; }
            if (error || !data || !data.length) { b.disabled = false; msg.textContent = "העריכה נכשלה (ייתכן שאין הרשאה)."; return; }
            load();
        }

        async function del(r, b) {
            if (!confirm("למחוק את ההזמנה של " + r.cells[0] + " (" + r.cells[2] + ")?\nלא ניתן לשחזר.")) return;
            b.disabled = true;
            const { data, error } = await db.from("orders").delete().eq("id", r.id).select("id");
            if (error || !data || !data.length) {
                b.disabled = false;
                msg.textContent = "המחיקה נכשלה (ייתכן שאין הרשאה).";
                return;
            }
            load();
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
