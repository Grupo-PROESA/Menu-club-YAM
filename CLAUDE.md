# CLAUDE.md · Comedor Club YAMA

> Esta app sigue el Playbook de Soluciones Digitales PROESA (instalado en
> `~/.claude/proesa-playbook/`). Aquí va solo lo específico de esta app.
> **Ojo:** está fuera del stack estándar por una excepción (ver *Excepciones al playbook*).

## Qué es

- **Proceso que resuelve:** pedidos de comida del comedor Club YAMA. Cada colaborador pide y cancela
  su comida de la semana, el comedor ve la lista y Talento Humano saca el reporte para el descuento
  de nómina (BUK).
- **Área dueña / dueño del proceso:** [completar]
- **Especialista responsable:** Jorge Anaya (Soluciones Digitales)
- **Cómo se entra:** Portal PROESA → Proesa-Teams (Gestor de Personal) → menú **Comedor** →
  **Comedor Club YAMA**. El proveedor del comedor entra directo a la URL con el botón ADMIN y su PIN.
- **URL:** https://comedor-yama.grupoproesa.mx · proyecto Firebase `menu-proesa-yama`
- **Código en el Gestor (`aud` del token):** `comedor-yama`

## Roles

No usa roles del portal. Se definen así:

| Rol | Quién lo tiene | Qué puede hacer |
|---|---|---|
| Colaborador | Quien entra desde Proesa-Teams (token con su `numEmp`) | Pedir, ver y cancelar **solo su** pedido, ver su historial por quincena |
| Comedor (`adminPin`) | El proveedor del comedor | Editar y publicar el menú, ver todos los pedidos, cortesías, historial y buzón, mandar la orden a cocina |
| RRHH (`superPin`) | Talento Humano | Todo lo de comedor más el catálogo de empleados |

Los PIN viven en Firestore `config/secrets` (nadie los lee desde el navegador) y se validan en
`firestore.rules` al crear `admin_sessions/{uid}`. La sesión de admin dura 12 h.

## Vocabulario del área

| Término | Significado |
|---|---|
| Pedido | Los días de la semana que un colaborador pide comer. Un documento por colaborador (`orders/{numEmp}`) |
| Cortesía | Comida para alguien sin número de empleado (invitados, ingresos). La registra el admin |
| Catálogo | Lista de números de empleado con su nombre. Sin estar en el catálogo no se puede pedir |
| Historial / quincena | Comidas archivadas por quincena (`historial/AAAA-M-Q1` o `Q2`), base del reporte para BUK |
| Limpiar pedidos / archivar | Pasa los pedidos de semanas anteriores al historial y los quita de la lista |

## Reglas de negocio clave

- **Horario** (hora del navegador, lunes a viernes): pedidos de 7:00 a 11:30. Cancelaciones de 7:00
  a 11:30 y de 17:00 a 24:00. Los días que ya pasaron no se pueden pedir ni cancelar (salvo admin).
- **Número de empleado:** se normaliza en mayúsculas y sin ceros a la izquierda (`orderDocId`). La
  Cloud Function hace lo mismo con el número que manda el Gestor.
- **Archivar solo semanas anteriores** (27 oct 2026, Jorge Anaya): "Limpiar Pedidos" y "publicar el
  menú de semana nueva" solo archivan pedidos con fecha anterior al lunes de la semana en curso.
- **La orden a cocina incluye las cortesías** (28 oct 2026, a pedido de Talento Humano).

## Integraciones

No ofrece datos a otras apps (ver `docs/contrato.md`). Lo que **consume**:

| Necesito | De qué app | Cómo |
|---|---|---|
| Quién es el colaborador y su número | Gestor de Personal (Proesa-Teams) | El Gestor redirige a la Function `ssoCallback` con `?t=<JWT HS256>` (`iss` `gestor-personal`, `aud` `comedor-yama`), firmado con el secreto `HANDOFF_SECRET` |

## Dónde va cada cosa (no cambiar sin razón)

- Toda la interfaz y su lógica: `index.html` (HTML, CSS y JS en un solo archivo), estilos comunes en
  `proesa.css`.
- Reglas de acceso a los datos: `firestore.rules`. Se publican con `firebase deploy --only firestore:rules`.
- Entrada desde el Gestor: `functions/index.js` (Cloud Function `ssoCallback`, Node 22, 2nd gen).
- Pruebas: `tests/rules.test.js` (reglas, emulador de Firestore) y `tests/orden-cocina.test.js`.
- Publicación: GitHub Pages publica `main` solo. La Function y las reglas se despliegan a mano con
  firebase CLI (ver README).

## Excepciones al playbook

- **Stack y hosting fuera del estándar (R1, R2, R3):** página estática en GitHub Pages con Firestore
  y Cloud Functions de Firebase, sin backend FastAPI ni PostgreSQL. La app ya existía así.
- **Login por el Gestor en lugar de PROESA Gateway (R5):** el acceso de colaboradores lo diseñó y
  aprobó TI (Luis) en octubre de 2026 (issue #3).

Detalle y fechas en `docs/decisiones.md`. [completar: liga a la aprobación formal en el repo del
playbook (issue con etiqueta `excepcion`), si existe]

## Deuda conocida

- Sin CI: ningún PR corre pruebas automáticas.
- Sin ayuda embebida (recorrido, `?` por pantalla, `/ayuda`).
- Sin deploy automático para la Function y las reglas.
- El catálogo se captura a mano y no se sincroniza con BUK ni con el Gestor.
- `historial/` lo puede leer cualquier sesión (incluye el conteo de comidas de todos).
- Las cortesías se archivan completas al publicar el menú o limpiar pedidos (no solo las de semanas
  anteriores).
- El aviso al intentar pedir fuera de horario dice "Se abren a las 5:00 PM", pero abren a las 7:00.
