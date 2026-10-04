/* ================================================================
   CraftVerse — Free Fire Craftland Map Sharing App
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
/*  ICONS                                                           */
/* ---------------------------------------------------------------- */
const svgIcon = (paths, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const fillIcon = (viewBox, paths, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="${viewBox}" fill="currentColor">${paths}</svg>`;
function resizeIcon(svgStr, size) {
  return svgStr.replace(/width="\d+(\.\d+)?"/, `width="${size}"`).replace(/height="\d+(\.\d+)?"/, `height="${size}"`);
}

const ICONS = {
  heart: (f, size = 18) => svgIcon(`<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" ${f ? 'fill="currentColor"' : ""}/>`, size),
  search: () => fillIcon("0 0 24 24", `<path clip-rule="evenodd" d="M14.1018 16.3007C12.8835 17.2777 11.3369 17.8621 9.6537 17.8621C5.72399 17.8621 2.53833 14.6764 2.53833 10.7467C2.53833 6.81701 5.72399 3.63135 9.6537 3.63135C13.5834 3.63135 16.7691 6.81701 16.7691 10.7467C16.7691 12.4471 16.1726 14.0082 15.1775 15.2322L15.9161 15.9708L14.844 17.0429L14.1018 16.3007ZM14.502 10.7466C14.502 13.4242 12.3313 15.5948 9.65371 15.5948C6.9761 15.5948 4.80546 13.4242 4.80546 10.7466C4.80546 8.06896 6.9761 5.89833 9.65371 5.89833C12.3313 5.89833 14.502 8.06896 14.502 10.7466Z" fill-rule="evenodd"/><path clip-rule="evenodd" d="M18.7113 21.0375C18.5768 21.172 18.3587 21.1717 18.2246 21.0368L14.7097 17.5C14.5763 17.3657 14.5766 17.1487 14.7105 17.0148L15.8997 15.8256C16.0342 15.6911 16.2524 15.6915 16.3864 15.8264L19.9013 19.3631C20.0348 19.4974 20.0345 19.7144 19.9006 19.8483L18.7113 21.0375Z" fill-rule="evenodd"/>`),
  globe: () => svgIcon(`<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>`),
  chevronRight: (size = 18) => svgIcon(`<polyline points="9 18 15 12 9 6"/>`, size),
  chevronDown: (size = 18) => svgIcon(`<path d="m6 9 6 6 6-6"/>`, size),
  chevronUp: (size = 18) => svgIcon(`<polyline points="6 15 12 9 18 15"/>`, size),
  arrowLeft: (size = 18) => svgIcon(`<path d="m15 18-6-6 6-6"/>`, size),
  share: (size = 18) => svgIcon(`<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>`, size),
  navHome: (size = 20) => fillIcon("0 0 256 256", `<path d="M224,120v96a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V164a4,4,0,0,0-4-4H108a4,4,0,0,0-4,4v52a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V120a16,16,0,0,1,4.69-11.31l80-80a16,16,0,0,1,22.62,0l80,80A16,16,0,0,1,224,120Z"/>`, size),
  plus: (size = 18) => svgIcon(`<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`, size),
  navExplore: (size = 20) => fillIcon("0 0 640 640", `<path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM370.7 389.1L226.4 444.6C207 452.1 187.9 433 195.4 413.6L250.9 269.3C254.2 260.8 260.8 254.2 269.3 250.9L413.6 195.4C433 187.9 452.1 207 444.6 226.4L389.1 370.7C385.9 379.2 379.2 385.8 370.7 389.1zM352 320C352 302.3 337.7 288 320 288C302.3 288 288 302.3 288 320C288 337.7 302.3 352 320 352C337.7 352 352 337.7 352 320z"/>`, size),
  navFavorite: (size = 20) => fillIcon("0 0 640 640", `<path d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"/>`, size),
  navProfile: (size = 20) => fillIcon("0 0 32 32", `<path d="M26.1137 20.6693C26.6674 23.8341 24.4618 26.132 21.3885 26.6484C18.4196 27.1469 13.5818 27.1469 10.6138 26.6484C7.5397 26.132 5.3341 23.8349 5.88853 20.6702C6.35798 17.9846 8.63481 16.3107 11.4143 16.4548C13.4451 16.56 14.6923 16.8239 16.1371 16.8239C17.5981 16.8239 18.5718 16.5592 20.588 16.4548C23.3674 16.3091 25.6443 17.9838 26.1137 20.6693ZM16.1007 4.66211C19.021 4.66211 21.3885 7.02959 21.3885 9.9499C21.3885 12.8702 19.021 15.2377 16.1007 15.2377C13.1804 15.2377 10.8121 12.8694 10.8121 9.9499C10.8121 7.0304 13.1796 4.66211 16.1007 4.66211Z"/>`, size),
  google: () => `<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.9 4.5 4 13.4 4 24.5s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12.5 24 12.5c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.6 0-14.2 4.3-17.7 10.2z"/><path fill="#4CAF50" d="M24 44.5c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4c-2 1.4-4.6 2.3-7.7 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.7 40.1 16.3 44.5 24 44.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.4C41.5 36.4 44 30.9 44 24.5c0-1.3-.1-2.7-.4-4z"/></svg>`,
  trash: (size = 18) => svgIcon(`<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`, size),
  pencil: (size = 18) => svgIcon(`<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>`, size),
  save: (size = 18) => svgIcon(`<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>`, size),
  copy: (size = 16) => svgIcon(`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`, size),
  externalLink: (size = 18) => svgIcon(`<path d="M14 4h6v6"/><line x1="20" y1="4" x2="11" y2="13"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/>`, size),
  arrowUpRight: (size = 18) => svgIcon(`<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>`, size),
  check: (size = 18) => svgIcon(`<polyline points="20 6 9 17 4 12"/>`, size),
  camera: (size = 18) => svgIcon(`<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>`, size),
  clock: (size = 16) => svgIcon(`<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`, size),
  checkCircle: (size = 16) => svgIcon(`<circle cx="12" cy="12" r="9"/><polyline points="8 12.5 11 15.5 16 9"/>`, size),
  alertCircle: (size = 18) => svgIcon(`<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16.5" x2="12" y2="16.5"/>`, size),
  sparkles: (size = 16) => svgIcon(`<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>`, size),
  megaphone: (size = 18) => svgIcon(`<path d="M3 11v2a2 2 0 0 0 2 2h1l2 5h2l-1-5h4l6 4V7l-6 4H6a2 2 0 0 0-2 2z"/>`, size),
  upload: (size = 18) => svgIcon(`<path d="M12 16V4"/><polyline points="7 9 12 4 17 9"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>`, size),
  download: (size = 18) => svgIcon(`<path d="M12 4v12"/><polyline points="7 11 12 16 17 11"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>`, size),
  close: (size = 18) => svgIcon(`<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`, size),
  image: (size = 18) => svgIcon(`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><polyline points="4 17 9 12 13 16 16 13 20 17"/>`, size),
  fileText: (size = 18) => svgIcon(`<path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>`, size),
  logOut: (size = 18) => svgIcon(`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`, size),
  notif: (size = 18) => fillIcon("0 0 18 18", `<path d="M10.6266 14.9134C10.7029 15.0802 10.6571 15.2765 10.5144 15.3941C9.62395 16.0755 8.37728 16.0755 7.4868 15.3941C7.34511 15.277 7.29935 15.0817 7.37462 14.9154C7.4499 14.7491 7.62799 14.6517 7.81101 14.6773C8.59965 14.7826 9.39862 14.7826 10.1873 14.6773C10.3713 14.6502 10.5508 14.7467 10.6271 14.9134H10.6266ZM9.09999 2.06348C11.5658 2.06298 13.6646 3.82919 14.0473 6.22709L15.0647 11.7968C15.1803 12.4053 14.7912 12.9967 14.1797 13.1413C10.7752 13.9826 7.21227 13.9826 3.80778 13.1413H3.81467C3.20462 12.9952 2.81842 12.4039 2.93649 11.7968L3.95046 6.22709C4.33469 3.82869 6.43495 2.06249 8.90123 2.06348H9.09999Z"/>`, size),
  eye: (size = 18) => svgIcon(`<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>`, size),
  eyeOff: (size = 18) => svgIcon(`<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>`, size),
  ban: (size = 18) => svgIcon(`<path d="M2 21a8 8 0 0 1 11.873-7"/><circle cx="10" cy="8" r="5"/><path d="m17 17 5 5"/><path d="m22 17-5 5"/>`, size),
  unban: (size = 18) => svgIcon(`<path d="M2 21a8 8 0 0 1 13.292-6"/><circle cx="10" cy="8" r="5"/><path d="m16 19 2 2 4-4"/>`, size),
  users: (size = 18) => svgIcon(`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>`, size),
  layoutDashboard: (size = 18) => svgIcon(`<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>`, size),
  list: (size = 18) => svgIcon(`<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M14 4h7"/><path d="M14 9h7"/><path d="M14 15h7"/><path d="M14 20h7"/>`, size),
  settings: (size = 18) => svgIcon(`<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>`, size),

  // Socials
  youtube: (size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  discord: (size = 18) => `<svg width="${size}" height="${size}" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
  telegram: (size = 18) => `<svg width="${size}" height="${size}" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>`,
  instagram: (size = 18) => `<svg width="${size}" height="${size}" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
  facebook: (size = 18) => `<svg width="${size}" height="${size}" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  tiktok: (size = 18) => `<svg width="${size}" height="${size}" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  twitter: (size = 18) => `<svg width="${size}" height="${size}" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  github: (size = 18) => `<svg width="${size}" height="${size}" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`,
  whatsapp: (size = 18) => svgIcon(`<path d="M3 21l1.65-4.95A9 9 0 1 1 8.9 19.4L3 21Z"/><path d="M8.5 8.7c.1-.6.7-1 1.3-.9.4 0 .7.3.9.7l.5 1.2c.1.3.1.6-.1.9l-.5.6c-.1.2-.1.4 0 .6.4.8 1.6 2 2.4 2.4.2.1.4.1.6 0l.6-.5c.3-.2.6-.2.9-.1l1.2.5c.4.2.7.5.7.9.1.6-.3 1.2-.9 1.3-1.9.4-4.5-.6-6.2-2.3-1.7-1.7-2.7-4.3-2.3-6.2Z"/>`, size),
};

const LINK_ICON_KEYS = { discord: "discord", github: "github", twitter: "twitter", youtube: "youtube", facebook: "facebook", telegram: "telegram", instagram: "instagram", whatsapp: "whatsapp", tiktok: "tiktok", other: "externalLink" };
const LINK_PLATFORMS = [
  ["youtube", "YouTube"], ["discord", "Discord"], ["telegram", "Telegram"],
  ["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"],
  ["twitter", "X / Twitter"], ["whatsapp", "WhatsApp"], ["github", "GitHub"], ["other", "Other"]
];
const PLATFORM_META = {
  youtube:   { name: "YouTube",     color: "#FF0033", bg: "rgba(255, 0, 51, 0.12)",    border: "rgba(255, 0, 51, 0.28)" },
  discord:   { name: "Discord",     color: "#5865F2", bg: "rgba(88, 101, 242, 0.12)",  border: "rgba(88, 101, 242, 0.28)" },
  telegram:  { name: "Telegram",    color: "#229ED9", bg: "rgba(34, 158, 217, 0.12)",  border: "rgba(34, 158, 217, 0.28)" },
  instagram: { name: "Instagram",   color: "#E1306C", bg: "rgba(225, 48, 108, 0.12)",  border: "rgba(225, 48, 108, 0.28)" },
  facebook:  { name: "Facebook",    color: "#1877F2", bg: "rgba(24, 119, 242, 0.12)",  border: "rgba(24, 119, 242, 0.28)" },
  tiktok:    { name: "TikTok",      color: "#00F2FE", bg: "rgba(0, 242, 254, 0.12)",   border: "rgba(0, 242, 254, 0.28)" },
  twitter:   { name: "X / Twitter", color: "#F3F5F9", bg: "rgba(243, 245, 249, 0.10)", border: "rgba(243, 245, 249, 0.22)" },
  whatsapp:  { name: "WhatsApp",    color: "#25D366", bg: "rgba(37, 211, 102, 0.12)",  border: "rgba(37, 211, 102, 0.28)" },
  github:    { name: "GitHub",      color: "#E6EDF3", bg: "rgba(230, 237, 243, 0.10)", border: "rgba(230, 237, 243, 0.22)" },
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
  if (u.includes("whatsapp") || u.includes("wa.me")) return "whatsapp";
  if (u.includes("github.com")) return "github";
  return fallback;
}

function sanitizeUrl(url) {
  const u = String(url || "").trim();
  if (/^(https?:|mailto:)/i.test(u)) return u;
  return "#";
}

/* ---------------------------------------------------------------- */
/*  CONSTANTS & DEFAULTS                                            */
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
  dmca: "If you believe content posted on this app infringes your rights, please contact the owner with valid proof.\n\nValid requests will be reviewed and content removed.",
  privacy: "We only store what's needed to run CraftVerse: your account info, submitted maps, and favorites.",
  contact: "Have a question, feedback, or a DMCA request? Reach out through the official social links.",
};

const DEFAULT_AD_SETTINGS = {
  adsEnabled: true, bannerEnabled: true, nativeEnabled: true, postViewEnabled: true,
  nativeFrequency: 4, postViewAdType: "image", postViewAdImage: "", postViewAdLink: "", postViewAdCode: "",
};

const DEFAULT_BRANDING = {
  siteName: "CraftVerse",
  logo: "https://i.postimg.cc/8PBXwcSh/file-000000006544720bad38bb78a9528ad6.png",
  footerLogo: "https://i.postimg.cc/NMqRW863/file-000000001f307207805497354cbb729f.png",
  headerTagline: "FreeFire Craftland Community",
  footerTagline: "Craftland map codes, previews & tutorials from the passionate creator community.",
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
  footerSocialDesign: "design1",
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_STORED_IMAGE_BYTES = 500 * 1024;

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
    toast: null,
    confirm: null,
    postOrigin: "home",
    ownerTab: "dashboard",
  },
};

/* ---------------------------------------------------------------- */
/*  HELPERS                                                         */
/* ---------------------------------------------------------------- */
function esc(str) {
  return String(str ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
function escAttr(str) {
  return String(str ?? "").replace(/"/g, "&quot;");
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

function toggleLike(postId) {
  if (!(state.session && (state.session.role === "admin" || state.session.role === "owner"))) {
    navigate("creatorAuth");
    return;
  }
  const idx = state.likedIds.indexOf(postId);
  if (idx >= 0) state.likedIds.splice(idx, 1);
  else state.likedIds.push(postId);
  localStorage.setItem("cv_liked", JSON.stringify(state.likedIds));
  render();
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

function fileToCompressedDataUrl(file, targetMaxBytes = MAX_STORED_IMAGE_BYTES, maxDim = 1000) {
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
      img.onerror = () => reject(new Error("Couldn't read image"));
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------------------------------------------------------------- */
/*  UI ATOMS & BUTTON SYSTEM (UNIFORM SIZES)                        */
/* ---------------------------------------------------------------- */
function backBtn(action = "nav", id = "home") {
  return `<button data-action="${action}" data-id="${escAttr(id)}" title="Back" class="w-9 h-9 rounded-[10px] border border-bd bg-[#151D2F] hover:bg-[#1C2540] flex items-center justify-center text-[#8A93AC] hover:text-white transition-all flex-shrink-0 active:scale-95 shadow-sm">${ICONS.arrowLeft(18)}</button>`;
}

function closeBtn(action, id = "") {
  return `<button data-action="${action}" data-id="${escAttr(id)}" title="Close" class="w-9 h-9 rounded-[10px] border border-bd bg-[#151D2F] hover:bg-[#1C2540] flex items-center justify-center text-[#8A93AC] hover:text-white transition-all flex-shrink-0 active:scale-95 shadow-sm">${ICONS.close(18)}</button>`;
}

function avatarHtml(name, src, size = 40) {
  if (src) return `<img src="${escAttr(src)}" alt="${escAttr(name)}" class="rounded-full object-cover border border-bd flex-shrink-0" style="width:${size}px;height:${size}px;" />`;
  const [c1, c2] = gradientFor(name);
  const letter = name ? name.trim()[0].toUpperCase() : "?";
  return `<div class="rounded-full flex items-center justify-center flex-shrink-0 font-sora font-bold text-white shadow-inner" style="width:${size}px;height:${size}px;background:linear-gradient(135deg, ${c1}, ${c2});font-size:${size * 0.4}px;">${letter}</div>`;
}

function thumbPlaceholder(radius = 16) {
  return `<div class="w-full flex items-center justify-center" style="aspect-ratio:16/9;border-radius:${radius}px;background:linear-gradient(135deg, #131B2E, #0E1524);"><span class="opacity-30 text-[#3E8EFF]">${ICONS.image(32)}</span></div>`;
}

function dangerIconBtn({ action, id = "", size = 36 }) {
  return `<button data-action="${action}" data-id="${escAttr(id)}" class="w-9 h-9 border flex items-center justify-center flex-shrink-0 transition-all active:scale-95" style="border-radius:10px;background:rgba(255,93,108,.12);border-color:rgba(255,93,108,.3);color:#FF5D6C;">${ICONS.trash(16)}</button>`;
}

function iconBtn({ action, id = "", active = false, extra = "", size = 36, radius = 10, icon }) {
  return `<button data-action="${action}" data-id="${escAttr(id)}" class="border border-bd flex items-center justify-center flex-shrink-0 text-tmuted ${active ? "bg-coral/15" : "bg-panelalt"} ${extra}" style="width:${size}px;height:${size}px;border-radius:${radius}px;">${icon}</button>`;
}

function primaryBtn({ action = "", id = "", label, icon = "", extra = "", type = "button" }) {
  return `<button type="${type}" data-action="${action}" data-id="${escAttr(id)}" class="rounded-xl text-white font-sora font-bold text-sm px-4 py-3 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(62,142,255,0.28)] hover:shadow-[0_6px_20px_rgba(62,142,255,0.4)] active:scale-[0.98] transition-all ${extra}" style="background:linear-gradient(135deg, #3E8EFF, #7C5CFF);">${icon}${label}</button>`;
}

function ghostBtn({ action = "", id = "", label, icon = "", color = "", extra = "" }) {
  return `<button data-action="${action}" data-id="${escAttr(id)}" class="rounded-xl border border-bd bg-[#131927]/60 hover:bg-[#182032] font-sora font-semibold text-sm px-3.5 py-2.5 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all ${extra}" style="color:${color || "#8A93AC"};">${icon}${label}</button>`;
}

const inputCls = "w-full bg-[#0F1420] border border-[#232D48] focus:border-[#3E8EFF] focus:ring-2 focus:ring-[#3E8EFF]/20 rounded-xl px-3.5 py-2.5 text-[#F3F5F9] font-inter text-sm outline-none transition-all placeholder-[#4A5578]";

function fieldWrap(label, inner) {
  return `<div class="mb-3.5"><div class="font-mono text-[11px] tracking-wider text-tfaint uppercase mb-1.5">${label}</div>${inner}</div>`;
}

function modernIconBadgeHtml(platformKey, size = 40) {
  const meta = PLATFORM_META[platformKey] || PLATFORM_META.other;
  const iconFn = ICONS[LINK_ICON_KEYS[platformKey] || "externalLink"];
  const iconSvg = iconFn ? iconFn(Math.round(size * 0.48)) : ICONS.externalLink(Math.round(size * 0.48));
  return `<div class="flex items-center justify-center flex-shrink-0 rounded-[12px] transition-all"
    style="width:${size}px;height:${size}px;background:${meta.bg};border:1px solid ${meta.border};color:${meta.color};box-shadow:0 4px 14px ${meta.bg};">
    ${iconSvg}
  </div>`;
}

function modernLinkCardHtml({ url, title, platformKey, subtitle }) {
  const safeUrl = sanitizeUrl(url);
  const meta = PLATFORM_META[platformKey] || PLATFORM_META.other;
  const subText = subtitle || meta.name;
  return `<a href="${escAttr(safeUrl)}" target="_blank" rel="noopener noreferrer"
    class="group flex items-center gap-3.5 bg-[#131927]/90 border border-bd hover:border-[#3E8EFF]/40 rounded-2xl p-3 no-underline transition-all duration-200 active:scale-[0.98] hover:bg-[#182032]">
    ${modernIconBadgeHtml(platformKey, 40)}
    <div class="flex-1 min-w-0">
      <div class="font-sora font-semibold text-[14px] text-tprimary group-hover:text-accent transition-colors truncate">${esc(title)}</div>
      <div class="font-inter text-[11px] text-tfaint truncate mt-0.5">${esc(subText)}</div>
    </div>
    <div class="w-8 h-8 rounded-full border border-bd bg-panelalt flex items-center justify-center text-tfaint group-hover:text-white group-hover:border-accent/40 group-hover:bg-accent/15 transition-all flex-shrink-0">
      ${ICONS.arrowUpRight(14)}
    </div>
  </a>`;
}

function statusBadge(status) {
  const approved = status === "approved";
  return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase font-bold tracking-wider" style="background:${approved ? "rgba(52,211,153,.12)" : "rgba(251,191,36,.12)"};border:1px solid ${approved ? "rgba(52,211,153,.3)" : "rgba(251,191,36,.3)"};color:${approved ? "#34D399" : "#FBBF24"};">${approved ? ICONS.checkCircle(12) : ICONS.clock(12)} ${approved ? "Approved" : "Pending"}</span>`;
}

function toggleHtml(id, checked, labelOn, labelOff) {
  return `<button data-action="toggle-field" data-id="${id}" data-checked="${checked ? "1" : "0"}" class="flex items-center gap-2.5">
    <span class="block rounded-full border toggle-track" style="width:42px;height:24px;background:${checked ? "#34D399" : "#1C2540"};border-color:${checked ? "#34D399" : "#232D48"};position:relative;">
      <span class="block rounded-full bg-white toggle-knob" style="width:18px;height:18px;position:absolute;top:2px;left:${checked ? "21px" : "2px"};"></span>
    </span>
    <span class="font-inter text-[13px] text-tmuted">${checked ? labelOn : labelOff}</span>
  </button>`;
}

/* ---------------------------------------------------------------- */
/*  FIRESTORE LISTENERS & AUTH                                      */
/* ---------------------------------------------------------------- */
onSnapshot(collection(db, "accounts"), (snap) => {
  state.accounts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  state.accountsLoaded = true;
  if (state.session && state.session.uid) {
    const updated = state.accounts.find((a) => a.id === state.session.uid);
    if (updated) {
      state.session.account = updated;
      state.session.role = updated.role;
    }
  }
  render();
});

onSnapshot(collection(db, "posts"), (snap) => {
  state.posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  state.postsLoaded = true;
  render();
});

onSnapshot(doc(db, "site-content", "main"), (d) => {
  if (d.exists()) state.siteContent = d.data();
  render();
});

onSnapshot(doc(db, "ad-settings", "main"), (d) => {
  if (d.exists()) state.adSettings = d.data();
  render();
});

onSnapshot(doc(db, "branding", "main"), (d) => {
  if (d.exists()) state.branding = { ...DEFAULT_BRANDING, ...d.data() };
  state.brandingLoaded = true;
  render();
});

let unsubNotifications = null;
onAuthStateChanged(auth, async (user) => {
  if (unsubNotifications) { unsubNotifications(); unsubNotifications = null; }
  if (user) {
    try {
      const snap = await getDoc(doc(db, "accounts", user.uid));
      state.session = snap.exists() ? { uid: user.uid, role: snap.data().role, account: { id: user.uid, ...snap.data() } } : { uid: user.uid, role: null, account: null };
      const nq = query(collection(db, "notifications"), where("uid", "==", user.uid), orderBy("createdAt", "desc"), limit(30));
      unsubNotifications = onSnapshot(nq, (nsnap) => {
        state.notifications = nsnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        render();
      });
    } catch (e) { state.session = null; }
  } else {
    state.session = null;
    state.notifications = [];
  }
  state.authResolved = true;
  render();
});

async function fsSetAccount(uid, data) {
  try { await setDoc(doc(db, "accounts", uid), data, { merge: true }); return true; }
  catch (e) { return false; }
}
async function fsSetPost(id, data) {
  try { await setDoc(doc(db, "posts", id), data, { merge: true }); return true; }
  catch (e) { return false; }
}
async function fsDeletePost(id) {
  try { await deleteDoc(doc(db, "posts", id)); return true; }
  catch (e) { return false; }
}
async function fsSaveSiteContent(data) {
  try { await setDoc(doc(db, "site-content", "main"), data, { merge: true }); return true; }
  catch (e) { return false; }
}
async function fsSaveAdSettings(data) {
  try { await setDoc(doc(db, "ad-settings", "main"), data, { merge: true }); return true; }
  catch (e) { return false; }
}
async function fsSaveBranding(data) {
  try { await setDoc(doc(db, "branding", "main"), data, { merge: true }); return true; }
  catch (e) { return false; }
}
async function addNotification(uid, type, title, message) {
  try {
    await setDoc(doc(collection(db, "notifications")), { uid, type, title, message, read: false, createdAt: serverTimestamp() });
  } catch (e) {}
}

/* ---------------------------------------------------------------- */
/*  HEADER, UNIFORM BACK HEADER & SIDEBAR                           */
/* ---------------------------------------------------------------- */
function headerLogoHtml(height = 36) {
  const b = state.branding;
  if (b.logo) return `<img src="${escAttr(b.logo)}" alt="${escAttr(b.siteName)}" class="object-contain flex-shrink-0 rounded-xl" style="height:${height}px;width:auto;max-width:180px;" />`;
  return `<div class="rounded-xl flex items-center justify-center font-sora font-extrabold text-white flex-shrink-0 shadow-md" style="width:${height}px;height:${height}px;background:linear-gradient(135deg,#3E8EFF,#7C5CFF);">${(b.siteName || "C")[0]}</div>`;
}

function homeHeaderHtml() {
  const b = state.branding;
  const isLoggedInCreator = !!(state.session && state.session.role === "admin");
  const rightParts = [];

  if (isLoggedInCreator) {
    if (b.showLanguage !== false) rightParts.push(`<button data-action="open-language" class="w-9 h-9 rounded-[10px] border border-bd bg-[#151D2F] flex items-center justify-center text-[#8A93AC] hover:text-white transition-all active:scale-95">${ICONS.globe(18)}</button>`);
    if (b.showNotifications !== false) rightParts.push(`<button data-action="nav" data-id="notifications" class="relative w-9 h-9 rounded-[10px] border border-bd bg-[#151D2F] flex items-center justify-center text-[#8A93AC] hover:text-white transition-all active:scale-95">${state.notifications.filter((n) => !n.read).length > 0 ? `<span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF5D6C] animate-pulse"></span>` : ""}${ICONS.notif(18)}</button>`);
  } else if (b.showSignIn !== false) {
    rightParts.push(`<button data-action="nav" data-id="creatorAuth" class="rounded-full font-sora font-bold text-xs text-white px-4 py-2 shadow-[0_4px_12px_rgba(62,142,255,0.3)] active:scale-95 transition-all" style="background:linear-gradient(135deg,#3E8EFF,#7C5CFF);">Sign In</button>`);
  }

  return `<div id="site-header" class="sticky top-0 z-20 bg-[#0A0E17]/95 backdrop-blur-md border-b border-[#1C2540]">
    <div class="flex items-center gap-3 h-14 px-4 max-w-6xl mx-auto">
      ${headerLogoHtml(34)}
      <div class="flex flex-col justify-center leading-tight min-w-0">
        <div class="font-sora font-extrabold text-[16px] tracking-tight truncate text-[#F3F5F9]">${esc(b.siteName)}</div>
        <div class="font-inter text-[10px] text-tfaint truncate font-medium">${esc(b.headerTagline)}</div>
      </div>
      <div class="flex-1"></div>
      <div class="flex items-center gap-2 flex-shrink-0">${rightParts.join("")}</div>
    </div>
  </div>`;
}

function backHeaderHtml(title, backAction = "nav", backId = "home", rightHtml = "") {
  return `<div class="sticky top-0 z-20 bg-[#0A0E17]/95 backdrop-blur-md border-b border-[#1C2540] flex items-center gap-3 h-14 px-4">
    ${backBtn(backAction, backId)}
    <div class="flex-1 font-sora font-bold text-[16px] truncate text-[#F3F5F9]">${esc(title)}</div>
    ${rightHtml}
  </div>`;
}

function sidebarNavHtml(activeScreen) {
  const isLoggedInCreator = !!(state.session && (state.session.role === "admin" || state.session.role === "owner"));
  const isOwner = !!(state.session && state.session.role === "owner");
  const gate = (id) => (isLoggedInCreator ? id : "creatorAuth");

  const items = [
    { action: "nav", id: "home", label: "Home", icon: ICONS.navHome(20), active: activeScreen === "home" },
    { action: "open-explore", id: "", label: "Explore", icon: ICONS.navExplore(20), active: state.ui.exploreOpen },
    { action: "nav", id: gate("submit"), label: "Submit Map", icon: ICONS.plus(20), active: activeScreen === "submit" },
    { action: "nav", id: gate("favorites"), label: "Favorites", icon: ICONS.navFavorite(20), active: activeScreen === "favorites" },
    { action: "nav", id: gate("account"), label: "Profile", icon: ICONS.navProfile(20), active: activeScreen === "account" },
  ];
  if (isOwner) {
    items.push({ action: "nav", id: "ownerPanel", label: "Owner Panel", icon: ICONS.layoutDashboard(20), active: activeScreen === "ownerPanel" });
  }

  const account = state.session && state.session.account;

  return `<aside class="hidden md:flex flex-col flex-shrink-0 border-r border-[#1C2540] bg-[#0A0E17] w-[230px] sticky top-0 h-screen select-none z-30">
    <div class="flex items-center gap-3 px-5 h-16 border-b border-[#1C2540]/60">
      <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3E8EFF] to-[#7C5CFF] flex items-center justify-center font-sora font-black text-white text-base shadow-[0_0_15px_rgba(62,142,255,0.4)]">
        ${(state.branding.siteName || "C")[0]}
      </div>
      <div class="font-sora font-extrabold text-[16px] text-white tracking-tight truncate">${esc(state.branding.siteName)}</div>
    </div>

    <div class="flex flex-col gap-1.5 p-3 flex-1 overflow-y-auto">
      ${items.map((it) => `
        <button data-action="${it.action}" data-id="${it.id}" 
          class="flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-sora font-semibold text-[13.5px] transition-all active:scale-95 text-left ${it.active ? 'bg-[#3E8EFF]/15 text-[#3E8EFF] border border-[#3E8EFF]/30 shadow-[0_0_15px_rgba(62,142,255,0.15)]' : 'text-[#8A93AC] hover:text-white hover:bg-[#131927] border border-transparent'}">
          <span class="flex items-center justify-center w-5 h-5 flex-shrink-0">${it.icon}</span>
          <span class="truncate">${it.label}</span>
        </button>
      `).join("")}
    </div>

    <div class="p-3 border-t border-[#1C2540]">
      ${account ? `
        <div class="flex items-center gap-2.5 p-2 rounded-xl bg-[#131927] border border-bd mb-2">
          ${avatarHtml(account.name, account.avatar, 32)}
          <div class="min-w-0 flex-1">
            <div class="font-sora font-bold text-xs text-white truncate">${esc(account.name)}</div>
            <div class="font-inter text-[10px] text-tfaint truncate">${account.role === "owner" ? "Owner" : "Creator"}</div>
          </div>
        </div>
        <button data-action="confirm-logout" class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-inter text-xs text-[#FF5D6C] hover:bg-[#FF5D6C]/10 transition-colors">
          ${ICONS.logOut(15)}<span>Log out</span>
        </button>
      ` : `
        <button data-action="nav" data-id="creatorAuth" class="w-full py-2.5 rounded-xl font-sora font-bold text-xs text-white shadow-md transition-all active:scale-95" style="background:linear-gradient(135deg,#3E8EFF,#7C5CFF);">
          Sign In
        </button>
      `}
    </div>
  </aside>`;
}

function publicBottomNavHtml(activeScreen) {
  const isLoggedInCreator = !!(state.session && (state.session.role === "admin" || state.session.role === "owner"));
  const gate = (id) => (isLoggedInCreator ? id : "creatorAuth");

  const items = [
    { action: "nav", id: "home", icon: ICONS.navHome(22), active: activeScreen === "home" },
    { action: "open-explore", id: "", icon: ICONS.navExplore(22), active: state.ui.exploreOpen },
    { action: "nav", id: gate("submit"), icon: ICONS.plus(22), active: activeScreen === "submit" },
    { action: "nav", id: gate("favorites"), icon: ICONS.navFavorite(22), active: activeScreen === "favorites" },
    { action: "nav", id: gate("account"), icon: ICONS.navProfile(22), active: activeScreen === "account" },
  ];

  return `
  <nav class="md:hidden fixed left-1/2 bottom-4 z-40 flex items-center justify-around w-[calc(100%-32px)] max-w-[420px] h-[60px] rounded-full px-2"
    style="transform:translateX(-50%); background:rgba(15, 21, 36, 0.88); border:1px solid rgba(255,255,255,0.12); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); box-shadow:0 12px 35px rgba(0,0,0,0.55);">
    ${items.map((it) => `
      <button data-action="${it.action}" data-id="${it.id}" 
        class="relative flex flex-col items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90 ${it.active ? 'text-[#3E8EFF] scale-105' : 'text-[#8A93AC] hover:text-white'}">
        <span class="flex items-center justify-center">${it.icon}</span>
        ${it.active ? `<span class="w-1.5 h-1.5 rounded-full bg-[#3E8EFF] shadow-[0_0_8px_#3E8EFF] mt-0.5"></span>` : ""}
      </button>
    `).join("")}
  </nav>`;
}

/* ---------------------------------------------------------------- */
/*  BANNER SLIDER                                                   */
/* ---------------------------------------------------------------- */
let bannerSlideIndex = 0;

function bannerSliderHtml() {
  const slides = (state.branding.bannerSlides || []).filter((s) => s.image);
  if (slides.length === 0) return "";

  if (bannerSlideIndex >= slides.length) bannerSlideIndex = 0;
  const slide = slides[bannerSlideIndex];

  const img = `<img src="${escAttr(slide.image)}" alt="Banner" class="w-full object-cover rounded-2xl md:rounded-3xl h-[160px] sm:h-[220px] md:h-[280px] lg:h-[330px] transition-all duration-500 shadow-lg border border-bd" />`;
  const clickable = slide.link ? `<a href="${escAttr(sanitizeUrl(slide.link))}" target="_blank" rel="noopener noreferrer" class="block no-underline">${img}</a>` : img;

  const dots = slides.length > 1
    ? `<div class="flex justify-center gap-2 mt-3">${slides.map((_, i) => `
        <button data-action="set-banner-slide" data-id="${i}" class="rounded-full transition-all duration-300" style="width:${i === bannerSlideIndex ? "24px" : "8px"};height:7px;background:${i === bannerSlideIndex ? "#3E8EFF" : "#232D48"};"></button>
      `).join("")}</div>`
    : "";

  return `<div id="banner-slider-touch" class="mb-6 relative group">${clickable}${dots}</div>`;
}

function bannerSkeletonHtml() {
  return `<div class="mb-6 animate-pulse">
    <div class="w-full rounded-2xl md:rounded-3xl h-[160px] sm:h-[220px] md:h-[280px] lg:h-[330px] bg-[#161E33]"></div>
  </div>`;
}

setInterval(() => {
  const slides = (state.branding.bannerSlides || []).filter((s) => s.image);
  if (slides.length > 1 && parseHash().screen === "home") {
    bannerSlideIndex = (bannerSlideIndex + 1) % slides.length;
    render();
  }
}, 5000);

/* ---------------------------------------------------------------- */
/*  FOOTER (Tablet & Desktop Redesigned)                            */
/* ---------------------------------------------------------------- */
function footerHtml() {
  const b = state.branding;
  const socials = b.socialEnabled ? (b.socialLinks || []).filter((l) => l.enabled && l.url) : [];
  const year = new Date().getFullYear();

  return `
  <footer class="mt-12 bg-[#0C111D] border-t border-[#1C2540] rounded-t-[32px] p-6 pb-28 md:p-10 md:pb-12 text-[#8A93AC]">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-8">
      
      <div class="flex flex-col items-center md:items-start text-center md:text-left md:max-w-sm">
        <img src="${escAttr(b.footerLogo || b.logo)}" alt="${escAttr(b.siteName)}" class="object-contain max-w-[160px] max-h-[56px] mb-3.5" />
        <p class="font-inter text-xs text-tmuted leading-relaxed mb-4">${esc(b.footerTagline)}</p>
        <div class="hidden md:block font-inter text-[11px] text-tfaint">© ${year} ${esc(b.siteName)}. All rights reserved.</div>
      </div>

      <div class="flex flex-col items-center md:items-end gap-5">
        ${socials.length ? `
          <div class="flex flex-wrap justify-center md:justify-end gap-2.5">
            ${socials.map((l) => {
              const meta = PLATFORM_META[l.icon] || PLATFORM_META.other;
              const iconFn = ICONS[LINK_ICON_KEYS[l.icon] || "externalLink"];
              return `
              <a href="${escAttr(sanitizeUrl(l.url))}" target="_blank" rel="noopener noreferrer" 
                class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#232D48] bg-[#131927] hover:bg-[#1A2338] hover:border-accent/40 transition-all hover:scale-105 active:scale-95 no-underline" style="color:${meta.color};" title="${escAttr(l.label || meta.name)}">
                ${(iconFn || ICONS.externalLink)(16)}
                <span class="text-xs font-semibold text-[#F3F5F9]">${esc(l.label || meta.name)}</span>
              </a>`;
            }).join("")}
          </div>
        ` : ""}

        ${b.footerLinksEnabled !== false ? `
          <div class="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-2 text-xs font-semibold">
            ${[["about", "About"], ["terms", "Terms"], ["dmca", "DMCA"], ["privacy", "Privacy"], ["contact", "Contact"]]
              .filter(([k]) => (b.footerPages || {})[k] !== false)
              .map(([k, label]) => `<button data-action="nav" data-id="${k}" class="bg-transparent border-none text-[#8A93AC] hover:text-[#3E8EFF] transition-colors">${label}</button>`).join("")}
            ${(b.footerCustomLinks || []).filter((l) => l.enabled !== false && l.url).map((l) => `<a href="${escAttr(sanitizeUrl(l.url))}" target="_blank" rel="noopener noreferrer" class="text-[#8A93AC] hover:text-[#3E8EFF] no-underline transition-colors">${esc(l.label || "Link")}</a>`).join("")}
          </div>
        ` : ""}

        <div class="md:hidden font-inter text-[11px] text-tfaint text-center mt-2">© ${year} ${esc(b.siteName)}. All rights reserved.</div>
      </div>

    </div>
  </footer>`;
}

/* ---------------------------------------------------------------- */
/*  POST CARD UI                                                    */
/* ---------------------------------------------------------------- */
function postCardHtml(post, author) {
  const liked = state.likedIds.includes(post.id);
  const primaryCode = (post.codes && post.codes[0]?.code) || post.mapCode || "";

  return `
  <div class="group relative bg-[#131927]/90 hover:bg-[#182032] border border-[#232D48] hover:border-[#3E8EFF]/40 rounded-[22px] p-3.5 mb-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(62,142,255,0.12)]">
    <div data-action="open-post" data-id="${post.id}" class="cursor-pointer relative overflow-hidden rounded-[16px] aspect-video bg-[#0A0E17]">
      ${post.thumbnail 
        ? `<img src="${escAttr(post.thumbnail)}" alt="${escAttr(post.title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />` 
        : thumbPlaceholder(16)}
      
      <div class="absolute inset-0 bg-gradient-to-t from-[#0A0E17]/80 via-transparent to-black/20 pointer-events-none"></div>

      ${post.category ? `
        <div class="absolute top-2.5 left-2.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-black/60 backdrop-blur-md border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          ${esc(post.category)}
        </div>
      ` : ""}
    </div>

    <div class="flex items-center justify-between gap-2 mt-3.5">
      <div data-action="open-profile" data-id="${author.id}" class="flex items-center gap-2 cursor-pointer bg-[#1C2540]/60 hover:bg-[#232D48] border border-[#2B3758] rounded-full pr-3 py-0.5 pl-0.5 transition-colors max-w-[65%]">
        ${avatarHtml(author.name, author.avatar, 26)}
        <span class="font-sora font-semibold text-[13px] text-[#E2E8F0] truncate">${esc(author.name)}</span>
      </div>

      <div class="flex items-center gap-1.5 flex-shrink-0">
        <button data-action="toggle-like" data-id="${post.id}" title="Like" class="w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-90 ${liked ? 'bg-[#FF5D6C]/15 border-[#FF5D6C]/40 text-[#FF5D6C]' : 'bg-[#1C2540]/60 border-[#2B3758] text-[#8A93AC] hover:text-white'}">
          ${ICONS.heart(liked, 15)}
        </button>
        <button data-action="share-post" data-id="${post.id}" title="Share" class="w-8 h-8 rounded-full flex items-center justify-center bg-[#1C2540]/60 hover:bg-[#232D48] border border-[#2B3758] text-[#8A93AC] hover:text-white transition-all active:scale-90">
          ${ICONS.share(15)}
        </button>
      </div>
    </div>

    <div data-action="open-post" data-id="${post.id}" class="mt-2.5 cursor-pointer font-sora font-bold text-[15px] text-[#F3F5F9] group-hover:text-[#3E8EFF] transition-colors line-clamp-1">
      ${esc(post.title)}
    </div>

    ${primaryCode ? `
      <div class="mt-3 pt-3 border-t border-[#1F2942] flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="text-[10px] font-mono text-[#6B779A] uppercase tracking-wide">Code:</span>
          <span class="font-mono text-xs text-amber-300 font-bold tracking-wider truncate select-all">${esc(primaryCode)}</span>
        </div>
        <button data-action="copy-map-code" data-id="${escAttr(primaryCode)}" class="px-2.5 py-1 rounded-lg bg-[#3E8EFF]/15 hover:bg-[#3E8EFF]/25 border border-[#3E8EFF]/30 text-[#3E8EFF] text-[11px] font-sora font-bold flex items-center gap-1 flex-shrink-0 active:scale-95 transition-all">
          ${ICONS.copy(12)} Copy
        </button>
      </div>
    ` : ""}
  </div>`;
}

function skeletonCardHtml() {
  return `<div class="bg-panel border border-bd rounded-[22px] p-3.5 mb-4 animate-pulse">
    <div class="w-full rounded-[16px] aspect-video bg-[#182033]"></div>
    <div class="flex items-center gap-2 mt-3">
      <div class="rounded-full w-7 h-7 bg-[#182033]"></div>
      <div class="rounded-md w-24 h-3 bg-[#182033]"></div>
    </div>
    <div class="rounded-md mt-3 w-3/4 h-4 bg-[#182033]"></div>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  POST VIEW                                                       */
/* ---------------------------------------------------------------- */
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

function postViewScreenHtml(post) {
  const author = getAuthor(post.authorId);
  const liked = state.likedIds.includes(post.id);
  const codes = getPostCodes(post);
  const links = getPostLinks(post);

  return `
  <div class="relative">
    <div class="absolute top-3.5 left-3.5 z-10">
      ${backBtn("nav", state.ui.postOrigin)}
    </div>
    ${post.thumbnail ? `<img src="${escAttr(post.thumbnail)}" alt="${escAttr(post.title)}" class="w-full object-cover max-h-[420px] aspect-video rounded-b-3xl border-b border-bd" />` : thumbPlaceholder(0)}
  </div>
  <div class="px-4 md:px-8 pt-4 pb-12 max-w-4xl mx-auto">
    <div class="flex items-center gap-3 bg-[#131927] border border-bd rounded-2xl p-3 relative z-[2] -mt-8 shadow-xl">
      <div data-action="open-profile" data-id="${author.id}" class="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0">
        ${avatarHtml(author.name, author.avatar, 38)}
        <div class="min-w-0">
          <div class="font-sora font-bold text-sm text-white truncate">${esc(author.name)}</div>
          <div class="font-inter text-[11px] text-tfaint">Creator</div>
        </div>
      </div>
      <button data-action="toggle-like" data-id="${post.id}" class="w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${liked ? 'bg-[#FF5D6C]/15 border-[#FF5D6C]/40 text-[#FF5D6C]' : 'bg-[#1C2540] border-bd text-[#8A93AC]'}">
        ${ICONS.heart(liked, 18)}
      </button>
      <button data-action="share-post" data-id="${post.id}" class="w-9 h-9 rounded-xl border border-bd bg-[#1C2540] flex items-center justify-center text-[#8A93AC] hover:text-white transition-all">
        ${ICONS.share(18)}
      </button>
    </div>

    <div class="mt-6 font-sora font-black text-xl md:text-2xl text-white uppercase tracking-wide">${esc(post.title)}</div>
    <div class="mt-3 pl-3.5 border-l-2 border-[#3E8EFF] text-[#9BA5C0] font-inter text-sm leading-relaxed whitespace-pre-wrap">${esc(post.description)}</div>

    <div class="mt-8 flex flex-col gap-4">
      <div class="font-sora font-extrabold text-sm uppercase tracking-wider text-white flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-[#3E8EFF]"></span> Map Code
      </div>
      ${codes.length === 0 ? `<div class="text-tfaint text-sm">No map codes added.</div>` : codes.map((c) => `
        <div class="relative bg-gradient-to-r from-[#161D2F] to-[#121826] border border-[#2B3758] hover:border-amber-400/40 rounded-2xl p-4 shadow-lg overflow-hidden group">
          <div class="flex items-center justify-between mb-2">
            <span class="font-mono font-bold text-[11px] text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              ${esc(c.title || "Free Fire Map Code")}
            </span>
            <span class="text-[10px] text-tfaint font-mono">1-Tap Copy</span>
          </div>
          <div class="flex items-center gap-2.5 bg-[#0A0E17] border border-[#232D48] rounded-xl p-1.5 pl-3.5">
            <div class="flex-1 font-mono font-extrabold text-sm md:text-base text-amber-300 tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none py-1">
              ${c.code ? esc(c.code) : '<span class="text-tfaint font-normal">Not added</span>'}
            </div>
            <button data-action="copy-map-code" data-id="${escAttr(c.code || "")}" 
              class="h-10 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-black font-sora font-extrabold text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-[0_4px_14px_rgba(245,158,11,0.3)] transition-all">
              ${ICONS.copy(14)} Copy
            </button>
          </div>
        </div>
      `).join("")}

      ${links.length ? `
        <div class="font-sora font-extrabold text-sm uppercase tracking-wider text-white mt-4 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-cyan-400"></span> Tutorial / Previews
        </div>
        <div class="flex flex-col gap-2.5">
          ${links.map((l) => modernLinkCardHtml({ url: l.url, title: l.title || "Watch video", platformKey: l.icon || detectPlatformKey(l.url), subtitle: "Tap to watch preview" })).join("")}
        </div>
      ` : ""}
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  POST EDITOR                                                     */
/* ---------------------------------------------------------------- */
let postEditorDraft = null;

function emptyPostDraft(authorId) {
  return { id: "p" + Date.now(), title: "", category: "", description: "", thumbnail: "", codes: [{ id: "c" + Date.now(), title: "", code: "" }], links: [], authorId, status: "pending", hidden: false };
}

function postEditorHtml(draft) {
  return `<div class="bg-panel border border-bd rounded-2xl p-5 mb-6" id="post-editor">
    ${fieldWrap("Map Title", `<input id="pe-title" class="${inputCls}" value="${escAttr(draft.title)}" placeholder="e.g. Sunset Sky Arena" />`)}
    ${fieldWrap("Category", `<input id="pe-category" class="${inputCls}" value="${escAttr(draft.category)}" placeholder="e.g. Gun Fight, Parkour, Arena" />`)}
    ${fieldWrap("Description", `<textarea id="pe-description" class="${inputCls}" style="min-height:90px;">${esc(draft.description)}</textarea>`)}
    ${fieldWrap("Thumbnail Image", `
      <div class="flex gap-2">
        <input id="pe-thumbnail" class="${inputCls} flex-1" value="${draft.thumbnail && draft.thumbnail.startsWith("data:") ? "(Uploaded image)" : escAttr(draft.thumbnail)}" placeholder="Paste image link or upload" />
        <button data-action="pe-upload-thumb" class="rounded-xl border border-bd bg-panelalt px-4 flex items-center justify-center text-sm font-semibold">${ICONS.upload()} <span class="ml-1.5 hidden sm:inline">Upload</span></button>
        <input id="pe-thumbnail-file" type="file" accept="image/*" class="hidden" />
      </div>
      ${draft.thumbnail ? `<img src="${escAttr(draft.thumbnail)}" class="mt-2.5 w-full object-cover rounded-xl border border-bd max-h-40" />` : ""}
    `)}

    <div class="font-mono text-xs text-tfaint uppercase tracking-wider mt-5 mb-2">Map Codes</div>
    <div id="pe-codes" class="space-y-2 mb-3">
      ${draft.codes.map((c, i) => `
        <div class="bg-bgdeep border border-bd rounded-xl p-3 flex gap-2">
          <input class="${inputCls} pe-code-title" data-idx="${i}" value="${escAttr(c.title)}" placeholder="Name (e.g. India Server)" />
          <input class="${inputCls} font-mono pe-code-value" data-idx="${i}" value="${escAttr(c.code)}" placeholder="Code e.g. 123-456" />
          ${dangerIconBtn({ action: "pe-remove-code", id: String(i) })}
        </div>
      `).join("")}
    </div>
    <button data-action="pe-add-code" class="w-full py-2.5 rounded-xl border border-dashed border-bd text-tmuted font-semibold text-xs mb-4 flex items-center justify-center gap-1.5 hover:text-white">${ICONS.plus(15)} Add Another Code</button>

    <div class="flex gap-3">
      ${primaryBtn({ action: "pe-save", label: "Save Map", icon: ICONS.save(16), extra: "flex-1" })}
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
  document.querySelectorAll(".pe-code-title").forEach((el) => el.addEventListener("input", (e) => { postEditorDraft.codes[+e.target.dataset.idx].title = e.target.value; }));
  document.querySelectorAll(".pe-code-value").forEach((el) => el.addEventListener("input", (e) => { postEditorDraft.codes[+e.target.dataset.idx].code = e.target.value; }));
  const fileInput = document.getElementById("pe-thumbnail-file");
  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        postEditorDraft.thumbnail = await fileToCompressedDataUrl(file);
        render();
      } catch (err) { showToast("Failed to process image", "error"); }
    });
  }
}

