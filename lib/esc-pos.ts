/**
 * ESC/POS receipt builder for 58 mm and 80 mm thermal printers.
 *
 * Hardware note
 * ─────────────
 * ESC/POS is a de-facto standard, but printers differ on:
 *   • code-page selection (we use factory default / PC437)
 *   • partial-cut command support
 *   • maximum line width (32 chars @ 58 mm, 48 chars @ 80 mm assumed at 12 cpi)
 *
 * Tamil / Unicode characters are replaced with '?' because most cheap
 * ESC/POS printers lack multi-byte font ROMs. Use the browser-print fallback
 * when Tamil names are critical.
 */

import type { Bill, Hotel } from "./types"
import { format } from "date-fns"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaperSize = "58mm" | "80mm"

const COLS: Record<PaperSize, number> = { "58mm": 32, "80mm": 48 }

// ─── ESC/POS byte constants ───────────────────────────────────────────────────

const ESC = 0x1b
const GS  = 0x1d
const LF  = 0x0a

const CMD = {
  INIT:           [ESC, 0x40],
  BOLD_ON:        [ESC, 0x45, 0x01],
  BOLD_OFF:       [ESC, 0x45, 0x00],
  ALIGN_LEFT:     [ESC, 0x61, 0x00],
  ALIGN_CENTER:   [ESC, 0x61, 0x01],
  FEED:   (n: number) => [ESC, 0x64, n],
  // Partial cut (works on most printers; some need GS V 0x00 instead)
  CUT_PARTIAL:    [GS, 0x56, 0x41, 0x00],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a string to CP437-safe bytes; replaces non-ASCII with '?'. */
function textBytes(text: string): number[] {
  const out: number[] = []
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0x3f
    if (cp < 0x80) {
      out.push(cp)
    } else if (cp === 0x20b9) {
      // ₹ → "Rs."
      out.push(0x52, 0x73, 0x2e)
    } else {
      out.push(0x3f) // '?'
    }
  }
  return out
}

/** One line of text followed by LF. Truncates to `cols`. */
function line(text: string, cols: number): number[] {
  return [...textBytes(text.substring(0, cols)), LF]
}

/** Two-column row: left-padded name, right-padded value, with a space between. */
function rowKV(label: string, value: string, cols: number): number[] {
  const v = value.substring(0, cols - 1)
  const l = label.substring(0, cols - v.length - 1).padEnd(cols - v.length - 1)
  return [...textBytes(l + " " + v), LF]
}

/**
 * Three-column item row: name | qty | amount.
 *
 * 58mm (32): name=16  qty=3  amt=11  spaces=2  → 32
 * 80mm (48): name=27  qty=4  amt=15  spaces=2  → 48
 */
function itemRow(name: string, qty: string, amt: string, cols: number): number[] {
  const amtW  = cols === 32 ? 11 : 15
  const qtyW  = cols === 32 ?  3 :  4
  const nameW = cols - amtW - qtyW - 2

  const n = name.substring(0, nameW).padEnd(nameW)
  const q = qty.padStart(qtyW)
  const a = amt.padStart(amtW)
  return [...textBytes(`${n} ${q} ${a}`), LF]
}

function divider(char: string, cols: number): number[] {
  return line(char.repeat(cols), cols)
}

function rupees(minor: number): string {
  return `Rs.${(minor / 100).toFixed(2)}`
}

