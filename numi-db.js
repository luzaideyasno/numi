// Numi — capa de datos con Firebase (Authentication + Firestore).
// La usan el juego (index.html) y el panel docente (docente.html).
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword,
  sendPasswordResetEmail, updatePassword, deleteUser } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, getDocs, setDoc,
  updateDoc, deleteDoc, addDoc, collection, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import { firebaseConfig, STUDENT_DOMAIN, RECAPTCHA_SITE_KEY } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'es'; // correos de Firebase en español
let db;
try { db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { db = initializeFirestore(app, {}); }

let appCheckOn = false;
const PICS = ['estrella', 'corazon', 'luna', 'sol', 'flor', 'nube'];
const studentEmail = (user, year) => `${user}.${year}@${STUDENT_DOMAIN}`;
const studentPass = (pics, year) => `numi-${pics.map(p => PICS.indexOf(p)).join('')}-${year}`;
const list = s => s.docs.map(d => ({ id: d.id, ...d.data() }));
const byCourse = async (col, courseId) => list(await getDocs(query(collection(db, col), where('courseId', '==', courseId))));
// Una app secundaria permite crear cuentas (profesores, niñas) sin cerrar la sesión de quien las crea.
const secondary = () => initializeApp(firebaseConfig, 'sec-' + Date.now() + '-' + Math.random().toString(36).slice(2));
const BAD_LOGIN = ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/invalid-login-credentials', 'auth/invalid-email'];

function message(e) {
  const code = e && e.code || '';
  const m = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a intentar.',
    'auth/network-request-failed': 'Sin conexión a internet. Revisa la red e inténtalo de nuevo.',
    'auth/email-already-in-use': 'Ese correo ya tiene una cuenta en Numi.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/weak-password': 'La contraseña es muy corta.',
    'auth/operation-not-allowed': 'Falta activar "Correo electrónico/contraseña" en Firebase Authentication.',
    'permission-denied': 'No tienes permiso para hacer esto. Revisa las reglas de Firestore o los accesos del profesor.',
    'unavailable': 'Sin conexión con el servidor. Los cambios se guardarán cuando vuelva internet.'
  };
  return m[code] || (e && e.message) || 'Ocurrió un error.';
}

