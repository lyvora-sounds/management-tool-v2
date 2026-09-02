"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CreateBoardStepper } from "./CreateBoardStepper";

export function CreateBoardModal() {
  const t = useTranslations("boards");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger data-guide="create-board" render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        {t("create")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createNew")}</DialogTitle>
        </DialogHeader>
        <CreateBoardStepper onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
