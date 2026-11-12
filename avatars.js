// Cartoonpoppetjes van de collega's, getekend als SVG en gekoppeld op voornaam.
(function () {
  "use strict";

  const HAIR = { dark: "#3a2a22", brown: "#6b4428", light: "#9a6a3c", blond: "#d6ad62", ash: "#b9925a", grey: "#8c8c8c" };
  const OUTFIT = { navy: "#26355c", green: "#1aa977", grey: "#7d8597", teal: "#1b8fa6", wine: "#8f3249", black: "#232838", sand: "#c9a46b" };
  const BG = ["#00f098", "#00f0ff", "#ffd166", "#ff9fb2", "#b8a6ff", "#9be15d", "#ffb86b", "#7fd8ff"];
  const SKIN = "#f3c7a3", INK = "#13192b";

  // hair: style, kleur | beard: none/stubble/full | glasses: none/dark/metal | outfit: sweater/blazer/shirt/polo
  const PEOPLE = {
    albrecht: { hair: "quiff", hc: "dark", beard: "full", top: "sweater", oc: "grey" },
    coen: { hair: "swept", hc: "dark", beard: "full", glasses: "dark", top: "sweater", oc: "green" },
    didi: { hair: "wavy", hc: "light", top: "sweater", oc: "teal", lashes: true },
    gerwin: { hair: "spiky", hc: "ash", top: "shirt", oc: "black" },
    hannah: { hair: "long", hc: "brown", top: "sweater", oc: "sand", lashes: true },
    jacco: { hair: "curly", hc: "brown", top: "blazer", oc: "grey" },
    justin: { hair: "messy", hc: "blond", top: "shirt", oc: "teal" },
    lars: { hair: "receding", hc: "ash", beard: "stubble", top: "sweater", oc: "grey" },
    marit: { hair: "bigcurly", hc: "light", top: "sweater", oc: "wine", lashes: true },
    milan: { hair: "slicked", hc: "dark", top: "blazer", oc: "black" },
    nick: { hair: "short", hc: "ash", top: "polo", oc: "navy" },
    niek: { hair: "side", hc: "light", beard: "stubble", top: "shirt", oc: "navy" },
    nikos: { hair: "swept", hc: "light", top: "polo", oc: "green" },
    numan: { mystery: true, top: "blazer", oc: "navy" },
    sam: { hair: "side", hc: "ash", top: "blazer", oc: "navy" },
    stefan: { hair: "buzz", hc: "brown", beard: "stubble", top: "blazer", oc: "grey" },
    stephan: { hair: "slicked", hc: "light", top: "blazer", oc: "sand", laugh: true },
    steven: { hair: "short", hc: "dark", top: "blazer", oc: "black" },
    thijs: { hair: "quiff", hc: "dark", beard: "stubble", glasses: "metal", top: "blazer", oc: "black" }
  };

  const HAIR_TOP = {
    short: "M28 48Q26 22 50 21Q74 22 72 48Q70 34 62 32Q50 28 36 32Q30 36 28 48Z",
    quiff: "M28 48Q25 24 42 19Q54 9 69 20Q76 31 72 48Q70 34 60 31Q46 30 36 33Q30 38 28 48Z",
    spiky: "M28 46L30 28L36 24L38 15L44 22L48 12L53 21L59 13L62 22L68 19L70 30L72 46Q68 34 50 31Q34 33 28 46Z",
    swept: "M28 48Q24 20 52 18Q77 20 73 44Q70 30 57 29Q46 35 34 34Q30 40 28 48Z",
    side: "M28 47Q26 21 50 20Q74 21 72 47Q71 33 64 30Q52 26 41 31L39 27Q34 34 28 47Z",
    messy: "M27 50Q21 19 50 17Q79 18 74 50Q70 36 64 39Q60 30 54 36Q48 29 42 37Q36 31 32 41Q29 45 27 50Z",
    receding: "M29 45Q28 23 50 22Q72 23 71 45Q69 31 61 29Q56 33 50 30Q44 33 39 29Q31 32 29 45Z",
    slicked: "M28 46Q26 19 50 18Q74 19 72 46Q71 29 50 25Q31 28 28 46Z",
    buzz: "M29 42Q30 24 50 24Q70 24 71 42Q61 30 50 30Q39 30 29 42Z",
    long: "M28 52Q25 19 50 18Q75 19 72 52Q67 31 51 25Q50 30 48 25Q33 31 28 52Z",
    wavy: "M27 52Q24 18 50 17Q76 18 73 52Q69 33 58 27Q50 33 44 27Q31 32 27 52Z"
  };
  const HAIR_BACK = {
    long: "M26 50Q21 16 50 15Q79 16 74 50L78 92Q66 99 61 84L39 84Q34 99 22 92Z",
    wavy: "M25 50Q20 15 50 14Q80 15 75 50Q82 62 76 72Q83 82 75 92Q66 98 61 84L39 84Q34 98 25 92Q17 82 24 72Q18 62 25 50Z"
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
  function key(name) { return String(name || "").trim().split(/\s+/)[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  function curls(cx, cy, rx, ry, n, r, from, to, col) {
    let out = "";
    for (let i = 0; i <= n; i++) {
      const t = (from + (to - from) * (i / n)) * Math.PI / 180;
      out += '<circle cx="' + (cx + rx * Math.cos(t)).toFixed(1) + '" cy="' + (cy + ry * Math.sin(t)).toFixed(1) + '" r="' + r + '" fill="' + col + '"/>';
    }
    return out;
  }

  function outfit(p) {
    const c = OUTFIT[p.oc] || OUTFIT.navy;
    let s = '<path d="M14 104Q16 80 50 78Q84 80 86 104Z" fill="' + c + '"/>';
    if (p.top === "blazer") s += '<path d="M42 79L50 96L58 79Z" fill="#f4f6fb"/><path d="M42 79L47 92L40 88L36 81Z M58 79L53 92L60 88L64 81Z" fill="rgba(0,0,0,.25)"/>';
    else if (p.top === "shirt" || p.top === "polo") s += '<path d="M41 79L50 88L59 79L56 77L50 82L44 77Z" fill="' + (p.top === "polo" ? "rgba(255,255,255,.35)" : "#f4f6fb") + '"/>';
    else s += '<path d="M40 79Q50 88 60 79" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2.5"/>';
    return s;
  }

  function face(p, hc) {
    let s = "";
    const brow = p.mystery ? INK : hc;
    if (p.beard === "full") s += '<path d="M27 50Q29 82 50 84Q71 82 73 50Q71 66 62 68Q50 74 38 68Q29 66 27 50Z" fill="' + hc + '"/><path d="M39 63Q50 58 61 63Q50 66 39 63Z" fill="' + hc + '"/>';
    if (p.beard === "stubble") s += '<path d="M28 52Q30 80 50 82Q70 80 72 52Q70 66 62 68Q50 74 38 68Q30 66 28 52Z" fill="' + hc + '" opacity=".28"/>';
    s += '<path d="M38 41Q42 38 46 41M54 41Q58 38 62 41" stroke="' + brow + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    if (p.laugh) s += '<path d="M38 49Q42 45 46 49M54 49Q58 45 62 49" stroke="' + INK + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    else s += '<ellipse cx="42" cy="49" rx="2.6" ry="3.2" fill="' + INK + '"/><ellipse cx="58" cy="49" rx="2.6" ry="3.2" fill="' + INK + '"/><circle cx="43" cy="48" r=".9" fill="#fff"/><circle cx="59" cy="48" r=".9" fill="#fff"/>';
    if (p.lashes) s += '<path d="M38.5 46.5L37 45M61.5 46.5L63 45" stroke="' + INK + '" stroke-width="1.4" stroke-linecap="round"/>';
    s += '<circle cx="35" cy="58" r="3.5" fill="#ff8f8f" opacity=".35"/><circle cx="65" cy="58" r="3.5" fill="#ff8f8f" opacity=".35"/>';
    s += '<path d="M48 52Q50 56 52 54" stroke="#c98e6c" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    s += p.laugh ? '<path d="M40 60Q50 75 60 60Z" fill="#7a2b2b" stroke="' + INK + '" stroke-width="1.5"/><path d="M42 61L58 61L57 64L43 64Z" fill="#fff"/>'
      : '<path d="M41 61Q50 71 59 61Z" fill="#fff" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>';
    if (p.glasses) {
      const g = p.glasses === "metal" ? "#8a8f9c" : INK, w = p.glasses === "metal" ? 1.6 : 2.6;
      s += '<g fill="rgba(255,255,255,.18)" stroke="' + g + '" stroke-width="' + w + '"><circle cx="42" cy="49" r="7"/><circle cx="58" cy="49" r="7"/></g><path d="M49 48Q50 46 51 48M35 48L28 46M65 48L72 46" stroke="' + g + '" stroke-width="' + w + '" fill="none"/>';
    }
    return s;
  }

  function svg(name) {
    const k = key(name), p = PEOPLE[k];
    const bg = BG[hash(k) % BG.length];
    let body = "";
    if (p) {
      const hc = HAIR[p.hc] || HAIR.brown;
      if (p.hair === "bigcurly") body += curls(50, 52, 30, 34, 16, 9, 150, 390, hc) + curls(50, 70, 30, 20, 6, 9, 0, 180, hc);
      if (HAIR_BACK[p.hair]) body += '<path d="' + HAIR_BACK[p.hair] + '" fill="' + hc + '"/>';
      body += outfit(p) + '<rect x="44" y="68" width="12" height="12" fill="' + SKIN + '"/>';
      body += '<circle cx="28" cy="52" r="5" fill="' + SKIN + '"/><circle cx="72" cy="52" r="5" fill="' + SKIN + '"/><ellipse cx="50" cy="50" rx="22" ry="25" fill="' + SKIN + '"/>';
      body += face(p, hc);
      if (p.mystery) body += '<path d="M24 40Q26 16 50 15Q74 16 76 40L82 42Q80 45 72 44L28 44Q20 45 18 42Z" fill="' + INK + '"/><path d="M27 36L73 36L73 40L27 40Z" fill="#00f098"/><g fill="' + INK + '"><rect x="33" y="44" width="15" height="9" rx="4"/><rect x="52" y="44" width="15" height="9" rx="4"/><rect x="47" y="46" width="6" height="2"/></g>';
      else if (p.hair === "curly") body += curls(50, 34, 21, 13, 12, 5.5, 180, 360, hc);
      else if (p.hair === "bigcurly") body += curls(50, 33, 22, 12, 10, 6.5, 185, 355, hc);
      else if (HAIR_TOP[p.hair]) body += '<path d="' + HAIR_TOP[p.hair] + '" fill="' + hc + '"' + (p.hair === "buzz" ? ' opacity=".55"' : "") + "/>";
    } else {
      // onbekende collega: vrolijk poppetje met initialen
      const ini = String(name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
      body += outfit({ top: "sweater", oc: "navy" }) + '<ellipse cx="50" cy="50" rx="22" ry="25" fill="#fff" opacity=".85"/><text x="50" y="57" text-anchor="middle" font-size="22" font-weight="800" fill="' + INK + '" font-family="sans-serif">' + esc(ini) + "</text>";
    }
    return '<svg viewBox="0 0 100 100" aria-hidden="true" class="ava-svg"><defs><clipPath id="c-' + k + '"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#c-' + k + ')"><rect width="100" height="100" fill="' + bg + '"/>' + body + "</g></svg>";
  }

  // superheldenportretten (img/<voornaam>.jpg); onbekende namen krijgen een getekend poppetje
  const PHOTOS = ["albrecht", "coen", "didi", "gerwin", "hannah", "jacco", "justin", "lars", "marit", "milan",
    "nick", "niek", "nikos", "numan", "sam", "stefan", "stephan", "steven", "thijs"];
  const cache = {};
  window.avatar = function (name, cls) {
    const k = key(name);
    const span = document.createElement("span");
    span.className = "ava" + (cls ? " " + cls : "");
    span.title = name || "";
    if (PHOTOS.includes(k)) {
      const img = document.createElement("img");
      img.src = "img/" + k + ".jpg?v=1"; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
      img.onerror = () => { span.innerHTML = cache[k] || (cache[k] = svg(name)); };
      span.append(img);
    } else span.innerHTML = cache[k] || (cache[k] = svg(name));
    return span;
  };
})();
