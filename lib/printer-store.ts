/**
 * Bluetooth printer store — Web Bluetooth (BLE) only.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * Browser support
 * ────────────────────────────────────────────────────────────────────────────
 * ✅ Chrome on Android 56+  (HTTPS required in production)
 * ✅ Chrome on Windows / macOS / Linux
 * ❌ Firefox          — Web Bluetooth not supported
 * ❌ Safari / iOS     — Web Bluetooth not supported
 * ❌ Samsung Internet — partial / unreliable
 *
 * ────────────────────────────────────────────────────────────────────────────
 * Bluetooth Classic (SPP) printers
 * ────────────────────────────────────────────────────────────────────────────
 * Most inexpensive thermal printers pair via Bluetooth Classic + SPP.
 * The Web Bluetooth API cannot access Classic BT services — it is BLE-only.
 * For SPP printers the store will fail at "no compatible service found" and
 * the caller must fall back to the browser-popup print path.
 *
 * If native Android SPP support is needed in future, wrap the app in a
 * Capacitor/Cordova shell and use the cordova-plugin-bluetooth-serial plugin.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * Known BLE GATT profiles (community-sourced, unverified on all hardware)
 * ────────────────────────────────────────────────────────────────────────────
 * Profile 1 — Generic BLE SPP simulation (very common on cheap BLE printers)
 *   Service   49535343-fe7d-4ae5-8fa9-9fafd205e455
 *   Write     49535343-8841-43f4-a8d4-ecbe34729bb3
 *
 * Profile 2 — Peripage / 0xFF00 series
 *   Service   0000ff00-0000-1000-8000-00805f9b34fb
 *   Write     0000ff02-0000-1000-8000-00805f9b34fb
 *
 * Profile 3 — XPrinter / RPP BLE series
 *   Service   e7810a71-73ae-499d-8c15-faa9aef0c3f2
 *   Write     bef8d6c9-9c21-4c9e-b632-bd58c1009f9f
 *
 * Profile 4 — Star Micronics BLE
 *   Service   000018f0-0000-1000-8000-00805f9b34fb
 *   Write     00002af1-0000-1000-8000-00805f9b34fb
 *
 * ⚠️  UNVERIFIED: Actual compatibility depends on your printer's firmware.
 *     Test with buildTestReceipt() before live use.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Bill, Hotel } from "./types"
import { buildEscPosReceipt, buildTestReceipt, type PaperSize } from "./esc-pos"

// ─── BLE Profiles ─────────────────────────────────────────────────────────────

const BLE_PROFILES = [
  {
    label: "Generic BLE SPP",
    serviceUuid: "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    writeUuid:   "49535343-8841-43f4-a8d4-ecbe34729bb3",
  },
  {
    label: "Peripage / FF00",
    serviceUuid: "0000ff00-0000-1000-8000-00805f9b34fb",
    writeUuid:   "0000ff02-0000-1000-8000-00805f9b34fb",
  },
  {
    label: "XPrinter BLE",
    serviceUuid: "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
    writeUuid:   "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f",
  },
  {
    label: "Star Micronics BLE",
    serviceUuid: "000018f0-0000-1000-8000-00805f9b34fb",
    writeUuid:   "00002af1-0000-1000-8000-00805f9b34fb",
  },
] as const

// ─── Module-level BT references (not serialisable → not in Zustand state) ────

let _device: BluetoothDevice | null = null
let _char: BluetoothRemoteGATTCharacteristic | null = null

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PrinterStatus = "disconnected" | "connecting" | "connected" | "error"

export interface PrinterState {
  // ── runtime (not persisted) ──
  status: PrinterStatus
  deviceName: string | null
  error: string | null
  printing: boolean
  // ── persisted ──
  paperSize: PaperSize
  // ── actions ──
  connect: () => Promise<void>
  disconnect: () => void
  sendBytes: (data: Uint8Array) => Promise<boolean>
  printReceipt: (bill: Bill, hotel: Hotel) => Promise<boolean>
  testPrint: (hotel: Hotel) => Promise<boolean>
  setPaperSize: (size: PaperSize) => void
  clearError: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isWebBTAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "bluetooth" in navigator &&
    (typeof window === "undefined" || window.isSecureContext)
  )
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set, get) => ({
      // ── initial state ──────────────────────────────────────────────────────
      status: "disconnected",
      deviceName: null,
      error: null,
      printing: false,
      paperSize: "80mm",

      // ── actions ───────────────────────────────────────────────────────────

      clearError() {
        set({ error: null })
      },

      setPaperSize(size) {
        set({ paperSize: size })
      },

      /**
       * Show the OS Bluetooth device picker, connect to the GATT server and
       * probe known print profiles. Fails silently with an error message.
       */
      async connect() {
        if (!isWebBTAvailable()) {
          set({
            status: "error",
            error:
              "Web Bluetooth is not available. Use Chrome on Android / desktop over HTTPS.",
          })
          return
        }

        set({ status: "connecting", error: null })

        try {
          const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: BLE_PROFILES.map(p => p.serviceUuid),
          })

          // Handle unexpected disconnection
          device.addEventListener("gattserverdisconnected", () => {
            _device = null
            _char = null
            // Only update if we were connected (not mid-reconnect)
            if (get().status === "connected") {
              set({ status: "disconnected", error: "Printer disconnected unexpectedly." })
            }
          })

          const server = await device.gatt!.connect()

          // ── Probe known profiles ──────────────────────────────────────────
          let matched = false
          for (const profile of BLE_PROFILES) {
            try {
              const svc  = await server.getPrimaryService(profile.serviceUuid)
              const char = await svc.getCharacteristic(profile.writeUuid)
              _device = device
              _char   = char
              matched = true
              break
            } catch {
              // This profile not present on device — try next
            }
          }

          if (!matched) {
            // Clean up the GATT connection
            try { device.gatt!.disconnect() } catch { /* ignore */ }
            set({
              status: "error",
              error:
                "No compatible BLE print service found on this device.\n" +
                "If this is a Bluetooth Classic (SPP) printer, BLE is not supported " +
                "in the browser — use 'Print via Browser' instead.",
            })
            return
          }

          set({
            status: "connected",
            deviceName: device.name ?? "Thermal Printer",
            error: null,
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          // User-cancelled selection → not an error worth showing
          const silent =
            msg.toLowerCase().includes("cancel") ||
            msg.toLowerCase().includes("user gesture")
          set({
            status: "disconnected",
            error: silent ? null : `Connection failed: ${msg}`,
          })
        }
      },

      /**
       * Cleanly disconnect and reset state.
       */
      disconnect() {
        try { _device?.gatt?.disconnect() } catch { /* ignore */ }
        _device = null
        _char   = null
        set({ status: "disconnected", deviceName: null, error: null })
      },

      /**
       * Write raw ESC/POS bytes to the printer in 128-byte chunks.
       * Returns true on success, false on any error.
       * Never throws.
       */
      async sendBytes(data: Uint8Array): Promise<boolean> {
        if (get().status !== "connected" || !_char) return false
        if (get().printing) return false // duplicate-tap guard

        set({ printing: true, error: null })
        try {
          const CHUNK = 128 // safe for most BLE 4.0+ peripherals

          for (let offset = 0; offset < data.length; offset += CHUNK) {
            if (!_char) throw new Error("Printer disconnected mid-print")

            const chunk = data.subarray(offset, offset + CHUNK)

            // Prefer writeWithoutResponse for speed; fall back to writeValue
            if (_char.properties.writeWithoutResponse) {
              await _char.writeValueWithoutResponse(chunk)
            } else {
              await _char.writeValue(chunk)
            }

            // Give the printer time to drain its internal buffer
            await sleep(20)
          }

          return true
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          set({ error: `Print error: ${msg}` })
          return false
        } finally {
          set({ printing: false })
        }
      },

      /**
       * Build and send an ESC/POS receipt for a bill.
       * Never throws. Returns false → caller should use browser-print fallback.
       */
      async printReceipt(bill: Bill, hotel: Hotel): Promise<boolean> {
        const data = buildEscPosReceipt(bill, hotel, get().paperSize)
        return get().sendBytes(data)
      },

      /**
       * Print a short test page to verify the connection.
       * Never throws.
       */
      async testPrint(hotel: Hotel): Promise<boolean> {
        const data = buildTestReceipt(hotel, get().paperSize)
        return get().sendBytes(data)
      },
    }),

    // ── Persistence (paper size only; runtime state is ephemeral) ─────────
    {
      name: "hotel_erp_printer",
      partialize: (s): Pick<PrinterState, "paperSize"> => ({
        paperSize: s.paperSize,
      }),
    }
  )
)

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Returns true when the current environment can use Web Bluetooth. */
export function webBluetoothSupported(): boolean {
  return isWebBTAvailable()
}
