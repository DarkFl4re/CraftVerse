/* ================================================================
   CraftVerse — Free Fire Craftland Map sharing app
   Vanilla JS + Firebase (Auth + Firestore). No build step needed.
   ================================================================ */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Secondary Firebase app instance so the Owner can create new Admin
// accounts without being signed out of their own session.
function getSecondaryAuth() {
  const name = "Secondary";
  const existing = getApps().find((a) => a.name === name);
  const secApp = existing || initializeApp(firebaseConfig, name);
  return getAuth(secApp);
}

/* ---------------------------------------------------------------- */
/*  ICONS (small hand-drawn monoline SVGs, no external icon library) */
/* ---------------------------------------------------------------- */
const svgIcon = (paths, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const ICONS = {
  heart: (f) => svgIcon(`<path d="M12 21s-7-4.35-9.5-9C1 8.5 2.5 5 6 5c2 0 3.5 1.2 4 2.5C10.5 6.2 12 5 14 5c3.5 0 5 3.5 3.5 7-2.5 4.65-9.5 9-9.5 9z" ${f ? 'fill="currentColor"' : ""}/>`),
  search: () => svgIcon(`<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>`),
  menu: () => svgIcon(`<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>`),
  x: () => svgIcon(`<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>`),
  arrowLeft: () => svgIcon(`<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>`),
  share: () => svgIcon(`<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><line x1="8.3" y1="10.7" x2="15.7" y2="6.3"/><line x1="8.3" y1="13.3" x2="15.7" y2="17.7"/>`),
  plus: () => svgIcon(`<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`),
  trash: () => svgIcon(`<polyline points="4 7 20 7"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>`),
  pencil: () => svgIcon(`<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>`),
  save: () => svgIcon(`<path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 4v5h7V4"/><path d="M8 20v-6h8v6"/>`),
  lock: () => svgIcon(`<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>`),
  eye: () => svgIcon(`<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>`),
  eyeOff: () => svgIcon(`<path d="M3 3l18 18"/><path d="M10.6 5.2A10.7 10.7 0 0 1 12 5c6 0 10 7 10 7a15.9 15.9 0 0 1-3.4 4.1"/><path d="M6.3 6.3C3.7 8 2 12 2 12s4 7 10 7a9.8 9.8 0 0 0 4.2-.9"/><path d="M9.5 9.5a3 3 0 0 0 4.2 4.2"/>`),
  copy: () => svgIcon(`<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>`),
  externalLink: () => svgIcon(`<path d="M14 4h6v6"/><line x1="20" y1="4" x2="11" y2="13"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/>`),
  check: () => svgIcon(`<polyline points="20 6 9 17 4 12"/>`),
  checkCircle: () => svgIcon(`<circle cx="12" cy="12" r="9"/><polyline points="8 12.5 11 15.5 16 9"/>`),
  clock: () => svgIcon(`<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>`),
  alertCircle: () => svgIcon(`<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16.5" x2="12" y2="16.5"/>`),
  sparkles: () => svgIcon(`<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>`),
  megaphone: () => svgIcon(`<path d="M3 11v2a2 2 0 0 0 2 2h1l2 5h2l-1-5h4l6 4V7l-6 4H6a2 2 0 0 0-2 2z"/>`),
  chevronUp: () => svgIcon(`<polyline points="6 15 12 9 18 15"/>`),
  shieldCheck: () => svgIcon(`<path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6z"/><polyline points="9 12 11 14 15 10"/>`),
  userCog: () => svgIcon(`<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6"/><circle cx="18" cy="17" r="3"/>`),
  ban: () => svgIcon(`<circle cx="12" cy="12" r="9"/><line x1="5.5" y1="5.5" x2="18.5" y2="18.5"/>`),
  key: () => svgIcon(`<circle cx="8" cy="15" r="4"/><path d="M10.5 12.5L20 3M17 6l2.5 2.5M14 9l2 2"/>`),
  layoutDashboard: () => svgIcon(`<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/>`),
  list: () => svgIcon(`<line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>`),
  users: () => svgIcon(`<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="18" cy="9" r="3"/><path d="M15.5 14.5c2.8.4 5 2.4 5 5.5"/>`),
  userCircle: () => svgIcon(`<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6 19c1-3 3-4.5 6-4.5s5 1.5 6 4.5"/>`),
  settings: () => svgIcon(`<circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.4-2-3.4-2.3.7a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.6 7.6 0 0 0-1.7 1l-2.3-.7-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.4 2 3.4 2.3-.7a7.6 7.6 0 0 0 1.7 1L11 21h4l.4-2.9a7.6 7.6 0 0 0 1.7-1l2.3.7 2-3.4z"/>`),
  upload: () => svgIcon(`<path d="M12 16V4"/><polyline points="7 9 12 4 17 9"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>`),
  image: () => svgIcon(`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><polyline points="4 17 9 12 13 16 16 13 20 17"/>`),
  fileText: () => svgIcon(`<path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>`),
  logOut: () => svgIcon(`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`),
  map: () => svgIcon(`<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>`),
};

/* ---------------------------------------------------------------- */
/*  CONSTANTS                                                        */
/* ---------------------------------------------------------------- */
const GRADIENTS = [
  ["#3E8EFF", "#7C5CFF"], ["#FF5D6C", "#FF9B5D"], ["#2DD4BF", "#0EA5E9"],
  ["#FFB443", "#FF5D9E"], ["#A78BFA", "#60A5FA"], ["#34D399", "#22D3EE"],
];
function gradientFor(str = "?") {
  const code = str.trim() ? str.trim().charCodeAt(0) : 63;
  return GRADIENTS[code % GRADIENTS.length];
}

const DEFAULT_SITE_CONTENT = {
  about: "CraftVerse is a community hub for Free Fire Craftland creators to share map codes, previews and tutorials in one place.\n\nBrowse the home feed, copy a map code straight into your clipboard, and save your favorites for later.",
  terms: "By using this app you agree to keep submitted maps respectful and free of content you don't have rights to.\n\nAdmins are responsible for the maps they submit. The owner reviews and approves all admin-submitted maps before they go public.",
  dmca: "If you believe content posted on this app infringes your rights, please contact the owner through the official channel listed on the profile page with:\n\n1. A description of the content.\n2. The URL or post where it appears.\n3. Your contact information.\n\nValid requests will be reviewed and the content removed if confirmed.",
};

const DEFAULT_AD_SETTINGS = {
  adsEnabled: true, bannerEnabled: true, nativeEnabled: true, postViewEnabled: true,
  nativeFrequency: 4,
  bannerTitle: "Responsive ad banner",
  bannerSubtitle: "Reserve this space for your ad network",
  bannerLink: "",
};

const LINK_ICON_KEYS = { telegram: "share", discord: "users", twitter: "sparkles", facebook: "userCircle", instagram: "image", other: "externalLink" };

const MAX_IMAGE_BYTES = 700 * 1024; // keep Firestore documents comfortably under the 1MiB limit

/* ---------------------------------------------------------------- */
/*  STATE                                                            */
/* ---------------------------------------------------------------- */
const state = {
  accounts: [],
  posts: [],
  siteContent: DEFAULT_SITE_CONTENT,
  adSettings: DEFAULT_AD_SETTINGS,
  likedIds: JSON.parse(localStorage.getItem("cv_liked") || "[]"),
  session: null, // { uid, role, account }
  accountsLoaded: false,
  postsLoaded: false,
  ui: {
    menuOpen: false,
    exploreOpen: false,
    toast: null,
    confirm: null,
    postOrigin: "home",
    ownerTab: "dashboard",
    adminTab: "posts",
  },
};

function toggleLike(postId) {
  const idx = state.likedIds.indexOf(postId);
  if (idx >= 0) state.likedIds.splice(idx, 1);
  else state.likedIds.push(postId);
  localStorage.setItem("cv_liked", JSON.stringify(state.likedIds));
  render();
}

function showToast(msg, type = "success") {
  state.ui.toast = { msg, type };
  render();
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { state.ui.toast = null; render(); }, 2400);
}

function askConfirm(opts, onConfirm) {
  state.ui.confirm = { ...opts, onConfirm };
  render();
}
function closeConfirm() { state.ui.confirm = null; render(); }

function getAuthor(id) {
  return state.accounts.find((a) => a.id === id) || { id, name: "Unknown Creator", avatar: "" };
}
function getOwner() {
  return state.accounts.find((a) => a.role === "owner") || null;
}

/* ---------------------------------------------------------------- */
/*  FIRESTORE LIVE LISTENERS + AUTH STATE                             */
/* ---------------------------------------------------------------- */
onSnapshot(collection(db, "accounts"), (snap) => {
  state.accounts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  state.accountsLoaded = true;
  render();
}, (err) => console.error("accounts listener error", err));

onSnapshot(collection(db, "posts"), (snap) => {
  state.posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  state.postsLoaded = true;
  render();
}, (err) => console.error("posts listener error", err));

onSnapshot(doc(db, "site-content", "main"), (d) => {
  if (d.exists()) state.siteContent = d.data();
  render();
}, () => {});

onSnapshot(doc(db, "ad-settings", "main"), (d) => {
  if (d.exists()) state.adSettings = d.data();
  render();
}, () => {});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const snap = await getDoc(doc(db, "accounts", user.uid));
      state.session = snap.exists() ? { uid: user.uid, role: snap.data().role, account: { id: user.uid, ...snap.data() } } : { uid: user.uid, role: null, account: null };
    } catch (e) {
      state.session = null;
    }
  } else {
    state.session = null;
  }
  render();
});

/* ---------------------------------------------------------------- */
/*  FIRESTORE CRUD HELPERS                                            */
/* ---------------------------------------------------------------- */
async function fsSetAccount(uid, data) {
  try { await setDoc(doc(db, "accounts", uid), data, { merge: true }); return true; }
  catch (e) { console.error(e); return false; }
}
async function fsDeleteAccount(uid) {
  try { await deleteDoc(doc(db, "accounts", uid)); return true; }
  catch (e) { console.error(e); return false; }
}
async function fsSetPost(id, data) {
  try { await setDoc(doc(db, "posts", id), data, { merge: true }); return true; }
  catch (e) { console.error(e); return false; }
}
async function fsDeletePost(id) {
  try { await deleteDoc(doc(db, "posts", id)); return true; }
  catch (e) { console.error(e); return false; }
}
async function fsSaveSiteContent(data) {
  try { await setDoc(doc(db, "site-content", "main"), data, { merge: true }); return true; }
  catch (e) { console.error(e); return false; }
}
async function fsSaveAdSettings(data) {
  try { await setDoc(doc(db, "ad-settings", "main"), data, { merge: true }); return true; }
  catch (e) { console.error(e); return false; }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e2) { return false; }
  }
}

