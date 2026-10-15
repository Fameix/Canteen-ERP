"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Clock, ChevronRight, ClipboardList } from "lucide-react"
import { useBills } from "@/hooks/use-bills"
import { formatPriceMinor } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { PageHeader, SearchField } from "@/components/workspace-ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format, isToday, isYesterday, subDays, startOfDay } from "date-fns"
import type { Bill } from "@/lib/types"

type FilterType = "all" | "today" | "yesterday" | "week" | "paid" | "pending"

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "Last 7 Days" },
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
]

export default function BillsPage() {
  const router = useRouter()
  const { bills, loading } = useBills()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("today")

  const filtered = useMemo(() => {
    let result = bills.filter((b) => b.status === "confirmed")

    const now = new Date()
    switch (filter) {
      case "today":
        result = result.filter((b) => isToday(new Date(b.createdAt)))
        break
      case "yesterday":
        result = result.filter((b) => isYesterday(new Date(b.createdAt)))
        break
      case "week":
        result = result.filter(
          (b) => new Date(b.createdAt) >= subDays(startOfDay(now), 7)
        )
        break
      case "paid":
        result = result.filter((b) => b.paymentStatus === "paid")
        break
      case "pending":
        result = result.filter((b) => b.paymentStatus === "pending")
        break
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((b) => b.billNumber.toLowerCase().includes(q))
    }

    return result
  }, [bills, filter, search])

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Bills"
        description="View your order history and payment status."
        actions={<Badge variant="outline">{filtered.length} bills</Badge>}
      />
      <div className="flex gap-3">
        <SearchField
          placeholder="Search bill number..."
          value={search}
          onChange={setSearch}
        />
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <SelectTrigger className="w-40 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !filtered.length ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>No bills found</EmptyTitle>
            <EmptyDescription>
              Your bills will appear here after you confirm an order.
            </EmptyDescription>
          </EmptyHeader>
          {filter !== "all" && (
            <EmptyContent>
              <Button variant="outline" onClick={() => setFilter("all")}>
                Show all bills
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <Card className="py-0">
          <CardContent className="divide-y p-0">
            {filtered.map((bill) => (
              <BillRow
                key={bill.id}
                bill={bill}
                onClick={() => router.push(`/bills/${bill.id}`)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function BillRow({ bill, onClick }: { bill: Bill; onClick: () => void }) {
  const methodLabel = bill.payment?.method
    ? { cash: "Cash", upi: "UPI", card: "Card" }[bill.payment.method]
    : null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="font-mono text-sm font-medium">{bill.billNumber}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {format(new Date(bill.createdAt), "d MMM, hh:mm a")}
          {methodLabel && ` ? ${methodLabel}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium tabular-nums">
          {formatPriceMinor(bill.totalMinor)}
        </span>
        <Badge
          variant={bill.paymentStatus === "paid" ? "secondary" : "outline"}
        >
          {bill.paymentStatus === "paid" ? "Paid" : "Pending"}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`View ${bill.billNumber}`}
          onClick={onClick}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
