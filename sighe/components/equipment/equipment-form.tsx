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
import type { EquipmentFormState } from "@/app/(dashboard)/equipos/actions";
import { statusLabels } from "@/lib/equipment-status";
import type { EquipmentStatus } from "@/lib/supabase/database.types";

const initialState: EquipmentFormState = { error: null };

type EquipmentDefaults = {
  equipment_type_id?: string;
  code?: string;
  brand?: string;
  model?: string;
  serial_number?: string | null;
  status?: EquipmentStatus;
  assigned_user_id?: string | null;
  notes?: string | null;
};

export function EquipmentForm({
  action,
  equipmentTypes,
  profiles,
  defaultValues,
  submitLabel,
}: {
  action: (
    prevState: EquipmentFormState,
    formData: FormData,
  ) => Promise<EquipmentFormState>;
  equipmentTypes: { id: string; name: string }[];
  profiles: { id: string; full_name: string }[];
  defaultValues?: EquipmentDefaults;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Código</Label>
          <Input id="code" name="code" defaultValue={defaultValues?.code} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="equipment_type_id">Tipo de equipo</Label>
          <Select
            name="equipment_type_id"
            defaultValue={defaultValues?.equipment_type_id}
          >
            <SelectTrigger id="equipment_type_id" className="w-full">
              <SelectValue placeholder="Seleccioná un tipo" />
            </SelectTrigger>
            <SelectContent>
              {equipmentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" name="brand" defaultValue={defaultValues?.brand} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" name="model" defaultValue={defaultValues?.model} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="serial_number">Número de serie</Label>
          <Input
            id="serial_number"
            name="serial_number"
            defaultValue={defaultValues?.serial_number ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Estado</Label>
          <Select name="status" defaultValue={defaultValues?.status ?? "activo"}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assigned_user_id">Asignado a</Label>
        <Select
          name="assigned_user_id"
          defaultValue={defaultValues?.assigned_user_id ?? "none"}
        >
          <SelectTrigger id="assigned_user_id" className="w-full">
            <SelectValue placeholder="Sin asignar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin asignar</SelectItem>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Input id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
