import EditMenuItemPage from "./edit-menu-client"

export function generateStaticParams() {
  return [{ id: "_" }]
}

export default function Page() {
  return <EditMenuItemPage />
}
