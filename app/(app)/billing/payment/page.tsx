"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Banknote,
  Smartphone,
  CreditCard,
  Loader2,
} from "lucide-react"
import { useCartStore, formatPriceMinor } from "@/lib/store"
import { saveBill, generateBillNumber, getAuth } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/workspace-ui"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Bill, PaymentMethod, Payment, BillItem } from "@/lib/types"

const PAYMENT_METHODS: {
  id: PaymentMethod
  label: string
  icon: React.ElementType
  desc: string
}[] = [
  { id: "cash", label: "Cash", icon: Banknote, desc: "Physical cash payment" },
  {
    id: "upi",
    label: "UPI",
    icon: Smartphone,
    desc: "Google Pay, PhonePe, Paytm",
  },
  { id: "card", label: "Card", icon: CreditCard, desc: "Debit or Credit card" },
]

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const amountMinor = Number(searchParams.get("amount") ?? 0)
  const { items, clearCart } = useCartStore()
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [confirming, setConfirming] = useState(false)

  async function handleConfirmPayment() {
    if (items.length === 0) return
    setConfirming(true)

    try {
      const now = new Date().toISOString()
      const billId = `bill_${Date.now()}`
      const billNumber = generateBillNumber()
      const auth = getAuth()

      const billItems: BillItem[] = items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        tamilName: item.tamilName,
        priceMinor: item.priceMinor,
        quantity: item.quantity,
        subtotalMinor: item.priceMinor * item.quantity,
      }))

      const payment: Payment = {
        id: `pay_${Date.now()}`,
        hotelId: "hotel_001",
        billId,
        amountMinor,
        method,
        receivedAt: now,
        receivedBy: auth?.uid ?? "owner1",
        status: "completed",
      }

      const bill: Bill = {
        id: billId,
        hotelId: "hotel_001",
        billNumber,
        items: billItems,
        subtotalMinor: amountMinor,
        discountMinor: 0,
        taxMinor: 0,
        totalMinor: amountMinor,
        paymentStatus: "paid",
        status: "confirmed",
        createdBy: auth?.uid ?? "owner1",
        createdAt: now,
        confirmedAt: now,
        payment,
      }

      saveBill(bill)
      clearCart()

      // Small delay for UX
      await new Promise((r) => setTimeout(r, 400))
      router.replace(
        `/billing/success?billId=${billId}&billNumber=${billNumber}&amount=${amountMinor}&method=${method}`
      )
    } catch {
      setConfirming(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Record payment"
        description="Choose how the customer is paying."
        backAction={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
        }
      />
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Payment details</CardTitle>
          <CardDescription>
            Confirm the amount and payment method.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="rounded-lg border bg-muted/40 p-5">
            <p className="text-sm text-muted-foreground">Amount payable</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
              {formatPriceMinor(amountMinor)}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Payment method</p>
            <ToggleGroup
              value={[method]}
              onValueChange={(values) => {
                const next = values[0]
                if (next === "cash" || next === "upi" || next === "card")
                  setMethod(next)
              }}
              variant="outline"
              aria-label="Payment method"
            >
              {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                <ToggleGroupItem key={id} value={id} aria-label={label}>
                  <Icon data-icon="inline-start" />
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">
              {PAYMENT_METHODS.find((option) => option.id === method)?.desc}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleConfirmPayment}
            disabled={confirming || !items.length}
          >
            {confirming ? (
              <>
                <Loader2 data-icon="inline-start" className="animate-spin" />
                Processing...
              </>
            ) : (
              <>Mark {formatPriceMinor(amountMinor)} as paid</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  )
}
