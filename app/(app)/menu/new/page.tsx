"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useMenu } from "@/hooks/use-menu"
import { ProductFields } from "@/components/product-fields"
import { PageHeader } from "@/components/workspace-ui"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { MenuItem } from "@/lib/types"

export default function NewMenuItemPage() {
  const router = useRouter()
  const { categories, createItem } = useMenu()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    tamilName: "",
    categoryId: "",
    priceRupees: "",
    isAvailable: true,
  })
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!form.name.trim()) return setError("Name is required")
    if (!form.categoryId) return setError("Category is required")
    const price = parseFloat(form.priceRupees)
    if (isNaN(price) || price <= 0) return setError("Enter a valid price")

    setLoading(true)
    await new Promise((r) => setTimeout(r, 300))

    const item: MenuItem = {
      id: `item_${Date.now()}`,
      hotelId: "hotel_001",
      categoryId: form.categoryId,
      name: form.name.trim(),
      tamilName: form.tamilName.trim() || undefined,
      priceMinor: Math.round(price * 100),
      isAvailable: form.isAvailable,
      displayOrder: 99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    createItem(item)
    router.push("/menu")
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add product"
        description="Set up product details and availability."
        backAction={
          <Button variant="outline" onClick={() => router.push("/menu")}>
            <ArrowLeft data-icon="inline-start" />
            Back to menu
          </Button>
        }
      />
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Product details</CardTitle>
            <CardDescription>
              Prices are stored in Indian rupees.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <ProductFields
              value={form}
              onChange={(patch) =>
                setForm((current) => ({ ...current, ...patch }))
              }
              categories={categories}
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/menu")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              {loading ? "Adding..." : "Add product"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
