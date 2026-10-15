import BillDetailPage from "./bill-detail-client"

export function generateStaticParams() {
  return [{ id: "_" }]
}

export default function Page() {
  return <BillDetailPage />
}
