"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Trash2, FileText, ImageIcon } from "lucide-react";
import type { AttachmentModel } from "@/lib/generated/prisma/models/Attachment";
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
    const [attachments, setAttachments] = useState<AttachmentModel[]>([]);
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
      fetch(`/api/tasks/${taskId}/attachments`)
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
      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const attachment = await res.json();
        setAttachments((prev) => [...prev, attachment]);
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
      const res = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) setAttachments(prev);
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
            <a
              href={`/api/tasks/${taskId}/attachments/${attachment.id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 text-sm hover:underline truncate"
            >
              {attachment.filename}
            </a>
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