async function savePostEditor() {
  if (!postEditorDraft.title.trim()) { showToast("Map title is required.", "error"); return; }
  const ok = await fsSetPost(postEditorDraft.id, postEditorDraft);
  if (ok) {
    showToast("Map saved successfully!");
    postEditorDraft = null;
    render();
  } else {
    showToast("Failed to save map", "error");
  }
}

/* ---------------------------------------------------------------- */
/*  PROFILE SCREEN                                                  */
/* ---------------------------------------------------------------- */
let profileTab = "links";

function profileScreenHtml(account) {
  const isOwn = !!(state.session && state.session.account && state.session.account.id === account.id);
  const theirPosts = state.posts.filter((p) => p.authorId === account.id && p.status === "approved" && !p.hidden);

  return `
  ${isOwn ? `
    <div class="flex items-center justify-between px-5 h-14 border-b border-bd bg-[#0A0E17]">
      <div class="font-sora font-extrabold text-base text-white">Profile</div>
      <button data-action="confirm-logout" class="flex items-center gap-1.5 rounded-full font-inter font-semibold text-xs px-3.5 py-1.5 bg-[#FF5D6C]/10 border border-[#FF5D6C]/30 text-[#FF5D6C] active:scale-95 transition-all">
        ${ICONS.logOut(14)} Logout
      </button>
    </div>
  ` : backHeaderHtml(account.name, "nav", "home")}

  <div class="px-5 pt-6 pb-6 flex flex-col items-center text-center max-w-2xl mx-auto">
    <button data-action="open-photo-view" data-id="${account.id}" class="rounded-full p-0 border-none bg-transparent hover:opacity-90 transition-opacity">
      ${avatarHtml(account.name, account.avatar, 92)}
    </button>
    <div class="flex items-center justify-center gap-2 mt-3.5">
      <span class="font-sora font-black text-xl text-white">${esc(account.name)}</span>
      ${isOwn ? `<button data-action="open-switch-account" class="text-tfaint hover:text-white">${ICONS.chevronDown(16)}</button>` : ""}
    </div>
    ${account.username ? `<div class="font-inter text-xs text-[#3E8EFF] font-semibold mt-0.5">@${esc(account.username)}</div>` : ""}
    ${account.bio ? `<p class="mt-2.5 text-tmuted font-inter text-sm leading-relaxed max-w-md whitespace-pre-wrap">${esc(account.bio)}</p>` : ""}

    <div class="flex items-center justify-center gap-6 mt-4 py-2.5 px-6 rounded-2xl bg-[#131927] border border-bd">
      <div>
        <div class="font-sora font-extrabold text-base text-white">${theirPosts.length}</div>
        <div class="font-inter text-[10px] text-tfaint uppercase tracking-wider">Maps</div>
      </div>
      <div class="w-px h-6 bg-bd"></div>
      <div>
        <div class="font-sora font-extrabold text-base text-white">${(account.links || []).length}</div>
        <div class="font-inter text-[10px] text-tfaint uppercase tracking-wider">Links</div>
      </div>
      ${isOwn ? `
        <div class="w-px h-6 bg-bd"></div>
        <button data-action="nav" data-id="editAccount" class="font-sora font-bold text-xs text-[#3E8EFF] hover:underline">Edit</button>
      ` : ""}
    </div>

    <div class="flex gap-1.5 mt-6 bg-[#131927] border border-bd rounded-full p-1">
      <button data-action="set-profile-tab" data-id="links" class="rounded-full font-sora font-bold text-xs px-5 py-2 transition-all ${profileTab === 'links' ? 'bg-[#3E8EFF] text-white shadow-md' : 'text-tmuted hover:text-white'}">Links</button>
      <button data-action="set-profile-tab" data-id="posts" class="rounded-full font-sora font-bold text-xs px-5 py-2 transition-all ${profileTab === 'posts' ? 'bg-[#3E8EFF] text-white shadow-md' : 'text-tmuted hover:text-white'}">Maps (${theirPosts.length})</button>
    </div>
  </div>

  <div class="px-4 md:px-8 pb-12 max-w-3xl mx-auto">
    ${profileTab === "links" 
      ? (account.links && account.links.length 
          ? `<div class="flex flex-col gap-2.5">${account.links.map((l) => modernLinkCardHtml({ url: l.url, title: l.label, platformKey: l.icon || detectPlatformKey(l.url) })).join("")}</div>`
          : `<div class="text-center text-tfaint text-sm py-8">No links added yet.</div>`)
      : (theirPosts.length 
          ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${theirPosts.map((p) => postCardHtml(p, account)).join("")}</div>`
          : `<div class="text-center text-tfaint text-sm py-8">No maps created yet.</div>`)}
  </div>
  ${isOwn ? photoSheetHtml() + photoLightboxHtml() + switchAccountSheetHtml() + linkFormSheetHtml() : ""}`;
}

/* ---------------------------------------------------------------- */
/*  EDIT PROFILE SCREENS                                            */
/* ---------------------------------------------------------------- */
function editAccountScreenHtml() {
  const a = state.session.account;
  return `${backHeaderHtml("Edit Profile", "nav", "account")}
  <div class="px-5 pt-4 pb-16 max-w-lg mx-auto">
    <div class="flex flex-col items-center mb-6">
      <button data-action="open-photo-sheet" class="relative rounded-full p-0 border-none bg-transparent">
        ${avatarHtml(a.name, a.avatar, 96)}
        <span class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white">${ICONS.camera(22)}</span>
      </button>
      <button data-action="open-photo-sheet" class="font-sora font-bold text-xs text-[#3E8EFF] mt-3">Change Photo</button>
    </div>

    <div class="bg-panel border border-bd rounded-2xl mb-4 overflow-hidden divide-y divide-bd">
      <button data-action="nav" data-id="editName" class="w-full flex items-center justify-between p-4 text-left">
        <span class="font-inter text-sm text-tmuted">Name</span>
        <span class="flex items-center gap-1.5 font-sora font-semibold text-sm text-white">${esc(a.name)} ${ICONS.chevronRight(14)}</span>
      </button>
      <button data-action="nav" data-id="editUsername" class="w-full flex items-center justify-between p-4 text-left">
        <span class="font-inter text-sm text-tmuted">Username</span>
        <span class="flex items-center gap-1.5 font-sora font-semibold text-sm text-white">${a.username ? esc(a.username) : "Add username"} ${ICONS.chevronRight(14)}</span>
      </button>
      <button data-action="nav" data-id="editBio" class="w-full flex items-center justify-between p-4 text-left">
        <span class="font-inter text-sm text-tmuted">Bio</span>
        <span class="flex items-center gap-1.5 font-inter text-xs text-right text-white line-clamp-1 max-w-[200px]">${a.bio ? esc(a.bio) : "Add bio"} ${ICONS.chevronRight(14)}</span>
      </button>
    </div>

    <div class="font-mono text-xs text-tfaint uppercase tracking-wider mb-2">Social / Custom Links</div>
    <div class="space-y-2 mb-6">
      ${(a.links || []).map((l, idx) => `
        <div class="flex items-center justify-between p-3.5 rounded-2xl bg-panel border border-bd">
          <div class="flex items-center gap-3 min-w-0">
            ${modernIconBadgeHtml(l.icon || detectPlatformKey(l.url), 32)}
            <div class="min-w-0">
              <div class="font-sora font-bold text-sm text-white truncate">${esc(l.label)}</div>
              <div class="font-inter text-[11px] text-tfaint truncate">${esc(l.url)}</div>
            </div>
          </div>
          ${dangerIconBtn({ action: "delete-profile-link", id: String(idx) })}
        </div>
      `).join("")}
      ${(a.links || []).length < 5 ? `
        <button data-action="open-link-sheet" data-id="new" class="w-full py-3 rounded-2xl border border-dashed border-bd text-tmuted font-semibold text-xs flex items-center justify-center gap-2 hover:text-white">
          ${ICONS.plus(16)} Add Link
        </button>
      ` : ""}
    </div>
  </div>
  ${photoSheetHtml()} ${linkFormSheetHtml()}`;
}

function editNameScreenHtml() {
  const a = state.session.account;
  return `${backHeaderHtml("Change Name", "nav", "editAccount")}
  <div class="px-5 pt-6 pb-12 max-w-md mx-auto">
    ${fieldWrap("Display Name", `<input id="en-name" class="${inputCls}" value="${escAttr(a.name)}" maxlength="30" />`)}
    <div id="en-error" class="text-coral text-xs mb-3 font-medium"></div>
    ${primaryBtn({ action: "save-name", label: "Save Name", extra: "w-full" })}
  </div>`;
}

function editUsernameScreenHtml() {
  const a = state.session.account;
  return `${backHeaderHtml("Change Username", "nav", "editAccount")}
  <div class="px-5 pt-6 pb-12 max-w-md mx-auto">
    ${fieldWrap("Username", `<input id="eu-username" class="${inputCls}" value="${escAttr(a.username || "")}" maxlength="24" placeholder="letters, numbers, underscore" />`)}
    <div id="eu-error" class="text-coral text-xs mb-3 font-medium"></div>
    ${primaryBtn({ action: "save-username", label: "Save Username", extra: "w-full" })}
  </div>`;
}

function editBioScreenHtml() {
  const a = state.session.account;
  return `${backHeaderHtml("Change Bio", "nav", "editAccount")}
  <div class="px-5 pt-6 pb-12 max-w-md mx-auto">
    ${fieldWrap("Bio (max 160 chars)", `<textarea id="eb-bio" class="${inputCls}" style="min-height:120px;" maxlength="160">${esc(a.bio || "")}</textarea>`)}
    <div id="eb-error" class="text-coral text-xs mb-3 font-medium"></div>
    ${primaryBtn({ action: "save-bio", label: "Save Bio", extra: "w-full" })}
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  LINK SHEET                                                      */
/* ---------------------------------------------------------------- */
let linkDraft = { title: "", url: "", platform: "youtube" };

