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
const brandIcon = (paths, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 640 640" fill="currentColor">${paths}</svg>`;
const fillIcon = (viewBox, paths, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="${viewBox}" fill="currentColor">${paths}</svg>`;

const ICONS = {
  heart: (f) => svgIcon(`<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" ${f ? 'fill="currentColor"' : ""}/>`),
  search: () => fillIcon("0 0 24 24", `<path clip-rule="evenodd" d="M14.1018 16.3007C12.8835 17.2777 11.3369 17.8621 9.6537 17.8621C5.72399 17.8621 2.53833 14.6764 2.53833 10.7467C2.53833 6.81701 5.72399 3.63135 9.6537 3.63135C13.5834 3.63135 16.7691 6.81701 16.7691 10.7467C16.7691 12.4471 16.1726 14.0082 15.1775 15.2322L15.9161 15.9708L14.844 17.0429L14.1018 16.3007ZM14.502 10.7466C14.502 13.4242 12.3313 15.5948 9.65371 15.5948C6.9761 15.5948 4.80546 13.4242 4.80546 10.7466C4.80546 8.06896 6.9761 5.89833 9.65371 5.89833C12.3313 5.89833 14.502 8.06896 14.502 10.7466Z" fill-rule="evenodd"/><path clip-rule="evenodd" d="M18.7113 21.0375C18.5768 21.172 18.3587 21.1717 18.2246 21.0368L14.7097 17.5C14.5763 17.3657 14.5766 17.1487 14.7105 17.0148L15.8997 15.8256C16.0342 15.6911 16.2524 15.6915 16.3864 15.8264L19.9013 19.3631C20.0348 19.4974 20.0345 19.7144 19.9006 19.8483L18.7113 21.0375Z" fill-rule="evenodd"/><path d="M22.8805 4.7869C22.2731 5.03857 21.7882 5.26507 21.4258 5.46641C21.0667 5.66775 20.7866 5.8674 20.5852 6.06539C20.3872 6.26337 20.1876 6.54188 19.9862 6.90093C19.7849 7.25998 19.555 7.75158 19.2967 8.37572H19.0903C18.8286 7.75158 18.597 7.25998 18.3957 6.90093C18.1943 6.54188 17.9964 6.26337 17.8017 6.06539C17.6004 5.8674 17.3185 5.66775 16.9561 5.46641C16.5971 5.26507 16.1122 5.03857 15.5015 4.7869V4.58053C16.1155 4.32886 16.6021 4.10235 16.9612 3.90102C17.3236 3.69968 17.6038 3.50002 17.8017 3.30204C17.9964 3.10406 18.1943 2.82554 18.3957 2.46649C18.597 2.10744 18.8286 1.61584 19.0903 0.991699H19.2967C19.555 1.61584 19.7849 2.10744 19.9862 2.46649C20.1876 2.82554 20.3872 3.10406 20.5852 3.30204C20.7798 3.50002 21.0567 3.69968 21.4157 3.90102C21.7781 4.10235 22.2664 4.32886 22.8805 4.58053V4.7869Z"/>`),
  home: () => fillIcon("0 0 50 50", `<path d="M23.98 2.394 35.49 10.456C37.042 11.544 39 14.684 39 17.197V30.76C39 35.308 35.31 39 30.77 39H9.23C4.692 39 1 35.291 1 30.739V16.937c0-2.3 1.576-5.29 3.192-6.492L14.2 2.625c2.67-2.07 7.004-2.178 9.78-.23ZM20 34.5A2.49 2.49 0 0 0 22.5 32v-6A2.49 2.49 0 0 0 20 23.5 2.49 2.49 0 0 0 17.5 26v6a2.49 2.49 0 0 0 2.5 2.5Z"/>`),
  termsPage: () => fillIcon("0 0 18 18", `<path d="M9.87011 2.27979L17.0701 5.15978V6.11978H16.1101C16.1101 6.24978 16.0589 6.36228 15.9564 6.45728C15.8539 6.55228 15.7326 6.59978 15.5926 6.59978H4.14761C4.0076 6.59978 3.88635 6.55228 3.78386 6.45728C3.68136 6.36228 3.63011 6.24978 3.63011 6.11978H2.6701V5.15978L9.87011 2.27979ZM4.5901 7.07978H6.51011V12.8398H7.4701V7.07978H9.39011V12.8398H10.3501V7.07978H12.2701V12.8398H13.2301V7.07978H15.1501V12.8398H15.5926C15.7326 12.8398 15.8539 12.8873 15.9564 12.9823C16.0589 13.0773 16.1101 13.1898 16.1101 13.3198V13.7998H3.63011V13.3198C3.63011 13.1898 3.68136 13.0773 3.78386 12.9823C3.88635 12.8873 4.0076 12.8398 4.14761 12.8398H4.5901V7.07978ZM16.5526 14.2798C16.6926 14.2798 16.8139 14.3273 16.9164 14.4223C17.0189 14.5173 17.0701 14.6298 17.0701 14.7598V15.7198H2.6701V14.7598C2.6701 14.6298 2.72135 14.5173 2.82385 14.4223C2.92636 14.3273 3.04761 14.2798 3.18761 14.2798H16.5526Z"/>`),
  dmcaPage: () => fillIcon("0 0 30 30", `<path clip-rule="evenodd" d="M19.4785 14.3025C18.9521 14.8289 18.4201 15.3666 17.9056 15.8863C17.3905 16.407 16.858 16.9451 16.3305 17.4727C16.0787 17.7237 15.7377 17.8647 15.3821 17.8647C15.0265 17.8647 14.6855 17.7237 14.4337 17.4727C14.1839 17.2235 13.9379 16.9458 13.6767 16.6519C13.4151 16.3566 13.1444 16.0513 12.8706 15.7778C12.6191 15.5262 12.4778 15.1851 12.4778 14.8293C12.4778 14.4736 12.6191 14.1324 12.8706 13.8809C13.1222 13.6293 13.4633 13.488 13.8191 13.488C14.1748 13.488 14.516 13.6293 14.7675 13.8809L15.4382 14.5515L17.5829 12.407C17.8342 12.1556 18.1751 12.0144 18.5306 12.0144C18.8861 12.0144 19.227 12.1556 19.4784 12.4069C19.7297 12.6582 19.871 12.9991 19.871 13.3546C19.871 13.7101 19.7298 14.0511 19.4785 14.3025ZM15.6186 25.2413C11.6812 23.2785 9.31133 21.0572 8.57365 18.6381C8.48593 18.1948 8.4771 17.4566 8.47083 16.9157C8.46983 16.8124 8.46827 16.7153 8.46671 16.6271C8.44509 15.4061 8.45532 14.1971 8.4776 12.758C8.49015 11.9476 8.51032 11.1212 8.53004 10.3218C8.54108 9.88824 8.55129 9.45477 8.56066 9.02136C11.4211 8.50227 13.7395 7.76615 15.6321 6.77725C17.8757 7.92463 20.278 8.73073 22.7595 9.1689C22.7709 9.58576 22.7839 10.0042 22.7963 10.4117C22.8198 11.1795 22.8441 11.9732 22.8586 12.7498C22.8801 13.8741 22.8955 15.0816 22.8698 16.2901L22.866 16.4687C22.8536 17.0766 22.8384 17.833 22.7289 18.3791C22.2361 20.8407 19.8439 23.1487 15.6186 25.2413ZM23.5223 10.3893C23.5461 11.1592 23.5702 11.955 23.5851 12.7363C23.6063 13.8685 23.622 15.0842 23.5957 16.3062L23.5917 16.4832C23.5793 17.1197 23.5634 17.9119 23.4412 18.5218C22.8953 21.2483 20.3169 23.755 15.7772 25.973C15.7274 25.9973 15.6727 26.01 15.6172 26.0099C15.5618 26.0098 15.5072 25.997 15.4574 25.9725C11.227 23.8929 8.67517 21.4904 7.8726 18.8321L7.86432 18.7999C7.75994 18.2906 7.75081 17.5005 7.74389 16.9238C7.74283 16.8221 7.74198 16.7265 7.74027 16.6399C7.71794 15.4085 7.72843 14.1932 7.75066 12.7465C7.76366 11.933 7.78403 11.1045 7.8036 10.304C7.81655 9.77189 7.82885 9.23995 7.84049 8.70822C7.84222 8.62395 7.87321 8.54291 7.92814 8.47899C7.98308 8.41506 8.05853 8.37224 8.14158 8.35785C11.1468 7.8346 13.5401 7.0782 15.4582 6.04675C15.5103 6.01882 15.5685 6.00402 15.6277 6.00366C15.6868 6.00329 15.7452 6.01736 15.7977 6.04464C18.1106 7.24964 20.6004 8.07934 23.1738 8.50267C23.2572 8.51624 23.3333 8.55854 23.3888 8.62224C23.4444 8.68594 23.4759 8.76705 23.478 8.85154C23.491 9.36391 23.5068 9.8855 23.5223 10.3893ZM6.05204 9.41338C6.07447 8.41149 6.09409 7.52587 6.10137 6.88479C10.2907 6.3236 13.4796 5.32487 15.5884 3.91284C18.5289 5.63778 21.8165 6.68666 25.2126 6.9834C25.2201 7.64631 25.2448 8.55321 25.2729 9.57783C25.3628 12.8368 25.4862 17.2997 25.1722 18.8685C24.4734 22.3561 21.258 25.428 15.6157 28.0002C10.3438 25.5911 7.16558 22.6638 6.16921 19.2979C5.85487 18.2342 5.9735 12.9256 6.05204 9.41338Z" fill-rule="evenodd"/>`),
  notif: () => fillIcon("0 0 18 18", `<path d="M10.6266 14.9134C10.7029 15.0802 10.6571 15.2765 10.5144 15.3941C9.62395 16.0755 8.37728 16.0755 7.4868 15.3941C7.34511 15.277 7.29935 15.0817 7.37462 14.9154C7.4499 14.7491 7.62799 14.6517 7.81101 14.6773C8.59965 14.7826 9.39862 14.7826 10.1873 14.6773C10.3713 14.6502 10.5508 14.7467 10.6271 14.9134H10.6266ZM9.09999 2.06348C11.5658 2.06298 13.6646 3.82919 14.0473 6.22709L15.0647 11.7968C15.1803 12.4053 14.7912 12.9967 14.1797 13.1413C10.7752 13.9826 7.21227 13.9826 3.80778 13.1413H3.81467C3.20462 12.9952 2.81842 12.4039 2.93649 11.7968L3.95046 6.22709C4.33469 3.82869 6.43495 2.06249 8.90123 2.06348H9.09999Z"/>`),
  chevronRight: () => svgIcon(`<polyline points="9 18 15 12 9 6"/>`),
  menu: () => svgIcon(`<path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/>`),
  x: () => svgIcon(`<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>`),
  arrowLeft: () => svgIcon(`<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>`),
  share: () => svgIcon(`<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>`),
  plus: () => svgIcon(`<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`),
  trash: () => svgIcon(`<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`),
  pencil: () => svgIcon(`<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>`),
  save: () => svgIcon(`<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>`),
  lock: () => svgIcon(`<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`),
  eye: () => svgIcon(`<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>`),
  eyeOff: () => svgIcon(`<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>`),
  copy: () => svgIcon(`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`),
  externalLink: () => svgIcon(`<path d="M14 4h6v6"/><line x1="20" y1="4" x2="11" y2="13"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/>`),
  check: () => svgIcon(`<polyline points="20 6 9 17 4 12"/>`),
  checkCircle: () => svgIcon(`<circle cx="12" cy="12" r="9"/><polyline points="8 12.5 11 15.5 16 9"/>`),
  clock: () => svgIcon(`<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`),
  alertCircle: () => svgIcon(`<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16.5" x2="12" y2="16.5"/>`),
  sparkles: () => svgIcon(`<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>`),
  megaphone: () => svgIcon(`<path d="M3 11v2a2 2 0 0 0 2 2h1l2 5h2l-1-5h4l6 4V7l-6 4H6a2 2 0 0 0-2 2z"/>`),
  chevronUp: () => svgIcon(`<polyline points="6 15 12 9 18 15"/>`),
  shieldCheck: (f, size = 18) => svgIcon(`<path d="M13 2C10.2386 2 8 4.23858 8 7C8 7.55228 8.44772 8 9 8C9.55228 8 10 7.55228 10 7C10 5.34315 11.3431 4 13 4H17C18.6569 4 20 5.34315 20 7V17C20 18.6569 18.6569 20 17 20H13C11.3431 20 10 18.6569 10 17C10 16.4477 9.55228 16 9 16C8.44772 16 8 16.4477 8 17C8 19.7614 10.2386 22 13 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2H13Z"/><path d="M3 11C2.44772 11 2 11.4477 2 12C2 12.5523 2.44772 13 3 13H11.2821C11.1931 13.1098 11.1078 13.2163 11.0271 13.318C10.7816 13.6277 10.5738 13.8996 10.427 14.0945C10.3536 14.1921 10.2952 14.2705 10.255 14.3251L10.2084 14.3884L10.1959 14.4055L10.1915 14.4115C9.86687 14.8583 9.96541 15.4844 10.4122 15.809C10.859 16.1336 11.4843 16.0346 11.809 15.5879L11.8118 15.584L11.822 15.57L11.8638 15.5132C11.9007 15.4632 11.9553 15.3897 12.0247 15.2975C12.1637 15.113 12.3612 14.8546 12.5942 14.5606C13.0655 13.9663 13.6623 13.2519 14.2071 12.7071L14.9142 12L14.2071 11.2929C13.6623 10.7481 13.0655 10.0337 12.5942 9.43937C12.3612 9.14542 12.1637 8.88702 12.0247 8.7025C11.9553 8.61033 11.9007 8.53682 11.8638 8.48679L11.822 8.43002L11.8118 8.41602L11.8095 8.41281C11.4848 7.96606 10.859 7.86637 10.4122 8.19098C9.96541 8.51561 9.86636 9.14098 10.191 9.58778L10.1925 9.58985L10.1959 9.59454L10.2084 9.61162L10.255 9.67492C10.2952 9.72946 10.3536 9.80795 10.427 9.90549C10.5738 10.1004 10.7816 10.3723 11.0271 10.682C11.1078 10.7837 11.1931 10.8902 11.2821 11H3Z"/>`, size),
  userCog: (size = 18) => svgIcon(`<path d="M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z"/><path d="M8 15H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>`, size),
  ban: () => svgIcon(`<path d="M2 21a8 8 0 0 1 11.873-7"/><circle cx="10" cy="8" r="5"/><path d="m17 17 5 5"/><path d="m22 17-5 5"/>`),
  unban: () => svgIcon(`<path d="M2 21a8 8 0 0 1 13.292-6"/><circle cx="10" cy="8" r="5"/><path d="m16 19 2 2 4-4"/>`),
  key: () => svgIcon(`<circle cx="8" cy="15" r="4"/><path d="M10.5 12.5L20 3M17 6l2.5 2.5M14 9l2 2"/>`),
  layoutDashboard: () => svgIcon(`<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>`),
  list: () => svgIcon(`<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M14 4h7"/><path d="M14 9h7"/><path d="M14 15h7"/><path d="M14 20h7"/>`),
  users: () => svgIcon(`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>`),
  userCircle: () => svgIcon(`<path d="M17.925 20.056a6 6 0 0 0-11.851.001"/><circle cx="12" cy="11" r="4"/><circle cx="12" cy="12" r="10"/>`),
  settings: () => svgIcon(`<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>`),
  upload: () => svgIcon(`<path d="M12 16V4"/><polyline points="7 9 12 4 17 9"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>`),
  image: () => svgIcon(`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><polyline points="4 17 9 12 13 16 16 13 20 17"/>`),
  fileText: () => svgIcon(`<path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>`),
  logOut: () => svgIcon(`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`),
  map: () => svgIcon(`<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>`),

  instagram: (size = 20) => `<svg width="${size}" height="${size}" fill="currentColor" style="color:#E1306C" viewBox="0 0 16 16"><path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/></svg>`,
  telegram: (size = 20) => `<svg fill="#FFF" height="${size}" width="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.384,22.779c0.322,0.228 0.737,0.285 1.107,0.145c0.37,-0.141 0.642,-0.457 0.724,-0.84c0.869,-4.084 2.977,-14.421 3.768,-18.136c0.06,-0.28 -0.04,-0.571 -0.26,-0.758c-0.22,-0.187 -0.525,-0.241 -0.797,-0.14c-4.193,1.552 -17.106,6.397 -22.384,8.35c-0.335,0.124 -0.553,0.446 -0.542,0.799c0.012,0.354 0.25,0.661 0.593,0.764c2.367,0.708 5.474,1.693 5.474,1.693c0,0 1.452,4.385 2.209,6.615c0.095,0.28 0.314,0.5 0.603,0.576c0.288,0.075 0.596,-0.004 0.811,-0.207c1.216,-1.148 3.096,-2.923 3.096,-2.923c0,0 3.572,2.619 5.598,4.062Zm-11.01,-8.677l1.679,5.538l0.373,-3.507c0,0 6.487,-5.851 10.185,-9.186c0.108,-0.098 0.123,-0.262 0.033,-0.377c-0.089,-0.115 -0.253,-0.142 -0.376,-0.064c-4.286,2.737 -11.894,7.596 -11.894,7.596Z"/></svg>`,
  discord: (size = 20) => `<svg width="${size}" height="${size}" fill="#5865F2" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg"><path d="M524.5 133.8C524.3 133.5 524.1 133.2 523.7 133.1C485.6 115.6 445.3 103.1 404 96C403.6 95.9 403.2 96 402.9 96.1C402.6 96.2 402.3 96.5 402.1 96.9C396.6 106.8 391.6 117.1 387.2 127.5C342.6 120.7 297.3 120.7 252.8 127.5C248.3 117 243.3 106.8 237.7 96.9C237.5 96.6 237.2 96.3 236.9 96.1C236.6 95.9 236.2 95.9 235.8 95.9C194.5 103 154.2 115.5 116.1 133C115.8 133.1 115.5 133.4 115.3 133.7C39.1 247.5 18.2 358.6 28.4 468.2C28.4 468.5 28.5 468.7 28.6 469C28.7 469.3 28.9 469.4 29.1 469.6C73.5 502.5 123.1 527.6 175.9 543.8C176.3 543.9 176.7 543.9 177 543.8C177.3 543.7 177.7 543.4 177.9 543.1C189.2 527.7 199.3 511.3 207.9 494.3C208 494.1 208.1 493.8 208.1 493.5C208.1 493.2 208.1 493 208 492.7C207.9 492.4 207.8 492.2 207.6 492.1C207.4 492 207.2 491.8 206.9 491.7C191.1 485.6 175.7 478.3 161 469.8C160.7 469.6 160.5 469.4 160.3 469.2C160.1 469 160 468.6 160 468.3C160 468 160 467.7 160.2 467.4C160.4 467.1 160.5 466.9 160.8 466.7C163.9 464.4 167 462 169.9 459.6C170.2 459.4 170.5 459.2 170.8 459.2C171.1 459.2 171.5 459.2 171.8 459.3C268 503.2 372.2 503.2 467.3 459.3C467.6 459.2 468 459.1 468.3 459.1C468.6 459.1 469 459.3 469.2 459.5C472.1 461.9 475.2 464.4 478.3 466.7C478.5 466.9 478.7 467.1 478.9 467.4C479.1 467.7 479.1 468 479.1 468.3C479.1 468.6 479 468.9 478.8 469.2C478.6 469.5 478.4 469.7 478.2 469.8C463.5 478.4 448.2 485.7 432.3 491.6C432.1 491.7 431.8 491.8 431.6 492C431.4 492.2 431.3 492.4 431.2 492.7C431.1 493 431.1 493.2 431.1 493.5C431.1 493.8 431.2 494 431.3 494.3C440.1 511.3 450.1 527.6 461.3 543.1C461.5 543.4 461.9 543.7 462.2 543.8C462.5 543.9 463 543.9 463.3 543.8C516.2 527.6 565.9 502.5 610.4 469.6C610.6 469.4 610.8 469.2 610.9 469C611 468.8 611.1 468.5 611.1 468.2C623.4 341.4 590.6 231.3 524.2 133.7zM222.5 401.5C193.5 401.5 169.7 374.9 169.7 342.3C169.7 309.7 193.1 283.1 222.5 283.1C252.2 283.1 275.8 309.9 275.3 342.3C275.3 375 251.9 401.5 222.5 401.5zM417.9 401.5C388.9 401.5 365.1 374.9 365.1 342.3C365.1 309.7 388.5 283.1 417.9 283.1C447.6 283.1 471.2 309.9 470.7 342.3C470.7 375 447.5 401.5 417.9 401.5z"/></svg>`,
  facebook: (size = 20) => `<svg fill="#0866ff" height="${size}" viewBox="0 0 36 36" width="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 8.442 5.811 15.526 13.652 17.471L14 34h5.5l.681 1.87Z"/><path d="M13.651 35.471v-11.97H9.936V18h3.715v-2.37c0-6.127 2.772-8.964 8.784-8.964 1.138 0 3.103.223 3.91.446v4.983c-.425-.043-1.167-.065-2.081-.065-2.952 0-4.09 1.116-4.09 4.025V18h5.883l-1.008 5.5h-4.867v12.37a18.183 18.183 0 0 1-6.53-.399Z" fill="#ffffff"/></svg>`,
  tiktok: (size = 20) => `<svg fill="currentColor" style="color:#fff" height="${size}" viewBox="0 0 16 16" width="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/></svg>`,
  youtube: (size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 333333 333333" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M329930 100020s-3254-22976-13269-33065c-12691-13269-26901-13354-33397-14124-46609-3396-116614-3396-116614-3396h-122s-69973 0-116608 3396c-6522 793-20712 848-33397 14124C6501 77044 3316 100020 3316 100020S-1 126982-1 154001v25265c0 26962 3315 53979 3315 53979s3254 22976 13207 33082c12685 13269 29356 12838 36798 14254 26685 2547 113354 3315 113354 3315s70065-124 116675-3457c6522-770 20706-848 33397-14124 10021-10089 13269-33090 13269-33090s3319-26962 3319-53979v-25263c-67-26962-3384-53979-3384-53979l-18 18-2-2zM132123 209917v-93681l90046 46997-90046 46684z" fill="red"/></svg>`,
  twitter: (size = 20) => `<svg fill="#FFF" height="${size}" viewBox="0 0 24 24" width="${size}"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
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
  postViewAdType: "image", // 'image' | 'code'
  postViewAdImage: "",
  postViewAdLink: "",
  postViewAdCode: "",
};

const DEFAULT_BRANDING = {
  siteName: "CraftVerse",
  logo: "",
  footerTagline: "Craftland map codes, previews & tutorials from the community.",
  categoryMode: "all", // 'all' | 'selected'
  selectedCategories: [],
  socialEnabled: true,
  socialLinks: [], // official site social accounts: [{id, icon, label, url, enabled}]
  bannerSlides: [], // home top image slider: [{id, image, link}]
};

const LINK_ICON_KEYS = { telegram: "telegram", discord: "discord", twitter: "twitter", facebook: "facebook", instagram: "instagram", tiktok: "tiktok", youtube: "youtube", other: "externalLink" };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // max file the picker will accept — auto-compressed before storage
const MAX_STORED_IMAGE_BYTES = 700 * 1024; // Firestore documents must stay under 1MiB; images are compressed to fit under this

/* ---------------------------------------------------------------- */
/*  STATE                                                            */
/* ---------------------------------------------------------------- */
const state = {
  accounts: [],
  posts: [],
  siteContent: DEFAULT_SITE_CONTENT,
  adSettings: DEFAULT_AD_SETTINGS,
  branding: DEFAULT_BRANDING,
  likedIds: JSON.parse(localStorage.getItem("cv_liked") || "[]"),
  session: null, // { uid, role, account }
  accountsLoaded: false,
  postsLoaded: false,
  ui: {
    menuOpen: false,
    exploreOpen: false,
    panelSidebarOpen: false,
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

onSnapshot(doc(db, "branding", "main"), (d) => {
  if (d.exists()) state.branding = { ...DEFAULT_BRANDING, ...d.data() };
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
async function fsSaveBranding(data) {
  try { await setDoc(doc(db, "branding", "main"), data, { merge: true }); return true; }
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

// Reads an image file, downsizes/re-compresses it on a canvas so the final
// base64 stays under MAX_STORED_IMAGE_BYTES regardless of the original
// file size (up to MAX_IMAGE_BYTES), then resolves to a data URL.
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
  return `<button data-action="${action}" data-id="${escAttr(id)}" class="rounded-xl border border-bd flex items-center justify-center flex-shrink-0 text-tmuted ${active ? "bg-coral/15" : "bg-panelalt"} ${extra}" style="width:${size}px;height:${size}px;">${icon}</button>`;
}
function dangerIconBtn({ action, id = "", size = 40 }) {
  return `<button data-action="${action}" data-id="${escAttr(id)}" class="border flex items-center justify-center flex-shrink-0" style="width:${size}px;height:${size}px;border-radius:14px;background:rgba(255,93,108,.16);border-color:rgba(255,93,108,.3);color:#FF5D6C;">${ICONS.trash()}</button>`;
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
function passwordFieldHtml(id, placeholder = "", extraCls = "") {
  return `<div class="relative">
    <input id="${id}" type="password" class="${inputCls} ${extraCls}" style="padding-right:44px;" placeholder="${escAttr(placeholder)}" />
    <button type="button" data-action="toggle-password" data-id="${id}" class="absolute text-tmuted" style="right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;">${ICONS.eye()}</button>
  </div>`;
}

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
  if (variant === "postview") {
    if (s.postViewAdType === "code" && s.postViewAdCode) {
      return `<div class="mb-4 rounded-2xl overflow-hidden" id="postview-ad-slot"></div>`;
    }
    if (s.postViewAdType === "image" && s.postViewAdImage) {
      const inner = `<img src="${escAttr(s.postViewAdImage)}" alt="Sponsored" class="w-full object-cover rounded-2xl mb-4" style="max-height:220px;" />`;
      return s.postViewAdLink ? `<a href="${escAttr(s.postViewAdLink)}" target="_blank" rel="noopener noreferrer" class="block no-underline">${inner}</a>` : inner;
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
// Injects raw ad-network HTML (AdSense/Monetag/Adsterra etc.) into a
// container and re-creates any <script> tags so they actually execute
// (scripts inserted via innerHTML are inert otherwise).
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

let bannerSlideIndex = 0;
function bannerSliderHtml() {
  const slides = (state.branding.bannerSlides || []).filter((s) => s.image);
  if (slides.length === 0) {
    return `<div class="border border-dashed border-bd rounded-2xl px-4 py-8 mb-4 text-center bg-panelalt">
      <div class="font-mono text-[10px] text-tfaint uppercase tracking-wide mb-2">Sponsored</div>
      <div class="font-sora font-bold text-sm text-tprimary">Home banner</div>
      <div class="font-inter text-xs text-tmuted mt-1">Add slides in Site → Ads &amp; Layout</div>
    </div>`;
  }
  if (bannerSlideIndex >= slides.length) bannerSlideIndex = 0;
  const slide = slides[bannerSlideIndex];
  const img = `<img src="${escAttr(slide.image)}" class="w-full object-cover rounded-2xl" style="height:150px;" />`;
  const clickable = slide.link ? `<a href="${escAttr(slide.link)}" target="_blank" rel="noopener noreferrer" class="block no-underline">${img}</a>` : img;
  const dots = slides.length > 1
    ? `<div class="flex justify-center gap-1.5 mt-2.5">${slides.map((_, i) => `<button data-action="set-banner-slide" data-id="${i}" class="rounded-full" style="width:${i === bannerSlideIndex ? "18px" : "6px"};height:6px;background:${i === bannerSlideIndex ? "#34D399" : "#232D48"};transition:width .2s ease;"></button>`).join("")}</div>`
    : "";
  return `<div id="banner-slider-touch" class="mb-4">${clickable}${dots}</div>`;
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
/*  HEADER / FOOTER / MENU / POST CARD                                */
/* ---------------------------------------------------------------- */
function siteLogoHtml(size = 36) {
  const b = state.branding;
  if (b.logo) return `<img src="${escAttr(b.logo)}" alt="${escAttr(b.siteName)}" class="rounded-md object-cover flex-shrink-0" style="width:${size}px;height:${size}px;" />`;
  const letter = b.siteName ? b.siteName.trim()[0].toUpperCase() : "C";
  return `<div class="rounded-md flex items-center justify-center font-sora font-extrabold text-white flex-shrink-0" style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#3E8EFF,#7C5CFF);font-size:${size * 0.5}px;">${letter}</div>`;
}
function headerLogoHtml(height = 40) {
  const b = state.branding;
  if (b.logo) return `<img src="${escAttr(b.logo)}" alt="${escAttr(b.siteName)}" class="object-contain flex-shrink-0" style="height:${height}px;width:auto;max-width:200px;" />`;
  const letter = b.siteName ? b.siteName.trim()[0].toUpperCase() : "C";
  return `<div class="rounded-xl flex items-center justify-center font-sora font-extrabold text-white flex-shrink-0" style="width:${height}px;height:${height}px;background:linear-gradient(135deg,#3E8EFF,#7C5CFF);font-size:${height * 0.5}px;">${letter}</div>`;
}
function homeHeaderHtml() {
  return `<div id="site-header" class="sticky top-0 z-20 pb-1" style="background:#0A0E17;transition:background-color .2s ease, backdrop-filter .2s ease;">
    <div class="flex items-center gap-2.5 px-4 pt-4 pb-2.5">
      ${iconBtn({ action: "open-menu", icon: ICONS.menu() })}
      ${headerLogoHtml(40)}
      <div class="flex-1"></div>
      ${iconBtn({ action: "open-explore", icon: ICONS.search() })}
      ${iconBtn({ action: "open-notifications", icon: ICONS.notif() })}
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
    { label: "Home", id: "home", icon: ICONS.home() },
    { label: "Favorites", id: "favorites", icon: ICONS.heart() },
    { label: "About", id: "about", icon: ICONS.fileText() },
    { label: "Terms", id: "terms", icon: ICONS.termsPage() },
    { label: "DMCA", id: "dmca", icon: ICONS.dmcaPage() },
    { label: "Login Panel", id: "adminGate", icon: ICONS.shieldCheck() },
  ];
  return `<div data-action="close-menu" class="fixed inset-0 z-50" style="background:rgba(0,0,0,0.5);">
    <div class="max-w-[480px] h-full mx-auto relative">
      <div data-action="noop" class="absolute bg-panel border border-bd rounded-2xl overflow-hidden shadow-2xl min-w-[210px]" style="top:68px;left:16px;">
        ${items.map((item, i) => `<button data-action="nav" data-id="${item.id}" class="w-full text-left px-4 py-3 font-inter text-sm flex items-center gap-2.5 text-tmuted ${i < items.length - 1 ? "border-b border-bd" : ""}">${item.icon}<span class="flex-1">${item.label}</span></button>`).join("")}
      </div>
    </div>
  </div>`;
}

function panelHeaderHtml(title) {
  return `<div class="flex items-center gap-2.5 mb-4">
    ${iconBtn({ action: "toggle-panel-sidebar", icon: ICONS.menu() })}
    <div class="flex-1 text-center font-sora font-bold text-base">${esc(title)}</div>
    ${iconBtn({ action: "logout", icon: ICONS.logOut() })}
  </div>`;
}
function panelSidebarDrawerHtml(items) {
  if (!state.ui.panelSidebarOpen) return "";
  return `<div data-action="close-panel-sidebar" class="fixed inset-0 z-50" style="background:rgba(0,0,0,0.5);">
    <div class="max-w-[480px] h-full mx-auto relative">
      <div data-action="noop" class="absolute bg-panel border border-bd rounded-2xl overflow-hidden shadow-2xl min-w-[210px]" style="top:68px;left:16px;">
        <button data-action="nav" data-id="home" class="w-full text-left px-4 py-3 font-inter text-sm border-b border-bd flex items-center gap-2.5 text-tmuted">${ICONS.arrowLeft()} Back to Home</button>
        ${items.map((item, i) => `<button data-action="${item.action}" data-id="${item.id}" class="w-full text-left px-4 py-3 font-inter text-sm flex items-center gap-2.5 ${i < items.length - 1 ? "border-b border-bd" : ""}" style="background:${item.active ? "#212B4A" : "transparent"};color:${item.active ? "#F3F5F9" : "#8A93AC"};">${item.icon}<span class="flex-1">${item.label}</span>${item.badge > 0 ? `<span class="rounded-full bg-coral text-white flex items-center justify-center font-inter" style="min-width:16px;height:16px;font-size:10px;padding:0 4px;">${item.badge}</span>` : ""}</button>`).join("")}
      </div>
    </div>
  </div>`;
}
function footerHtml() {
  const b = state.branding;
  const socials = b.socialEnabled ? (b.socialLinks || []).filter((l) => l.enabled && l.url) : [];
  return `<div class="mt-2 bg-panel border-t border-bd rounded-t-[20px] px-5 pt-6 pb-5 flex flex-col items-center gap-3.5">
    <div class="flex items-center gap-2">
      ${siteLogoHtml(32)}
      <div class="font-sora font-bold text-[15px]">${esc(b.siteName)}</div>
    </div>
    <div class="font-inter text-xs text-tmuted text-center">${esc(b.footerTagline)}</div>
    ${socials.length ? `<div class="flex gap-2.5">${socials.map((l) => `<a href="${escAttr(l.url || "#")}" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-lg bg-panelalt border border-bd flex items-center justify-center">${ICONS[LINK_ICON_KEYS[l.icon] || "externalLink"]()}</a>`).join("")}</div>` : ""}
    <div class="flex gap-4">
      ${["about", "terms", "dmca"].map((k) => `<button data-action="nav" data-id="${k}" class="bg-transparent border-none font-inter text-xs text-tmuted capitalize">${k}</button>`).join("")}
    </div>
    <div class="w-full h-px bg-bd my-1"></div>
    <div class="font-inter text-[11px] text-tfaint">© ${new Date().getFullYear()} ${esc(b.siteName)}. All rights reserved.</div>
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
  if (mode === "home" && visible.length > 0 && adsOn && state.adSettings.bannerEnabled) html += bannerSliderHtml();
  if (visible.length === 0) {
    html += `<div class="text-center py-16 px-5 text-tfaint font-inter text-sm">${mode === "favorites" ? "You haven't favorited any maps yet." : (state.postsLoaded ? "No maps yet — check back soon." : "Loading maps...")}</div>`;
  } else {
    html += rows.map((row) => (row.kind === "ad" ? adSlot("native") : postCardHtml(row.post, getAuthor(row.post.authorId)))).join("");
  }
  html += `</div>`;
  return html;
}

/* ---------------------------------------------------------------- */
/*  SCREEN: EXPLORE (search + categories)                             */
/* ---------------------------------------------------------------- */
let exploreQuery = "";
let exploreCategory = null;
function exploreScreenHtml() {
  const visible = state.posts.filter((p) => p.status === "approved" && !p.hidden);
  let categories = Array.from(new Set(visible.map((p) => p.category).filter(Boolean)));
  if (state.branding.categoryMode === "selected") {
    categories = state.branding.selectedCategories.filter((c) => categories.includes(c));
  }
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
function getPostCodes(post) {
  if (Array.isArray(post.codes) && post.codes.length) return post.codes;
  if (post.mapCode) return [{ id: "legacy-code", title: "Craftland Map Code", code: post.mapCode }];
  return [];
}
function getPostLinks(post) {
  if (Array.isArray(post.links) && post.links.length) return post.links;
  if (post.previewVideoUrl) return [{ id: "legacy-link", title: "Watch preview / tutorial video", url: post.previewVideoUrl }];
  return [];
}
function detectLinkIcon(url) {
  const u = (url || "").toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return ICONS.youtube();
  if (u.includes("t.me") || u.includes("telegram")) return ICONS.telegram();
  if (u.includes("discord")) return ICONS.discord();
  if (u.includes("facebook.com") || u.includes("fb.com")) return ICONS.facebook();
  if (u.includes("instagram.com")) return ICONS.instagram();
  if (u.includes("tiktok.com")) return ICONS.tiktok();
  if (u.includes("twitter.com") || u.includes("x.com")) return ICONS.twitter();
  return ICONS.externalLink();
}

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

  if (state.adSettings.adsEnabled && state.adSettings.postViewEnabled) html += `<div class="mt-5">${adSlot("postview")}</div>`;

  html += `<div class="mt-1.5 flex flex-col gap-3">`;
  const codes = getPostCodes(post);
  const links = getPostLinks(post);
  if (codes.length === 0 && links.length === 0) {
    html += `<div class="text-center text-tfaint font-inter text-sm py-4">No map code or links added yet.</div>`;
  }
  codes.forEach((c) => {
    html += `<div class="bg-panel border border-bd rounded-2xl p-4">
      <div class="font-mono text-[11px] text-tfaint uppercase tracking-wide mb-2">${esc(c.title || "Craftland Map Code")}</div>
      <div class="flex items-center gap-2">
        <div class="flex-1 bg-bgdeep border border-bd rounded-lg px-3 py-2.5 font-mono text-sm text-tprimary overflow-x-auto whitespace-nowrap">${c.code ? esc(c.code) : '<span class="text-tfaint">Not added yet</span>'}</div>
        ${primaryBtn({ action: "copy-map-code", id: c.code || "", label: "Copy", icon: `<span class="mr-1">${ICONS.copy()}</span>`, extra: "px-4" })}
      </div>
    </div>`;
  });
  links.forEach((l) => {
    const platformIcon = detectLinkIcon(l.url);
    html += `<a href="${escAttr(l.url || "#")}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 bg-panel border border-bd rounded-2xl px-3.5 py-3 no-underline">
      <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-bgdeep border border-bd">${platformIcon}</div>
      <div class="flex-1 font-sora font-semibold text-sm text-tprimary">${esc(l.title || "Watch link")}</div>
      <span class="text-tmuted">${ICONS.externalLink()}</span>
    </a>`;
  });
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
      ${[["links", "Links"], ["posts", "Maps"]].map(([k, label]) => `<button data-action="set-profile-tab" data-id="${k}" class="flex-1 py-2.5 rounded-xl font-sora font-semibold text-sm ${profileTab === k ? "bg-panelhover text-tprimary" : "text-tmuted"}">${label}</button>`).join("")}
    </div>
  </div>
  <div class="px-4 pb-7">`;
  if (profileTab === "links") {
    html += account.links && account.links.length
      ? `<div class="flex flex-col gap-2.5">${account.links.map((l) => `<a href="${escAttr(l.url || "#")}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3.5 bg-panel border border-bd rounded-2xl px-4 py-3.5 no-underline"><span class="flex-shrink-0">${ICONS[LINK_ICON_KEYS[l.icon] || "externalLink"]()}</span><div class="font-sora font-semibold text-[15px] text-tprimary">${esc(l.label)}</div></a>`).join("")}</div>`
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
      ${fieldWrap("Password", passwordFieldHtml("bo-password", "At least 6 characters"))}
      <div id="bo-error" class="text-coral text-xs mb-2 font-inter"></div>
      ${primaryBtn({ action: "bootstrap-owner", label: "Create Owner Account", extra: "w-full" })}
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- */
/*  SCREEN: ADMIN GATE / LOGIN                                        */
/* ---------------------------------------------------------------- */
function adminGateScreenHtml() {
  return `${backHeaderHtml("Login Panel")}
  <div class="px-5 pt-2 pb-8 flex flex-col gap-4">
    <button data-action="nav" data-id="ownerLogin" class="flex items-center gap-4 bg-panel border border-bd rounded-2xl p-5 text-left">
      <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style="background:rgba(62,142,255,.14);color:#3E8EFF;">${ICONS.shieldCheck(false, 24)}</div>
      <div><div class="font-sora font-bold text-base mb-1">Owner</div><div class="font-inter text-sm text-tmuted leading-relaxed">Full control — approve maps, manage creators</div></div>
    </button>
    <button data-action="nav" data-id="adminLogin" class="flex items-center gap-4 bg-panel border border-bd rounded-2xl p-5 text-left">
      <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style="background:rgba(255,93,108,.14);color:#FF5D6C;">${ICONS.userCog(24)}</div>
      <div><div class="font-sora font-bold text-base mb-1">Creator</div><div class="font-inter text-sm text-tmuted leading-relaxed">Submit maps, manage your own profile</div></div>
    </button>
  </div>`;
}
function ownerLoginScreenHtml() {
  return `${backHeaderHtml("Owner Login", "nav", "adminGate")}
  <div class="px-5 pt-6 flex flex-col items-center">
    <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4.5" style="background:rgba(62,142,255,.14);">${ICONS.lock()}</div>
    <div class="w-full">
      ${fieldWrap("Email", `<input id="ol-email" type="email" class="${inputCls}" />`)}
      ${fieldWrap("Password", passwordFieldHtml("ol-password"))}
      <div id="ol-error" class="text-coral text-xs mb-2 font-inter"></div>
      ${primaryBtn({ action: "owner-login", label: "Enter Owner Panel", extra: "w-full" })}
      <button data-action="forgot-password" data-id="owner" class="w-full text-center mt-3 bg-transparent border-none text-tmuted font-inter text-xs">Forgot password?</button>
    </div>
  </div>`;
}
function adminLoginScreenHtml() {
  const admins = state.accounts.filter((a) => a.role === "admin");
  return `${backHeaderHtml("Creator Login", "nav", "adminGate")}
  ${admins.length === 0
    ? `<div class="text-center text-tfaint font-inter text-sm px-5 py-10">No creator accounts yet. Ask the owner to add one.</div>`
    : `<div class="px-5 pt-5">
      ${fieldWrap("Creator account", `<select id="al-account" class="${inputCls}">${admins.map((a) => `<option value="${a.id}" ${a.banned ? "disabled" : ""}>${esc(a.name)}${a.banned ? " (banned)" : ""}</option>`).join("")}</select>`)}
      ${fieldWrap("Password", passwordFieldHtml("al-password"))}
      <div id="al-error" class="text-coral text-xs mb-2 font-inter"></div>
      ${primaryBtn({ action: "admin-login", label: "Enter Creator Panel", extra: "w-full" })}
      <button data-action="forgot-password" data-id="admin" class="w-full text-center mt-3 bg-transparent border-none text-tmuted font-inter text-xs">Forgot password?</button>
    </div>`}`;
}

/* ---------------------------------------------------------------- */
/*  POST EDITOR (map: title, category, description, thumbnail,       */
/*  map code, preview video link — no watch/embed providers)          */
/* ---------------------------------------------------------------- */
function emptyPostDraft(authorId, status) {
  return { id: "p" + Date.now(), title: "", category: "", description: "", thumbnail: "", codes: [{ id: "c" + Date.now(), title: "", code: "" }], links: [], authorId, status, hidden: false };
}
let postEditorDraft = null;
let postEditorMode = null; // 'admin' | 'owner'

function codeRowHtml(entry, idx) {
  return `<div class="bg-bgdeep border border-bd rounded-lg p-3 mb-2.5" data-code-idx="${idx}">
    <div class="flex gap-2 mb-2">
      <input class="${inputCls} flex-1 pe-code-title" data-idx="${idx}" value="${escAttr(entry.title)}" placeholder="Name e.g. 13 vs 13 (India)" />
      ${dangerIconBtn({ action: "pe-remove-code", id: String(idx), size: 40 })}
    </div>
    <input class="${inputCls} font-mono pe-code-value" data-idx="${idx}" value="${escAttr(entry.code)}" placeholder="e.g. 123-456-789" />
  </div>`;
}
function linkRowHtmlForPost(entry, idx) {
  return `<div class="bg-bgdeep border border-bd rounded-lg p-3 mb-2.5" data-link-idx="${idx}">
    <div class="flex gap-2 mb-2">
      <input class="${inputCls} flex-1 pe-link-title" data-idx="${idx}" value="${escAttr(entry.title)}" placeholder="Name e.g. Watch on YouTube" />
      ${dangerIconBtn({ action: "pe-remove-link", id: String(idx), size: 40 })}
    </div>
    <input class="${inputCls} pe-link-url" data-idx="${idx}" value="${escAttr(entry.url)}" placeholder="https://..." />
  </div>`;
}

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

    <div class="font-mono text-[11px] text-tfaint uppercase mt-4 mb-2">Map codes</div>
    <div id="pe-codes">${draft.codes.map((c, i) => codeRowHtml(c, i)).join("")}</div>
    <button data-action="pe-add-code" class="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-dashed border-bd text-tmuted font-inter text-sm mb-4">${ICONS.plus()} Add code</button>

    <div class="font-mono text-[11px] text-tfaint uppercase mb-2">Links</div>
    <div id="pe-links">${draft.links.map((l, i) => linkRowHtmlForPost(l, i)).join("")}</div>
    <button data-action="pe-add-link" class="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-dashed border-bd text-tmuted font-inter text-sm mb-4">${ICONS.plus()} Add link</button>

    <div class="flex gap-2.5 mt-1">
      ${primaryBtn({ action: "pe-save", label: "Save map", icon: `<span class="mr-1">${ICONS.save()}</span>`, extra: "flex-1" })}
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
  document.querySelectorAll(".pe-link-title").forEach((el) => el.addEventListener("input", (e) => { postEditorDraft.links[+e.target.dataset.idx].title = e.target.value; }));
  document.querySelectorAll(".pe-link-url").forEach((el) => el.addEventListener("input", (e) => { postEditorDraft.links[+e.target.dataset.idx].url = e.target.value; }));
  const fileInput = document.getElementById("pe-thumbnail-file");
  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_BYTES) { showToast("Image too large — please pick something under 5MB.", "error"); return; }
      try {
        const dataUrl = await fileToCompressedDataUrl(file);
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
      ${dangerIconBtn({ action: "pf-remove-link", id: String(idx), size: 40 })}
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
      if (file.size > MAX_IMAGE_BYTES) { showToast("Image too large — please pick something under 5MB.", "error"); return; }
      try { profileEditorDraft.avatar = await fileToCompressedDataUrl(file); renderCurrentEditorPanel(); }
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
  const tabLabels = { posts: "My Maps", profile: "My Profile" };
  let html = `<div class="px-4 pt-4 pb-10">
    ${panelHeaderHtml("Creator Panel")}
    <div class="flex items-center gap-2 mb-4.5">
      <div class="font-inter text-xs text-tfaint">${esc(account.name)} ·</div>
      <div class="font-sora font-semibold text-sm text-tprimary">${tabLabels[tab]}</div>
    </div>`;

  if (tab === "posts") {
    const myPosts = state.posts.filter((p) => p.authorId === account.id);
    if (postEditorMode === "admin" && postEditorDraft) {
      html += postEditorHtml(postEditorDraft);
    } else {
      html += primaryBtn({ action: "admin-new-post", label: "Add new map", icon: `<span class="mr-1">${ICONS.plus()}</span>`, extra: "w-full mb-4" });
    }
    if (myPosts.length === 0 && postEditorMode !== "admin") html += `<div class="text-center text-tfaint font-inter text-sm py-5">You haven't posted any maps yet.</div>`;
    if (!(postEditorMode === "admin" && postEditorDraft)) {
      myPosts.forEach((post) => {
        html += `<div class="bg-panel border border-bd rounded-2xl p-3 mb-2.5">
          <div class="flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <div class="font-sora font-semibold text-[13px] line-clamp-1">${esc(post.title)}</div>
              <div class="mt-1 flex items-center gap-1.5">${statusBadge(post.status)}${post.hidden ? `<span class="text-tfaint font-mono text-[10px]">HIDDEN</span>` : ""}</div>
            </div>
            ${iconBtn({ action: "admin-edit-post", id: post.id, size: 36, icon: ICONS.pencil() })}
            ${dangerIconBtn({ action: "admin-delete-post", id: post.id, size: 36 })}
          </div>
          ${ghostBtn({ action: "admin-toggle-hide", id: post.id, label: post.hidden ? "Unhide this map" : "Hide this map", icon: `<span class="mr-1">${post.hidden ? ICONS.eye() : ICONS.eyeOff()}</span>`, extra: "w-full mt-2.5" })}
        </div>`;
      });
    }
  } else {

    html += profileEditorHtml(profileEditorDraft || account, true);
  }
  html += `</div>`;
  html += panelSidebarDrawerHtml([
    { action: "set-admin-tab", id: "posts", label: "My Maps", icon: ICONS.list(), active: tab === "posts" },
    { action: "set-admin-tab", id: "profile", label: "My Profile", icon: ICONS.userCircle(), active: tab === "profile" },
  ]);
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
    ["Creators", accounts.filter((a) => a.role === "admin").length],
    ["Banned creators", accounts.filter((a) => a.role === "admin" && a.banned).length],
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

  if (!(postEditorMode === "owner" && postEditorDraft)) {
    state.posts.forEach((post) => {
      const author = getAuthor(post.authorId);
      html += `<div class="bg-panel border border-bd rounded-2xl p-3 mb-2.5">
        <div class="flex items-center gap-3">
          ${avatarHtml(author.name, author.avatar, 36)}
          <div class="flex-1 min-w-0"><div class="font-sora font-semibold text-[13px] line-clamp-1">${esc(post.title)}</div><div class="font-inter text-xs text-tfaint">${esc(author.name)}</div></div>
          ${iconBtn({ action: "owner-edit-post", id: post.id, size: 34, icon: ICONS.pencil() })}
          ${dangerIconBtn({ action: "owner-delete-post", id: post.id, size: 34 })}
        </div>
        <div class="flex items-center gap-2.5 mt-2.5">
          ${statusBadge(post.status)}
          ${ghostBtn({ action: "owner-toggle-hide", id: post.id, label: post.hidden ? "Unhide" : "Hide", icon: `<span class="mr-1">${post.hidden ? ICONS.eye() : ICONS.eyeOff()}</span>`, extra: "ml-auto px-2.5 py-1.5" })}
        </div>
      </div>`;
    });
  }
  return html;
}

/* ---------------------------------------------------------------- */
/*  OWNER: ADMINS TAB                                                  */
/* ---------------------------------------------------------------- */
let resettingAdminId = null;

function ownerAdminsHtml() {
  const admins = state.accounts.filter((a) => a.role === "admin");
  let html = `<div class="bg-panel border border-bd rounded-2xl p-3.5 mb-4">
    <div class="font-mono text-[11px] text-tfaint uppercase mb-2.5">Add new creator</div>
    ${fieldWrap("Name", `<input id="na-name" class="${inputCls}" />`)}
    ${fieldWrap("Email", `<input id="na-email" type="email" class="${inputCls}" />`)}
    ${fieldWrap("Password", `<input id="na-password" type="password" class="${inputCls}" placeholder="At least 6 characters" />`)}
    <div id="na-error" class="text-coral text-xs mb-2 font-inter"></div>
    ${primaryBtn({ action: "owner-add-admin", label: "Add creator", icon: `<span class="mr-1">${ICONS.plus()}</span>`, extra: "w-full" })}
  </div>`;

  if (admins.length === 0) {
    html += `<div class="text-center text-tfaint font-inter text-sm py-5">No creators yet.</div>`;
  } else {
    admins.forEach((a) => {
      html += `<div class="bg-panel border border-bd rounded-2xl p-3 mb-2.5">
        <div class="flex items-center gap-2.5">
          ${avatarHtml(a.name, a.avatar, 34)}
          <div class="flex-1"><div class="font-sora font-semibold text-sm">${esc(a.name)}</div>${a.banned ? `<div class="font-mono text-[10px] text-coral uppercase">Banned</div>` : ""}</div>
          ${dangerIconBtn({ action: "owner-remove-admin", id: a.id, size: 34 })}
        </div>
        <div class="flex gap-2 mt-2.5">
          ${ghostBtn({ action: "owner-toggle-ban", id: a.id, label: a.banned ? "Unban" : "Ban", icon: `<span class="mr-1">${a.banned ? ICONS.unban() : ICONS.ban()}</span>`, color: a.banned ? "#34D399" : "#FF5D6C", extra: "flex-1" })}
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
let brandingDraft = null;
let activeSlideUploadIndex = null;

function socialLinkRowHtml(link, idx) {
  return `<div class="bg-bgdeep border border-bd rounded-lg p-3 mb-2.5">
    <div class="flex gap-2 mb-2">
      <input class="${inputCls} flex-1 soc-label" data-idx="${idx}" value="${escAttr(link.label)}" placeholder="Label e.g. Telegram Channel" />
      ${dangerIconBtn({ action: "brand-remove-social", id: String(idx), size: 40 })}
    </div>
    <input class="${inputCls} mb-2 soc-url" data-idx="${idx}" value="${escAttr(link.url)}" placeholder="https://..." />
    <div class="flex gap-2 items-center">
      <select class="${inputCls} soc-icon flex-1" data-idx="${idx}">
        ${Object.keys(LINK_ICON_KEYS).map((k) => `<option value="${k}" ${link.icon === k ? "selected" : ""}>${k}</option>`).join("")}
      </select>
      ${toggleHtml(`social.${idx}`, link.enabled !== false, "On", "Off")}
    </div>
  </div>`;
}
function bannerSlideRowHtml(slide, idx) {
  return `<div class="bg-bgdeep border border-bd rounded-lg p-3 mb-2.5">
    <div class="flex gap-2 mb-2">
      ${slide.image ? `<img src="${escAttr(slide.image)}" class="rounded-lg object-cover flex-shrink-0" style="width:56px;height:40px;" />` : `<div class="rounded-lg bg-panelalt flex items-center justify-center flex-shrink-0" style="width:56px;height:40px;">${ICONS.image()}</div>`}
      <button data-action="brand-upload-slide" data-id="${idx}" class="rounded-lg border border-bd bg-panelalt flex items-center justify-center flex-1 font-inter text-xs text-tmuted">${ICONS.upload()} <span class="ml-1.5">Upload image</span></button>
      ${dangerIconBtn({ action: "brand-remove-slide", id: String(idx), size: 40 })}
    </div>
    <input class="${inputCls} slide-link" data-idx="${idx}" value="${escAttr(slide.link)}" placeholder="https://... (opens when tapped)" />
  </div>`;
}

function ownerSiteHtml() {
  const ads = adsDraft || state.adSettings;
  const content = siteContentDraft || state.siteContent;
  const brand = brandingDraft || state.branding;
  const allCategories = Array.from(new Set(state.posts.map((p) => p.category).filter(Boolean)));

  return `<div class="flex flex-col gap-4">
    <div class="bg-panel border border-bd rounded-2xl p-4">
      <div class="flex items-center gap-2 mb-3.5">${ICONS.layoutDashboard()}<div class="font-sora font-bold text-sm">Branding &amp; Layout</div></div>
      ${fieldWrap("Site name", `<input id="brand-name" class="${inputCls}" value="${escAttr(brand.siteName)}" />`)}
      ${fieldWrap("Header / footer logo", `
        <div class="flex gap-2 items-center">
          ${siteLogoHtml(44)}
          <input id="brand-logo" class="${inputCls} flex-1" value="${brand.logo && brand.logo.startsWith("data:") ? "(uploaded image)" : escAttr(brand.logo)}" ${brand.logo && brand.logo.startsWith("data:") ? "readonly" : ""} placeholder="https://... or upload from device" />
          <button data-action="brand-upload-logo" class="rounded-lg border border-bd bg-panelalt flex items-center justify-center flex-shrink-0" style="width:44px;height:44px;">${ICONS.upload()}</button>
          <input id="brand-logo-file" type="file" accept="image/*" class="hidden" />
        </div>
      `)}
      ${fieldWrap("Footer tagline", `<textarea id="brand-tagline" class="${inputCls}" style="min-height:60px;">${esc(brand.footerTagline)}</textarea>`)}
      ${fieldWrap("Explore categories", `
        <div class="flex gap-2 mb-2.5">
          <button data-action="set-category-mode" data-id="all" class="flex-1 py-2 rounded-lg border font-inter text-xs font-semibold" style="border-color:${brand.categoryMode === "all" ? "#3E8EFF" : "#232D48"};background:${brand.categoryMode === "all" ? "rgba(62,142,255,.14)" : "transparent"};color:${brand.categoryMode === "all" ? "#3E8EFF" : "#8A93AC"};">Show all categories</button>
          <button data-action="set-category-mode" data-id="selected" class="flex-1 py-2 rounded-lg border font-inter text-xs font-semibold" style="border-color:${brand.categoryMode === "selected" ? "#3E8EFF" : "#232D48"};background:${brand.categoryMode === "selected" ? "rgba(62,142,255,.14)" : "transparent"};color:${brand.categoryMode === "selected" ? "#3E8EFF" : "#8A93AC"};">Hand-pick categories</button>
        </div>
        ${brand.categoryMode === "selected" ? (
          allCategories.length === 0
            ? `<div class="text-tfaint font-inter text-xs py-1">No categories exist yet — add one on a map first.</div>`
            : `<div class="flex flex-wrap gap-2">${allCategories.map((c) => {
                const on = brand.selectedCategories.includes(c);
                return `<button data-action="toggle-selected-category" data-id="${escAttr(c)}" class="px-3 py-1.5 rounded-lg border font-inter text-xs" style="border-color:${on ? "#34D399" : "#232D48"};background:${on ? "rgba(52,211,153,.14)" : "#1C2540"};color:${on ? "#34D399" : "#8A93AC"};">${on ? "✓ " : ""}${esc(c)}</button>`;
              }).join("")}</div>`
        ) : `<div class="text-tfaint font-inter text-xs py-1">Every category found on your maps will show in Explore.</div>`}
      `)}
      ${primaryBtn({ action: "owner-save-branding", label: "Save branding", icon: `<span class="mr-1">${ICONS.save()}</span>`, extra: "w-full" })}
    </div>

    <div class="bg-panel border border-bd rounded-2xl p-4">
      <div class="flex items-center gap-2 mb-3.5">${ICONS.share()}<div class="font-sora font-bold text-sm">Official Social Links</div></div>
      <div class="font-inter text-xs text-tmuted mb-3">Shown in the footer to everyone. Not tied to any creator's profile.</div>
      ${fieldWrap("Footer social icons", toggleHtml("social-enabled", brand.socialEnabled, "Shown in footer", "Hidden"))}
      ${brand.socialLinks.map((l, i) => socialLinkRowHtml(l, i)).join("")}
      <button data-action="brand-add-social" class="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-dashed border-bd text-tmuted font-inter text-sm mb-4">${ICONS.plus()} Add social link</button>
      ${primaryBtn({ action: "owner-save-branding", label: "Save social links", icon: `<span class="mr-1">${ICONS.save()}</span>`, extra: "w-full" })}
    </div>

    <div class="bg-panel border border-bd rounded-2xl p-4">
      <div class="flex items-center gap-2 mb-3.5">${ICONS.image()}<div class="font-sora font-bold text-sm">Home Banner Slides</div></div>
      <div class="font-inter text-xs text-tmuted mb-3">Image slider at the top of Home. Each slide opens its own link when tapped.</div>
      <div id="banner-slides-list">${brand.bannerSlides.map((s, i) => bannerSlideRowHtml(s, i)).join("")}</div>
      <button data-action="brand-add-slide" class="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-dashed border-bd text-tmuted font-inter text-sm mb-4">${ICONS.plus()} Add slide</button>
      <input id="slide-file-input" type="file" accept="image/*" class="hidden" />
      ${primaryBtn({ action: "owner-save-branding", label: "Save banner slides", icon: `<span class="mr-1">${ICONS.save()}</span>`, extra: "w-full" })}
    </div>

    <div class="bg-panel border border-bd rounded-2xl p-4">
      <div class="flex items-center gap-2 mb-3.5">${ICONS.megaphone()}<div class="font-sora font-bold text-sm">Ads &amp; Layout</div></div>
      ${fieldWrap("Ads enabled", toggleHtml("ads.adsEnabled", ads.adsEnabled, "Ads are showing", "All ads hidden"))}
      ${fieldWrap("Home banner slider", toggleHtml("ads.bannerEnabled", ads.bannerEnabled, "Shown at top of Home", "Hidden"))}
      ${fieldWrap("Native ads in feed", toggleHtml("ads.nativeEnabled", ads.nativeEnabled, "Shown between maps", "Hidden"))}
      ${fieldWrap("Show every N maps", `<input id="ads-frequency" type="number" min="1" class="${inputCls}" value="${ads.nativeFrequency}" />`)}
      ${fieldWrap("Ad on map view page", toggleHtml("ads.postViewEnabled", ads.postViewEnabled, "Shown below description", "Hidden"))}
      ${fieldWrap("Map view ad type", `
        <div class="flex gap-2">
          <button data-action="set-postview-ad-type" data-id="image" class="flex-1 py-2 rounded-lg border font-inter text-xs font-semibold" style="border-color:${ads.postViewAdType === "image" ? "#3E8EFF" : "#232D48"};background:${ads.postViewAdType === "image" ? "rgba(62,142,255,.14)" : "transparent"};color:${ads.postViewAdType === "image" ? "#3E8EFF" : "#8A93AC"};">Image + Link</button>
          <button data-action="set-postview-ad-type" data-id="code" class="flex-1 py-2 rounded-lg border font-inter text-xs font-semibold" style="border-color:${ads.postViewAdType === "code" ? "#3E8EFF" : "#232D48"};background:${ads.postViewAdType === "code" ? "rgba(62,142,255,.14)" : "transparent"};color:${ads.postViewAdType === "code" ? "#3E8EFF" : "#8A93AC"};">AdSense / Monetag / Adsterra code</button>
        </div>
      `)}
      ${ads.postViewAdType === "image" ? `
        ${fieldWrap("Ad image", `
          <div class="flex gap-2">
            <input id="ads-pv-image" class="${inputCls} flex-1" value="${ads.postViewAdImage && ads.postViewAdImage.startsWith("data:") ? "(uploaded image)" : escAttr(ads.postViewAdImage)}" ${ads.postViewAdImage && ads.postViewAdImage.startsWith("data:") ? "readonly" : ""} placeholder="https://... or upload" />
            <button data-action="ads-upload-pv-image" class="rounded-lg border border-bd bg-panelalt flex items-center justify-center flex-shrink-0" style="width:44px;height:44px;">${ICONS.upload()}</button>
            <input id="ads-pv-image-file" type="file" accept="image/*" class="hidden" />
          </div>
        `)}
        ${fieldWrap("Ad link", `<input id="ads-pv-link" class="${inputCls}" value="${escAttr(ads.postViewAdLink)}" placeholder="https://..." />`)}
      ` : `
        ${fieldWrap("Ad network embed code", `<textarea id="ads-pv-code" class="${inputCls} font-mono" style="min-height:120px;" placeholder="Paste your AdSense / Monetag / Adsterra HTML or script snippet here">${esc(ads.postViewAdCode)}</textarea>`)}
        <div class="text-tfaint font-inter text-xs mb-3">Pasted as-is on the map view page — any &lt;script&gt; tags will run normally.</div>
      `}
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
  if (!brandingDraft) brandingDraft = JSON.parse(JSON.stringify(state.branding));
  const adsMap = { "ads-frequency": ["nativeFrequency", true], "ads-pv-image": ["postViewAdImage"], "ads-pv-link": ["postViewAdLink"], "ads-pv-code": ["postViewAdCode"] };
  Object.entries(adsMap).forEach(([id, [key, isNum]]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", (e) => { adsDraft[key] = isNum ? Math.max(1, parseInt(e.target.value) || 1) : e.target.value; });
  });
  const pvImgFile = document.getElementById("ads-pv-image-file");
  if (pvImgFile) {
    pvImgFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_BYTES) { showToast("Image too large — please pick something under 5MB.", "error"); return; }
      try { adsDraft.postViewAdImage = await fileToCompressedDataUrl(file); render(); }
      catch (err) { showToast("Couldn't read that image.", "error"); }
    });
  }
  const scMap = { "sc-about": "about", "sc-terms": "terms", "sc-dmca": "dmca" };
  Object.entries(scMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", (e) => { siteContentDraft[key] = e.target.value; });
  });
  const brandMap = { "brand-name": "siteName", "brand-logo": "logo", "brand-tagline": "footerTagline" };
  Object.entries(brandMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", (e) => { brandingDraft[key] = e.target.value; });
  });
  document.querySelectorAll(".soc-label").forEach((el) => el.addEventListener("input", (e) => { brandingDraft.socialLinks[+e.target.dataset.idx].label = e.target.value; }));
  document.querySelectorAll(".soc-url").forEach((el) => el.addEventListener("input", (e) => { brandingDraft.socialLinks[+e.target.dataset.idx].url = e.target.value; }));
  document.querySelectorAll(".soc-icon").forEach((el) => el.addEventListener("change", (e) => { brandingDraft.socialLinks[+e.target.dataset.idx].icon = e.target.value; }));
  document.querySelectorAll(".slide-link").forEach((el) => el.addEventListener("input", (e) => { brandingDraft.bannerSlides[+e.target.dataset.idx].link = e.target.value; }));
  const logoFile = document.getElementById("brand-logo-file");
  if (logoFile) {

    logoFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_BYTES) { showToast("Image too large — please pick something under 5MB.", "error"); return; }
      try { brandingDraft.logo = await fileToCompressedDataUrl(file); render(); }
      catch (err) { showToast("Couldn't read that image.", "error"); }
    });
  }
  const slideFile = document.getElementById("slide-file-input");
  if (slideFile) {
    slideFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file || activeSlideUploadIndex === null) return;
      if (file.size > MAX_IMAGE_BYTES) { showToast("Image too large — please pick something under 5MB.", "error"); return; }
      try {
        brandingDraft.bannerSlides[activeSlideUploadIndex].image = await fileToCompressedDataUrl(file);
        render();
      } catch (err) { showToast("Couldn't read that image.", "error"); }
    });
  }
}

/* ---------------------------------------------------------------- */
/*  OWNER SCREEN WRAPPER (left icon rail navigation)                  */
/* ---------------------------------------------------------------- */
function ownerScreenHtml() {
  const owner = state.session.account;
  const tab = state.ui.ownerTab;
  const pendingCount = state.posts.filter((p) => p.status === "pending").length;
  const rail = [
    { action: "set-owner-tab", id: "dashboard", label: "Dashboard", icon: ICONS.layoutDashboard(), active: tab === "dashboard" },
    { action: "set-owner-tab", id: "all", label: "Maps", icon: ICONS.list(), active: tab === "all" },
    { action: "set-owner-tab", id: "pending", label: "Pending", icon: ICONS.clock(), active: tab === "pending", badge: pendingCount },
    { action: "set-owner-tab", id: "admins", label: "Creators", icon: ICONS.users(), active: tab === "admins" },
    { action: "set-owner-tab", id: "profile", label: "Profile", icon: ICONS.userCircle(), active: tab === "profile" },
    { action: "set-owner-tab", id: "site", label: "Site", icon: ICONS.settings(), active: tab === "site" },
  ];
  const tabLabels = { dashboard: "Dashboard", all: "Maps", pending: "Pending", admins: "Creators", profile: "Profile", site: "Site" };
  let body = "";
  if (tab === "dashboard") body = ownerDashboardHtml();
  else if (tab === "all") body = ownerAllPostsHtml();
  else if (tab === "pending") body = ownerPendingHtml();
  else if (tab === "admins") body = ownerAdminsHtml();
  else if (tab === "profile") body = profileEditorHtml(profileEditorDraft || owner, true);
  else if (tab === "site") body = ownerSiteHtml();

  return `<div class="px-4 pt-4 pb-10">
    ${panelHeaderHtml("Owner Panel")}
    <div class="flex items-center gap-2 mb-4.5">
      <div class="font-inter text-xs text-tfaint">${esc(owner.name)} ·</div>
      <div class="font-sora font-semibold text-sm text-tprimary">${tabLabels[tab]}</div>
      ${pendingCount > 0 && tab !== "pending" ? `<span class="rounded-full bg-coral text-white flex items-center justify-center font-inter" style="min-width:16px;height:16px;font-size:10px;padding:0 4px;">${pendingCount}</span>` : ""}
    </div>
    <div>${body}</div>
  </div>
  ${panelSidebarDrawerHtml(rail)}`;
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
  const header = document.getElementById("site-header");
  if (header) {
    if (window.scrollY > 8) {
      header.style.background = "rgba(10,14,23,0.65)";
      header.style.backdropFilter = "blur(14px)";
      header.style.webkitBackdropFilter = "blur(14px)";
    } else {
      header.style.background = "#0A0E17";
      header.style.backdropFilter = "none";
      header.style.webkitBackdropFilter = "none";
    }
  }
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
  try { renderInner(); }
  catch (err) { showFatalError(err); }
}
function renderInner() {
  const { screen, param } = parseHash();
  const app = document.getElementById("app");

  // Force first-run owner setup if no owner account exists yet.
  if (state.accountsLoaded && !getOwner() && screen !== "bootstrapOwner") {
    app.innerHTML = bootstrapOwnerScreenHtml() + toastHtml();
    return;
  }

  let html = "";
  let showFooter = false;
  switch (screen) {
    case "home": html = feedScreen("home"); showFooter = true; break;
    case "favorites": html = feedScreen("favorites"); showFooter = true; break;
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
    default: html = feedScreen("home"); showFooter = true;
  }

  const page = `<div class="flex-1">${html}</div>${showFooter ? footerHtml() : ""}`;
  app.innerHTML = page + (state.ui.menuOpen ? menuSheetHtml() : "") + (state.ui.exploreOpen ? exploreScreenHtml() : "") + confirmModalHtml() + toastHtml() + scrollTopHtml();

  // Re-bind form inputs for whichever editor is currently visible.
  if (document.getElementById("post-editor")) bindPostEditorInputs();
  if (document.getElementById("pf-name")) bindProfileEditorInputs();
  if (document.getElementById("ads-frequency") || document.getElementById("sc-about")) bindOwnerSiteInputs();
  if (document.getElementById("explore-search")) bindExploreInputs();
  const adSlotEl = document.getElementById("postview-ad-slot");
  if (adSlotEl && state.adSettings.postViewAdType === "code" && state.adSettings.postViewAdCode) {
    injectAdCode(adSlotEl, state.adSettings.postViewAdCode);
  }
  const scrollBtn = document.getElementById("scroll-top-btn");
  if (scrollBtn) scrollBtn.classList.toggle("hidden", window.scrollY <= 420);
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
/*  ACTION HANDLERS                                                   */
/* ---------------------------------------------------------------- */
async function handleCopyMapCode(code) {
  if (!code) { showToast("No map code added yet.", "error"); return; }
  const ok = await copyToClipboard(code);
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
  postEditorDraft.codes = getPostCodes(post).map((c) => ({ ...c }));
  if (postEditorDraft.codes.length === 0) postEditorDraft.codes.push({ id: "c" + Date.now(), title: "", code: "" });
  postEditorDraft.links = getPostLinks(post).map((l) => ({ ...l }));
  delete postEditorDraft.mapCode;
  delete postEditorDraft.previewVideoUrl;
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
    showToast("Creator added.");
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
    showToast(ok ? "Creator removed." : "Couldn't remove — try again.", ok ? "success" : "error");
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
async function ownerSaveBranding() {
  const ok = await fsSaveBranding(brandingDraft || state.branding);
  showToast(ok ? "Branding saved." : "Couldn't save — try again.", ok ? "success" : "error");
  brandingDraft = null;
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
    state.ui.ownerTab = "dashboard";
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
    case "nav": state.ui.menuOpen = false; state.ui.exploreOpen = false; state.ui.panelSidebarOpen = false; navigate(id); render(); break;
    case "open-menu": state.ui.menuOpen = true; render(); break;
    case "close-menu": state.ui.menuOpen = false; render(); break;
    case "toggle-panel-sidebar": state.ui.panelSidebarOpen = !state.ui.panelSidebarOpen; render(); break;
    case "close-panel-sidebar": state.ui.panelSidebarOpen = false; render(); break;
    case "open-explore": exploreQuery = ""; exploreCategory = null; state.ui.exploreOpen = true; render(); break;
    case "open-notifications": showToast("No new notifications yet."); break;
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

    case "set-admin-tab": state.ui.adminTab = id; state.ui.panelSidebarOpen = false; render(); break;
    case "admin-new-post": startNewPost("admin"); break;
    case "admin-edit-post": startEditPost(id, "admin"); break;
    case "admin-delete-post": deletePost(id); break;
    case "admin-toggle-hide": toggleHidePost(id); break;

    case "set-owner-tab": state.ui.ownerTab = id; state.ui.panelSidebarOpen = false; adsDraft = null; siteContentDraft = null; brandingDraft = null; render(); break;
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
    case "owner-save-branding": ownerSaveBranding(); break;
    case "brand-upload-logo": document.getElementById("brand-logo-file")?.click(); break;
    case "set-category-mode":
      if (!brandingDraft) brandingDraft = JSON.parse(JSON.stringify(state.branding));
      brandingDraft.categoryMode = id;
      render();
      break;
    case "toggle-selected-category": {
      if (!brandingDraft) brandingDraft = JSON.parse(JSON.stringify(state.branding));
      const list = brandingDraft.selectedCategories;
      const idx = list.indexOf(id);
      if (idx >= 0) list.splice(idx, 1); else list.push(id);
      render();
      break;
    }
    case "brand-add-social":
      if (!brandingDraft) brandingDraft = JSON.parse(JSON.stringify(state.branding));
      brandingDraft.socialLinks.push({ id: "s" + Date.now(), label: "", url: "", icon: "other", enabled: true });
      render();
      break;
    case "brand-remove-social":
      if (brandingDraft) { brandingDraft.socialLinks.splice(+id, 1); render(); }
      break;
    case "brand-add-slide":
      if (!brandingDraft) brandingDraft = JSON.parse(JSON.stringify(state.branding));
      brandingDraft.bannerSlides.push({ id: "b" + Date.now(), image: "", link: "" });
      render();
      break;
    case "brand-remove-slide":
      if (brandingDraft) { brandingDraft.bannerSlides.splice(+id, 1); render(); }
      break;
    case "brand-upload-slide":
      activeSlideUploadIndex = +id;
      document.getElementById("slide-file-input")?.click();
      break;
    case "ads-upload-pv-image": document.getElementById("ads-pv-image-file")?.click(); break;
    case "set-postview-ad-type":
      if (!adsDraft) adsDraft = { ...state.adSettings };
      adsDraft.postViewAdType = id;
      render();
      break;

    case "pe-pick-category": if (postEditorDraft) { postEditorDraft.category = id; render(); } break;
    case "pe-add-code": if (postEditorDraft) { postEditorDraft.codes.push({ id: "c" + Date.now(), title: "", code: "" }); render(); } break;
    case "pe-remove-code": if (postEditorDraft) { postEditorDraft.codes.splice(+id, 1); render(); } break;
    case "pe-add-link": if (postEditorDraft) { postEditorDraft.links.push({ id: "l" + Date.now(), title: "", url: "" }); render(); } break;
    case "pe-remove-link": if (postEditorDraft) { postEditorDraft.links.splice(+id, 1); render(); } break;
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
      } else if (id === "social-enabled") {
        if (!brandingDraft) brandingDraft = JSON.parse(JSON.stringify(state.branding));
        brandingDraft.socialEnabled = !checked;
      } else if (id.startsWith("social.")) {
        if (!brandingDraft) brandingDraft = JSON.parse(JSON.stringify(state.branding));
        const idx = +id.slice(7);
        brandingDraft.socialLinks[idx].enabled = !checked;
      }
      render();
      break;
    }

    case "bootstrap-owner": bootstrapOwner(); break;
    case "owner-login": ownerLogin(); break;
    case "admin-login": adminLogin(); break;
    case "forgot-password": forgotPassword(id); break;
    case "logout": logout(); break;

    case "toggle-password": {
      const input = document.getElementById(id);
      if (input) {
        const showing = input.type === "text";
        input.type = showing ? "password" : "text";
        el.innerHTML = showing ? ICONS.eye() : ICONS.eyeOff();
      }
      break;
    }
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
function showFatalError(err) {
  console.error(err);
  const app = document.getElementById("app");
  if (!app) return;
  const msg = (err && err.message) || String(err);
  const stack = (err && err.stack) || "";
  app.innerHTML = `<div style="padding:24px;font-family:monospace;font-size:12px;color:#FF9B9B;background:#1a0e0e;min-height:100vh;white-space:pre-wrap;word-break:break-word;">
    <div style="font-family:sans-serif;font-weight:700;font-size:15px;color:#fff;margin-bottom:10px;">⚠️ CraftVerse hit an error</div>
    <div style="color:#FFD3D3;margin-bottom:10px;">${msg.replace(/</g, "&lt;")}</div>
    <div style="opacity:.6;font-size:10px;">${stack.replace(/</g, "&lt;")}</div>
  </div>`;
}
window.addEventListener("error", (e) => showFatalError(e.error || e.message));
window.addEventListener("unhandledrejection", (e) => showFatalError(e.reason));

try {
  render();
} catch (err) {
  showFatalError(err);
}
