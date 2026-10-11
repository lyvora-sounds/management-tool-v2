"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LiquidGlassEngine } from "./LiquidGlassEngine";
import {
  APPEARANCE_COOKIE,
  DEFAULT_APPEARANCE,
  isDarkResolved,
  sanitizeAppearance,
  type Appearance,
} from "@/lib/appearance";

export type AppearancePatch = Partial<Omit<Appearance, "card">> & {
  card?: Partial<Appearance["card"]>;
};

type AppearanceContextValue = {
  appearance: Appearance;
  update: (patch: AppearancePatch) => void;
  reset: () => void;
};

const AppearanceContext = createContext<AppearanceContextValue>({
  appearance: DEFAULT_APPEARANCE,
  update: () => {},
  reset: () => {},
});

export function useAppearance() {
  return useContext(AppearanceContext);
}

const SAVE_DEBOUNCE_MS = 400;

// Safari y Firefox no admiten filtros SVG en backdrop-filter.
function supportsLens() {
  return (
    typeof CSS !== "undefined" &&
    /Chrome\//.test(navigator.userAgent) &&
    CSS.supports("backdrop-filter", "url(#kiki-lens-test)")
  );
}

function writeCookie(appearance: Appearance) {
  try {
    document.cookie = `${APPEARANCE_COOKIE}=${encodeURIComponent(
      JSON.stringify(appearance),
    )}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Sin cookie solo se pierde el pintado sin parpadeo en la siguiente carga.
  }
}

// Se monta únicamente en el layout de la app (dashboard y tableros). Al
// desmontarse deja <html> como estaba, así las páginas públicas conservan
// siempre el tema original.
export function AppearanceProvider({
  initial,
  children,
}: {
  initial: unknown;
  children: React.ReactNode;
}) {
  const t = useTranslations("settings");
  const [appearance, setAppearance] = useState<Appearance>(() =>
    sanitizeAppearance(initial),
  );
  const [lens, setLens] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      root.classList.toggle("dark", isDarkResolved(appearance.mode, media.matches));
      root.dataset.accent = appearance.accent;
      root.dataset.density = appearance.density;
      root.dataset.style = appearance.style;
      const lensOn = appearance.style === "glass" && supportsLens();
      if (lensOn) root.dataset.lens = "on";
      else delete root.dataset.lens;
      setLens(lensOn);
      if (appearance.gradients) delete root.dataset.gradients;
      else root.dataset.gradients = "off";
    };
    apply();

    if (appearance.mode === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [appearance.mode, appearance.accent, appearance.density, appearance.style, appearance.gradients]);

  useEffect(() => {
    const root = document.documentElement;
    return () => {
      root.classList.remove("dark");
      delete root.dataset.accent;
      delete root.dataset.density;
      delete root.dataset.style;
      delete root.dataset.lens;
      delete root.dataset.gradients;
    };
  }, []);

  const persist = useCallback(
    (next: Appearance) => {
      writeCookie(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/settings/appearance", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          });
          if (!res.ok) throw new Error(String(res.status));
        } catch {
          toast.error(t("appearanceSaveError"));
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [t],
  );

  const update = useCallback(
    (patch: AppearancePatch) => {
      setAppearance((prev) => {
        const next = sanitizeAppearance({
          ...prev,
          ...patch,
          card: { ...prev.card, ...patch.card },
        });
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const reset = useCallback(() => {
    setAppearance(DEFAULT_APPEARANCE);
    persist(DEFAULT_APPEARANCE);
  }, [persist]);

  const value = useMemo(
    () => ({ appearance, update, reset }),
    [appearance, update, reset],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {lens && <LiquidGlassEngine />}
      {children}
    </AppearanceContext.Provider>
  );
}