/* ---------------------------------------------------------------- */
/*  SMALL UI BUILDING BLOCKS (return HTML strings)                    */
/* ---------------------------------------------------------------- */
function avatarHtml(name, src, size = 40) {
  if (src) return `<img src="${escAttr(src)}" alt="${escAttr(name)}" class="rounded-full object-cover border border-bd flex-shrink-0" style="width:${size}px;height:${size}px;" />`;
  const [c1, c2] = gradientFor(name);
  const letter = name ? name.trim()[0].toUpperCase() : "?";
  return `<div class="rounded-full flex items-center justify-center flex-shrink-0 font-sora font-bold text-white" style="width:${size}px;height:${size}px;background:linear-gradient(135deg, ${c1}, ${c2});font-size:${size * 0.4}px;">${letter}</div>`;
}
function thumbPlaceholder(radius = 16) {
  return `<div class="w-full flex items-center justify-center" style="aspect-ratio:16/9;border-radius:${radius}px;background:linear-gradient(135deg, #2DD4BF, #0EA5E9);"><span class="opacity-60">${ICONS.image()}</span></div>`;
}
function iconBtn({ action, id = "", active = false, extra = "", size = 40, icon }) {
  return `<button data-action="${action}" data-id="${escAttr(id)}" class="rounded-xl border border-bd flex items-center justify-center flex-shrink-0 ${active ? "bg-coral/15" : "bg-panelalt"} ${extra}" style="width:${size}px;height:${size}px;">${icon}</button>`;
}
function primaryBtn({ action = "", id = "", label, icon = "", extra = "", type = "button" }) {
  return `<button type="${type}" data-action="${action}" data-id="${escAttr(id)}" class="rounded-xl text-white font-sora font-semibold text-sm px-4 py-3 flex items-center justify-center gap-2 ${extra}" style="background:linear-gradient(135deg, #3E8EFF, #7C5CFF);">${icon}${label}</button>`;
}
function ghostBtn({ action = "", id = "", label, icon = "", color = "", extra = "" }) {
  return `<button data-action="${action}" data-id="${escAttr(id)}" class="rounded-xl border border-bd bg-transparent font-sora font-semibold text-sm px-3.5 py-2.5 flex items-center justify-center gap-1.5 ${extra}" style="color:${color || "#8A93AC"};">${icon}${label}</button>`;
}
function fieldWrap(label, inner) {
  return `<div class="mb-3.5"><div class="font-mono text-[11px] tracking-wide text-tfaint uppercase mb-1.5">${label}</div>${inner}</div>`;
}
const inputCls = "w-full bg-bgdeep border border-bd rounded-lg px-3 py-2.5 text-tprimary font-inter text-sm";

function toggleHtml(id, checked, labelOn, labelOff) {
  return `<button data-action="toggle-field" data-id="${id}" data-checked="${checked ? "1" : "0"}" class="flex items-center gap-2.5">
    <span class="block rounded-full border toggle-track" style="width:42px;height:24px;background:${checked ? "#34D399" : "#1C2540"};border-color:${checked ? "#34D399" : "#232D48"};position:relative;">
      <span class="block rounded-full bg-white toggle-knob" style="width:18px;height:18px;position:absolute;top:2px;left:${checked ? "21px" : "2px"};"></span>
    </span>
    <span class="font-inter text-[13px] text-tmuted">${checked ? labelOn : labelOff}</span>
  </button>`;
}
function statusBadge(status) {
  const approved = status === "approved";
  return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] uppercase" style="background:${approved ? "rgba(52,211,153,.14)" : "rgba(251,191,36,.14)"};color:${approved ? "#34D399" : "#FBBF24"};">${approved ? ICONS.checkCircle() : ICONS.clock()} ${approved ? "Approved" : "Pending"}</span>`;
}
function categoryBadge(cat) {
  if (!cat) return "";
  return `<div class="absolute top-2 left-2 px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase tracking-wide text-tprimary" style="background:rgba(10,14,23,0.72);">${esc(cat)}</div>`;
}

function adSlot(variant = "native") {
  const s = state.adSettings;
  if (variant === "banner") {
    const inner = `<div class="border border-dashed border-bd rounded-2xl px-4 py-5 mb-4 text-center bg-panelalt">
      <div class="font-mono text-[10px] text-tfaint uppercase tracking-wide mb-2.5">Sponsored</div>
      <div class="flex items-center justify-center gap-2.5">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#3E8EFF,#7C5CFF);">${ICONS.megaphone()}</div>
        <div class="text-left"><div class="font-sora font-bold text-[13px]">${esc(s.bannerTitle)}</div><div class="font-inter text-[11px] text-tmuted">${esc(s.bannerSubtitle)}</div></div>
      </div>
    </div>`;
    return s.bannerLink ? `<a href="${escAttr(s.bannerLink)}" target="_blank" rel="noopener noreferrer" class="block no-underline">${inner}</a>` : inner;
  }
  return `<div class="border border-dashed border-bd rounded-2xl p-3.5 mb-4 bg-panelalt flex items-center gap-3">
    <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background:linear-gradient(135deg,#FF5D6C,#FF9B5D);">${ICONS.megaphone()}</div>
    <div class="min-w-0"><div class="font-mono text-[9px] text-tfaint uppercase tracking-wide">Sponsored</div><div class="font-sora font-bold text-[13px]">Native ad slot</div><div class="font-inter text-[11px] text-tmuted">Placed every few maps in the feed</div></div>
  </div>`;
}
function withAds(items, everyN) {
  const out = [];
  items.forEach((post, idx) => {
    out.push({ kind: "post", post });
    if (everyN > 0 && (idx + 1) % everyN === 0 && idx !== items.length - 1) out.push({ kind: "ad" });
  });
  return out;
}

