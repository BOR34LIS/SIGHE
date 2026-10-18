import QRCode from "qrcode";

const QR_MESSAGE = "¿Tienes algún problema con este equipo? ¡Repórtalo con este QR!";
const QR_SIZE = 280;
const PADDING = 24;
const LINE_HEIGHT = 26;
const FONT = "bold 20px sans-serif";

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
 * impreso arriba del QR, para que quede todo en una sola imagen imprimible.
 */
export async function composeQrImage(reportUrl: string): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(reportUrl, { width: QR_SIZE, margin: 1 });
  const qrImage = await loadImage(qrDataUrl);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return qrDataUrl;

  // measureText necesita el font ya seteado, aunque el canvas aun tenga tamano por defecto.
  ctx.font = FONT;
  const lines = wrapText(ctx, QR_MESSAGE, QR_SIZE);
  const textBlockHeight = lines.length * LINE_HEIGHT;

  canvas.width = QR_SIZE + PADDING * 2;
  canvas.height = PADDING + textBlockHeight + PADDING + QR_SIZE + PADDING;

  // Cambiar el tamano del canvas resetea el contexto: hay que volver a configurarlo.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#18181b";
  ctx.font = FONT;
  ctx.textAlign = "center";
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, PADDING + LINE_HEIGHT * (i + 1) - 7);
  });

  ctx.drawImage(qrImage, PADDING, PADDING + textBlockHeight + PADDING, QR_SIZE, QR_SIZE);

  return canvas.toDataURL("image/png");
}
