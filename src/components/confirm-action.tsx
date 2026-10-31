"use client";
import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { SaveStatus } from "./save-status";
export function ConfirmAction({
  label,
  title,
  description,
  onConfirm,
  disabled,
  busy,
  message = "",
}: {
  label: string;
  title: string;
  description: string;
  onConfirm: () => Promise<boolean>;
  disabled?: boolean;
  busy: boolean;
  message?: string;
}) {
  const [open, setOpen] = useState(false),
    [attempted, setAttempted] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) {
          setOpen(v);
          if (v) setAttempted(false);
        }
      }}
    >
      <DialogTrigger
        data-confirm-action="true"
        render={<Button disabled={disabled || busy} />}
      >
        {label}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {attempted && <SaveStatus busy={busy} message={message} />}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={busy} />}>
            Volver a revisar
          </DialogClose>
          <Button
            disabled={busy}
            onClick={async () => {
              setAttempted(true);
              if (await onConfirm()) setOpen(false);
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
