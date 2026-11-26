# Kikiboard

Aplicación web de gestión de proyectos colaborativa, inspirada en Trello. Permite organizar trabajo en boards Kanban, colaborar con equipos, gestionar tareas con subtareas, prioridades, fechas de vencimiento y mucho más.

🌐 **[kikiboard.xyz](https://kikiboard.xyz)**

Este repositorio es el **frontend**. No tiene base de datos ni backend propios: todo lo sirve [`kiki-api`](https://github.com/lyvora-sounds/kiki-api) (Fastify en Cloud Run), que aplica el esquema y las migraciones. Ver `docs/architecture.md`.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| Componentes | shadcn/ui + Base UI |
| Autenticación | Clerk |
| Backend | `kiki-api` (Fastify, Prisma 7, PostgreSQL en Neon, archivos en Cloudflare R2) |
| Estado global | Zustand |
| Drag & Drop | @dnd-kit |
| Editor de texto | Tiptap |
| Notificaciones UI | Sonner |
| Emails | Resend |
| Despliegue | Vercel |

---

## Características

### Boards y organización
- Creación de boards con título, descripción y color
- Listas dentro de cada board con reordenamiento por drag & drop
- Vista Kanban y vista Lista (toggle)
- Invitación de miembros mediante enlace con token único
- Control de acceso: permisos diferenciados entre propietario y miembros

### Tareas
- Crear, editar y eliminar tareas dentro de listas
- Arrastrar tareas entre listas y reordenar dentro de la misma lista
- Título, descripción enriquecida (Tiptap), fecha de inicio y vencimiento
- Prioridad: Urgente, Alta, Media, Baja — con color identificativo
- Marcar como completada con registro de fecha y usuario que la completó
- Asignación de múltiples miembros a una tarea
- Etiquetas de color personalizables

### Subtareas
- Checklist de subtareas dentro de cada tarea
- Barra de progreso y contador (X/Y) visible en la tarjeta
- Añadir, editar, completar y eliminar subtareas en tiempo real

### Comentarios y adjuntos
- Comentarios por tarea con editor de texto enriquecido
- Adjuntos de archivos almacenados en un bucket privado de Cloudflare R2
- Contadores visibles en la tarjeta (comentarios y adjuntos)

### Indicadores visuales en tarjetas
- Fecha de vencimiento en rojo si está vencida, naranja si vence en ≤3 días
- Contador de subtareas completadas / totales
- Icono y conteo de comentarios y adjuntos
- Badge de prioridad con color

### Dashboard personal
- Saludo personalizado con nombre del usuario
- Estadísticas: tareas pendientes, vencidas, completadas esta semana
- Gráfico de actividad semanal individual (barras por día)
- Tareas próximas a vencer asignadas al usuario
- Tareas asignadas pendientes
- Actividad reciente del equipo
- Boards recientes con progreso visual

### Calendario
- Vista mensual con navegación por mes
- Visualización de todas las tareas con fecha de vencimiento
- Panel lateral con detalle de tareas al hacer clic en un día

### Búsqueda global
- Atajo de teclado Cmd+K / Ctrl+K
- Búsqueda con debounce en boards y tareas
- Resultados agrupados por tipo
- Navegación por teclado (↑ ↓ Enter)

### Notificaciones
- Polling automático cada 30 segundos + al volver a la ventana
- Badge con conteo de no leídas
- Notificación al ser asignado a una tarea o recibir un comentario
- Marcar como leída individualmente o todas a la vez

### Actividad del board
- Log de las últimas 100 acciones: tareas creadas, completadas, movidas, comentarios, asignaciones
- Iconos diferenciados por tipo de acción

### Autenticación y usuarios
- Registro con email/password y OAuth con Google
- Vinculación automática de cuentas si el mismo email se registra por dos métodos distintos
- Sincronización de nombre y email desde Clerk a la base de datos mediante el webhook de `kiki-api` (`user.updated`)
- Eliminación del usuario al borrar la cuenta en Clerk (`user.deleted`)

---

## Variables de entorno

Este repositorio solo necesita las claves de Clerk y las direcciones de la aplicación y de la API. Los secretos del backend (base de datos, R2, Resend, GitHub App, webhooks) viven en `kiki-api`.

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# App y API (se leen al compilar: NEXT_PUBLIC_*)
NEXT_PUBLIC_APP_URL=https://kikiboard.xyz
NEXT_PUBLIC_API_URL=https://api.kikiboard.xyz
```

---

## Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/kikiboard.git
cd kikiboard

# Instalar dependencias
pnpm install

# Configurar variables de entorno: crea un .env con las de arriba.
# Para desarrollo apunta NEXT_PUBLIC_API_URL a la API de staging
# (https://api-staging.kikiboard.xyz) o a un kiki-api local.

# Iniciar servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Estructura del proyecto

```
app/
├── api/                    # Solo health y los dos relés de GitHub (setup, result)
├── (routes)/
│   ├── (dashboard)/
│   │   ├── dashboard/      # Página principal y componentes del dashboard
│   │   └── board/[boardId] # Board individual con Kanban, lista y modal de tarea
│   └── (landing)/          # Página de inicio pública
lib/
├── apiClient.ts            # apiFetch: llamadas del navegador a kiki-api
├── apiRoutes.ts            # Mapea cada llamada /api/... a su ruta /v1/... de la API
├── apiServer.ts            # Lecturas desde las páginas del servidor
├── api/                    # Tipos y adaptadores del contrato (schema.d.ts se genera)
└── modelTypes.ts           # Forma de las filas que envía la API
```

---

## Despliegue

Producción corre en Vercel (`main`) y staging en Vercel (`dev`) y en un contenedor de Cloud Run (`Dockerfile`, infraestructura en `kiki-infra`). El build es `next build`; necesita `NEXT_PUBLIC_API_URL`.

```bash
pnpm build
```

### Webhooks y migraciones

Los webhooks de Clerk y de GitHub apuntan a `kiki-api` (`/v1/webhooks/clerk` y `/v1/webhooks/github`), y las migraciones las aplica su pipeline de despliegue. Este repositorio no tiene ni una cosa ni la otra.
