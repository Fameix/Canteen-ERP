"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, UtensilsCrossed } from "lucide-react"
import { useMenu } from "@/hooks/use-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { formatPriceMinor } from "@/lib/store"

export default function MenuPage() {
  const router = useRouter()
  const { items, categories, loading, toggleAvailability } = useMenu()
  const [search, setSearch] = useState("")
  const [activeCat, setActiveCat] = useState("all")
  const filtered = items.filter(
    (item) =>
      (activeCat === "all" || item.categoryId === activeCat) &&
      (!search.trim() ||
        item.name.toLowerCase().includes(search.trim().toLowerCase()))
  )
  const categoryOptions = [
    { id: "all", label: "All products" },
    ...categories
      .filter((c) => c.active)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((c) => ({ id: c.id, label: c.name })),
  ]

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Menu"
        description="Manage your products, prices, and availability."
        actions={
          <Button onClick={() => router.push("/menu/new")}>
            <Plus data-icon="inline-start" />
            Add product
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchField
          placeholder="Search products..."
          value={search}
          onChange={setSearch}
        />
        <Badge variant="outline">{items.length} products</Badge>
      </div>
      <FilterTabs
        label="Product categories"
        value={activeCat}
        onChange={setActiveCat}
        options={categoryOptions}
      />
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <Card className="gap-0 py-0">
          <CardContent className="divide-y p-0">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4"
              >
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <ProductImage src={item.imageUrl} alt={item.name} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {categories.find((c) => c.id === item.categoryId)?.name}
                  </p>
                  <p className="text-sm font-medium tabular-nums sm:hidden">
                    {formatPriceMinor(item.priceMinor)}
                  </p>
                </div>
                <span className="hidden w-24 text-sm font-medium tabular-nums sm:block">
                  {formatPriceMinor(item.priceMinor)}
                </span>
                <span className="hidden w-20 text-xs text-muted-foreground md:block">
                  {item.isAvailable ? "Available" : "Unavailable"}
                </span>
                <Switch
                  checked={item.isAvailable}
                  onCheckedChange={() => toggleAvailability(item.id)}
                  aria-label={`Availability for ${item.name}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${item.name}`}
                  onClick={() => router.push(`/menu/${item.id}/edit`)}
                >
                  <Pencil />
                </Button>
              </div>
            ))}
            {!filtered.length && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UtensilsCrossed />
                  </EmptyMedia>
                  <EmptyTitle>No products found</EmptyTitle>
                  <EmptyDescription>
                    Try another search or category.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      )}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {items.length} products
      </p>
    </div>
  )
}
