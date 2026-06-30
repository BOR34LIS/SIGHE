"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  createTicketForEquipment,
  type ReportTicketState,
} from "@/app/(dashboard)/equipos/actions";

const initialState: ReportTicketState = { error: null, success: false };

export function ReportTicketForm({ equipmentId }: { equipmentId: string }) {
  const action = (prevState: ReportTicketState, formData: FormData) =>
    createTicketForEquipment(equipmentId, prevState, formData);

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticket-title">¿Qué problema tiene?</Label>
        <Input id="ticket-title" name="title" placeholder="Ej: No enciende" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticket-description">Detalle (opcional)</Label>
        <Input
          id="ticket-description"
          name="description"
          placeholder="Más detalles si hace falta"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticket-fault_type">Tipo de falla (opcional)</Label>
        <Select name="fault_type" defaultValue="none">
          <SelectTrigger id="ticket-fault_type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No estoy seguro</SelectItem>
            <SelectItem value="hardware">Hardware</SelectItem>
            <SelectItem value="software">Software</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-600">Reporte enviado correctamente.</p>
      )}
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Enviando…" : "Reportar falla"}
      </Button>
    </form>
  );
}