function esc(str) {
  return String(str ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
function escAttr(str) {
  return String(str ?? "").replace(/"/g, "&quot;");
}

/* ---------------------------------------------------------------- */
/*  HEADER / FOOTER / MENU / POST CARD                                */
/* ---------------------------------------------------------------- */
function homeHeaderHtml() {
  return `<div class="sticky top-0 z-20 bg-bgdeep pb-1">
    <div class="flex items-center gap-2.5 px-4 pt-4 pb-2.5">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center font-sora font-extrabold text-white text-lg" style="background:linear-gradient(135deg,#3E8EFF,#7C5CFF);">C</div>
      <div class="font-sora font-bold text-lg">CraftVerse</div>
      <div class="flex-1"></div>
      ${iconBtn({ action: "open-explore", icon: ICONS.search() })}
      ${iconBtn({ action: "open-menu", icon: ICONS.menu() })}
    </div>
  </div>`;
}
function backHeaderHtml(title, backAction = "nav", backId = "home") {
  return `<div class="flex items-center gap-2.5 px-4 pt-4 pb-2.5">
    ${iconBtn({ action: backAction, id: backId, icon: ICONS.arrowLeft() })}
    <div class="flex-1 font-sora font-bold text-base">${esc(title)}</div>
  </div>`;
}
function menuSheetHtml() {
  const items = [
    ["Home", "home"], ["Favorites", "favorites"], ["About", "about"],
    ["Terms", "terms"], ["DMCA", "dmca"], ["Admin Panel", "adminGate"],
  ];
  return `<div data-action="close-menu" class="fixed inset-0 z-50 flex items-start justify-end" style="background:rgba(0,0,0,0.5);">
    <div class="mt-[68px] mr-4 bg-panel border border-bd rounded-2xl overflow-hidden shadow-2xl min-w-[190px]" onclick="event.stopPropagation()">
      ${items.map(([label, key], i) => `<button data-action="nav" data-id="${key}" class="w-full text-left px-4 py-3 font-inter text-sm ${i < items.length - 1 ? "border-b border-bd" : ""}">${label}</button>`).join("")}
    </div>
  </div>`;
}
function footerHtml() {
  const owner = getOwner();
  const socials = (owner && owner.links ? owner.links : []).slice(0, 5);
  return `<div class="mt-2 bg-panel border-t border-bd rounded-t-[20px] px-5 pt-6 pb-5 flex flex-col items-center gap-3.5">
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 rounded-lg flex items-center justify-center font-sora font-extrabold text-white text-sm" style="background:linear-gradient(135deg,#3E8EFF,#7C5CFF);">C</div>
      <div class="font-sora font-bold text-[15px]">CraftVerse</div>
    </div>
    <div class="font-inter text-xs text-tmuted text-center">Craftland map codes, previews & tutorials from the community.</div>
    ${socials.length ? `<div class="flex gap-2.5">${socials.map((l) => `<a href="${escAttr(l.url || "#")}" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-lg bg-panelalt border border-bd flex items-center justify-center">${ICONS[LINK_ICON_KEYS[l.icon] || "externalLink"]()}</a>`).join("")}</div>` : ""}
    <div class="flex gap-4">
      ${["about", "terms", "dmca"].map((k) => `<button data-action="nav" data-id="${k}" class="bg-transparent border-none font-inter text-xs text-tmuted capitalize">${k}</button>`).join("")}
    </div>
    <div class="w-full h-px bg-bd my-1"></div>
    <div class="font-inter text-[11px] text-tfaint">© ${new Date().getFullYear()} CraftVerse. All rights reserved.</div>
  </div>`;
}

function postCardHtml(post, author) {
  const liked = state.likedIds.includes(post.id);
  return `<div class="bg-panel border border-bd rounded-2xl p-3.5 mb-4">
    <div data-action="open-post" data-id="${post.id}" class="cursor-pointer relative">
      ${post.thumbnail ? `<img src="${escAttr(post.thumbnail)}" alt="${escAttr(post.title)}" class="w-full object-cover rounded-2xl" style="aspect-ratio:16/9;" />` : thumbPlaceholder(14)}
      ${categoryBadge(post.category)}
    </div>
    <div class="flex items-center gap-2.5 mt-3">
      <div data-action="open-profile" data-id="${author.id}" class="flex items-center gap-2.5 flex-1 cursor-pointer">
        ${avatarHtml(author.name, author.avatar, 32)}
        <div class="font-sora font-semibold text-sm">${esc(author.name)}</div>
      </div>
      ${iconBtn({ action: "toggle-like", id: post.id, active: liked, size: 36, icon: `<span style="color:${liked ? "#FF5D6C" : "#8A93AC"}">${ICONS.heart(liked)}</span>` })}
      ${iconBtn({ action: "share-post", id: post.id, size: 36, icon: ICONS.share() })}
    </div>
    <div data-action="open-post" data-id="${post.id}" class="mt-2.5 cursor-pointer font-sora font-bold text-[15px] uppercase tracking-wide">${esc(post.title)}</div>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  SCREEN: HOME / FAVORITES                                          */
/* ---------------------------------------------------------------- */
function feedScreen(mode) {
  let visible = state.posts.filter((p) => p.status === "approved" && !p.hidden);
  if (mode === "favorites") visible = visible.filter((p) => state.likedIds.includes(p.id));
  const adsOn = state.adSettings.adsEnabled;
  const rows = mode === "home" && adsOn && state.adSettings.nativeEnabled ? withAds(visible, state.adSettings.nativeFrequency) : visible.map((post) => ({ kind: "post", post }));

  let html = mode === "home" ? homeHeaderHtml() : backHeaderHtml("Favorites");
  html += `<div class="px-4 pt-1.5 pb-1">`;
  if (mode === "home" && visible.length > 0 && adsOn && state.adSettings.bannerEnabled) html += adSlot("banner");
  if (visible.length === 0) {
    html += `<div class="text-center py-16 px-5 text-tfaint font-inter text-sm">${mode === "favorites" ? "You haven't favorited any maps yet." : (state.postsLoaded ? "No maps yet — check back soon." : "Loading maps...")}</div>`;
  } else {
    html += rows.map((row) => (row.kind === "ad" ? adSlot("native") : postCardHtml(row.post, getAuthor(row.post.authorId)))).join("");
  }
  html += `</div>${footerHtml()}`;
  return html;
}

/* ---------------------------------------------------------------- */
/*  SCREEN: EXPLORE (search + categories)                             */
/* ---------------------------------------------------------------- */
let exploreQuery = "";
let exploreCategory = null;
function exploreScreenHtml() {
  const visible = state.posts.filter((p) => p.status === "approved" && !p.hidden);
  const categories = Array.from(new Set(visible.map((p) => p.category).filter(Boolean)));
  const showResults = exploreQuery.trim().length > 0 || !!exploreCategory;
  const q = exploreQuery.trim().toLowerCase();
  const results = visible.filter((p) => {
    const matchesQuery = !q || p.title.toLowerCase().includes(q) || getAuthor(p.authorId).name.toLowerCase().includes(q);
    const matchesCat = !exploreCategory || p.category === exploreCategory;
    return matchesQuery && matchesCat;
  });

  let html = `<div class="flex items-center px-4 pt-[18px] pb-3">
    <div class="flex-1 font-sora font-bold text-lg">Explore</div>
    ${iconBtn({ action: "close-explore", icon: ICONS.x() })}
  </div>
  <div class="px-4 pb-4">
    <div class="relative">
      <input id="explore-search" value="${escAttr(exploreQuery)}" placeholder="Search maps or creators..." class="${inputCls} pr-10" />
      <span class="absolute right-3 top-2.5 text-tmuted pointer-events-none">${ICONS.search()}</span>
    </div>
  </div>`;

  if (!showResults) {
    html += `<div class="px-4 pb-8">
      <div class="font-mono text-[11px] text-tfaint uppercase mb-3">Categories</div>
      ${categories.length === 0 ? `<div class="text-tfaint font-inter text-sm py-2">No categories yet — add one when creating a map.</div>` :
        `<div class="flex flex-wrap gap-2.5">${categories.map((c) => `<button data-action="set-explore-category" data-id="${escAttr(c)}" class="flex items-center gap-2 px-4 py-3 rounded-xl border border-bd bg-panelalt font-sora font-bold text-sm">${ICONS.sparkles()} ${esc(c)}</button>`).join("")}</div>`}
    </div>`;
  } else {
    html += `<div class="px-4 pb-8">`;
    if (exploreCategory) {
      html += `<div class="flex items-center gap-2 mb-3.5">
        <div class="px-3 py-1.5 rounded-lg bg-accent/15 text-accent font-sora font-semibold text-xs">${esc(exploreCategory)}</div>
        <button data-action="clear-explore-category" class="bg-transparent border-none text-tfaint font-inter text-xs">Clear</button>
      </div>`;
    }
    html += results.length === 0
      ? `<div class="text-center text-tfaint font-inter text-sm py-10">No matches found.</div>`
      : results.map((post) => postCardHtml(post, getAuthor(post.authorId))).join("");
    html += `</div>`;
  }
  return `<div class="fixed inset-0 bg-bgdeep z-[60] overflow-y-auto"><div class="max-w-[480px] mx-auto">${html}</div></div>`;
}

/* ---------------------------------------------------------------- */
/*  SCREEN: STATIC PAGES                                              */
/* ---------------------------------------------------------------- */
function staticPageHtml(title, content) {
  return `${backHeaderHtml(title)}<div class="px-5 pt-1.5 pb-8 text-tmuted font-inter text-sm leading-relaxed whitespace-pre-wrap">${esc(content)}</div>`;
}

/* ---------------------------------------------------------------- */
/*  SCREEN: POST VIEW (map code copy + external preview video)        */
/* ---------------------------------------------------------------- */
function postViewScreenHtml(post) {
  const author = getAuthor(post.authorId);
  const liked = state.likedIds.includes(post.id);
  let html = `<div class="relative">
    <button data-action="nav" data-id="${state.ui.postOrigin}" class="absolute top-3.5 left-3.5 z-10 rounded-xl border border-bd flex items-center justify-center" style="width:38px;height:38px;background:rgba(10,14,23,0.7);">${ICONS.arrowLeft()}</button>
    ${post.thumbnail ? `<img src="${escAttr(post.thumbnail)}" alt="${escAttr(post.title)}" class="w-full object-cover" style="aspect-ratio:16/9;" />` : thumbPlaceholder(0)}
  </div>
  <div class="px-4 pt-4 pb-7">
    <div class="flex items-center gap-2.5 bg-panel border border-bd rounded-2xl p-2.5 relative z-[2]" style="margin-top:-30px;">
      <div data-action="open-profile" data-id="${author.id}" class="flex items-center gap-2.5 flex-1 cursor-pointer">
        ${avatarHtml(author.name, author.avatar, 34)}
        <div class="font-sora font-semibold text-sm">${esc(author.name)}</div>
      </div>
      ${iconBtn({ action: "toggle-like", id: post.id, active: liked, size: 36, icon: `<span style="color:${liked ? "#FF5D6C" : "#8A93AC"}">${ICONS.heart(liked)}</span>` })}
      ${iconBtn({ action: "share-post", id: post.id, size: 36, icon: ICONS.share() })}
    </div>
    <div class="mt-4.5 font-sora font-extrabold text-xl tracking-wide uppercase">${esc(post.title)}</div>
    <div class="mt-3 pl-3 border-l-[3px] border-accent text-tmuted font-inter text-sm leading-relaxed whitespace-pre-wrap">${esc(post.description)}</div>`;

  if (state.adSettings.adsEnabled && state.adSettings.postViewEnabled) html += `<div class="mt-5">${adSlot("native")}</div>`;

  html += `<div class="mt-1.5 flex flex-col gap-3">`;
  // Map code block
  html += `<div class="bg-panel border border-bd rounded-2xl p-4">
    <div class="font-mono text-[11px] text-tfaint uppercase tracking-wide mb-2">Craftland map code</div>
    <div class="flex items-center gap-2">
      <div class="flex-1 bg-bgdeep border border-bd rounded-lg px-3 py-2.5 font-mono text-sm text-tprimary overflow-x-auto whitespace-nowrap">${post.mapCode ? esc(post.mapCode) : '<span class="text-tfaint">Not added yet</span>'}</div>
      ${primaryBtn({ action: "copy-map-code", id: post.id, label: "Copy", icon: `<span class="mr-1">${ICONS.copy()}</span>`, extra: "px-4" })}
    </div>
  </div>`;
  // Preview / tutorial video (external link)
  if (post.previewVideoUrl) {
    html += `<a href="${escAttr(post.previewVideoUrl)}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 bg-panel border border-bd rounded-2xl px-3.5 py-3 no-underline">
      <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background:linear-gradient(135deg,#FF5D6C,#FF9B5D);">${ICONS.externalLink()}</div>
      <div class="flex-1 font-sora font-semibold text-sm text-tprimary">Watch preview / tutorial video</div>
      ${ICONS.externalLink()}
    </a>`;
  }
  html += `</div></div>`;
  return html;
}

/* ---------------------------------------------------------------- */
/*  SCREEN: PUBLIC PROFILE                                            */
/* ---------------------------------------------------------------- */
let profileTab = "links";
function profileScreenHtml(account) {
  const theirPosts = state.posts.filter((p) => p.authorId === account.id && p.status === "approved" && !p.hidden);
  if (!account.profilePublic) {
    return `${backHeaderHtml("Profile")}<div class="flex flex-col items-center px-5 py-10">
      ${avatarHtml(account.name, account.avatar, 90)}
      <div class="mt-3.5 font-sora font-extrabold text-xl">${esc(account.name)}</div>
      <div class="mt-3.5 flex items-center gap-2 text-tfaint font-inter text-sm">${ICONS.eyeOff()} This profile is private.</div>
    </div>`;
  }
  let html = backHeaderHtml("");
  html += `<div class="flex flex-col items-center px-5 pb-5" style="margin-top:-10px;">
    ${avatarHtml(account.name, account.avatar, 100)}
    <div class="mt-3.5 font-sora font-extrabold text-[22px]">${esc(account.name)}</div>
    <div class="mt-2 text-center text-tmuted font-inter text-sm leading-relaxed whitespace-pre-wrap">${esc(account.bio)}</div>
    <div class="flex gap-2 mt-5 bg-panel border border-bd rounded-2xl p-1 w-full">
      ${["links", "posts"].map((k) => `<button data-action="set-profile-tab" data-id="${k}" class="flex-1 py-2.5 rounded-xl font-sora font-semibold text-sm capitalize ${profileTab === k ? "bg-panelhover text-tprimary" : "text-tmuted"}">${k}</button>`).join("")}
    </div>
  </div>
  <div class="px-4 pb-7">`;
  if (profileTab === "links") {
    html += account.links && account.links.length
      ? `<div class="flex flex-col gap-2.5">${account.links.map((l) => `<a href="${escAttr(l.url || "#")}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3.5 bg-panel border border-bd rounded-2xl px-4 py-3.5 no-underline"><span class="text-tmuted">${ICONS[LINK_ICON_KEYS[l.icon] || "externalLink"]()}</span><div class="font-sora font-semibold text-[15px] text-tprimary">${esc(l.label)}</div></a>`).join("")}</div>`
      : `<div class="text-center text-tfaint font-inter text-sm py-5">No links added yet.</div>`;
  } else {
    html += theirPosts.length
      ? theirPosts.map((post) => postCardHtml(post, account)).join("")
      : `<div class="text-center text-tfaint font-inter text-sm py-5">No maps from ${esc(account.name)} yet.</div>`;
  }
  html += `</div>`;
  return html;
}

/* ---------------------------------------------------------------- */
/*  SCREEN: FIRST-RUN OWNER SETUP                                     */
/* ---------------------------------------------------------------- */
function bootstrapOwnerScreenHtml() {
  return `<div class="px-5 pt-10 pb-8 flex flex-col items-center">
    <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style="background:rgba(62,142,255,.14);">${ICONS.shieldCheck()}</div>
    <div class="font-sora font-bold text-lg text-center">Welcome to CraftVerse</div>
    <div class="text-tmuted font-inter text-sm text-center mt-2 mb-6">No Owner account exists yet. Create one now — this will have full control over the app.</div>
    <div class="w-full">
      ${fieldWrap("Your name", `<input id="bo-name" class="${inputCls}" placeholder="e.g. Jahid Playz" />`)}
      ${fieldWrap("Email", `<input id="bo-email" type="email" class="${inputCls}" placeholder="you@example.com" />`)}
      ${fieldWrap("Password", `<input id="bo-password" type="password" class="${inputCls}" placeholder="At least 6 characters" />`)}
      <div id="bo-error" class="text-coral text-xs mb-2 font-inter"></div>
      ${primaryBtn({ action: "bootstrap-owner", label: "Create Owner Account", extra: "w-full" })}
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  SCREEN: ADMIN GATE / LOGIN                                        */
/* ---------------------------------------------------------------- */
function adminGateScreenHtml() {
  return `${backHeaderHtml("Admin Panel")}
  <div class="px-5 pt-2 pb-8 flex flex-col gap-3.5">
    <button data-action="nav" data-id="ownerLogin" class="flex items-center gap-3.5 bg-panel border border-bd rounded-2xl p-4.5 text-left">
      <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(62,142,255,.14);">${ICONS.shieldCheck()}</div>
      <div><div class="font-sora font-bold text-[15px]">Owner</div><div class="font-inter text-xs text-tmuted">Full control — approve maps, manage admins</div></div>
    </button>
    <button data-action="nav" data-id="adminLogin" class="flex items-center gap-3.5 bg-panel border border-bd rounded-2xl p-4.5 text-left">
      <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(255,93,108,.14);">${ICONS.userCog()}</div>
      <div><div class="font-sora font-bold text-[15px]">Admin</div><div class="font-inter text-xs text-tmuted">Submit maps, manage your own profile</div></div>
    </button>
  </div>`;
}
function ownerLoginScreenHtml() {
  return `${backHeaderHtml("Owner Login", "nav", "adminGate")}
  <div class="px-5 pt-6 flex flex-col items-center">
    <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4.5" style="background:rgba(62,142,255,.14);">${ICONS.lock()}</div>
    <div class="w-full">
      ${fieldWrap("Email", `<input id="ol-email" type="email" class="${inputCls}" />`)}
      ${fieldWrap("Password", `<input id="ol-password" type="password" class="${inputCls}" />`)}
      <div id="ol-error" class="text-coral text-xs mb-2 font-inter"></div>
      ${primaryBtn({ action: "owner-login", label: "Enter Owner Panel", extra: "w-full" })}
      <button data-action="forgot-password" data-id="owner" class="w-full text-center mt-3 bg-transparent border-none text-tmuted font-inter text-xs">Forgot password?</button>
    </div>
  </div>`;
}
function adminLoginScreenHtml() {
  const admins = state.accounts.filter((a) => a.role === "admin");
  return `${backHeaderHtml("Admin Login", "nav", "adminGate")}
  ${admins.length === 0
    ? `<div class="text-center text-tfaint font-inter text-sm px-5 py-10">No admin accounts yet. Ask the owner to add one.</div>`
    : `<div class="px-5 pt-5">
      ${fieldWrap("Admin account", `<select id="al-account" class="${inputCls}">${admins.map((a) => `<option value="${a.id}" ${a.banned ? "disabled" : ""}>${esc(a.name)}${a.banned ? " (banned)" : ""}</option>`).join("")}</select>`)}
      ${fieldWrap("Password", `<input id="al-password" type="password" class="${inputCls}" />`)}
      <div id="al-error" class="text-coral text-xs mb-2 font-inter"></div>
      ${primaryBtn({ action: "admin-login", label: "Enter Admin Panel", extra: "w-full" })}
      <button data-action="forgot-password" data-id="admin" class="w-full text-center mt-3 bg-transparent border-none text-tmuted font-inter text-xs">Forgot password?</button>
    </div>`}`;
}

/* ---------------------------------------------------------------- */
/*  POST EDITOR (map: title, category, description, thumbnail,       */
/*  map code, preview video link — no watch/embed providers)          */
/* ---------------------------------------------------------------- */
function emptyPostDraft(authorId, status) {
  return { id: "p" + Date.now(), title: "", category: "", description: "", thumbnail: "", mapCode: "", previewVideoUrl: "", authorId, status, hidden: false };
}
let postEditorDraft = null;
let postEditorMode = null; // 'admin' | 'owner'

function postEditorHtml(draft) {
  const existingCategories = Array.from(new Set(state.posts.map((p) => p.category).filter(Boolean)));
  return `<div class="bg-panel border border-bd rounded-2xl p-4 mb-4" id="post-editor">
    ${fieldWrap("Map title", `<input id="pe-title" class="${inputCls}" value="${escAttr(draft.title)}" placeholder="e.g. Sunset Sky Arena" />`)}
    ${fieldWrap("Category", `<input id="pe-category" class="${inputCls}" value="${escAttr(draft.category)}" placeholder="e.g. Gun Fight, Arena, Parkour" />
      ${existingCategories.length ? `<div class="flex flex-wrap gap-1.5 mt-2">${existingCategories.map((c) => `<button data-action="pe-pick-category" data-id="${escAttr(c)}" class="px-2.5 py-1 rounded-lg border border-bd bg-bgdeep text-tmuted font-inter text-[11px]">${esc(c)}</button>`).join("")}</div>` : ""}`)}
    ${fieldWrap("Description", `<textarea id="pe-description" class="${inputCls}" style="min-height:80px;">${esc(draft.description)}</textarea>`)}
    ${fieldWrap("Thumbnail image", `
      <div class="flex gap-2">
        <input id="pe-thumbnail" class="${inputCls} flex-1" value="${draft.thumbnail && draft.thumbnail.startsWith("data:") ? "(uploaded image)" : escAttr(draft.thumbnail)}" ${draft.thumbnail && draft.thumbnail.startsWith("data:") ? "readonly" : ""} placeholder="https://... or upload from device" />
        <button data-action="pe-upload-thumb" class="rounded-lg border border-bd bg-panelalt flex items-center justify-center" style="width:44px;">${ICONS.upload()}</button>
        <input id="pe-thumbnail-file" type="file" accept="image/*" class="hidden" />
      </div>
      ${draft.thumbnail ? `<img src="${escAttr(draft.thumbnail)}" class="mt-2 w-full object-cover rounded-lg border border-bd" style="max-height:140px;" />` : ""}
    `)}
    ${fieldWrap("Craftland map code", `<input id="pe-mapcode" class="${inputCls} font-mono" value="${escAttr(draft.mapCode)}" placeholder="e.g. 123-456-789" />`)}
    ${fieldWrap("Preview / tutorial video link (optional)", `<input id="pe-previewurl" class="${inputCls}" value="${escAttr(draft.previewVideoUrl)}" placeholder="https://youtube.com/..." />`)}
    <div class="flex gap-2.5 mt-1">
      ${primaryBtn({ action: "pe-save", label: "Save map", icon: `<span class="mr-1">${ICONS.save()}</span>`, extra: "flex-1" })}
      ${ghostBtn({ action: "pe-cancel", label: "Cancel", extra: "flex-1" })}
    </div>
  </div>`;
}
function bindPostEditorInputs() {
  const map = { "pe-title": "title", "pe-category": "category", "pe-description": "description", "pe-thumbnail": "thumbnail", "pe-mapcode": "mapCode", "pe-previewurl": "previewVideoUrl" };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", (e) => { postEditorDraft[key] = e.target.value; });
  });
  const fileInput = document.getElementById("pe-thumbnail-file");
  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_BYTES) { showToast("Image too large — please pick something under ~700KB.", "error"); return; }
      try {
        const dataUrl = await fileToDataUrl(file);
        postEditorDraft.thumbnail = dataUrl;
        renderCurrentEditorPanel();
      } catch (err) { showToast("Couldn't read that image.", "error"); }
    });
  }
}

