/* Euro4All Simulator — app logic. Plain JS, no build step, works offline. */
{
"use strict";
const L = window.E4A_LANGS, T = window.E4A_T, CFG = window.E4A_CONFIG || {};
const SHOPS = window.E4A_SHOPS, SCAMK = window.E4A_SCAM_KEYS, SESSION_CARDS = window.E4A_SESSION_CARDS;
const LESSON_ICONS = window.E4A_LESSON_ICONS, PLACE_CODES = window.E4A_PLACE_CODES;
const SB_URL = String(CFG.supabaseUrl || "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const SHARED = !!(SB_URL && CFG.supabaseKey);
const VIEWS = ["learn", "practice", "protect", "ambassador", "observatory"];

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem("e4a." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("e4a." + k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem("e4a." + k); } catch (e) { } }
};
const detectLang = () => { const n = (navigator.language || "el").slice(0, 2); return L.some(l => l.code === n) ? n : "el"; };

const S = { lang: store.get("lang", detectLang()), size: store.get("size", 1), voice: store.get("voice", false), view: "home", sub: {}, rows: [], srcShared: false, lastAuto: "" };
const lang = () => L.find(l => l.code === S.lang) || L[0];
const D = () => T[S.lang] || T.en;
function t(key, vars) {
  let v = T[S.lang] && T[S.lang].ui[key];
  if (v == null) v = T.en.ui[key];
  if (v == null) v = T.el.ui[key];
  if (v == null) return key;
  if (typeof v === "string" && vars) v = v.replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
  return v;
}
const fmt = c => { try { return new Intl.NumberFormat(lang().locale, { style: "currency", currency: "EUR" }).format(c / 100); } catch (e) { return (c / 100).toFixed(2).replace(".", ",") + " €"; } };
const pct = x => Math.round(x * 100) + "%";

/* ---------- icons ---------- */
const ICON = {
  book: '<path d="M4 5.5c3-1 5.5-1 8 .8 2.5-1.8 5-1.8 8-.8v13c-3-1-5.5-1-8 .8-2.5-1.8-5-1.8-8-.8z"/><path d="M12 6.3v13"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M15.5 14.5h2.5"/>',
  shield: '<path d="M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  people: '<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 20c.5-3.5 2.8-5.5 5.5-5.5S13.5 16.5 14 20M14 15c.8-.8 1.8-1.2 2.8-1.2 2.3 0 4 1.7 4.7 4.7"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8.5 16v-4M12.5 16V8M16.5 16v-6"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.6a4.5 4.5 0 1 0 0 6.8M7 10.6h6M7 13.4h6"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  signal: '<path d="M2.5 8.5a14 14 0 0 1 19 0M5.8 12a9.5 9.5 0 0 1 12.4 0M9.2 15.4a5 5 0 0 1 5.6 0"/><circle cx="12" cy="19" r="1"/><path d="M3.5 3.5l17 17"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  hands: '<path d="M3 13.5l4-4 3 1.5 3-2.5 2 1.5"/><path d="M21 13.5l-4.5-4.5M3 13.5l5.5 5.5a1.6 1.6 0 0 0 2.3 0l.7-.7M21 13.5l-5.5 5.5a1.6 1.6 0 0 1-2.3 0L9.5 15.3"/>',
  market: '<path d="M3 9.5h18l-2 10H5z"/><path d="M8 9.5l3-5.5M16 9.5l-3-5.5"/><path d="M9 13v3.5M12 13v3.5M15 13v3.5"/>',
  cafe: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5c0 1 1 1.5 1 2.5M12 3.5c0 1 1 1.5 1 2.5"/>',
  ferry: '<path d="M3 15h18l-2.5 4h-13z"/><path d="M6 15v-4h12v4M9 11V7.5h5V11"/><path d="M2.5 21.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/>',
  pharmacy: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
  give: '<path d="M7 17L17 7M9 7h8v8"/>',
  get: '<path d="M17 7L7 17M15 17H7V9"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  next: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  camera: '<path d="M3.5 8h3.5l1.5-2.5h7L17 8h3.5v11h-17z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17.5l5-4.5 4 3.5 3-2.5 4.5 3.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  alert: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9S14.6 18.4 12 21M12 3C9.4 5.6 8.2 8.6 8.2 12s1.2 6.4 3.8 9"/>',
  plane: '<path d="M21 15.5l-8.5-4.5V5a1.5 1.5 0 0 0-3 0v6L3 15.5v2l6.5-2v3.5L7.5 20.5v1.5L11 21l3.5 1v-1.5L12.5 19v-3.5l8.5 2z"/>',
  msg: '<path d="M4 5h16v11H9l-5 4z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
  call: '<path d="M6.5 3.5h3l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
  paper: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 14.5h7M9 18h4"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4.5H15"/>',
  home: '<path d="M3.5 11.5L12 4l8.5 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/>',
  mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1.9-1.1 1.8v.4"/><path d="M12 16.8v.4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'
};
const icon = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ""}</svg>`;
const CH_ICON = { sms: "msg", chat: "msg", call: "call", email: "mail", notice: "paper", letter: "paper", app: "bell" };

const STAR = '<symbol id="e4a-star" viewBox="-5 -5 10 10"><polygon points="0,-4.8 1.1,-1.5 4.6,-1.5 1.8,0.6 2.8,3.9 0,1.9 -2.8,3.9 -1.8,0.6 -4.6,-1.5 -1.1,-1.5"/></symbol>';
const ring = (cx, cy, r, s, fill) => Array.from({ length: 12 }, (_, i) => {
  const a = i * Math.PI / 6;
  return `<use href="#e4a-star" x="${(cx + r * Math.sin(a) - s / 2).toFixed(1)}" y="${(cy - r * Math.cos(a) - s / 2).toFixed(1)}" width="${s}" height="${s}" fill="${fill}"/>`;
}).join("");
const logo = () => `<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><defs>${STAR}</defs><circle cx="20" cy="20" r="19" fill="#0b3f86"/>${ring(20, 20, 13, 5, "#ffcc00")}<text x="20" y="25.5" text-anchor="middle" font-size="15" font-weight="800" fill="#fff" font-family="Manrope,system-ui,sans-serif">€</text></svg>`;

function heroArt() {
  const houses = [[96, 118, 16, 14], [114, 112, 14, 20], [130, 120, 18, 12], [150, 116, 13, 16], [70, 128, 15, 12], [166, 126, 15, 12], [186, 132, 14, 10]];
  return `<div class="hero-pic"><svg class="hero-art" viewBox="0 0 400 250" role="img" aria-label="Euro4All">
  <defs>${STAR}<linearGradient id="e4a-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f86e0"/><stop offset="1" stop-color="#0b3f86"/></linearGradient>
  <linearGradient id="e4a-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f93e2"/><stop offset="1" stop-color="#cfe6ff"/></linearGradient></defs>
  <rect width="400" height="250" fill="url(#e4a-sky)"/>
  <circle cx="58" cy="54" r="24" fill="#ffcc00"/><circle cx="58" cy="54" r="36" fill="#fff3b0" opacity=".45"/>
  <path d="M0 176C34 130 82 112 122 124c30-22 74-20 108 26l20 26z" fill="#efe4cc"/>
  <path d="M0 176C40 146 86 136 124 146c34-18 74-12 104 22l22 8z" fill="#dccaa5"/>
  ${houses.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/><rect x="${x + w / 2 - 2}" y="${y + h - 6}" width="4" height="6" fill="#1f64c0"/>`).join("")}
  <path d="M140 116a9 9 0 0 1 18 0z" fill="#1f64c0"/><rect x="140" y="116" width="18" height="16" fill="#fff"/><path d="M149 102v5M147 104.5h4" stroke="#fff" stroke-width="1.5"/>
  <rect y="174" width="400" height="76" fill="url(#e4a-sea)"/>
  <g fill="none" stroke="#bfe0ff" stroke-width="2" stroke-linecap="round" opacity=".55">
    <path d="M14 196q10-6 20 0t20 0M84 214q10-6 20 0t20 0M30 234q10-6 20 0t20 0M150 228q10-6 20 0t20 0M200 204q10-6 20 0t20 0"/></g>
  <g transform="translate(150 150)"><path d="M0 22h86l-10 14H8z" fill="#fff"/><path d="M4 28h78" stroke="#1f64c0" stroke-width="3"/><rect x="16" y="10" width="52" height="12" fill="#fff"/><rect x="28" y="2" width="24" height="9" fill="#fff"/><rect x="44" y="-6" width="6" height="9" fill="#ffcc00"/>
    <g fill="#1f64c0">${[20, 30, 40, 50, 60].map(x => `<rect x="${x}" y="13" width="5" height="4"/>`).join("")}</g></g>
  <g transform="translate(262 22) rotate(6)">
    <rect width="110" height="200" rx="20" fill="#08224c"/><rect x="9" y="12" width="92" height="176" rx="12" fill="#fff"/>
    ${ring(55, 76, 30, 8, "#ffcc00")}
    <text x="55" y="90" text-anchor="middle" font-size="40" font-weight="800" fill="#0b3f86" font-family="Manrope,system-ui,sans-serif">€</text>
    <rect x="24" y="128" width="62" height="22" rx="11" fill="#0b3f86"/><path d="M45 139l5 5 10-10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="30" y="160" width="50" height="6" rx="3" fill="#d8e3f3"/></g>
</svg></div>`;
}

