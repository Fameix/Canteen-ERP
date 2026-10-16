"use client"

import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import {
  useCartStore,
  cartTotalMinor,
  cartTotalItems,
  formatPriceMinor,
} from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { PageHeader } from "@/components/workspace-ui"

export default function BillReviewPage() {
  const router = useRouter()
  const { items, updateQuantity } = useCartStore()
  const total = cartTotalMinor(items)
  const count = cartTotalItems(items)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Review Bill"
        description={`${count} items in your current order.`}
      />
      {!items.length ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingCart />
            </EmptyMedia>
            <EmptyTitle>Your order is empty</EmptyTitle>
            <EmptyDescription>
              Add products from the menu to start a bill.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => router.push("/billing")}>
              Go to billing
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Order items</CardTitle>
              <CardDescription>
                Review quantities before confirming.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {items.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPriceMinor(item.priceMinor)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Decrease ${item.name}`}
                      onClick={() =>
                        updateQuantity(item.menuItemId, item.quantity - 1)
                      }
                    >
                      <Minus />
                    </Button>
                    <span className="w-6 text-center text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Increase ${item.name}`}
                      onClick={() =>
                        updateQuantity(item.menuItemId, item.quantity + 1)
                      }
                    >
                      <Plus />
                    </Button>
                  </div>
                  <span className="w-16 text-right text-sm font-medium tabular-nums">
                    {formatPriceMinor(item.priceMinor * item.quantity)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Bill summary</CardTitle>
              <CardDescription>
                Confirm payment now or record it as pending.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatPriceMinor(total)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatPriceMinor(total)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => router.push(`/billing/payment?amount=${total}`)}
              >
                Confirm &amp; record payment
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(`/billing/confirm?amount=${total}&pending=true`)
                }
              >
                Confirm as pending
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
