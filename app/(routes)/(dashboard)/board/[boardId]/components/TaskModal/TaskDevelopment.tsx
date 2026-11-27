"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, GitBranch } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InfoBubble } from "@/components/Shared/InfoBubble/InfoBubble";
import { apiFetch } from "@/lib/apiClient";
import { copyToClipboard } from "@/lib/copyText";

type Development = {
  connected: boolean;
  ticketKey: string;
  command: string | null;
  branches: { name: string; url: string }[];
};

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
        <InfoBubble
          align="end"
          contentClassName="w-72"
          label={
            data.connected
              ? t("developmentHint")
              : `${t("developmentHint")} ${t("developmentConnect")}`
          }
        >
          <p>
            {t("developmentHint")}
            {!data.connected && (
              <>
                {" "}
                {t("developmentConnect")}{" "}
                <Link href="/dashboard/organizations" className="text-primary underline underline-offset-2">
                  {t("developmentOpenOrganizations")}
                </Link>
              </>
            )}
          </p>
        </InfoBubble>
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
