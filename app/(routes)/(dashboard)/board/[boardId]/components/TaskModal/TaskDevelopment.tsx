"use client";

import { useEffect, useState, type ReactNode } from "react";
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

function InfoHint({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Info size={13} aria-hidden />
      </button>
      <span
        role="tooltip"
        hidden={!open}
        className="absolute top-full right-0 z-20 mt-1 w-72 rounded-md bg-foreground px-2.5 py-1.5 text-left text-xs leading-relaxed font-normal text-background shadow-md"
      >
        {children}
      </span>
    </span>
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
    <div className="flex w-fit max-w-full min-w-0 flex-col gap-1">
      <div className="inline-flex h-8 max-w-full min-w-0 items-center gap-1 rounded-4xl border bg-background px-2.5 shadow-2xs">
        <GitBranch size={13} className="shrink-0 text-muted-foreground" aria-hidden />
        <code className="min-w-0 truncate font-mono text-xs">
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
        <InfoHint
          label={
            data.connected
              ? t("developmentHint")
              : `${t("developmentHint")} ${t("developmentConnect")}`
          }
        >
          {t("developmentHint")}
          {!data.connected && (
            <>
              {" "}
              {t("developmentConnect")}{" "}
              <Link href="/dashboard/organizations" className="underline underline-offset-2">
                {t("developmentOpenOrganizations")}
              </Link>
            </>
          )}
        </InfoHint>
      </div>
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
