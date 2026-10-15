"use client"

import { useState, useEffect, use } from "react"
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

export default function EditMenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { items, categories, updateItem } = useMenu()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    tamilName: "",
    categoryId: "",
    priceRupees: "",
    isAvailable: true,
  })
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const item = items.find((i) => i.id === id)
    if (item) {
      // Initialize the editable form from browser storage after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: item.name,
        tamilName: item.tamilName ?? "",
        categoryId: item.categoryId,
        priceRupees: (item.priceMinor / 100).toString(),
        isAvailable: item.isAvailable,
      })
      setReady(true)
    }
  }, [items, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!form.name.trim()) return setError("Name is required")
    if (!form.categoryId) return setError("Category is required")
    const price = parseFloat(form.priceRupees)
    if (isNaN(price) || price <= 0) return setError("Enter a valid price")

    setLoading(true)
    await new Promise((r) => setTimeout(r, 300))

    const existing = items.find((i) => i.id === id)!
    const updated: MenuItem = {
      ...existing,
      name: form.name.trim(),
      tamilName: form.tamilName.trim() || undefined,
      categoryId: form.categoryId,
      priceMinor: Math.round(price * 100),
      isAvailable: form.isAvailable,
      updatedAt: new Date().toISOString(),
    }

    updateItem(updated)
    router.push("/menu")
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit product"
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
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
