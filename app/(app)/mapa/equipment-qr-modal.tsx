"use client";

import { useEffect, useState } from "react";
import { composeQrImage } from "./qr-image";

export function EquipmentQrModal({
  equipmentId,
  label,
  onClose,
}: {
  equipmentId: string;
  label: string;
  onClose: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const reportUrl =
    typeof window !== "undefined" ? `${window.location.origin}/reportar/${equipmentId}` : "";

  useEffect(() => {
    if (!reportUrl) return;
    let cancelled = false;
    composeQrImage(reportUrl).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [reportUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-lg">
        <h2 className="mb-1 font-semibold text-text">Código QR</h2>
        <p className="mb-4 text-sm text-text-muted">{label}</p>

        <div className="flex items-center justify-center rounded-lg bg-white p-2">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`Código QR de ${label}`} className="h-auto w-full max-w-72" />
          ) : (
            <div className="flex h-72 w-72 items-center justify-center text-sm text-text-subtle">
              Generando...
            </div>
          )}
        </div>

        <p className="mt-3 break-all text-center text-xs text-text-subtle">{reportUrl}</p>

        <div className="mt-4 flex gap-2">
          {dataUrl && (
            <a
              href={dataUrl}
              download={`qr-${label.replace(/\s+/g, "-").toLowerCase()}.png`}
              className="h-11 flex-1 rounded-lg bg-primary text-center text-sm font-medium leading-11 text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Descargar PNG
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-border font-medium text-text transition-colors hover:bg-surface-muted"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
