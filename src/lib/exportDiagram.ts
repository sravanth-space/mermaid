/** Scale applied when rasterising to PNG, so exports are not blurry. */
const PNG_SCALE = 2;

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Mermaid emits `width="100%"` with the real dimensions only in the viewBox.
 * An <img> needs intrinsic pixel dimensions to rasterise, so this reads the
 * viewBox and writes the size back onto the root element.
 */
const withExplicitSize = (svg: string) => {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;

  const viewBox = root
    .getAttribute("viewBox")
    ?.split(/[\s,]+/)
    .map(Number);

  const hasViewBox =
    viewBox?.length === 4 && viewBox.every((n) => Number.isFinite(n));

  const width = hasViewBox ? viewBox[2] : parseFloat(root.getAttribute("width") ?? "800");
  const height = hasViewBox ? viewBox[3] : parseFloat(root.getAttribute("height") ?? "600");

  root.setAttribute("width", String(width));
  root.setAttribute("height", String(height));
  // max-width would otherwise cap the rasterised output.
  root.style.removeProperty("max-width");

  return {
    markup: new XMLSerializer().serializeToString(root),
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
};

/** btoa() only accepts latin1, so UTF-8 has to be widened a byte at a time. */
const toBase64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

export const downloadSvg = (svg: string, filename = "diagram.svg") => {
  triggerDownload(new Blob([svg], { type: "image/svg+xml" }), filename);
};

/**
 * Rasterises the SVG through a canvas. Rejects if the browser cannot decode or
 * encode the image.
 *
 * The SVG is handed to the <img> as a data: URL rather than a blob: URL:
 * Chromium treats an SVG image loaded from blob: as not origin-clean, which
 * taints the canvas and makes toBlob() throw.
 */
export const downloadPng = async (svg: string, filename = "diagram.png") => {
  const { markup, width, height } = withExplicitSize(svg);

  const image = new Image();
  image.src = `data:image/svg+xml;base64,${toBase64(markup)}`;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = width * PNG_SCALE;
  canvas.height = height * PNG_SCALE;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable");

  // PNG has no transparency fallback in most viewers, so flatten onto white.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("PNG encoding failed")),
      "image/png"
    );
  });

  triggerDownload(blob, filename);
};
