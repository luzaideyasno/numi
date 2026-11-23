# Numi 🦄 — matemáticas jugando

Juego de matemáticas para niñas de 3.° a 5.° con retos, ayuda paso a paso y un panel para profesores y coordinación, conectado a Firebase.

- **Juego:** https://luzaideyasno.github.io/numi/
- **Panel docente:** https://luzaideyasno.github.io/numi/docente.html

| Archivo | Qué es |
|---|---|
| `index.html` | El juego. Las niñas entran con usuario + 3 dibujitos; también se puede practicar sin cuenta |
| `docente.html` | Panel de profesores y súper usuario (coordinación) |
| `numi-db.js` | Conexión con Firebase (Authentication + Firestore), compartida por los dos |
| `firebase-config.js` | Datos del proyecto Firebase `numi-b3d93` |
| `firestore.rules` | Reglas de seguridad: pegarlas en Firestore → Reglas → Publicar |

## Datos en Firestore
- `users/{uid}`: personal del colegio. `role`: `admin` (coordinación) o `teacher`; `access`: lista de cursos del profesor.
- `courses/{id}`: `name`, `grade`, `year`.
- `students/{uid}`: `name`, `user`, `pics` (clave de 3 dibujitos), `courseId`, `year`, `wardrobe` (ropa de Numi).
- `results/{id}`: un reto jugado: `studentUid`, `courseId`, `isl` (0–5), `lvl` (0–2), `qs` (por pregunta: `p` a la primera, `s` segundo intento, `m` tres o más, `a` con ayuda), `stars`, `t`.
- `settings/{courseId}`: escala de notas del curso. `notes/{studentUid}`: notas ajustadas (`ov`) y observaciones (`obs`). `tasks/{id}`: tareas con fecha límite.

## Primer uso
1. En `docente.html`, tocar **"Crear cuenta del coordinador"** (solo aparece la primera vez) y llenar nombre, correo y contraseña.
2. El coordinador entra a `docente.html`, crea los cursos del año y los profesores (les llega un correo para crear su contraseña).
3. Cada profesor crea sus estudiantes desde la foto de la lista (o escribiéndola) e imprime las tarjetas de ingreso.

## Decisiones
- Cada año lectivo la coordinación crea los cursos; las estudiantes se crean de nuevo cada año.
- Notas de 1 a 5 por pregunta: 5,0 a la primera · 4,0 segundo intento · 3,5 tres o más · 3,0 con ayuda (cada curso puede cambiarla).
