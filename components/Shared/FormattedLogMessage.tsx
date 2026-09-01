"use client";

import { useTranslations } from "next-intl";
import { formatLogMessage } from "@/lib/activityMessages";

export function FormattedLogMessage({ message }: { message: string }) {
  const t = useTranslations();
  return <>{formatLogMessage(message, t)}</>;
}
