import { NextIntlClientProvider } from "next-intl";
import { AccessDeniedNotice } from "@/app/(routes)/(dashboard)/dashboard/components/AccessDeniedNotice/AccessDeniedNotice";
import { TaskShareModal } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskShareModal/TaskShareModal";
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
