"use client"

import { useRouter } from "next/navigation"
import {
  BarChart3,
  Settings,
  LogOut,
  ArrowUpRight,
  UtensilsCrossed,
  Printer,
  CircleUser,
  Phone,
  MapPin,
  Building2,
  BadgeCheck,
} from "lucide-react"
import { clearAuth } from "@/lib/storage"
import { getHotel, getAuth } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/workspace-ui"

export default function ProfilePage() {
  const router = useRouter()
  const hotel  = getHotel()
  const user   = getAuth()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profile"
        description="Your account and workspace details."
      />

      {/* ── Profile card ── */}
      <Card className="max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CircleUser className="size-7" />
            </div>
            <div>
              <CardTitle className="text-lg">{user?.name ?? "Owner"}</CardTitle>
              <CardDescription className="capitalize">{user?.role ?? "owner"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="mt-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">{hotel.name}</p>
              {hotel.gstin && (
                <p className="text-xs text-muted-foreground">GSTIN: {hotel.gstin}</p>
              )}
            </div>
          </div>
          {hotel.address && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{hotel.address}</p>
            </div>
          )}
          {hotel.phone && (
            <div className="flex items-center gap-3">
              <Phone className="size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{hotel.phone}</p>
            </div>
          )}
          {hotel.taxEnabled && (
            <div className="flex items-center gap-3">
              <BadgeCheck className="size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Tax: {hotel.taxRate}% enabled</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={() => {
              clearAuth()
              router.push("/login")
            }}
          >
            <LogOut data-icon="inline-start" />
            Sign out
          </Button>
        </CardFooter>
      </Card>

      {/* ── Feature cards ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            icon: BarChart3,
            title: "Reports",
            description: "Track sales, revenue, and payment methods.",
            href: "/more/reports",
            action: "View reports",
          },
          {
            icon: UtensilsCrossed,
            title: "Menu management",
            description: "Manage your products, prices, and availability.",
            href: "/menu",
            action: "Manage menu",
          },
          {
            icon: Settings,
            title: "Hotel settings",
            description: "Update your business details and receipts.",
            href: "/more/settings",
            action: "Open settings",
          },
          {
            icon: Printer,
            title: "Printer",
            description: "Connect a BLE thermal printer for automatic receipts.",
            href: "/more/printer",
            action: "Printer settings",
          },
        ].map(({ icon: Icon, title, description, href, action }) => (
          <Card key={href}>
            <CardHeader>
              <div className="mb-2 flex size-9 items-center justify-center rounded-lg border bg-muted">
                <Icon className="size-4" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push(href)}>
                {action}
                <ArrowUpRight data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
