"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/Shared/ModalDeleteConfirmation/ModalDeleteConfirmation";
import { SidebarUserFooterProps } from "./SidebarUserFooter.types";

export function SidebarUserFooter({ name, email, imageUrl }: SidebarUserFooterProps) {
  const { signOut } = useClerk();
  const router = useRouter();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const handleSignOut = () => {
    signOut(() => router.push("/"));
  };

  return (
    <>
      <ConfirmModal
        open={confirmSignOut}
        title="Cerrar sesión"
        description="¿Seguro que quieres cerrar sesión?"
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />

      <div className="flex items-center gap-1">
        {/* Los datos de la cuenta se editan en Ajustes, no en un modal aparte */}
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 flex-1 min-w-0 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name ?? email}
                width={32}
                height={32}
                className="object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">
                {(name ?? email).charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {name && <p className="text-sm font-medium truncate">{name}</p>}
            <p
              className={`truncate text-muted-foreground ${name ? "text-xs" : "text-sm"}`}
            >
              {email}
            </p>
          </div>
        </Link>

        <button
          onClick={() => setConfirmSignOut(true)}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </>
  );
}