const PAY_LABEL: Record<string, string> = {
  cash: "Cash",
  upi:  "UPI / GPay",
  card: "Card",
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a complete ESC/POS receipt as a Uint8Array ready to write to a BLE
 * printer characteristic.
 */
export function buildEscPosReceipt(
  bill: Bill,
  hotel: Hotel,
  paperSize: PaperSize
): Uint8Array {
  const C = COLS[paperSize]
  const b: number[] = []
  const push = (...chunks: number[][]) => chunks.forEach(c => b.push(...c))

  const date = new Date(bill.createdAt)

  // ── Init ──────────────────────────────────────────────────────────────────
  push(CMD.INIT, CMD.FEED(1))

  // ── Hotel header ──────────────────────────────────────────────────────────
  push(CMD.ALIGN_CENTER)
  push(CMD.BOLD_ON)
  push(line(hotel.name, C))
  push(CMD.BOLD_OFF)
  if (hotel.address) push(line(hotel.address.substring(0, C), C))
  if (hotel.phone)   push(line(`Ph: ${hotel.phone}`.substring(0, C), C))
  if (hotel.gstin)   push(line(`GSTIN: ${hotel.gstin}`.substring(0, C), C))
  push(divider("=", C))

  // ── Bill metadata ─────────────────────────────────────────────────────────
  push(CMD.ALIGN_LEFT)
  push(rowKV("Bill No", bill.billNumber, C))
  push(rowKV("Date",    format(date, "dd/MM/yyyy"), C))
  push(rowKV("Time",    format(date, "hh:mm a"), C))
  push(divider("=", C))

  // ── Items header ──────────────────────────────────────────────────────────
  push(CMD.BOLD_ON)
  push(itemRow("ITEM", "QTY", "AMOUNT", C))
  push(CMD.BOLD_OFF)
  push(divider("-", C))

  // ── Items ─────────────────────────────────────────────────────────────────
  for (const item of bill.items) {
    push(itemRow(item.name, String(item.quantity), rupees(item.subtotalMinor), C))
  }
  push(divider("-", C))

  // ── Optional subtotal / discount / tax ────────────────────────────────────
  if (bill.discountMinor > 0) {
    push(rowKV("Subtotal", rupees(bill.subtotalMinor), C))
    push(rowKV("Discount", `-${rupees(bill.discountMinor)}`, C))
  }
  if (bill.taxMinor > 0) {
    push(rowKV(`Tax (${hotel.taxRate}%)`, rupees(bill.taxMinor), C))
  }

  // ── Total ─────────────────────────────────────────────────────────────────
  push(CMD.BOLD_ON)
  push(rowKV("TOTAL", rupees(bill.totalMinor), C))
  push(CMD.BOLD_OFF)
  push(divider("=", C))

  // ── Payment ───────────────────────────────────────────────────────────────
  const payLabel = bill.payment
    ? (PAY_LABEL[bill.payment.method] ?? bill.payment.method)
    : "PENDING"
  push(rowKV("Payment", payLabel, C))
  push(rowKV("Status",  bill.paymentStatus === "paid" ? "PAID" : "PENDING", C))
  push(divider("=", C))

  // ── Footer ────────────────────────────────────────────────────────────────
  if (hotel.receiptFooter) {
    push(CMD.ALIGN_CENTER)
    push(line(hotel.receiptFooter.substring(0, C), C))
  }

  // Feed + partial cut
  push(CMD.FEED(3), CMD.CUT_PARTIAL)

  return new Uint8Array(b)
}

/**
 * Build a short test-print page to verify the BLE connection.
 */
export function buildTestReceipt(hotel: Hotel, paperSize: PaperSize): Uint8Array {
  const C = COLS[paperSize]
  const b: number[] = []
  const push = (...chunks: number[][]) => chunks.forEach(c => b.push(...c))

  push(CMD.INIT, CMD.FEED(1))
  push(CMD.ALIGN_CENTER)
  push(CMD.BOLD_ON)
  push(line("** PRINTER TEST **", C))
  push(CMD.BOLD_OFF)
  push(line(hotel.name, C))
  push(divider("=", C))
  push(CMD.ALIGN_LEFT)
  push(line(`Paper: ${paperSize}  Cols: ${C}`, C))
  push(line(`${format(new Date(), "dd/MM/yyyy  hh:mm a")}`, C))
  push(divider("-", C))
  push(line("If you can read this, the BLE", C))
  push(line("connection is working correctly.", C))
  push(divider("=", C))
  push(CMD.ALIGN_CENTER)
  push(line("POS System", C))
  push(CMD.FEED(3), CMD.CUT_PARTIAL)

  return new Uint8Array(b)
}
