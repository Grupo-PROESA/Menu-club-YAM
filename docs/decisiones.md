# Decisiones

Decisiones de negocio y técnicas relevantes de la app, con fecha y quién decidió.

| Fecha | Decisión | Quién |
|---|---|---|
| antes de oct 2026 | La app se construyó en GitHub Pages con Firestore (Firebase), antes de que existiera el playbook. En octubre de 2026 el repo ya vive en `Grupo-PROESA` | Jorge Anaya |
| 2026-10-20 | Login de colaboradores desde el portal con Cloud Function y custom token de Firebase (issue #3) | Luis (TI) |
| 2026-10-21 | El acceso de colaboradores es desde el Gestor de Personal (Proesa-Teams), no desde el portal: el Gestor manda un token HS256 con el número de empleado (`HANDOFF_SECRET`). Sustituye a PROESA Gateway para esta app | Luis (TI) |
| 2026-10-21 | Reglas de Firestore: cada colaborador solo lee, pide, modifica y cancela su propio pedido. Admin y RRHH con PIN | Jorge Anaya |
| 2026-10-21 | Los proyectos de Firebase pasan a la cuenta de empresa | Jorge Anaya |
| 2026-10-27 | Al archivar solo se toman pedidos de semanas anteriores (después de que se archivaron pedidos de la semana en curso) | Jorge Anaya |
| 2026-10-28 | La orden a cocina incluye cortesías | Jorge Anaya, a pedido de Talento Humano |

Excepciones al playbook (R1, R2, R3, R5): ver `CLAUDE.md`. Aprobadas por Luis (TI) en octubre de 2026,
sin issue formal en el repo del playbook.