/* ---------------------------------------------------------------- */
/*  PROFILE EDITOR (name, bio, avatar, visibility, links)             */
/* ---------------------------------------------------------------- */
let profileEditorDraft = null;
let profileEditorPasswordNote = "";

function profileEditorHtml(draft, allowPasswordNote) {
  return `<div class="bg-panel border border-bd rounded-2xl p-4">
    ${fieldWrap("Name", `<input id="pf-name" class="${inputCls}" value="${escAttr(draft.name)}" />`)}
    ${fieldWrap("Bio", `<textarea id="pf-bio" class="${inputCls}" style="min-height:90px;">${esc(draft.bio)}</textarea>`)}
    ${fieldWrap("Avatar image", `
      <div class="flex gap-2">
        <input id="pf-avatar" class="${inputCls} flex-1" value="${draft.avatar && draft.avatar.startsWith("data:") ? "(uploaded image)" : escAttr(draft.avatar)}" ${draft.avatar && draft.avatar.startsWith("data:") ? "readonly" : ""} placeholder="https://... or upload from device" />
        <button data-action="pf-upload-avatar" class="rounded-lg border border-bd bg-panelalt flex items-center justify-center" style="width:44px;">${ICONS.upload()}</button>
        <input id="pf-avatar-file" type="file" accept="image/*" class="hidden" />
      </div>
      ${draft.avatar ? `<img src="${escAttr(draft.avatar)}" class="mt-2 rounded-full border border-bd object-cover" style="width:64px;height:64px;" />` : ""}
    `)}
    ${fieldWrap("Profile visibility", toggleHtml("profilePublic", draft.profilePublic, "Public — visible to everyone", "Private — hidden from visitors"))}
    <div class="font-mono text-[11px] text-tfaint uppercase mt-4 mb-2">Links</div>
    <div id="pf-links">${(draft.links || []).map((l, idx) => linkRowHtml(l, idx)).join("")}</div>
    <button data-action="pf-add-link" class="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-dashed border-bd text-tmuted font-inter text-sm mb-4">${ICONS.plus()} Add link</button>
    ${allowPasswordNote ? fieldWrap("Change password (leave blank to keep current)", `<input id="pf-newpwd" type="password" class="${inputCls}" placeholder="New password" />`) : ""}
    ${primaryBtn({ action: "pf-save", label: "Save profile", icon: `<span class="mr-1">${ICONS.save()}</span>`, extra: "w-full" })}
  </div>`;
}
function linkRowHtml(link, idx) {
  return `<div class="bg-bgdeep border border-bd rounded-lg p-3 mb-2.5" data-link-idx="${idx}">
    <div class="flex gap-2 mb-2">
      <input class="${inputCls} flex-1 pf-link-label" data-idx="${idx}" value="${escAttr(link.label)}" placeholder="Label" />
      <button data-action="pf-remove-link" data-id="${idx}" class="rounded-lg border border-bd bg-coral/15 flex items-center justify-center" style="width:40px;">${ICONS.trash()}</button>
    </div>
    <input class="${inputCls} mb-2 pf-link-url" data-idx="${idx}" value="${escAttr(link.url)}" placeholder="https://..." />
    <select class="${inputCls} pf-link-icon" data-idx="${idx}">
      ${Object.keys(LINK_ICON_KEYS).map((k) => `<option value="${k}" ${link.icon === k ? "selected" : ""}>${k}</option>`).join("")}
    </select>
  </div>`;
}
function bindProfileEditorInputs() {
  const map = { "pf-name": "name", "pf-bio": "bio", "pf-avatar": "avatar" };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", (e) => { profileEditorDraft[key] = e.target.value; });
  });
  document.querySelectorAll(".pf-link-label").forEach((el) => el.addEventListener("input", (e) => { profileEditorDraft.links[+e.target.dataset.idx].label = e.target.value; }));
  document.querySelectorAll(".pf-link-url").forEach((el) => el.addEventListener("input", (e) => { profileEditorDraft.links[+e.target.dataset.idx].url = e.target.value; }));
  document.querySelectorAll(".pf-link-icon").forEach((el) => el.addEventListener("change", (e) => { profileEditorDraft.links[+e.target.dataset.idx].icon = e.target.value; }));
  const fileInput = document.getElementById("pf-avatar-file");
  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_BYTES) { showToast("Image too large — please pick something under ~700KB.", "error"); return; }
      try { profileEditorDraft.avatar = await fileToDataUrl(file); renderCurrentEditorPanel(); }
      catch (err) { showToast("Couldn't read that image.", "error"); }
    });
  }
}

