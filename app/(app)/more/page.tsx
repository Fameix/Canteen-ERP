"use client"

import { useRouter } from "next/navigation"
import {
  BarChart3,
  Settings,
  LogOut,
  ArrowUpRight,
  UtensilsCrossed,
  Printer,
} from "lucide-react"
import { clearAuth } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { PageHeader } from "@/components/workspace-ui"

export default function MorePage() {
  const router = useRouter()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="More"
        description="Manage your business and workspace preferences."
      />
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
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Sign out of this device when your shift is complete.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