/* ---------- small UI helpers ---------- */
function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.classList.add("on");
  clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("on"), 6500);
}
function dialog(msg, onYes) {
  const d = $("#dialog");
  d.innerHTML = `<div class="dlg" role="alertdialog" aria-modal="true"><p>${esc(msg)}</p><div class="row"><button class="btn ghost" data-act="dlg-no">${t("no")}</button><button class="btn danger" data-act="dlg-yes">${t("yes")}</button></div></div>`;
  d.hidden = false; dialog.yes = onYes; $(".btn.ghost", d).focus();
}
const sayBtn = id => `<button class="btn ghost say" data-act="say" data-target="${id}">${icon("speaker")}<span>${t("listen")}</span></button>`;
function speak(text, quiet) {
  const ss = window.speechSynthesis;
  if (!ss || !window.SpeechSynthesisUtterance) { if (!quiet) toast(t("noVoice")); return; }
  try {
    ss.cancel();
    const u = new SpeechSynthesisUtterance(text), code = lang().tts.toLowerCase(), pre = code.slice(0, 2);
    u.lang = lang().tts; u.rate = 0.85;
    const vs = ss.getVoices() || [];
    const v = vs.find(v => (v.lang || "").toLowerCase() === code) || vs.find(v => (v.lang || "").toLowerCase().startsWith(pre));
    if (v) u.voice = v; else if (vs.length && !quiet) toast(t("noVoice"));
    ss.speak(u);
  } catch (e) { if (!quiet) toast(t("noVoice")); }
}
function speakAuto() {
  if (!S.voice) return;
  const txt = [...document.querySelectorAll("#main [data-auto]")].map(e => e.textContent.trim()).filter(Boolean).join(". ");
  if (txt && txt !== S.lastAuto) { S.lastAuto = txt; speak(txt, true); }
}
const buzz = ok => { try { navigator.vibrate && navigator.vibrate(ok ? 60 : [90, 60, 90]); } catch (e) { } };
const helpBlock = k => `<div class="help"><button class="help-btn" data-act="help" aria-expanded="false">${icon("help")}<span>${t("helpBtn")}</span></button><p class="help-text" id="help-text" hidden>${t(k)}</p></div>`;
const stopSpeak = () => { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { } };
function face(v) {
  const y = [11, 13, 15, 17, 19][v - 1];
  return `<svg class="face" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="8.6" cy="9.6" r="1.25" class="eye"/><circle cx="15.4" cy="9.6" r="1.25" class="eye"/><path d="M7.5 15Q12 ${y} 16.5 15"/></svg>`;
}
function qrSVG(text) {
  try { const q = window.qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
  catch (e) { return `<p class="note">QR error</p>`; }
}

/* ---------- wallet + signed offline tokens ---------- */
const W = {
  get() { return store.get("wallet", null) || { bal: 10000, tx: [], seen: [] }; },
  save(w) { w.tx = w.tx.slice(0, 30); w.seen = w.seen.slice(-500); store.set("wallet", w); }
};
const te = new TextEncoder(), td = new TextDecoder();
const b64u = {
  enc(buf) { let s = ""; new Uint8Array(buf).forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); },
  dec(str) { str = str.replace(/-/g, "+").replace(/_/g, "/"); while (str.length % 4) str += "="; const s = atob(str), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
};
const subtle = () => (window.crypto && window.crypto.subtle) || null;
async function myKeys() {
  const cs = subtle(); if (!cs) return null;
  const saved = store.get("keys", null), alg = { name: "ECDSA", namedCurve: "P-256" };
  if (saved) { try { return { priv: await cs.importKey("jwk", saved.priv, alg, false, ["sign"]), pubRaw: saved.pubRaw }; } catch (e) { } }
  const kp = await cs.generateKey(alg, true, ["sign", "verify"]);
  const priv = await cs.exportKey("jwk", kp.privateKey), pubRaw = b64u.enc(await cs.exportKey("raw", kp.publicKey));
  store.set("keys", { priv, pubRaw });
  return { priv: kp.privateKey, pubRaw };
}
async function makeToken(amount) {
  const n = b64u.enc(crypto.getRandomValues(new Uint8Array(9)));
  const body = b64u.enc(te.encode(JSON.stringify({ a: amount, n, t: Math.floor(Date.now() / 1000) })));
  const k = await myKeys().catch(() => null);
  if (!k) return { token: `E4A1.${body}.-.-`, n };
  const sig = await subtle().sign({ name: "ECDSA", hash: "SHA-256" }, k.priv, te.encode(body + "." + k.pubRaw));
  return { token: `E4A1.${body}.${k.pubRaw}.${b64u.enc(sig)}`, n };
}
async function readToken(str) {
  const p = String(str).trim().split(".");
  if (p.length !== 4 || p[0] !== "E4A1") throw new Error("invalid");
  let d; try { d = JSON.parse(td.decode(b64u.dec(p[1]))); } catch (e) { throw new Error("invalid"); }
  if (!Number.isInteger(d.a) || d.a <= 0 || d.a > 100000 || typeof d.n !== "string") throw new Error("invalid");
  let signed = false;
  if (p[2] !== "-") {
    const cs = subtle();
    if (cs) {
      let ok = false;
      try {
        const pub = await cs.importKey("raw", b64u.dec(p[2]), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
        ok = await cs.verify({ name: "ECDSA", hash: "SHA-256" }, pub, b64u.dec(p[3]), te.encode(p[1] + "." + p[2]));
      } catch (e) { ok = false; }
      if (!ok) throw new Error("invalid");
      signed = true;
    }
  }
  return Object.assign({ signed }, d);
}
async function acceptToken(str) {
  const sub = S.sub; sub.step = "checking"; render();
  try {
    const d = await readToken(str), w = W.get();
    await new Promise(r => setTimeout(r, 700));
    if (w.seen.includes(d.n)) { sub.step = "result"; sub.res = { ok: false, msg: t("alreadyUsed") }; }
    else {
      w.seen.push(d.n); w.bal += d.a; w.tx.unshift({ kind: "in", amt: d.a, ts: Date.now() }); W.save(w);
      sub.step = "result"; sub.res = { ok: true, msg: t("received", { amt: fmt(d.a) }), sub: d.signed ? t("signedOk") : "" };
    }
  } catch (e) { sub.step = "result"; sub.res = { ok: false, msg: t("invalidCode") }; }
  buzz(sub.res.ok);
  if (S.sub === sub) render();
}

/* ---------- QR scanning: live camera or photo ---------- */
let cam = null;
function stopCamera() { if (cam) { cam.getTracks().forEach(x => x.stop()); cam = null; } }
async function startCamera() {
  const video = $("#cam");
  if (!video || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast(t("noCamera")); return; }
  try { cam = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }); }
  catch (e) { cam = null; toast(t("noCamera")); return; }
  video.srcObject = cam; video.hidden = false; video.setAttribute("playsinline", ""); video.muted = true;
  try { await video.play(); } catch (e) { }
  $("#cam-msg") && ($("#cam-msg").textContent = t("scanning"));
  const c = document.createElement("canvas"), ctx = c.getContext("2d", { willReadFrequently: true });
  const tick = () => {
    if (!cam || !document.body.contains(video)) { stopCamera(); return; }
    if (video.readyState >= 2 && video.videoWidth) {
      const sc = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
      c.width = video.videoWidth * sc | 0; c.height = video.videoHeight * sc | 0;
      ctx.drawImage(video, 0, 0, c.width, c.height);
      const img = ctx.getImageData(0, 0, c.width, c.height);
      const code = window.jsQR && window.jsQR(img.data, c.width, c.height, { inversionAttempts: "dontInvert" });
      if (code && code.data) { stopCamera(); onScanned(code.data); return; }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
async function scanFile(file) {
  try {
    const url = URL.createObjectURL(file), img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const sc = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas"); c.width = img.naturalWidth * sc | 0; c.height = img.naturalHeight * sc | 0;
    const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    const code = window.jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height, { inversionAttempts: "attemptBoth" });
    if (code && code.data) onScanned(code.data); else toast(t("noCode"));
  } catch (e) { toast(t("noCode")); }
}
function onScanned(data) {
  const m = /#(join-[A-Z]{3}-\d{4}-\d)$/.exec(data);
  if (m) { location.hash = m[1]; return; }
  acceptToken(data);
}

/* ---------- observatory data (local first, optional shared Supabase table) ---------- */
const rowKey = r => r.pid + "|" + r.phase;
const sbHeaders = () => {
  const h = { apikey: CFG.supabaseKey, "Content-Type": "application/json" };
  if (!/^sb_/.test(CFG.supabaseKey)) h.Authorization = "Bearer " + CFG.supabaseKey;   // legacy anon JWT keys only
  return h;
};
async function postRows(rows) {
  const r = await fetch(`${SB_URL}/rest/v1/${CFG.table}`, {
    method: "POST", headers: Object.assign(sbHeaders(), { Prefer: "return=minimal,resolution=ignore-duplicates" }), body: JSON.stringify(rows)
  });
  if (!r.ok) throw new Error("post " + r.status);
}
async function flushOutbox() {
  if (!SHARED) return;
  const box = store.get("outbox", []); if (!box.length) return;
  try { await postRows(box); store.set("outbox", []); } catch (e) { }
}
async function saveRow(row) {
  const rows = store.get("rows", []); rows.push(row); store.set("rows", rows);
  if (SHARED) { const box = store.get("outbox", []); box.push(row); store.set("outbox", box); await flushOutbox(); }
}
async function loadRows() {
  let rows = store.get("rows", []); S.srcShared = false;
  if (SHARED) {
    await flushOutbox();
    try {
      const r = await fetch(`${SB_URL}/rest/v1/${CFG.table}?select=*&order=ts.desc&limit=5000`, { headers: sbHeaders() });
      if (r.ok) {
        const remote = await r.json(), seen = new Set(remote.map(rowKey));
        rows = remote.concat(rows.filter(x => !seen.has(rowKey(x)))); S.srcShared = true;
      }
    } catch (e) { }
  }
  S.rows = rows; return rows;
}
function aggregate(rows, session) {
  const by = {};
  rows.filter(r => !session || r.session === session).forEach(r => { (by[r.pid] = by[r.pid] || {})[r.phase] = r; });
  const people = Object.values(by).filter(p => p.pre), done = people.filter(p => p.post);
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const base = done.length ? done : people;
  const qs = [1, 2, 3].map(k => ({ pre: avg(base.map(p => +p.pre["q" + k] || 0)), post: avg(done.map(p => +p.post["q" + k] || 0)) }));
  const sumPre = qs.reduce((s, q) => s + q.pre, 0), sumPost = qs.reduce((s, q) => s + q.post, 0);
  const scamC = done.reduce((s, p) => s + (+p.post.scam_c || 0), 0), scamT = done.reduce((s, p) => s + (+p.post.scam_t || 0), 0);
  const count = f => { const c = {}; people.forEach(p => { const v = f(p.pre); if (v != null && v !== "") c[v] = (c[v] || 0) + 1; }); return c; };
  return {
    n: people.length, done: done.length, qs, gain: done.length && sumPre ? (sumPost - sumPre) / sumPre : null, scam: scamT ? scamC / scamT : null,
    age: count(r => r.age), gender: count(r => r.gender), lang: count(r => r.lang), place: count(r => r.place),
    sample: people.some(p => p.pre.sample)
  };
}
function sampleRows() {
  const rnd = (a, b) => a + Math.random() * (b - a), cl = v => Math.max(1, Math.min(5, Math.round(v))), out = [], now = Date.now();
  const sessions = [["LES-1001", 0, 0, ["el"], [2, 3, 3, 2]], ["CHI-2002", 1, 1, ["el"], [1, 2, 2, 3]], ["SAM-3003", 2, 2, ["ar", "fa", "uk", "en"], [0, 0, 1, 1]]];
  sessions.forEach(([code, venue, place, langs, ages], si) => {
    for (let i = 0; i < 13 + si; i++) {
      const pid = "demo" + si + "_" + i, ln = langs[i % langs.length], age = ages[i % ages.length], gender = i % 5 === 4 ? 3 : (i % 2);
      const pre = [cl(rnd(1, 3.2)), cl(rnd(1, 2.6)), cl(rnd(1.2, 3.2))];
      const common = { pid, session: code, lang: ln, venue, place, age, gender, sample: true };
      out.push(Object.assign({ phase: "pre", q1: pre[0], q2: pre[1], q3: pre[2], scam_c: null, scam_t: null, ts: now - (40 - i) * 6e4 }, common));
      if (i % 7 !== 6) {
        const c = Math.random() < .7 ? 4 : 3;
        out.push(Object.assign({ phase: "post", q1: cl(pre[0] + rnd(.6, 2)), q2: cl(pre[1] + rnd(1, 2.4)), q3: cl(pre[2] + rnd(.5, 2)), scam_c: c, scam_t: 4, ts: now - (30 - i) * 6e4 }, common));
      }
    }
  });
  return out;
}

/* ---------- views ---------- */
function header() {
  const l = lang(), top = S.view === "home" || S.view === "setup";
  const size = `<button class="hbtn" data-act="size" aria-label="${t("textSize")}"><span class="aa">A<small>A</small></span></button>`;
  const voice = `<button class="hbtn voice ${S.voice ? "on" : ""}" data-act="voice" aria-pressed="${S.voice}">${icon(S.voice ? "speaker" : "mute")}<span>${t("voiceShort")}</span></button>`;
  const left = top ? `<a class="brand" href="#home" aria-label="Euro4All">${logo()}<b>Euro4All</b></a>`
    : `<div class="bar-tools"><button class="hbtn" data-act="back">${icon("back", "flip")}<span>${t("back")}</span></button><a class="hbtn" href="#home">${icon("home")}<span class="opt">${t("home")}</span></a></div>`;
  const langBtn = top ? `<button class="hbtn" data-act="langs" aria-expanded="false">${icon("globe")}<span class="opt">${l.name}</span></button>` : "";
  return `<div class="bar">${left}<div class="bar-tools">${size}${voice}${langBtn}</div></div>
    <div class="langs" id="langs" hidden>${L.map(x => `<button class="chip ${x.code === S.lang ? "on" : ""}" data-act="lang" data-v="${x.code}" lang="${x.code}" dir="${x.dir}">${x.name}</button>`).join("")}</div>
    ${l.draft ? `<p class="draft">${t("draftNote")}</p>` : ""}`;
}

function vHome() {
  const done = store.get("lessons", []).length, w = W.get(), best = store.get("scamBest", null);
  const row = (go, n, ic, k, prog) => `<a class="step-row" href="#${go}"><span class="step-n">${n}</span>${icon(ic)}<span class="step-t"><b data-auto>${t(k)}</b><small>${t(k + "Sub")}</small>${prog ? `<em>${prog}</em>` : ""}</span>${icon("next", "flip")}</a>`;
  return `<section class="hero band">
      <div class="hero-txt"><h1>Euro4All</h1><p class="lead">${t("tagline")}</p></div>${heroArt()}</section>
    ${helpBlock("helpHome")}
    <h2 class="ask" data-auto>${t("whatToDo")}</h2>
    <nav class="step-list">
      ${row("learn", 1, "book", "learn", t("lessonsDone", { n: done, t: D().lessons.length }))}
      ${row("practice", 2, "wallet", "practice", t("balanceNow", { amt: fmt(w.bal) }))}
      ${row("protect", 3, "shield", "protect", best != null ? t("bestScore", { c: best, t: SCAMK.length }) : "")}
    </nav>
    <button class="wide-link" data-act="setup-open">${icon("settings")}<span><b>${t("settings")}</b> · ${t("settingsSub")}</span>${icon("next", "flip")}</button>
    <h2 class="small-h">${t("forTrainers")}</h2>
    <div class="trainer-links">
      <a class="wide-link" href="#ambassador">${icon("people")}<span><b>${t("ambassador")}</b> · ${t("ambassadorSub")}</span>${icon("next", "flip")}</a>
      <a class="wide-link" href="#observatory">${icon("chart")}<span><b>${t("observatory")}</b> · ${t("observatorySub")}</span>${icon("next", "flip")}</a>
    </div>`;
}

/* First-run welcome: language, text size, voice */
function vSetup() {
  const st = S.sub.st || 0;
  if (st === 0) return `<h1 class="title" data-auto>${t("welcome")}</h1><p class="big" data-auto>${t("chooseLang")}</p>
    <div class="biglist">${L.map(x => `<button class="bigchoice ${x.code === S.lang ? "on" : ""}" data-act="setup-lang" data-v="${x.code}" lang="${x.code}" dir="${x.dir}">${x.name}</button>`).join("")}</div>`;
  if (st === 1) return `<h1 class="title" data-auto>${t("chooseSize")}</h1>
    <div class="biglist">${[0, 1, 2].map(i => `<button class="bigchoice ${S.size === i ? "on" : ""}" data-act="setup-size" data-v="${i}"><span class="sample s${i}">${t("sizeSample")}</span><small>${t("sizes")[i]}</small></button>`).join("")}</div>
    <button class="btn big full" data-act="setup-next">${t("continue")}${icon("next", "flip")}</button>`;
  return `<h1 class="title" data-auto>${t("voiceQ")}</h1><p class="big">${t("voiceExplain")}</p>
    <div class="biglist"><button class="bigchoice ${S.voice ? "on" : ""}" data-act="setup-voice" data-v="1">${icon("speaker")} ${t("voiceYes")}</button>
    <button class="bigchoice ${S.voice ? "" : "on"}" data-act="setup-voice" data-v="0">${icon("mute")} ${t("voiceNo")}</button></div>`;
}

/* Learn */
function vLearn() {
  const d = D(), done = store.get("lessons", []), sub = S.sub;
  if (sub.done) {
    const more = sub.i < d.lessons.length - 1, all = done.length >= d.lessons.length;
    return `<section class="result ok">${icon("check", "res-ic")}<h1 class="title" data-auto>${t("lessonDone")}</h1>
      ${all ? `<p class="big" data-auto>${t("allDone")}</p>` : ""}
      <div class="col">${more ? `<button class="btn big full" data-act="lesson" data-i="${sub.i + 1}">${t("nextLesson")}${icon("next", "flip")}</button>` : ""}
      ${all ? `<a class="btn big full alt" href="#practice">${icon("wallet")}${t("goPractice")}</a>` : ""}
      <button class="btn ghost full" data-act="lesson-list">${t("allLessons")}</button></div></section>`;
  }
  if (sub.i == null) {
    return `${helpBlock("helpLearn")}<h1 class="title" data-auto>${t("learn")}</h1><p class="lead2">${t("learnSub")}</p>
    <ol class="lessons">${d.lessons.map((ls, i) => `<li><button class="lesson-row" data-act="lesson" data-i="${i}">
      <span class="num">${done.includes(i) ? icon("check") : i + 1}</span>${icon(LESSON_ICONS[i])}<b>${esc(ls.title)}</b>${icon("next", "flip")}</button></li>`).join("")}</ol>`;
  }
  const ls = d.lessons[sub.i], s = sub.s || 0, last = s === ls.slides.length - 1;
  return `${helpBlock("helpLesson")}<p class="kicker">${t("lessonOf", { n: sub.i + 1, t: d.lessons.length })} · ${s + 1}/${ls.slides.length}</p>
    <article class="slide">
      <div class="slide-ic">${icon(LESSON_ICONS[sub.i])}</div>
      <h1 class="title" ${s === 0 ? "data-auto" : ""}>${esc(ls.title)}</h1>
      <p class="big" id="slide-text" data-auto>${esc(ls.slides[s])}</p>
      <div class="dots">${ls.slides.map((_, k) => `<i class="${k === s ? "on" : ""}"></i>`).join("")}</div>
    </article>
    <div class="row">${s > 0 ? `<button class="btn ghost" data-act="slide" data-d="-1">${icon("back", "flip")}${t("prev")}</button>` : ""}
      ${sayBtn("slide-text")}
      <button class="btn" data-act="slide" data-d="1">${last ? t("done") : t("next")}${icon(last ? "check" : "next", last ? "" : "flip")}</button></div>`;
}

/* Practise: wallet, shops, offline person-to-person */
function txList(w) {
  if (!w.tx.length) return `<p class="note">${t("historyEmpty")}</p>`;
  const d = D(), lab = x => x.shop && d.shops[x.shop] ? d.shops[x.shop].name : x.kind === "sent" ? t("sentTo") : x.kind === "in" ? t("receivedFrom") : x.kind === "refund" ? t("refund") : (x.label || "");
  return `<ul class="tx">${w.tx.slice(0, 8).map(x => { const plus = x.kind === "in" || x.kind === "refund";
    return `<li><span>${esc(lab(x))}</span><b class="${plus ? "pos" : "neg"}"><bdi dir="ltr">${plus ? "+" : "−"}${fmt(x.amt)}</bdi></b></li>`; }).join("")}</ul>`;
}
function vPractice() {
  const sub = S.sub, w = W.get(), d = D(), offline = store.get("offline", false);
  if (sub.mode === "shop") return vShop(sub, w, d);
  if (sub.mode === "send") return vSend(sub, w);
  if (sub.mode === "recv") return vRecv(sub);
  if (sub.mode === "demo") return vDemo(sub);
  return `${helpBlock("helpPractice")}<section class="wallet band">
      <div class="w-top"><span>${t("walletTitle")}</span>
        <button class="net ${offline ? "off" : ""}" data-act="net">${icon(offline ? "plane" : "signal", offline ? "" : "on-sig")}${offline ? t("offline") : t("online")}</button></div>
      <p class="bal"><small>${t("balance")}</small><b>${fmt(w.bal)}</b><small>${t("playMoney")}</small></p>
      ${offline ? `<p class="w-hint">${t("offlineHint")}</p>` : ""}</section>
    <h2>${t("shopsTitle")}</h2>
    <div class="shops">${SHOPS.map(s => `<button class="shop" data-act="shop" data-id="${s.id}">${icon(s.icon)}<span><b>${esc(d.shops[s.id].name)}</b><small>${esc(d.shops[s.id].item)}</small></span><em>${fmt(s.price)}</em></button>`).join("")}</div>
    <h2>${t("p2pTitle")}</h2><p class="lead2">${t("p2pSub")}</p>
    <div class="row two"><button class="btn big" data-act="send">${icon("give")}${t("send")}</button><button class="btn big alt" data-act="recv">${icon("get")}${t("receive")}</button></div>
    <button class="wide-link" data-act="demo">${icon("play")}<span><b>${t("demoTitle")}</b> · ${t("demoSub", { amt: fmt(500) })}</span>${icon("next", "flip")}</button>
    <details class="how"><summary>${t("howItWorks")}</summary><p>${t("howText")}</p></details>
    <h2>${t("historyTitle")}</h2>${txList(w)}
    <button class="btn ghost small" data-act="wallet-reset">${icon("refresh")}${t("resetWallet")}</button>`;
}
function vShop(sub, w, d) {
  const s = SHOPS.find(x => x.id === sub.id), nm = d.shops[s.id], shown = s.shown || s.price;
  if (sub.step === "result") {
    const r = sub.res;
    return `<section class="result ${r.ok ? "ok" : "warn"}">${icon(r.ok ? "check" : "alert", "res-ic")}
      <h1 class="title" id="res-text" data-auto>${esc(r.msg)}</h1>${r.note ? `<p class="lead2">${esc(r.note)}</p>` : ""}
      ${r.receipt ? `<dl class="receipt"><dt>${t("paidTo")}</dt><dd>${esc(nm.name)}</dd><dt>${t("item")}</dt><dd>${esc(nm.item)}</dd><dt>${t("balance")}</dt><dd>${fmt(w.bal)}</dd></dl>` : ""}
      <div class="row">${sayBtn("res-text")}<button class="btn big" data-act="pr-home">${t("ok")}</button></div></section>`;
  }
  const till = `<div class="till"><div class="till-head">${icon(s.icon)}<b>${esc(nm.name)}</b></div>
      <p class="menu-line"><span>${esc(nm.item)}</span><span>${t("menuPrice")}: <b>${fmt(s.price)}</b></span></p>
      <div class="lcd"><small>${t("amountToPay")}</small><b>${fmt(shown)}</b></div></div>`;
  if (sub.step === "hold") return `${till}<div class="tap-anim">${icon("phone")}<span></span></div><p class="big center">${t("holding")}</p>`;
  if (sub.step === "confirm") {
    return `${till}<section class="confirm"><h1 class="title" id="cq" data-auto>${t("confirmQ", { amt: fmt(shown), shop: esc(nm.name) })}</h1>
      <p class="lead2">${t("checkAmount")}</p>
      <div class="row two"><button class="btn ghost big" data-act="shop-cancel">${icon("x")}${t("cancel")}</button><button class="btn big" data-act="shop-pay">${icon("check")}${t("confirm")}</button></div>${sayBtn("cq")}</section>`;
  }
  return `${helpBlock("helpShop")}${till}<p class="big center" data-auto>${t("checkAmount")}</p>
    <button class="btn big full" data-act="shop-tap">${icon("phone")}${t("tapToPay")}</button>
    <button class="btn ghost full" data-act="shop-cancel">${t("cancel")}</button>`;
}
function vSend(sub, w) {
  if (sub.step === "code") {
    return `<h1 class="title">${fmt(sub.amt)}</h1><div class="qr-box" id="qr">${qrSVG(sub.token)}</div>
      <p class="big" id="show-code" data-auto>${t("showCode")}</p>
      <div class="row">${sayBtn("show-code")}<button class="btn" data-act="pr-home">${t("done")}</button></div>
      <details class="how"><summary>${t("howItWorks")}</summary><p>${t("howText")}</p><textarea class="code-ta" readonly rows="3">${esc(sub.token)}</textarea></details>`;
  }
  const amt = sub.amt || 0;
  return `${helpBlock("helpSend")}<h1 class="title" data-auto>${t("sendTitle")}</h1>
    <p class="amount-display" aria-live="polite">${fmt(amt)}</p><p class="note center">${t("balance")}: ${fmt(w.bal)}</p>
    <div class="chips">${[100, 200, 500, 1000, 2000].map(v => `<button class="chip" data-act="amt" data-v="${v}">${fmt(v)}</button>`).join("")}</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button data-act="key" data-v="${k}">${k}</button>`).join("")}
      <button data-act="key" data-v="C" aria-label="C">C</button><button data-act="key" data-v="0">0</button><button data-act="key" data-v="B" aria-label="⌫">${icon("back")}</button></div>
    <button class="btn big full" data-act="send-make" ${amt > 0 ? "" : "disabled"}>${icon("give")}${t("makeCode")}</button>`;
}
function vRecv(sub) {
  if (sub.step === "checking") return `<div class="spinner"></div><p class="big center">${t("checking")}</p>`;
  if (sub.step === "result") {
    const r = sub.res;
    return `<section class="result ${r.ok ? "ok" : "warn"}">${icon(r.ok ? "check" : "alert", "res-ic")}
      <h1 class="title" id="res-text" data-auto>${esc(r.msg)}</h1>${r.sub ? `<p class="lead2">${icon("lock")} ${esc(r.sub)}</p>` : ""}
      <div class="row">${sayBtn("res-text")}<button class="btn" data-act="pr-home">${t("ok")}</button></div></section>`;
  }
  return `${helpBlock("helpRecv")}<h1 class="title" data-auto>${t("receiveTitle")}</h1>
    <div class="cam-wrap"><video id="cam" hidden></video><p id="cam-msg" class="note">${icon("camera")}</p></div>
    <div class="row two"><button class="btn big" data-act="cam">${icon("camera")}${t("startCamera")}</button>
      <label class="btn big alt">${icon("image")}${t("photoInstead")}<input type="file" accept="image/*" capture="environment" id="photo" hidden></label></div>
    <details class="how"><summary>${t("pasteCode")}</summary><textarea id="paste" class="code-ta" rows="3"></textarea><button class="btn small" data-act="paste">${t("continue")}</button></details>`;
}
function vDemo(sub) {
  const st = sub.st || 0, n = t("names"), amt = fmt(500), steps = t("demoSteps");
  const left = st === 0 ? `<b class="ph-amt">${amt}</b>` : st < 3 ? `<div class="ph-qr">${sub.token ? qrSVG(sub.token) : ""}</div>` : `<b class="ph-amt neg">−${amt}</b>`;
  const right = st < 2 ? `<span class="ph-wait">${icon("camera")}</span>` : st === 2 ? `<span class="ph-wait">${icon("lock")}</span><small>${t("checking")}</small>` : `<b class="ph-amt pos">+${amt}</b><small>${icon("check")}</small>`;
  return `${helpBlock("helpDemo")}<h1 class="title">${t("demoTitle")}</h1>
    <div class="demo st${st}">
      <div class="ph"><p class="ph-name">${esc(n[0])}</p><div class="ph-scr"><span class="ph-plane">${icon("plane")}</span>${left}</div></div>
      <div class="beam" aria-hidden="true"><i></i></div>
      <div class="ph"><p class="ph-name">${esc(n[1])}</p><div class="ph-scr"><span class="ph-plane">${icon("plane")}</span>${right}</div></div>
    </div>
    <p class="big center" id="demo-cap" data-auto>${esc(steps[st].replace(/\{amt\}/g, amt))}</p>
    <div class="row">${sayBtn("demo-cap")}${st < 3 ? `<button class="btn" data-act="demo-next">${st ? t("next") : t("demoStart")}${icon("next", "flip")}</button>` : `<button class="btn" data-act="demo-reset">${icon("refresh")}${t("reset")}</button>`}</div>`;
}

/* Stay safe: scam or safe cards (also used inside sessions) */
function scamCard(idx, sub) {
  const k = SCAMK[idx], c = D().scams[idx], ans = sub.ans, right = ans && ans === k.a, unsure = ans === "u";
  const chan = t("channels")[k.ch] || k.ch, label = k.a === "s" ? t("scam") : t("safe");
  const head = unsure ? `${t("unsureFb")} ${t("answerIs")} ${label}` : right ? `${t("correct")} ${label}` : `${t("wrong")} ${t("answerIs")} ${label}`;
  return `<article class="msg ch-${k.ch}"><p class="msg-meta">${icon(CH_ICON[k.ch])}<span>${esc(chan)}</span></p>
      <p class="msg-from">${esc(c.from)}</p><p class="msg-text" id="msg-text" ${ans ? "" : "data-auto"}>${esc(c.text)}</p></article>
    ${ans ? `<section class="fb ${right ? "ok" : unsure ? "mid" : "warn"}">${icon(right ? "check" : unsure ? "help" : "alert", "res-ic")}
        <h2 data-auto>${head}</h2>
        <p><b>${t("signs")}:</b> <span id="why" data-auto>${esc(c.why)}</span></p>
        ${unsure ? `<p class="tip" data-auto>${t("unsureTip")}</p>` : ""}
        <div class="row">${sayBtn("why")}<button class="btn big" data-act="scam-next">${t("next")}${icon("next", "flip")}</button></div></section>`
      : `<div class="row two"><button class="btn big danger" data-act="scam-ans" data-v="s">${icon("alert")}${t("scam")}</button><button class="btn big ok" data-act="scam-ans" data-v="k">${icon("check")}${t("safe")}</button></div>
      <div class="row"><button class="btn ghost big unsure" data-act="scam-ans" data-v="u">${icon("help")}${t("unsure")}</button>${sayBtn("msg-text")}</div>`}`;
}
function vProtect() {
  const sub = S.sub, list = SCAMK.map((_, i) => i);
  sub.k = sub.k || 0; sub.right = sub.right || 0;
  if (sub.k >= list.length) {
    if (!sub.saved) { sub.saved = true; const b = store.get("scamBest", null); if (b == null || sub.right > b) store.set("scamBest", sub.right); }
    return `<section class="result ok">${icon("shield", "res-ic")}<h1 class="title" id="res-text" data-auto>${t("score", { c: sub.right, t: list.length })}</h1>
      <div class="row">${sayBtn("res-text")}<button class="btn" data-act="scam-again">${icon("refresh")}${t("again")}</button></div></section>`;
  }
  return `${helpBlock("helpProtect")}<p class="kicker">${t("protectTitle")} · ${sub.k + 1}/${list.length}</p><p class="lead2">${t("protectIntro")}</p>${scamCard(list[sub.k], sub)}`;
}

/* Ambassador: open a session, show join QR, live counts */
function joinUrl(s) { return location.href.split("#")[0] + "#join-" + s.code + "-" + s.venue; }
function vAmbassador() {
  const s = store.get("session", null), sub = S.sub;
  if (!s) {
    const v = sub.venue != null ? sub.venue : 0, p = sub.place != null ? sub.place : 0;
    return `<h1 class="title">${t("ambTitle")}</h1><p class="lead2">${t("ambIntro")}</p>
      <h2>${t("venue")}</h2><div class="chips">${t("venues").map((x, i) => `<button class="chip ${i === v ? "on" : ""}" data-act="pick" data-f="venue" data-v="${i}">${esc(x)}</button>`).join("")}</div>
      <h2>${t("place")}</h2><div class="chips">${t("places").map((x, i) => `<button class="chip ${i === p ? "on" : ""}" data-act="pick" data-f="place" data-v="${i}">${esc(x)}</button>`).join("")}</div>
      <button class="btn big full" data-act="amb-create">${icon("people")}${t("createSession")}</button>`;
  }
  const a = aggregate(S.rows, s.code);
  return `<p class="kicker">${t("ambTitle")} · ${esc(t("venues")[s.venue] || "")} · ${esc(t("places")[s.place] || "")}</p>
    <section class="session band">
      <div><p class="note">${t("sessionCode")}</p><p class="code">${esc(s.code)}</p>
        <p class="stats"><span><b>${a.n}</b> ${t("participants")}</span><span><b>${a.done}</b> ${t("completed")}</span></p></div>
      <figure class="qr-box">${qrSVG(joinUrl(s))}<figcaption>${t("scanToJoin")}</figcaption></figure></section>
    <p class="lead2">${t("ambSteps")}</p>
    <p class="note">${SHARED ? t("sharedOn") : t("sharedOff")}</p>
    <div class="row"><button class="btn big" data-act="amb-join">${icon("phone")}${t("joinHere")}</button><a class="btn alt" href="#observatory">${icon("chart")}${t("openObs")}</a></div>
    <button class="btn ghost small" data-act="amb-end">${icon("x")}${t("endSession")}</button>`;
}

/* Participant flow: consent → about → before → exercise → after → thanks */
function newJoin(code, venue, place, kiosk) {
  return { step: "consent", code, venue, place, kiosk, q: 0, pre: [], post: [], age: null, gender: null, k: 0, right: 0,
    pid: b64u.enc(crypto.getRandomValues(new Uint8Array(8))) };
}
function vJoin() {
  const sub = S.sub;
  const head = `<p class="kicker">${esc(sub.code)}</p>`;
  if (sub.step === "consent") return `${head}<h1 class="title">${t("consentTitle")}</h1><p class="big" id="cons" data-auto>${t("consentText")}</p>
    <div class="row">${sayBtn("cons")}<button class="btn big" data-act="j-agree">${icon("check")}${t("agree")}</button></div>`;
  if (sub.step === "about") {
    const ch = (f, arr) => arr.map((x, i) => `<button class="chip ${sub[f] === i ? "on" : ""}" data-act="j-pick" data-f="${f}" data-v="${i}">${esc(x)}</button>`).join("");
    return `${head}<h1 class="title">${t("aboutYou")}</h1><h2>${t("age")}</h2><div class="chips">${ch("age", t("ages"))}</div>
      <h2>${t("gender")}</h2><div class="chips">${ch("gender", t("genders"))}</div>
      <div class="row"><button class="btn ghost" data-act="j-about" data-skip="1">${t("skip")}</button><button class="btn" data-act="j-about">${t("continue")}${icon("next", "flip")}</button></div>`;
  }
  if (sub.step === "pre" || sub.step === "post") {
    const q = t("questions")[sub.q], sc = t("scale");
    return `${head}${helpBlock("helpJoin")}<p class="phase">${sub.step === "pre" ? t("beforeTitle") : t("afterTitle")} · ${sub.q + 1}/3</p>
      <h1 class="title" id="qtext" data-auto>${esc(q)}</h1>
      <div class="faces">${[1, 2, 3, 4, 5].map(v => `<button class="face-btn" data-act="j-face" data-v="${v}">${face(v)}<span>${esc(sc[v - 1])}</span></button>`).join("")}</div>${sayBtn("qtext")}`;
  }
  if (sub.step === "act") {
    if (sub.intro !== false) return `${head}<h1 class="title" data-auto>${t("activityTitle")}</h1><p class="big" data-auto>${t("activityText")}</p><button class="btn big full" data-act="j-act-go">${t("continue")}${icon("next", "flip")}</button>`;
    return `${head}<p class="kicker">${t("protectTitle")} · ${sub.k + 1}/${SESSION_CARDS.length}</p>${scamCard(SESSION_CARDS[sub.k], sub)}`;
  }
  return `<section class="result ok">${icon("check", "res-ic")}<h1 class="title" data-auto>${t("thanks")}</h1><p class="big" data-auto>${t("thanksText")}</p>
    <p class="lead2"><b>${t("yourScore", { c: sub.right, t: SESSION_CARDS.length })}</b></p>
    <div class="row">${sub.kiosk ? `<button class="btn big" data-act="j-back">${icon("people")}${t("backToSession")}</button>` : `<a class="btn big" href="#home">${t("home")}</a>`}</div></section>`;
}

/* Observatory */
function bars(obj, labels, byKey) {
  const ent = Object.entries(obj).sort(byKey ? (a, b) => a[0] - b[0] : (a, b) => b[1] - a[1]), max = Math.max(1, ...ent.map(e => e[1]));
  if (!ent.length) return `<p class="note">—</p>`;
  return `<ul class="hbars">${ent.map(([k, v]) => `<li><span>${esc(labels(k))}</span><i style="width:${(v / max * 100).toFixed(1)}%"></i><b>${v}</b></li>`).join("")}</ul>`;
}
function vObservatory() {
  const sub = S.sub, rows = S.rows, sessions = [...new Set(rows.map(r => r.session))].sort(), a = aggregate(rows, sub.filter || "");
  const head = `<h1 class="title">${t("obsTitle")}</h1><p class="lead2">${t("obsIntro")}</p>`;
  const tools = `<div class="row wrap"><button class="btn ghost small" data-act="obs-sample">${icon("play")}${t("loadSample")}</button>
      <button class="btn ghost small" data-act="obs-csv" ${rows.length ? "" : "disabled"}>${icon("copy")}${t("exportCsv")}</button>
      <button class="btn ghost small" data-act="obs-clear" ${rows.length ? "" : "disabled"}>${icon("trash")}${t("clearData")}</button></div>
    <p class="note">${S.srcShared ? t("srcShared") : t("srcLocal")} · ${t("scaleNote")}</p>`;
  if (!a.n) return `${head}<p class="empty">${t("obsEmpty")}</p>${tools}`;
  const L5 = v => (v / 5 * 100).toFixed(1) + "%";
  return `${head}${a.sample ? `<p class="sample-badge">${icon("alert")}${t("sampleBadge")}</p>` : ""}
    ${sessions.length > 1 ? `<label class="sel">${t("sessionFilter")}: <select id="obs-filter"><option value="">${t("allSessions")}</option>${sessions.map(s => `<option ${s === sub.filter ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></label>` : ""}
    <section class="kpis">
      <div><small>${t("obsPeople")}</small><b>${a.n}</b></div>
      <div><small>${t("obsCompleted")}</small><b>${a.done}</b></div>
      <div class="hl"><small>${t("obsGain")}</small><b>${a.gain == null ? "—" : (a.gain >= 0 ? "+" : "") + pct(a.gain)}</b></div>
      <div><small>${t("obsScam")}</small><b>${a.scam == null ? "—" : pct(a.scam)}</b></div></section>
    <section class="pairs"><p class="legend"><i class="pre"></i>${t("before")} <i class="post"></i>${t("after")}</p>
      ${a.qs.map((q, i) => `<div class="pair"><p>${esc(t("qShort")[i])}</p>
        <div class="pb"><i class="pre" style="width:${L5(q.pre)}"></i><b>${q.pre.toFixed(1)}</b></div>
        <div class="pb"><i class="post" style="width:${L5(q.post)}"></i><b>${a.done ? q.post.toFixed(1) : "—"}</b></div></div>`).join("")}</section>
    <section class="grid2">
      <div><h2>${t("byAge")}</h2>${bars(a.age, k => t("ages")[k] || k, true)}</div>
      <div><h2>${t("byGender")}</h2>${bars(a.gender, k => t("genders")[k] || k, true)}</div>
      <div><h2>${t("byLang")}</h2>${bars(a.lang, k => (L.find(l => l.code === k) || { name: k }).name)}</div>
      <div><h2>${t("byPlace")}</h2>${bars(a.place, k => t("places")[k] || k)}</div></section>
    ${tools}`;
}

/* ---------- render + routing ---------- */
const VIEW_FN = { home: vHome, setup: vSetup, learn: vLearn, practice: vPractice, protect: vProtect, ambassador: vAmbassador, observatory: vObservatory, join: vJoin };
function applyLang() {
  const l = lang(), r = document.documentElement;
  r.lang = l.code; r.dir = l.dir; r.dataset.size = S.size;
}
function render(quiet) {
  applyLang();
  $("#top").innerHTML = header();
  $("#main").innerHTML = (VIEW_FN[S.view] || vHome)();
  $("#main").dataset.view = S.view;
  $("#foot").innerHTML = `<p>${t("simNote")}</p><p>${t("contentDate")} · Euro4All · ERUA iDeaThon 2026</p>`;
  const f = $("#photo"); if (f) f.addEventListener("change", e => { const file = e.target.files && e.target.files[0]; if (file) scanFile(file); });
  const sel = $("#obs-filter"); if (sel) sel.addEventListener("change", e => { S.sub.filter = e.target.value; render(); });
  if (!quiet) speakAuto();
}
function route() {
  stopCamera(); stopSpeak();
  const h = decodeURIComponent(location.hash.slice(1));
  const m = /^join-([A-Z]{3})-(\d{4})-(\d)$/.exec(h);
  if (m) { S.view = "join"; S.sub = newJoin(m[1] + "-" + m[2], +m[3], Math.max(0, PLACE_CODES.indexOf(m[1])), false); }
  else if (VIEWS.includes(h)) { S.view = h; S.sub = {}; }
  else if (!store.get("setup", false)) { S.view = "setup"; S.sub = { st: 0 }; }
  else { S.view = "home"; S.sub = {}; }
  render(); window.scrollTo(0, 0);
  if (S.view === "observatory" || S.view === "ambassador") loadRows().then(() => { if (S.view === "observatory" || S.view === "ambassador") render(true); });
}
const go = v => { if (location.hash.slice(1) === v) route(); else location.hash = v; };
const rerender = () => { render(); window.scrollTo(0, 0); };

/* ---------- actions ---------- */
const A = {
  back() {
    stopCamera(); stopSpeak();
    if (S.view === "learn" && S.sub.i != null) { S.sub = {}; return rerender(); }
    if (S.view === "setup" && (S.sub.st || 0) > 0) { S.sub.st--; return rerender(); }
    if (S.view === "practice" && S.sub.mode) { S.sub = {}; return rerender(); }
    if (S.view === "join" && S.sub.kiosk) { S.view = "ambassador"; S.sub = {}; return rerender(); }
    go("home");
  },
  size() { S.size = (S.size + 1) % 3; store.set("size", S.size); applyLang(); toast(t("sizeNow", { s: t("sizes")[S.size] })); },
  voice() {
    S.voice = !S.voice; store.set("voice", S.voice); render(true);
    if (S.voice) { S.lastAuto = ""; speak(t("voiceOn"), true); } else { stopSpeak(); toast(t("voiceOff")); }
  },
  help(el) {
    const p = $("#help-text"); if (!p) return;
    p.hidden = !p.hidden; el.setAttribute("aria-expanded", String(!p.hidden));
    if (!p.hidden) speak(p.textContent, true); else stopSpeak();
  },
  "setup-open"() { S.view = "setup"; S.sub = { st: 0 }; rerender(); },
  "setup-lang"(el) { S.lang = el.dataset.v; store.set("lang", S.lang); S.sub.st = 1; rerender(); },
  "setup-size"(el) { S.size = +el.dataset.v; store.set("size", S.size); render(true); },
  "setup-next"() { S.sub.st = 2; rerender(); },
  "setup-voice"(el) {
    S.voice = el.dataset.v === "1"; store.set("voice", S.voice); store.set("setup", true);
    if (S.voice) speak(t("voiceTest"), true);
    S.lastAuto = t("voiceTest");
    if (location.hash.slice(1) === "home") { S.view = "home"; S.sub = {}; rerender(); } else location.hash = "home";
  },
  "lesson-list"() { S.sub = {}; rerender(); },
  langs(el) { const p = $("#langs"); p.hidden = !p.hidden; el.setAttribute("aria-expanded", String(!p.hidden)); },
  lang(el) { S.lang = el.dataset.v; store.set("lang", S.lang); stopSpeak(); render(); },
  say(el) { const n = document.getElementById(el.dataset.target); if (n) speak(n.textContent); },
  lesson(el) { S.sub = { i: +el.dataset.i, s: 0 }; rerender(); },
  slide(el) {
    const sub = S.sub, ls = D().lessons[sub.i], s = (sub.s || 0) + (+el.dataset.d);
    stopSpeak();
    if (s >= ls.slides.length) { const done = store.get("lessons", []); if (!done.includes(sub.i)) done.push(sub.i); store.set("lessons", done); S.sub = { i: sub.i, done: true }; buzz(true); }
    else sub.s = Math.max(0, s);
    rerender();
  },
  net() { store.set("offline", !store.get("offline", false)); render(); },
  shop(el) { S.sub = { mode: "shop", id: el.dataset.id, step: "till" }; rerender(); },
  "shop-tap"() { S.sub.step = "hold"; rerender(); const sub = S.sub; setTimeout(() => { if (S.sub === sub) { sub.step = "confirm"; render(); } }, 1400); },
  "shop-pay"() {
    const sub = S.sub, s = SHOPS.find(x => x.id === sub.id), shown = s.shown || s.price, w = W.get();
    if (shown > w.bal) { toast(t("notEnough")); return; }
    w.bal -= shown; w.tx.unshift({ kind: "out", amt: shown, shop: s.id, ts: Date.now() });
    if (s.shown && s.shown !== s.price) {
      w.bal += shown; w.tx.unshift({ kind: "refund", amt: shown, ts: Date.now() });
      sub.res = { ok: false, msg: t("wrongPaid", { wrong: fmt(shown), right: fmt(s.price) }), note: t("refundNote") };
    } else sub.res = { ok: true, msg: t("paid"), receipt: true };
    W.save(w); sub.step = "result"; buzz(sub.res.ok); rerender();
  },
  "shop-cancel"() {
    const sub = S.sub, s = SHOPS.find(x => x.id === sub.id);
    sub.res = s.shown && s.shown !== s.price ? { ok: true, msg: t("wrongCaught", { wrong: fmt(s.shown), right: fmt(s.price) }) } : { ok: false, msg: t("cancelled") };
    sub.step = "result"; buzz(sub.res.ok); rerender();
  },
  "pr-home"() { stopCamera(); S.sub = {}; rerender(); },
  send() { S.sub = { mode: "send", amt: 0 }; rerender(); },
  amt(el) { S.sub.amt = +el.dataset.v; render(); },
  key(el) {
    const v = el.dataset.v, sub = S.sub;
    if (v === "C") sub.amt = 0; else if (v === "B") sub.amt = Math.floor((sub.amt || 0) / 10);
    else if ((sub.amt || 0) < 100000) sub.amt = (sub.amt || 0) * 10 + (+v);
    render();
  },
  async "send-make"() {
    const sub = S.sub, w = W.get();
    if (!sub.amt) return;
    if (sub.amt > w.bal) { toast(t("notEnough")); return; }
    const { token, n } = await makeToken(sub.amt);
    const w2 = W.get(); w2.bal -= sub.amt; w2.seen.push(n); w2.tx.unshift({ kind: "sent", amt: sub.amt, ts: Date.now() }); W.save(w2);
    sub.token = token; sub.step = "code"; rerender();
  },
  recv() { S.sub = { mode: "recv" }; rerender(); },
  cam() { startCamera(); },
  paste() { const v = ($("#paste") || {}).value || ""; if (v.trim()) onScanned(v.trim()); },
  async demo() { S.sub = { mode: "demo", st: 0 }; rerender(); const sub = S.sub; try { sub.token = (await makeToken(500)).token; } catch (e) { } },
  "demo-next"() { S.sub.st = Math.min(3, (S.sub.st || 0) + 1); render(); },
  "demo-reset"() { S.sub.st = 0; render(); },
  "wallet-reset"() { dialog(t("confirmReset"), () => { store.del("wallet"); render(); }); },
  "scam-ans"(el) {
    const sub = S.sub, list = S.view === "join" ? SESSION_CARDS : SCAMK.map((_, i) => i), idx = list[sub.k];
    if (sub.ans) return;
    sub.ans = el.dataset.v; const ok = sub.ans === SCAMK[idx].a; if (ok) sub.right = (sub.right || 0) + 1;
    buzz(ok); render();
  },
  "scam-next"() {
    const sub = S.sub; sub.ans = null; sub.k = (sub.k || 0) + 1; stopSpeak();
    if (S.view === "join" && sub.k >= SESSION_CARDS.length) { sub.step = "post"; sub.q = 0; }
    rerender();
  },
  "scam-again"() { S.sub = {}; rerender(); },
  pick(el) { S.sub[el.dataset.f] = +el.dataset.v; render(); },
  "amb-create"() {
    const v = S.sub.venue || 0, p = S.sub.place || 0;
    store.set("session", { code: PLACE_CODES[p] + "-" + (1000 + Math.floor(Math.random() * 9000)), venue: v, place: p, created: Date.now() });
    S.sub = {}; rerender(); loadRows().then(render);
  },
  "amb-join"() { const s = store.get("session", null); if (!s) return; S.view = "join"; S.sub = newJoin(s.code, s.venue, s.place, true); rerender(); },
  "amb-end"() { store.del("session"); S.sub = {}; rerender(); },
  "j-agree"() { S.sub.step = "about"; rerender(); },
  "j-pick"(el) { const f = el.dataset.f, v = +el.dataset.v; S.sub[f] = S.sub[f] === v ? null : v; render(); },
  "j-about"(el) { if (el.dataset.skip) { S.sub.age = null; S.sub.gender = null; } S.sub.step = "pre"; S.sub.q = 0; rerender(); },
  async "j-face"(el) {
    const sub = S.sub, v = +el.dataset.v; stopSpeak();
    sub[sub.step][sub.q] = v; sub.q++;
    if (sub.q < 3) return rerender();
    const row = {
      pid: sub.pid, session: sub.code, phase: sub.step, q1: sub[sub.step][0], q2: sub[sub.step][1], q3: sub[sub.step][2],
      age: sub.age, gender: sub.gender, lang: S.lang, venue: sub.venue, place: sub.place,
      scam_c: sub.step === "post" ? sub.right : null, scam_t: sub.step === "post" ? SESSION_CARDS.length : null, ts: Date.now(), sample: false
    };
    if (sub.step === "pre") { sub.step = "act"; sub.k = 0; sub.right = 0; sub.intro = true; } else sub.step = "thanks";
    rerender(); saveRow(row);
  },
  "j-act-go"() { S.sub.intro = false; rerender(); },
  "j-back"() { S.view = "ambassador"; S.sub = {}; rerender(); loadRows().then(render); },
  "obs-sample"() {
    const rows = store.get("rows", []).filter(r => !r.sample).concat(sampleRows());
    store.set("rows", rows); loadRows().then(render);
  },
  async "obs-csv"() {
    const cols = ["pid", "session", "phase", "q1", "q2", "q3", "age", "gender", "lang", "venue", "place", "scam_c", "scam_t", "ts", "sample"];
    const csv = [cols.join(",")].concat(S.rows.map(r => cols.map(c => r[c] == null ? "" : String(r[c]).replace(/[",\n]/g, " ")).join(","))).join("\n");
    try { await navigator.clipboard.writeText(csv); toast(t("copied")); }
    catch (e) { const ta = document.createElement("textarea"); ta.className = "code-ta"; ta.value = csv; ta.rows = 6; $("#main").appendChild(ta); ta.select(); }
  },
  "obs-clear"() { dialog(t("confirmClear"), () => { store.del("rows"); store.del("outbox"); loadRows().then(render); }); },
  "dlg-yes"() { const d = $("#dialog"); d.hidden = true; if (dialog.yes) dialog.yes(); },
  "dlg-no"() { $("#dialog").hidden = true; }
};

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled) return;
  const f = A[el.dataset.act]; if (!f) return;
  e.preventDefault();
  Promise.resolve(f(el)).catch(err => { console.error(err); toast("⚠ " + (err && err.message || err)); });
});
document.addEventListener("keydown", e => { if (e.key === "Escape") { $("#dialog").hidden = true; const p = $("#langs"); if (p) p.hidden = true; } });
window.addEventListener("hashchange", route);
window.addEventListener("online", flushOutbox);
setInterval(() => {
  if (document.hidden) return;
  const live = () => S.view === "observatory" || (S.view === "ambassador" && store.get("session", null));
  if (live()) loadRows().then(() => { if (live() && $("#dialog").hidden) render(true); });
}, SHARED ? 5000 : 15000);
if (window.speechSynthesis) { try { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = () => { }; } catch (e) { } }
try { if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => { }); } catch (e) { }
route();
}
