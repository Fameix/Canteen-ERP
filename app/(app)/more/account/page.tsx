"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AccountPage() {
  const router = useRouter()
  return (
    <div className="flex min-h-[70vh] flex-col bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Go back"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-bold">Account</h1>
        </div>
      </div>
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        Account settings coming soon.
      </div>
    </div>
  )
}
