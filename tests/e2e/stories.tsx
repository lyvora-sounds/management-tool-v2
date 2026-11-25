import { NextIntlClientProvider } from "next-intl";
import { AccessDeniedNotice } from "@/app/(routes)/(dashboard)/dashboard/components/AccessDeniedNotice/AccessDeniedNotice";
import { TaskShareModal } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskShareModal/TaskShareModal";
import { SignUpConsentGate } from "@/app/(auth)/sign-up/[[...sign-up]]/SignUpConsentGate";
import { CookieBanner } from "@/components/CookieBanner";
import { HomeFooter } from "@/components/Shared/HomeFooter/HomeFooter";
import en from "@/messages/en.json";

export function ShareStory() {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      <TaskShareModal boardId="board-1" taskId="task-1" taskTitle="Checkout" open onClose={() => {}} />
    </NextIntlClientProvider>
  );
}

export function AccessDeniedStory() {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      <div style={{ padding: 24 }}>
        <AccessDeniedNotice />
      </div>
    </NextIntlClientProvider>
  );
}

export function CookieConsentStory() {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      <div className="min-h-screen flex flex-col justify-end">
        <CookieBanner />
        <HomeFooter />
      </div>
    </NextIntlClientProvider>
  );
}

export function SignUpConsentStory() {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      <div style={{ padding: 24 }}>
        <SignUpConsentGate>
          <div data-testid="clerk-signup-widget">Clerk SignUp Widget</div>
        </SignUpConsentGate>
      </div>
    </NextIntlClientProvider>
  );
}
