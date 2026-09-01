"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type InviteInfo = {
  email: string;
  boardTitle: string;
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
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
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
    const res = await fetch(`/api/invite/${token}`, { method: "POST" });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setAccepting(false);
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
            <h1 className="text-xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("invitedTo", { title: info?.boardTitle ?? "" })}
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
