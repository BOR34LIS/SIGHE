import QRCode from "qrcode";

const QR_MESSAGE = "¿Tienes algún problema con este equipo? ¡Repórtalo con este QR!";
const QR_SIZE = 280;
const PADDING = 24;
const LINE_HEIGHT = 26;
const FONT = "bold 20px sans-serif";
// Mas grande que el mensaje: es el dato que hay que leer de un vistazo al
// pegar el QR impreso junto al equipo, para no confundirlo con otro.
const LABEL_LINE_HEIGHT = 32;
const LABEL_FONT = "bold 26px sans-serif";

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

/**
 * Genera un PNG (como data URL) con el mensaje de invitación a reportar
 * arriba del QR y el nombre del equipo abajo, para que quede todo en una
 * sola imagen imprimible — y asi, pegado junto al equipo, no haya forma de
 * confundirlo con el QR de otro.
 */
export async function composeQrImage(reportUrl: string, label: string): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(reportUrl, { width: QR_SIZE, margin: 1 });
  const qrImage = await loadImage(qrDataUrl);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return qrDataUrl;

  // measureText necesita el font ya seteado, aunque el canvas aun tenga tamano por defecto.
  ctx.font = FONT;
  const messageLines = wrapText(ctx, QR_MESSAGE, QR_SIZE);
  const messageBlockHeight = messageLines.length * LINE_HEIGHT;

  ctx.font = LABEL_FONT;
  const labelLines = wrapText(ctx, label, QR_SIZE);
  const labelBlockHeight = labelLines.length * LABEL_LINE_HEIGHT;

  canvas.width = QR_SIZE + PADDING * 2;
  canvas.height =
    PADDING + messageBlockHeight + PADDING + QR_SIZE + PADDING + labelBlockHeight + PADDING;

  // Cambiar el tamano del canvas resetea el contexto: hay que volver a configurarlo.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";

  ctx.fillStyle = "#18181b";
  ctx.font = FONT;
  messageLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, PADDING + LINE_HEIGHT * (i + 1) - 7);
  });

  const qrY = PADDING + messageBlockHeight + PADDING;
  ctx.drawImage(qrImage, PADDING, qrY, QR_SIZE, QR_SIZE);

  ctx.fillStyle = "#18181b";
  ctx.font = LABEL_FONT;
  const labelStartY = qrY + QR_SIZE + PADDING;
  labelLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, labelStartY + LABEL_LINE_HEIGHT * (i + 1) - 8);
  });

  return canvas.toDataURL("image/png");
}
