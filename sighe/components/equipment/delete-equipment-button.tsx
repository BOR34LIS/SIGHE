"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteEquipment } from "@/app/(dashboard)/equipos/actions";

export function DeleteEquipmentButton({ id, code }: { id: string; code: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`¿Eliminar el equipo ${code}? Esta acción no se puede deshacer.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteEquipment(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Equipo eliminado.");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Eliminar equipo"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
