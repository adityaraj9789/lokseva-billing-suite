import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { computeTotals, numberToWordsINR, type Invoice, type ShopSettings } from "./storage";
import logoUrl from "@/assets/logo.png";

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

const rupee = (n: number) =>
  "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function generateInvoicePDF(inv: Invoice, s: ShopSettings, action: "save" | "print" = "save") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const logo = await loadLogoDataUrl();

  // Header band
  doc.setFillColor(22, 101, 52);
  doc.rect(0, 0, W, 90, "F");

  if (logo) {
    try { doc.addImage(logo, "PNG", 30, 15, 60, 60); } catch {}
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(s.name, 105, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (s.tagline) doc.text(s.tagline, 105, 54);
  doc.text(s.address, 105, 68);
  doc.text(`Phone: ${s.phone}${s.email ? "  |  " + s.email : ""}`, 105, 80);
  if (s.gstin) {
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${s.gstin}`, W - 30, 80, { align: "right" });
  }

  // Title
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TAX INVOICE", W / 2, 115, { align: "center" });

  // Meta boxes
  const metaY = 130;
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.rect(30, metaY, (W - 60) / 2 - 5, 70);
  doc.rect(30 + (W - 60) / 2 + 5, metaY, (W - 60) / 2 - 5, 70);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To", 40, metaY + 15);
  doc.setFont("helvetica", "normal");
  const custLines = [
    inv.customerName || "-",
    inv.customerAddress || "",
    inv.customerPhone ? "Phone: " + inv.customerPhone : "",
    inv.customerGstin ? "GSTIN: " + inv.customerGstin : "",
  ].filter(Boolean);
  custLines.forEach((l, i) => doc.text(l, 40, metaY + 30 + i * 12));

  const rx = 30 + (W - 60) / 2 + 15;
  doc.setFont("helvetica", "bold");
  doc.text("Invoice No:", rx, metaY + 15);
  doc.text("Date:", rx, metaY + 30);
  doc.text("Payment:", rx, metaY + 45);
  doc.text("Place of Supply:", rx, metaY + 60);
  doc.setFont("helvetica", "normal");
  doc.text(inv.number, rx + 90, metaY + 15);
  doc.text(new Date(inv.date).toLocaleDateString("en-IN"), rx + 90, metaY + 30);
  doc.text(inv.paymentMode || "Cash", rx + 90, metaY + 45);
  doc.text(`${s.state} (${s.stateCode})`, rx + 90, metaY + 60);

  // Items table
  const totals = computeTotals(inv);
  const body = inv.items.map((it, i) => {
    const gross = it.qty * it.rate;
    const afterDisc = gross - (gross * (it.discount || 0)) / 100;
    return [
      String(i + 1),
      it.name,
      it.hsn || "-",
      `${it.qty} ${it.unit || ""}`.trim(),
      rupee(it.rate),
      it.discount ? it.discount + "%" : "-",
      it.gst + "%",
      rupee(afterDisc),
    ];
  });

  autoTable(doc, {
    startY: metaY + 85,
    head: [["#", "Item", "HSN", "Qty", "Rate", "Disc", "GST", "Amount"]],
    body,
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [22, 101, 52], textColor: 255, halign: "left" },
    columnStyles: {
      0: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 55 },
      3: { cellWidth: 50, halign: "right" },
      4: { cellWidth: 65, halign: "right" },
      5: { cellWidth: 40, halign: "right" },
      6: { cellWidth: 40, halign: "right" },
      7: { cellWidth: 75, halign: "right" },
    },
    margin: { left: 30, right: 30 },
  });

  const endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Totals block
  const tx = W - 260;
  let ty = endY;
  const row = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(10);
    doc.text(label, tx, ty);
    doc.text(value, W - 30, ty, { align: "right" });
    ty += 15;
  };
  row("Taxable Amount", rupee(totals.taxable));
  if (inv.interState) {
    row("IGST", rupee(totals.igst));
  } else {
    row("CGST", rupee(totals.cgst));
    row("SGST", rupee(totals.sgst));
  }
  if (inv.roundOff) row("Round Off", rupee(inv.roundOff));
  doc.setDrawColor(22, 101, 52);
  doc.setLineWidth(1);
  doc.line(tx, ty - 8, W - 30, ty - 8);
  ty += 4;
  row("Grand Total", rupee(totals.grand), true);

  // Amount in words
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Amount in Words:", 30, endY + 10);
  doc.setFont("helvetica", "normal");
  const words = doc.splitTextToSize(numberToWordsINR(totals.grand), W - 320);
  doc.text(words, 30, endY + 24);

  // Bank / UPI
  let footY = Math.max(ty, endY + 24 + words.length * 12) + 20;
  if (s.bankName || s.upi) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Payment Details", 30, footY);
    doc.setFont("helvetica", "normal");
    let py = footY + 12;
    if (s.bankName) { doc.text(`Bank: ${s.bankName}`, 30, py); py += 12; }
    if (s.accountNo) { doc.text(`A/C No: ${s.accountNo}`, 30, py); py += 12; }
    if (s.ifsc) { doc.text(`IFSC: ${s.ifsc}`, 30, py); py += 12; }
    if (s.upi) { doc.text(`UPI: ${s.upi}`, 30, py); py += 12; }
    footY = py + 10;
  }

  if (inv.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 30, footY);
    doc.setFont("helvetica", "normal");
    const nLines = doc.splitTextToSize(inv.notes, W - 60);
    doc.text(nLines, 30, footY + 12);
    footY += 12 + nLines.length * 12;
  }

  // Signature
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(150);
  doc.line(W - 180, pageH - 70, W - 30, pageH - 70);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`For ${s.name}`, W - 105, pageH - 55, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Authorised Signatory", W - 105, pageH - 42, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Thank you for your business!", W / 2, pageH - 20, { align: "center" });

  const filename = `${inv.number}_${(inv.customerName || "invoice").replace(/\s+/g, "_")}.pdf`;
  if (action === "print") {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  } else {
    doc.save(filename);
  }
}