/* ---------------------------------------------------------------- */
/*  ADMIN PANEL (regular admin)                                       */
/* ---------------------------------------------------------------- */
function adminPanelHtml() {
  const account = state.session.account;
  const tab = state.ui.adminTab;
  let html = `<div class="px-4 pt-4 pb-10">
    <div class="flex items-center gap-2.5 mb-4">
      ${iconBtn({ action: "nav", id: "home", icon: ICONS.arrowLeft() })}
      <div class="flex-1 text-center font-sora font-bold text-base">Admin Panel — ${esc(account.name)}</div>
      ${iconBtn({ action: "logout", icon: ICONS.logOut() })}
    </div>
    <div class="flex gap-2 bg-panel border border-bd rounded-2xl p-1 mb-4.5">
      <button data-action="set-admin-tab" data-id="posts" class="flex-1 py-2.5 rounded-xl font-sora font-semibold text-[13px] ${tab === "posts" ? "bg-panelhover text-tprimary" : "text-tmuted"}">My Maps</button>
      <button data-action="set-admin-tab" data-id="profile" class="flex-1 py-2.5 rounded-xl font-sora font-semibold text-[13px] ${tab === "profile" ? "bg-panelhover text-tprimary" : "text-tmuted"}">My Profile</button>
    </div>`;

  if (tab === "posts") {
    const myPosts = state.posts.filter((p) => p.authorId === account.id);
    if (postEditorMode === "admin" && postEditorDraft) {
      html += postEditorHtml(postEditorDraft);
    } else {
      html += primaryBtn({ action: "admin-new-post", label: "Add new map", icon: `<span class="mr-1">${ICONS.plus()}</span>`, extra: "w-full mb-4" });
    }
    if (myPosts.length === 0 && postEditorMode !== "admin") html += `<div class="text-center text-tfaint font-inter text-sm py-5">You haven't posted any maps yet.</div>`;
    myPosts.forEach((post) => {
      html += `<div class="bg-panel border border-bd rounded-2xl p-3 mb-2.5">
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <div class="font-sora font-semibold text-[13px] line-clamp-1">${esc(post.title)}</div>
            <div class="mt-1 flex items-center gap-1.5">${statusBadge(post.status)}${post.hidden ? `<span class="text-tfaint font-mono text-[10px]">HIDDEN</span>` : ""}</div>
          </div>
          ${iconBtn({ action: "admin-edit-post", id: post.id, size: 36, icon: ICONS.pencil() })}
          ${iconBtn({ action: "admin-delete-post", id: post.id, size: 36, extra: "bg-coral/15", icon: ICONS.trash() })}
        </div>
        ${ghostBtn({ action: "admin-toggle-hide", id: post.id, label: post.hidden ? "Unhide this map" : "Hide this map", icon: `<span class="mr-1">${post.hidden ? ICONS.eye() : ICONS.eyeOff()}</span>`, extra: "w-full mt-2.5" })}
      </div>`;
    });
  } else {
    html += profileEditorHtml(profileEditorDraft || account, true);
  }
  html += `</div>`;
  return html;
}

/* ---------------------------------------------------------------- */
/*  OWNER PANEL (left sidebar navigation)                             */
/* ---------------------------------------------------------------- */
function ownerDashboardHtml() {
  const posts = state.posts, accounts = state.accounts;
  const cards = [
    ["Total maps", posts.length],
    ["Approved", posts.filter((p) => p.status === "approved").length],
    ["Pending", posts.filter((p) => p.status === "pending").length],
    ["Hidden", posts.filter((p) => p.hidden).length],
    ["Admins", accounts.filter((a) => a.role === "admin").length],
    ["Banned admins", accounts.filter((a) => a.role === "admin" && a.banned).length],
  ];
  return `<div class="grid grid-cols-2 gap-3">${cards.map(([label, value]) => `<div class="bg-panel border border-bd rounded-2xl p-4"><div class="font-sora font-extrabold text-[26px]">${value}</div><div class="font-inter text-xs text-tmuted mt-1">${label}</div></div>`).join("")}</div>`;
}

function ownerPendingHtml() {
  const pending = state.posts.filter((p) => p.status === "pending");
  if (pending.length === 0) return `<div class="text-center text-tfaint font-inter text-sm py-8">No maps waiting for approval.</div>`;
  return pending.map((post) => {
    const author = getAuthor(post.authorId);
    return `<div class="bg-panel border border-bd rounded-2xl p-3.5 mb-3">
      <div class="flex items-center gap-2.5 mb-2">${avatarHtml(author.name, author.avatar, 30)}<div class="font-sora font-semibold text-[13px]">${esc(author.name)}</div></div>
      <div class="font-sora font-bold text-sm mb-2.5">${esc(post.title)}</div>
      <div class="flex gap-2.5">
        ${primaryBtn({ action: "owner-approve-post", id: post.id, label: "Approve", icon: `<span class="mr-1">${ICONS.check()}</span>`, extra: "flex-1" })}
        ${ghostBtn({ action: "owner-reject-post", id: post.id, label: "Reject", icon: `<span class="mr-1">${ICONS.trash()}</span>`, color: "#FF5D6C", extra: "flex-1" })}
      </div>
    </div>`;
  }).join("");
}

function ownerAllPostsHtml() {
  let html = "";
  if (postEditorMode === "owner" && postEditorDraft) html += postEditorHtml(postEditorDraft);
  else html += primaryBtn({ action: "owner-new-post", label: "Add new map", icon: `<span class="mr-1">${ICONS.plus()}</span>`, extra: "w-full mb-4" });

  state.posts.forEach((post) => {
    const author = getAuthor(post.authorId);
    html += `<div class="bg-panel border border-bd rounded-2xl p-3 mb-2.5">
      <div class="flex items-center gap-3">
        ${avatarHtml(author.name, author.avatar, 36)}
        <div class="flex-1 min-w-0"><div class="font-sora font-semibold text-[13px] line-clamp-1">${esc(post.title)}</div><div class="font-inter text-xs text-tfaint">${esc(author.name)}</div></div>
        ${iconBtn({ action: "owner-edit-post", id: post.id, size: 34, icon: ICONS.pencil() })}
        ${iconBtn({ action: "owner-delete-post", id: post.id, size: 34, extra: "bg-coral/15", icon: ICONS.trash() })}
      </div>
      <div class="flex items-center gap-2.5 mt-2.5">
        ${statusBadge(post.status)}
        ${ghostBtn({ action: "owner-toggle-hide", id: post.id, label: post.hidden ? "Unhide" : "Hide", icon: `<span class="mr-1">${post.hidden ? ICONS.eye() : ICONS.eyeOff()}</span>`, extra: "ml-auto px-2.5 py-1.5" })}
      </div>
    </div>`;
  });
  return html;
}

