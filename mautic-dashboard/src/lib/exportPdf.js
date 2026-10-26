// Largest page side jsPDF allows, in points.
const MAX_PAGE_PT = 14400;
// PDF page width in points (A4 landscape) — the snapshot is scaled to fit.
const PAGE_WIDTH_PT = 842;

/**
 * Save a snapshot of `node` (the current page) as a PDF download.
 * Anything marked data-export-ignore (buttons, menus) is left out.
 * The libraries are loaded on first use so they don't slow startup.
 */
export async function exportPdf(node, fileName) {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);

  const width = node.scrollWidth;
  const height = node.scrollHeight;
  const image = await toJpeg(node, {
    width,
    height,
    pixelRatio: 2,
    quality: 0.92,
    backgroundColor: getComputedStyle(document.body).backgroundColor,
    filter: (n) => n.dataset?.exportIgnore === undefined,
  });

  // One tall page sized to the content; split only past jsPDF's limit.
  const fullHeight = (PAGE_WIDTH_PT * height) / width;
  const pageHeight = Math.min(fullHeight, MAX_PAGE_PT);
  const orientation = PAGE_WIDTH_PT > pageHeight ? "landscape" : "portrait";
  const pdf = new jsPDF({ unit: "pt", format: [PAGE_WIDTH_PT, pageHeight], orientation });

  for (let top = 0; top < fullHeight; top += pageHeight) {
    if (top > 0) pdf.addPage([PAGE_WIDTH_PT, pageHeight], orientation);
    pdf.addImage(image, "JPEG", 0, -top, PAGE_WIDTH_PT, fullHeight, "page");
  }

  pdf.save(fileName);
}
