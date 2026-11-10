"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiClient";

type InviteInfo = {
  email: string;
  kind: "board" | "organization";
  boardTitle: string | null;
  organizationName: string | null;
  role: string | null;
  status: string;
  expired: boolean;
};

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const t = useTranslations("invite");
  const tCommon = useTranslations("common");

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    apiFetch(`/api/invite/${token}`)
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!ok) setError(data.message ?? data.error);
        else setInfo(data);
      })
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
  }, [token, t]);

  const handleAccept = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/invite/${token}`);
      return;
    }
    setAccepting(true);
    const res = await apiFetch(`/api/invite/${token}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? data.error);
      setAccepting(false);
    } else if (data.organizationId) {
      router.push("/dashboard/organizations");
    } else {
      router.push(`/board/${data.boardId}`);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{tCommon("loading")}</p>
      </div>
    );
  }

  const targetTitle =
    info?.kind === "organization"
      ? (info.organizationName ?? "")
      : (info?.boardTitle ?? "");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm flex flex-col gap-4">
        {error ? (
          <>
            <h1 className="text-xl font-bold">{t("invalid")}</h1>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button onClick={() => router.push("/dashboard/boards")}>
              {t("goHome")}
            </Button>
          </>
        ) : info?.expired ? (
          <>
            <h1 className="text-xl font-bold">{t("expired")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("expiredBody")}
            </p>
          </>
        ) : info?.status !== "pending" ? (
          <>
            <h1 className="text-xl font-bold">{t("used")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("usedBody")}
            </p>
            <Button onClick={() => router.push("/dashboard/boards")}>
              {t("goHome")}
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold">
              {info.kind === "organization" ? t("organizationTitle") : t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {info.kind === "organization"
                ? t("invitedToOrganization", { title: targetTitle })
                : t("invitedTo", { title: targetTitle })}
            </p>
            {!isSignedIn && (
              <p className="text-xs text-muted-foreground">
                {t("needSignIn", { email: info?.email ?? "" })}
              </p>
            )}
            <Button onClick={handleAccept} disabled={accepting}>
              {accepting ? t("accepting") : t("accept")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
