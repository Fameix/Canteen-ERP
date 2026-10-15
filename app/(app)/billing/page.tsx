"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  useCartStore,
  cartTotalMinor,
  cartTotalItems,
  formatPriceMinor,
} from "@/lib/store"
import { useMenu } from "@/hooks/use-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { ProductImage } from "@/components/product-image"
import { PageHeader, SearchField, FilterTabs } from "@/components/workspace-ui"

export default function BillingPage() {
  const router = useRouter()
  const { items: menuItems, categories, loading } = useMenu()
  const {
    items: cartItems,
    addItem,
    updateQuantity,
    clearCart,
  } = useCartStore()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const total = cartTotalMinor(cartItems)
  const count = cartTotalItems(cartItems)
  const filteredItems = useMemo(
    () =>
      menuItems.filter(
        (item) =>
          item.isAvailable &&
          (activeCategory === "all" || item.categoryId === activeCategory) &&
          (!search.trim() ||
            item.name.toLowerCase().includes(search.trim().toLowerCase()) ||
            item.tamilName?.includes(search.trim()))
      ),
    [menuItems, activeCategory, search]
  )
  const frequentItems = useMemo(
    () =>
      [
        "cat_breakfast",
        "cat_dosa",
        "cat_lunch",
        "cat_hot_beverages",
        "cat_snacks",
      ].flatMap((id) => {
        const item = menuItems.find((i) => i.categoryId === id && i.isAvailable)
        return item ? [item] : []
      }),
    [menuItems]
  )
  const categoryOptions = [
    { id: "all", label: "All products" },
    ...categories
      .filter((c) => c.active)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((c) => ({ id: c.id, label: c.name })),
  ]

  function handleAddItem(item: (typeof menuItems)[0]) {
    addItem({
      menuItemId: item.id,
      name: item.name,
      tamilName: item.tamilName,
      priceMinor: item.priceMinor,
    })
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="New bill"
        description="Choose products and build your customer's order."
        actions={
          <Badge variant="outline">
            <ShoppingBag data-icon="inline-start" />
            {count} items selected
          </Badge>
        }
      />
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="flex min-w-0 flex-col gap-5" aria-label="Products">
          <div className="sticky top-0 z-30 -mx-4 flex min-w-0 flex-col gap-4 border-b bg-background px-4 pt-4 pb-2 shadow-sm md:-mx-2 md:px-2">
            <SearchField
              placeholder="Search food items..."
              value={search}
              onChange={setSearch}
            />
            <FilterTabs
              label="Product categories"
              value={activeCategory}
              onChange={setActiveCategory}
              options={categoryOptions}
            />
          </div>
          {!search && activeCategory === "all" && frequentItems.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                Quick add
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {frequentItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="shrink-0"
                    onClick={() => handleAddItem(item)}
                  >
                    <Plus data-icon="inline-start" />
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : !filteredItems.length ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>No products found</EmptyTitle>
                <EmptyDescription>
                  Try a different search or category.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 md:gap-4">
              {filteredItems.map((item) => {
                const qty =
                  cartItems.find((i) => i.menuItemId === item.id)?.quantity ?? 0
                return (
                  <Card key={item.id} size="sm" className="gap-3 pt-0">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <ProductImage src={item.imageUrl} alt={item.name} />
                      {qty > 0 && (
                        <Badge className="absolute top-2 right-2">
                          {qty} in order
                        </Badge>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle>{item.name}</CardTitle>
                      <CardDescription>
                        {categories.find((c) => c.id === item.categoryId)?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatPriceMinor(item.priceMinor)}
                      </span>
                      {qty === 0 ? (
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={`Add ${item.name}`}
                          onClick={() => handleAddItem(item)}
                        >
                          <Plus className="size-5" />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Decrease ${item.name}`}
                            onClick={() => updateQuantity(item.id, qty - 1)}
                          >
                            <Minus className="size-5" />
                          </Button>
                          <span
                            className="min-w-6 text-center text-base font-semibold tabular-nums"
                            aria-label={`${item.name} quantity`}
                          >
                            {qty}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Increase ${item.name}`}
                            onClick={() => handleAddItem(item)}
                          >
                            <Plus className="size-5" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
        <aside className="hidden xl:block">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Current order</CardTitle>
              <CardDescription>
                {count
                  ? `${count} items ready to review`
                  : "Your next order starts here."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {count ? (
                <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatPriceMinor(item.priceMinor)}
                        </p>
                      </div>
                      <span className="shrink-0 tabular-nums">
                        {formatPriceMinor(item.priceMinor * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">
                      {formatPriceMinor(total)}
                    </span>
                  </div>
                </div>
              ) : (
                <Empty className="px-0">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ShoppingBag />
                    </EmptyMedia>
                    <EmptyTitle>No items yet</EmptyTitle>
                    <EmptyDescription>
                      Add products from the menu to start a bill.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                className="w-full"
                disabled={!count}
                onClick={() => router.push("/billing/review")}
                aria-label="Checkout"
              >
                Checkout
                <ArrowRight data-icon="inline-end" />
              </Button>
              {count > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={clearCart}
                >
                  <Trash2 data-icon="inline-start" />
                  Clear order
                </Button>
              )}
            </CardFooter>
          </Card>
        </aside>
      </div>
      {count > 0 && (
        <div className="fixed right-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 z-40 border-t bg-background p-3 lg:bottom-0 lg:left-56 xl:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear order"
                onClick={clearCart}
              >
                <Trash2 />
              </Button>
              <div>
                <p className="text-xs text-muted-foreground">{count} items</p>
                <p className="text-base font-semibold tabular-nums">
                  {formatPriceMinor(total)}
                </p>
              </div>
            </div>
            <Button
              aria-label="Checkout"
              onClick={() => router.push("/billing/review")}
            >
              Checkout
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
