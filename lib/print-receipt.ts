/**
 * printBill — single entry point for receipt printing.
 *
 * Print chain:
 *   1. BLE printer connected → send ESC/POS bytes via Web Bluetooth.
 *   2. BLE fails or not connected → open browser popup print dialog.
 *
 * This function NEVER throws. Printer errors do not affect payment status.
 */

import type { Bill, Hotel } from "./types"
import { usePrinterStore } from "./printer-store"
import { format } from "date-fns"

// ─── Public API ───────────────────────────────────────────────────────────────

export async function printBill(bill: Bill, hotel: Hotel): Promise<void> {
  const store = usePrinterStore.getState()

  // ── Path 1: BLE printer connected ─────────────────────────────────────────
  if (store.status === "connected") {
    const ok = await store.printReceipt(bill, hotel)
    if (ok) return
    // Fall through to browser popup if BLE write failed
  }

  // ── Path 2: Browser popup print (fallback / SPP printers) ─────────────────
  browserPopupPrint(bill, hotel)
}

// ─── Browser popup receipt ────────────────────────────────────────────────────

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function minorToStr(minor: number): string {
  return `Rs.${(minor / 100).toFixed(2)}`
}

const BROWSER_PAY_LABELS: Record<string, string> = {
  cash: "Cash",
  upi:  "UPI / GPay / PhonePe",
  card: "Debit / Credit Card",
}

function browserPopupPrint(bill: Bill, hotel: Hotel): void {
  try {
    const date    = new Date(bill.createdAt)
    const dateStr = format(date, "dd/MM/yyyy")
    const timeStr = format(date, "hh:mm a")

    const itemRows = bill.items
      .map(
        item =>
          `<tr>
            <td class="item-name">${esc(item.name)}${
              item.tamilName
                ? `<br><span class="tamil">${esc(item.tamilName)}</span>`
                : ""
            }</td>
            <td class="center">${item.quantity}</td>
            <td class="right">${minorToStr(item.priceMinor)}</td>
            <td class="right">${minorToStr(item.subtotalMinor)}</td>
          </tr>`
      )
      .join("")

    const extraRows = [
      bill.discountMinor > 0
        ? `<tr><td colspan="3">Subtotal</td><td class="right">${minorToStr(bill.subtotalMinor)}</td></tr>
           <tr><td colspan="3">Discount</td><td class="right">-${minorToStr(bill.discountMinor)}</td></tr>`
        : "",
      bill.taxMinor > 0
        ? `<tr><td colspan="3">Tax (${hotel.taxRate}%)</td><td class="right">${minorToStr(bill.taxMinor)}</td></tr>`
        : "",
    ]
      .filter(Boolean)
      .join("")

    const payLine = bill.payment
      ? (BROWSER_PAY_LABELS[bill.payment.method] ?? bill.payment.method)
      : "PENDING"

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Receipt ${esc(bill.billNumber)}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px; line-height: 1.45;
  color: #000; background: #fff;
  width: 80mm; padding: 3mm 4mm 8mm;
}
@page { size: 80mm auto; margin: 0; }
.header { text-align:center; margin-bottom:5px; }
.header .name { font-size:14px; font-weight:bold; letter-spacing:.5px; }
.header .sub  { font-size:10px; line-height:1.6; }
.solid  { border-bottom:1px solid #000; margin:4px 0; }
.dashed { border-bottom:1px dashed #000; margin:3px 0; }
table { width:100%; border-collapse:collapse; }
.meta td { padding:1px 0; }
.meta td:last-child { text-align:right; }
.items th {
  font-size:10px; font-weight:bold; text-align:left;
  padding:2px 0; text-transform:uppercase;
  border-bottom:1px dashed #000;
}
.items td { padding:2px 0; vertical-align:top; }
.item-name { word-break:break-word; }
.tamil { font-size:9px; color:#555; }
.center { text-align:center; }
.right  { text-align:right; }
.extras td { font-size:10px; padding:1px 0; }
.total-row td { font-weight:bold; font-size:13px; padding-top:4px; border-top:1px solid #000; }
.footer { text-align:center; font-size:10px; margin-top:6px; }
.cut { text-align:center; font-size:9px; color:#999; margin-top:10px; letter-spacing:2px; }
</style>
</head>
<body>
<div class="header">
  <div class="name">${esc(hotel.name)}</div>
  ${hotel.address ? `<div class="sub">${esc(hotel.address)}</div>` : ""}
  ${hotel.phone   ? `<div class="sub">Ph: ${esc(hotel.phone)}</div>` : ""}
  ${hotel.gstin   ? `<div class="sub">GSTIN: ${esc(hotel.gstin)}</div>` : ""}
</div>
<div class="solid"></div>
<table class="meta">
  <tr><td>Bill No</td><td>${esc(bill.billNumber)}</td></tr>
  <tr><td>Date</td><td>${dateStr}</td></tr>
  <tr><td>Time</td><td>${timeStr}</td></tr>
</table>
<div class="solid"></div>
<table class="items">
  <thead><tr>
    <th>Item</th><th class="center">Qty</th>
    <th class="right">Price</th><th class="right">Amt</th>
  </tr></thead>
  <tbody>${itemRows}</tbody>
  ${extraRows ? `<tbody class="extras">${extraRows}</tbody>` : ""}
  <tfoot>
    <tr class="total-row">
      <td colspan="3">TOTAL</td>
      <td class="right">${minorToStr(bill.totalMinor)}</td>
    </tr>
  </tfoot>
</table>
<div class="solid"></div>
<table class="meta">
  <tr><td>Payment</td><td>${payLine}</td></tr>
  <tr><td>Status</td><td>${bill.paymentStatus === "paid" ? "PAID" : "PENDING"}</td></tr>
</table>
<div class="solid"></div>
${hotel.receiptFooter ? `<div class="footer">${esc(hotel.receiptFooter)}</div>` : ""}
<div class="cut">- - - - - - - - - - - - - - -</div>
<script>window.addEventListener('load',function(){ window.print(); });</script>
</body>
</html>`

    const win = window.open(
      "",
      "_blank",
      "width=420,height=620,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes"
    )
    if (!win) return // popup blocked — silently fail
    win.document.write(html)
    win.document.close()
  } catch {
    // Silently ignore — printer failure must not affect payment status
  }
}
