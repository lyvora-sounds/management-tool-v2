"use client";

import { useEffect, useState } from "react";
import {
  Webhook,
  Save,
  Loader2,
  Bell,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface BoardIntegrationsModalProps {
  boardId: string;
  open: boolean;
  onClose: () => void;
}

export function BoardIntegrationsModal({
  boardId,
  open,
  onClose,
}: BoardIntegrationsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [notifyOnTaskCreated, setNotifyOnTaskCreated] = useState(true);
  const [notifyOnTaskCompleted, setNotifyOnTaskCompleted] = useState(true);
  const [notifyOnTaskMoved, setNotifyOnTaskMoved] = useState(false);

  useEffect(() => {
    if (open) {
      loadIntegrations();
    }
  }, [open, boardId]);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/integrations`);
      if (res.ok) {
        const data = await res.json();
        setSlackWebhookUrl(data.slackWebhookUrl || "");
        setDiscordWebhookUrl(data.discordWebhookUrl || "");
        setNotifyOnTaskCreated(data.notifyOnTaskCreated ?? true);
        setNotifyOnTaskCompleted(data.notifyOnTaskCompleted ?? true);
        setNotifyOnTaskMoved(data.notifyOnTaskMoved ?? false);
      }
    } catch {
      toast.error("Error al cargar integraciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/integrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slackWebhookUrl,
          discordWebhookUrl,
          notifyOnTaskCreated,
          notifyOnTaskCompleted,
          notifyOnTaskMoved,
        }),
      });

      if (res.ok) {
        toast.success("Integraciones de webhooks guardadas");
        onClose();
      } else {
        toast.error("Error al guardar integraciones");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Webhook size={18} className="text-primary" />
            <span>Integraciones y Alertas de Webhooks</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 pt-2">
            {/* Slack Webhook */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <MessageSquare size={14} className="text-emerald-600" />
                <span>Slack Incoming Webhook URL</span>
              </Label>
              <Input
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Recibe notificaciones automáticas en tu canal de Slack configurado.
              </p>
            </div>

            {/* Discord Webhook */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <MessageSquare size={14} className="text-indigo-500" />
                <span>Discord Webhook URL</span>
              </Label>
              <Input
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Envía tarjetas informativas con diseño embebido a tu canal de Discord.
              </p>
            </div>

            {/* Event Triggers */}
            <div className="space-y-3 p-4 rounded-xl border bg-muted/30">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Bell size={13} />
                <span>Eventos que disparan notificaciones</span>
              </Label>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="trigger-create"
                    checked={notifyOnTaskCreated}
                    onCheckedChange={(c) => setNotifyOnTaskCreated(Boolean(c))}
                  />
                  <label
                    htmlFor="trigger-create"
                    className="text-xs font-medium cursor-pointer"
                  >
                    Al crear una nueva tarjeta / tarea
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="trigger-complete"
                    checked={notifyOnTaskCompleted}
                    onCheckedChange={(c) => setNotifyOnTaskCompleted(Boolean(c))}
                  />
                  <label
                    htmlFor="trigger-complete"
                    className="text-xs font-medium cursor-pointer"
                  >
                    Al marcar una tarjeta como completada
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="trigger-move"
                    checked={notifyOnTaskMoved}
                    onCheckedChange={(c) => setNotifyOnTaskMoved(Boolean(c))}
                  />
                  <label
                    htmlFor="trigger-move"
                    className="text-xs font-medium cursor-pointer"
                  >
                    Al mover una tarjeta entre listas
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                <span>Guardar integraciones</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
