"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Printer,
  Banknote,
  Smartphone,
  CreditCard,
  Loader2,
} from "lucide-react"
import { useBill } from "@/hooks/use-bills"
import { formatPriceMinor } from "@/lib/store"
import { getHotel } from "@/lib/storage"
import { printBill } from "@/lib/print-receipt"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { PaymentMethod } from "@/lib/types"

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi:  "UPI",
  card: "Card",
}

const METHODS: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: "cash", label: "Cash",  icon: Banknote    },
  { id: "upi",  label: "UPI",   icon: Smartphone  },
  { id: "card", label: "Card",  icon: CreditCard  },
]

export default function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }  = use(params)
  const router  = useRouter()
  const { bill, loading, markAsPaid } = useBill(id)

  const [showPaymentPicker, setShowPaymentPicker] = useState(false)
  const [selectedMethod, setSelectedMethod]       = useState<PaymentMethod>("cash")
  const [paying,   setPaying]   = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  const hotel = getHotel()

  async function handleMarkAsPaid() {
    setPaying(true)
    await new Promise(r => setTimeout(r, 400))
    markAsPaid(selectedMethod)
    setPaying(false)
    setShowPaymentPicker(false)
  }

  async function handlePrint() {
    if (!bill || isPrinting) return
    setIsPrinting(true)
    try {
      await printBill(bill, hotel)
    } finally {
      setIsPrinting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">Bill not found</p>
        <Button onClick={() => router.push("/bills")}>View Bills</Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] flex-col bg-background">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Go back"
              onClick={() => router.back()}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="font-mono text-sm font-bold">{bill.billNumber}</h1>
              <p className="text-xs text-muted-foreground">
                {format(new Date(bill.createdAt), "d MMM yyyy · hh:mm a")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Print bill"
            disabled={isPrinting}
            onClick={handlePrint}
          >
            {isPrinting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Printer className="size-5" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        {/* ── Payment status ── */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
          {bill.paymentStatus === "paid" ? (
            <CheckCircle2 className="size-6 text-foreground" />
          ) : (
            <Clock className="size-6 text-foreground" />
          )}
          <div>
            <p className="font-semibold">
              {bill.paymentStatus === "paid" ? "Payment Received" : "Payment Pending"}
            </p>
            {bill.payment && (
              <p className="text-xs text-muted-foreground">
                via {METHOD_LABELS[bill.payment.method]} ·{" "}
                {format(new Date(bill.payment.receivedAt), "hh:mm a")}
              </p>
            )}
          </div>
        </div>

        {/* ── Receipt card ── */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 text-center">
            <h2 className="text-base font-bold">{hotel.name}</h2>
            <p className="text-xs text-muted-foreground">{hotel.address}</p>
            <p className="text-xs text-muted-foreground">{hotel.phone}</p>
          </div>

          <Separator className="mb-3" />

          <div className="flex flex-col gap-2">
            <div className="flex justify-between pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-16 text-right">Price</span>
              <span className="w-16 text-right">Total</span>
            </div>
            {bill.items.map(item => (
              <div
                key={item.menuItemId}
                className="flex items-start justify-between gap-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="leading-tight">{item.name}</p>
                  {item.tamilName && (
                    <p className="text-xs text-muted-foreground">{item.tamilName}</p>
                  )}
                </div>
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="w-16 text-right text-muted-foreground">
                  {formatPriceMinor(item.priceMinor)}
                </span>
                <span className="w-16 text-right font-medium">
                  {formatPriceMinor(item.subtotalMinor)}
                </span>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPriceMinor(bill.subtotalMinor)}</span>
            </div>
            {bill.discountMinor > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatPriceMinor(bill.discountMinor)}</span>
              </div>
            )}
            {bill.taxMinor > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPriceMinor(bill.taxMinor)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className={cn("text-xl font-bold", "text-primary")}>
                {formatPriceMinor(bill.totalMinor)}
              </span>
            </div>
          </div>

          <Separator className="my-3" />
          <p className="text-center text-xs text-muted-foreground">
            {hotel.receiptFooter}
          </p>
        </div>
      </div>

      {/* ── Bottom actions ── */}
      <div className="flex flex-col gap-3 border-t border-border px-4 pt-4 pb-8">
        {/* Mark as Paid (pending bills only) */}
        {bill.paymentStatus === "pending" && (
          <>
            {!showPaymentPicker ? (
              <Button
                size="lg"
                className="w-full"
                onClick={() => setShowPaymentPicker(true)}
              >
                Mark as Paid
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold">Select payment method:</p>
                <ToggleGroup
                  variant="outline"
                  value={[selectedMethod]}
                  onValueChange={vals => {
                    const next = vals[0]
                    if (next === "cash" || next === "upi" || next === "card")
                      setSelectedMethod(next)
                  }}
                  aria-label="Payment method"
                >
                  {METHODS.map(({ id, label, icon: Icon }) => (
                    <ToggleGroupItem key={id} value={id} aria-label={label}>
                      <Icon data-icon="inline-start" />
                      {label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPaymentPicker(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleMarkAsPaid}
                    disabled={paying}
                  >
                    {paying ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Confirm"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Reprint Bill (always visible) */}
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handlePrint}
          disabled={isPrinting}
        >
          {isPrinting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Printer data-icon="inline-start" />
          )}
          {isPrinting ? "Printing…" : "Reprint Bill"}
        </Button>
      </div>
    </div>
  )
}
