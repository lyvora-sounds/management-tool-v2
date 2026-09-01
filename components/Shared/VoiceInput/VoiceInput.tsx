"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  defaultLang?: "es-ES" | "en-US";
  className?: string;
}

export function VoiceInput({
  onTranscript,
  defaultLang = "es-ES",
  className = "",
}: VoiceInputProps) {
  const t = useTranslations("voice");
  const [recording, setRecording] = useState(false);
  const [lang, setLang] = useState<"es-ES" | "en-US">(defaultLang);
  const [transcribing, setTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleLanguage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (recording) return;
    const next = lang === "es-ES" ? "en-US" : "es-ES";
    setLang(next);
    toast.info(
      t("langToast", {
        label: next === "es-ES" ? t("spanishLabel") : t("englishLabel"),
      }),
    );
  };

  const startBrowserRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = lang;

        rec.onresult = (e: any) => {
          const results = Array.from(e.results);
          const transcript = results
            .map((r: any) => r[0].transcript)
            .join(" ")
            .trim();
          if (transcript) {
            onTranscript(transcript);
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition error:", e.error);
          if (e.error === "not-allowed") {
            toast.error(t("micDenied"));
          }
          setRecording(false);
        };

        rec.onend = () => {
          setRecording(false);
        };

        rec.start();
        recognitionRef.current = rec;
        setRecording(true);
        return true;
      } catch (err) {
        console.warn("Error starting Web Speech API, fallback to audio recording:", err);
      }
    }
    return false;
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 100) {
          await sendAudioToApi(audioBlob);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      toast.error(t("micUnavailable"));
      setRecording(false);
    }
  };

  const sendAudioToApi = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      formData.append("language", lang === "es-ES" ? "es" : "en");

      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.text) {
        onTranscript(data.text);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(t("transcribeError"));
    } finally {
      setTranscribing(false);
    }
  };

  const start = () => {
    const startedWebSpeech = startBrowserRecognition();
    if (!startedWebSpeech) {
      startAudioRecording();
    }
  };

  const stop = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Button
        type="button"
        variant={recording ? "destructive" : "outline"}
        size="sm"
        onClick={recording ? stop : start}
        disabled={transcribing}
        className={`h-8 gap-1.5 px-2.5 text-xs transition-all ${
          recording ? "animate-pulse" : ""
        }`}
      >
        {transcribing ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            <span>{t("transcribing")}</span>
          </>
        ) : recording ? (
          <>
            <Square size={12} className="fill-current" />
            <span>{t("stop")}</span>
          </>
        ) : (
          <>
            <Mic size={13} />
            <span>{t("voice")}</span>
          </>
        )}
      </Button>

      <button
        type="button"
        onClick={toggleLanguage}
        disabled={recording || transcribing}
        title={t("changeLanguage", {
          label: lang === "es-ES" ? t("spanishLabel") : t("englishLabel"),
        })}
        className="h-8 px-2 text-[11px] font-semibold rounded-md border border-input bg-background hover:bg-muted text-muted-foreground flex items-center gap-1 transition-colors"
      >
        <Globe size={11} />
        <span>{lang === "es-ES" ? "ES" : "EN"}</span>
      </button>
    </div>
  );
}
