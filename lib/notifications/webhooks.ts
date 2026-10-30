import db from "@/lib/db";

// A webhook is only called when its URL points at Slack or Discord. The address is typed by a board admin and
// the request is made from our server, so anything else is a way to reach internal addresses (SSRF).
const SLACK_HOSTS = ["hooks.slack.com"];
const DISCORD_HOSTS = ["discord.com", "discordapp.com", "canary.discord.com", "ptb.discord.com"];

/** True for an https URL on one of the given hosts, with no credentials in it. */
export function isWebhookUrlFor(url: string, hosts: string[]): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !u.username && !u.password && hosts.includes(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export const isSlackWebhookUrl = (url: string) => isWebhookUrlFor(url, SLACK_HOSTS);
export const isDiscordWebhookUrl = (url: string) => isWebhookUrlFor(url, DISCORD_HOSTS);

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
    if (board.slackWebhookUrl && !isSlackWebhookUrl(board.slackWebhookUrl)) {
      console.warn("Skipped a Slack webhook that is not on Slack", payload.boardId);
    } else if (board.slackWebhookUrl) {
      await fetch(board.slackWebhookUrl, {
        redirect: "error",
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
    if (board.discordWebhookUrl && !isDiscordWebhookUrl(board.discordWebhookUrl)) {
      console.warn("Skipped a Discord webhook that is not on Discord", payload.boardId);
    } else if (board.discordWebhookUrl) {
      const colors = {
        task_created: 0x3b82f6, // Blue
        task_completed: 0x10b981, // Green
        task_moved: 0xf59e0b, // Amber
      };

      await fetch(board.discordWebhookUrl, {
        redirect: "error",
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
