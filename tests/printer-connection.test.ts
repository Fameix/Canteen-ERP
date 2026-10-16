import assert from "node:assert/strict"
import { test } from "node:test"
const stored = new Map<string, string>()
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => stored.get(k) ?? null,
    setItem: (k: string, v: string) => {
      stored.set(k, v)
    },
    removeItem: (k: string) => {
      stored.delete(k)
    },
  },
  window: { isSecureContext: true },
})
Object.assign(window, { localStorage: globalThis.localStorage })
const { usePrinterStore } = await import("../lib/printer-store")
const SERVICE = "000018f0-0000-1000-8000-00805f9b34fb"
const CHARACTERISTIC = "00002af1-0000-1000-8000-00805f9b34fb"

test("printer selection accepts every service UUID and can connect and write using the short-ID printer profile", async () => {
  const writes: number[][] = []
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      bluetooth: {
        requestDevice: async (options: { optionalServices: string[] }) => {
          for (const id of options.optionalServices)
            if (
              !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
                id
              )
            )
              throw new TypeError(`Invalid Service name: '${id}'`)
          assert.ok(options.optionalServices.includes(SERVICE))
          return {
            name: "BLE test printer",
            addEventListener: () => {},
            gatt: {
              disconnect: () => {},
              connect: async () => ({
                getPrimaryService: async (id: string) => {
                  if (id !== SERVICE) throw new Error("Profile not present")
                  return {
                    getCharacteristic: async (uuid: string) => {
                      assert.equal(uuid, CHARACTERISTIC)
                      return {
                        properties: { writeWithoutResponse: true },
                        writeValueWithoutResponse: async (
                          bytes: Uint8Array
                        ) => {
                          writes.push([...bytes])
                        },
                      }
                    },
                  }
                },
              }),
            },
          }
        },
      },
    },
  })
  await usePrinterStore.getState().connect()
  assert.equal(
    usePrinterStore.getState().status,
    "connected",
    usePrinterStore.getState().error ?? undefined
  )
  assert.equal(
    await usePrinterStore
      .getState()
      .sendBytes(new Uint8Array([0x1b, 0x40, 0x0a])),
    true
  )
  assert.deepEqual(writes, [[0x1b, 0x40, 0x0a]])
  usePrinterStore.getState().disconnect()
})
