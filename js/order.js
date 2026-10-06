(async () => {
  const $ = id => document.getElementById(id);
  const st = $("status"), box = $("box"), err = $("error"), btn = $("submit");
  const showErr = m => { err.textContent = m; err.hidden = !m; };

  if (!isConfigured()) { st.textContent = "יש להגדיר את המפתח הציבורי בקובץ js/config.js"; return; }
  const id = Number(new URLSearchParams(location.search).get("id"));
  if (!Number.isInteger(id) || id <= 0) { st.textContent = "מוצר לא תקין."; return; }

  const { data: p, error } = await db.from("products")
    .select("id,name,price,bit_url,image_url").eq("id", id).maybeSingle();
  if (error) { st.textContent = "לא הצלחנו לטעון את המוצר. נסו לרענן."; return; }
  if (!p) { st.textContent = "המוצר לא נמצא."; return; }

  document.title = p.name;
  $("pname").before(productImg(p.image_url, p.name));
  $("pprice").textContent = fmtPrice(p.price);
  const sel = $("cls");
  sel.append(new Option("בחרו כיתה…", ""));
  CLASSES.forEach(c => sel.append(new Option(c, c)));
  st.hidden = true; box.hidden = false;

  let sending = false;
  $("form").addEventListener("submit", async e => {
    e.preventDefault();
    if (sending) return;
    showErr("");
    const name = normalizeName($("name").value);
    const cls = sel.value;
    if (name.length < 2 || name.length > 60) return showErr("נא להזין שם בין 2 ל-60 תווים.");
    if (!CLASSES.includes(cls)) return showErr("נא לבחור כיתה.");

    sending = true; btn.disabled = true; btn.textContent = "שומר…";
    // No customer_name_normalized (DB trigger sets it) and no .select() afterwards.
    const { error: insErr } = await db.from("orders")
      .insert({ product_id: p.id, customer_name: name, class_name: cls });

    if (insErr) {
      sending = false; btn.disabled = false; btn.textContent = "שמירת הזמנה";
      if (insErr.code === "23505") showErr("כבר קיימת הזמנה על שם זה. ניתן להזמין מוצר אחד בלבד.");
      else if (insErr.code === "23514") showErr("הפרטים שהוזנו אינם תקינים. בדקו את השם והכיתה.");
      else showErr("אירעה שגיאה בשמירת ההזמנה. נסו שוב בעוד רגע.");
      return;
    }

    $("form").hidden = true; $("done").hidden = false;
    const url = (p.bit_url || "").trim();
    if (/^https:\/\//i.test(url)) {
      const pay = $("pay");
      pay.href = url; pay.hidden = false;
      $("paynote").textContent = "תועברו לתשלום ב-Bit בעוד רגע. אם זה לא קורה, לחצו על הכפתור.";
      setTimeout(() => { location.href = url; }, 3000);
    } else {
      $("paynote").textContent = "קישור התשלום עדיין לא זמין. הארגון ייצור איתכם קשר.";
    }
  });
})();
