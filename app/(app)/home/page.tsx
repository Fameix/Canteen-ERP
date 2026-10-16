"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Plus,
  ArrowRight,
  Banknote,
  Smartphone,
  CreditCard,
  Receipt,
  BarChart3,
} from "lucide-react"
import { useBills } from "@/hooks/use-bills"
import { formatPriceMinor } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"

export default function HomePage() {
  const router = useRouter()
  const { bills, loading } = useBills()
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const stats = useMemo(() => {
    const confirmed = bills.filter(
      (b) => b.status === "confirmed" && b.createdAt.startsWith(todayStr)
    )
    const paid = confirmed.filter((b) => b.paymentStatus === "paid")
    return {
      totalSales: paid.reduce((s, b) => s + b.totalMinor, 0),
      totalBills: confirmed.length,
      paidBills: paid.length,
      pendingAmount: confirmed
        .filter((b) => b.paymentStatus === "pending")
        .reduce((s, b) => s + b.totalMinor, 0),
      collections: (["cash", "upi", "card"] as const).map((method) => ({
        method,
        amount: paid
          .filter((b) => b.payment?.method === method)
          .reduce((s, b) => s + b.totalMinor, 0),
      })),
    }
  }, [bills, todayStr])
  const recent = bills.slice(0, 5)
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div className="flex flex-col gap-3">
          <h1 className="sr-only">Om Saravana Bhava</h1>
          <Image
            src="/branding/om-saravana-bhava-logo-transparent.png"
            alt="Om Saravana Bhava"
            width={521}
            height={552}
            unoptimized
            priority
            className="h-24 w-auto self-start rounded-lg object-contain sm:h-28"
          />
        </div>
        <Button onClick={() => router.push("/billing")}>
          <Plus data-icon="inline-start" />
          New bill
        </Button>
      </header>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {[
              {
                label: "Today's revenue",
                value: formatPriceMinor(stats.totalSales),
                detail: "From paid bills",
              },
              {
                label: "Total bills",
                value: String(stats.totalBills),
                detail: "Created today",
              },
              {
                label: "Paid bills",
                value: String(stats.paidBills),
                detail: "Payments completed",
              },
              {
                label: "Pending amount",
                value: formatPriceMinor(stats.pendingAmount),
                detail: "Awaiting payment",
              },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader>
                  <CardDescription>{stat.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight tabular-nums">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.detail}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardHeader>
                <CardTitle>Recent bills</CardTitle>
                <CardDescription>
                  Your latest orders at a glance.
                </CardDescription>
                <CardAction>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/bills")}
                  >
                    View all
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {!recent.length ? (
                  <Empty className="border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Receipt />
                      </EmptyMedia>
                      <EmptyTitle>No bills yet</EmptyTitle>
                      <EmptyDescription>
                        Create your first bill to see it here.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/billing")}
                      >
                        Create bill
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  <div className="divide-y">
                    {recent.map((bill) => (
                      <div
                        key={bill.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div>
                          <Button
                            variant="link"
                            className="px-0"
                            onClick={() => router.push(`/bills/${bill.id}`)}
                          >
                            {bill.billNumber}
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(bill.createdAt), "d MMM, hh:mm a")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium tabular-nums">
                            {formatPriceMinor(bill.totalMinor)}
                          </span>
                          <Badge
                            variant={
                              bill.paymentStatus === "paid"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {bill.paymentStatus === "paid" ? "Paid" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment collection</CardTitle>
                  <CardDescription>
                    Today&apos;s collected payments by method.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {stats.collections.map(({ method, amount }) => {
                    const Icon = {
                      cash: Banknote,
                      upi: Smartphone,
                      card: CreditCard,
                    }[method]
                    return (
                      <div
                        key={method}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Icon className="size-4" />
                          {method === "upi"
                            ? "UPI"
                            : method === "cash"
                              ? "Cash"
                              : "Card"}
                        </div>
                        <span className="font-medium tabular-nums">
                          {formatPriceMinor(amount)}
                        </span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Business insights</CardTitle>
                  <CardDescription>
                    Review sales and payment trends.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/more/reports")}
                  >
                    <BarChart3 data-icon="inline-start" />
                    View reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
