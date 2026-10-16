import assert from "node:assert/strict"
import { test } from "node:test"
import { secondaryPageBackHref } from "../lib/page-navigation"

test("secondary pages return to their parent without relying on browser history", () => {
  for (const [path, parent] of [
    ["/more/settings/", "/more"],
    ["/more/reports", "/more"],
    ["/more/printer", "/more"],
    ["/more/account", "/more"],
    ["/menu/new", "/menu"],
    ["/menu/item-1/edit/", "/menu"],
    ["/bills/bill-1", "/bills"],
    ["/billing/review", "/billing"],
    ["/billing/payment/", "/billing/review"],
    ["/billing/confirm", "/bills"],
    ["/billing/success", "/bills"],
  ])
    assert.equal(secondaryPageBackHref(path), parent, path)
})
test("main navigation pages have no secondary back CTA", () => {
  for (const path of [
    "/home",
    "/billing/",
    "/bills",
    "/menu",
    "/more",
    "/login",
  ])
    assert.equal(secondaryPageBackHref(path), null, path)
})
