"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Key,
  Globe,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Server,
  ShieldCheck,
  UserCog,
  SlidersHorizontal,
} from "lucide-react";
import { UserProfile } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  AiProvider,
  PROVIDER_BASE_URLS,
  PROVIDER_DEFAULT_MODELS,
} from "@/lib/ai/types";
import { CustomFieldsSettings } from "./components/CustomFieldsSettings";

const PROVIDERS: {
  id: AiProvider;
  name: string;
  badge: string;
  descriptionKey:
    | "providerOpenaiDesc"
    | "providerClaudeDesc"
    | "providerGeminiDesc"
    | "providerDeepseekDesc"
    | "providerGrokDesc"
    | "providerKimiDesc"
    | "providerCustomDesc";
  keyPlaceholder: string;
}[] = [
  {
    id: "openai",
    name: "OpenAI",
    badge: "GPT-4o, GPT-4o-mini",
    descriptionKey: "providerOpenaiDesc",
    keyPlaceholder: "sk-proj-...",
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    badge: "Claude 3.5 / 3.7 Sonnet",
    descriptionKey: "providerClaudeDesc",
    keyPlaceholder: "sk-ant-...",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "Gemini 2.0 Flash, 1.5 Pro",
    descriptionKey: "providerGeminiDesc",
    keyPlaceholder: "AIzaSy...",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    badge: "DeepSeek-V3 / R1 (Chat)",
    descriptionKey: "providerDeepseekDesc",
    keyPlaceholder: "sk-...",
  },
  {
    id: "grok",
    name: "xAI Grok",
    badge: "Grok 2",
    descriptionKey: "providerGrokDesc",
    keyPlaceholder: "xai-...",
  },
  {
    id: "kimi",
    name: "Kimi / Moonshot AI",
    badge: "Moonshot-v1",
    descriptionKey: "providerKimiDesc",
    keyPlaceholder: "sk-...",
  },
  {
    id: "custom",
    name: "Custom / Ollama / Local",
    badge: "OpenAI-Compatible",
    descriptionKey: "providerCustomDesc",
    keyPlaceholder: "sk-...",
  },
];

type SettingsTab = "account" | "ai" | "custom-fields";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [provider, setProvider] = useState<AiProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [maskedApiKey, setMaskedApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("es-ES");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/ai");
      if (res.ok) {
        const data = await res.json();
        setProvider(data.provider || "openai");
        setHasApiKey(data.hasApiKey);
        setMaskedApiKey(data.maskedApiKey || "");
        setModel(data.model || PROVIDER_DEFAULT_MODELS[data.provider as AiProvider] || "");
        setBaseUrl(data.baseUrl || "");
        setVoiceLanguage(data.voiceLanguage || "es-ES");
      }
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (newProvider: AiProvider) => {
    setProvider(newProvider);
    setModel(PROVIDER_DEFAULT_MODELS[newProvider] || "");
    if (newProvider !== "custom") {
      setBaseUrl(PROVIDER_BASE_URLS[newProvider] || "");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || (hasApiKey ? maskedApiKey : ""),
          model: model.trim() || PROVIDER_DEFAULT_MODELS[provider],
          baseUrl: baseUrl.trim() || null,
          voiceLanguage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setHasApiKey(data.hasApiKey);
        setMaskedApiKey(data.maskedApiKey);
        setApiKey("");
        toast.success(t("saveSuccess"));
      } else {
        toast.error(data.error || t("saveError"));
      }
    } catch {
      toast.error(tCommon("connectionError"));
    } finally {
      setSaving(false);
    }
  };

  const selectedProviderMeta = PROVIDERS.find((p) => p.id === provider);
  const providerName =
    selectedProviderMeta?.id === "custom"
      ? t("providerCustom")
      : selectedProviderMeta?.name;

  const TABS: { id: SettingsTab; label: string; icon: typeof UserCog }[] = [
    { id: "account", label: t("tabAccount"), icon: UserCog },
    { id: "ai", label: t("tabAi"), icon: Sparkles },
    { id: "custom-fields", label: t("tabCustomFields"), icon: SlidersHorizontal },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex border-b overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 py-3 px-4 text-sm font-semibold border-b-2 transition-colors shrink-0 ${
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Cuenta: perfil, email, contraseña y sesiones, gestionado por Clerk */}
      {activeTab === "account" && (
        <div className="flex justify-center [&_.cl-rootBox]:w-full [&_.cl-cardBox]:w-full [&_.cl-cardBox]:max-w-none [&_.cl-cardBox]:shadow-none">
          <UserProfile routing="hash" />
        </div>
      )}

      {/* Custom Fields Settings */}
      {activeTab === "custom-fields" && (
        <CustomFieldsSettings />
      )}


      {/* La configuración de IA se carga por fetch; la pestaña de cuenta no la
          necesita, así que el spinner se queda acotado aquí. */}
      {activeTab === "ai" && loading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      )}

      {activeTab === "ai" && !loading && (
      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Configuration Card */}
        <div className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t("aiProviderTitle")}</h2>
                <p className="text-xs text-muted-foreground">
                  {t("aiProviderDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck size={16} />
              <span>{t("personalEncryption")}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Provider Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("aiProvider")}</Label>
              <Select
                value={provider}
                onValueChange={(v) => handleProviderChange(v as AiProvider)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">
                          {p.id === "custom" ? t("providerCustom") : p.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {p.badge}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProviderMeta && (
                <p className="text-xs text-muted-foreground">
                  {t(selectedProviderMeta.descriptionKey)}
                </p>
              )}
            </div>

            {/* Model Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("model")}</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={PROVIDER_DEFAULT_MODELS[provider]}
              />
              <p className="text-xs text-muted-foreground">
                {t("modelDefault")}{" "}
                <code className="text-[11px] bg-muted px-1 py-0.5 rounded">
                  {PROVIDER_DEFAULT_MODELS[provider]}
                </code>
              </p>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Key size={14} />
                <span>{t("apiKey", { name: providerName ?? "" })}</span>
              </Label>
              {hasApiKey && (
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>{t("keyActive", { masked: maskedApiKey })}</span>
                </span>
              )}
            </div>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                hasApiKey
                  ? t("keyPlaceholderChange", { masked: maskedApiKey })
                  : selectedProviderMeta?.keyPlaceholder || t("keyPlaceholder")
              }
            />
            {!hasApiKey && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle size={13} />
                <span>
                  {t("keyNeeded")}
                </span>
              </p>
            )}
          </div>

          {/* Custom Base URL (if custom or needed) */}
          {(provider === "custom" || baseUrl) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Server size={14} />
                <span>{t("customEndpoint")}</span>
              </Label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={t("customEndpointPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">
                {t("customEndpointHint")}
              </p>
            </div>
          )}
        </div>

        {/* Voice & Speech Preferences */}
        <div className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t("voiceTitle")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("voiceDesc")}
              </p>
            </div>
          </div>

          <div className="space-y-2 max-w-sm">
            <Label className="text-sm font-medium">{t("voiceLanguage")}</Label>
            <Select
              value={voiceLanguage}
              onValueChange={(v) => setVoiceLanguage(v ?? "es-ES")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es-ES">🇪🇸 {tCommon("spanish")} (es-ES)</SelectItem>
                <SelectItem value="en-US">🇺🇸 {tCommon("english")} (en-US)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2 px-6">
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{t("saveChanges")}</span>
          </Button>
        </div>
      </form>
      )}
    </div>
  );
}
