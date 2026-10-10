/* ================================================================
   CraftVerse — Free Fire Craftland Map sharing app
   Vanilla JS + Firebase (Auth + Firestore). No build step needed.
   ================================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup,
  setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

/* ---------------------------------------------------------------- */
/*  ICONS (hand-drawn monoline SVGs)                                */
/* ---------------------------------------------------------------- */
const svgIcon = (paths, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const brandIcon = (paths, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 640 640" fill="currentColor">${paths}</svg>`;
function resizeIcon(svgStr, size) {
  return svgStr.replace(/width="\d+(\.\d+)?"/, `width="${size}"`).replace(/height="\d+(\.\d+)?"/, `height="${size}"`);
}
const fillIcon = (viewBox, paths, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="${viewBox}" fill="currentColor">${paths}</svg>`;

const ICONS = {
  heart: (f) => svgIcon(`<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" ${f ? 'fill="currentColor"' : ""}/>`),
  search: () => fillIcon("0 0 24 24", `<path clip-rule="evenodd" d="M14.1018 16.3007C12.8835 17.2777 11.3369 17.8621 9.6537 17.8621C5.72399 17.8621 2.53833 14.6764 2.53833 10.7467C2.53833 6.81701 5.72399 3.63135 9.6537 3.63135C13.5834 3.63135 16.7691 6.81701 16.7691 10.7467C16.7691 12.4471 16.1726 14.0082 15.1775 15.2322L15.9161 15.9708L14.844 17.0429L14.1018 16.3007ZM14.502 10.7466C14.502 13.4242 12.3313 15.5948 9.65371 15.5948C6.9761 15.5948 4.80546 13.4242 4.80546 10.7466C4.80546 8.06896 6.9761 5.89833 9.65371 5.89833C12.3313 5.89833 14.502 8.06896 14.502 10.7466Z" fill-rule="evenodd"/><path clip-rule="evenodd" d="M18.7113 21.0375C18.5768 21.172 18.3587 21.1717 18.2246 21.0368L14.7097 17.5C14.5763 17.3657 14.5766 17.1487 14.7105 17.0148L15.8997 15.8256C16.0342 15.6911 16.2524 15.6915 16.3864 15.8264L19.9013 19.3631C20.0348 19.4974 20.0345 19.7144 19.9006 19.8483L18.7113 21.0375Z" fill-rule="evenodd"/><path d="M22.8805 4.7869C22.2731 5.03857 21.7882 5.26507 21.4258 5.46641C21.0667 5.66775 20.7866 5.8674 20.5852 6.06539C20.3872 6.26337 20.1876 6.54188 19.9862 6.90093C19.7849 7.25998 19.555 7.75158 19.2967 8.37572H19.0903C18.8286 7.75158 18.597 7.25998 18.3957 6.90093C18.1943 6.54188 17.9964 6.26337 17.8017 6.06539C17.6004 5.8674 17.3185 5.66775 16.9561 5.46641C16.5971 5.26507 16.1122 5.03857 15.5015 4.7869V4.58053C16.1155 4.32886 16.6021 4.10235 16.9612 3.90102C17.3236 3.69968 17.6038 3.50002 17.8017 3.30204C17.9964 3.10406 18.1943 2.82554 18.3957 2.46649C18.597 2.10744 18.8286 1.61584 19.0903 0.991699H19.2967C19.555 1.61584 19.7849 2.10744 19.9862 2.46649C20.1876 2.82554 20.3872 3.10406 20.5852 3.30204C20.7798 3.50002 21.0567 3.69968 21.4157 3.90102C21.7781 4.10235 22.2664 4.32886 22.8805 4.58053V4.7869Z"/>`),
  home: () => fillIcon("0 0 50 50", `<path d="M23.98 2.394 35.49 10.456C37.042 11.544 39 14.684 39 17.197V30.76C39 35.308 35.31 39 30.77 39H9.23C4.692 39 1 35.291 1 30.739V16.937c0-2.3 1.576-5.29 3.192-6.492L14.2 2.625c2.67-2.07 7.004-2.178 9.78-.23ZM20 34.5A2.49 2.49 0 0 0 22.5 32v-6A2.49 2.49 0 0 0 20 23.5 2.49 2.49 0 0 0 17.5 26v6a2.49 2.49 0 0 0 2.5 2.5Z"/>`),
  globe: () => svgIcon(`<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>`),
  chevronRight: () => svgIcon(`<polyline points="9 18 15 12 9 6"/>`),
  x: () => svgIcon(`<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>`),
  arrowLeft: () => svgIcon(`<path d="m15 18-6-6 6-6"/>`),
  share: () => svgIcon(`<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>`),
  navHome: (size = 18) => fillIcon("0 0 256 256", `<path d="M224,120v96a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V164a4,4,0,0,0-4-4H108a4,4,0,0,0-4,4v52a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V120a16,16,0,0,1,4.69-11.31l80-80a16,16,0,0,1,22.62,0l80,80A16,16,0,0,1,224,120Z"/>`, size),
  plus: () => svgIcon(`<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`),
  navExplore: (size = 18) => fillIcon("0 0 640 640", `<path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM370.7 389.1L226.4 444.6C207 452.1 187.9 433 195.4 413.6L250.9 269.3C254.2 260.8 260.8 254.2 269.3 250.9L413.6 195.4C433 187.9 452.1 207 444.6 226.4L389.1 370.7C385.9 379.2 379.2 385.8 370.7 389.1zM352 320C352 302.3 337.7 288 320 288C302.3 288 288 302.3 288 320C288 337.7 302.3 352 320 352C337.7 352 352 337.7 352 320z"/>`, size),
  navFavorite: (size = 18) => fillIcon("0 0 640 640", `<path d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"/>`, size),
  navProfile: (size = 18) => fillIcon("0 0 32 32", `<path d="M26.1137 20.6693C26.6674 23.8341 24.4618 26.132 21.3885 26.6484C18.4196 27.1469 13.5818 27.1469 10.6138 26.6484C7.5397 26.132 5.3341 23.8349 5.88853 20.6702C6.35798 17.9846 8.63481 16.3107 11.4143 16.4548C13.4451 16.56 14.6923 16.8239 16.1371 16.8239C17.5981 16.8239 18.5718 16.5592 20.588 16.4548C23.3674 16.3091 25.6443 17.9838 26.1137 20.6693ZM16.1007 4.66211C19.021 4.66211 21.3885 7.02959 21.3885 9.9499C21.3885 12.8702 19.021 15.2377 16.1007 15.2377C13.1804 15.2377 10.8121 12.8694 10.8121 9.9499C10.8121 7.0304 13.1796 4.66211 16.1007 4.66211Z"/>`, size),
  plusFilled: () => fillIcon("0 0 24 24", `<circle cx="12" cy="12" r="10"/><path d="M11 7h2v4h4v2h-4v4h-2v-4H7v-2h4V7Z" fill="#0A0E17"/>`),
  google: () => `<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.9 4.5 4 13.4 4 24.5s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12.5 24 12.5c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.6 0-14.2 4.3-17.7 10.2z"/><path fill="#4CAF50" d="M24 44.5c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4c-2 1.4-4.6 2.3-7.7 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.7 40.1 16.3 44.5 24 44.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.4C41.5 36.4 44 30.9 44 24.5c0-1.3-.1-2.7-.4-4z"/></svg>`,
  apple: () => `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.02.63-2.66 1.38-.56.64-1.05 1.7-0.92 2.73 1.04.08 2.07-.53 2.66-1.24z"/></svg>`,
  trash: () => svgIcon(`<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`),
  pencil: () => svgIcon(`<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>`),
  save: () => svgIcon(`<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>`),
  eye: () => svgIcon(`<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>`),
  eyeOff: () => svgIcon(`<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>`),
  copy: () => svgIcon(`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`),
  externalLink: () => svgIcon(`<path d="M14 4h6v6"/><line x1="20" y1="4" x2="11" y2="13"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/>`),
  arrowUpRight: (size = 18) => svgIcon(`<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>`, size),
  check: () => svgIcon(`<polyline points="20 6 9 17 4 12"/>`),
  whatsapp: () => svgIcon(`<path d="M3 21l1.65-4.95A9 9 0 1 1 8.9 19.4L3 21Z"/><path d="M8.5 8.7c.1-.6.7-1 1.3-.9.4 0 .7.3.9.7l.5 1.2c.1.3.1.6-.1.9l-.5.6c-.1.2-.1.4 0 .6.4.8 1.6 2 2.4 2.4.2.1.4.1.6 0l.6-.5c.3-.2.6-.2.9-.1l1.2.5c.4.2.7.5.7.9.1.6-.3 1.2-.9 1.3-1.9.4-4.5-.6-6.2-2.3-1.7-1.7-2.7-4.3-2.3-6.2Z"/>`),
  camera: () => svgIcon(`<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>`),
  checkCircle: () => svgIcon(`<circle cx="12" cy="12" r="9"/><polyline points="8 12.5 11 15.5 16 9"/>`),
  clock: () => svgIcon(`<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`),
  alertCircle: () => svgIcon(`<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16.5" x2="12" y2="16.5"/>`),
  sparkles: () => svgIcon(`<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>`),
  megaphone: () => svgIcon(`<path d="M3 11v2a2 2 0 0 0 2 2h1l2 5h2l-1-5h4l6 4V7l-6 4H6a2 2 0 0 0-2 2z"/>`),
  chevronUp: () => svgIcon(`<polyline points="6 15 12 9 18 15"/>`),
  chevronDown: () => svgIcon(`<path d="m6 9 6 6 6-6"/>`),
  ban: () => svgIcon(`<path d="M2 21a8 8 0 0 1 11.873-7"/><circle cx="10" cy="8" r="5"/><path d="m17 17 5 5"/><path d="m22 17-5 5"/>`),
  unban: () => svgIcon(`<path d="M2 21a8 8 0 0 1 13.292-6"/><circle cx="10" cy="8" r="5"/><path d="m16 19 2 2 4-4"/>`),
  layoutDashboard: () => svgIcon(`<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>`),
  list: () => svgIcon(`<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M14 4h7"/><path d="M14 9h7"/><path d="M14 15h7"/><path d="M14 20h7"/>`),
  users: () => svgIcon(`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>`),
  settings: () => svgIcon(`<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>`),
  upload: () => svgIcon(`<path d="M12 16V4"/><polyline points="7 9 12 4 17 9"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>`),
  download: () => svgIcon(`<path d="M12 4v12"/><polyline points="7 11 12 16 17 11"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>`),
  close: () => svgIcon(`<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`),
  menuBars: (size = 18) => fillIcon("0 0 640 640", `<path d="M64 160C64 142.3 78.3 128 96 128L480 128C497.7 128 512 142.3 512 160C512 177.7 497.7 192 480 192L96 192C78.3 192 64 177.7 64 160zM128 320C128 302.3 142.3 288 160 288L544 288C561.7 288 576 302.3 576 320C576 337.7 561.7 352 544 352L160 352C142.3 352 128 337.7 128 320zM512 480C512 497.7 497.7 512 480 512L96 512C78.3 512 64 497.7 64 480C64 462.3 78.3 448 96 448L480 448C497.7 448 512 462.3 512 480z"/>`, size),
  image: () => svgIcon(`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><polyline points="4 17 9 12 13 16 16 13 20 17"/>`),
  fileText: () => svgIcon(`<path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>`),
  logOut: () => svgIcon(`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`),
  notif: () => fillIcon("0 0 18 18", `<path d="M10.6266 14.9134C10.7029 15.0802 10.6571 15.2765 10.5144 15.3941C9.62395 16.0755 8.37728 16.0755 7.4868 15.3941C7.34511 15.277 7.29935 15.0817 7.37462 14.9154C7.4499 14.7491 7.62799 14.6517 7.81101 14.6773C8.59965 14.7826 9.39862 14.7826 10.1873 14.6773C10.3713 14.6502 10.5508 14.7467 10.6271 14.9134H10.6266ZM9.09999 2.06348C11.5658 2.06298 13.6646 3.82919 14.0473 6.22709L15.0647 11.7968C15.1803 12.4053 14.7912 12.9967 14.1797 13.1413C10.7752 13.9826 7.21227 13.9826 3.80778 13.1413H3.81467C3.20462 12.9952 2.81842 12.4039 2.93649 11.7968L3.95046 6.22709C4.33469 3.82869 6.43495 2.06249 8.90123 2.06348H9.09999Z"/>`),
  instagram: (size = 20) => `<svg width="${size}" height="${size}" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/></svg>`,
  telegram: (size = 20) => `<svg fill="currentColor" height="${size}" width="${size}" viewBox="0 0 24 24"><path d="M18.384,22.779c0.322,0.228 0.737,0.285 1.107,0.145c0.37,-0.141 0.642,-0.457 0.724,-0.84c0.869,-4.084 2.977,-14.421 3.768,-18.136c0.06,-0.28 -0.04,-0.571 -0.26,-0.758c-0.22,-0.187 -0.525,-0.241 -0.797,-0.14c-4.193,1.552 -17.106,6.397 -22.384,8.35c-0.335,0.124 -0.553,0.446 -0.542,0.799c0.012,0.354 0.25,0.661 0.593,0.764c2.367,0.708 5.474,1.693 5.474,1.693c0,0 1.452,4.385 2.209,6.615c0.095,0.28 0.314,0.5 0.603,0.576c0.288,0.075 0.596,-0.004 0.811,-0.207c1.216,-1.148 3.096,-2.923 3.096,-2.923c0,0 3.572,2.619 5.598,4.062Zm-11.01,-8.677l1.679,5.538l0.373,-3.507c0,0 6.487,-5.851 10.185,-9.186c0.108,-0.098 0.123,-0.262 0.033,-0.377c-0.089,-0.115 -0.253,-0.142 -0.376,-0.064c-4.286,2.737 -11.894,7.596 -11.894,7.596Z"/></svg>`,
  discord: (size = 20) => `<svg width="${size}" height="${size}" fill="currentColor" viewBox="0 0 640 640"><path d="M524.5 133.8C524.3 133.5 524.1 133.2 523.7 133.1C485.6 115.6 445.3 103.1 404 96C403.6 95.9 403.2 96 402.9 96.1C402.6 96.2 402.3 96.5 402.1 96.9C396.6 106.8 391.6 117.1 387.2 127.5C342.6 120.7 297.3 120.7 252.8 127.5C248.3 117 243.3 106.8 237.7 96.9C237.5 96.6 237.2 96.3 236.9 96.1C236.6 95.9 236.2 95.9 235.8 95.9C194.5 103 154.2 115.5 116.1 133C115.8 133.1 115.5 133.4 115.3 133.7C39.1 247.5 18.2 358.6 28.4 468.2C28.4 468.5 28.5 468.7 28.6 469C28.7 469.3 28.9 469.4 29.1 469.6C73.5 502.5 123.1 527.6 175.9 543.8C176.3 543.9 176.7 543.9 177 543.8C177.3 543.7 177.7 543.4 177.9 543.1C189.2 527.7 199.3 511.3 207.9 494.3C208 494.1 208.1 493.8 208.1 493.5C208.1 493.2 208.1 493 208 492.7C207.9 492.4 207.8 492.2 207.6 492.1C207.4 492 207.2 491.8 206.9 491.7C191.1 485.6 175.7 478.3 161 469.8C160.7 469.6 160.5 469.4 160.3 469.2C160.1 469 160 468.6 160 468.3C160 468 160 467.7 160.2 467.4C160.4 467.1 160.5 466.9 160.8 466.7C163.9 464.4 167 462 169.9 459.6C170.2 459.4 170.5 459.2 170.8 459.2C171.1 459.2 171.5 459.2 171.8 459.3C268 503.2 372.2 503.2 467.3 459.3C467.6 459.2 468 459.1 468.3 459.1C468.6 459.1 469 459.3 469.2 459.5C472.1 461.9 475.2 464.4 478.3 466.7C478.5 466.9 478.7 467.1 478.9 467.4C479.1 467.7 479.1 468 479.1 468.3C479.1 468.6 479 468.9 478.8 469.2C478.6 469.5 478.4 469.7 478.2 469.8C463.5 478.4 448.2 485.7 432.3 491.6C432.1 491.7 431.8 491.8 431.6 492C431.4 492.2 431.3 492.4 431.2 492.7C431.1 493 431.1 493.2 431.1 493.5C431.1 493.8 431.2 494 431.3 494.3C440.1 511.3 450.1 527.6 461.3 543.1C461.5 543.4 461.9 543.7 462.2 543.8C462.5 543.9 463 543.9 463.3 543.8C516.2 527.6 565.9 502.5 610.4 469.6C610.6 469.4 610.8 469.2 610.9 469C611 468.8 611.1 468.5 611.1 468.2C623.4 341.4 590.6 231.3 524.2 133.7zM222.5 401.5C193.5 401.5 169.7 374.9 169.7 342.3C169.7 309.7 193.1 283.1 222.5 283.1C252.2 283.1 275.8 309.9 275.3 342.3C275.3 375 251.9 401.5 222.5 401.5zM417.9 401.5C388.9 401.5 365.1 374.9 365.1 342.3C365.1 309.7 388.5 283.1 417.9 283.1C447.6 283.1 471.2 309.9 470.7 342.3C470.7 375 447.5 401.5 417.9 401.5z"/></svg>`,
  facebook: (size = 20) => `<svg fill="currentColor" height="${size}" viewBox="0 0 24 24" width="${size}"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.17 2.1 15.95 2 14.66 2 11.97 2 10 3.66 10 6.7v2.8H7v4h3V22h4v-8.5Z"/></svg>`,
  tiktok: (size = 20) => `<svg fill="currentColor" height="${size}" viewBox="0 0 16 16" width="${size}"><path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/></svg>`,
  youtube: (size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 333333 333333" fill="currentColor"><path d="M329930 100020s-3254-22976-13269-33065c-12691-13269-26901-13354-33397-14124-46609-3396-116614-3396-116614-3396h-122s-69973 0-116608 3396c-6522 793-20712 848-33397 14124C6501 77044 3316 100020 3316 100020S-1 126982-1 154001v25265c0 26962 3315 53979 3315 53979s3254 22976 13207 33082c12685 13269 29356 12838 36798 14254 26685 2547 113354 3315 113354 3315s70065-124 116675-3457c6522-770 20706-848 33397-14124 10021-10089 13269-33090 13269-33090s3319-26962 3319-53979v-25263c-67-26962-3384-53979-3384-53979l-18 18-2-2zM132123 209917v-93681l90046 46997-90046 46684z"/></svg>`,
  twitter: (size = 20) => `<svg fill="currentColor" height="${size}" viewBox="0 0 24 24" width="${size}"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
};

/* ---------------------------------------------------------------- */
/*  UNIFORM 34x34px BUTTON SYSTEM                                   */
/* ---------------------------------------------------------------- */
function backBtnHtml(action = "nav", id = "home") {
  return `<button data-action="${action}" data-id="${escAttr(id)}" aria-label="Back" class="w-[34px] h-[34px] rounded-[10px] border border-bd bg-panelalt hover:bg-panelhover text-tmuted hover:text-tprimary flex items-center justify-center flex-shrink-0 transition-all shadow-sm active:scale-95">
    ${svgIcon('<path d="m15 18-6-6 6-6"/>', 18)}
  </button>`;
}
function closeBtnHtml(action, id = "") {
  return `<button data-action="${action}" data-id="${escAttr(id)}" aria-label="Close" class="w-[34px] h-[34px] rounded-[10px] border border-bd bg-panelalt hover:bg-panelhover text-tmuted hover:text-tprimary flex items-center justify-center flex-shrink-0 transition-all shadow-sm active:scale-95">
    ${svgIcon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', 18)}
  </button>`;
}

/* ---------------------------------------------------------------- */
/*  CONSTANTS & PLATFORMS                                           */
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
  privacy: "We only store what's needed to run CraftVerse: your account info, submitted maps, and favorites. We don't sell your data.\n\nContact the owner if you'd like your account or data removed.",
  contact: "Have a question, feedback, or a DMCA request? Reach out through the official social links in the footer, or the creator profile links on this site.",
};

const DEFAULT_AD_SETTINGS = {
  adsEnabled: true, bannerEnabled: true, nativeEnabled: true, postViewEnabled: true,
  nativeFrequency: 4,
  postViewAdType: "image",
  postViewAdImage: "",
  postViewAdLink: "",
  postViewAdCode: "",
};

const DEFAULT_BRANDING = {
  siteName: "CraftVerse",
  logo: "https://i.postimg.cc/8PBXwcSh/file-000000006544720bad38bb78a9528ad6.png",
  footerLogo: "https://i.postimg.cc/NMqRW863/file-000000001f307207805497354cbb729f.png",
  headerTagline: "FreeFire Craftland Community",
  footerTagline: "Craftland map codes, previews & tutorials from the community.",
  categoryMode: "all",
  selectedCategories: [],
  socialEnabled: true,
  socialLinks: [
    { id: "s1", label: "YouTube Channel", url: "https://youtube.com", icon: "youtube", enabled: true },
    { id: "s2", label: "Discord Server", url: "https://discord.gg", icon: "discord", enabled: true },
    { id: "s3", label: "Telegram Community", url: "https://t.me", icon: "telegram", enabled: true },
    { id: "s4", label: "Instagram", url: "https://instagram.com", icon: "instagram", enabled: true },
  ],
  bannerSlides: [],
  showSignIn: true,
  showLanguage: true,
  showNotifications: true,
  exploreTrendingEnabled: true,
  exploreCategoryEnabled: true,
  footerLinksEnabled: true,
  footerPages: { about: true, terms: true, dmca: true, privacy: true, contact: true },
  footerCustomLinks: [],
  footerSocialDesign: "design2",
};

const LINK_ICON_KEYS = { discord: "discord", twitter: "twitter", youtube: "youtube", facebook: "facebook", telegram: "telegram", instagram: "instagram", tiktok: "tiktok", other: "externalLink" };
const LINK_PLATFORMS = [
  ["discord", "Discord"], ["twitter", "X / Twitter"], ["youtube", "YouTube"],
  ["facebook", "Facebook"], ["telegram", "Telegram"], ["instagram", "Instagram"], ["tiktok", "TikTok"], ["other", "Others"]
];

const PLATFORM_META = {
  youtube:   { name: "YouTube",     color: "#FF0033", bg: "rgba(255, 0, 51, 0.12)",    border: "rgba(255, 0, 51, 0.28)" },
  discord:   { name: "Discord",     color: "#5865F2", bg: "rgba(88, 101, 242, 0.12)",  border: "rgba(88, 101, 242, 0.28)" },
  telegram:  { name: "Telegram",    color: "#229ED9", bg: "rgba(34, 158, 217, 0.12)",  border: "rgba(34, 158, 217, 0.28)" },
  instagram: { name: "Instagram",   color: "#E1306C", bg: "rgba(225, 48, 108, 0.12)",  border: "rgba(225, 48, 108, 0.28)" },
  facebook:  { name: "Facebook",    color: "#1877F2", bg: "rgba(24, 119, 242, 0.12)",  border: "rgba(24, 119, 242, 0.28)" },
  tiktok:    { name: "TikTok",      color: "#00F2FE", bg: "rgba(0, 242, 254, 0.12)",   border: "rgba(0, 242, 254, 0.28)" },
  twitter:   { name: "X / Twitter", color: "#F3F5F9", bg: "rgba(243, 245, 249, 0.10)", border: "rgba(243, 245, 249, 0.22)" },
  other:     { name: "Web Link",    color: "#3E8EFF", bg: "rgba(62, 142, 255, 0.12)",  border: "rgba(62, 142, 255, 0.28)" },
};

function detectPlatformKey(url = "", fallback = "other") {
  const u = String(url).toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("t.me") || u.includes("telegram")) return "telegram";
  if (u.includes("discord")) return "discord";
  if (u.includes("facebook.com") || u.includes("fb.com")) return "facebook";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  return fallback;
}
function sanitizeUrl(url) {
  const u = String(url || "").trim();
  if (/^(https?:|mailto:)/i.test(u)) return u;
  return "#";
}
function modernIconBadgeHtml(platformKey, size = 42) {
  const meta = PLATFORM_META[platformKey] || PLATFORM_META.other;
  const iconFn = ICONS[LINK_ICON_KEYS[platformKey] || "externalLink"];
  const iconSvg = iconFn ? iconFn(Math.round(size * 0.48)) : ICONS.externalLink();
  return `<div class="relative flex items-center justify-center flex-shrink-0 rounded-[12px] transition-all duration-200"
    style="width:${size}px;height:${size}px;background:${meta.bg};border:1px solid ${meta.border};color:${meta.color};box-shadow:0 4px 14px ${meta.bg};">
    ${iconSvg}
  </div>`;
}
function modernLinkCardHtml({ url, title, platformKey, subtitle }) {
  const safeUrl = sanitizeUrl(url);
  const meta = PLATFORM_META[platformKey] || PLATFORM_META.other;
  const subText = subtitle || meta.name;
  return `<a href="${escAttr(safeUrl)}" target="_blank" rel="noopener noreferrer"
    class="group flex items-center gap-3.5 bg-panel border border-bd hover:border-accent/40 rounded-2xl p-3 no-underline transition-all duration-200 active:scale-[0.98] hover:bg-panelhover">
    ${modernIconBadgeHtml(platformKey, 42)}
    <div class="flex-1 min-w-0">
      <div class="font-sora font-semibold text-[14.5px] text-tprimary group-hover:text-accent transition-colors truncate">${esc(title)}</div>
      <div class="font-inter text-[11px] text-tfaint truncate mt-0.5">${esc(subText)}</div>
    </div>
    <div class="w-8 h-8 rounded-full border border-bd bg-panelalt flex items-center justify-center text-tfaint group-hover:text-tprimary group-hover:border-accent/40 group-hover:bg-accent/15 transition-all flex-shrink-0">
      ${ICONS.arrowUpRight(14)}
    </div>
  </a>`;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_STORED_IMAGE_BYTES = 700 * 1024;

/* ---------------------------------------------------------------- */
/*  STATE                                                           */
/* ---------------------------------------------------------------- */
const state = {
  accounts: [],
  posts: [],
  notifications: [],
  siteContent: DEFAULT_SITE_CONTENT,
  adSettings: DEFAULT_AD_SETTINGS,
  branding: DEFAULT_BRANDING,
  likedIds: JSON.parse(localStorage.getItem("cv_liked") || "[]"),
  session: null,
  accountsLoaded: false,
  postsLoaded: false,
  brandingLoaded: false,
  authResolved: false,
  ui: {
    exploreOpen: false,
    photoSheetOpen: false,
    photoViewAccountId: null,
    switchAccountOpen: false,
    prefillIdentifier: "",
    linkSheetOpen: false,
    linkSheetIndex: -1,
    platformSheetOpen: false,
    genderSheetOpen: false,
    dobSheetOpen: false,
    sidebarCollapsed: (() => { try { return localStorage.getItem("cv_sidebar_collapsed") === "1"; } catch (e) { return false; } })(),
    toast: null,
    confirm: null,
    postOrigin: "home",
    ownerTab: "dashboard",
    authMode: "login",
  },
};

function toggleLike(postId) {
  if (!(state.session && state.session.role === "admin")) { navigate("creatorAuth"); return; }
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

/* ---------------------------------------------------------------- */
/*  FIRESTORE LIVE LISTENERS + AUTH STATE                           */
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

onSnapshot(doc(db, "branding", "main"), (d) => {
  if (d.exists()) state.branding = { ...DEFAULT_BRANDING, ...d.data() };
  state.brandingLoaded = true;
  render();
}, () => { state.brandingLoaded = true; });

let unsubNotifications = null;
onAuthStateChanged(auth, async (user) => {
  if (unsubNotifications) { unsubNotifications(); unsubNotifications = null; }
  if (user) {
    try {
      const snap = await getDoc(doc(db, "accounts", user.uid));
      state.session = snap.exists() ? { uid: user.uid, role: snap.data().role, account: { id: user.uid, ...snap.data() } } : { uid: user.uid, role: null, account: null };
      if (state.session.role === "admin" && state.session.account) saveKnownAccount(state.session.account);
      const nq = query(collection(db, "notifications"), where("uid", "==", user.uid), orderBy("createdAt", "desc"), limit(30));
      unsubNotifications = onSnapshot(nq, (nsnap) => {
        state.notifications = nsnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        render();
      }, () => {});
    } catch (e) {
      state.session = null;
    }
  } else {
    state.session = null;
    state.notifications = [];
  }
  state.authResolved = true;
  render();
});

async function addNotification(uid, type, title, message) {
  try {
    await setDoc(doc(collection(db, "notifications")), { uid, type, title, message, read: false, createdAt: serverTimestamp() });
  } catch (e) {}
}
function getKnownAccounts() {
  try { return JSON.parse(localStorage.getItem("cv_known_accounts") || "[]"); } catch (e) { return []; }
}
function saveKnownAccount(account) {
  try {
    let list = getKnownAccounts().filter((a) => a.id !== account.id);
    list.unshift({ id: account.id, name: account.name, avatar: account.avatar || "", identifier: account.username || account.email });
    localStorage.setItem("cv_known_accounts", JSON.stringify(list.slice(0, 5)));
  } catch (e) {}
}

/* ---------------------------------------------------------------- */
/*  FIRESTORE CRUD HELPERS                                          */
/* ---------------------------------------------------------------- */
async function fsSetAccount(uid, data) {
  try { await setDoc(doc(db, "accounts", uid), data, { merge: true }); return true; } catch (e) { console.error(e); return false; }
}
async function fsSetPost(id, data) {
  try { await setDoc(doc(db, "posts", id), data, { merge: true }); return true; } catch (e) { console.error(e); return false; }
}
async function fsDeletePost(id) {
  try { await deleteDoc(doc(db, "posts", id)); return true; } catch (e) { console.error(e); return false; }
}
async function fsSaveSiteContent(data) {
  try { await setDoc(doc(db, "site-content", "main"), data, { merge: true }); return true; } catch (e) { console.error(e); return false; }
}
async function fsSaveAdSettings(data) {
  try { await setDoc(doc(db, "ad-settings", "main"), data, { merge: true }); return true; } catch (e) { console.error(e); return false; }
}
async function fsSaveBranding(data) {
  try { await setDoc(doc(db, "branding", "main"), data, { merge: true }); return true; } catch (e) { console.error(e); return false; }
}

function fileToCompressedDataUrl(file, targetMaxBytes = MAX_STORED_IMAGE_BYTES, maxDim = 1280) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let width = img.width, height = img.height;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.85;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length * 0.75 > targetMaxBytes && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Couldn't read that image."));
      img.src = reader.result;
    };
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
/*  UI BUILDING BLOCKS                                              */
/* ---------------------------------------------------------------- */
function avatarHtml(name, src, size = 40) {
  if (src) return `<img src="${escAttr(src)}" alt="${escAttr(name)}" class="rounded-full object-cover border border-bd flex-shrink-0" style="width:${size}px;height:${size}px;" />`;
  const [c1, c2] = gradientFor(name);
  const letter = name ? name.trim()[0].toUpperCase() : "?";
  return `<div class="rounded-full flex items-center justify-center flex-shrink-0 font-sora font-bold text-white shadow-inner" style="width:${size}px;height:${size}px;background:linear-gradient(135deg, ${c1}, ${c2});font-size:${size * 0.4}px;">${letter}</div>`;
}
function thumbPlaceholder() {
  return `<div class="w-full h-full flex items-center justify-center" style="background:linear-gradient(135deg, #1C2540, #131A2D);"><span class="opacity-40 text-tmuted">${ICONS.image()}</span></div>`;
}
function iconBtn({ action, id = "", active = false, extra = "", size = 34, radius = 10, icon }) {
  return `<button data-action="${action}" data-id="${escAttr(id)}" class="w-[${size}px] h-[${size}px] rounded-[${radius}px] border border-bd flex items-center justify-center flex-shrink-0 transition-all ${active ? "bg-coral/15 text-coral border-coral/30" : "bg-panelalt text-tmuted hover:text-tprimary hover:bg-panelhover"} ${extra}">${icon}</button>`;
}
function dangerIconBtn({ action, id = "", size = 34 }) {
  return `<button data-action="${action}" data-id="${escAttr(id)}" class="w-[${size}px] h-[${size}px] rounded-[10px] border flex items-center justify-center flex-shrink-0 transition-colors" style="background:rgba(255,93,108,.14);border-color:rgba(255,93,108,.3);color:#FF5D6C;">${ICONS.trash()}</button>`;
}
function primaryBtn({ action = "", id = "", label, icon = "", extra = "", type = "button" }) {
  return `<button type="${type}" data-action="${action}" data-id="${escAttr(id)}" class="rounded-xl text-white font-sora font-semibold text-sm px-4 py-3 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] ${extra}" style="background:linear-gradient(135deg, #3E8EFF, #7C5CFF);">${icon}${label}</button>`;
}
function ghostBtn({ action = "", id = "", label, icon = "", color = "", extra = "" }) {
  return `<button data-action="${action}" data-id="${escAttr(id)}" class="rounded-xl border border-bd bg-transparent font-sora font-semibold text-sm px-3.5 py-2.5 flex items-center justify-center gap-1.5 transition-colors hover:bg-panelhover ${extra}" style="color:${color || "#8A93AC"};">${icon}${label}</button>`;
}
function fieldWrap(label, inner) {
  return `<div class="mb-3.5"><div class="font-mono text-[11px] tracking-wide text-tfaint uppercase mb-1.5">${label}</div>${inner}</div>`;
}
const inputCls = "w-full bg-bgdeep border border-bd rounded-xl px-3.5 py-2.5 text-tprimary font-inter text-sm outline-none focus:border-accent transition-colors";

function passwordFieldHtml(id, placeholder = "", extraCls = "") {
  return `<div class="relative">
    <input id="${id}" type="password" class="${inputCls} ${extraCls}" style="padding-right:44px;" placeholder="${escAttr(placeholder)}" />
    <button type="button" data-action="toggle-password" data-id="${id}" class="absolute text-tmuted hover:text-tprimary" style="right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;">${ICONS.eye()}</button>
  </div>`;
}

function toggleHtml(id, checked, labelOn, labelOff) {
  return `<button data-action="toggle-field" data-id="${id}" data-checked="${checked ? "1" : "0"}" class="flex items-center gap-2.5">
    <span class="block rounded-full border toggle-track transition-colors" style="width:42px;height:24px;background:${checked ? "#34D399" : "#1C2540"};border-color:${checked ? "#34D399" : "#232D48"};position:relative;">
      <span class="block rounded-full bg-white toggle-knob transition-all" style="width:18px;height:18px;position:absolute;top:2px;left:${checked ? "21px" : "2px"};"></span>
    </span>
    <span class="font-inter text-[13px] text-tmuted">${checked ? labelOn : labelOff}</span>
  </button>`;
}
function statusBadge(status) {
  const approved = status === "approved";
  return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[10px] uppercase font-bold" style="background:${approved ? "rgba(52,211,153,.14)" : "rgba(251,191,36,.14)"};color:${approved ? "#34D399" : "#FBBF24"};">${approved ? ICONS.checkCircle() : ICONS.clock()} ${approved ? "Approved" : "Pending"}</span>`;
}
function categoryBadge(cat) {
  if (!cat) return "";
  return `<div class="absolute top-3 left-3 px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider text-tprimary shadow-md backdrop-blur-md" style="background:rgba(10,14,23,0.78);border:1px solid rgba(255,255,255,0.08);">${esc(cat)}</div>`;
}

function adSlot(variant = "native") {
  const s = state.adSettings;
  if (variant === "postview") {
    if (s.postViewAdType === "code" && s.postViewAdCode) {
      return `<div class="mb-4 rounded-2xl overflow-hidden" id="postview-ad-slot"></div>`;
    }
    if (s.postViewAdType === "image" && s.postViewAdImage) {
      const inner = `<img src="${escAttr(s.postViewAdImage)}" alt="Sponsored" class="w-full object-cover rounded-2xl mb-4" style="max-height:220px;" />`;
      return s.postViewAdLink ? `<a href="${escAttr(sanitizeUrl(s.postViewAdLink))}" target="_blank" rel="noopener noreferrer" class="block no-underline">${inner}</a>` : inner;
    }
    return `<div class="border border-dashed border-bd rounded-2xl px-4 py-5 mb-4 text-center bg-panelalt">
      <div class="font-mono text-[10px] text-tfaint uppercase tracking-wide mb-2.5">Sponsored</div>
      <div class="flex items-center justify-center gap-2.5">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#3E8EFF,#7C5CFF);">${ICONS.megaphone()}</div>
        <div class="text-left"><div class="font-sora font-bold text-[13px]">Ad space</div><div class="font-inter text-[11px] text-tmuted">Set this up in Site → Ads &amp; Layout</div></div>
      </div>
    </div>`;
  }
  return `<div class="border border-dashed border-bd rounded-2xl p-3.5 mb-4 bg-panelalt flex items-center gap-3">
    <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background:linear-gradient(135deg,#FF5D6C,#FF9B5D);">${ICONS.megaphone()}</div>
    <div class="min-w-0"><div class="font-mono text-[9px] text-tfaint uppercase tracking-wide">Sponsored</div><div class="font-sora font-bold text-[13px]">Native ad slot</div><div class="font-inter text-[11px] text-tmuted">Placed every few maps in the feed</div></div>
  </div>`;
}
function injectAdCode(container, html) {
  container.innerHTML = html;
  container.querySelectorAll("script").forEach((oldScript) => {
    const newScript = document.createElement("script");
    Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
    newScript.text = oldScript.textContent;
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}
function withAds(items, everyN) {
  const out = [];
  items.forEach((post, idx) => {
    out.push({ kind: "post", post });
    if (everyN > 0 && (idx + 1) % everyN === 0 && idx !== items.length - 1) out.push({ kind: "ad" });
  });
  return out;
}

/* ---------------------------------------------------------------- */
/*  BANNER SLIDER (RESPONSIVE HEIGHTS)                              */
/* ---------------------------------------------------------------- */
let bannerSlideIndex = 0;
function bannerSkeletonHtml() {
  return `<div class="mb-5 animate-pulse">
    <div class="w-full h-[160px] md:h-[280px] lg:h-[340px] rounded-3xl" style="background:#1C2540;"></div>
    <div class="flex justify-center gap-1.5 mt-3">
      <div class="rounded-full" style="width:18px;height:6px;background:#1C2540;"></div>
      <div class="rounded-full" style="width:6px;height:6px;background:#1C2540;"></div>
    </div>
  </div>`;
}
function bannerSliderHtml() {
  const slides = (state.branding.bannerSlides || []).filter((s) => s.image);
  if (slides.length === 0) {
    return `<div class="border border-dashed border-bd rounded-3xl p-6 mb-5 text-center bg-panelalt flex flex-col items-center justify-center h-[160px] md:h-[280px] lg:h-[340px]">
      <div class="font-mono text-[10px] text-tfaint uppercase tracking-wider mb-2">Featured Banner</div>
      <div class="font-sora font-bold text-base md:text-lg text-tprimary">Community Showcase</div>
      <div class="font-inter text-xs text-tmuted mt-1">Configure banner slides in Owner Dashboard → Site Settings</div>
    </div>`;
  }
  if (bannerSlideIndex >= slides.length) bannerSlideIndex = 0;
  const slide = slides[bannerSlideIndex];
  const img = `<img src="${escAttr(slide.image)}" alt="Banner" class="w-full h-[160px] md:h-[280px] lg:h-[340px] object-cover rounded-3xl shadow-xl transition-all duration-300" />`;
  const clickable = slide.link ? `<a href="${escAttr(sanitizeUrl(slide.link))}" target="_blank" rel="noopener noreferrer" class="block no-underline">${img}</a>` : img;
  const dots = slides.length > 1
    ? `<div class="flex justify-center gap-2 mt-3">${slides.map((_, i) => `<button data-action="set-banner-slide" data-id="${i}" class="rounded-full transition-all" style="width:${i === bannerSlideIndex ? "22px" : "6px"};height:6px;background:${i === bannerSlideIndex ? "#34D399" : "#232D48"};"></button>`).join("")}</div>`
    : "";
  return `<div id="banner-slider-touch" class="mb-5 relative">${clickable}${dots}</div>`;
}

let touchStartX = 0;
document.addEventListener("touchstart", (e) => {
  const el = e.target.closest("#banner-slider-touch");
  if (el) touchStartX = e.changedTouches[0].screenX;
}, { passive: true });
document.addEventListener("touchend", (e) => {
  const el = e.target.closest("#banner-slider-touch");
  if (!el) return;
  const dx = e.changedTouches[0].screenX - touchStartX;
  const slides = (state.branding.bannerSlides || []).filter((s) => s.image);
  if (slides.length < 2 || Math.abs(dx) < 40) return;
  bannerSlideIndex = dx < 0 ? (bannerSlideIndex + 1) % slides.length : (bannerSlideIndex - 1 + slides.length) % slides.length;
  render();
}, { passive: true });
setInterval(() => {
  const slides = (state.branding.bannerSlides || []).filter((s) => s.image);
  if (slides.length > 1 && parseHash().screen === "home") {
    bannerSlideIndex = (bannerSlideIndex + 1) % slides.length;
    render();
  }
}, 4500);

function esc(str) {
  return String(str ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
function escAttr(str) {
  return String(str ?? "").replace(/"/g, "&quot;");
}

/* ---------------------------------------------------------------- */
/*  HEADER & SUB-HEADER SYSTEM                                      */
/* ---------------------------------------------------------------- */
function headerLogoHtml(height = 34) {
  const b = state.branding;
  if (b.logo) return `<img src="${escAttr(b.logo)}" alt="${escAttr(b.siteName)}" class="object-contain flex-shrink-0 rounded-lg" style="height:${height}px;width:auto;max-width:160px;" />`;
  const letter = b.siteName ? b.siteName.trim()[0].toUpperCase() : "C";
  return `<div class="rounded-lg flex items-center justify-center font-sora font-extrabold text-white flex-shrink-0" style="width:${height}px;height:${height}px;background:linear-gradient(135deg,#3E8EFF,#7C5CFF);font-size:${height * 0.5}px;">${letter}</div>`;
}

function homeHeaderHtml() {
  const b = state.branding;
  if (!state.brandingLoaded || !state.authResolved) {
    return `<div id="site-header" class="sticky top-0 z-30 bg-[#0A0E17]/90 backdrop-blur-md border-b border-bd/40">
      <div class="flex items-center gap-2.5 h-[56px] px-4 animate-pulse">
        <div class="w-[34px] h-[34px] rounded-[10px] bg-[#1C2540]"></div>
        <div class="w-[34px] h-[34px] rounded-lg bg-[#1C2540]"></div>
        <div class="flex flex-col gap-1.5"><div class="w-24 h-3 rounded bg-[#1C2540]"></div><div class="w-32 h-2 rounded bg-[#1C2540]"></div></div>
        <div class="flex-1"></div>
        <div class="w-[34px] h-[34px] rounded-[10px] bg-[#1C2540]"></div>
      </div>
    </div>`;
  }
  const isLoggedInCreator = !!(state.session && state.session.role === "admin");
  const rightParts = [];
  if (isLoggedInCreator) {
    if (b.showLanguage !== false) {
      rightParts.push(`<button data-action="open-language" class="w-[34px] h-[34px] rounded-[10px] border border-bd bg-panelalt hover:bg-panelhover text-tmuted hover:text-tprimary flex items-center justify-center transition-colors">${resizeIcon(ICONS.globe(), 19)}</button>`);
    }
    if (b.showNotifications !== false) {
      rightParts.push(`<button data-action="nav" data-id="notifications" class="relative w-[34px] h-[34px] rounded-[10px] border border-bd bg-panelalt hover:bg-panelhover text-tmuted hover:text-tprimary flex items-center justify-center transition-colors">
        ${state.notifications.filter((n) => !n.read).length > 0 ? `<span class="absolute rounded-full bg-coral top-1.5 right-1.5 w-2 h-2 ring-2 ring-bgdeep"></span>` : ""}
        ${resizeIcon(ICONS.notif(), 18)}
      </button>`);
    }
  } else if (b.showSignIn !== false) {
    rightParts.push(`<button data-action="nav" data-id="creatorAuth" class="rounded-full font-sora font-semibold text-[13px] text-white px-4 py-1.5 shadow-md hover:opacity-90 active:scale-95 transition-all" style="background:linear-gradient(135deg,#3E8EFF,#7C5CFF);">Sign In</button>`);
  }

  return `<div id="site-header" class="sticky top-0 z-30 bg-[#0A0E17]/90 backdrop-blur-md border-b border-bd/40 transition-colors">
    <div class="flex items-center gap-3 h-[56px] px-4 md:px-6">
      <button data-action="toggle-sidebar" class="hidden md:flex w-[34px] h-[34px] rounded-[10px] border border-bd bg-panelalt hover:bg-panelhover text-tmuted hover:text-tprimary items-center justify-center flex-shrink-0 transition-colors">
        ${resizeIcon(ICONS.menuBars(), 18)}
      </button>
      <div data-action="nav" data-id="home" class="flex items-center gap-2.5 cursor-pointer select-none">
        ${headerLogoHtml(34)}
        <div class="flex flex-col justify-center leading-tight min-w-0">
          <div class="font-sora font-extrabold text-[16px] tracking-tight truncate">${esc(b.siteName)}</div>
          <div class="font-inter text-[10.5px] text-tmuted truncate">${esc(b.headerTagline)}</div>
        </div>
      </div>
      <div class="flex-1"></div>
      <div class="flex items-center gap-2 flex-shrink-0">${rightParts.join("")}</div>
    </div>
  </div>`;
}

function pageSubHeaderHtml(title, backAction = "nav", backId = "home", rightHtml = "") {
  return `<div class="flex items-center gap-3 px-4 md:px-6 py-3.5 mb-2">
    ${backBtnHtml(backAction, backId)}
    <div class="font-sora font-bold text-base md:text-lg text-tprimary flex-1 truncate">${esc(title)}</div>
    ${rightHtml}
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  SIDEBAR & NAVIGATION (DESKTOP & MOBILE)                         */
/* ---------------------------------------------------------------- */
function sidebarNavHtml(activeScreen) {
  const isLoggedInCreator = !!(state.session && state.session.role === "admin");
  const collapsed = !!state.ui.sidebarCollapsed;
  const gate = (id) => (isLoggedInCreator ? id : "creatorAuth");

  const items = [
    { action: "nav", id: "home", label: "Home", icon: ICONS.navHome(20), active: activeScreen === "home" },
    { action: "open-explore", id: "", label: "Explore", icon: ICONS.navExplore(20), active: state.ui.exploreOpen },
    { action: "nav", id: gate("submit"), label: "Submit", icon: ICONS.plus(), active: activeScreen === "submit" },
    { action: "nav", id: gate("favorites"), label: "Favorites", icon: ICONS.navFavorite(20), active: activeScreen === "favorites" },
    { action: "nav", id: gate("account"), label: "Profile", icon: ICONS.navProfile(20), active: activeScreen === "account" || activeScreen === "editAccount" },
  ];

  const w = collapsed ? "74px" : "220px";

  return `<aside class="hidden md:flex flex-col flex-shrink-0 border-r border-bd bg-[#0A0E17] select-none h-screen sticky top-0 z-40 transition-all duration-200" style="width:${w};">
    <div class="flex flex-col gap-1.5 px-3 pt-4 flex-1 overflow-y-auto">
      ${items.map((it) => {
        const active = it.active;
        const activeClass = active
          ? "text-[#34D399] border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.18)]"
          : "text-[#8A93AC] border-transparent hover:text-white hover:bg-[#1C2540] hover:border-[#2D3A5D]/60";
        const activeBg = active
          ? "background: linear-gradient(135deg, rgba(16,185,129,0.22), rgba(20,184,166,0.26));"
          : "background: transparent;";

        return `<button data-action="${it.action}" data-id="${it.id}" title="${escAttr(it.label)}"
          class="group relative flex items-center gap-3.5 rounded-xl font-sora font-semibold text-[13.5px] border transition-all duration-200 active:scale-[0.97] ${activeClass}"
          style="padding:11px ${collapsed ? "0" : "14px"}; justify-content:${collapsed ? "center" : "flex-start"}; ${activeBg}">
          <span class="flex items-center justify-center flex-shrink-0 w-5 h-5 transition-transform duration-200 group-hover:scale-110">${it.icon}</span>
          ${!collapsed ? `<span class="truncate">${esc(it.label)}</span>` : ""}
          ${collapsed ? `<span class="pointer-events-none absolute opacity-0 group-hover:opacity-100 transition-opacity font-inter font-medium text-xs text-white rounded-md whitespace-nowrap bg-[#1C2540] border border-[#232D48] px-2.5 py-1 left-[78px] z-50 shadow-xl">${esc(it.label)}</span>` : ""}
        </button>`;
      }).join("")}
    </div>
    ${isLoggedInCreator ? `<div class="p-3 border-t border-bd/60">
      <button data-action="confirm-logout" title="Log out" class="w-full flex items-center gap-3 rounded-xl p-2.5 text-[#FF5D6C] hover:bg-coral/10 border border-transparent hover:border-coral/20 font-inter text-xs transition-colors" style="justify-content:${collapsed ? "center" : "flex-start"};">
        <span class="flex items-center justify-center flex-shrink-0">${ICONS.logOut()}</span>
        ${!collapsed ? `<span>Log out</span>` : ""}
      </button>
    </div>` : ""}
  </aside>`;
}

function publicBottomNavHtml(activeScreen) {
  const isLoggedInCreator = !!(state.session && state.session.role === "admin");
  const gate = (id) => (isLoggedInCreator ? id : "creatorAuth");
  const big = (svg) => resizeIcon(svg, 23);
  return bottomRailHtml([
    { action: "nav", id: "home", label: "Home", icon: big(ICONS.navHome()), active: activeScreen === "home" },
    { action: "open-explore", id: "", label: "Explore", icon: big(ICONS.navExplore()), active: state.ui.exploreOpen },
    { action: "nav", id: gate("submit"), label: "Submit", icon: big(activeScreen === "submit" ? ICONS.plusFilled() : ICONS.plus()), active: activeScreen === "submit" },
    { action: "nav", id: gate("favorites"), label: "Favorites", icon: big(ICONS.navFavorite()), active: activeScreen === "favorites" },
    { action: "nav", id: gate("account"), label: "Profile", icon: big(ICONS.navProfile()), active: activeScreen === "account" || activeScreen === "editAccount" },
  ], "md:hidden");
}

function bottomRailHtml(items, extraClass = "") {
  return `<div class="fixed left-1/2 bottom-0 z-40 flex items-center ${extraClass}" style="transform:translateX(-50%);width:100%;max-width:480px;height:calc(54px + env(safe-area-inset-bottom, 0px));padding:4px 6px calc(4px + env(safe-area-inset-bottom, 0px));background:rgba(10,14,23,.96);border-top:1px solid #232D48;backdrop-filter:blur(12px);">
    ${items.map((item) => `
      <button data-action="${item.action}" data-id="${item.id}" class="flex-1 flex flex-col items-center justify-center gap-1 font-inter transition-all active:scale-95" style="font-size:10px;color:${item.active ? "#3E8EFF" : "#8A93AC"};padding:3px 0;">
        <span class="flex items-center justify-center" style="width:22px;height:22px;">${item.icon}</span>
        <span>${esc(item.label)}</span>
      </button>
    `).join("")}
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  FOOTER (TABLET & DESKTOP DEDICATED LAYOUT)                      */
/* ---------------------------------------------------------------- */
function footerHtml() {
  const b = state.branding;
  if (!state.brandingLoaded) {
    return `<div class="mt-8 bg-panel border-t border-bd rounded-t-[26px] p-6 animate-pulse">
      <div class="w-32 h-8 rounded bg-[#1C2540] mb-3"></div>
      <div class="w-48 h-3 rounded bg-[#1C2540]"></div>
    </div>`;
  }
  const socials = b.socialEnabled ? (b.socialLinks || []).filter((l) => l.enabled && l.url) : [];

  return `<footer class="mt-8 bg-panel border-t border-bd rounded-t-[28px] p-5 md:p-8 lg:p-10 pb-[calc(76px+env(safe-area-inset-bottom,0px))] md:pb-8">
    <div class="w-full max-w-6xl mx-auto flex flex-col gap-6">
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-10">
        <!-- Left Side: Logo & Description -->
        <div class="flex flex-col items-center md:items-start text-center md:text-left gap-3 md:max-w-md">
          <img src="${escAttr(b.footerLogo || b.logo)}" alt="${escAttr(b.siteName)}" class="object-contain max-h-[58px] max-w-[170px]" />
          <div class="font-inter text-xs text-tmuted leading-relaxed">${esc(b.footerTagline)}</div>
        </div>

        <!-- Right Side: Official Social Badges & Page Link Texts -->
        <div class="flex flex-col items-center md:items-end gap-4">
          ${socials.length ? `<div class="flex flex-wrap justify-center md:justify-end gap-2.5">
            ${socials.map((l) => `<a href="${escAttr(sanitizeUrl(l.url))}" target="_blank" rel="noopener noreferrer" class="transition-transform hover:scale-105 active:scale-95 no-underline" title="${escAttr(l.label || l.icon)}">
              ${modernIconBadgeHtml(l.icon || detectPlatformKey(l.url), 38)}
            </a>`).join("")}
          </div>` : ""}

          ${b.footerLinksEnabled !== false ? `<div class="flex flex-wrap justify-center md:justify-end gap-x-5 gap-y-2">
            ${[["about", "About"], ["terms", "Terms of Service"], ["dmca", "DMCA"], ["privacy", "Privacy Policy"], ["contact", "Contact Us"]].filter(([k]) => (b.footerPages || {})[k] !== false).map(([k, label]) => `
              <button data-action="nav" data-id="${k}" class="bg-transparent border-none font-inter font-semibold text-xs text-tmuted hover:text-white transition-colors cursor-pointer">${esc(label)}</button>
            `).join("")}
            ${(b.footerCustomLinks || []).filter((l) => l.enabled !== false && l.url).map((l) => `
              <a href="${escAttr(sanitizeUrl(l.url))}" target="_blank" rel="noopener noreferrer" class="font-inter font-semibold text-xs text-tmuted hover:text-white transition-colors no-underline">${esc(l.label || "Link")}</a>
            `).join("")}
          </div>` : ""}
        </div>
      </div>

      <!-- Center-aligned Copyright -->
      <div class="w-full h-px bg-bd/70"></div>
      <div class="text-center font-inter font-medium text-[11px] text-tfaint">
        © ${new Date().getFullYear()} ${esc(b.siteName)}. All rights reserved.
      </div>
    </div>
  </footer>`;
}

/* ---------------------------------------------------------------- */
/*  POST CARD                                                       */
/* ---------------------------------------------------------------- */
function postCardHtml(post, author) {
  const liked = state.likedIds.includes(post.id);
  return `<div class="bg-panel border border-bd rounded-2xl p-3.5 mb-4 hover:border-accent/30 transition-all">
    <div data-action="open-post" data-id="${post.id}" class="cursor-pointer relative overflow-hidden rounded-xl">
      ${post.thumbnail ? `<img src="${escAttr(post.thumbnail)}" alt="${escAttr(post.title)}" class="w-full object-cover aspect-video hover:scale-105 transition-transform duration-300" />` : thumbPlaceholder()}
      ${categoryBadge(post.category)}
    </div>
    <div class="flex items-center gap-2.5 mt-3">
      <div data-action="open-profile" data-id="${author.id}" class="flex items-center gap-2 cursor-pointer bg-panelalt border border-bd rounded-full pr-3 py-1 min-w-0 hover:bg-panelhover transition-colors" style="width:max-content;max-width:65%;padding-left:4px;">
        ${avatarHtml(author.name, author.avatar, 26)}
        <div class="font-sora font-semibold text-[13.5px] truncate">${esc(author.name)}</div>
      </div>
      <div class="flex-1"></div>
      ${iconBtn({ action: "toggle-like", id: post.id, active: liked, size: 34, icon: `<span style="color:${liked ? "#FF5D6C" : "#8A93AC"}">${ICONS.heart(liked)}</span>` })}
      ${iconBtn({ action: "share-post", id: post.id, size: 34, icon: ICONS.share() })}
    </div>
    <div data-action="open-post" data-id="${post.id}" class="mt-2.5 cursor-pointer font-sora font-bold text-[15px] uppercase tracking-wide hover:text-accent transition-colors line-clamp-1">${esc(post.title)}</div>
  </div>`;
}

function skeletonCardHtml() {
  return `<div class="bg-panel border border-bd rounded-2xl p-3.5 mb-4 animate-pulse">
    <div class="w-full aspect-video rounded-xl bg-[#1C2540]"></div>
    <div class="flex items-center gap-2 mt-3">
      <div class="w-7 h-7 rounded-full bg-[#1C2540]"></div>
      <div class="w-24 h-3 rounded bg-[#1C2540]"></div>
    </div>
    <div class="w-3/4 h-4 rounded bg-[#1C2540] mt-3"></div>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  SCREENS                                                         */
/* ---------------------------------------------------------------- */
function feedScreen(mode) {
  let visible = state.posts.filter((p) => p.status === "approved" && !p.hidden);
  if (mode === "favorites") visible = visible.filter((p) => state.likedIds.includes(p.id));
  const adsOn = state.adSettings.adsEnabled;
  const rows = mode === "home" && adsOn && state.adSettings.nativeEnabled ? withAds(visible, state.adSettings.nativeFrequency) : visible.map((post) => ({ kind: "post", post }));

  let html = `<div class="px-4 md:px-6 pt-2 pb-6 max-w-6xl mx-auto">`;
  if (mode === "favorites") {
    html += pageSubHeaderHtml("Favorites", "nav", "home");
  }
  if (mode === "home" && visible.length > 0 && adsOn && state.adSettings.bannerEnabled) html += bannerSliderHtml();
  else if (mode === "home" && !state.postsLoaded) html += bannerSkeletonHtml();

  if (!state.postsLoaded && visible.length === 0) {
    html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${Array.from({ length: 4 }).map(() => skeletonCardHtml()).join("")}</div>`;
  } else if (visible.length === 0) {
    html += `<div class="text-center py-20 px-5 text-tfaint font-inter text-sm">${mode === "favorites" ? "You haven't favorited any maps yet." : "No maps available yet — check back soon."}</div>`;
  } else {
    html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">${rows.map((row) => (row.kind === "ad" ? `<div class="md:col-span-2">${adSlot("native")}</div>` : postCardHtml(row.post, getAuthor(row.post.authorId)))).join("")}</div>`;
  }
  html += `</div>`;
  return html;
}

function staticPageHtml(title, content) {
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(content || "");
  const body = looksLikeHtml ? content : esc(content).replace(/\n/g, "<br>");
  return `<div class="max-w-4xl mx-auto px-4 md:px-6 pt-2 pb-10">
    ${pageSubHeaderHtml(title, "nav", "home")}
    <div class="bg-panel border border-bd rounded-2xl p-5 md:p-8 text-tmuted font-inter text-sm leading-relaxed shadow-lg">${body}</div>
  </div>`;
}

function postViewScreenHtml(post) {
  const author = getAuthor(post.authorId);
  const liked = state.likedIds.includes(post.id);
  const codes = getPostCodes(post);
  const links = getPostLinks(post);

  let html = `<div class="max-w-3xl mx-auto px-4 md:px-6 pt-2 pb-10">
    ${pageSubHeaderHtml(post.title, "nav", state.ui.postOrigin)}
    <div class="relative rounded-2xl overflow-hidden border border-bd mb-4 shadow-xl">
      ${post.thumbnail ? `<img src="${escAttr(post.thumbnail)}" alt="${escAttr(post.title)}" class="w-full object-cover aspect-video" />` : thumbPlaceholder()}
    </div>
    <div class="flex items-center gap-3 bg-panel border border-bd rounded-2xl p-3 mb-5">
      <div data-action="open-profile" data-id="${author.id}" class="flex items-center gap-2.5 flex-1 cursor-pointer">
        ${avatarHtml(author.name, author.avatar, 36)}
        <div class="font-sora font-semibold text-sm">${esc(author.name)}</div>
      </div>
      ${iconBtn({ action: "toggle-like", id: post.id, active: liked, size: 34, icon: `<span style="color:${liked ? "#FF5D6C" : "#8A93AC"}">${ICONS.heart(liked)}</span>` })}
      ${iconBtn({ action: "share-post", id: post.id, size: 34, icon: ICONS.share() })}
    </div>
    <div class="font-sora font-extrabold text-xl tracking-wide uppercase mb-3">${esc(post.title)}</div>
    <div class="pl-3.5 border-l-2 border-accent text-tmuted font-inter text-sm leading-relaxed whitespace-pre-wrap mb-5">${esc(post.description)}</div>`;

  if (state.adSettings.adsEnabled && state.adSettings.postViewEnabled) html += `<div class="mb-5">${adSlot("postview")}</div>`;

  html += `<div class="flex flex-col gap-3">`;
  if (codes.length === 0 && links.length === 0) {
    html += `<div class="text-center text-tfaint font-inter text-sm py-4">No map codes or preview links provided.</div>`;
  }
  codes.forEach((c) => {
    html += `<div class="bg-panel border border-bd rounded-2xl p-4">
      <div class="font-mono font-bold text-[11px] text-tfaint uppercase tracking-wider mb-2">${esc(c.title || "Craftland Map Code")}</div>
      <div class="flex items-center gap-2">
        <div class="flex-1 bg-bgdeep border border-bd rounded-xl px-3.5 py-2.5 font-mono text-sm text-tprimary overflow-x-auto whitespace-nowrap">${c.code ? esc(c.code) : '<span class="text-tfaint">Not added yet</span>'}</div>
        ${primaryBtn({ action: "copy-map-code", id: c.code || "", label: "Copy", icon: `<span class="mr-1">${ICONS.copy()}</span>`, extra: "px-5" })}
      </div>
    </div>`;
  });
  links.forEach((l) => {
    html += modernLinkCardHtml({ url: l.url, title: l.title || "Watch preview / tutorial video", platformKey: l.icon || detectPlatformKey(l.url), subtitle: "Tap to open preview" });
  });
  html += `</div></div>`;
  return html;
}

function getPostCodes(post) {
  if (Array.isArray(post.codes) && post.codes.length) return post.codes;
  if (post.mapCode) return [{ id: "legacy-code", title: "Craftland Map Code", code: post.mapCode }];
  return [];
}
function getPostLinks(post) {
  if (Array.isArray(post.links) && post.links.length) return post.links;
  if (post.previewVideoUrl) return [{ id: "legacy-link", title: "Watch tutorial video", url: post.previewVideoUrl }];
  return [];
}

/* ---------------------------------------------------------------- */
/*  CREATOR AUTH SCREEN (WELCOME BACK / GAMING DASHBOARD STYLE)     */
/* ---------------------------------------------------------------- */
function creatorAuthScreenHtml() {
  const isLogin = state.ui.authMode !== "signup";
  return `<div class="max-w-[460px] mx-auto px-4 py-4 min-h-[85vh] flex flex-col justify-center">
    <div class="flex items-center mb-4">
      ${backBtnHtml("nav", "home")}
      <span class="font-sora font-bold text-base text-tprimary ml-3">${isLogin ? "Log in" : "Sign up"}</span>
    </div>
    <div class="bg-panel border border-bd rounded-[24px] p-6 md:p-8 shadow-2xl relative overflow-hidden">
      <div class="text-center mb-6">
        <h2 class="font-sora font-extrabold text-2xl md:text-3xl text-tprimary tracking-tight">${isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p class="font-inter text-xs text-tmuted mt-1.5">${isLogin ? "Manage maps, links and share with the community" : "Join the Craftland creators network"}</p>
      </div>

      ${!isLogin ? fieldWrap("Display name", `<input id="ca-name" class="${inputCls}" placeholder="Your creator name" />`) : ""}
      ${fieldWrap("Email or Username", `<input id="ca-identifier" class="${inputCls}" placeholder="you@example.com" value="${escAttr(state.ui.prefillIdentifier || "")}" />`)}
      ${fieldWrap("Password", passwordFieldHtml("ca-password", "At least 6 characters"))}

      ${isLogin ? `<div class="flex items-center justify-between mb-5 mt-1 font-inter text-xs">
        <label class="flex items-center gap-2 text-tmuted cursor-pointer select-none">
          <input type="checkbox" id="ca-remember" class="rounded bg-bgdeep border-bd text-accent focus:ring-0" />
          <span>Remember Me</span>
        </label>
        <button data-action="forgot-password" data-id="creator" class="text-accent hover:underline bg-transparent border-none p-0 cursor-pointer">Forgot Password?</button>
      </div>` : `<div class="h-3"></div>`}

      <div id="ca-error" class="text-coral text-xs mb-3 font-inter"></div>

      ${primaryBtn({
        action: isLogin ? "creator-login-submit" : "creator-signup-submit",
        label: isLogin ? "Sign In" : "Create Account",
        extra: "w-full py-3.5 font-bold text-sm tracking-wide"
      })}

      <div class="relative flex py-4 items-center">
        <div class="flex-grow border-t border-bd"></div>
        <span class="flex-shrink mx-3 text-tfaint font-mono text-[11px] uppercase tracking-wider">or</span>
        <div class="flex-grow border-t border-bd"></div>
      </div>

      <button data-action="creator-google-auth" class="w-full flex items-center justify-center gap-3 rounded-xl border border-bd bg-bgdeep hover:bg-panelhover py-3 font-sora font-semibold text-sm transition-colors text-tprimary mb-2.5">
        ${ICONS.google()}<span>Continue with Google</span>
      </button>

      <button data-action="open-language" class="w-full flex items-center justify-center gap-3 rounded-xl border border-bd bg-bgdeep hover:bg-panelhover py-3 font-sora font-semibold text-sm transition-colors text-tprimary">
        ${ICONS.apple()}<span>Continue with Apple</span>
      </button>

      <div class="text-center mt-6 font-inter text-xs text-tmuted">
        ${isLogin ? `New to CraftVerse? <button data-action="toggle-auth-mode" class="text-accent font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer">Sign up</button>` : `Already have an account? <button data-action="toggle-auth-mode" class="text-accent font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer">Sign in</button>`}
      </div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  PROFILE SCREEN                                                  */
/* ---------------------------------------------------------------- */
let profileTab = "links";
function profileScreenHtml(account) {
  const isOwn = !!(state.session && state.session.account && state.session.account.id === account.id);
  const theirPosts = state.posts.filter((p) => p.authorId === account.id && p.status === "approved" && !p.hidden);
  const bioLines = (account.bio || "").split("\n").slice(0, 5).join("\n");

  return `<div class="max-w-2xl mx-auto px-4 md:px-6 pt-2 pb-10">
    <div class="flex items-center justify-between py-2">
      ${!isOwn ? backBtnHtml("nav", "home") : "<div></div>"}
      ${isOwn ? `<button data-action="confirm-logout" class="flex items-center gap-1.5 rounded-full font-inter font-semibold text-xs px-3.5 py-1.5 border border-coral/30 bg-coral/10 text-coral hover:bg-coral/20 transition-colors">${resizeIcon(ICONS.logOut(), 15)}Log out</button>` : ""}
    </div>

    <div class="flex flex-col items-center text-center mt-2">
      <button data-action="open-photo-view" data-id="${account.id}" class="rounded-full p-0 border-none bg-transparent cursor-pointer">
        ${avatarHtml(account.name, account.avatar, 88)}
      </button>
      <div class="flex items-center justify-center gap-1.5 mt-3 max-w-full">
        <span class="font-sora font-extrabold text-xl truncate">${esc(account.name)}</span>
        ${isOwn ? `<button data-action="open-switch-account" class="text-tmuted hover:text-white bg-transparent border-none cursor-pointer">${ICONS.chevronDown()}</button>` : ""}
      </div>
      ${account.username || isOwn ? `<div class="flex items-center justify-center gap-2 mt-1">
        ${account.username ? `<span class="font-inter text-xs text-tfaint">@${esc(account.username)}</span>` : ""}
        ${isOwn ? `<button data-action="nav" data-id="editAccount" class="rounded-full font-sora font-semibold text-xs px-3 py-1 bg-panelalt border border-bd text-tprimary hover:bg-panelhover transition-colors">Edit</button>` : ""}
      </div>` : ""}
      ${bioLines ? `<div class="mt-3 text-tmuted font-inter text-sm leading-relaxed whitespace-pre-wrap max-w-sm">${esc(bioLines)}</div>` : ""}

      <div class="flex gap-1 mt-5 bg-panel border border-bd rounded-full p-1 mx-auto">
        ${[["links", "Links"], ["posts", "Maps"]].map(([k, label]) => `<button data-action="set-profile-tab" data-id="${k}" class="rounded-full font-sora font-semibold text-xs transition-all ${profileTab === k ? "bg-accent/20 text-accent border border-accent/30" : "text-tmuted hover:text-white"}" style="padding:7px 22px;">${label}</button>`).join("")}
      </div>
    </div>

    <div class="mt-6">
      ${profileTab === "links"
        ? (account.links && account.links.length
          ? `<div class="flex flex-col gap-3">${account.links.map((l) => modernLinkCardHtml({ url: l.url, title: l.label, platformKey: l.icon || detectPlatformKey(l.url) })).join("")}</div>`
          : `<div class="text-center text-tfaint font-inter text-sm py-8">No public links added yet.</div>`)
        : (theirPosts.length
          ? theirPosts.map((post) => postCardHtml(post, account)).join("")
          : `<div class="text-center text-tfaint font-inter text-sm py-8">No approved maps yet.</div>`)}
    </div>
  </div>
  ${isOwn ? switchAccountSheetHtml() + photoSheetHtml() + photoLightboxHtml() : ""}`;
}

/* ---------------------------------------------------------------- */
/*  SUBMIT / MAP EDITOR                                             */
/* ---------------------------------------------------------------- */
function emptyPostDraft(authorId, status) {
  return { id: "p" + Date.now(), title: "", category: "", description: "", thumbnail: "", codes: [{ id: "c" + Date.now(), title: "", code: "" }], links: [], authorId, status, hidden: false };
}
let postEditorDraft = null;
let postEditorMode = null;

function submitScreenHtml() {
  const account = state.session.account;
  const myPosts = state.posts.filter((p) => p.authorId === account.id);
  const isEditing = postEditorMode === "admin" && postEditorDraft;

  return `<div class="max-w-3xl mx-auto px-4 md:px-6 pt-2 pb-16">
    ${pageSubHeaderHtml("Submit Map", "nav", "home")}
    ${account.banned ? `<div class="flex items-center gap-2.5 bg-panel border border-coral/40 rounded-2xl px-4 py-3 mb-4 text-coral font-inter text-xs">${ICONS.ban()} Your account is restricted from submitting new maps.</div>` : ""}

    <div class="flex items-center justify-between mb-4">
      <div class="font-sora font-extrabold text-lg">My Maps</div>
      ${!isEditing ? `<button data-action="admin-new-post" class="flex items-center gap-1.5 rounded-full font-sora font-semibold text-xs text-white px-4 py-2 transition-transform active:scale-95 shadow-md" style="background:linear-gradient(135deg,#3E8EFF,#7C5CFF);">${resizeIcon(ICONS.plus(), 15)}Add Map</button>` : ""}
    </div>

    ${isEditing ? postEditorHtml(postEditorDraft) : (myPosts.length === 0
      ? `<div class="text-center text-tfaint font-inter text-sm py-12 bg-panel border border-bd rounded-2xl">You haven't submitted any maps yet.</div>`
      : myPosts.map(creatorMapRowHtml).join(""))}
  </div>`;
}

function creatorMapRowHtml(post) {
  const [g1, g2] = gradientFor(post.title);
  const thumb = post.thumbnail
    ? `<img src="${escAttr(post.thumbnail)}" class="rounded-xl object-cover w-12 h-12 flex-shrink-0" />`
    : `<div class="rounded-xl w-12 h-12 flex-shrink-0" style="background:linear-gradient(135deg, ${g1}, ${g2});"></div>`;
  return `<div class="bg-panel border border-bd rounded-2xl p-3.5 mb-3 flex flex-col gap-3">
    <div class="flex items-center gap-3">
      ${thumb}
      <div class="flex-1 min-w-0"><div class="font-sora font-bold text-sm truncate">${esc(post.title)}</div><div class="font-inter text-xs text-tfaint mt-0.5">${esc(post.category || "General")}${post.hidden ? " · Hidden" : ""}</div></div>
      ${statusBadge(post.status)}
    </div>
    <div class="flex gap-2">
      ${iconBtn({ action: "admin-edit-post", id: post.id, size: 34, icon: ICONS.pencil() })}
      ${dangerIconBtn({ action: "admin-delete-post", id: post.id, size: 34 })}
      ${ghostBtn({ action: "admin-toggle-hide", id: post.id, label: post.hidden ? "Unhide" : "Hide", icon: post.hidden ? ICONS.eye() : ICONS.eyeOff(), extra: "flex-1 py-1.5 text-xs" })}
    </div>
  </div>`;
}

function postEditorHtml(draft) {
  return `<div class="bg-panel border border-bd rounded-2xl p-4 md:p-6 mb-4 shadow-xl" id="post-editor">
    ${fieldWrap("Map Title", `<input id="pe-title" class="${inputCls}" value="${escAttr(draft.title)}" placeholder="e.g. Clash Arena Solo" />`)}
    ${fieldWrap("Category", `<input id="pe-category" class="${inputCls}" value="${escAttr(draft.category)}" placeholder="e.g. 1v1, Gun Fight, Parkour" />`)}
    ${fieldWrap("Description", `<textarea id="pe-description" class="${inputCls}" style="min-height:90px;">${esc(draft.description)}</textarea>`)}
    ${fieldWrap("Thumbnail Image", `
      <div class="flex gap-2">
        <input id="pe-thumbnail" class="${inputCls} flex-1" value="${draft.thumbnail && draft.thumbnail.startsWith("data:") ? "(uploaded image)" : escAttr(draft.thumbnail)}" ${draft.thumbnail && draft.thumbnail.startsWith("data:") ? "readonly" : ""} placeholder="https://... or upload" />
        <button data-action="pe-upload-thumb" class="w-[34px] h-[34px] rounded-[10px] border border-bd bg-panelalt flex items-center justify-center flex-shrink-0">${ICONS.upload()}</button>
        <input id="pe-thumbnail-file" type="file" accept="image/*" class="hidden" />
      </div>
      ${draft.thumbnail ? `<img src="${escAttr(draft.thumbnail)}" class="mt-2 w-full object-cover rounded-xl border border-bd max-h-36" />` : ""}
    `)}

    <div class="font-mono text-[11px] text-tfaint uppercase mt-4 mb-2">Map Codes</div>
    <div id="pe-codes">${draft.codes.map((c, i) => `
      <div class="bg-bgdeep border border-bd rounded-xl p-3 mb-2.5">
        <div class="flex gap-2 mb-2">
          <input class="${inputCls} flex-1 pe-code-title" data-idx="${i}" value="${escAttr(c.title)}" placeholder="Title (e.g. India Region)" />
          ${dangerIconBtn({ action: "pe-remove-code", id: String(i), size: 34 })}
        </div>
        <input class="${inputCls} font-mono pe-code-value" data-idx="${i}" value="${escAttr(c.code)}" placeholder="#FREEFIRE1234..." />
      </div>
    `).join("")}</div>
    <button data-action="pe-add-code" class="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-dashed border-bd text-tmuted font-inter text-xs mb-5 hover:text-white">${ICONS.plus()} Add another code</button>

    <div class="flex gap-3">
      ${primaryBtn({ action: "pe-save", label: "Save Map", icon: ICONS.save(), extra: "flex-1" })}
      ${ghostBtn({ action: "pe-cancel", label: "Cancel", extra: "flex-1" })}
    </div>
  </div>`;
}

function bindPostEditorInputs() {
  const map = { "pe-title": "title", "pe-category": "category", "pe-description": "description", "pe-thumbnail": "thumbnail" };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", (e) => { postEditorDraft[key] = e.target.value; });
  });
  document.querySelectorAll(".pe-code-title").forEach((el) => el.addEventListener("input", (e) => { postEditorDraft.codes[+el.dataset.idx].title = e.target.value; }));
  document.querySelectorAll(".pe-code-value").forEach((el) => el.addEventListener("input", (e) => { postEditorDraft.codes[+el.dataset.idx].code = e.target.value; }));
  const fileInput = document.getElementById("pe-thumbnail-file");
  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_BYTES) { showToast("File is too large (>5MB).", "error"); return; }
      try {
        postEditorDraft.thumbnail = await fileToCompressedDataUrl(file);
        render();
      } catch (err) { showToast("Error reading image.", "error"); }
    });
  }
}

/* ---------------------------------------------------------------- */
/*  NOTIFICATIONS                                                   */
/* ---------------------------------------------------------------- */
function notificationsScreenHtml() {
  const list = state.notifications;
  return `<div class="max-w-2xl mx-auto px-4 md:px-6 pt-2 pb-16">
    ${pageSubHeaderHtml("Notifications", "nav", "home", list.length ? `<button data-action="mark-all-read" class="font-inter text-xs text-accent bg-transparent border-none cursor-pointer">Mark all read</button>` : "")}
    ${list.length === 0 ? `<div class="text-center text-tfaint font-inter text-sm py-16">No notifications yet.</div>` : list.map((n) => `
      <div class="flex items-start gap-3 bg-panel border border-bd rounded-2xl p-3.5 mb-2.5 ${n.read ? "" : "border-accent/40 bg-accent/5"}">
        <div class="w-[34px] h-[34px] rounded-[10px] bg-panelalt border border-bd flex items-center justify-center flex-shrink-0 text-accent">${ICONS.notif()}</div>
        <div class="flex-1 min-w-0">
          <div class="font-sora font-semibold text-sm">${esc(n.title)}</div>
          <div class="font-inter text-xs text-tmuted mt-0.5">${esc(n.message)}</div>
        </div>
        ${!n.read ? `<span class="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2"></span>` : ""}
      </div>
    `).join("")}
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  EDIT ACCOUNT & SHEETS                                           */
/* ---------------------------------------------------------------- */
function editAccountScreenHtml() {
  const a = state.session.account;
  return `<div class="max-w-xl mx-auto px-4 md:px-6 pt-2 pb-16">
    ${pageSubHeaderHtml("Edit Profile", "nav", "account")}
    <div class="flex flex-col items-center mb-6">
      <button data-action="open-photo-sheet" class="relative rounded-full p-0 border-none bg-transparent cursor-pointer group">
        ${avatarHtml(a.name, a.avatar, 96)}
        <span class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">${ICONS.camera()}</span>
      </button>
      <button data-action="open-photo-sheet" class="font-inter text-xs mt-2 text-accent bg-transparent border-none cursor-pointer">Change photo</button>
    </div>

    <div class="bg-panel border border-bd rounded-2xl mb-4 overflow-hidden">
      <button data-action="nav" data-id="editName" class="w-full flex items-center justify-between px-4 py-3.5 border-b border-bd bg-transparent text-left cursor-pointer hover:bg-panelhover transition-colors">
        <span class="font-inter text-sm text-tmuted">Name</span>
        <span class="flex items-center gap-1.5 font-sora font-semibold text-sm text-tprimary">${esc(a.name)}${ICONS.chevronRight()}</span>
      </button>
      <button data-action="nav" data-id="editBio" class="w-full flex items-center justify-between px-4 py-3.5 border-b border-bd bg-transparent text-left cursor-pointer hover:bg-panelhover transition-colors">
        <span class="font-inter text-sm text-tmuted">Bio</span>
        <span class="flex items-center gap-1.5 font-inter text-xs text-right text-tprimary truncate max-w-[180px]">${a.bio ? esc(a.bio) : "Add bio"}${ICONS.chevronRight()}</span>
      </button>
      <button data-action="open-gender-sheet" class="w-full flex items-center justify-between px-4 py-3.5 border-b border-bd bg-transparent text-left cursor-pointer hover:bg-panelhover transition-colors">
        <span class="font-inter text-sm text-tmuted">Gender</span>
        <span class="flex items-center gap-1.5 font-sora font-semibold text-sm text-tprimary">${a.gender ? esc(a.gender) : "Add gender"}${ICONS.chevronRight()}</span>
      </button>
    </div>

    <div class="font-mono text-[11px] text-tfaint uppercase mb-2">Social / Bio Links</div>
    <div class="mb-4">
      ${(a.links || []).length < 5 ? `<button data-action="open-link-sheet" data-id="new" class="w-full flex items-center gap-3 bg-panel border border-bd rounded-2xl px-4 py-3.5 mb-2.5 text-left cursor-pointer hover:bg-panelhover transition-colors">
        <span class="w-[34px] h-[34px] rounded-[10px] border border-bd bg-panelalt text-accent flex items-center justify-center">${ICONS.plus()}</span>
        <span class="font-sora font-semibold text-sm">Add Link</span>
      </button>` : ""}
      ${(a.links || []).map((l, idx) => `<button data-action="open-link-sheet" data-id="${idx}" class="w-full flex items-center gap-3 bg-panel border border-bd rounded-2xl px-4 py-3.5 mb-2.5 text-left cursor-pointer hover:bg-panelhover transition-colors">
        ${modernIconBadgeHtml(l.icon || detectPlatformKey(l.url), 34)}
        <div class="flex-1 min-w-0"><div class="font-sora font-semibold text-sm truncate">${esc(l.label)}</div><div class="font-inter text-xs text-tfaint truncate">${esc(l.url)}</div></div>
        ${ICONS.chevronRight()}
      </button>`).join("")}
    </div>
  </div>
  ${photoSheetHtml()}${photoLightboxHtml()}${linkFormSheetHtml()}${genderSheetHtml()}`;
}

function editNameScreenHtml() {
  const a = state.session.account;
  return `<div class="max-w-md mx-auto px-4 py-4">
    <div class="flex items-center justify-between mb-4">
      ${backBtnHtml("nav", "editAccount")}
      <button data-action="save-name" class="font-sora font-bold text-sm text-accent bg-transparent border-none cursor-pointer">Save</button>
    </div>
    <div class="bg-panel border border-bd rounded-2xl p-5 shadow-xl">
      <div class="font-sora font-bold text-xl mb-1">Display Name</div>
      <div class="font-inter text-xs text-tmuted mb-4">Name can only be changed once every 7 days.</div>
      <input id="en-name" maxlength="30" class="${inputCls}" value="${escAttr(a.name)}" placeholder="Your Name" />
      <div id="en-error" class="text-coral text-xs mt-2 font-inter"></div>
    </div>
  </div>`;
}

function editBioScreenHtml() {
  const a = state.session.account;
  return `<div class="max-w-md mx-auto px-4 py-4">
    <div class="flex items-center justify-between mb-4">
      ${backBtnHtml("nav", "editAccount")}
      <button data-action="save-bio" class="font-sora font-bold text-sm text-accent bg-transparent border-none cursor-pointer">Save</button>
    </div>
    <div class="bg-panel border border-bd rounded-2xl p-5 shadow-xl">
      <div class="font-sora font-bold text-xl mb-1">Bio</div>
      <div class="font-inter text-xs text-tmuted mb-4">Briefly introduce yourself (max 160 characters).</div>
      <textarea id="eb-bio" maxlength="160" class="${inputCls}" style="min-height:120px;">${esc(a.bio || "")}</textarea>
      <div id="eb-error" class="text-coral text-xs mt-2 font-inter"></div>
    </div>
  </div>`;
}

function genderSheetHtml() {
  if (!state.ui.genderSheetOpen) return "";
  const a = state.session.account;
  const options = ["Male", "Female", "Other", "Prefer not to say"];
  return `<div data-action="close-gender-sheet" class="fixed inset-0 z-50 flex items-end justify-center cv-sheet-backdrop bg-black/60 backdrop-blur-sm">
    <div data-action="noop" class="w-full max-w-md bg-panel border-t border-bd rounded-t-3xl p-5 pb-8 shadow-2xl cv-sheet-panel">
      <div class="flex items-center justify-between mb-4">
        <div class="font-sora font-bold text-base">Gender</div>
        ${closeBtnHtml("close-gender-sheet")}
      </div>
      ${options.map((o) => `<button data-action="save-gender" data-id="${escAttr(o)}" class="w-full flex items-center justify-between bg-bgdeep border border-bd rounded-xl px-4 py-3 mb-2 text-left cursor-pointer hover:bg-panelhover transition-colors">
        <span class="font-inter text-sm">${o}</span>
        ${a.gender === o ? `<span class="text-accent">${ICONS.check()}</span>` : ""}
      </button>`).join("")}
    </div>
  </div>`;
}

function photoSheetHtml() {
  if (!state.ui.photoSheetOpen) return "";
  const a = state.session.account;
  return `<div data-action="close-photo-sheet" class="fixed inset-0 z-50 flex items-end justify-center cv-sheet-backdrop bg-black/60 backdrop-blur-sm">
    <div data-action="noop" class="w-full max-w-md bg-panel border-t border-bd rounded-t-3xl p-4 pb-7 shadow-2xl cv-sheet-panel">
      <div class="flex items-center justify-between mb-2 px-2">
        <span class="font-sora font-bold text-sm">Avatar Photo</span>
        ${closeBtnHtml("close-photo-sheet")}
      </div>
      <button data-action="photo-take" class="w-full flex items-center gap-3 px-4 py-3 font-inter text-sm border-b border-bd bg-transparent text-left hover:bg-panelhover">${ICONS.camera()} Take Photo</button>
      <button data-action="photo-upload" class="w-full flex items-center gap-3 px-4 py-3 font-inter text-sm bg-transparent text-left hover:bg-panelhover">${ICONS.upload()} Upload From Device</button>
      ${a.avatar ? `<button data-action="photo-view" class="w-full flex items-center gap-3 px-4 py-3 font-inter text-sm border-t border-bd bg-transparent text-left hover:bg-panelhover">${ICONS.eye()} View Full Photo</button>` : ""}
      <input id="photo-file-take" type="file" accept="image/*" capture="environment" class="hidden" />
      <input id="photo-file-upload" type="file" accept="image/*" class="hidden" />
    </div>
  </div>`;
}

function photoLightboxHtml() {
  const accId = state.ui.photoViewAccountId;
  if (!accId) return "";
  const a = state.accounts.find((x) => x.id === accId) || (state.session && state.session.account);
  if (!a || !a.avatar) return "";
  return `<div data-action="close-photo-view" class="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/95">
    <div class="absolute top-4 right-4">${closeBtnHtml("close-photo-view")}</div>
    <img src="${escAttr(a.avatar)}" data-action="noop" class="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-2xl" />
  </div>`;
}

let linkDraft = { title: "", url: "", platform: "" };
function linkFormSheetHtml() {
  if (!state.ui.linkSheetOpen) return "";
  const idx = state.ui.linkSheetIndex;
  const isNew = idx < 0;
  return `<div data-action="close-link-sheet" class="fixed inset-0 z-50 flex items-end justify-center cv-sheet-backdrop bg-black/60 backdrop-blur-sm">
    <div data-action="noop" class="w-full max-w-md bg-panel border-t border-bd rounded-t-3xl p-5 pb-8 shadow-2xl cv-sheet-panel">
      <div class="flex items-center justify-between mb-4">
        <div class="font-sora font-bold text-base">${isNew ? "Add Link" : "Edit Link"}</div>
        ${closeBtnHtml("close-link-sheet")}
      </div>
      <button data-action="open-platform-sheet" class="w-full flex items-center gap-3 bg-bgdeep border border-bd rounded-xl px-4 py-3 mb-3 text-left">
        ${modernIconBadgeHtml(linkDraft.platform || "other", 30)}
        <span class="flex-1 font-inter text-sm">${(LINK_PLATFORMS.find(([k]) => k === linkDraft.platform) || [])[1] || "Select Platform"}</span>
        ${ICONS.chevronDown()}
      </button>
      <input id="el-title" class="${inputCls} mb-3" placeholder="Title (e.g. YouTube Channel)" value="${escAttr(linkDraft.title)}" />
      <input id="el-url" class="${inputCls} mb-4" placeholder="URL (https://...)" value="${escAttr(linkDraft.url)}" />
      <div id="el-error" class="text-coral text-xs mb-3 font-inter"></div>
      ${primaryBtn({ action: "save-link", label: isNew ? "Add Link" : "Save Changes", extra: "w-full" })}
      ${!isNew ? `<button data-action="delete-link" class="w-full text-center mt-3 font-inter text-xs text-coral bg-transparent border-none cursor-pointer">Remove Link</button>` : ""}
    </div>
  </div>
  ${platformSheetHtml()}`;
}

function platformSheetHtml() {
  if (!state.ui.platformSheetOpen) return "";
  return `<div data-action="close-platform-sheet" class="fixed inset-0 z-50 flex items-end justify-center cv-sheet-backdrop bg-black/70 backdrop-blur-sm">
    <div data-action="noop" class="w-full max-w-md bg-panel border-t border-bd rounded-t-3xl p-5 pb-8 shadow-2xl max-h-[75vh] overflow-y-auto cv-sheet-panel">
      <div class="flex items-center justify-between mb-3">
        <div class="font-sora font-bold text-base">Select Platform</div>
        ${closeBtnHtml("close-platform-sheet")}
      </div>
      ${LINK_PLATFORMS.map(([k, label]) => `<button data-action="pick-platform" data-id="${k}" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-bd hover:bg-panelhover bg-transparent text-left cursor-pointer transition-colors">
        ${modernIconBadgeHtml(k, 32)}
        <span class="flex-1 font-inter text-sm">${label}</span>
      </button>`).join("")}
    </div>
  </div>`;
}

function switchAccountSheetHtml() {
  if (!state.ui.switchAccountOpen) return "";
  const known = getKnownAccounts();
  const currentId = state.session.account.id;
  return `<div data-action="close-switch-account" class="fixed inset-0 z-50 flex items-end justify-center cv-sheet-backdrop bg-black/60 backdrop-blur-sm">
    <div data-action="noop" class="w-full max-w-md bg-panel border-t border-bd rounded-t-3xl p-5 pb-8 shadow-2xl cv-sheet-panel">
      <div class="flex items-center justify-between mb-4">
        <div class="font-sora font-bold text-base">Switch Account</div>
        ${closeBtnHtml("close-switch-account")}
      </div>
      ${known.map((acc) => `<button data-action="${acc.id === currentId ? "noop" : "switch-account"}" data-id="${escAttr(acc.identifier || "")}" class="w-full flex items-center gap-3 py-2.5 px-2 rounded-xl bg-transparent hover:bg-panelhover border-none cursor-pointer text-left">
        ${avatarHtml(acc.name, acc.avatar, 38)}
        <div class="flex-1 font-sora font-semibold text-sm truncate">${esc(acc.name)}</div>
        ${acc.id === currentId ? `<span class="text-accent">${ICONS.check()}</span>` : ""}
      </button>`).join("")}
      <button data-action="add-account" class="w-full flex items-center gap-3 py-3 px-2 mt-2 border-t border-bd bg-transparent text-left cursor-pointer">
        <span class="w-[34px] h-[34px] rounded-[10px] border border-bd flex items-center justify-center">${ICONS.plus()}</span>
        <span class="font-sora font-semibold text-sm">Add Account</span>
      </button>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  EXPLORE SCREEN (SEARCH OVERLAY)                                 */
/* ---------------------------------------------------------------- */
let exploreQuery = "";
let exploreCategory = null;
function exploreScreenHtml() {
  const visible = state.posts.filter((p) => p.status === "approved" && !p.hidden);
  let categories = Array.from(new Set(visible.map((p) => p.category).filter(Boolean)));
  const q = exploreQuery.trim().toLowerCase();
  const results = visible.filter((p) => {
    const matchesQ = !q || p.title.toLowerCase().includes(q) || getAuthor(p.authorId).name.toLowerCase().includes(q);
    const matchesCat = !exploreCategory || p.category === exploreCategory;
    return matchesQ && matchesCat;
  });

  return `<div class="fixed inset-0 bg-bgdeep z-50 overflow-y-auto">
    <div class="max-w-3xl mx-auto px-4 py-4">
      <div class="flex items-center gap-3 mb-5">
        <div class="relative flex-1">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-tfaint">${ICONS.search()}</span>
          <input id="explore-search" value="${escAttr(exploreQuery)}" placeholder="Search maps or creators..." class="${inputCls}" style="padding-left:40px;" />
        </div>
        ${closeBtnHtml("close-explore")}
      </div>

      ${exploreCategory ? `<div class="flex items-center gap-2 mb-4">
        <span class="px-3 py-1 rounded-lg bg-accent/20 text-accent font-sora text-xs font-semibold">${esc(exploreCategory)}</span>
        <button data-action="clear-explore-category" class="text-tfaint text-xs hover:text-white bg-transparent border-none cursor-pointer">Clear</button>
      </div>` : ""}

      ${!exploreQuery && !exploreCategory ? `<div class="mb-6">
        <div class="font-mono text-[11px] text-tfaint uppercase tracking-wider mb-3">Categories</div>
        <div class="flex flex-wrap gap-2">${categories.map((c) => `<button data-action="set-explore-category" data-id="${escAttr(c)}" class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-bd bg-panelalt hover:bg-panelhover font-sora text-xs font-semibold">${ICONS.sparkles()} ${esc(c)}</button>`).join("")}</div>
      </div>` : ""}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${results.length ? results.map((p) => postCardHtml(p, getAuthor(p.authorId))).join("") : `<div class="col-span-2 text-center text-tfaint font-inter text-sm py-16">No maps found matching your search.</div>`}
      </div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  MODAL & TOAST                                                   */
/* ---------------------------------------------------------------- */
function confirmModalHtml() {
  const c = state.ui.confirm;
  if (!c) return "";
  const danger = !!c.danger;
  return `<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div class="w-full max-w-sm bg-panel border border-bd rounded-2xl p-5 shadow-2xl">
      <div class="flex items-center justify-between mb-3">
        <div class="font-sora font-extrabold text-base">${esc(c.title || "Confirm")}</div>
        ${closeBtnHtml("confirm-cancel")}
      </div>
      <div class="text-tmuted font-inter text-sm mb-5 leading-relaxed">${esc(c.message)}</div>
      <div class="flex gap-2.5">
        <button data-action="confirm-cancel" class="flex-1 rounded-xl font-sora font-bold text-xs py-3 bg-panelalt border border-bd text-tmuted hover:bg-panelhover">Cancel</button>
        <button data-action="confirm-ok" class="flex-1 rounded-xl font-sora font-bold text-xs py-3 text-white shadow-lg" style="background:${danger ? "#FF5D6C" : "linear-gradient(135deg,#3E8EFF,#7C5CFF)"};">${esc(c.confirmLabel || "Confirm")}</button>
      </div>
    </div>
  </div>`;
}

function toastHtml() {
  const t = state.ui.toast;
  if (!t) return "";
  const isErr = t.type === "error";
  return `<div class="fixed left-1/2 bottom-6 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl font-inter text-xs flex items-center gap-2 shadow-2xl bg-panel border ${isErr ? "border-coral text-coral" : "border-emerald-500 text-emerald-400"} max-w-[90vw]">
    ${isErr ? ICONS.alertCircle() : ICONS.checkCircle()}
    <span class="text-tprimary">${esc(t.msg)}</span>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  MAIN ROUTER & RENDER ENGINE                                     */
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

function render() {
  try { renderInner(); } catch (err) { showFatalError(err); }
}

function renderInner() {
  const { screen, param } = parseHash();
  const app = document.getElementById("app");
  const isLoggedInCreator = !!(state.session && state.session.role === "admin");

  let html = "";
  let showFooter = false;

  switch (screen) {
    case "home":
      html = feedScreen("home");
      showFooter = true;
      break;
    case "favorites":
      if (!isLoggedInCreator) { html = creatorAuthScreenHtml(); break; }
      html = feedScreen("favorites");
      showFooter = true;
      break;
    case "submit":
      if (!isLoggedInCreator) { html = creatorAuthScreenHtml(); break; }
      html = submitScreenHtml();
      break;
    case "account":
      if (!isLoggedInCreator) { html = creatorAuthScreenHtml(); break; }
      html = profileScreenHtml(state.session.account);
      break;
    case "notifications":
      html = isLoggedInCreator ? notificationsScreenHtml() : creatorAuthScreenHtml();
      break;
    case "editAccount":
      html = isLoggedInCreator ? editAccountScreenHtml() : creatorAuthScreenHtml();
      break;
    case "editName":
      html = isLoggedInCreator ? editNameScreenHtml() : creatorAuthScreenHtml();
      break;
    case "editBio":
      html = isLoggedInCreator ? editBioScreenHtml() : creatorAuthScreenHtml();
      break;
    case "creatorAuth":
      html = creatorAuthScreenHtml();
      break;
    case "about":
      html = staticPageHtml("About CraftVerse", state.siteContent.about);
      showFooter = true;
      break;
    case "terms":
      html = staticPageHtml("Terms of Service", state.siteContent.terms);
      showFooter = true;
      break;
    case "dmca":
      html = staticPageHtml("DMCA Copyright Policy", state.siteContent.dmca);
      showFooter = true;
      break;
    case "privacy":
      html = staticPageHtml("Privacy Policy", state.siteContent.privacy);
      showFooter = true;
      break;
    case "contact":
      html = staticPageHtml("Contact Us", state.siteContent.contact);
      showFooter = true;
      break;
    case "post": {
      const post = state.posts.find((p) => p.id === (param || selectedPostId));
      html = post ? postViewScreenHtml(post) : feedScreen("home");
      showFooter = true;
      break;
    }
    case "profile": {
      const account = state.accounts.find((a) => a.id === (param || selectedProfileId));
      html = account ? profileScreenHtml(account) : feedScreen("home");
      showFooter = true;
      break;
    }
    default:
      html = feedScreen("home");
      showFooter = true;
  }

  // Modern Gaming Layout: Sidebar always on desktop/tablet, Top Header sticky at top
  app.innerHTML = `
    <div class="flex min-h-screen bg-bgdeep">
      ${sidebarNavHtml(screen)}
      <div class="flex-1 flex flex-col min-w-0">
        ${homeHeaderHtml()}
        <main class="flex-1 min-w-0 pb-16 md:pb-0">${html}</main>
        ${showFooter ? footerHtml() : ""}
      </div>
    </div>
    ${publicBottomNavHtml(screen)}
    ${state.ui.exploreOpen ? exploreScreenHtml() : ""}
    ${confirmModalHtml()}
    ${toastHtml()}
  `;

  if (document.getElementById("post-editor")) bindPostEditorInputs();
  if (document.getElementById("explore-search")) bindExploreInputs();
  if (document.getElementById("photo-file-take") || document.getElementById("photo-file-upload")) bindPhotoSheetInputs();
  const adSlotEl = document.getElementById("postview-ad-slot");
  if (adSlotEl && state.adSettings.postViewAdType === "code" && state.adSettings.postViewAdCode) {
    injectAdCode(adSlotEl, state.adSettings.postViewAdCode);
  }
}
window.addEventListener("hashchange", render);

function bindExploreInputs() {
  const el = document.getElementById("explore-search");
  if (!el) return;
  el.addEventListener("input", (e) => {
    exploreQuery = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const el2 = document.getElementById("explore-search");
    if (el2) { el2.focus(); el2.setSelectionRange(pos, pos); }
  });
}

function bindPhotoSheetInputs() {
  const takeEl = document.getElementById("photo-file-take");
  const uploadEl = document.getElementById("photo-file-upload");
  if (takeEl) takeEl.addEventListener("change", (e) => handleAvatarFile(e.target.files[0]));
  if (uploadEl) uploadEl.addEventListener("change", (e) => handleAvatarFile(e.target.files[0]));
}

async function handleAvatarFile(file) {
  if (!file) return;
  if (file.size > MAX_IMAGE_BYTES) { showToast("Image is too large (>5MB).", "error"); return; }
  try {
    const dataUrl = await fileToCompressedDataUrl(file);
    await fsSetAccount(state.session.account.id, { avatar: dataUrl });
    state.ui.photoSheetOpen = false;
    showToast("Profile photo updated.");
    render();
  } catch (e) { showToast("Error processing photo.", "error"); }
}

/* ---------------------------------------------------------------- */
/*  ACTIONS & EVENT DELEGATION                                      */
/* ---------------------------------------------------------------- */
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id;

  switch (action) {
    case "nav": state.ui.exploreOpen = false; navigate(id); break;
    case "toggle-sidebar":
      state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
      try { localStorage.setItem("cv_sidebar_collapsed", state.ui.sidebarCollapsed ? "1" : "0"); } catch (err) {}
      render();
      break;
    case "open-explore": exploreQuery = ""; exploreCategory = null; state.ui.exploreOpen = true; render(); break;
    case "close-explore": state.ui.exploreOpen = false; render(); break;
    case "set-explore-category": exploreCategory = id; render(); break;
    case "clear-explore-category": exploreCategory = null; render(); break;
    case "toggle-like": toggleLike(id); break;
    case "open-post": state.ui.exploreOpen = false; openPost(id); break;
    case "open-profile": state.ui.exploreOpen = false; openProfile(id); break;
    case "set-profile-tab": profileTab = id; render(); break;
    case "copy-map-code":
      if (!id) { showToast("No map code available.", "error"); return; }
      await copyToClipboard(id);
      showToast("Map code copied to clipboard!");
      break;
    case "share-post": {
      const post = state.posts.find((p) => p.id === id);
      if (!post) return;
      if (navigator.share) navigator.share({ title: post.title, text: post.title, url: location.href }).catch(() => {});
      else { await copyToClipboard(location.href); showToast("Link copied to clipboard."); }
      break;
    }
    case "toggle-auth-mode":
      state.ui.authMode = state.ui.authMode === "signup" ? "login" : "signup";
      render();
      break;
    case "creator-login-submit": {
      const identifier = document.getElementById("ca-identifier")?.value.trim();
      const password = document.getElementById("ca-password")?.value;
      const errEl = document.getElementById("ca-error");
      if (!identifier || !password) { if (errEl) errEl.textContent = "Please fill in all fields."; return; }
      try {
        const email = identifier.includes("@") ? identifier : `${identifier.toLowerCase()}@craftverse.users`;
        await signInWithEmailAndPassword(auth, email, password);
        showToast("Signed in successfully!");
        navigate("home");
      } catch (err) {
        if (errEl) errEl.textContent = "Invalid email or password.";
      }
      break;
    }
    case "creator-signup-submit": {
      const name = document.getElementById("ca-name")?.value.trim();
      const identifier = document.getElementById("ca-identifier")?.value.trim();
      const password = document.getElementById("ca-password")?.value;
      const errEl = document.getElementById("ca-error");
      if (!name || !identifier || !password) { if (errEl) errEl.textContent = "All fields are required."; return; }
      try {
        const isEmail = identifier.includes("@");
        const email = isEmail ? identifier : `${identifier.toLowerCase().replace(/[^a-z0-9_]/g, "")}@craftverse.users`;
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await fsSetAccount(cred.user.uid, { role: "admin", name, email, username: isEmail ? "" : identifier.toLowerCase(), avatar: "", bio: "", links: [], profilePublic: true, banned: false });
        showToast("Welcome to CraftVerse!");
        navigate("home");
      } catch (err) {
        if (errEl) errEl.textContent = err.message || "Failed to create account.";
      }
      break;
    }
    case "creator-google-auth": {
      try {
        const cred = await signInWithPopup(auth, new GoogleAuthProvider());
        const snap = await getDoc(doc(db, "accounts", cred.user.uid));
        if (!snap.exists()) {
          await fsSetAccount(cred.user.uid, { role: "admin", name: cred.user.displayName || "Creator", email: cred.user.email || "", username: "", avatar: cred.user.photoURL || "", bio: "", links: [], profilePublic: true, banned: false });
        }
        showToast("Signed in with Google!");
        navigate("home");
      } catch (err) {
        showToast("Google sign-in cancelled.", "error");
      }
      break;
    }
    case "forgot-password": {
      const identifier = document.getElementById("ca-identifier")?.value.trim();
      if (!identifier || !identifier.includes("@")) { showToast("Enter your email address first.", "error"); return; }
      try {
        await sendPasswordResetEmail(auth, identifier);
        showToast("Password reset email sent.");
      } catch (err) { showToast(err.message, "error"); }
      break;
    }
    case "confirm-logout":
      askConfirm({ title: "Log Out?", message: "Are you sure you want to log out of CraftVerse?", confirmLabel: "Log Out", danger: true }, async () => {
        await signOut(auth);
        navigate("home");
        showToast("Logged out successfully.");
      });
      break;
    case "confirm-cancel": closeConfirm(); break;
    case "confirm-ok": {
      const c = state.ui.confirm;
      closeConfirm();
      if (c && c.onConfirm) c.onConfirm();
      break;
    }
    case "admin-new-post":
      postEditorDraft = emptyPostDraft(state.session.uid, "approved");
      postEditorMode = "admin";
      render();
      break;
    case "admin-edit-post": {
      const p = state.posts.find((x) => x.id === id);
      if (p) {
        postEditorDraft = JSON.parse(JSON.stringify(p));
        postEditorDraft.codes = getPostCodes(p);
        postEditorMode = "admin";
        render();
      }
      break;
    }
    case "admin-delete-post":
      askConfirm({ title: "Delete Map?", message: "This map will be permanently removed.", confirmLabel: "Delete", danger: true }, async () => {
        await fsDeletePost(id);
        showToast("Map deleted.");
      });
      break;
    case "admin-toggle-hide": {
      const p = state.posts.find((x) => x.id === id);
      if (p) {
        await fsSetPost(id, { hidden: !p.hidden });
        showToast(p.hidden ? "Map unhidden." : "Map hidden.");
      }
      break;
    }
    case "pe-save": {
      if (!postEditorDraft.title.trim()) { showToast("Map title is required.", "error"); return; }
      await fsSetPost(postEditorDraft.id, postEditorDraft);
      showToast("Map saved successfully!");
      postEditorDraft = null;
      postEditorMode = null;
      render();
      break;
    }
    case "pe-cancel": postEditorDraft = null; postEditorMode = null; render(); break;
    case "pe-add-code":
      postEditorDraft.codes.push({ id: "c" + Date.now(), title: "", code: "" });
      render();
      break;
    case "pe-remove-code":
      postEditorDraft.codes.splice(+id, 1);
      render();
      break;
    case "pe-upload-thumb": document.getElementById("pe-thumbnail-file")?.click(); break;
    case "save-name": {
      const name = document.getElementById("en-name")?.value.trim();
      if (!name) return;
      await fsSetAccount(state.session.account.id, { name });
      showToast("Name updated.");
      navigate("editAccount");
      break;
    }
    case "save-bio": {
      const bio = document.getElementById("eb-bio")?.value.trim();
      await fsSetAccount(state.session.account.id, { bio });
      showToast("Bio updated.");
      navigate("editAccount");
      break;
    }
    case "save-gender": {
      await fsSetAccount(state.session.account.id, { gender: id });
      state.ui.genderSheetOpen = false;
      showToast("Gender updated.");
      render();
      break;
    }
    case "open-gender-sheet": state.ui.genderSheetOpen = true; render(); break;
    case "close-gender-sheet": state.ui.genderSheetOpen = false; render(); break;
    case "open-photo-sheet": state.ui.photoSheetOpen = true; render(); break;
    case "close-photo-sheet": state.ui.photoSheetOpen = false; render(); break;
    case "photo-take": document.getElementById("photo-file-take")?.click(); break;
    case "photo-upload": document.getElementById("photo-file-upload")?.click(); break;
    case "photo-view": state.ui.photoSheetOpen = false; state.ui.photoViewAccountId = state.session.account.id; render(); break;
    case "open-photo-view": state.ui.photoViewAccountId = id; render(); break;
    case "close-photo-view": state.ui.photoViewAccountId = null; render(); break;
    case "open-switch-account": state.ui.switchAccountOpen = true; render(); break;
    case "close-switch-account": state.ui.switchAccountOpen = false; render(); break;
    case "open-link-sheet": {
      const i = id === "new" ? -1 : +id;
      state.ui.linkSheetOpen = true;
      state.ui.linkSheetIndex = i;
      const ex = i >= 0 ? (state.session.account.links || [])[i] : null;
      linkDraft = ex ? { title: ex.label || "", url: ex.url || "", platform: ex.icon || "" } : { title: "", url: "", platform: "other" };
      render();
      break;
    }
    case "close-link-sheet": state.ui.linkSheetOpen = false; render(); break;
    case "open-platform-sheet": state.ui.platformSheetOpen = true; render(); break;
    case "close-platform-sheet": state.ui.platformSheetOpen = false; render(); break;
    case "pick-platform": linkDraft.platform = id; state.ui.platformSheetOpen = false; render(); break;
    case "save-link": {
      const title = document.getElementById("el-title")?.value.trim();
      const url = document.getElementById("el-url")?.value.trim();
      if (!title || !url) { showToast("Title and URL required.", "error"); return; }
      const links = [...(state.session.account.links || [])];
      if (state.ui.linkSheetIndex >= 0) links[state.ui.linkSheetIndex] = { label: title, url, icon: linkDraft.platform };
      else links.push({ label: title, url, icon: linkDraft.platform });
      await fsSetAccount(state.session.account.id, { links });
      state.ui.linkSheetOpen = false;
      showToast("Links updated.");
      render();
      break;
    }
    case "delete-link": {
      const links = [...(state.session.account.links || [])];
      links.splice(state.ui.linkSheetIndex, 1);
      await fsSetAccount(state.session.account.id, { links });
      state.ui.linkSheetOpen = false;
      showToast("Link removed.");
      render();
      break;
    }
    case "mark-all-read":
      state.notifications.forEach((n) => updateDoc(doc(db, "notifications", n.id), { read: true }));
      break;
    case "open-language": showToast("Multilingual options coming soon."); break;
    case "toggle-password": {
      const input = document.getElementById(id);
      if (input) input.type = input.type === "password" ? "text" : "password";
      break;
    }
  }
});

/* ---------------------------------------------------------------- */
/*  RESPONSIVE CSS INJECTION                                        */
/* ---------------------------------------------------------------- */
(function injectResponsiveStyles() {
  const style = document.createElement("style");
  style.textContent = `
    @media (min-width: 768px) {
      #app { max-width: 100% !important; width: 100% !important; }
      .cv-sheet-backdrop { align-items: center !important; }
      .cv-sheet-panel { border-radius: 24px !important; max-width: 440px !important; }
    }
  `;
  document.head.appendChild(style);
})();

function showFatalError(err) {
  console.error(err);
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = `<div style="padding:24px;font-family:sans-serif;color:#FF9B9B;background:#0A0E17;min-height:100vh;">
    <h2 style="color:#fff;font-weight:bold;">Application Error</h2>
    <p style="margin-top:8px;">${esc(err && err.message)}</p>
  </div>`;
}

try { render(); } catch (err) { showFatalError(err); }
