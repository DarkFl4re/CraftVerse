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

const ICONS = {
  heart: (f) => svgIcon(`<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" ${f ? 'fill="currentColor"' : ""}/>`),
  search: () => svgIcon(`<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>`),
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
  shieldCheck: () => svgIcon(`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>`),
  userCog: () => svgIcon(`<path d="M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z"/><path d="M8 15H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>`),
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

  instagram: () => brandIcon(`<path d="M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z"/>`),
  telegram: () => brandIcon(`<path d="M320 72C183 72 72 183 72 320C72 457 183 568 320 568C457 568 568 457 568 320C568 183 457 72 320 72zM435 240.7C431.3 279.9 415.1 375.1 406.9 419C403.4 437.6 396.6 443.8 390 444.4C375.6 445.7 364.7 434.9 350.7 425.7C328.9 411.4 316.5 402.5 295.4 388.5C270.9 372.4 286.8 363.5 300.7 349C304.4 345.2 367.8 287.5 369 282.3C369.2 281.6 369.3 279.2 367.8 277.9C366.3 276.6 364.2 277.1 362.7 277.4C360.5 277.9 325.6 300.9 258.1 346.5C248.2 353.3 239.2 356.6 231.2 356.4C222.3 356.2 205.3 351.4 192.6 347.3C177.1 342.3 164.7 339.6 165.8 331C166.4 326.5 172.5 322 184.2 317.3C256.5 285.8 304.7 265 328.8 255C397.7 226.4 412 221.4 421.3 221.2C423.4 221.2 427.9 221.7 430.9 224.1C432.9 225.8 434.1 228.2 434.4 230.8C434.9 234 435 237.3 434.8 240.6z"/>`),
  discord: () => brandIcon(`<path d="M524.5 133.8C524.3 133.5 524.1 133.2 523.7 133.1C485.6 115.6 445.3 103.1 404 96C403.6 95.9 403.2 96 402.9 96.1C402.6 96.2 402.3 96.5 402.1 96.9C396.6 106.8 391.6 117.1 387.2 127.5C342.6 120.7 297.3 120.7 252.8 127.5C248.3 117 243.3 106.8 237.7 96.9C237.5 96.6 237.2 96.3 236.9 96.1C236.6 95.9 236.2 95.9 235.8 95.9C194.5 103 154.2 115.5 116.1 133C115.8 133.1 115.5 133.4 115.3 133.7C39.1 247.5 18.2 358.6 28.4 468.2C28.4 468.5 28.5 468.7 28.6 469C28.7 469.3 28.9 469.4 29.1 469.6C73.5 502.5 123.1 527.6 175.9 543.8C176.3 543.9 176.7 543.9 177 543.8C177.3 543.7 177.7 543.4 177.9 543.1C189.2 527.7 199.3 511.3 207.9 494.3C208 494.1 208.1 493.8 208.1 493.5C208.1 493.2 208.1 493 208 492.7C207.9 492.4 207.8 492.2 207.6 492.1C207.4 492 207.2 491.8 206.9 491.7C191.1 485.6 175.7 478.3 161 469.8C160.7 469.6 160.5 469.4 160.3 469.2C160.1 469 160 468.6 160 468.3C160 468 160 467.7 160.2 467.4C160.4 467.1 160.5 466.9 160.8 466.7C163.9 464.4 167 462 169.9 459.6C170.2 459.4 170.5 459.2 170.8 459.2C171.1 459.2 171.5 459.2 171.8 459.3C268 503.2 372.2 503.2 467.3 459.3C467.6 459.2 468 459.1 468.3 459.1C468.6 459.1 469 459.3 469.2 459.5C472.1 461.9 475.2 464.4 478.3 466.7C478.5 466.9 478.7 467.1 478.9 467.4C479.1 467.7 479.1 468 479.1 468.3C479.1 468.6 479 468.9 478.8 469.2C478.6 469.5 478.4 469.7 478.2 469.8C463.5 478.4 448.2 485.7 432.3 491.6C432.1 491.7 431.8 491.8 431.6 492C431.4 492.2 431.3 492.4 431.2 492.7C431.1 493 431.1 493.2 431.1 493.5C431.1 493.8 431.2 494 431.3 494.3C440.1 511.3 450.1 527.6 461.3 543.1C461.5 543.4 461.9 543.7 462.2 543.8C462.5 543.9 463 543.9 463.3 543.8C516.2 527.6 565.9 502.5 610.4 469.6C610.6 469.4 610.8 469.2 610.9 469C611 468.8 611.1 468.5 611.1 468.2C623.4 341.4 590.6 231.3 524.2 133.7zM222.5 401.5C193.5 401.5 169.7 374.9 169.7 342.3C169.7 309.7 193.1 283.1 222.5 283.1C252.2 283.1 275.8 309.9 275.3 342.3C275.3 375 251.9 401.5 222.5 401.5zM417.9 401.5C388.9 401.5 365.1 374.9 365.1 342.3C365.1 309.7 388.5 283.1 417.9 283.1C447.6 283.1 471.2 309.9 470.7 342.3C470.7 375 447.5 401.5 417.9 401.5z"/>`),
  facebook: () => brandIcon(`<path d="M576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 440 146.7 540.8 258.2 568.5L258.2 398.2L205.4 398.2L205.4 320L258.2 320L258.2 286.3C258.2 199.2 297.6 158.8 383.2 158.8C399.4 158.8 427.4 162 438.9 165.2L438.9 236C432.9 235.4 422.4 235 409.3 235C367.3 235 351.1 250.9 351.1 292.2L351.1 320L434.7 320L420.3 398.2L351 398.2L351 574.1C477.8 558.8 576 450.9 576 320z"/>`),
  tiktok: () => brandIcon(`<path d="M544.5 273.9C500.5 274 457.5 260.3 421.7 234.7L421.7 413.4C421.7 446.5 411.6 478.8 392.7 506C373.8 533.2 347.1 554 316.1 565.6C285.1 577.2 251.3 579.1 219.2 570.9C187.1 562.7 158.3 545 136.5 520.1C114.7 495.2 101.2 464.1 97.5 431.2C93.8 398.3 100.4 365.1 116.1 336C131.8 306.9 156.1 283.3 185.7 268.3C215.3 253.3 248.6 247.8 281.4 252.3L281.4 342.2C266.4 337.5 250.3 337.6 235.4 342.6C220.5 347.6 207.5 357.2 198.4 369.9C189.3 382.6 184.4 398 184.5 413.8C184.6 429.6 189.7 444.8 199 457.5C208.3 470.2 221.4 479.6 236.4 484.4C251.4 489.2 267.5 489.2 282.4 484.3C297.3 479.4 310.4 469.9 319.6 457.2C328.8 444.5 333.8 429.1 333.8 413.4L333.8 64L421.8 64C421.7 71.4 422.4 78.9 423.7 86.2C426.8 102.5 433.1 118.1 442.4 131.9C451.7 145.7 463.7 157.5 477.6 166.5C497.5 179.6 520.8 186.6 544.6 186.6L544.6 274z"/>`),
  youtube: () => brandIcon(`<path d="M581.7 188.1C575.5 164.4 556.9 145.8 533.4 139.5C490.9 128 320.1 128 320.1 128C320.1 128 149.3 128 106.7 139.5C83.2 145.8 64.7 164.4 58.4 188.1C47 231 47 320.4 47 320.4C47 320.4 47 409.8 58.4 452.7C64.7 476.3 83.2 494.2 106.7 500.5C149.3 512 320.1 512 320.1 512C320.1 512 490.9 512 533.5 500.5C557 494.2 575.5 476.3 581.8 452.7C593.2 409.8 593.2 320.4 593.2 320.4C593.2 320.4 593.2 231 581.8 188.1zM264.2 401.6L264.2 239.2L406.9 320.4L264.2 401.6z"/>`),
  twitter: () => brandIcon(`<path d="M523.4 215.7C523.7 220.2 523.7 224.8 523.7 229.3C523.7 368 418.1 527.9 225.1 527.9C165.6 527.9 110.4 510.7 64 480.8C72.4 481.8 80.6 482.1 89.3 482.1C138.4 482.1 183.5 465.5 219.6 437.3C173.5 436.3 134.8 406.1 121.5 364.5C128 365.5 134.5 366.1 141.3 366.1C150.7 366.1 160.1 364.8 168.9 362.5C120.8 352.8 84.8 310.5 84.8 259.5L84.8 258.2C98.8 266 115 270.9 132.2 271.5C103.9 252.7 85.4 220.5 85.4 184.1C85.4 164.6 90.6 146.7 99.7 131.1C151.4 194.8 229 236.4 316.1 240.9C314.5 233.1 313.5 225 313.5 216.9C313.5 159.1 360.3 112 418.4 112C448.6 112 475.9 124.7 495.1 145.1C518.8 140.6 541.6 131.8 561.7 119.8C553.9 144.2 537.3 164.6 515.6 177.6C536.7 175.3 557.2 169.5 576 161.4C561.7 182.2 543.8 200.7 523.4 215.7z"/>`),
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

const DEFAULT_BRANDING = {
  siteName: "CraftVerse",
  logo: "",
  footerTagline: "Craftland map codes, previews & tutorials from the community.",
  categoryMode: "all", // 'all' | 'selected'
  selectedCategories: [],
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
function siteLogoHtml(size = 36) {
  const b = state.branding;
  if (b.logo) return `<img src="${escAttr(b.logo)}" alt="${escAttr(b.siteName)}" class="rounded-xl object-cover flex-shrink-0" style="width:${size}px;height:${size}px;" />`;
  const letter = b.siteName ? b.siteName.trim()[0].toUpperCase() : "C";
  return `<div class="rounded-xl flex items-center justify-center font-sora font-extrabold text-white flex-shrink-0" style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#3E8EFF,#7C5CFF);font-size:${size * 0.5}px;">${letter}</div>`;
}
function homeHeaderHtml() {
  return `<div class="sticky top-0 z-20 bg-bgdeep pb-1">
    <div class="flex items-center gap-2.5 px-4 pt-4 pb-2.5">
      ${siteLogoHtml(36)}
      <div class="font-sora font-bold text-lg">${esc(state.branding.siteName)}</div>
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
  return `<div data-action="close-menu" class="fixed inset-0 z-50" style="background:rgba(0,0,0,0.5);">
    <div class="max-w-[480px] h-full mx-auto relative">
      <div data-action="noop" class="absolute bg-panel border border-bd rounded-2xl overflow-hidden shadow-2xl min-w-[190px]" style="top:68px;right:16px;">
        ${items.map(([label, key], i) => `<button data-action="nav" data-id="${key}" class="w-full text-left px-4 py-3 font-inter text-sm ${i < items.length - 1 ? "border-b border-bd" : ""}">${label}</button>`).join("")}
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
  const owner = getOwner();
  const b = state.branding;
  const socials = (owner && owner.links ? owner.links : []).slice(0, 5);
  return `<div class="mt-2 bg-panel border-t border-bd rounded-t-[20px] px-5 pt-6 pb-5 flex flex-col items-center gap-3.5">
    <div class="flex items-center gap-2">
      ${siteLogoHtml(28)}
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
  if (mode === "home" && visible.length > 0 && adsOn && state.adSettings.bannerEnabled) html += adSlot("banner");
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
    html += `<a href="${escAttr(l.url || "#")}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 bg-panel border border-bd rounded-2xl px-3.5 py-3 no-underline">
      <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background:linear-gradient(135deg,#FF5D6C,#FF9B5D);">${ICONS.externalLink()}</div>
      <div class="flex-1 font-sora font-semibold text-sm text-tprimary">${esc(l.title || "Watch link")}</div>
      ${ICONS.externalLink()}
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
  return { id: "p" + Date.now(), title: "", category: "", description: "", thumbnail: "", codes: [{ id: "c" + Date.now(), title: "", code: "" }], links: [], authorId, status, hidden: false };
}
let postEditorDraft = null;
let postEditorMode = null; // 'admin' | 'owner'

function codeRowHtml(entry, idx) {
  return `<div class="bg-bgdeep border border-bd rounded-lg p-3 mb-2.5" data-code-idx="${idx}">
    <div class="flex gap-2 mb-2">
      <input class="${inputCls} flex-1 pe-code-title" data-idx="${idx}" value="${escAttr(entry.title)}" placeholder="Name e.g. 13 vs 13 (India)" />
      <button data-action="pe-remove-code" data-id="${idx}" class="rounded-lg border border-bd bg-coral/15 flex items-center justify-center" style="width:40px;">${ICONS.trash()}</button>
    </div>
    <input class="${inputCls} font-mono pe-code-value" data-idx="${idx}" value="${escAttr(entry.code)}" placeholder="e.g. 123-456-789" />
  </div>`;
}
function linkRowHtmlForPost(entry, idx) {
  return `<div class="bg-bgdeep border border-bd rounded-lg p-3 mb-2.5" data-link-idx="${idx}">
    <div class="flex gap-2 mb-2">
      <input class="${inputCls} flex-1 pe-link-title" data-idx="${idx}" value="${escAttr(entry.title)}" placeholder="Name e.g. Watch on YouTube" />
      <button data-action="pe-remove-link" data-id="${idx}" class="rounded-lg border border-bd bg-coral/15 flex items-center justify-center" style="width:40px;">${ICONS.trash()}</button>
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
    ${panelHeaderHtml("Admin Panel")}
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
            ${iconBtn({ action: "admin-delete-post", id: post.id, size: 36, extra: "bg-coral/15", icon: ICONS.trash() })}
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

  if (!(postEditorMode === "owner" && postEditorDraft)) {
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
  if (!brandingDraft) brandingDraft = JSON.parse(JSON.stringify(state.branding));
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
  const brandMap = { "brand-name": "siteName", "brand-logo": "logo", "brand-tagline": "footerTagline" };
  Object.entries(brandMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", (e) => { brandingDraft[key] = e.target.value; });
  });
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
}

/* ---------------------------------------------------------------- */
/*  OWNER SCREEN WRAPPER (left icon rail navigation)                  */
/* ---------------------------------------------------------------- */
function ownerScreenHtml() {
  const owner = state.session.account;
  const tab = state.ui.ownerTab;
  const pendingCount = state.posts.filter((p) => p.status === "pending").length;
  const rail = [
    { action: "set-owner-tab", id: "dashboard", label: "Home", icon: ICONS.layoutDashboard(), active: tab === "dashboard" },
    { action: "set-owner-tab", id: "all", label: "Maps", icon: ICONS.list(), active: tab === "all" },
    { action: "set-owner-tab", id: "pending", label: "Pending", icon: ICONS.clock(), active: tab === "pending", badge: pendingCount },
    { action: "set-owner-tab", id: "admins", label: "Admins", icon: ICONS.users(), active: tab === "admins" },
    { action: "set-owner-tab", id: "profile", label: "Profile", icon: ICONS.userCircle(), active: tab === "profile" },
    { action: "set-owner-tab", id: "site", label: "Site", icon: ICONS.settings(), active: tab === "site" },
  ];
  const tabLabels = { dashboard: "Dashboard", all: "Maps", pending: "Pending", admins: "Admins", profile: "Profile", site: "Site" };
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