export const NumiDB = {
  PICS, message,
  onAuth: cb => onAuthStateChanged(auth, cb),
  user: () => auth.currentUser,
  logout: () => signOut(auth),

  /* ---------- personal del colegio ---------- */
  // Primera vez: crear la cuenta de coordinación (solo funciona si todavía no existe)
  async setupDone() { try { return (await getDoc(doc(db, 'config', 'setup'))).exists(); } catch (e) { return true; } },
  async setupAdmin({ name, email, pw }) {
    const c = await createUserWithEmailAndPassword(auth, email.trim(), pw);
    const b = writeBatch(db);
    b.set(doc(db, 'users', c.user.uid), { role: 'admin', name, email: email.trim(), access: [], created: Date.now() });
    b.set(doc(db, 'config', 'setup'), { by: c.user.uid, t: Date.now() });
    await b.commit();
  },
  staffLogin: (email, pw) => signInWithEmailAndPassword(auth, email.trim(), pw),
  resetPassword: email => sendPasswordResetEmail(auth, email.trim()),
  async me() {
    const u = auth.currentUser; if (!u) return null;
    const s = await getDoc(doc(db, 'users', u.uid));
    return s.exists() ? { uid: u.uid, ...s.data() } : null;
  },
  async courses(me) {
    if (me.role === 'admin') return list(await getDocs(collection(db, 'courses')));
    const out = [];
    for (const id of me.access || []) { const s = await getDoc(doc(db, 'courses', id)); if (s.exists()) out.push({ id: s.id, ...s.data() }); }
    return out;
  },
  createCourse: d => addDoc(collection(db, 'courses'), { ...d, created: Date.now() }).then(r => r.id),
  updateCourse: (id, d) => updateDoc(doc(db, 'courses', id), d),
  deleteCourse: id => deleteDoc(doc(db, 'courses', id)),
  async staff() { return list(await getDocs(collection(db, 'users'))); },
  setAccess: (uid, access) => updateDoc(doc(db, 'users', uid), { access }),
  updateStaff: (uid, d) => updateDoc(doc(db, 'users', uid), d),
  // Quita el acceso del profesor al panel (su cuenta de acceso queda en Authentication sin permisos)
  deleteStaff: uid => deleteDoc(doc(db, 'users', uid)),
  // Crea al profesor con una clave temporal (se la comparte la coordinación); al entrar, el panel le pide cambiarla
  async createTeacher({ name, email, access, phone }) {
    const sec = secondary();
    try {
      const words = ['sol', 'luna', 'flor', 'nube', 'mar', 'rio', 'arcoiris', 'estrella'];
      const n = crypto.getRandomValues(new Uint32Array(2));
      const pw = `Numi-${1000 + (n[0] % 9000)}-${words[n[1] % words.length]}`;
      const c = await createUserWithEmailAndPassword(getAuth(sec), email.trim(), pw);
      await setDoc(doc(db, 'users', c.user.uid), { role: 'teacher', name, email: email.trim(), phone: phone || '', access, mustChange: true, created: Date.now() });
      return { uid: c.user.uid, pw };
    } finally { await deleteApp(sec); }
  },
  async changeMyPassword(pw) {
    const u = auth.currentUser;
    await updatePassword(u, pw);
    await updateDoc(doc(db, 'users', u.uid), { mustChange: false });
  },

  students: courseId => byCourse('students', courseId),
  results: courseId => byCourse('results', courseId),
  tasks: courseId => byCourse('tasks', courseId),
  notes: courseId => byCourse('notes', courseId),
  async createStudent(courseId, year, { name, user, pics }) {
    const sec = secondary();
    try {
      const a = getAuth(sec); let u = user, n = 1, cred;
      for (;;) {
        try { cred = await createUserWithEmailAndPassword(a, studentEmail(u, year), studentPass(pics, year)); break; }
        catch (e) { if (e.code === 'auth/email-already-in-use' && n < 40) { n++; u = user + n; continue; } throw e; }
      }
      const data = { name, user: u, pics, courseId, year, created: Date.now() };
      await setDoc(doc(db, 'students', cred.user.uid), data);
      return { id: cred.user.uid, ...data };
    } finally { await deleteApp(sec); }
  },
  async changeStudentPics(st, pics) {
    const sec = secondary();
    try {
      const c = await signInWithEmailAndPassword(getAuth(sec), studentEmail(st.user, st.year), studentPass(st.pics, st.year));
      await updatePassword(c.user, studentPass(pics, st.year));
      await updateDoc(doc(db, 'students', st.id), { pics });
    } finally { await deleteApp(sec); }
  },
  updateStudent: (id, d) => updateDoc(doc(db, 'students', id), d),
  // Lee los nombres de una foto de la lista con Gemini (Firebase AI Logic). Devuelve ["Nombres Apellidos", ...]
  async readNameList(blob) {
    const { getAI, getGenerativeModel, GoogleAIBackend } = await import("https://www.gstatic.com/firebasejs/13.4.0/firebase-ai.js");
    // Firebase exige App Check para usar Gemini: se activa solo aquí (no afecta el juego de las niñas)
    if (!RECAPTCHA_SITE_KEY) throw new Error('Falta la clave de reCAPTCHA (App Check) en firebase-config.js');
    if (!appCheckOn) {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import("https://www.gstatic.com/firebasejs/13.4.0/firebase-app-check.js");
      initializeAppCheck(app, { provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: false });
      appCheckOn = true;
    }
    const ai = getAI(app, { backend: new GoogleAIBackend(), useLimitedUseAppCheckTokens: true });
    const data = await new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = ko; r.readAsDataURL(blob); });
    const prompt = 'Esta es una foto de la lista de estudiantes de un salón de un colegio colombiano. ' +
      'Extrae SOLO los nombres completos de las estudiantes, en el mismo orden de la lista. ' +
      'Estas listas suelen estar escritas como APELLIDOS NOMBRES (primero los dos apellidos): devuelve cada una como "Nombres Apellidos", ' +
      'con mayúscula inicial y las tildes tal como aparecen. Ignora números, encabezados, firmas, chulitos y letras sueltas como "N". ' +
      'Responde solo con JSON así: {"nombres":["María Camila Angucho Daza"]}';
    let last; const errs = [];
    for (const model of ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']) {
      try {
        const m = getGenerativeModel(ai, { model, generationConfig: { responseMimeType: 'application/json', temperature: 0 } });
        const res = await m.generateContent([prompt, { inlineData: { mimeType: blob.type || 'image/jpeg', data } }]);
        const j = JSON.parse(res.response.text().replace(/^```json|```$/g, '').trim());
        if (Array.isArray(j.nombres)) return j.nombres.map(n => String(n).trim()).filter(Boolean);
      } catch (e) {
        last = e; errs.push(model + ': ' + String(e && (e.message || e.code) || e));
        // Si es un problema de la clave o de activación, los otros modelos fallarán igual
        if (/api.?key|referer|SERVICE_DISABLED|has not been used|Failed to fetch/i.test(String(e && e.message))) break;
      }
    }
    const err = new Error(errs.join(' | ') || 'No se pudo leer la lista'); err.cause = last; throw err;
  },
  deleteStudent: id => deleteDoc(doc(db, 'students', id)),
  // Elimina del todo a una estudiante que se retira: su cuenta de ingreso, sus resultados, sus notas y su ficha.
  // Así ya no puede entrar, no cuenta en los promedios y, si se vuelve a agregar, recupera el mismo usuario.
  async removeStudent(st) {
    const out = { account: false, results: 0, resultsBlocked: false };
    // 1) Cuenta de ingreso: se entra como ella en una app secundaria (la clave sale de sus dibujitos) y se borra
    const sec = secondary();
    try {
      const c = await signInWithEmailAndPassword(getAuth(sec), studentEmail(st.user, st.year), studentPass(st.pics, st.year));
      await deleteUser(c.user); out.account = true;
    } catch (e) { if (!BAD_LOGIN.includes(e.code)) throw e; } // ya no existía: se sigue
    finally { await deleteApp(sec); }
    // 2) Resultados de sus retos
    try {
      const rs = await getDocs(query(collection(db, 'results'), where('courseId', '==', st.courseId), where('studentUid', '==', st.id)));
      for (let i = 0; i < rs.docs.length; i += 400) {
        const b = writeBatch(db); rs.docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit();
      }
      out.results = rs.size;
    } catch (e) { if (e.code === 'permission-denied') out.resultsBlocked = true; else throw e; }
    // 3) Notas ajustadas y observaciones (puede que no tenga)
    try { await deleteDoc(doc(db, 'notes', st.id)); } catch (e) { if (e.code !== 'permission-denied' && e.code !== 'not-found') throw e; }
    // 4) Ficha de la estudiante
    await deleteDoc(doc(db, 'students', st.id));
    return out;
  },
  createTask: d => addDoc(collection(db, 'tasks'), d).then(r => r.id),
  deleteTask: id => deleteDoc(doc(db, 'tasks', id)),
  async scale(courseId) { const s = await getDoc(doc(db, 'settings', courseId)); return s.exists() ? s.data() : null; },
  setScale: (courseId, sc) => setDoc(doc(db, 'settings', courseId), sc),
  setNote: (studentId, courseId, data) => setDoc(doc(db, 'notes', studentId), { courseId, ...data }),

  /* ---------- niñas (juego) ---------- */
  async studentLogin(user, pics) {
    const u = user.trim().toLowerCase().replace(/\s+/g, ''), y = new Date().getFullYear();
    let last;
    for (const yr of [y, y + 1, y - 1]) {
      try { return await signInWithEmailAndPassword(auth, studentEmail(u, yr), studentPass(pics, yr)); }
      catch (e) { last = e; if (!BAD_LOGIN.includes(e.code)) throw e; }
    }
    throw last;
  },
  async myStudent() {
    const u = auth.currentUser; if (!u) return null;
    const s = await getDoc(doc(db, 'students', u.uid)); if (!s.exists()) return null;
    const st = { id: u.uid, ...s.data() };
    const c = await getDoc(doc(db, 'courses', st.courseId));
    st.course = c.exists() ? { id: c.id, ...c.data() } : null;
    return st;
  },
  async myResults() { return list(await getDocs(query(collection(db, 'results'), where('studentUid', '==', auth.currentUser.uid)))); },
  saveResult: r => addDoc(collection(db, 'results'), { ...r, studentUid: auth.currentUser.uid, t: Date.now() }),
  saveWardrobe: w => updateDoc(doc(db, 'students', auth.currentUser.uid), { wardrobe: w }),
  myTasks: courseId => byCourse('tasks', courseId)
};

window.NumiDB = NumiDB;
window.dispatchEvent(new Event('numidb'));
