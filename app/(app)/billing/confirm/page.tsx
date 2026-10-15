"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { saveBill, generateBillNumber, getAuth } from "@/lib/storage"
import type { Bill, BillItem } from "@/lib/types"

function ConfirmPendingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const amountMinor = Number(searchParams.get("amount") ?? 0)
  const { items, clearCart } = useCartStore()

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/billing")
      return
    }

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

    const bill: Bill = {
      id: billId,
      hotelId: "hotel_001",
      billNumber,
      items: billItems,
      subtotalMinor: amountMinor,
      discountMinor: 0,
      taxMinor: 0,
      totalMinor: amountMinor,
      paymentStatus: "pending",
      status: "confirmed",
      createdBy: auth?.uid ?? "owner1",
      createdAt: now,
      confirmedAt: now,
    }

    saveBill(bill)
    clearCart()

    setTimeout(() => {
      router.replace(
        `/billing/success?billId=${billId}&billNumber=${billNumber}&amount=${amountMinor}&status=pending`
      )
    }, 300)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  )
}

export default function ConfirmPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfirmPendingContent />
    </Suspense>
  )
}