/* ---------------------------------------------------------------- */
/*  OWNER: ADMINS TAB                                                  */
/* ---------------------------------------------------------------- */
let resettingAdminId = null;

function ownerAdminsHtml() {
  const admins = state.accounts.filter((a) => a.role === "admin");
  let html = `<div class="bg-panel border border-bd rounded-2xl p-3.5 mb-4">
    <div class="font-mono text-[11px] text-tfaint uppercase mb-2.5">Add new admin</div>
    ${fieldWrap("Name", `<input id="na-name" class="${inputCls}" />`)}
    ${fieldWrap("Email", `<input id="na-email" type="email" class="${inputCls}" />`)}
    ${fieldWrap("Password", `<input id="na-password" type="password" class="${inputCls}" placeholder="At least 6 characters" />`)}
    <div id="na-error" class="text-coral text-xs mb-2 font-inter"></div>
    ${primaryBtn({ action: "owner-add-admin", label: "Add admin", icon: `<span class="mr-1">${ICONS.plus()}</span>`, extra: "w-full" })}
  </div>`;

  if (admins.length === 0) {
    html += `<div class="text-center text-tfaint font-inter text-sm py-5">No admins yet.</div>`;
  } else {
    admins.forEach((a) => {
      html += `<div class="bg-panel border border-bd rounded-2xl p-3 mb-2.5">
        <div class="flex items-center gap-2.5">
          ${avatarHtml(a.name, a.avatar, 34)}
          <div class="flex-1"><div class="font-sora font-semibold text-sm">${esc(a.name)}</div>${a.banned ? `<div class="font-mono text-[10px] text-coral uppercase">Banned</div>` : ""}</div>
          ${iconBtn({ action: "owner-remove-admin", id: a.id, size: 34, extra: "bg-coral/15", icon: ICONS.trash() })}
        </div>
        <div class="flex gap-2 mt-2.5">
          ${ghostBtn({ action: "owner-toggle-ban", id: a.id, label: a.banned ? "Unban" : "Ban", icon: `<span class="mr-1">${ICONS.ban()}</span>`, color: a.banned ? "#34D399" : "#FF5D6C", extra: "flex-1" })}
          ${ghostBtn({ action: "owner-open-reset", id: a.id, label: "Reset password", icon: `<span class="mr-1">${ICONS.key()}</span>`, extra: "flex-1" })}
        </div>
        ${resettingAdminId === a.id ? `<div class="flex gap-2 mt-2.5"><input id="reset-pwd-input" type="password" class="${inputCls} flex-1" placeholder="New password" />${primaryBtn({ action: "owner-send-reset", id: a.id, label: "Send", extra: "px-4" })}</div><div class="text-tfaint font-inter text-[11px] mt-1.5">Sends a password reset link to their email (Firebase can't set a password directly from the browser).</div>` : ""}
      </div>`;
    });
  }
  return html;
}

/* ---------------------------------------------------------------- */
/*  OWNER: SITE TAB (ads & layout + page content)                     */
/* ---------------------------------------------------------------- */
let adsDraft = null;
let siteContentDraft = null;

function ownerSiteHtml() {
  const ads = adsDraft || state.adSettings;
  const content = siteContentDraft || state.siteContent;
  return `<div class="flex flex-col gap-4">
    <div class="bg-panel border border-bd rounded-2xl p-4">
      <div class="flex items-center gap-2 mb-3.5">${ICONS.megaphone()}<div class="font-sora font-bold text-sm">Ads &amp; Layout</div></div>
      ${fieldWrap("Ads enabled", toggleHtml("ads.adsEnabled", ads.adsEnabled, "Ads are showing", "All ads hidden"))}
      ${fieldWrap("Home banner ad", toggleHtml("ads.bannerEnabled", ads.bannerEnabled, "Shown at top of Home", "Hidden"))}
      ${fieldWrap("Native ads in feed", toggleHtml("ads.nativeEnabled", ads.nativeEnabled, "Shown between maps", "Hidden"))}
      ${fieldWrap("Show every N maps", `<input id="ads-frequency" type="number" min="1" class="${inputCls}" value="${ads.nativeFrequency}" />`)}
      ${fieldWrap("Ad on map view page", toggleHtml("ads.postViewEnabled", ads.postViewEnabled, "Shown below description", "Hidden"))}
      ${fieldWrap("Banner title", `<input id="ads-title" class="${inputCls}" value="${escAttr(ads.bannerTitle)}" />`)}
      ${fieldWrap("Banner subtitle", `<input id="ads-subtitle" class="${inputCls}" value="${escAttr(ads.bannerSubtitle)}" />`)}
      ${fieldWrap("Banner link (optional)", `<input id="ads-link" class="${inputCls}" value="${escAttr(ads.bannerLink)}" placeholder="https://..." />`)}
      ${primaryBtn({ action: "owner-save-ads", label: "Save ad settings", icon: `<span class="mr-1">${ICONS.save()}</span>`, extra: "w-full" })}
    </div>
    <div class="bg-panel border border-bd rounded-2xl p-4">
      <div class="flex items-center gap-2 mb-3.5">${ICONS.fileText()}<div class="font-sora font-bold text-sm">Page content</div></div>
      ${fieldWrap("About page", `<textarea id="sc-about" class="${inputCls}" style="min-height:100px;">${esc(content.about)}</textarea>`)}
      ${fieldWrap("Terms page", `<textarea id="sc-terms" class="${inputCls}" style="min-height:100px;">${esc(content.terms)}</textarea>`)}
      ${fieldWrap("DMCA page", `<textarea id="sc-dmca" class="${inputCls}" style="min-height:100px;">${esc(content.dmca)}</textarea>`)}
      ${primaryBtn({ action: "owner-save-site-content", label: "Save page content", icon: `<span class="mr-1">${ICONS.save()}</span>`, extra: "w-full" })}
    </div>
  </div>`;
}
function bindOwnerSiteInputs() {
  if (!adsDraft) adsDraft = { ...state.adSettings };
  if (!siteContentDraft) siteContentDraft = { ...state.siteContent };
  const adsMap = { "ads-frequency": ["nativeFrequency", true], "ads-title": ["bannerTitle"], "ads-subtitle": ["bannerSubtitle"], "ads-link": ["bannerLink"] };
  Object.entries(adsMap).forEach(([id, [key, isNum]]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", (e) => { adsDraft[key] = isNum ? Math.max(1, parseInt(e.target.value) || 1) : e.target.value; });
  });
  const scMap = { "sc-about": "about", "sc-terms": "terms", "sc-dmca": "dmca" };
  Object.entries(scMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", (e) => { siteContentDraft[key] = e.target.value; });
  });
}

/* ---------------------------------------------------------------- */
/*  OWNER SCREEN WRAPPER (left icon rail navigation)                  */
/* ---------------------------------------------------------------- */
function ownerScreenHtml() {
  const owner = state.session.account;
  const tab = state.ui.ownerTab;
  const pendingCount = state.posts.filter((p) => p.status === "pending").length;
  const rail = [
    ["dashboard", "Home", ICONS.layoutDashboard()],
    ["all", "Maps", ICONS.list()],
    ["pending", "Pending", ICONS.clock(), pendingCount],
    ["admins", "Admins", ICONS.users()],
    ["profile", "Profile", ICONS.userCircle()],
    ["site", "Site", ICONS.settings()],
  ];
  let body = "";
  if (tab === "dashboard") body = ownerDashboardHtml();
  else if (tab === "all") body = ownerAllPostsHtml();
  else if (tab === "pending") body = ownerPendingHtml();
  else if (tab === "admins") body = ownerAdminsHtml();
  else if (tab === "profile") body = profileEditorHtml(profileEditorDraft || owner, true);
  else if (tab === "site") body = ownerSiteHtml();

  return `<div class="px-3 pt-4 pb-10">
    <div class="flex items-center gap-2.5 mb-4 pl-1">
      ${iconBtn({ action: "nav", id: "home", icon: ICONS.arrowLeft() })}
      <div class="flex-1 text-center font-sora font-bold text-base">Owner Panel</div>
      ${iconBtn({ action: "logout", icon: ICONS.logOut() })}
    </div>
    <div class="flex items-start gap-2.5 pl-1">
      <div class="flex-shrink-0 bg-panel border border-bd rounded-2xl flex flex-col gap-0.5 p-1 sticky" style="width:68px;top:76px;max-height:calc(100vh - 100px);overflow-y:auto;">
        ${rail.map(([key, label, icon, badge]) => `
          <button data-action="set-owner-tab" data-id="${key}" class="relative flex flex-col items-center gap-1 py-2.5 px-0.5 rounded-lg" style="background:${tab === key ? "#212B4A" : "transparent"};border-left:3px solid ${tab === key ? "#3E8EFF" : "transparent"};">
            <span style="color:${tab === key ? "#3E8EFF" : "#8A93AC"}">${icon}</span>
            <span class="font-inter" style="font-size:9px;color:${tab === key ? "#F3F5F9" : "#5C6580"};">${label}</span>
            ${badge > 0 ? `<span class="absolute rounded-full bg-coral text-white flex items-center justify-center font-inter" style="top:4px;right:6px;min-width:14px;height:14px;font-size:9px;padding:0 3px;">${badge}</span>` : ""}
          </button>
        `).join("")}
      </div>
      <div class="flex-1 min-w-0">${body}</div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  CONFIRM MODAL / TOAST / SCROLL-TO-TOP                             */
/* ---------------------------------------------------------------- */
function confirmModalHtml() {
  const c = state.ui.confirm;
  if (!c) return "";
  const danger = !!c.danger;
  return `<div class="fixed inset-0 z-[200] flex items-center justify-center p-6" style="background:rgba(0,0,0,0.6);">
    <div class="bg-panel border border-bd rounded-2xl p-5 max-w-[340px] w-full shadow-2xl">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${danger ? "rgba(255,93,108,.14)" : "rgba(62,142,255,.14)"};color:${danger ? "#FF5D6C" : "#3E8EFF"};">${ICONS.alertCircle()}</div>
        <div class="font-sora font-bold text-[15px]">${esc(c.title || "Are you sure?")}</div>
      </div>
      <div class="text-tmuted font-inter text-[13px] leading-relaxed mb-4.5">${esc(c.message)}</div>
      <div class="flex gap-2.5">
        ${ghostBtn({ action: "confirm-cancel", label: "Cancel", extra: "flex-1" })}
        ${primaryBtn({ action: "confirm-ok", label: c.confirmLabel || "Confirm", extra: `flex-1${danger ? " danger-btn" : ""}` })}
      </div>
    </div>
  </div>`;
}
function toastHtml() {
  const t = state.ui.toast;
  if (!t) return "";
  const isError = t.type === "error";
  return `<div class="fixed left-1/2 z-[999] px-4 py-2.5 rounded-xl font-inter text-[13px] flex items-center gap-2 shadow-2xl fade-in" style="bottom:24px;transform:translateX(-50%);background:#1C2540;border:1px solid ${isError ? "#FF5D6C" : "#34D399"};color:#F3F5F9;max-width:88%;">
    <span style="color:${isError ? "#FF5D6C" : "#34D399"}">${isError ? ICONS.alertCircle() : ICONS.check()}</span> ${esc(t.msg)}
  </div>`;
}
function scrollTopHtml() {
  return `<button id="scroll-top-btn" data-action="scroll-top" class="fixed rounded-full flex items-center justify-center hidden" style="bottom:24px;right:20px;width:44px;height:44px;background:linear-gradient(135deg,#3E8EFF,#7C5CFF);box-shadow:0 8px 20px rgba(0,0,0,.4);z-index:40;">${ICONS.chevronUp()}</button>`;
}
window.addEventListener("scroll", () => {
  const btn = document.getElementById("scroll-top-btn");
  if (btn) btn.classList.toggle("hidden", window.scrollY <= 420);
});

/* ---------------------------------------------------------------- */
/*  ROUTER + MAIN RENDER                                              */
/* ---------------------------------------------------------------- */
let selectedPostId = null;
let selectedProfileId = null;

function parseHash() {
  const h = (location.hash || "#/home").replace(/^#\/?/, "");
  const [screen, param] = h.split("/");
  return { screen: screen || "home", param };
}
function navigate(screen, param) {
  location.hash = param ? `/${screen}/${param}` : `/${screen}`;
}
function openPost(id, origin) {
  selectedPostId = id;
  state.ui.postOrigin = origin || parseHash().screen;
  navigate("post", id);
}
function openProfile(id) {
  selectedProfileId = id;
  navigate("profile", id);
}

function renderCurrentEditorPanel() { render(); }

function render() {
  const { screen, param } = parseHash();
  const app = document.getElementById("app");

  // Force first-run owner setup if no owner account exists yet.
  if (state.accountsLoaded && !getOwner() && screen !== "bootstrapOwner") {
    app.innerHTML = bootstrapOwnerScreenHtml() + toastHtml();
    return;
  }

  let html = "";
  switch (screen) {
    case "home": html = feedScreen("home"); break;
    case "favorites": html = feedScreen("favorites"); break;
    case "about": html = staticPageHtml("About", state.siteContent.about); break;
    case "terms": html = staticPageHtml("Terms", state.siteContent.terms); break;
    case "dmca": html = staticPageHtml("DMCA Policy", state.siteContent.dmca); break;
    case "post": {
      const post = state.posts.find((p) => p.id === (param || selectedPostId));
      html = post ? postViewScreenHtml(post) : feedScreen("home");
      break;
    }
    case "profile": {
      const account = state.accounts.find((a) => a.id === (param || selectedProfileId));
      html = account ? profileScreenHtml(account) : feedScreen("home");
      break;
    }
    case "adminGate": html = adminGateScreenHtml(); break;
    case "ownerLogin": html = ownerLoginScreenHtml(); break;
    case "adminLogin": html = adminLoginScreenHtml(); break;
    case "ownerPanel":
      html = state.session && state.session.role === "owner" ? ownerScreenHtml() : adminGateScreenHtml();
      break;
    case "adminPanel":
      html = state.session && state.session.role === "admin" ? adminPanelHtml() : adminGateScreenHtml();
      break;
    case "bootstrapOwner": html = bootstrapOwnerScreenHtml(); break;
    default: html = feedScreen("home");
  }

  app.innerHTML = html + (state.ui.menuOpen ? menuSheetHtml() : "") + (state.ui.exploreOpen ? exploreScreenHtml() : "") + confirmModalHtml() + toastHtml() + scrollTopHtml();

  // Re-bind form inputs for whichever editor is currently visible.
  if (document.getElementById("post-editor")) bindPostEditorInputs();
  if (document.getElementById("pf-name")) bindProfileEditorInputs();
  if (document.getElementById("ads-frequency") || document.getElementById("sc-about")) bindOwnerSiteInputs();
  const scrollBtn = document.getElementById("scroll-top-btn");
  if (scrollBtn) scrollBtn.classList.toggle("hidden", window.scrollY <= 420);
}
window.addEventListener("hashchange", render);

/* ---------------------------------------------------------------- */
/*  ACTION HANDLERS                                                   */
/* ---------------------------------------------------------------- */
async function handleCopyMapCode(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post || !post.mapCode) { showToast("No map code added for this map yet.", "error"); return; }
  const ok = await copyToClipboard(post.mapCode);
  showToast(ok ? "Map code copied!" : "Couldn't copy — please copy it manually.", ok ? "success" : "error");
}
async function handleSharePost(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;
  try {
    if (navigator.share) await navigator.share({ title: post.title, text: post.title, url: location.href });
    else { await copyToClipboard(location.href); showToast("Link copied — paste it wherever you like."); }
  } catch (e) {}
}

function startNewPost(mode) {
  const authorId = state.session.uid;
  postEditorDraft = emptyPostDraft(authorId, mode === "owner" ? "approved" : "pending");
  postEditorMode = mode;
  render();
}
function startEditPost(id, mode) {
  const post = state.posts.find((p) => p.id === id);
  if (!post) return;
  postEditorDraft = { ...post };
  postEditorMode = mode;
  render();
}
function cancelPostEdit() { postEditorDraft = null; postEditorMode = null; render(); }

async function savePostEditor() {
  if (!postEditorDraft.title.trim()) { showToast("Map title is required.", "error"); return; }
  const isNew = !state.posts.some((p) => p.id === postEditorDraft.id);
  const doSave = async () => {
    const draft = { ...postEditorDraft };
    if (postEditorMode === "admin" && !isNew && draft.status === "approved") draft.status = "pending"; // edits go back for review
    const ok = await fsSetPost(draft.id, draft);
    showToast(ok ? "Map saved." + (postEditorMode === "admin" ? " Pending owner approval." : "") : "Couldn't save — try again.", ok ? "success" : "error");
    postEditorDraft = null; postEditorMode = null;
    render();
  };
  if (isNew) { await doSave(); return; }
  askConfirm({ message: postEditorMode === "admin" ? "Save changes to this map? If it was already approved, it will go back to pending for owner review." : "Save changes to this map?", confirmLabel: "Save changes" }, doSave);
}

function deletePost(id) {
  askConfirm({ title: "Delete map?", message: "This will permanently remove the map. This can't be undone.", confirmLabel: "Delete", danger: true }, async () => {
    const ok = await fsDeletePost(id);
    showToast(ok ? "Map deleted." : "Couldn't delete — try again.", ok ? "success" : "error");
  });
}
function toggleHidePost(id) {
  const post = state.posts.find((p) => p.id === id);
  if (!post) return;
  askConfirm({ message: post.hidden ? "Unhide this map so it shows on Home again?" : "Hide this map from Home? You can unhide it anytime.", confirmLabel: post.hidden ? "Unhide" : "Hide" }, async () => {
    const ok = await fsSetPost(id, { hidden: !post.hidden });
    showToast(ok ? "Updated." : "Couldn't update — try again.", ok ? "success" : "error");
  });
}
function approvePost(id) {
  askConfirm({ message: "Approve this map? It will become visible to everyone on Home.", confirmLabel: "Approve" }, async () => {
    const ok = await fsSetPost(id, { status: "approved" });
    showToast(ok ? "Map approved." : "Couldn't update — try again.", ok ? "success" : "error");
  });
}
function rejectPost(id) {
  askConfirm({ title: "Reject map?", message: "This will permanently delete the submitted map.", confirmLabel: "Reject", danger: true }, async () => {
    const ok = await fsDeletePost(id);
    showToast(ok ? "Map rejected and removed." : "Couldn't update — try again.", ok ? "success" : "error");
  });
}

function startProfileEdit(account) {
  profileEditorDraft = JSON.parse(JSON.stringify(account));
  if (!profileEditorDraft.links) profileEditorDraft.links = [];
  render();
}
async function saveProfileEditor() {
  const newPwdEl = document.getElementById("pf-newpwd");
  const newPwd = newPwdEl ? newPwdEl.value.trim() : "";
  const { id, ...data } = profileEditorDraft;
  const ok = await fsSetAccount(id, data);
  if (newPwd) {
    if (auth.currentUser && auth.currentUser.uid === id) {
      showToast(ok ? "Profile saved. To change your own password, use 'Forgot password' on the login screen." : "Couldn't save — try again.", ok ? "success" : "error");
    }
  } else {
    showToast(ok ? "Profile saved." : "Couldn't save — try again.", ok ? "success" : "error");
  }
  profileEditorDraft = null;
  render();
}

function addLinkRow() {
  const draft = profileEditorDraft;
  if (!draft) return;
  draft.links = draft.links || [];
  draft.links.push({ id: "l" + Date.now(), label: "", url: "", icon: "other" });
  render();
}
function removeLinkRow(idx) {
  profileEditorDraft.links.splice(idx, 1);
  render();
}

/* ---------------------------------------------------------------- */
/*  OWNER: ADMIN MANAGEMENT                                           */
/* ---------------------------------------------------------------- */
async function ownerAddAdmin() {
  const name = document.getElementById("na-name").value.trim();
  const email = document.getElementById("na-email").value.trim();
  const password = document.getElementById("na-password").value;
  const errEl = document.getElementById("na-error");
  errEl.textContent = "";
  if (!name || !email || !password) { errEl.textContent = "Name, email and password are all required."; return; }
  if (password.length < 6) { errEl.textContent = "Password must be at least 6 characters."; return; }
  try {
    const secAuth = getSecondaryAuth();
    const cred = await createUserWithEmailAndPassword(secAuth, email, password);
    const uid = cred.user.uid;
    await fsSetAccount(uid, { role: "admin", name, email, avatar: "", bio: "", links: [], profilePublic: true, banned: false });
    await signOut(secAuth);
    showToast("Admin added.");
    render();
  } catch (e) {
    errEl.textContent = e.message || "Couldn't create that admin account.";
  }
}
function ownerToggleBan(id) {
  const acc = state.accounts.find((a) => a.id === id);
  if (!acc) return;
  askConfirm({ title: acc.banned ? "Unban admin?" : "Ban admin?", message: acc.banned ? `${acc.name} will be able to log in again.` : `${acc.name} will no longer be able to log in to the admin panel.`, confirmLabel: acc.banned ? "Unban" : "Ban", danger: !acc.banned }, async () => {
    const ok = await fsSetAccount(id, { banned: !acc.banned });
    showToast(ok ? "Updated." : "Couldn't update — try again.", ok ? "success" : "error");
  });
}
function ownerRemoveAdmin(id) {
  const acc = state.accounts.find((a) => a.id === id);
  if (!acc) return;
  askConfirm({ title: "Remove admin?", message: `This removes ${acc.name}'s admin access and profile. Their existing maps will stay, but they'll no longer be able to log in to the admin panel.`, confirmLabel: "Remove", danger: true }, async () => {
    const ok = await fsDeleteAccount(id);
    showToast(ok ? "Admin removed." : "Couldn't remove — try again.", ok ? "success" : "error");
  });
}
function ownerOpenReset(id) {
  resettingAdminId = resettingAdminId === id ? null : id;
  render();
}
async function ownerSendReset(id) {
  const acc = state.accounts.find((a) => a.id === id);
  if (!acc || !acc.email) { showToast("This admin has no email on file.", "error"); return; }
  askConfirm({ message: `Send a password reset link to ${acc.email}?`, confirmLabel: "Send link" }, async () => {
    try {
      await sendPasswordResetEmail(auth, acc.email);
      showToast("Password reset email sent.");
    } catch (e) { showToast(e.message || "Couldn't send reset email.", "error"); }
    resettingAdminId = null;
    render();
  });
}

/* ---------------------------------------------------------------- */
/*  OWNER: SAVE ADS / SITE CONTENT                                    */
/* ---------------------------------------------------------------- */
async function ownerSaveAds() {
  const ok = await fsSaveAdSettings(adsDraft || state.adSettings);
  showToast(ok ? "Ad settings saved." : "Couldn't save — try again.", ok ? "success" : "error");
  adsDraft = null;
}
async function ownerSaveSiteContent() {
  const ok = await fsSaveSiteContent(siteContentDraft || state.siteContent);
  showToast(ok ? "Page content saved." : "Couldn't save — try again.", ok ? "success" : "error");
  siteContentDraft = null;
}

/* ---------------------------------------------------------------- */
/*  AUTH: BOOTSTRAP OWNER / LOGIN / LOGOUT                             */
/* ---------------------------------------------------------------- */
async function bootstrapOwner() {
  const name = document.getElementById("bo-name").value.trim();
  const email = document.getElementById("bo-email").value.trim();
  const password = document.getElementById("bo-password").value;
  const errEl = document.getElementById("bo-error");
  errEl.textContent = "";
  if (!name || !email || !password) { errEl.textContent = "All fields are required."; return; }
  if (password.length < 6) { errEl.textContent = "Password must be at least 6 characters."; return; }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await fsSetAccount(cred.user.uid, {
      role: "owner", name, email, avatar: "", bio: "Craftland map creator.\nBrowse, copy, play.",
      links: [], profilePublic: true, banned: false,
    });
    showToast("Owner account created!");
    navigate("home");
  } catch (e) {
    errEl.textContent = e.message || "Couldn't create the owner account.";
  }
}
async function ownerLogin() {
  const email = document.getElementById("ol-email").value.trim();
  const password = document.getElementById("ol-password").value;
  const errEl = document.getElementById("ol-error");
  errEl.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, email, password);
    navigate("ownerPanel");
  } catch (e) {
    errEl.textContent = "Wrong email or password.";
  }
}
async function adminLogin() {
  const accId = document.getElementById("al-account").value;
  const password = document.getElementById("al-password").value;
  const errEl = document.getElementById("al-error");
  errEl.textContent = "";
  const acc = state.accounts.find((a) => a.id === accId);
  if (!acc) { errEl.textContent = "Select an admin account."; return; }
  if (acc.banned) { errEl.textContent = "This admin account has been banned."; return; }
  try {
    await signInWithEmailAndPassword(auth, acc.email, password);
    navigate("adminPanel");
  } catch (e) {
    errEl.textContent = "Wrong password.";
  }
}
async function forgotPassword(kind) {
  const emailEl = document.getElementById(kind === "owner" ? "ol-email" : "al-password");
  let email = kind === "owner" ? document.getElementById("ol-email").value.trim() : null;
  if (kind === "admin") {
    const accId = document.getElementById("al-account").value;
    const acc = state.accounts.find((a) => a.id === accId);
    email = acc ? acc.email : null;
  }
  if (!email) { showToast("Enter your email first.", "error"); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    showToast("Password reset email sent.");
  } catch (e) {
    showToast(e.message || "Couldn't send reset email.", "error");
  }
}
async function logout() {
  await signOut(auth);
  navigate("home");
}

/* ---------------------------------------------------------------- */
/*  GLOBAL CLICK DELEGATION                                           */
/* ---------------------------------------------------------------- */
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id;

  switch (action) {
    case "nav": navigate(id); break;
    case "open-menu": state.ui.menuOpen = true; render(); break;
    case "close-menu": state.ui.menuOpen = false; render(); break;
    case "open-explore": exploreQuery = ""; exploreCategory = null; state.ui.exploreOpen = true; render(); break;
    case "close-explore": state.ui.exploreOpen = false; render(); break;
    case "set-explore-category": exploreCategory = id; render(); break;
    case "clear-explore-category": exploreCategory = null; render(); break;
    case "toggle-like": toggleLike(id); break;
    case "share-post": handleSharePost(id); break;
    case "open-post": state.ui.exploreOpen = false; state.ui.menuOpen = false; openPost(id); break;
    case "open-profile": state.ui.exploreOpen = false; state.ui.menuOpen = false; openProfile(id); break;
    case "set-profile-tab": profileTab = id; render(); break;
    case "copy-map-code": handleCopyMapCode(id); break;
    case "scroll-top": window.scrollTo({ top: 0, behavior: "smooth" }); break;

    case "set-admin-tab": state.ui.adminTab = id; render(); break;
    case "admin-new-post": startNewPost("admin"); break;
    case "admin-edit-post": startEditPost(id, "admin"); break;
    case "admin-delete-post": deletePost(id); break;
    case "admin-toggle-hide": toggleHidePost(id); break;

    case "set-owner-tab": state.ui.ownerTab = id; adsDraft = null; siteContentDraft = null; render(); break;
    case "owner-new-post": startNewPost("owner"); break;
    case "owner-edit-post": startEditPost(id, "owner"); break;
    case "owner-delete-post": deletePost(id); break;
    case "owner-toggle-hide": toggleHidePost(id); break;
    case "owner-approve-post": approvePost(id); break;
    case "owner-reject-post": rejectPost(id); break;
    case "owner-add-admin": ownerAddAdmin(); break;
    case "owner-remove-admin": ownerRemoveAdmin(id); break;
    case "owner-toggle-ban": ownerToggleBan(id); break;
    case "owner-open-reset": ownerOpenReset(id); break;
    case "owner-send-reset": ownerSendReset(id); break;
    case "owner-save-ads": ownerSaveAds(); break;
    case "owner-save-site-content": ownerSaveSiteContent(); break;

    case "pe-pick-category": if (postEditorDraft) { postEditorDraft.category = id; render(); } break;
    case "pe-upload-thumb": document.getElementById("pe-thumbnail-file")?.click(); break;
    case "pe-save": savePostEditor(); break;
    case "pe-cancel": cancelPostEdit(); break;

    case "pf-upload-avatar": document.getElementById("pf-avatar-file")?.click(); break;
    case "pf-add-link": addLinkRow(); break;
    case "pf-remove-link": removeLinkRow(+id); break;
    case "pf-save": saveProfileEditor(); break;

    case "toggle-field": {
      const checked = el.dataset.checked === "1";
      if (id.startsWith("ads.")) {
        if (!adsDraft) adsDraft = { ...state.adSettings };
        adsDraft[id.slice(4)] = !checked;
      } else if (id === "profilePublic") {
        if (profileEditorDraft) profileEditorDraft.profilePublic = !checked;
      }
      render();
      break;
    }

    case "bootstrap-owner": bootstrapOwner(); break;
    case "owner-login": ownerLogin(); break;
    case "admin-login": adminLogin(); break;
    case "forgot-password": forgotPassword(id); break;
    case "logout": logout(); break;

    case "confirm-cancel": closeConfirm(); break;
    case "confirm-ok": {
      const c = state.ui.confirm;
      closeConfirm();
      if (c && c.onConfirm) c.onConfirm();
      break;
    }
  }
});

// Populate the profile/admin editors with a working draft whenever their
// screen becomes active without an explicit "start edit" click (e.g. first
// time opening My Profile / Owner Profile tabs).
document.addEventListener("click", (e) => {
  const el = e.target.closest('[data-action="set-admin-tab"], [data-action="set-owner-tab"]');
  if (!el) return;
  const goingToProfile = el.dataset.id === "profile";
  if (goingToProfile) {
    const account = state.session ? state.session.account : null;
    if (account) profileEditorDraft = JSON.parse(JSON.stringify({ links: [], ...account }));
  } else {
    profileEditorDraft = null;
  }
});

/* ---------------------------------------------------------------- */
/*  BOOT                                                              */
/* ---------------------------------------------------------------- */
render();
