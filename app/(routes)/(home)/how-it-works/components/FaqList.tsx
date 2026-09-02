"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ } from "../data";

export function FaqList() {
  const t = useTranslations("howItWorks.faq");
  const [open, setOpen] = useState<string | null>(FAQ[0]);

  return (
    <div className="divide-y rounded-2xl border bg-card">
      {FAQ.map((key) => {
        const isOpen = open === key;
        return (
          <div key={key}>
            <button
              onClick={() => setOpen(isOpen ? null : key)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50 cursor-pointer"
            >
              <span className="flex-1 text-sm font-medium">{t(`${key}.q`)}</span>
              <Plus
                size={16}
                className={cn(
                  "shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-45"
                )}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                    {t(`${key}.a`)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
