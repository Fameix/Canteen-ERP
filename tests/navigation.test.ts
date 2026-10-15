import assert from "node:assert/strict"
import { test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime"
import AppLayout from "../app/(app)/layout"

for (const [pathname, selected] of [
  ["/home", "/home"],
  ["/billing", "/billing"],
  ["/billing/payment", "/billing"],
  ["/bills/123", "/bills"],
  ["/menu", "/menu"],
  ["/menu/123/edit", "/menu"],
  ["/more/settings", "/more"],
] as const) {
  test(`only ${selected} is highlighted on ${pathname}`, () => {
    const html = renderToStaticMarkup(
      createElement(
        PathnameContext.Provider,
        { value: pathname },
        createElement(AppLayout, null, null)
      )
    )
    const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    assert.equal(links.length, 5)
    for (const [, attributes] of links) {
      const active = attributes.includes(`href="${selected}"`)
      assert.equal(attributes.includes('aria-current="page"'), active)
    }
  })
}
