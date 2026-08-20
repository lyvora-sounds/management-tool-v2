import db from "@/lib/db";

interface WebhookNotificationPayload {
  boardId: string;
  eventType: "task_created" | "task_completed" | "task_moved";
  taskTitle: string;
  listTitle?: string;
  priority?: string | null;
  dueDate?: Date | null;
  userName?: string | null;
}

export async function sendBoardWebhookNotification(
  payload: WebhookNotificationPayload,
) {
  try {
    const board = await db.board.findUnique({
      where: { id: payload.boardId },
      select: {
        title: true,
        slackWebhookUrl: true,
        discordWebhookUrl: true,
        notifyOnTaskCreated: true,
        notifyOnTaskCompleted: true,
        notifyOnTaskMoved: true,
      },
    });

    if (!board) return;

    // Check if notification is enabled for this event
    if (payload.eventType === "task_created" && !board.notifyOnTaskCreated) return;
    if (payload.eventType === "task_completed" && !board.notifyOnTaskCompleted) return;
    if (payload.eventType === "task_moved" && !board.notifyOnTaskMoved) return;

    const eventLabels = {
      task_created: "✨ Nueva tarea creada",
      task_completed: "✅ Tarea completada",
      task_moved: "📦 Tarea movida",
    };

    const actionText = eventLabels[payload.eventType] || "Actualización de tarea";

    // 1. Send to Slack
    if (board.slackWebhookUrl) {
      await fetch(board.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${actionText}: *${payload.taskTitle}* en *${board.title}*`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${actionText}*\n*${payload.taskTitle}*\n📁 Board: *${board.title}*${
                  payload.listTitle ? ` | Lista: *${payload.listTitle}*` : ""
                }${payload.userName ? ` | Por: ${payload.userName}` : ""}`,
              },
            },
          ],
        }),
      }).catch((err) => console.error("Error sending Slack webhook:", err));
    }

    // 2. Send to Discord
    if (board.discordWebhookUrl) {
      const colors = {
        task_created: 0x3b82f6, // Blue
        task_completed: 0x10b981, // Green
        task_moved: 0xf59e0b, // Amber
      };

      await fetch(board.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: `${actionText}: ${payload.taskTitle}`,
              color: colors[payload.eventType] || 0x3b82f6,
              fields: [
                { name: "Board", value: board.title, inline: true },
                ...(payload.listTitle
                  ? [{ name: "Lista", value: payload.listTitle, inline: true }]
                  : []),
                ...(payload.userName
                  ? [{ name: "Usuario", value: payload.userName, inline: true }]
                  : []),
                ...(payload.priority
                  ? [{ name: "Prioridad", value: payload.priority.toUpperCase(), inline: true }]
                  : []),
              ],
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      }).catch((err) => console.error("Error sending Discord webhook:", err));
    }
  } catch (err) {
    console.error("Webhook dispatcher error:", err);
  }
}
