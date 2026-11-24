// Configuración de Firebase para Numi (proyecto numi-b3d93).
// Estos datos no son secretos: identifican el proyecto. La seguridad la dan las reglas de Firestore (firestore.rules).
export const firebaseConfig = {
  apiKey: "AIzaSyDmn9EpMegqHUOBKfmCCruTrBi8zOmWUXU",
  authDomain: "numi-b3d93.firebaseapp.com",
  projectId: "numi-b3d93",
  storageBucket: "numi-b3d93.firebasestorage.app",
  messagingSenderId: "556837617529",
  appId: "1:556837617529:web:b46dc65216f357eaf479a8"
};

// Dominio interno para las cuentas de las niñas (entran solo con usuario y dibujitos).
export const STUDENT_DOMAIN = "estudiantes.numi.app";

// Clave del sitio de reCAPTCHA (es pública). La usa App Check para que Gemini lea la foto de la lista.
// RECAPTCHA_ENTERPRISE: true si la clave es de reCAPTCHA Enterprise; false si es reCAPTCHA v3.
export const RECAPTCHA_SITE_KEY = '';
export const RECAPTCHA_ENTERPRISE = true;
