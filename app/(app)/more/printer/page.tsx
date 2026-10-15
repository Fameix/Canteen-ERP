"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Bluetooth,
  BluetoothOff,
  BluetoothSearching,
  CheckCircle2,
  AlertCircle,
  Printer,
  Loader2,
  Zap,
  Info,
} from "lucide-react"
import { usePrinterStore, webBluetoothSupported, type PrinterStatus } from "@/lib/printer-store"
import { getHotel } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import type { PaperSize } from "@/lib/esc-pos"
import { PageHeader } from "@/components/workspace-ui"

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusIcon(status: PrinterStatus) {
  switch (status) {
    case "connected":    return <CheckCircle2 className="size-5 text-foreground" />
    case "connecting":   return <BluetoothSearching className="size-5 animate-pulse text-foreground" />
    case "error":        return <AlertCircle className="size-5 text-destructive" />
    default:             return <BluetoothOff className="size-5 text-muted-foreground" />
  }
}

function statusLabel(status: PrinterStatus, deviceName: string | null) {
  switch (status) {
    case "connected":  return deviceName ?? "Connected"
    case "connecting": return "Connecting…"
    case "error":      return "Connection error"
    default:           return "Not connected"
  }
}

function statusBadgeVariant(status: PrinterStatus): "default" | "outline" | "secondary" | "destructive" {
  switch (status) {
    case "connected":  return "default"
    case "connecting": return "secondary"
    case "error":      return "destructive"
    default:           return "outline"
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrinterSettingsPage() {
  const router = useRouter()
  const {
    status,
    deviceName,
    error,
    printing,
    paperSize,
    connect,
    disconnect,
    testPrint,
    setPaperSize,
    clearError,
  } = usePrinterStore()

  const [testing, setTesting]     = useState(false)
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null)
  // Web Bluetooth availability is browser-side only
  const [btSupported, setBtSupported] = useState<boolean | null>(null)

  useEffect(() => {
    setBtSupported(webBluetoothSupported())
  }, [])

  async function handleConnect() {
    clearError()
    await connect()
  }

  async function handleTestPrint() {
    setTesting(true)
    setTestResult(null)
    const hotel = getHotel()
    const ok = await testPrint(hotel)
    setTestResult(ok ? "ok" : "fail")
    setTesting(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Printer Settings"
        description="Manage your Bluetooth thermal printer connection."
        backAction={
          <Button variant="outline" onClick={() => router.push("/more")}>
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
        }
      />

      {/* ── Status card ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {statusIcon(status)}
              <div>
                <CardTitle className="text-base">
                  {statusLabel(status, deviceName)}
                </CardTitle>
                {status === "connected" && (
                  <CardDescription>BLE printer active</CardDescription>
                )}
              </div>
            </div>
            <Badge variant={statusBadgeVariant(status)}>
              {status === "connecting" ? "Connecting" :
               status === "connected"  ? "Connected"  :
               status === "error"      ? "Error"      : "Offline"}
            </Badge>
          </div>
        </CardHeader>

        {error && (
          <CardContent>
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          </CardContent>
        )}

        <CardContent className="flex gap-3">
          {status !== "connected" ? (
            <Button
              className="flex-1"
              onClick={handleConnect}
              disabled={status === "connecting" || btSupported === false}
            >
              {status === "connecting" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Bluetooth data-icon="inline-start" />
              )}
              {status === "connecting" ? "Searching…" : "Connect Printer"}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              onClick={disconnect}
            >
              <BluetoothOff data-icon="inline-start" />
              Disconnect
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Paper size ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paper Size</CardTitle>
          <CardDescription>
            Match this to the roll loaded in your printer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            variant="outline"
            value={[paperSize]}
            onValueChange={(vals) => {
              const v = vals[0] as PaperSize | undefined
              if (v === "58mm" || v === "80mm") setPaperSize(v)
            }}
            aria-label="Paper size"
          >
            <ToggleGroupItem value="58mm" aria-label="58mm">
              58 mm
            </ToggleGroupItem>
            <ToggleGroupItem value="80mm" aria-label="80mm">
              80 mm
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="mt-2 text-xs text-muted-foreground">
            {paperSize === "58mm" ? "32 chars per line" : "48 chars per line"}
          </p>
        </CardContent>
      </Card>

      {/* ── Test print ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Print</CardTitle>
          <CardDescription>
            Verify the connection by printing a short test page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            variant="outline"
            disabled={status !== "connected" || testing || printing}
            onClick={handleTestPrint}
          >
            {testing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Zap data-icon="inline-start" />
            )}
            {testing ? "Printing…" : "Send Test Page"}
          </Button>

          {testResult === "ok" && (
            <p className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="size-4" />
              Test print sent — check your printer.
            </p>
          )}
          {testResult === "fail" && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              Test failed — check the connection and try again.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Compatibility info ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Compatibility</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          {/* Browser support */}
          <div>
            <p className="mb-2 font-medium">Browser support (Web Bluetooth)</p>
            <div className="flex flex-col gap-1 text-muted-foreground">
              {[
                { label: "Chrome on Android 6+",  ok: true  },
                { label: "Chrome on Windows / macOS / Linux", ok: true  },
                { label: "Firefox",                ok: false },
                { label: "Safari / iOS",           ok: false },
                { label: "Samsung Internet",       ok: null  },
              ].map(({ label, ok }) => (
                <span key={label} className="flex items-center gap-2">
                  <span className={ok === true ? "text-foreground" : ok === false ? "text-destructive" : "text-muted-foreground"}>
                    {ok === true ? "✓" : ok === false ? "✗" : "~"}
                  </span>
                  {label}
                  {ok === null && <span className="text-xs">(partial)</span>}
                </span>
              ))}
            </div>
            {btSupported === false && (
              <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                Web Bluetooth is not available in this browser or requires HTTPS.
              </p>
            )}
          </div>

          <Separator />

          {/* Printer types */}
          <div>
            <p className="mb-2 font-medium">Printer type support</p>
            <div className="flex flex-col gap-1 text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="text-foreground">✓</span>
                BLE printers (Generic SPP, XPrinter BLE, Peripage, Star BLE)
              </span>
              <span className="flex items-center gap-2">
                <span className="text-destructive">✗</span>
                Bluetooth Classic / SPP printers — browser cannot access SPP.
                Use <strong className="text-foreground">Print via Browser</strong> for these.
              </span>
            </div>
          </div>

          <Separator />

          {/* How to use */}
          <div>
            <p className="mb-2 font-medium">How it works</p>
            <ol className="flex list-decimal flex-col gap-1 pl-4 text-muted-foreground">
              <li>Turn on your BLE printer and ensure it is in pairing mode.</li>
              <li>Tap <strong className="text-foreground">Connect Printer</strong> — the OS will show a device list.</li>
              <li>Select your printer. The app probes for known ESC/POS services.</li>
              <li>If detected, receipts print via BLE on every payment.</li>
              <li>If connection fails, the app falls back to browser print automatically.</li>
            </ol>
          </div>

          <Separator />

          {/* SPP fallback note */}
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <Printer className="size-3.5" />
              Bluetooth Classic / SPP printers
            </div>
            For printers that only support Bluetooth Classic (most budget
            58 mm printers bought before 2022), a native Android bridge is
            required. Wrap this PWA in a Capacitor shell and add
            <code className="mx-1 rounded bg-muted px-1">
              cordova-plugin-bluetooth-serial
            </code>
            for full SPP support. Until then, use the browser print dialog
            which works with any USB or network printer as well.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
