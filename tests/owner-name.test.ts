import assert from "node:assert/strict"
import { test } from "node:test"
import * as storage from "../lib/storage"

const values = new Map<string, string>()
const localStorage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    values.set(key, value)
  },
  removeItem: (key: string) => {
    values.delete(key)
  },
}
Object.assign(globalThis, { window: { localStorage }, localStorage })

test("owner name persists after sign out without changing billing or business details", () => {
  values.clear()
  storage.saveHotel({
    ...storage.getHotel(),
    name: "Restaurant",
    phone: "12345",
  })
  const hotel = storage.getHotel()
  localStorage.setItem(
    "hotel_auth",
    JSON.stringify({
      uid: "owner1",
      name: "Old",
      role: "owner",
      hotelId: hotel.id,
    })
  )
  localStorage.setItem("hotel_erp_bills", '[{"id":"paid","totalMinor":5000}]')
  assert.equal(storage.saveOwnerName("  Saravana  "), true)
  assert.deepEqual(storage.getHotel(), { ...hotel, ownerName: "Saravana" })
  assert.equal(storage.getAuth()?.name, "Saravana")
  storage.clearAuth()
  assert.equal(storage.getHotel().ownerName, "Saravana")
  assert.equal(
    localStorage.getItem("hotel_erp_bills"),
    '[{"id":"paid","totalMinor":5000}]'
  )
  assert.equal(storage.saveOwnerName("   "), false)
  assert.equal(storage.getHotel().ownerName, "Saravana")
})
