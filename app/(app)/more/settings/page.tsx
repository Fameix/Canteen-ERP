"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { getHotel, saveHotel, getAuth, saveOwnerName } from "@/lib/storage"
import { DEMO_HOTEL } from "@/lib/seed-data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/workspace-ui"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import type { Hotel } from "@/lib/types"

export default function SettingsPage() {
  const router = useRouter()
  const [hotel, setHotel] = useState<Hotel>(DEMO_HOTEL)
  const [ownerName, setOwnerName] = useState("")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Initialize the editable form from browser storage after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHotel(getHotel())
    setOwnerName(getHotel().ownerName ?? getAuth()?.name ?? "Owner")
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!ownerName.trim()) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    saveHotel(hotel)
    saveOwnerName(ownerName)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profile settings"
        description="Edit your owner name, business details, and receipt preferences."
      />
      <form
        onSubmit={handleSave}
        className="flex w-full min-w-0 flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>
              Your name appears on your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="owner-name">Owner name</FieldLabel>
                <Input
                  id="owner-name"
                  autoComplete="name"
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  required
                  pattern=".*\S.*"
                  title="Enter the owner's name"
                />
              </Field>
            </FieldGroup>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/login/?changePasscode=1")}
            >
              Change site passcode
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Business information</CardTitle>
            <CardDescription>
              These details appear on your bills.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="hotel-name">Hotel name</FieldLabel>
                <Input
                  id="hotel-name"
                  value={hotel.name}
                  onChange={(event) =>
                    setHotel((h) => ({ ...h, name: event.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="hotel-address">Address</FieldLabel>
                <Input
                  id="hotel-address"
                  value={hotel.address}
                  onChange={(event) =>
                    setHotel((h) => ({ ...h, address: event.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="hotel-phone">Phone</FieldLabel>
                <Input
                  id="hotel-phone"
                  value={hotel.phone}
                  onChange={(event) =>
                    setHotel((h) => ({ ...h, phone: event.target.value }))
                  }
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receipt preferences</CardTitle>
            <CardDescription>
              Customize the details printed on each receipt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="receipt-footer">Footer message</FieldLabel>
                <Input
                  id="receipt-footer"
                  value={hotel.receiptFooter}
                  onChange={(event) =>
                    setHotel((h) => ({
                      ...h,
                      receiptFooter: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="hotel-gstin">GSTIN (optional)</FieldLabel>
                <Input
                  id="hotel-gstin"
                  value={hotel.gstin ?? ""}
                  placeholder="22AAAAA0000A1Z5"
                  onChange={(event) =>
                    setHotel((h) => ({
                      ...h,
                      gstin: event.target.value || undefined,
                    }))
                  }
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={loading}>
              {loading && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              {saved ? "Saved!" : loading ? "Saving..." : "Save settings"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