function linkFormSheetHtml() {
  if (!state.ui.linkSheetOpen) return "";
  return `
  <div data-action="close-link-sheet" class="fixed inset-0 z-[200] flex items-end justify-center cv-sheet-backdrop" style="background:rgba(0,0,0,0.65);">
    <div data-action="noop" class="w-full max-w-[420px] bg-[#131927] rounded-t-[28px] p-5 pb-8 cv-sheet-panel border-t border-white/10">
      <div class="flex justify-between items-center mb-4">
        <span class="font-sora font-bold text-sm text-white">Add Link</span>
        ${closeBtn("close-link-sheet")}
      </div>
      <div class="space-y-3">
        <div>
          <label class="block font-mono text-[10px] text-tfaint uppercase mb-1">Platform</label>
          <select id="el-platform" class="${inputCls}">
            ${LINK_PLATFORMS.map(([k, label]) => `<option value="${k}">${label}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="block font-mono text-[10px] text-tfaint uppercase mb-1">Title</label>
          <input id="el-title" class="${inputCls}" placeholder="e.g. Subscribe to YouTube" />
        </div>
        <div>
          <label class="block font-mono text-[10px] text-tfaint uppercase mb-1">URL</label>
          <input id="el-url" class="${inputCls}" placeholder="https://..." />
        </div>
        <div id="el-error" class="text-coral text-xs"></div>
        ${primaryBtn({ action: "save-link", label: "Add Link", extra: "w-full mt-2" })}
      </div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  FEED SCREEN (Home & Favorites)                                  */
/* ---------------------------------------------------------------- */
function feedScreen(mode) {
  let visible = state.posts.filter((p) => p.status === "approved" && !p.hidden);
  if (mode === "favorites") visible = visible.filter((p) => state.likedIds.includes(p.id));

  let html = mode === "home" ? homeHeaderHtml() : backHeaderHtml("Favorites");
  html += `<div class="px-4 md:px-8 pt-4 pb-2 max-w-6xl mx-auto">`;
  
  if (mode === "home") {
    html += state.postsLoaded ? bannerSliderHtml() : bannerSkeletonHtml();
  }

  if (!state.postsLoaded && visible.length === 0) {
    html += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${Array.from({ length: 6 }).map(skeletonCardHtml).join("")}</div>`;
  } else if (visible.length === 0) {
    html += `<div class="text-center py-20 text-tfaint font-inter text-sm">${mode === "favorites" ? "No favorite maps saved yet." : "No maps available right now."}</div>`;
  } else {
    html += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${visible.map((post) => postCardHtml(post, getAuthor(post.authorId))).join("")}</div>`;
  }
  html += `</div>`;
  return html;
}

/* ---------------------------------------------------------------- */
/*  EXPLORE SCREEN (Modal)                                          */
/* ---------------------------------------------------------------- */
let exploreQuery = "";
let exploreCategory = null;

function exploreScreenHtml() {
  const visible = state.posts.filter((p) => p.status === "approved" && !p.hidden);
  const q = exploreQuery.trim().toLowerCase();
  const results = visible.filter((p) => {
    const matchesQ = !q || p.title.toLowerCase().includes(q) || getAuthor(p.authorId).name.toLowerCase().includes(q);
    const matchesC = !exploreCategory || p.category === exploreCategory;
    return matchesQ && matchesC;
  });

  return `
  <div class="fixed inset-0 bg-[#0A0E17]/95 backdrop-blur-xl z-[70] overflow-y-auto">
    <div class="max-w-3xl mx-auto px-4 pt-5 pb-12">
      <div class="flex items-center gap-3 mb-6">
        <div class="relative flex-1">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-tfaint">${ICONS.search()}</span>
          <input id="explore-search" value="${escAttr(exploreQuery)}" placeholder="Search maps, creators or categories..." class="${inputCls} pl-10" />
        </div>
        ${closeBtn("close-explore")}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${results.length ? results.map((p) => postCardHtml(p, getAuthor(p.authorId))).join("") : `<div class="col-span-2 text-center text-tfaint py-16">No maps found.</div>`}
      </div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  STATIC PAGES & NOTIFICATIONS                                    */
/* ---------------------------------------------------------------- */
function staticPageHtml(title, content) {
  return `${backHeaderHtml(title)}
  <div class="px-4 md:px-8 pt-6 pb-12 max-w-4xl mx-auto">
    <div class="bg-panel border border-bd rounded-2xl p-6 text-tmuted font-inter text-sm leading-relaxed whitespace-pre-wrap">${esc(content)}</div>
  </div>`;
}

function notificationsScreenHtml() {
  return `${backHeaderHtml("Notifications", "nav", "home")}
  <div class="px-4 md:px-8 pt-6 pb-16 max-w-3xl mx-auto">
    ${state.notifications.length === 0 ? `<div class="text-center text-tfaint py-16">No notifications.</div>` : state.notifications.map((n) => `
      <div class="flex items-start gap-3 bg-panel border border-bd rounded-2xl p-4 mb-3">
        <div class="w-2.5 h-2.5 rounded-full bg-[#3E8EFF] mt-1.5 flex-shrink-0"></div>
        <div>
          <div class="font-sora font-bold text-sm text-white">${esc(n.title)}</div>
          <div class="font-inter text-xs text-tmuted mt-0.5">${esc(n.message)}</div>
        </div>
      </div>
    `).join("")}
  </div>`;
}

function creatorAuthScreenHtml() {
  const mode = state.ui.authMode === "signup" ? "signup" : "login";
  return `${backHeaderHtml(mode === "login" ? "Log in" : "Create account", "nav", "home")}
  <div class="px-4 pt-6 pb-16 max-w-md mx-auto">
    <div class="bg-panel border border-bd rounded-3xl p-6 shadow-2xl">
      <div class="text-center mb-6">
        <div class="font-sora font-extrabold text-2xl text-white mb-1">${mode === "login" ? "Welcome Back" : "Join CraftVerse"}</div>
        <div class="font-inter text-xs text-tfaint">Manage maps, links and share with the community</div>
      </div>
      ${mode === "signup" ? fieldWrap("Creator Name", `<input id="ca-name" class="${inputCls}" placeholder="e.g. MasterGamer" />`) : ""}
      ${fieldWrap("Email or Username", `<input id="ca-identifier" class="${inputCls}" placeholder="you@example.com" value="${escAttr(state.ui.prefillIdentifier || "")}" />`)}
      ${fieldWrap("Password", `<input id="ca-password" type="password" class="${inputCls}" placeholder="At least 6 characters" />`)}
      <div id="ca-error" class="text-[#FF5D6C] text-xs mb-3 font-inter font-medium"></div>
      ${primaryBtn({ action: mode === "login" ? "creator-login-submit" : "creator-signup-submit", label: mode === "login" ? "Sign In" : "Sign Up", extra: "w-full" })}
      <button data-action="creator-google-auth" class="w-full flex items-center justify-center gap-2.5 mt-3 rounded-xl border border-bd bg-[#121826] hover:bg-[#182032] py-3 font-sora font-semibold text-sm text-white transition-all">
        ${ICONS.google()}<span>Continue with Google</span>
      </button>
      <button data-action="toggle-auth-mode" class="w-full text-center mt-4 font-inter text-xs text-tmuted hover:text-white">
        ${mode === "login" ? `New to CraftVerse? <span class="text-[#3E8EFF] font-bold">Sign up</span>` : `Already have an account? <span class="text-[#3E8EFF] font-bold">Log in</span>`}
      </button>
    </div>
  </div>`;
}

function submitScreenHtml() {
  const account = state.session.account;
  const myPosts = state.posts.filter((p) => p.authorId === account.id);

  return `${backHeaderHtml("Submit a Map", "nav", "home")}
  <div class="px-4 md:px-8 pt-6 pb-20 max-w-4xl mx-auto">
    ${postEditorDraft ? postEditorHtml(postEditorDraft) : `
      <div class="flex items-center justify-between mb-4">
        <div class="font-sora font-extrabold text-lg text-white">My Submissions</div>
        <button data-action="admin-new-post" class="flex items-center gap-1.5 rounded-xl font-sora font-bold text-xs text-white px-4 py-2.5 shadow-md active:scale-95 transition-all" style="background:linear-gradient(135deg,#3E8EFF,#7C5CFF);">
          ${ICONS.plus(15)} Add Map
        </button>
      </div>
      ${myPosts.length === 0 ? `<div class="text-center text-tfaint py-12">You haven't submitted any maps yet.</div>` : myPosts.map((p) => `
        <div class="bg-panel border border-bd rounded-2xl p-3.5 mb-3 flex items-center gap-3">
          ${p.thumbnail ? `<img src="${escAttr(p.thumbnail)}" class="w-14 h-14 rounded-xl object-cover flex-shrink-0" />` : `<div class="w-14 h-14 rounded-xl bg-[#1C2540] flex-shrink-0"></div>`}
          <div class="flex-1 min-w-0">
            <div class="font-sora font-bold text-sm text-white truncate">${esc(p.title)}</div>
            <div class="font-inter text-xs text-tfaint mt-0.5">${statusBadge(p.status)}</div>
          </div>
          <div class="flex items-center gap-2">
            ${dangerIconBtn({ action: "admin-delete-post", id: p.id })}
          </div>
        </div>
      `).join("")}
    `}
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  OWNER PANEL                                                     */
/* ---------------------------------------------------------------- */
function ownerScreenHtml() {
  const pending = state.posts.filter((p) => p.status === "pending");
  return `${backHeaderHtml("Owner Dashboard", "nav", "home")}
  <div class="px-4 md:px-8 pt-6 pb-20 max-w-5xl mx-auto text-white">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-panel border border-bd rounded-2xl p-4 text-center">
        <div class="font-sora font-black text-2xl">${state.posts.length}</div>
        <div class="font-inter text-xs text-tfaint mt-1">Total Maps</div>
      </div>
      <div class="bg-panel border border-bd rounded-2xl p-4 text-center">
        <div class="font-sora font-black text-2xl text-amber-400">${pending.length}</div>
        <div class="font-inter text-xs text-tfaint mt-1">Pending</div>
      </div>
      <div class="bg-panel border border-bd rounded-2xl p-4 text-center">
        <div class="font-sora font-black text-2xl text-green-400">${state.posts.filter((p) => p.status === 'approved').length}</div>
        <div class="font-inter text-xs text-tfaint mt-1">Approved</div>
      </div>
      <div class="bg-panel border border-bd rounded-2xl p-4 text-center">
        <div class="font-sora font-black text-2xl">${state.accounts.length}</div>
        <div class="font-inter text-xs text-tfaint mt-1">Users</div>
      </div>
    </div>

    <div class="font-sora font-extrabold text-base mb-3">Pending Review (${pending.length})</div>
    ${pending.length === 0 ? `<div class="text-tfaint text-sm py-4">No maps pending review.</div>` : pending.map((p) => `
      <div class="bg-panel border border-bd rounded-2xl p-4 mb-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="font-sora font-bold text-sm text-white truncate">${esc(p.title)}</div>
          <div class="font-inter text-xs text-tfaint">by ${esc(getAuthor(p.authorId).name)}</div>
        </div>
        <div class="flex items-center gap-2">
          <button data-action="owner-approve" data-id="${p.id}" class="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold font-sora">Approve</button>
          <button data-action="admin-delete-post" data-id="${p.id}" class="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold font-sora">Reject</button>
        </div>
      </div>
    `).join("")}
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  MODALS, SHEETS & LIGHTBOX                                       */
/* ---------------------------------------------------------------- */
function photoSheetHtml() {
  if (!state.ui.photoSheetOpen) return "";
  return `
  <div data-action="close-photo-sheet" class="fixed inset-0 z-[200] flex items-end justify-center cv-sheet-backdrop" style="background:rgba(0,0,0,0.65);">
    <div data-action="noop" class="w-full max-w-[420px] bg-[#131927] rounded-t-[28px] p-4 pb-8 cv-sheet-panel border-t border-white/10">
      <div class="flex justify-between items-center mb-3 px-2">
        <span class="font-sora font-bold text-sm text-white">Profile Photo</span>
        ${closeBtn("close-photo-sheet")}
      </div>
      <button data-action="photo-upload" class="w-full flex items-center gap-3 px-4 py-3.5 font-inter text-sm rounded-xl hover:bg-[#1C2540] text-white">${ICONS.upload()} Upload Photo</button>
      <input id="photo-file-upload" type="file" accept="image/*" class="hidden" />
    </div>
  </div>`;
}

function photoLightboxHtml() {
  const accId = state.ui.photoViewAccountId;
  if (!accId) return "";
  const a = state.accounts.find((x) => x.id === accId) || state.session?.account;
  if (!a || !a.avatar) return "";

  return `
  <div data-action="close-photo-view" class="fixed inset-0 z-[210] flex flex-col items-center justify-center p-6 bg-black/95">
    <div class="absolute top-4 right-4">
      ${closeBtn("close-photo-view")}
    </div>
    <img src="${escAttr(a.avatar)}" class="max-w-full rounded-2xl object-contain max-h-[75vh]" />
  </div>`;
}

function switchAccountSheetHtml() {
  if (!state.ui.switchAccountOpen) return "";
  return `
  <div data-action="close-switch-account" class="fixed inset-0 z-[200] flex items-end justify-center cv-sheet-backdrop" style="background:rgba(0,0,0,0.65);">
    <div data-action="noop" class="w-full max-w-[420px] bg-[#131927] rounded-t-[28px] p-4 pb-8 cv-sheet-panel border-t border-white/10">
      <div class="flex justify-between items-center mb-3 px-2">
        <span class="font-sora font-bold text-sm text-white">Switch Account</span>
        ${closeBtn("close-switch-account")}
      </div>
      <button data-action="confirm-logout" class="w-full flex items-center gap-3 px-4 py-3 font-inter text-sm text-[#FF5D6C] rounded-xl hover:bg-[#1C2540]">
        ${ICONS.logOut()} Log out current
      </button>
    </div>
  </div>`;
}

function confirmModalHtml() {
  const c = state.ui.confirm;
  if (!c) return "";
  return `
  <div class="fixed inset-0 z-[220] flex items-end md:items-center justify-center cv-sheet-backdrop" style="background:rgba(0,0,0,0.7);">
    <div class="w-full max-w-[420px] bg-[#131927] rounded-t-[24px] md:rounded-[24px] p-5 pb-7 cv-sheet-panel border border-bd shadow-2xl">
      <div class="flex items-center justify-between mb-3">
        <div class="font-sora font-extrabold text-[16px] text-white">${esc(c.title || "Confirm")}</div>
        ${closeBtn("confirm-cancel")}
      </div>
      <div class="text-tmuted font-inter text-sm mb-5 leading-relaxed">${esc(c.message)}</div>
      <div class="flex gap-2.5">
        <button data-action="confirm-cancel" class="flex-1 rounded-xl font-sora font-bold text-xs py-3 bg-[#1C2540] text-[#B7BFD6]">Cancel</button>
        <button data-action="confirm-ok" class="flex-1 rounded-xl font-sora font-bold text-xs py-3 text-white ${c.danger ? 'bg-[#FF5D6C]' : 'bg-[#3E8EFF]'}">${esc(c.confirmLabel || "Confirm")}</button>
      </div>
    </div>
  </div>`;
}

function toastHtml() {
  const t = state.ui.toast;
  if (!t) return "";
  const isError = t.type === "error";
  return `<div class="fixed left-1/2 z-[999] px-4 py-2.5 rounded-xl font-inter text-xs font-semibold flex items-center gap-2 shadow-2xl transition-all" style="bottom:24px;transform:translateX(-50%);background:#151D2F;border:1px solid ${isError ? "#FF5D6C" : "#34D399"};color:#F3F5F9;">
    <span style="color:${isError ? "#FF5D6C" : "#34D399"}">${isError ? ICONS.alertCircle(16) : ICONS.check(16)}</span> ${esc(t.msg)}
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  MAIN ROUTER & RENDER ENGINE                                     */
/* ---------------------------------------------------------------- */
let selectedPostId = null;

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

function render() {
  const { screen, param } = parseHash();
  const app = document.getElementById("app");
  if (!app) return;

  const isLoggedInCreator = !!(state.session && (state.session.role === "admin" || state.session.role === "owner"));
  let mainContent = "";
  let showFooter = false;

  switch (screen) {
    case "home": mainContent = feedScreen("home"); showFooter = true; break;
    case "favorites":
      if (!isLoggedInCreator) { mainContent = creatorAuthScreenHtml(); break; }
      mainContent = feedScreen("favorites"); showFooter = true; break;
    case "submit":
      if (!isLoggedInCreator) { mainContent = creatorAuthScreenHtml(); break; }
      mainContent = submitScreenHtml(); break;
    case "account":
      if (!isLoggedInCreator) { mainContent = creatorAuthScreenHtml(); break; }
      mainContent = profileScreenHtml(state.session.account); break;
    case "editAccount":
      mainContent = isLoggedInCreator ? editAccountScreenHtml() : creatorAuthScreenHtml(); break;
    case "editName":
      mainContent = isLoggedInCreator ? editNameScreenHtml() : creatorAuthScreenHtml(); break;
    case "editUsername":
      mainContent = isLoggedInCreator ? editUsernameScreenHtml() : creatorAuthScreenHtml(); break;
    case "editBio":
      mainContent = isLoggedInCreator ? editBioScreenHtml() : creatorAuthScreenHtml(); break;
    case "notifications":
      mainContent = isLoggedInCreator ? notificationsScreenHtml() : creatorAuthScreenHtml(); break;
    case "creatorAuth": mainContent = creatorAuthScreenHtml(); break;
    case "about": mainContent = staticPageHtml("About CraftVerse", state.siteContent.about); showFooter = true; break;
    case "terms": mainContent = staticPageHtml("Terms of Service", state.siteContent.terms); showFooter = true; break;
    case "dmca": mainContent = staticPageHtml("DMCA Policy", state.siteContent.dmca); showFooter = true; break;
    case "privacy": mainContent = staticPageHtml("Privacy Policy", state.siteContent.privacy); showFooter = true; break;
    case "contact": mainContent = staticPageHtml("Contact Us", state.siteContent.contact); showFooter = true; break;
    case "post": {
      const post = state.posts.find((p) => p.id === (param || selectedPostId));
      mainContent = post ? postViewScreenHtml(post) : feedScreen("home");
      break;
    }
    case "profile": {
      const account = state.accounts.find((a) => a.id === param);
      mainContent = account ? profileScreenHtml(account) : feedScreen("home");
      break;
    }
    case "ownerPanel":
      mainContent = state.session && state.session.role === "owner" ? ownerScreenHtml() : creatorAuthScreenHtml();
      break;
    default: mainContent = feedScreen("home"); showFooter = true;
  }

  app.innerHTML = `
  <div class="md:flex min-h-screen bg-[#0A0E17]">
    ${sidebarNavHtml(screen)}
    <div class="flex-1 min-w-0 flex flex-col min-h-screen">
      <main class="flex-1 pb-16 md:pb-6">
        ${mainContent}
      </main>
      ${showFooter ? footerHtml() : ""}
    </div>
  </div>
  ${publicBottomNavHtml(screen)}
  ${state.ui.exploreOpen ? exploreScreenHtml() : ""}
  ${confirmModalHtml()}
  ${toastHtml()}`;

  if (document.getElementById("post-editor")) bindPostEditorInputs();
  if (document.getElementById("explore-search")) bindExploreInputs();
  const photoFile = document.getElementById("photo-file-upload");
  if (photoFile) photoFile.addEventListener("change", (e) => handleAvatarFile(e.target.files[0]));
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

/* ---------------------------------------------------------------- */
/*  ACTIONS & EVENT DELEGATION                                      */
/* ---------------------------------------------------------------- */
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id;

  switch (action) {
    case "nav": state.ui.exploreOpen = false; navigate(id); render(); break;
    case "open-explore": exploreQuery = ""; exploreCategory = null; state.ui.exploreOpen = true; render(); break;
    case "close-explore": state.ui.exploreOpen = false; render(); break;
    case "open-post": state.ui.exploreOpen = false; openPost(id); break;
    case "open-profile": state.ui.exploreOpen = false; navigate("profile", id); break;
    case "set-profile-tab": profileTab = id; render(); break;
    case "toggle-like": toggleLike(id); break;
    case "share-post": {
      const post = state.posts.find((p) => p.id === id);
      if (post && navigator.share) navigator.share({ title: post.title, url: location.href });
      else copyToClipboard(location.href).then(() => showToast("Post link copied!"));
      break;
    }
    case "copy-map-code": {
      const ok = await copyToClipboard(id);
      showToast(ok ? "Map code copied!" : "Failed to copy", ok ? "success" : "error");
      break;
    }
    case "admin-new-post": {
      postEditorDraft = emptyPostDraft(state.session.uid);
      render();
      break;
    }
    case "pe-save": savePostEditor(); break;
    case "pe-cancel": postEditorDraft = null; render(); break;
    case "pe-add-code": if (postEditorDraft) { postEditorDraft.codes.push({ id: "c" + Date.now(), title: "", code: "" }); render(); } break;
    case "pe-remove-code": if (postEditorDraft) { postEditorDraft.codes.splice(+id, 1); render(); } break;
    case "pe-upload-thumb": document.getElementById("pe-thumbnail-file")?.click(); break;

    case "save-name": {
      const val = document.getElementById("en-name")?.value.trim();
      if (!val) { document.getElementById("en-error").textContent = "Name cannot be empty."; return; }
      await fsSetAccount(state.session.account.id, { name: val });
      showToast("Name updated!");
      navigate("editAccount");
      break;
    }
    case "save-username": {
      const raw = document.getElementById("eu-username")?.value.trim().toLowerCase();
      if (!/^[a-zA-Z0-9_.]{3,24}$/.test(raw)) { document.getElementById("eu-error").textContent = "3-24 letters, numbers or underscores only."; return; }
      await fsSetAccount(state.session.account.id, { username: raw });
      showToast("Username updated!");
      navigate("editAccount");
      break;
    }
    case "save-bio": {
      const val = document.getElementById("eb-bio")?.value.trim();
      await fsSetAccount(state.session.account.id, { bio: val });
      showToast("Bio updated!");
      navigate("editAccount");
      break;
    }
    case "open-link-sheet": state.ui.linkSheetOpen = true; render(); break;
    case "close-link-sheet": state.ui.linkSheetOpen = false; render(); break;
    case "save-link": {
      const platform = document.getElementById("el-platform")?.value;
      const title = document.getElementById("el-title")?.value.trim();
      const url = document.getElementById("el-url")?.value.trim();
      if (!title || !url) { document.getElementById("el-error").textContent = "Title and URL required."; return; }
      const links = [...(state.session.account.links || [])];
      links.push({ id: "l" + Date.now(), label: title, url, icon: platform });
      await fsSetAccount(state.session.account.id, { links });
      state.ui.linkSheetOpen = false;
      showToast("Link added!");
      break;
    }
    case "delete-profile-link": {
      const links = [...(state.session.account.links || [])];
      links.splice(+id, 1);
      await fsSetAccount(state.session.account.id, { links });
      showToast("Link removed.");
      break;
    }

    case "open-photo-sheet": state.ui.photoSheetOpen = true; render(); break;
    case "close-photo-sheet": state.ui.photoSheetOpen = false; render(); break;
    case "open-photo-view": state.ui.photoViewAccountId = id; render(); break;
    case "close-photo-view": state.ui.photoViewAccountId = null; render(); break;
    case "open-switch-account": state.ui.switchAccountOpen = true; render(); break;
    case "close-switch-account": state.ui.switchAccountOpen = false; render(); break;
    case "photo-upload": document.getElementById("photo-file-upload")?.click(); break;
    case "confirm-logout": askConfirm({ title: "Log out?", message: "You will be signed out.", confirmLabel: "Log out", danger: true }, () => signOut(auth)); break;
    case "confirm-cancel": closeConfirm(); break;
    case "confirm-ok": {
      const c = state.ui.confirm;
      closeConfirm();
      if (c && c.onConfirm) c.onConfirm();
      break;
    }
    case "set-banner-slide": bannerSlideIndex = +id; render(); break;
    case "toggle-auth-mode": state.ui.authMode = state.ui.authMode === "signup" ? "login" : "signup"; render(); break;
    case "creator-login-submit": {
      const identifier = document.getElementById("ca-identifier")?.value.trim();
      const password = document.getElementById("ca-password")?.value;
      const err = document.getElementById("ca-error");
      if (!identifier || !password) { if (err) err.textContent = "Please fill all fields."; return; }
      try {
        await signInWithEmailAndPassword(auth, identifier, password);
        showToast("Welcome back!");
        navigate("home");
      } catch (ex) { if (err) err.textContent = ex.message; }
      break;
    }
    case "creator-signup-submit": {
      const name = document.getElementById("ca-name")?.value.trim();
      const identifier = document.getElementById("ca-identifier")?.value.trim();
      const password = document.getElementById("ca-password")?.value;
      const err = document.getElementById("ca-error");
      if (!name || !identifier || !password) { if (err) err.textContent = "Please fill all fields."; return; }
      try {
        const cred = await createUserWithEmailAndPassword(auth, identifier, password);
        await fsSetAccount(cred.user.uid, { role: "admin", name, email: identifier, username: "", avatar: "", bio: "", links: [], banned: false });
        showToast("Account created successfully!");
        navigate("home");
      } catch (ex) { if (err) err.textContent = ex.message; }
      break;
    }
    case "creator-google-auth": {
      try {
        const cred = await signInWithPopup(auth, new GoogleAuthProvider());
        const uid = cred.user.uid;
        const snap = await getDoc(doc(db, "accounts", uid));
        if (!snap.exists()) {
          await fsSetAccount(uid, { role: "admin", name: cred.user.displayName || "Creator", email: cred.user.email || "", username: "", avatar: cred.user.photoURL || "", bio: "", links: [], banned: false });
        }
        showToast("Signed in with Google!");
        navigate("home");
      } catch (ex) { showToast(ex.message, "error"); }
      break;
    }
    case "admin-delete-post": {
      askConfirm({ title: "Delete Map?", message: "Are you sure you want to delete this map?", confirmLabel: "Delete", danger: true }, () => fsDeletePost(id));
      break;
    }
    case "owner-approve": {
      await fsSetPost(id, { status: "approved" });
      showToast("Map approved!");
      break;
    }
  }
});

async function handleAvatarFile(file) {
  if (!file) return;
  try {
    const dataUrl = await fileToCompressedDataUrl(file);
    await fsSetAccount(state.session.account.id, { avatar: dataUrl });
    state.ui.photoSheetOpen = false;
    showToast("Photo updated!");
  } catch (e) { showToast("Failed to process image.", "error"); }
}

(function injectResponsiveStyles() {
  const style = document.createElement("style");
  style.textContent = `
    @media (min-width: 768px) {
      #app { max-width: 100% !important; width: 100% !important; }
      .cv-sheet-panel { border-radius: 20px !important; }
    }
  `;
  document.head.appendChild(style);
})();

// ইনিট রেন্ডার
render();
