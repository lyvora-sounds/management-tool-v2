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
} from "lucide-react";
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

const PROVIDERS: {
  id: AiProvider;
  name: string;
  badge: string;
  description: string;
  keyPlaceholder: string;
}[] = [
  {
    id: "openai",
    name: "OpenAI",
    badge: "GPT-4o, GPT-4o-mini",
    description: "Modelos insignia de OpenAI con soporte multimodal y alta velocidad.",
    keyPlaceholder: "sk-proj-...",
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    badge: "Claude 3.5 / 3.7 Sonnet",
    description: "Excelente razonamiento, redacción detallada y seguimiento de instrucciones.",
    keyPlaceholder: "sk-ant-...",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "Gemini 2.0 Flash, 1.5 Pro",
    description: "Modelos rápidos y económicos con amplia ventana de contexto.",
    keyPlaceholder: "AIzaSy...",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    badge: "DeepSeek-V3 / R1 (Chat)",
    description: "Modelos de razonamiento de alto rendimiento a bajo coste.",
    keyPlaceholder: "sk-...",
  },
  {
    id: "grok",
    name: "xAI Grok",
    badge: "Grok 2",
    description: "Modelos avanzados de xAI con API compatible con OpenAI.",
    keyPlaceholder: "xai-...",
  },
  {
    id: "kimi",
    name: "Kimi / Moonshot AI",
    badge: "Moonshot-v1",
    description: "Modelos optimizados de Moonshot AI para procesamiento de lenguaje largo.",
    keyPlaceholder: "sk-...",
  },
  {
    id: "custom",
    name: "Personalizado / Ollama / Local",
    badge: "OpenAI-Compatible",
    description: "Cualquier servidor compatible con la API de OpenAI (Ollama, vLLM, LMStudio).",
    keyPlaceholder: "sk-...",
  },
];

export default function SettingsPage() {
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
    } catch (err) {
      toast.error("Error al cargar la configuración.");
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
        toast.success("Configuración guardada correctamente");
      } else {
        toast.error(data.error || "Error al guardar configuración");
      }
    } catch (err) {
      toast.error("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  const selectedProviderMeta = PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Ajustes de la cuenta
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configura tus claves personales de Inteligencia Artificial y preferencias de voz.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Configuration Card */}
        <div className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Proveedor de IA (BYOK)</h2>
                <p className="text-xs text-muted-foreground">
                  Tu API Key se almacena cifrada individualmente (AES-256) y se usa exclusivamente para tus peticiones.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck size={16} />
              <span>Cifrado personal</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Provider Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Proveedor de IA</Label>
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
                        <span className="font-medium">{p.name}</span>
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
                  {selectedProviderMeta.description}
                </p>
              )}
            </div>

            {/* Model Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Modelo</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={PROVIDER_DEFAULT_MODELS[provider]}
              />
              <p className="text-xs text-muted-foreground">
                Por defecto:{" "}
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
                <span>Clave API ({selectedProviderMeta?.name})</span>
              </Label>
              {hasApiKey && (
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>Clave activa configurada ({maskedApiKey})</span>
                </span>
              )}
            </div>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                hasApiKey
                  ? `Guardada (${maskedApiKey}). Escribe aquí para cambiarla`
                  : selectedProviderMeta?.keyPlaceholder || "Pega tu clave de API..."
              }
            />
            {!hasApiKey && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle size={13} />
                <span>
                  Necesitas configurar una clave API para usar &quot;Mejorar con IA&quot; y &quot;Brain Dump&quot;.
                </span>
              </p>
            )}
          </div>

          {/* Custom Base URL (if custom or needed) */}
          {(provider === "custom" || baseUrl) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Server size={14} />
                <span>Base URL / Endpoint personalizado</span>
              </Label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434 o https://mi-proxy-ia.com"
              />
              <p className="text-xs text-muted-foreground">
                URL base para servidores locales u endpoints personalizados compatibles con OpenAI.
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
              <h2 className="text-lg font-semibold">Idioma y Reconocimiento de Voz</h2>
              <p className="text-xs text-muted-foreground">
                Idioma preferido para dictar tareas y notas por voz.
              </p>
            </div>
          </div>

          <div className="space-y-2 max-w-sm">
            <Label className="text-sm font-medium">Idioma de voz por defecto</Label>
            <Select
              value={voiceLanguage}
              onValueChange={(v) => setVoiceLanguage(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es-ES">🇪🇸 Español (es-ES)</SelectItem>
                <SelectItem value="en-US">🇺🇸 English (en-US)</SelectItem>
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
            <span>Guardar cambios</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
