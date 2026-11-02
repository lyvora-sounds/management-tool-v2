"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Trash2, FileText, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/apiClient";
import type { ApiAttachment, ApiError } from "@/lib/api/types";
import { looksInline, showAttachment } from "@/lib/openAttachment";
import { AttachmentsSkeleton } from "@/components/skeletons";
import { useBoardAccess } from "../BoardAccess";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) {
    return <ImageIcon size={15} className="shrink-0 text-blue-500" />;
  }
  return <FileText size={15} className="shrink-0 text-muted-foreground" />;
}

export type TaskAttachmentsHandle = {
  openFilePicker: () => void;
  uploading: boolean;
};

export const TaskAttachments = forwardRef<TaskAttachmentsHandle, { taskId: string }>(
  function TaskAttachments({ taskId }, ref) {
    const t = useTranslations("task");
    const [attachments, setAttachments] = useState<ApiAttachment[]>([]);
    const [uploading, setUploading] = useState(false);
    const [fetching, setFetching] = useState(true); // true = loading until first fetch completes
    const inputRef = useRef<HTMLInputElement>(null);
    const { canEdit } = useBoardAccess();

    useImperativeHandle(ref, () => ({
      openFilePicker: () => {
        if (canEdit) inputRef.current?.click();
      },
      uploading,
    }));

    useEffect(() => {
      apiFetch(`/api/tasks/${taskId}/attachments`)
        .then((r) => r.json())
        .then((data) => {
          setAttachments(Array.isArray(data) ? data : []);
          setFetching(false);
        })
        .catch(() => setFetching(false));
    }, [taskId]);

    const uploadFile = async (file: File) => {
      if (!canEdit) return;
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await apiFetch(`/api/tasks/${taskId}/attachments`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const attachment: ApiAttachment = await res.json();
          setAttachments((prev) => [...prev, attachment]);
        } else if (res.status === 413) {
          toast.error(t("attachmentTooLarge"));
        } else {
          const body: Partial<ApiError> | null = await res.json().catch(() => null);
          toast.error(body?.message ?? body?.error ?? t("attachmentUploadError"));
        }
      } catch {
        toast.error(t("attachmentUploadError"));
      }
      setUploading(false);
    };

    const handleFiles = (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach(uploadFile);
    };

    const handleDelete = async (attachmentId: string) => {
      if (!canEdit) return;
      const prev = attachments;
      setAttachments(prev.filter((a) => a.id !== attachmentId));
      const res = await apiFetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
        method: "DELETE",
      }).catch(() => null);
      if (!res?.ok) {
        setAttachments(prev);
        toast.error(t("attachmentDeleteError"));
      }
    };

    // The file is read through the API with the session token, so a plain link cannot open it: the browser asks
    // for it, then shows or saves what it got. The tab is opened first because a click allows it and a later
    // callback does not.
    const openAttachment = async (attachment: ApiAttachment) => {
      const tab = looksInline(attachment.filename) ? window.open("", "_blank") : null;
      try {
        const res = await apiFetch(`/api/tasks/${taskId}/attachments/${attachment.id}/download`);
        if (!(await showAttachment(res, attachment.filename, tab))) throw new Error(String(res.status));
      } catch {
        tab?.close();
        toast.error(t("attachmentOpenError"));
      }
    };

    return (
      <div className="flex flex-col gap-1">
        {canEdit && <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />}
        {fetching && <AttachmentsSkeleton count={2} />}
        {!fetching && attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition-colors"
          >
            {getFileIcon(attachment.filename)}
            <button
              type="button"
              onClick={() => openAttachment(attachment)}
              className="flex-1 min-w-0 text-left text-sm hover:underline truncate"
            >
              {attachment.filename}
            </button>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatBytes(attachment.size)}
            </span>
            {canEdit && <button
              onClick={() => handleDelete(attachment.id)}
              className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 size={13} />
            </button>}
          </div>
        ))}
      </div>
    );
  }
);
