import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { generateKeyPairSync, sign, createHash } from "node:crypto"
import * as lock from "../lib/device-lock"
const values = new Map<string, string>()
const storage = {
  getItem: (k: string) => values.get(k) ?? null,
  setItem: (k: string, v: string) => {
    values.set(k, v)
  },
  removeItem: (k: string) => {
    values.delete(k)
  },
}
Object.assign(globalThis, { localStorage: storage })
beforeEach(() => values.clear())

test("removing the site PIN keeps registered device credentials and billing data", () => {
  storage.setItem("hotel_erp_bills", "saved bills")
  storage.setItem(
    "canteen_device_lock_v1",
    JSON.stringify({
      version: 1,
      salt: "old-salt",
      pinHash: "old-hash",
      failures: 4,
      lockedUntil: 123,
      credential: { id: "device-id", publicKey: "public-key" },
    })
  )
  assert.deepEqual(lock.getDeviceLock(), {
    version: 1,
    credential: { id: "device-id", publicKey: "public-key" },
  })
  assert.ok(!storage.getItem("canteen_device_lock_v1")!.includes("pinHash"))
  assert.equal(storage.getItem("hotel_erp_bills"), "saved bills")
})

test("a device with only a legacy site PIN requires native device registration", async () => {
  storage.setItem(
    "canteen_device_lock_v1",
    JSON.stringify({ version: 1, salt: "old", pinHash: "old" })
  )
  assert.equal(lock.getDeviceLock()?.credential, undefined)
  assert.equal(await lock.unlockWithDevice(), false)
})

const origin = "https://canteen-erp.gokul-fameix.workers.dev"
const challenge = "test-challenge"
const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
})
const publicKeySpki = publicKey
  .export({ type: "spki", format: "der" })
  .toString("base64url")
function assertion(overrides: Record<string, unknown> = {}, flags = 5) {
  const clientDataJSON = Buffer.from(
    JSON.stringify({ type: "webauthn.get", challenge, origin, ...overrides })
  )
  const authData = Buffer.concat([
    createHash("sha256").update(new URL(origin).hostname).digest(),
    Buffer.from([flags, 0, 0, 0, 0]),
  ])
  const signature = sign(
    "sha256",
    Buffer.concat([
      authData,
      createHash("sha256").update(clientDataJSON).digest(),
    ]),
    privateKey
  )
  return {
    clientDataJSON: new Uint8Array(clientDataJSON),
    authenticatorData: new Uint8Array(authData),
    signature: new Uint8Array(signature),
  }
}
test("device unlock verifies a real signature bound to this challenge, origin and user verification", async () => {
  assert.equal(
    await lock.verifyDeviceAssertion(
      assertion(),
      publicKeySpki,
      challenge,
      origin
    ),
    true
  )
  assert.equal(
    await lock.verifyDeviceAssertion(
      assertion({ challenge: "replay" }),
      publicKeySpki,
      challenge,
      origin
    ),
    false
  )
  assert.equal(
    await lock.verifyDeviceAssertion(
      assertion({ origin: "https://other.example" }),
      publicKeySpki,
      challenge,
      origin
    ),
    false
  )
  assert.equal(
    await lock.verifyDeviceAssertion(
      assertion({}, 1),
      publicKeySpki,
      challenge,
      origin
    ),
    false
  )
  const tampered = assertion()
  tampered.signature[tampered.signature.length - 1] ^= 1
  assert.equal(
    await lock.verifyDeviceAssertion(
      tampered,
      publicKeySpki,
      challenge,
      origin
    ),
    false
  )
})

test("sign out closes the local unlocked session while retaining the registered device lock", async () => {
  const sessions = new Map<string, string>()
  const sessionStorage = {
    getItem: (key: string) => sessions.get(key) ?? null,
    setItem: (key: string, value: string) => {
      sessions.set(key, value)
    },
    removeItem: (key: string) => {
      sessions.delete(key)
    },
  }
  Object.assign(globalThis, {
    sessionStorage,
    window: { dispatchEvent: () => true },
  })
  const { clearAuth } = await import("../lib/storage")
  storage.setItem(
    "canteen_device_lock_v1",
    JSON.stringify({
      version: 1,
      credential: { id: "device-id", publicKey: "public-key" },
    })
  )
  assert.equal(lock.isDeviceUnlocked(), false)
  lock.openDeviceSession({
    uid: "owner1",
    name: "Owner",
    role: "owner",
    hotelId: "hotel1",
  })
  assert.equal(lock.isDeviceUnlocked(), true)
  clearAuth()
  assert.equal(lock.isDeviceUnlocked(), false)
  assert.ok(lock.getDeviceLock())
})
