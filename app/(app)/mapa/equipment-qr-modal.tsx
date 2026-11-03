// Genera una imagen (canvas) con la libreria "qrcode" y maneja eventos de
"use client";

import { useEffect, useState } from "react";
import { composeQrImage } from "./qr-image";

export function EquipmentQrModal({
  // Id del equipo: se codifica dentro de la URL del QR, no se muestra.
  equipmentId,
  // Nombre del equipo, solo para mostrarlo en el modal y nombrar el PNG.
  label,
  // Cierra el modal (lo decide el padre, igual que en EquipmentDetailPanel).
  onClose,
}: {
  equipmentId: string;
  label: string;
  onClose: () => void;
}) {
  // La imagen final (mensaje + QR ya compuestos) como data URL. Empieza en
  // null mientras se genera, para poder mostrar "Generando..." mientras tanto.
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  // window solo existe en el navegador, en el primer render del lado del
  // servidor (SSR) no esta disponible, por eso el chequeo typeof window,
  // este modal nunca se renderiza en el servidor (solo
  // aparece tras un clic), pero el chequeo evita un posible error si algo
  // cambiara eso mas adelante.
  const reportUrl =
    typeof window !== "undefined" ? `${window.location.origin}/reportar/${equipmentId}` : "";

  useEffect(() => {
    if (!reportUrl) return;
    // Si el componente se desmonta antes de que composeQrImage termine, no
    // queremos llamar a setDataUrl (porque el componente ya no existe y eso
    // daria error). La variable "cancelled" sirve para avisar a la promesa
    // de que ignore su resultado si el componente se desmonta antes de que
    // termine.
    let cancelled = false;
    composeQrImage(reportUrl, label).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    // Funcion de limpieza: React la llama si el efecto se vuelve a correr o
    // el componente se desmonta antes de que termine la promesa de arriba.
    return () => {
      cancelled = true;
    };
  }, [reportUrl, label]);

  return (
    // Mismo patron de overlay que add-equipment-form.tsx: fondo oscuro fijo
    // que cubre toda la pantalla, con la tarjeta del modal centrada encima.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-lg">
        <h2 className="mb-1 font-semibold text-text">Código QR</h2>
        <p className="mb-4 text-sm text-text-muted">{label}</p>

        {/* Fondo blanco fijo (no usa el color de la app) un QR
            necesita contraste real para poder escanearse, sin importar si el
            usuario tiene el tema oscuro activado. */}
        <div className="flex items-center justify-center rounded-lg bg-white p-2">
          {dataUrl ? (
            // No usamos next/image aqui porque dataUrl es una imagen generada
            // en memoria (base64), no un archivo con URL propia — next/image
            // esta pensado para optimizar imagenes servidas por URL real.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`Código QR de ${label}`} className="h-auto w-full max-w-72" />
          ) : (
            // Placeholder del mismo tamaño mientras composeQrImage termina,
            // para que el modal no "salte" de tamaño cuando la imagen aparece.
            <div className="flex h-72 w-72 items-center justify-center text-sm text-text-subtle">
              Generando...
            </div>
          )}
        </div>

        {/* Muestra la URL en texto plano, por si alguien prefiere copiarla a
            mano en vez de escanear el QR. */}
        <p className="mt-3 break-all text-center text-xs text-text-subtle">{reportUrl}</p>

        <div className="mt-4 flex gap-2">
          {/* El boton de descarga solo aparece si ya hay imagen generada. */}
          {dataUrl && (
            <a
              href={dataUrl}
              // download fuerza al navegador a guardar el archivo en vez de
              // navegar a el; el nombre se arma a partir del label del equipo
              // (espacios -> guiones, todo en minuscula) para que sea un
              // nombre de archivo valido y legible.
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
