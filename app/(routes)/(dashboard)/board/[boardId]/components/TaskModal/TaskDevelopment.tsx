"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, GitBranch, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiClient";
import { copyToClipboard } from "@/lib/copyText";

type Development = {
  connected: boolean;
  ticketKey: string;
  command: string | null;
  branches: { name: string; url: string }[];
};

function InfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-label={text}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Info size={13} aria-hidden />
      </button>
      <p
        role="tooltip"
        hidden={!open}
        className="basis-full text-xs leading-relaxed text-muted-foreground"
      >
        {text}
      </p>
    </>
  );
}

export function TaskDevelopment({ taskId }: { taskId: string }) {
  return <TaskDevelopmentBody key={taskId} taskId={taskId} />;
}

function TaskDevelopmentBody({ taskId }: { taskId: string }) {
  const t = useTranslations("task");
  const [data, setData] = useState<Development | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/tasks/${taskId}/development`)
      .then(async (response) => (response.ok ? response.json() : null))
      .then((body: Development | null) => {
        if (!cancelled) setData(body);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  if (!data) return null;

  const copy = async () => {
    if (!data.command) return;
    const copied = await copyToClipboard(data.command);
    if (copied) toast.success(t("developmentCopied"));
    else toast.error(t("developmentCopyError"));
  };

  return (
    <div className="mx-4 mb-2 flex flex-col gap-1.5 rounded-lg border bg-muted/30 px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <GitBranch size={14} className="shrink-0 text-muted-foreground" aria-hidden />
        <code className="min-w-0 flex-1 truncate font-mono text-xs">
          {data.command ?? data.ticketKey}
        </code>
        {data.command && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            aria-label={t("developmentCopy")}
            onClick={copy}
          >
            <Copy size={13} />
          </Button>
        )}
        <InfoHint text={t("developmentHint")} />
      </div>
      {!data.connected && (
        <p className="text-xs text-muted-foreground">
          {t("developmentConnect")}{" "}
          <Link href="/dashboard/organizations" className="underline underline-offset-2 hover:text-foreground">
            {t("developmentOpenOrganizations")}
          </Link>
        </p>
      )}
      {data.branches.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {data.branches.map((branch) => (
            <li key={branch.name}>
              <a
                href={branch.url}
                target="_blank"
                rel="noreferrer"
                className="truncate font-mono text-xs text-primary underline-offset-2 hover:underline"
              >
                {branch.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
