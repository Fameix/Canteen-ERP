"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowRight, Delete, Loader2, LockKeyhole } from "lucide-react"
import { getAuth, getHotel } from "@/lib/storage"
import {
  hasSitePasscode,
  hasSitePassword,
  openSiteSession,
  setSitePassword,
  verifySitePassword,
} from "@/lib/site-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Step = "loading" | "create" | "confirm" | "unlock" | "legacy" | "current"
export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("loading")
  const [passcode, setPasscode] = useState("")
  const [first, setFirst] = useState("")
  const [changing, setChanging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    try {
      const configured = hasSitePassword(),
        numeric = hasSitePasscode()
      const change = new URLSearchParams(location.search).has("changePasscode")
      // Initialize the saved lock only after browser storage becomes available.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(
        !configured
          ? "create"
          : !numeric
            ? "legacy"
            : change
              ? "current"
              : "unlock"
      )
      setChanging(change)
    } catch {
      setError("Allow site storage in this browser, then reload.")
      setStep("unlock")
    }
  }, [])
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (
      busy ||
      step === "loading" ||
      !passcode ||
      (step !== "legacy" && passcode.length !== 6)
    )
      return
    setError("")
    if (step === "create") {
      setFirst(passcode)
      setPasscode("")
      setStep("confirm")
      return
    }
    if (step === "confirm" && passcode !== first) {
      setPasscode("")
      setError("The passcodes did not match. Try again.")
      return
    }
    setBusy(true)
    try {
      if (step === "confirm") {
        await setSitePassword(passcode)
      } else {
        const valid = await verifySitePassword(passcode)
        if (!valid) {
          setPasscode("")
          setError(
            step === "legacy"
              ? "Incorrect current site password."
              : "Incorrect passcode. Please try again."
          )
          return
        }
        if (step === "legacy" || step === "current") {
          setPasscode("")
          setStep("create")
          return
        }
      }
      const hotel = getHotel(),
        previous = getAuth()
      openSiteSession({
        uid: previous?.uid ?? "owner1",
        name: hotel.ownerName ?? previous?.name ?? "Owner",
        role: previous?.role ?? "owner",
        hotelId: hotel.id,
      })
      setPasscode("")
      setFirst("")
      router.replace(changing ? "/more/settings/" : "/home/")
    } catch (failure) {
      setPasscode("")
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to unlock. Please try again."
      )
    } finally {
      setBusy(false)
    }
  }
  const title =
    step === "create"
      ? "Create your passcode"
      : step === "confirm"
        ? "Confirm your passcode"
        : step === "current"
          ? "Verify current passcode"
          : step === "legacy"
            ? "Switch to a passcode"
            : "Welcome back"
  const description =
    step === "create"
      ? "Choose a six-digit passcode for this site."
      : step === "confirm"
        ? "Enter the same six digits once more."
        : step === "current"
          ? "Enter your current six-digit site passcode."
          : step === "legacy"
            ? "Verify your existing site password once, then choose a numeric passcode."
            : "Enter your six-digit site passcode."
  const addDigit = (digit: string) => {
    setPasscode((value) => (value.length < 6 ? value + digit : value))
    setError("")
  }
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-8">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Image
          src="/branding/om-saravana-bhava-logo-transparent.png"
          alt="Om Saravana Bhava"
          width={521}
          height={552}
          unoptimized
          priority
          className="h-24 w-auto object-contain"
        />
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
              <LockKeyhole className="size-5 text-muted-foreground" />
            </div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {step === "loading" ? (
              <div
                className="flex justify-center py-6"
                role="status"
                aria-label="Loading sign-in"
              >
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-4">
                <Field>
                  <FieldLabel
                    htmlFor="site-passcode"
                    className={step === "legacy" ? undefined : "sr-only"}
                  >
                    {step === "legacy"
                      ? "Current site password"
                      : "Six-digit site passcode"}
                  </FieldLabel>
                  <Input
                    id="site-passcode"
                    type="password"
                    inputMode={step === "legacy" ? undefined : "numeric"}
                    pattern={step === "legacy" ? undefined : "[0-9]{6}"}
                    maxLength={step === "legacy" ? undefined : 6}
                    required
                    autoComplete={
                      step === "legacy" ? "current-password" : "off"
                    }
                    value={passcode}
                    onChange={(event) => {
                      setPasscode(
                        step === "legacy"
                          ? event.target.value
                          : event.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                      setError("")
                    }}
                    disabled={busy}
                    className={
                      step === "legacy"
                        ? undefined
                        : "h-12 text-center text-2xl tracking-[0.6em]"
                    }
                  />
                </Field>
                {step !== "legacy" && (
                  <div
                    className="grid grid-cols-3 gap-2"
                    aria-label="Passcode keypad"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                      <Button
                        key={digit}
                        type="button"
                        variant="ghost"
                        className="h-14 text-xl"
                        disabled={busy || passcode.length === 6}
                        aria-label={`Digit ${digit}`}
                        onClick={() => addDigit(String(digit))}
                      >
                        {digit}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-14"
                      disabled={busy || !passcode}
                      onClick={() => setPasscode("")}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-14 text-xl"
                      disabled={busy || passcode.length === 6}
                      aria-label="Digit 0"
                      onClick={() => addDigit("0")}
                    >
                      0
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-14"
                      disabled={busy || !passcode}
                      aria-label="Delete last digit"
                      onClick={() => setPasscode((value) => value.slice(0, -1))}
                    >
                      <Delete />
                    </Button>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={
                    busy ||
                    !passcode ||
                    (step !== "legacy" && passcode.length !== 6)
                  }
                >
                  {busy ? (
                    <Loader2
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <ArrowRight data-icon="inline-end" />
                  )}
                  {busy
                    ? "Please wait..."
                    : step === "create" ||
                        step === "legacy" ||
                        step === "current"
                      ? "Continue"
                      : step === "confirm"
                        ? "Save passcode"
                        : "Unlock"}
                </Button>
                {step === "confirm" && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      setPasscode("")
                      setFirst("")
                      setStep("create")
                      setError("")
                    }}
                  >
                    Choose a different passcode
                  </Button>
                )}
                {changing && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => router.replace("/more/settings/")}
                  >
                    Cancel
                  </Button>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
