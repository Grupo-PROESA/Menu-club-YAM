# Contrato de integración · Comedor Club YAMA

Lo que esta app ofrece a otras apps PROESA.

- **Dueño de la app:** [completar] (a quien se le piden datos nuevos)
- **Especialista responsable:** Jorge Anaya
- **Endpoints de integración:** **todavía no ofrece ninguno.** La app no tiene backend propio (es
  una página estática con Firestore, ver excepciones en `CLAUDE.md`). Si otra app necesita sus datos,
  se pide con un issue `cross-repo` en este repo.

## Qué datos tiene esta app

En Firestore, proyecto `menu-proesa-yama`.

| Dato | Descripción |
|---|---|
| `orders/{numEmp}` | Pedido de la semana en curso de cada colaborador: nombre, número, días, opción elegida, total y fecha |
| `historial/{AAAA-M-Qn}` | Comidas archivadas por quincena y por colaborador, más las cortesías archivadas. Base del reporte para BUK |
| `config/menu` | Menú publicado de la semana (días, entrada, plato fuerte, alternativa, postre) |
| `config/catalogo` | Catálogo de empleados: número y nombre |
| `config/cortesias` | Cortesías registradas (nombre y días) |
| `config/secrets` | PIN de comedor y de RRHH. Nadie lo lee desde el navegador |
| `admin_sessions/{uid}` | Sesiones de admin abiertas con PIN (12 h) |
| `comentarios/{id}` | Buzón de comentarios con foto opcional |

## Quién consume esta API

| App | Endpoints que usa | Desde |
|---|---|---|
| | | |

## Cambios

| Fecha | Cambio |
|---|---|
| 2026-10-29 | Versión inicial (sin endpoints) |
