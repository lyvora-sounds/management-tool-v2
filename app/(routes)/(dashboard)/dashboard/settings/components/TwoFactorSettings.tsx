"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, QrCode, ShieldCheck, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Status = {
  email: string;
  emailEnabled: boolean;
  phone: string | null;
  phoneEnabled: boolean;
  totpEnabled: boolean;
};

type Setup =
  | { kind: "idle" }
  | { kind: "email-code" }
  | { kind: "phone" }
  | { kind: "phone-code"; phone: string }
  | { kind: "totp"; secret: string; qr: string };

async function postSecurity(body: Record<string, string>) {
  const res = await fetch("/api/settings/security", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function TwoFactorSettings() {
  const t = useTranslations("settings");
  const [status, setStatus] = useState<Status | null>(null);
  const [setup, setSetup] = useState<Setup>({ kind: "idle" });
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/settings/security")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStatus(data);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, []);

  function explain(errorCode: string) {
    if (errorCode === "invalid_phone") return t("mfaInvalidPhone");
    if (errorCode === "too_many") return t("mfaTooMany");
    if (errorCode === "send_failed") return t("mfaSendFailed");
    if (errorCode === "too_soon") return t("mfaTooSoon");
    return t("mfaInvalidCode");
  }

  async function run(body: Record<string, string>, onOk?: (data: Record<string, unknown>) => void) {
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await postSecurity(body);
      if (!ok) {
        setError(explain(String(data.error ?? "")));
        return;
      }
      if (data.emailEnabled !== undefined || data.totpEnabled !== undefined) {
        setStatus(data as Status);
      }
      onOk?.(data);
    } catch {
      setError(t("mfaSendFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (!status) {
    return (
      <div className="rounded-xl border bg-card p-6 flex justify-center">
        {failed ? (
          <p className="text-sm text-destructive">{t("loadError")}</p>
        ) : (
          <Loader2 className="animate-spin text-muted-foreground" size={22} />
        )}
      </div>
    );
  }

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("mfaTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("mfaDesc")}</p>
          </div>
        </div>
      </div>

      <FactorRow
        icon={<Mail size={16} />}
        title={t("mfaEmail")}
        detail={status.emailEnabled ? t("mfaEmailOn") : t("mfaEmailDesc", { email: status.email })}
        enabled={status.emailEnabled}
        actionLabel={status.emailEnabled ? t("mfaDisable") : t("mfaSetUp")}
        disabled={busy}
        onAction={() => {
          setError("");
          setCode("");
          if (status.emailEnabled) {
            void run({ action: "email-disable" }, () => setSetup({ kind: "idle" }));
          } else {
            void run({ action: "email-send" }, () => setSetup({ kind: "email-code" }));
          }
        }}
      >
        {setup.kind === "email-code" && !status.emailEnabled && (
          <CodeForm
            hint={t("mfaCodeSent", { email: status.email })}
            code={code}
            placeholder={t("mfaCodePlaceholder")}
            busy={busy}
            confirmLabel={t("mfaVerify")}
            cancelLabel={t("mfaCancel")}
            onCode={setCode}
            onCancel={() => setSetup({ kind: "idle" })}
            onConfirm={() =>
              void run({ action: "email-verify", code }, () => {
                setSetup({ kind: "idle" });
                setCode("");
              })
            }
          />
        )}
      </FactorRow>

      <FactorRow
        icon={<Smartphone size={16} />}
        title={t("mfaPhone")}
        detail={
          status.phoneEnabled && status.phone
            ? t("mfaPhoneOn", { phone: status.phone })
            : t("mfaPhoneDesc")
        }
        enabled={status.phoneEnabled}
        actionLabel={status.phoneEnabled ? t("mfaDisable") : t("mfaSetUp")}
        disabled={busy}
        onAction={() => {
          setError("");
          setCode("");
          if (status.phoneEnabled) {
            void run({ action: "phone-disable" }, () => setSetup({ kind: "idle" }));
          } else {
            setPhone("");
            setSetup({ kind: "phone" });
          }
        }}
      >
        {setup.kind === "phone" && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={t("mfaPhonePlaceholder")}
              autoComplete="tel"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={busy || !phone.trim()}
                onClick={() =>
                  void run({ action: "phone-send", phone }, (data) =>
                    setSetup({ kind: "phone-code", phone: String(data.phone ?? phone) }),
                  )
                }
              >
                {t("mfaSendCode")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setSetup({ kind: "idle" })}>
                {t("mfaCancel")}
              </Button>
            </div>
          </div>
        )}
        {setup.kind === "phone-code" && (
          <CodeForm
            hint={t("mfaCodeSentPhone", { email: status.email, phone: setup.phone })}
            code={code}
            placeholder={t("mfaCodePlaceholder")}
            busy={busy}
            confirmLabel={t("mfaVerify")}
            cancelLabel={t("mfaCancel")}
            onCode={setCode}
            onCancel={() => setSetup({ kind: "idle" })}
            onConfirm={() =>
              void run({ action: "phone-verify", code }, () => {
                setSetup({ kind: "idle" });
                setCode("");
              })
            }
          />
        )}
      </FactorRow>

      <FactorRow
        icon={<QrCode size={16} />}
        title={t("mfaTotp")}
        detail={status.totpEnabled ? t("mfaTotpOn") : t("mfaTotpDesc")}
        enabled={status.totpEnabled}
        actionLabel={status.totpEnabled ? t("mfaDisable") : t("mfaSetUp")}
        disabled={busy}
        onAction={() => {
          setError("");
          setCode("");
          if (status.totpEnabled) {
            void run({ action: "totp-disable" }, () => setSetup({ kind: "idle" }));
          } else {
            void run({ action: "totp-start" }, (data) =>
              setSetup({
                kind: "totp",
                secret: String(data.secret ?? ""),
                qr: String(data.qr ?? ""),
              }),
            );
          }
        }}
      >
        {setup.kind === "totp" && !status.totpEnabled && (
          <div className="mt-3 space-y-3">
            {setup.qr && (
              // The QR is a local data URL, so the image optimizer cannot fetch it.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={setup.qr}
                alt={t("mfaTotp")}
                width={220}
                height={220}
                className="rounded-lg border bg-white p-2"
              />
            )}
            <p className="text-xs text-muted-foreground">{t("mfaSecret")}</p>
            <code className="block text-xs break-all bg-muted px-2 py-1.5 rounded">{setup.secret}</code>
            <CodeForm
              hint=""
              code={code}
              placeholder={t("mfaCodePlaceholder")}
              busy={busy}
              confirmLabel={t("mfaVerify")}
              cancelLabel={t("mfaCancel")}
              onCode={setCode}
              onCancel={() => setSetup({ kind: "idle" })}
              onConfirm={() =>
                void run({ action: "totp-verify", code }, () => {
                  setCode("");
                  setSetup({ kind: "idle" });
                })
              }
            />
          </div>
        )}
      </FactorRow>

      {error && <p className="px-6 py-3 text-xs text-destructive">{error}</p>}
    </section>
  );
}

function FactorRow({
  icon,
  title,
  detail,
  enabled,
  actionLabel,
  disabled,
  onAction,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  enabled: boolean;
  actionLabel: string;
  disabled: boolean;
  onAction: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-4 border-b last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 text-muted-foreground">{icon}</div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant={enabled ? "outline" : "default"}
          disabled={disabled}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </div>
      {children}
    </div>
  );
}

function CodeForm({
  hint,
  code,
  placeholder,
  busy,
  confirmLabel,
  cancelLabel,
  onCode,
  onConfirm,
  onCancel,
}: {
  hint: string;
  code: string;
  placeholder: string;
  busy: boolean;
  confirmLabel: string;
  cancelLabel: string;
  onCode: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm();
      }}
    >
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={code}
          onChange={(event) => onCode(event.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={placeholder}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={busy || code.trim().length < 6}>
            {busy ? <Loader2 className="animate-spin" size={14} /> : confirmLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
