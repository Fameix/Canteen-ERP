import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import * as auth from "../lib/site-password"
const values = new Map<string, string>()
const sessions = new Map<string, string>()
const makeStorage = (data: Map<string, string>) => ({
  getItem: (k: string) => data.get(k) ?? null,
  setItem: (k: string, v: string) => {
    data.set(k, v)
  },
  removeItem: (k: string) => {
    data.delete(k)
  },
})
Object.assign(globalThis, {
  localStorage: makeStorage(values),
  sessionStorage: makeStorage(sessions),
  window: { dispatchEvent: () => true },
})
beforeEach(() => {
  values.clear()
  sessions.clear()
})

test("numeric passcode uses a salted verifier; only the matching password is accepted", async () => {
  await assert.rejects(() => auth.setSitePassword("short"))
  await assert.rejects(() => auth.setSitePassword("12345678"))
  await auth.setSitePassword("482691")
  assert.equal(auth.hasSitePassword(), true)
  assert.ok(![...values.values()].join("").includes("482691"))
  assert.equal(await auth.verifySitePassword("111111"), false)
  assert.equal(await auth.verifySitePassword("482691"), true)
})
test("five wrong passwords trigger a retry delay", async () => {
  await auth.setSitePassword("482691")
  for (let i = 0; i < 5; i++)
    assert.equal(await auth.verifySitePassword("wrong"), false)
  await assert.rejects(() => auth.verifySitePassword("482691"), /Wait/)
})
test("changing the numeric passcode preserves bills and owner profile", async () => {
  localStorage.setItem("hotel_erp_bills", "saved bills")
  localStorage.setItem("hotel_erp_hotel", "saved profile")
  await auth.setSitePassword("482691")
  await auth.setSitePassword("591682")
  assert.equal(await auth.verifySitePassword("482691"), false)
  assert.equal(await auth.verifySitePassword("591682"), true)
  assert.equal(localStorage.getItem("hotel_erp_bills"), "saved bills")
  assert.equal(localStorage.getItem("hotel_erp_hotel"), "saved profile")
})
test("old device-unlock sessions do not open the password-only lock; sign out closes the new session", async () => {
  const { clearAuth } = await import("../lib/storage")
  sessionStorage.setItem("canteen_device_unlocked", "1")
  localStorage.setItem("hotel_auth", JSON.stringify({ uid: "owner1" }))
  assert.equal(auth.isSiteUnlocked(), false)
  await auth.setSitePassword("482691")
  auth.openSiteSession({
    uid: "owner1",
    name: "Owner",
    role: "owner",
    hotelId: "hotel1",
  })
  assert.equal(auth.isSiteUnlocked(), true)
  clearAuth()
  assert.equal(auth.isSiteUnlocked(), false)
  assert.equal(auth.hasSitePassword(), true)
})

test("legacy site passwords can be verified once before upgrading to a numeric passcode", async () => {
  const { pbkdf2Sync } = await import("node:crypto")
  const salt = Buffer.alloc(16, 3)
  localStorage.setItem(
    "canteen_site_password_v1",
    JSON.stringify({
      version: 1,
      salt: salt.toString("base64"),
      hash: pbkdf2Sync("LegacyPassword", salt, 310000, 32, "sha256").toString(
        "base64"
      ),
      failures: 0,
      lockedUntil: 0,
    })
  )
  assert.equal(auth.hasSitePasscode(), false)
  assert.equal(await auth.verifySitePassword("LegacyPassword"), true)
  await auth.setSitePassword("482691")
  assert.equal(auth.hasSitePasscode(), true)
  assert.equal(await auth.verifySitePassword("LegacyPassword"), false)
  assert.equal(await auth.verifySitePassword("482691"), true)
})
