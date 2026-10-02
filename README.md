# Kikiboard

Aplicación web full-stack de gestión de proyectos colaborativa, inspirada en Trello. Permite organizar trabajo en boards Kanban, colaborar con equipos, gestionar tareas con subtareas, prioridades, fechas de vencimiento y mucho más.

🌐 **[kikiboard.xyz](https://kikiboard.xyz)**

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| Componentes | shadcn/ui + Base UI |
| Autenticación | Clerk |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL (Neon) |
| Storage de archivos | Vercel Blob |
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
- Adjuntos de archivos almacenados en Vercel Blob
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
- Sincronización de nombre y email desde Clerk a Neon mediante webhooks (`user.updated`)
- Eliminación del usuario en base de datos al borrar la cuenta en Clerk (`user.deleted`)

---

## Variables de entorno

```env
# Base de datos
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://kikiboard.xyz
```

---

## Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/kikiboard.git
cd kikiboard

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Sincronizar base de datos
pnpm prisma db push

# Iniciar servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Estructura del proyecto

```
app/
├── api/                    # API Routes (serverless)
│   ├── boards/             # CRUD boards, actividad
│   ├── tasks/              # CRUD tareas, subtareas, asignados, comentarios, adjuntos
│   ├── lists/              # CRUD listas, reordenamiento
│   ├── notifications/      # Notificaciones del usuario
│   ├── search/             # Búsqueda global
│   ├── calendar/           # Tareas por mes
│   ├── invite/             # Invitación por token
│   └── webhooks/clerk/     # Sincronización de usuarios con Clerk
├── (routes)/
│   ├── (dashboard)/
│   │   ├── dashboard/      # Página principal y componentes del dashboard
│   │   └── board/[boardId] # Board individual con Kanban, lista y modal de tarea
│   └── (landing)/          # Página de inicio pública
lib/
├── db.ts                   # Cliente Prisma
├── boardAccess.ts          # Helper de permisos de board
├── createActivity.ts       # Helper de log de actividad
└── getOrCreateUser.ts      # Creación/vinculación de usuario en primer login
prisma/
└── schema.prisma           # Modelos: User, Board, List, Task, Subtask,
                            # Comment, Attachment, Label, Notification, ActivityLog
```

---

## Despliegue

El proyecto está configurado para despliegue en Vercel. El script de build ejecuta `prisma generate` automáticamente antes de compilar.

```bash
pnpm build
```

### Webhooks de Clerk (producción)

Configura un endpoint en el [Clerk Dashboard](https://dashboard.clerk.com) apuntando a:

```
https://tu-dominio.com/api/webhooks/clerk
```

Eventos a suscribir: `user.updated`, `user.deleted`
