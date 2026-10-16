interface PasswordRecord {
  version: 1
  kind?: "passcode"
  salt: string
  hash: string
  failures: number
  lockedUntil: number
}
const KEY = "canteen_site_password_v1"
const SESSION = "canteen_site_unlocked"
function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}
function decode(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
}
function read(): PasswordRecord | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  const record = JSON.parse(raw) as PasswordRecord
  if (record.version !== 1 || !record.salt || !record.hash)
    throw new Error(
      "The saved site password could not be read. Try this browser again."
    )
  return record
}
export function hasSitePasscode(): boolean {
  return read()?.kind === "passcode"
}
export function hasSitePassword(): boolean {
  return !!read()
}
async function derive(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  return encode(
    new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: decode(salt),
          iterations: 310000,
          hash: "SHA-256",
        },
        key,
        256
      )
    )
  )
}
export async function setSitePassword(password: string): Promise<void> {
  if (!/^\d{6}$/.test(password)) throw new Error("Use exactly six digits.")
  const salt = encode(crypto.getRandomValues(new Uint8Array(16)))
  const record: PasswordRecord = {
    version: 1,
    kind: "passcode",
    salt,
    hash: await derive(password, salt),
    failures: 0,
    lockedUntil: 0,
  }
  localStorage.setItem(KEY, JSON.stringify(record))
}
export async function verifySitePassword(password: string): Promise<boolean> {
  const record = read()
  if (!record) return false
  if (record.lockedUntil > Date.now())
    throw new Error("Wait 30 seconds before trying again.")
  const candidate = await derive(password, record.salt)
  let difference = candidate.length ^ record.hash.length
  for (let i = 0; i < record.hash.length; i++)
    difference |= candidate.charCodeAt(i) ^ record.hash.charCodeAt(i)
  const valid = difference === 0
  const failures = valid ? 0 : record.lockedUntil ? 1 : record.failures + 1
  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...record,
      failures,
      lockedUntil: failures >= 5 ? Date.now() + 30000 : 0,
    })
  )
  return valid
}
export function isSiteUnlocked(): boolean {
  try {
    return (
      sessionStorage.getItem(SESSION) === "1" &&
      !!localStorage.getItem("hotel_auth") &&
      hasSitePassword()
    )
  } catch {
    return false
  }
}
export function openSiteSession(user: {
  uid: string
  name: string
  role: string
  hotelId: string
}) {
  localStorage.setItem("hotel_auth", JSON.stringify(user))
  sessionStorage.setItem(SESSION, "1")
  sessionStorage.removeItem("canteen_device_unlocked")
  window.dispatchEvent(new Event("site-lock-change"))
}
