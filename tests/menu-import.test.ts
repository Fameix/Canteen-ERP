import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { DEMO_MENU_ITEMS } from "../lib/seed-data"
import {
  getMenuItems,
  getCategories,
  initializeSeeds,
  saveMenuItems,
} from "../lib/storage"

const values = new Map<string, string>()
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    values.set(key, value)
  },
  removeItem: (key: string) => {
    values.delete(key)
  },
}
Object.assign(globalThis, {
  window: { localStorage: storage },
  localStorage: storage,
})
const { useCartStore } = await import("../lib/store")

beforeEach(() => {
  values.clear()
  Object.assign(globalThis, {
    window: { localStorage: storage },
    localStorage: storage,
  })
  useCartStore.setState({ items: [] })
})

test("replaces an existing demo menu with PDF products while preserving saved bills and hotel", () => {
  storage.setItem(
    "hotel_erp_menu_items",
    JSON.stringify([{ id: "item_024", name: "Mutton Biryani" }])
  )
  storage.setItem(
    "hotel_erp_categories",
    JSON.stringify([{ id: "cat_dinner", name: "Dinner" }])
  )
  storage.setItem("hotel_erp_bills", '[{"id":"paid_bill","totalMinor":22000}]')
  storage.setItem("hotel_erp_hotel", '{"name":"My Hotel"}')
  initializeSeeds()
  const items = getMenuItems()
  assert.equal(
    items.find((item) => item.name === "Idly (2pcs)")?.priceMinor,
    2500
  )
  assert.equal(
    items.some((item) => item.name === "Mutton Biryani"),
    false
  )
  assert.equal(
    getCategories().some((category) => category.name === "Dinner"),
    false
  )
  assert.equal(
    storage.getItem("hotel_erp_bills"),
    '[{"id":"paid_bill","totalMinor":22000}]'
  )
  assert.equal(storage.getItem("hotel_erp_hotel"), '{"name":"My Hotel"}')
})

test("retains later price and availability edits when initialization runs again", () => {
  initializeSeeds()
  const items = getMenuItems().map((item) => ({ ...item }))
  items[0].priceMinor = 3500
  items[0].isAvailable = false
  saveMenuItems(items)
  initializeSeeds()
  assert.equal(getMenuItems()[0].priceMinor, 3500)
  assert.equal(getMenuItems()[0].isAvailable, false)
})

test("restores missing product images in saved menus without resetting edits", () => {
  initializeSeeds()
  const item = { ...getMenuItems()[0], name: "My Idly", priceMinor: 4500, isAvailable: false }
  delete item.imageUrl
  saveMenuItems([item])
  const restored = getMenuItems()[0]
  assert.ok(restored.imageUrl)
  assert.equal(restored.imageUrl, DEMO_MENU_ITEMS[0].imageUrl)
  assert.equal(restored.name, "My Idly")
  assert.equal(restored.priceMinor, 4500)
  assert.equal(restored.isAvailable, false)
  assert.equal(getMenuItems().length, 1)
})

test("replaces old catalog CDN photos with bundled photos and preserves custom images", () => {
  initializeSeeds()
  const items = getMenuItems().slice(0, 2).map(item => ({ ...item }))
  items[0].imageUrl = "https://images.pexels.com/photos/4331489/pexels-photo-4331489.jpeg?auto=compress"
  items[1].imageUrl = "/uploads/custom-idly.jpg"
  saveMenuItems(items)
  const restored = getMenuItems()
  assert.equal(restored[0].imageUrl, "/food-images/idly.webp")
  assert.equal(restored[1].imageUrl, "/uploads/custom-idly.jpg")
})

test("updates saved legacy image paths by product ID without changing any other fields or billing data", () => {
  initializeSeeds()
  const items = getMenuItems().slice(0, 2).map((item, index) => ({
    ...item,
    name: `Edited product ${index}`,
    priceMinor: 4750 + index,
    isAvailable: false,
    imageUrl: "/images/menu/4331489.jpg",
  }))
  saveMenuItems(items)
  storage.setItem("hotel_erp_bills", '[{"id":"existing-bill","totalMinor":12345}]')
  storage.setItem("hotel_erp_bill_counter", "42")
  storage.setItem("hotel_erp_cart", '{"state":{"items":[{"menuItemId":"osb_cat_breakfast_1","priceMinor":2500,"quantity":2}]},"version":1}')
  const billingBefore = ["hotel_erp_bills", "hotel_erp_bill_counter", "hotel_erp_cart"].map(key => storage.getItem(key))
  const updated = getMenuItems()
  assert.equal(updated[0].imageUrl, "/food-images/idly.webp")
  assert.equal(updated[1].imageUrl, "/food-images/podi-idly.webp")
  updated.forEach((item, index) => {
    const { imageUrl: previousImage, ...before } = items[index]
    const { imageUrl: updatedImage, ...after } = item
    assert.notEqual(updatedImage, previousImage)
    assert.deepEqual(after, before)
  })
  assert.deepEqual(["hotel_erp_bills", "hotel_erp_bill_counter", "hotel_erp_cart"].map(key => storage.getItem(key)), billingBefore)
})

test("discards persisted demo carts when rehydrating after the menu import", async () => {
  storage.setItem(
    "hotel_erp_cart",
    JSON.stringify({
      state: {
        items: [
          {
            menuItemId: "item_024",
            name: "Mutton Biryani",
            priceMinor: 22000,
            quantity: 1,
          },
        ],
      },
      version: 0,
    })
  )
  await useCartStore.persist.rehydrate()
  assert.deepEqual(useCartStore.getState().items, [])
})
