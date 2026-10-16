export interface DeviceLock {
  version: 1
  credential?: { id: string; publicKey: string }
}
const KEY = "canteen_device_lock_v1"
const SESSION = "canteen_device_unlocked"

export function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}
function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const raw = atob(value.replaceAll("-", "+").replaceAll("_", "/"))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}
function buffer(value: Uint8Array): ArrayBuffer {
  return Uint8Array.from(value).buffer
}
export function getDeviceLock(): DeviceLock | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  const record = JSON.parse(raw) as DeviceLock
  if (record.version !== 1)
    throw new Error(
      "The device lock could not be read. Try this browser again."
    )
  const normalized: DeviceLock = { version: 1, credential: record.credential }
  if (JSON.stringify(normalized) !== raw) save(normalized)
  return normalized
}
function save(record: DeviceLock) {
  localStorage.setItem(KEY, JSON.stringify(record))
}
export function isDeviceUnlocked(): boolean {
  try {
    return (
      sessionStorage.getItem(SESSION) === "1" &&
      !!localStorage.getItem("hotel_auth")
    )
  } catch {
    return false
  }
}
export function openDeviceSession(user: {
  uid: string
  name: string
  role: string
  hotelId: string
}) {
  localStorage.setItem("hotel_auth", JSON.stringify(user))
  sessionStorage.setItem(SESSION, "1")
  window.dispatchEvent(new Event("device-lock-change"))
}
export async function supportsDeviceUnlock(): Promise<boolean> {
  try {
    return (
      window.isSecureContext &&
      typeof PublicKeyCredential !== "undefined" &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    )
  } catch {
    return false
  }
}
function validateClient(
  data: Uint8Array,
  type: string,
  challenge: string,
  origin: string
): boolean {
  try {
    const client = JSON.parse(new TextDecoder().decode(data))
    return (
      client.type === type &&
      client.challenge === challenge &&
      client.origin === origin &&
      !client.crossOrigin
    )
  } catch {
    return false
  }
}
async function validAuthData(
  data: Uint8Array,
  origin: string
): Promise<boolean> {
  if (data.length < 37 || (data[32] & 5) !== 5) return false
  const expected = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(new URL(origin).hostname)
    )
  )
  return expected.every((v, i) => data[i] === v)
}
// WebAuthn ES256 signatures use ASN.1 DER; WebCrypto expects fixed-width r||s.
function rawSignature(der: Uint8Array): Uint8Array<ArrayBuffer> {
  if (der[0] !== 0x30 || der[1] !== der.length - 2 || der[2] !== 2)
    throw new Error("Invalid signature")
  const rLength = der[3],
    sStart = 4 + rLength
  if (der[sStart] !== 2) throw new Error("Invalid signature")
  const sLength = der[sStart + 1]
  if (sStart + 2 + sLength !== der.length) throw new Error("Invalid signature")
  const output = new Uint8Array(64)
  for (const [part, offset] of [
    [der.slice(4, 4 + rLength), 0],
    [der.slice(sStart + 2), 32],
  ] as const) {
    const value = part.length === 33 && part[0] === 0 ? part.slice(1) : part
    if (value.length > 32 || !value.length) throw new Error("Invalid signature")
    output.set(value, offset + 32 - value.length)
  }
  return output
}
export async function verifyDeviceAssertion(
  response: {
    clientDataJSON: Uint8Array
    authenticatorData: Uint8Array
    signature: Uint8Array
  },
  publicKey: string,
  challenge: string,
  origin: string
): Promise<boolean> {
  try {
    if (
      !validateClient(
        response.clientDataJSON,
        "webauthn.get",
        challenge,
        origin
      ) ||
      !(await validAuthData(response.authenticatorData, origin))
    )
      return false
    const hash = new Uint8Array(
      await crypto.subtle.digest("SHA-256", buffer(response.clientDataJSON))
    )
    const signed = new Uint8Array(
      response.authenticatorData.length + hash.length
    )
    signed.set(response.authenticatorData)
    signed.set(hash, response.authenticatorData.length)
    const key = await crypto.subtle.importKey(
      "spki",
      fromBase64Url(publicKey),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    )
    return await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      rawSignature(response.signature),
      signed
    )
  } catch {
    return false
  }
}
export async function registerDeviceUnlock(name: string): Promise<void> {
  const record = getDeviceLock()
  if (record?.credential && !isDeviceUnlocked())
    throw new Error("Unlock with your registered device first.")
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { id: location.hostname, name: "Om Saravana Bhava" },
      user: {
        id: crypto.getRandomValues(new Uint8Array(32)),
        name,
        displayName: name,
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      attestation: "none",
      timeout: 60000,
    },
  })) as PublicKeyCredential | null
  if (!credential)
    throw new Error(
      "Device unlock was cancelled. Try again when you are ready."
    )
  const response = credential.response as AuthenticatorAttestationResponse
  const publicKey = response.getPublicKey?.()
  if (
    !publicKey ||
    response.getPublicKeyAlgorithm() !== -7 ||
    !validateClient(
      new Uint8Array(response.clientDataJSON),
      "webauthn.create",
      toBase64Url(challenge),
      location.origin
    ) ||
    !(await validAuthData(
      new Uint8Array(response.getAuthenticatorData()),
      location.origin
    ))
  )
    throw new Error(
      "This browser could not register device unlock. Try a supported browser with device screen lock enabled."
    )
  save({
    version: 1,
    credential: {
      id: toBase64Url(new Uint8Array(credential.rawId)),
      publicKey: toBase64Url(new Uint8Array(publicKey)),
    },
  })
}
export async function unlockWithDevice(): Promise<boolean> {
  const record = getDeviceLock()
  if (!record?.credential) return false
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const result = (await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: location.hostname,
      allowCredentials: [
        { type: "public-key", id: fromBase64Url(record.credential.id) },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  })) as PublicKeyCredential | null
  if (
    !result ||
    toBase64Url(new Uint8Array(result.rawId)) !== record.credential.id
  )
    return false
  const response = result.response as AuthenticatorAssertionResponse
  const valid = await verifyDeviceAssertion(
    {
      clientDataJSON: new Uint8Array(response.clientDataJSON),
      authenticatorData: new Uint8Array(response.authenticatorData),
      signature: new Uint8Array(response.signature),
    },
    record.credential.publicKey,
    toBase64Url(challenge),
    location.origin
  )
  return valid
}
