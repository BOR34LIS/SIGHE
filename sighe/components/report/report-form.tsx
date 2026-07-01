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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { createPublicReport, type ReportFormState } from "@/app/q/[id]/actions";

const initialState: ReportFormState = { error: null, success: false };

export function ReportForm({ equipmentId }: { equipmentId: string }) {
  const action = (prevState: ReportFormState, formData: FormData) =>
    createPublicReport(equipmentId, prevState, formData);

  const [state, formAction, isPending] = useActionState(action, initialState);

  if (state.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reporte enviado</CardTitle>
          <CardDescription>
            Gracias, el equipo de soporte fue notificado y va a revisar el equipo.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportar una falla</CardTitle>
        <CardDescription>No necesitás cuenta para enviar este reporte.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">¿Qué problema tiene?</Label>
            <Input id="title" name="title" placeholder="Ej: No enciende" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Detalle (opcional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Más detalles si hace falta"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fault_type">Tipo de falla (opcional)</Label>
            <Select name="fault_type" defaultValue="none">
              <SelectTrigger id="fault_type" className="w-full">
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
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enviando…" : "Enviar reporte"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
