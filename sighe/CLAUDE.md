# SIGHE — Sistema de Gestión de Hardware Empresarial

Este archivo es la fuente de verdad del proyecto para cualquier sesión de Claude Code. Léelo completo antes de escribir código. El detalle completo (historias de usuario con criterios de aceptación) vive en Notion — los links están al final — pero este documento debería ser suficiente para desarrollar sin necesidad de abrir Notion.

## Qué es SIGHE

Sistema multi-empresa (SaaS) para gestionar el hardware de oficina: equipos, su ubicación física, fallas/reparaciones, y stock de repuestos. Cada equipo tiene un QR único; cualquier trabajador (sin cuenta) puede escanearlo para reportar una falla.

Stack: backend Node.js (Express/NestJS), frontend Next.js (desplegado en Vercel), base de datos Supabase (Postgres + RLS), tiempo real con Supabase Realtime.

## Roles

- **Trabajador**: cualquier empleado de la oficina. Sin cuenta, sin login. Solo escanea el QR de un equipo para reportar una falla.
- **Técnico**: usuario con cuenta (`role = 'tecnico'`). Recibe notificación de tickets nuevos, los toma, los resuelve, registra piezas usadas.
- **Admin**: usuario con cuenta (`role = 'admin'` o `'super_admin'`). Gestiona equipos, el mapa interactivo, inventario, y ve reportes. `super_admin` es el equipo de plataforma (multi-tenant, ve todas las empresas).

Multi-tenant: shared schema + `company_id` en cada tabla + RLS. Nunca confiar en un `company_id` que venga del cliente — siempre se deriva de `profiles.company_id` del usuario autenticado, o vía trigger desde el equipo escaneado (para reportes anónimos).

## Flujo principal

1. Trabajador escanea el QR → formulario breve (tipo de falla + descripción, sin login) → se crea un `repair_ticket` en estado `pendiente`.
2. Los técnicos reciben notificación en tiempo real con sonido (evento de socket `ticket:created`).
3. Un técnico toma el ticket → pasa a `en_revision` → queda como `assigned_to` (responsable). Un ticket solo puede tener un responsable a la vez.
4. El técnico resuelve → marca `resuelto`.
5. Al marcar `resuelto`, el sistema pregunta si usó repuestos inventariados. Si sí, elige piezas + cantidad (una o varias) → se inserta en `repair_ticket_parts` → el stock de `inventory` se descuenta automáticamente. No se puede usar más cantidad de la disponible.

Estados de ticket: `pendiente`, `en_revision`, `resuelto`, `cancelado` (excepción, no parte del flujo feliz).
Estados de equipo: `activo`, `en_reparacion`, `dado_de_baja`, `mejorado`, `irrecuperable`.

## Mapa interactivo (vista del Admin)

No hay imagen de fondo ni plano real. Es un contenedor abstracto por sala (como el panel de mesas de GGLeap): cada sala es un `<div>` con posición `relative`, y cada equipo es un ícono/círculo con posición `absolute` dentro, ubicado según `locations.x_coordinate` / `locations.y_coordinate` — **estos son porcentaje 0-100 del ancho/alto del contenedor de la sala, NO coordenadas de una imagen real**. Colores por estado: verde (activo), amarillo (en revisión/reparación), rojo (falla/irrecuperable). Se actualiza en vivo vía suscripción de Supabase Realtime al evento `equipo:status_changed` (UPDATE en `equipment`/`repair_tickets`). Reposicionar con `dnd-kit` o `react-draggable` con `bounds="parent"`.

El Admin selecciona el piso arriba y se renderizan solo las salas de ese piso.

## Notificaciones en tiempo real

Supabase Realtime (Postgres Changes), no Socket.IO — el frontend se despliega en Vercel (funciones serverless), que no soporta un servidor con proceso persistente como requiere Socket.IO. Supabase ya tiene su propia infraestructura de websockets administrada, así que el frontend solo se suscribe como cliente.

- `ticket:created` → suscripción a `INSERT` en `repair_tickets`. El INSERT que ya se hace al reportar por QR es el evento en sí, no hay que emitir nada manualmente.
- `equipo:status_changed` → suscripción a `UPDATE` en `equipment` (columna `status`) o en `repair_tickets` (columna `status`).
- Las políticas RLS por `company_id` ya definidas aplican automáticamente a las suscripciones — un técnico solo recibe cambios de su propia empresa, sin necesidad de armar una room por empresa.
- Frontend: `@supabase/supabase-js` (la misma librería que ya se usa para auth y queries), no `socket.io-client`. El callback de la suscripción reproduce el sonido (`new Audio('/notification.mp3').play()`). El navegador bloquea el autoplay sin interacción previa — pedir un clic de "activar notificaciones" al cargar el dashboard.

