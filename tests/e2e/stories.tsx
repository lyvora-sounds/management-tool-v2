import { NextIntlClientProvider } from "next-intl";
import { AccessDeniedNotice } from "@/app/(routes)/(dashboard)/dashboard/components/AccessDeniedNotice/AccessDeniedNotice";
import { TaskShareModal } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskShareModal/TaskShareModal";
import { SignUpConsentGate } from "@/app/(auth)/sign-up/[[...sign-up]]/SignUpConsentGate";
import { CookieBanner } from "@/components/CookieBanner";
import { HomeFooter } from "@/components/Shared/HomeFooter/HomeFooter";
import { AppearanceSettings } from "@/app/(routes)/(dashboard)/dashboard/settings/components/AppearanceSettings";
import { TwoFactorSettings } from "@/app/(routes)/(dashboard)/dashboard/settings/components/TwoFactorSettings";
import { TaskComments } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskComments/TaskComments";
import { BoardAccessProvider } from "@/app/(routes)/(dashboard)/board/[boardId]/components/BoardAccess";
import { PriorityMark } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskPriority/PriorityMark";
import { PRIORITIES } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskPriority/TaskPriority.constants";
import { AddPropertyMenu } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskModal/AddPropertyMenu";
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

export function TwoFactorSettingsStory() {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      <div style={{ padding: 24, maxWidth: 720 }}>
        <TwoFactorSettings />
      </div>
    </NextIntlClientProvider>
  );
}

export function AppearanceSettingsStory() {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      <div style={{ padding: 24, maxWidth: 720 }}>
        <AppearanceSettings />
      </div>
    </NextIntlClientProvider>
  );
}

export function TaskCommentsStory({ onCount }: { onCount?: (count: number) => void }) {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      <BoardAccessProvider canEdit>
        <div style={{ height: 520, width: 420, display: "flex", flexDirection: "column" }}>
          <TaskComments taskId="task-1" members={[]} onCountChange={onCount} />
        </div>
      </BoardAccessProvider>
    </NextIntlClientProvider>
  );
}

export function PriorityMarksStory() {
  return (
    <div style={{ padding: 24, display: "flex", gap: 16 }}>
      {PRIORITIES.map((priority) => (
        <PriorityMark key={priority.value} priority={priority} label={priority.label} />
      ))}
    </div>
  );
}

export function AddPropertyStory({ items = true, onSelect }: { items?: boolean; onSelect?: (key: string) => void }) {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      <div style={{ padding: 24 }} data-testid="host">
        <AddPropertyMenu
          items={
            items
              ? [
                  { key: "labels", label: "Labels", icon: null, group: "ticket" },
                  { key: "cf:1", label: "Story points", icon: null, group: "custom" },
                ]
              : []
          }
          onSelect={(key) => onSelect?.(key)}
        />
      </div>
    </NextIntlClientProvider>
  );
}
