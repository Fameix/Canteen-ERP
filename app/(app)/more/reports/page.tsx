"use client"

import { useMemo } from "react"
import { Banknote, Smartphone, CreditCard } from "lucide-react"
import { useBills } from "@/hooks/use-bills"
import { formatPriceMinor } from "@/lib/store"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { PageHeader } from "@/components/workspace-ui"
import { format, subDays } from "date-fns"

export default function ReportsPage() {
  const { bills, loading } = useBills()

  const stats = useMemo(() => {
    const confirmedPaid = bills.filter(
      (b) => b.status === "confirmed" && b.paymentStatus === "paid"
    )
    const confirmedAll = bills.filter((b) => b.status === "confirmed")
    const today = new Date()
    const todayStr = format(today, "yyyy-MM-dd")

    const todayPaid = confirmedPaid.filter((b) =>
      b.createdAt.startsWith(todayStr)
    )
    const todayAll = confirmedAll.filter((b) =>
      b.createdAt.startsWith(todayStr)
    )

    const totalCollected = confirmedPaid.reduce(
      (sum, b) => sum + b.totalMinor,
      0
    )
    const todayCollected = todayPaid.reduce((sum, b) => sum + b.totalMinor, 0)
    const pendingAmount = confirmedAll
      .filter((b) => b.paymentStatus === "pending")
      .reduce((sum, b) => sum + b.totalMinor, 0)

    const cashTotal = confirmedPaid
      .filter((b) => b.payment?.method === "cash")
      .reduce((sum, b) => sum + b.totalMinor, 0)
    const upiTotal = confirmedPaid
      .filter((b) => b.payment?.method === "upi")
      .reduce((sum, b) => sum + b.totalMinor, 0)
    const cardTotal = confirmedPaid
      .filter((b) => b.payment?.method === "card")
      .reduce((sum, b) => sum + b.totalMinor, 0)

    // Last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i)
      const dateStr = format(date, "yyyy-MM-dd")
      const dayBills = confirmedPaid.filter((b) =>
        b.createdAt.startsWith(dateStr)
      )
      return {
        date,
        label: format(date, "EEE"),
        total: dayBills.reduce((sum, b) => sum + b.totalMinor, 0),
        count: dayBills.length,
      }
    })

    const maxDayTotal = Math.max(...last7Days.map((d) => d.total), 1)

    // Best selling items
    const itemCounts: Record<
      string,
      { name: string; count: number; revenue: number }
    > = {}
    confirmedAll.forEach((bill) => {
      bill.items.forEach((item) => {
        if (!itemCounts[item.menuItemId]) {
          itemCounts[item.menuItemId] = {
            name: item.name,
            count: 0,
            revenue: 0,
          }
        }
        itemCounts[item.menuItemId].count += item.quantity
        itemCounts[item.menuItemId].revenue += item.subtotalMinor
      })
    })
    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      todayCollected,
      todayBills: todayAll.length,
      totalCollected,
      pendingAmount,
      cashTotal,
      upiTotal,
      cardTotal,
      last7Days,
      maxDayTotal,
      topItems,
    }
  }, [bills])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Sales, payments, and product performance."
      />
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Today's collection",
                value: stats.todayCollected,
                detail: `${stats.todayBills} bills today`,
              },
              {
                label: "Total collection",
                value: stats.totalCollected,
                detail: "All completed payments",
              },
              {
                label: "Outstanding",
                value: stats.pendingAmount,
                detail: "Awaiting payment",
              },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader>
                  <CardDescription>{stat.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight tabular-nums">
                    {formatPriceMinor(stat.value)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.detail}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Last 7 days</CardTitle>
                <CardDescription>
                  Daily revenue from paid bills.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-3">
                  {stats.last7Days.map((day) => (
                    <div
                      key={day.label}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="flex h-40 w-full items-end rounded-md bg-muted">
                        <div
                          className="w-full rounded-md bg-chart-2"
                          style={{
                            height: `${Math.max((day.total / stats.maxDayTotal) * 100, 1)}%`,
                          }}
                          role="img"
                          aria-label={`${day.label}: ${formatPriceMinor(day.total)}`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {day.label}
                      </span>
                      <span className="text-xs tabular-nums">
                        {formatPriceMinor(day.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payment breakdown</CardTitle>
                <CardDescription>
                  All collected payments by method.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {[
                  { icon: Banknote, label: "Cash", amount: stats.cashTotal },
                  { icon: Smartphone, label: "UPI", amount: stats.upiTotal },
                  { icon: CreditCard, label: "Card", amount: stats.cardTotal },
                ].map(({ icon: Icon, label, amount }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Icon className="size-4" />
                      {label}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatPriceMinor(amount)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Best selling products</CardTitle>
              <CardDescription>
                Ranked by quantity sold across confirmed bills.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topItems.length ? (
                <div className="divide-y">
                  {stats.topItems.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-4 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          {index + 1}.
                        </span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          {item.count} sold
                        </span>
                        <span className="tabular-nums">
                          {formatPriceMinor(item.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Product performance will appear after your first confirmed
                  bill.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
