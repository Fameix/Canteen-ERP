"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, Clock, Receipt, Plus, Printer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPriceMinor } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { PaymentMethod } from "@/lib/types"
import { format } from "date-fns"
import { getBillById, getHotel } from "@/lib/storage"
import { printBill } from "@/lib/print-receipt"

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi:  "UPI",
  card: "Card",
}

function BillSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const billId      = searchParams.get("billId")      ?? ""
  const billNumber  = searchParams.get("billNumber")  ?? ""
  const amountMinor = Number(searchParams.get("amount") ?? 0)
  const methodParam = searchParams.get("method") as PaymentMethod | null
  const isPending   = searchParams.get("status") === "pending"
  const now = new Date()

  const [isPrinting, setIsPrinting] = useState(false)

  async function handlePrint() {
    if (isPrinting) return // duplicate-tap guard
    const bill  = getBillById(billId)
    const hotel = getHotel()
    if (!bill) return
    setIsPrinting(true)
    try {
      await printBill(bill, hotel)
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-6">
      {/* Status icon */}
      <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-muted">
        {isPending ? (
          <Clock className="size-10 text-foreground" />
        ) : (
          <CheckCircle2 className="size-10 text-foreground" />
        )}
      </div>

      {/* Status text */}
      <h1 className="mb-1 text-2xl font-bold">
        {isPending ? "Bill Created!" : "Payment Recorded!"}
      </h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        {isPending
          ? "Bill is confirmed. Payment pending."
          : "Payment has been recorded successfully."}
      </p>

      {/* Bill summary card */}
      <div className="mb-8 w-full rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Bill Number</span>
            <span className="font-mono text-sm font-bold">{billNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className={cn("text-sm font-bold", "text-primary")}>
              {formatPriceMinor(amountMinor)}
            </span>
          </div>
          {!isPending && methodParam && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Paid via</span>
              <span className="text-sm font-semibold">
                {METHOD_LABELS[methodParam]}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="text-sm font-semibold">
              {isPending ? "Pending" : "Paid"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Time</span>
            <span className="text-sm text-muted-foreground">
              {format(now, "hh:mm a")}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex w-full flex-col gap-3">
        <Button
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
          {isPrinting ? "Printing…" : "Print Bill"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => router.push("/billing")}
          disabled={isPrinting}
        >
          <Plus data-icon="inline-start" />
          Skip &amp; New Bill
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => router.push(`/bills/${billId}`)}
          disabled={isPrinting}
        >
          <Receipt data-icon="inline-start" />
          View Bill
        </Button>
      </div>
    </div>
  )
}

export default function BillSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <BillSuccessContent />
    </Suspense>
  )
}
