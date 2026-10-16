"use client"

import { useEffect, useSyncExternalStore } from "react"
import { isSiteUnlocked } from "@/lib/site-password"

function subscribe(callback: () => void) {
  window.addEventListener("site-lock-change", callback)
  window.addEventListener("storage", callback)
  window.addEventListener("focus", callback)
  return () => {
    window.removeEventListener("site-lock-change", callback)
    window.removeEventListener("storage", callback)
    window.removeEventListener("focus", callback)
  }
}

export function DeviceGate({ children }: { children: React.ReactNode }) {
  const unlocked = useSyncExternalStore(subscribe, isSiteUnlocked, () => false)
  useEffect(() => {
    if (!isSiteUnlocked()) window.location.replace("/login/")
  }, [unlocked])
  return unlocked ? children : null
}
