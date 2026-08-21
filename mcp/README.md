# Kikiboard MCP Server

El servidor MCP (Model Context Protocol) permite a asistentes de IA como **Claude Desktop**, **Cursor**, **OpenCode** y agentes autónomos conectarse a tu instancia de **Kikiboard** para gestionar tareas y proyectos mediante lenguaje natural.

---

## Herramientas disponibles

| Herramienta | Descripción |
|---|---|
| `list_boards` | Lista todos los boards con sus IDs, listas y conteo de tareas |
| `list_tasks` | Lista tareas filtradas por board, estado (pendientes/completadas), prioridad, trimestre o archivo |
| `create_task` | Crea una nueva tarea en una lista específica |
| `update_task` | Actualiza campos de una tarea (título, descripción, prioridad, fechas, estado) |
| `parse_and_create_tasks` | Envía texto libre o actas de reunión a la IA y crea automáticamente múltiples tareas estructuradas en el board |
| `bulk_archive_tasks` | Archiva tareas completadas o de trimestres anteriores masivamente |
| `list_epics` | Consulta los Epics y su progreso por trimestre |

---

## Configuración en Claude Desktop

Agrega la configuración a tu archivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kikiboard": {
      "command": "npx",
      "args": ["-y", "tsx", "/RUTA/ABSOLUTA/A/management-tool-v2/mcp/server.ts"],
      "env": {
        "KIKIBOARD_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

---

## Ejemplos de uso con tu asistente de IA

> **Tú:** "¿Cuáles son las tareas pendientes de alta prioridad en el board de Checkout?"  
> **IA:** *llama a `list_tasks(status="pending", priority="high")`* y te muestra el resumen.

> **Tú:** "Añade una tarea para migrar la base de datos a Neon en el Q3 antes del 15 de octubre con prioridad urgente."  
> **IA:** *llama a `create_task(...)`* creando la tarjeta con todas sus propiedades.

> **Tú:** "Archiva todas las tareas completadas del Q1."  
> **IA:** *llama a `bulk_archive_tasks(quarter="2026-Q1", completedOnly=true)`*.
