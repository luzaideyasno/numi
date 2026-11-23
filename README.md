# Numi 🦄 — matemáticas jugando

Juego de matemáticas para niñas de 3.° a 5.° con retos, ayuda paso a paso y un panel para profesores y coordinación.

| Archivo | Qué es |
|---|---|
| `index.html` | El juego de las niñas (Reino de Numi) |
| `docente.html` | Panel de profesores y súper usuario (prototipo con datos de ejemplo) |
| `firebase-config.js` | Datos del proyecto de Firebase (hay que pegarlos) |
| `firestore.rules` | Reglas de seguridad de la base de datos |

## Estado
- Juego: listo. El progreso se guarda en el navegador de cada dispositivo.
- Panel docente: prototipo aprobado. Falta conectarlo a Firebase (inicio de sesión, cursos, estudiantes y notas en línea).

## Publicar en GitHub Pages
Settings → Pages → Source: **Deploy from a branch** → Branch: **main** / **(root)** → Save.
Queda en `https://USUARIO.github.io/numi/` (juego) y `https://USUARIO.github.io/numi/docente.html` (panel).

## Decisiones
- Cada año lectivo la coordinación crea los cursos. Las estudiantes se crean de nuevo cada año desde la foto de la lista (no se promueven).
- Notas de 1 a 5 por pregunta: 5,0 a la primera · 4,0 segundo intento · 3,5 tres o más · 3,0 con ayuda (editable).
