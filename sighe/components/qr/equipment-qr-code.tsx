"use client";

import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EquipmentQrCode({ url, code }: { url: string; code: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">Código: {code}</p>
      <div className="rounded-lg border bg-white p-4">
        <QRCodeSVG value={url} size={180} />
      </div>
      <p className="max-w-[220px] text-center text-xs break-all text-muted-foreground">
        {url}
      </p>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="size-4" />
        Imprimir
      </Button>
    </div>
  );
}
