"use client"

import { useState, useEffect, useCallback } from "react"
import type { Bill, Payment } from "@/lib/types"
import { getBills, saveBill, getBillById } from "@/lib/storage"

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setBills(getBills())
    setLoading(false)
  }, [])

  const refresh = useCallback(() => {
    setBills(getBills())
  }, [])

  return { bills, loading, refresh }
}

export function useBill(id: string) {
  const [bill, setBill] = useState<Bill | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setBill(getBillById(id))
    setLoading(false)
  }, [id])

  function markAsPaid(method: Payment["method"]) {
    if (!bill) return
    const now = new Date().toISOString()
    const payment: Payment = {
      id: `pay_${Date.now()}`,
      hotelId: bill.hotelId,
      billId: bill.id,
      amountMinor: bill.totalMinor,
      method,
      receivedAt: now,
      receivedBy: "owner1",
      status: "completed",
    }
    const updated: Bill = {
      ...bill,
      paymentStatus: "paid",
      payment,
    }
    saveBill(updated)
    setBill(updated)
    return updated
  }

  return { bill, loading, markAsPaid }
}
