(function () {
  "use strict";

  // Supabase project "snackvoorspeller" — publishable key is meant to be public;
  // all access goes through database functions that check codes themselves.
  const SB_URL = "https://vhhooatojbjefcdldwpg.supabase.co";
  const SB_KEY = "sb_publishable_6sJcAMs_68N-I2ZuKlajHw_968JENzK";

  const SNACKS = ["Kroket", "Frikandel", "Kaassoufflé", "Bitterballen", "Saucijzenbroodje", "Loempia",
    "Kipcorn", "Berenklauw", "Bamischijf", "Eierbal", "Worstenbroodje", "Tosti"];
  const ERR = {
    invalid_name: "Vul een naam in van maximaal 40 tekens.",
    unknown_player: "Je naam staat niet meer in de lijst. Kies hem opnieuw of voeg jezelf toe.",
    closed: "Voorspellen is gesloten voor deze week.",
    not_authorized: "De beheerderscode klopt niet.",
    invalid_snack: "Vul een snack in van maximaal 60 tekens."
  };

const CROWN = '<svg class="crown" viewBox="0 0 24 18" aria-hidden="true"><path d="M2 15h20l1-11-6 5-5-8-5 8-6-5z" fill="currentColor"/><rect x="2" y="16" width="20" height="2" rx="1" fill="currentColor"/></svg>';
  const $ = (id) => document.getElementById(id);
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  let me = store.get("snack.player");      // {id, name}
  let adminCode = store.get("snack.admin"); // string
  let state = null;

  async function rpc(fn, args) {
    const res = await fetch(SB_URL + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SB_KEY, Authorization: "Bearer " + SB_KEY },
      body: JSON.stringify(args || {})
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const code = body && body.message ? body.message : "network";
      const e = new Error(code); e.code = code; throw e;
    }
    return body;
  }
  const msg = (e) => ERR[e && e.code] || "Er ging iets mis. Probeer het zo nog eens.";

  function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 2600); }
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function showErr(id, text) { const e = $(id); e.textContent = text || ""; e.hidden = !text; }

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z]/g, "").replace(/(en|s)$/, "");
  }
  function matches(g, a) {
    const x = norm(g), y = norm(a);
    if (!x || !y) return false;
    if (x === y) return true;
    return x.length >= 4 && y.length >= 4 && (x.includes(y) || y.includes(x));
  }

  // --- snack wall ---
  SNACKS.forEach((s, i) => {
    const b = el("button", "door"); b.type = "button"; b.id = "door" + i; b.setAttribute("aria-pressed", "false");
    b.append(el("span", "nr", String(i + 1).padStart(2, "0")), el("span", "", s));
    b.addEventListener("click", () => { $("guessInput").value = s; syncDoors(); });
    $("wall").appendChild(b);
  });
  function syncDoors() {
    const v = norm($("guessInput").value);
    SNACKS.forEach((s, i) => $("door" + i).setAttribute("aria-pressed", String(!!v && norm(s) === v)));
  }
  $("guessInput").addEventListener("input", syncDoors);


  // --- snackorakel: weighted pick on season, how long ago a snack was served, and past form ---
  const WARM = ["Kroket", "Frikandel", "Kaassoufflé", "Bitterballen", "Eierbal", "Bamischijf", "Berenklauw", "Kipcorn"];
  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function oracle() {
    const month = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", month: "numeric" }).format(new Date()));
    const cold = month >= 10 || month <= 3;
    const past = state ? state.reveals.slice().sort((a, b) => (a.week < b.week ? 1 : -1)) : [];
    const ago = (s) => { const i = past.findIndex((r) => norm(r.snack) === norm(s)); return i === -1 ? null : i + 1; };
    const served = (s) => past.filter((r) => norm(r.snack) === norm(s)).length;
    const scored = SNACKS.map((s) => {
      let w = 1, why = [];
      if (cold && WARM.includes(s)) { w *= 1.8; why.push(pickOne(["het is " + ["", "januari", "februari", "maart", "", "", "", "", "", "oktober", "november", "december"][month - 1] + " en de frituur draait overuren", "koud weer vraagt om iets uit het vet", "in dit seizoen wint warm het altijd van koud"])); }
      if (!cold && !WARM.includes(s)) { w *= 1.6; why.push(pickOne(["het is te warm voor zwaar frituurwerk", "zomerweer vraagt om iets lichts"])); }
      const a = ago(s);
      if (a === 1) { w *= 0.25; why = ["hij lag vorige week al op tafel, dus de kans is klein. Maar het orakel houdt van risico"]; }
      else if (a === null && past.length >= 3) { w *= 1.5; why.push("hij is nog nooit geweest en zit er dus aan te komen"); }
      else if (a !== null && a >= 4) { w *= 1.4; why.push("hij is al " + a + " weken niet geweest"); }
      const n = served(s); if (n >= 2) { w *= 1.2; why.push("hij is al " + n + " keer de snack geweest, de kantine weet wat werkt"); }
      if (!why.length) why.push(pickOne(["het orakel voelde het in de vingers", "een gevoel dat niet uit te leggen valt", "de sterren staan in een bitterbalvorm"]));
      return { s, w, why };
    });
    const total = scored.reduce((t, x) => t + x.w, 0); let r = Math.random() * total;
    return scored.find((x) => (r -= x.w) <= 0) || scored[0];
  }
  $("oracleBtn").addEventListener("click", () => {
    const btn = $("oracleBtn"); btn.disabled = true;
    const doors = [...document.querySelectorAll(".door")]; let i = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const done = () => {
      const pick = oracle();
      $("guessInput").value = pick.s; syncDoors();
      const out = $("oracleOut"); out.replaceChildren();
      const b = document.createElement("b"); b.textContent = pick.s;
      out.append("Het orakel heeft gesproken: ", b, ". Waarom? " + pick.why[0].charAt(0).toUpperCase() + pick.why[0].slice(1) + (pick.why[1] ? ", en " + pick.why[1] : "") + ". Klik op opslaan als je het orakel vertrouwt.");
      out.hidden = false; btn.disabled = !!(state && state.closed);
    };
    if (reduced) return done();
    const t = setInterval(() => {
      doors.forEach((d) => d.setAttribute("aria-pressed", "false"));
      const d = doors[Math.floor(Math.random() * doors.length)]; d.setAttribute("aria-pressed", "true");
      d.classList.remove("spin"); void d.offsetWidth; d.classList.add("spin");
      if (++i > 12) { clearInterval(t); done(); }
    }, 90);
  });

  // --- helpers on state ---
  const weekNo = (wk) => parseInt(String(wk).split("-W")[1], 10);
  const players = () => { const m = {}; (state ? state.players : []).forEach((p) => (m[p.id] = p.name)); return m; };
  const revealOf = (wk) => (state ? state.reveals.find((r) => r.week === wk) : null);
  const guessesOf = (wk) => (state ? state.guesses.filter((g) => g.week === wk) : []);
  function nameOf(id) { if (me && id === me.id) return "Jij"; return players()[id] || "Oud-collega"; }
  function initials(n) { return String(n).trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase(); }

  function kingsText(ids) {
    const names = ids.filter((u) => players()[u]).map(nameOf);
    if (names.length <= 1) return names[0] || "";
    return names.slice(0, -1).join(", ") + " en " + names[names.length - 1];
  }
  function crownTag(text) { const t = el("span", "tag king"); t.innerHTML = CROWN; t.append(text); return t; }

  function deadlineText() {
    if (!state) return "Laden…";
    if (revealOf(state.week)) return "Onthuld";
    if (state.closed) return "Voorspellen gesloten voor deze week";
    const wd = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", weekday: "short" }).format(new Date());
    return wd === "Fri" ? "Vandaag open tot 12:00" : "Open tot vrijdag 12:00";
  }

  function render() {
    const loggedIn = !!(state && me && state.me === me.id);
    $("joinSection").hidden = !state || loggedIn;
    $("mySection").hidden = !loggedIn;
    $("adminSection").hidden = !adminCode;
    $("adminOpen").hidden = !!adminCode;
    if (!state) return;
    fillPicker();

    const wk = state.week, rev = revealOf(wk);
    $("wkLabel").textContent = "WK " + weekNo(wk);
    $("deadline").textContent = deadlineText();
    const lastRev = state.reveals.slice().sort((a, b) => (a.week < b.week ? 1 : -1))[0];
    const kb = $("kingBar");
    if (lastRev) {
      const k = kingsText(lastRev.correct);
      kb.hidden = false;
      $("kingLbl").textContent = (lastRev.correct.length > 1 ? "Snackkoningen" : "Snackkoning") + " van week " + weekNo(lastRev.week);
      $("kingName").textContent = k || "Niemand. De kroon blijft liggen.";
    } else kb.hidden = true;

    // my guess
    if (loggedIn) {
      $("meName").textContent = me.name;
      const mine = guessesOf(wk).find((g) => g.player_id === me.id);
      const locked = state.closed;
      document.querySelectorAll(".door").forEach((d) => (d.disabled = locked));
      $("guessInput").disabled = locked; $("guessBtn").disabled = locked; $("oracleBtn").disabled = locked; if (locked) $("oracleOut").hidden = true;
      $("guessBtn").textContent = mine ? "Voorspelling wijzigen" : "Voorspelling opslaan";
      $("myStatus").textContent = rev ? "Onthuld" : locked ? "Gesloten" : "Open";
      const m = $("mine"); m.replaceChildren();
      if (mine) {
        m.append(el("span", "", "Jouw voorspelling:"), el("span", "tag oil", mine.snack));
        if (rev) { const ok = rev.correct.includes(me.id); m.append(ok ? crownTag("Jij bent snackkoning!") : el("span", "tag bad", "Helaas")); }
      } else m.append(el("span", "note", locked ? "Je hebt deze week niet voorspeld." : "Nog niets ingevuld deze week."));
      if (locked && !rev) m.append(el("span", "note", "Voorspellen is gesloten. Bekijk hieronder wat iedereen koos. Na de lunch wordt de snack onthuld."));
      const rb = $("revealBox"); rb.replaceChildren(); rb.hidden = !rev;
      if (rev) { const d = el("div", "reveal"); d.append(el("span", "lbl", "De snack van week " + weekNo(wk)), el("span", "snack", rev.snack));
        const kl = el("div", "kings"); kl.innerHTML = CROWN;
        const k = kingsText(rev.correct);
        kl.append(k ? (rev.correct.length > 1 ? "Snackkoningen: " : "Snackkoning: ") + k : "Geen snackkoning deze week");
        d.append(kl); rb.append(d); }
    }

    // admin
    if (adminCode) {
      $("revealBtn").textContent = rev ? "Onthulling aanpassen" : "Onthullen";
      $("undoReveal").hidden = !rev;
      const pl = $("playerList"); pl.replaceChildren();
      state.players.forEach((p) => {
        const li = el("li"); li.append(el("span", "who", p.name), el("span", "what", ""));
        const b = el("button", "ghost", "Verwijderen"); b.type = "button";
        b.onclick = async () => {
          if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Zeker weten?"; b.style.color = "var(--bad)"; return; }
          try { await rpc("admin_remove_player", { p_code: adminCode, p_player: p.id }); toast(p.name + " verwijderd"); await refresh(); } catch (err) { toast(msg(err)); }
        };
        li.append(b); pl.append(li);
      });
      if (rev && document.activeElement !== $("revealInput") && !$("revealInput").value) $("revealInput").value = rev.snack;
    }

    // this week
    const wg = guessesOf(wk); const ul = $("weekList"); ul.replaceChildren();
    $("countNote").textContent = wg.length + (wg.length === 1 ? " voorspelling" : " voorspellingen") + (state.closed ? "" : " · zichtbaar vanaf vrijdag 12:00");
    // tally of what people chose, once the week is closed
    const tally = $("tally"); tally.replaceChildren();
    const groups = {};
    if (state.closed) wg.forEach((g) => { if (g.snack == null) return; const k = norm(g.snack) || g.snack; (groups[k] = groups[k] || { label: g.snack, n: 0 }).n++; });
    const gl = Object.values(groups).sort((a, b) => b.n - a.n);
    tally.hidden = !gl.length;
    gl.forEach((g) => {
      const row = el("div", "bar"), track = el("div", "track"), fill = el("div", "fill");
      fill.style.width = Math.round((100 * g.n) / wg.length) + "%"; track.append(fill);
      row.append(el("span", "who", g.label), el("span", "note", g.n + "×"), track); tally.append(row);
    });
    if (!wg.length) ul.append(el("li", "empty", "Nog geen voorspellingen. Wees de eerste."));
    wg.forEach((g) => {
      const li = el("li"); const isMe = me && g.player_id === me.id;
      li.append(el("span", "dot" + (isMe ? " me" : ""), initials(players()[g.player_id] || "?")), el("span", "who", nameOf(g.player_id)),
        el("span", "what", g.snack != null ? g.snack : "verborgen tot 12:00"));
      if (rev) {
        const ok = rev.correct.includes(g.player_id);
        if (adminCode) {
          const b = el("button", "ghost", ok ? "Goed" : "Fout"); b.type = "button"; b.title = "Klik om om te zetten";
          b.style.color = ok ? "var(--good)" : "var(--bad)"; b.onclick = () => toggleCorrect(g.player_id); li.append(b);
        } else li.append(ok ? crownTag("Koning") : el("span", "tag bad", "Fout"));
      }
      ul.append(li);
    });

    // standings
    const weeks = state.reveals.map((r) => r.week).sort();
    const score = {}, played = {};
    weeks.forEach((w) => {
      guessesOf(w).forEach((g) => (played[g.player_id] = (played[g.player_id] || 0) + 1));
      revealOf(w).correct.forEach((u) => (score[u] = (score[u] || 0) + 1));
    });
    const known = players();
    const people = [...new Set([...Object.keys(played), ...Object.keys(score)])].filter((u) => known[u])
      .map((u) => ({ u, s: score[u] || 0, p: played[u] || 0 }))
      .sort((a, b) => b.s - a.s || (b.p ? b.s / b.p : 0) - (a.p ? a.s / a.p : 0) || a.p - b.p);
    $("weeksNote").textContent = weeks.length ? weeks.length + (weeks.length === 1 ? " week gespeeld" : " weken gespeeld") : "";
    const st = $("standings"); st.replaceChildren();
    if (!people.length) st.append(el("p", "empty", "Het klassement verschijnt na de eerste onthulling."));
    else {
      const t = el("table");
      t.innerHTML = '<thead><tr><th>#</th><th>Naam</th><th class="n">Kronen</th><th class="n">Gespeeld</th><th class="n">Score</th></tr></thead>';
      const tb = el("tbody"); let rank = 0, prev = null;
      people.forEach((x, i) => {
        if (x.s !== prev) { rank = i + 1; prev = x.s; }
        const lead = rank === 1 && x.s > 0, tr = el("tr", lead ? "first" : "");
        const td = (v, c) => el("td", c || "", String(v));
        tr.append(td(lead ? "1 ★" : rank, lead ? "medal" : ""), td(nameOf(x.u)), td(x.s, "n"), td(x.p, "n"),
          td(x.p ? Math.round((100 * x.s) / x.p) + "%" : "–", "n"));
        tb.append(tr);
      });
      t.append(tb); st.append(t);
    }

    // archive
    const ar = $("archive"); ar.replaceChildren();
    const past = weeks.filter((w) => w !== wk).reverse();
    if (!past.length) ar.append(el("li", "empty", "Nog geen eerdere weken."));
    past.forEach((w) => {
      const r = revealOf(w), li = el("li"), winners = r.correct.filter((u) => known[u]).map(nameOf);
      li.append(el("span", "tag", "WK " + weekNo(w)), el("span", "who", r.snack),
        el("span", "what", winners.length ? (winners.length > 1 ? "Snackkoningen: " : "Snackkoning: ") + kingsText(r.correct) : "Geen snackkoning"));
      ar.append(li);
    });
  }

  async function refresh() {
    try {
      state = await rpc("get_state", me ? { p_player: me.id } : {});
      if (me && state.me !== me.id) { me = null; store.del("snack.player"); }
      render();
    } catch (e) {
      if (!state) { $("weekList").replaceChildren(el("li", "empty", "Kan de gegevens niet laden. Controleer je verbinding.")); $("deadline").textContent = "Offline"; }
    }
  }

  // --- pick your name ---
  function fillPicker() {
    const sel = $("pickName"), cur = sel.value;
    const opts = [new Option("Kies je naam…", "")].concat((state ? state.players : []).map((p) => new Option(p.name, p.id)));
    sel.replaceChildren(...opts); sel.value = cur;
  }
  function choose(p) { me = { id: p.id, name: p.name }; store.set("snack.player", me); toast("Hoi " + p.name + "!"); }
  $("showAdd").onclick = () => { $("pickForm").hidden = true; $("addForm").hidden = false; $("addName").focus(); };
  $("showPick").onclick = () => { $("addForm").hidden = true; $("pickForm").hidden = false; };
  $("pickForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const p = state && state.players.find((x) => x.id === $("pickName").value);
    if (!p) return toast("Kies eerst je naam");
    choose(p); await refresh();
  });
  $("addForm").addEventListener("submit", async (e) => {
    e.preventDefault(); showErr("addErr");
    const name = $("addName").value.trim(); if (!name) return showErr("addErr", ERR.invalid_name);
    $("addBtn").disabled = true;
    try { choose(await rpc("add_player", { p_name: name })); $("addName").value = ""; $("addForm").hidden = true; $("pickForm").hidden = false; await refresh(); }
    catch (err) { showErr("addErr", msg(err)); }
    finally { $("addBtn").disabled = false; }
  });
  $("logoutBtn").onclick = () => { me = null; store.del("snack.player"); render(); };

  // --- guess ---
  $("guessForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = $("guessInput").value.trim(); if (!v) return toast("Kies of typ eerst een snack");
    $("guessBtn").disabled = true;
    try { await rpc("submit_guess", { p_player: me.id, p_snack: v }); $("guessInput").value = ""; syncDoors(); toast("Voorspelling opgeslagen"); await refresh(); }
    catch (err) { toast(msg(err)); await refresh(); }
    finally { $("guessBtn").disabled = !!(state && state.closed); }
  });

  // --- admin ---
  $("adminOpen").onclick = () => { $("adminLoginSection").hidden = false; $("adminCode").focus(); };
  $("adminForm").addEventListener("submit", async (e) => {
    e.preventDefault(); showErr("adminErr");
    const code = $("adminCode").value.trim();
    try {
      if (await rpc("admin_check", { p_code: code })) { adminCode = code; store.set("snack.admin", code); $("adminLoginSection").hidden = true; $("adminCode").value = ""; toast("Beheer geopend"); render(); }
      else showErr("adminErr", "Deze beheerderscode klopt niet.");
    } catch (err) { showErr("adminErr", msg(err)); }
  });
  $("adminLogout").onclick = () => { adminCode = null; store.del("snack.admin"); render(); };
  $("revealForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const v = $("revealInput").value.trim(); if (!v || !state) return;
    const wk = state.week;
    // guesses of others are hidden from the client before the reveal, so reveal first, then auto-mark
    try {
      const prev = revealOf(wk);
      await rpc("admin_reveal", { p_code: adminCode, p_week: wk, p_snack: v, p_correct: prev ? prev.correct : [] });
      await refresh();
      const correct = guessesOf(wk).filter((g) => matches(g.snack, v)).map((g) => g.player_id);
      await rpc("admin_reveal", { p_code: adminCode, p_week: wk, p_snack: v, p_correct: correct });
      await refresh(); toast("Onthuld: " + v);
    } catch (err) {
      if (err.code === "not_authorized") { adminCode = null; store.del("snack.admin"); render(); toast("Beheerderscode klopt niet meer"); }
      else toast(msg(err));
    }
  });
  async function toggleCorrect(uid) {
    const r = revealOf(state.week); if (!r) return;
    const set = new Set(r.correct); set.has(uid) ? set.delete(uid) : set.add(uid);
    try { await rpc("admin_reveal", { p_code: adminCode, p_week: r.week, p_snack: r.snack, p_correct: [...set] }); await refresh(); }
    catch (err) { toast(msg(err)); }
  }
  $("undoReveal").onclick = async () => {
    try { await rpc("admin_undo_reveal", { p_code: adminCode, p_week: state.week }); $("revealInput").value = ""; await refresh(); toast("Onthulling ingetrokken"); }
    catch (err) { toast(msg(err)); }
  };

  // --- boot ---
  render();
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 20000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
})();
