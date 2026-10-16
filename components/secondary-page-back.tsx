"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { secondaryPageBackHref } from "@/lib/page-navigation"

export function SecondaryPageBack({ pathname }: { pathname: string }) {
  const href = secondaryPageBackHref(pathname)
  if (!href) return null
  return (
    <div className="mb-4 flex">
      <Link
        href={href}
        className={buttonVariants({ variant: "outline" })}
        aria-label="Back to previous section"
      >
        <ArrowLeft data-icon="inline-start" />
        Back
      </Link>
    </div>
  )
}