## Generación de QR

Librería `qrcode` (npm), generado server-side on-demand (no se guarda la imagen). El QR codifica directamente el `id` (uuid) de `equipment` — no existe una columna `qr_code` separada, para no tener un identificador duplicado que se pueda desincronizar. Ruta de reporte: `/q/[id]`, donde `id` es el uuid del equipo. Fase 2: combinar con mensaje personalizado usando `pdf-lib` o un canvas exportado a PDF.

## Alcance — qué SÍ y qué NO

**Fuera de alcance del proyecto (no solo del MVP):**
- Gestión de órdenes de compra de repuestos (solicitud/aprobación/recepción). El reabastecimiento de stock se maneja fuera del sistema.
- Gestión de activos no-hardware.
- Integración con sistemas contables/ERP externos.

**MVP (Fase 1):** registro de equipos + QR, reporte anónimo vía QR, notificación con sonido, flujo completo de ticket (pendiente → en_revision → resuelto) con responsable y registro de piezas usadas, mapa interactivo con color por estado, inventario básico, reportes esenciales (historial por equipo, stock actual).

**Fase 2:** QR con mensaje personalizado imprimible, alertas de stock bajo, reportes ampliados (equipos con más fallas, consumo de piezas por período, métricas por técnico).

**Fase 3:** dashboard analítico integrado al mapa, permisos granulares, auditoría, notificaciones por correo/push.

## Esquema de base de datos (Supabase / Postgres)

El esquema vive en `supabase/schema.sql` en este repo (cópialo ahí si no está). Resumen de tablas:

- `companies` — una fila por empresa cliente (multi-tenant).
- `profiles` — usuarios con cuenta, `role` enum (`super_admin`, `admin`, `tecnico`, `usuario`), `company_id`.
- `equipment_types`, `parts` — catálogos compartidos entre todas las empresas (gestionados solo por `super_admin`).
- `locations` — sala por empresa, con `x_coordinate`/`y_coordinate` (porcentaje 0-100).
- `equipment` — `id` (uuid, es el valor que se codifica en el QR), `status` enum, `location_id`, `company_id`.
- `repair_tickets` — `status` enum (`pendiente`/`en_revision`/`resuelto`/`cancelado`), `reported_by` (nullable, FK a profiles) + `reporter_name` (nullable, texto libre para reportes anónimos), `assigned_to`, `company_id` (se completa por trigger desde `equipment`, nunca confiar en el valor del cliente).
- `inventory` — stock por empresa, `quantity`, `min_stock`.
- `repair_ticket_parts` — piezas usadas al cerrar un ticket, descuenta `inventory.quantity`.

Vistas de reporte ya definidas: `v_tickets_summary`, `v_low_stock`, `v_equipment_repair_count`.

RLS: todas las tablas tienen aislamiento por `company_id` vía las funciones `current_company_id()` e `is_super_admin()`. Excepción: `anon` puede hacer `SELECT` en `equipment` (solo equipos no dados de baja) e `INSERT` en `repair_tickets` (reporte por QR), scoped por la existencia del equipo.

Sin tabla de órdenes de compra — se eliminó del alcance.

## Convenciones que hay que respetar

- Nunca confiar en `company_id` del cliente. Siempre derivarlo del servidor.
- Coordenadas del mapa son porcentaje, no píxeles reales.
- El QR codifica el `id` (uuid) de `equipment` directamente — no existe columna `qr_code` separada.
- Un ticket solo tiene un responsable a la vez.
- El stock nunca puede quedar negativo (hay CHECK constraint en la tabla).

## Documentación completa

- Alcance del proyecto (Notion): https://app.notion.com/p/390c8cc226c081599049cba28b49673a
- Historias de usuario con criterios de aceptación (27 historias, Notion): https://app.notion.com/p/390c8cc226c0818da380d0459a23795b
- Definiciones técnicas (Notion): https://app.notion.com/p/390c8cc226c081d8ada1ffa7ae10f4d9

Si necesitas el detalle exacto de una historia de usuario específica (criterios de aceptación completos), consulta el link de arriba — este archivo resume, no reemplaza esa documentación.
