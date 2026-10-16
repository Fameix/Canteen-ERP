"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Home,
  Receipt,
  ClipboardList,
  UtensilsCrossed,
  CircleUser,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { DeviceGate } from "@/components/device-gate"
import { SecondaryPageBack } from "@/components/secondary-page-back"

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/billing", icon: Receipt, label: "Billing" },
  { href: "/bills", icon: ClipboardList, label: "Bills" },
  { href: "/menu", icon: UtensilsCrossed, label: "Menu" },
  { href: "/more", icon: CircleUser, label: "Profile" },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-background">
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-background lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:flex lg:w-56 lg:flex-col lg:border-t-0 lg:border-r"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="hidden items-center justify-center p-6 lg:flex">
          <Image
            src="/branding/om-saravana-bhava-logo-transparent.png"
            alt="Om Saravana Bhava"
            width={521}
            height={552}
            unoptimized
            priority
            className="h-16 w-auto shrink-0 rounded-lg object-contain"
          />
        </div>
        <Separator className="hidden lg:block" />
        <div className="flex h-16 items-center gap-1 px-2 lg:h-auto lg:flex-col lg:items-stretch lg:gap-1 lg:p-3">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                  "h-12 flex-1 flex-col gap-1 px-1 text-xs lg:h-9 lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm",
                  !isActive && "text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
        <div className="mt-auto hidden p-5 lg:block">
          <p className="text-xs text-muted-foreground">
            Simple service. Smooth billing.
          </p>
        </div>
      </nav>
      <main className="min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:ml-56 lg:pb-8">
        <div className="w-full min-w-0 p-4 md:p-8">
          <DeviceGate>
            <SecondaryPageBack pathname={pathname} />
            {children}
          </DeviceGate>
        </div>
      </main>
    </div>
  )
}
