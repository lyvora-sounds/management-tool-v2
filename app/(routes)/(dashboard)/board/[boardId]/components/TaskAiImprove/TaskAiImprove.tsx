"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, X, ArrowRight, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ImproveTaskResult } from "@/lib/ai/types";
import Link from "next/link";

interface TaskAiImproveProps {
  taskId: string;
  currentTitle: string;
  currentDescription: string;
  onApply: (
    newTitle: string,
    newDescription: string,
    acceptedSubtasks: string[],
  ) => Promise<void>;
}

export function TaskAiImprove({
  taskId: _taskId,
  currentTitle,
  currentDescription,
  onApply,
}: TaskAiImproveProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImproveTaskResult | null>(null);
  const [improvedTitle, setImprovedTitle] = useState("");
  const [selectedSubtasks, setSelectedSubtasks] = useState<boolean[]>([]);
  const [noApiKey, setNoApiKey] = useState(false);

  const startImprove = async () => {
    setLoading(true);
    setOpen(true);
    setNoApiKey(false);
    try {
      const res = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentTitle,
          description: currentDescription,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setImprovedTitle(data.title);
        setSelectedSubtasks(data.suggestedSubtasks.map(() => true));
      } else {
        if (data.error && data.error.includes("Ajustes")) {
          setNoApiKey(true);
        } else {
          toast.error(data.error || "Error al mejorar la tarea con IA");
          setOpen(false);
        }
      }
    } catch {
      toast.error("Error de conexión al llamar a la IA");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubtask = (index: number) => {
    setSelectedSubtasks((prev) =>
      prev.map((checked, i) => (i === index ? !checked : checked)),
    );
  };

  const handleApply = async () => {
    if (!result) return;
    const accepted = result.suggestedSubtasks
      .filter((_, idx) => selectedSubtasks[idx])
      .map((s) => s.title);

    await onApply(improvedTitle, result.description, accepted);
    setOpen(false);
    setResult(null);
    toast.success("Mejoras de IA aplicadas a la tarjeta");
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={startImprove}
        disabled={loading}
        className="gap-1.5 h-8 text-xs border-primary/30 text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
      >
        <Sparkles size={13} />
        <span>Mejorar con IA</span>
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4 my-2 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Sparkles size={16} />
          </div>
          <h4 className="text-sm font-bold text-foreground">
            Sugerencias de IA
          </h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setResult(null);
          }}
          className="h-7 px-2 text-xs text-muted-foreground"
        >
          <X size={14} />
          <span>Cerrar</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <Loader2 className="animate-spin text-primary" size={24} />
          <p className="text-xs text-muted-foreground animate-pulse">
            Consultando a tu modelo de IA configurado...
          </p>
        </div>
      ) : noApiKey ? (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
          <p className="font-semibold text-amber-700 dark:text-amber-400">
            Clave de IA no configurada
          </p>
          <p className="text-muted-foreground">
            Para usar las funciones de IA, debes registrar tu propia clave de API (OpenAI, Claude, Gemini, DeepSeek, Grok, Kimi) en los ajustes de tu cuenta.
          </p>
          <Link
            href="/dashboard/settings"
            className={buttonVariants({
              size: "sm",
              className: "gap-1.5 mt-2 h-7 text-xs",
            })}
          >
            <span>Ir a Ajustes</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : result ? (
        <div className="space-y-4">
          {/* Improved Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Título mejorado
            </label>
            <Input
              value={improvedTitle}
              onChange={(e) => setImprovedTitle(e.target.value)}
              className="text-sm font-medium bg-background"
            />
          </div>

          {/* Improved Description */}
          {result.description && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Descripción enriquecida sugerida
              </label>
              <div
                className="p-3 rounded-lg border bg-background text-xs prose prose-xs dark:prose-invert max-w-none max-h-48 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: result.description }}
              />
            </div>
          )}

          {/* Suggested Subtasks */}
          {result.suggestedSubtasks.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Subtareas sugeridas (desmarca para omitir)</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  {selectedSubtasks.filter(Boolean).length}/
                  {result.suggestedSubtasks.length} seleccionadas
                </span>
              </label>
              <ul className="space-y-1.5">
                {result.suggestedSubtasks.map((sub, i) => (
                  <li
                    key={i}
                    onClick={() => toggleSubtask(i)}
                    className="flex items-center gap-2.5 p-2 rounded-md bg-background border text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedSubtasks[i]}
                      onCheckedChange={() => toggleSubtask(i)}
                    />
                    <span
                      className={
                        selectedSubtasks[i]
                          ? "text-foreground font-medium"
                          : "text-muted-foreground line-through"
                      }
                    >
                      {sub.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              size="sm"
              onClick={handleApply}
              className="gap-1.5 h-8 text-xs font-semibold"
            >
              <Check size={13} />
              <span>Aplicar cambios</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setResult(null);
              }}
              className="h-8 text-xs"
            >
              Descartar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
