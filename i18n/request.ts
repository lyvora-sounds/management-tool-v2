import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from "./routing";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const headerLocale = localeFromAcceptLanguage(headerStore.get("accept-language"));

  const locale: Locale = isLocale(cookieLocale)
    ? cookieLocale
    : (headerLocale ?? defaultLocale);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
