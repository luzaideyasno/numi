// Publica firestore.rules en Firebase con la clave de la cuenta de servicio.
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';

const PROYECTO = 'numi-b3d93';
const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!raw || !raw.trim()) {
  console.error('Falta el secreto FIREBASE_SERVICE_ACCOUNT en GitHub (Settings → Secrets and variables → Actions).');
  process.exit(1);
}

let cuenta;
try {
  cuenta = JSON.parse(raw);
} catch {
  console.error('El secreto FIREBASE_SERVICE_ACCOUNT no es un JSON válido. Vuelve a pegar el archivo completo, desde { hasta }.');
  process.exit(1);
}

if (cuenta.project_id !== PROYECTO) {
  console.error(`La clave es del proyecto "${cuenta.project_id}", pero Numi usa "${PROYECTO}".`);
  process.exit(1);
}

initializeApp({ credential: cert(cuenta), projectId: PROYECTO });

const reglas = readFileSync('firestore.rules', 'utf8');
const rules = getSecurityRules();

try {
  const ruleset = await rules.releaseFirestoreRulesetFromSource(reglas);
  console.log(`Reglas publicadas en ${PROYECTO}: ${ruleset.name} (${ruleset.createTime})`);
} catch (err) {
  // Si las reglas tienen un error de sintaxis, Firebase lo rechaza y aquí se ve la línea.
  console.error('No se pudieron publicar las reglas:', err.message || err);
  process.exit(1);
}
