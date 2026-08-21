import type { PaymentStatus } from "@/lib/orderLabels";

const STYLES: Record<PaymentStatus, string> = {
  "ожидает оплаты": "bg-amber-100 text-amber-800",
  оплачен: "bg-green-100 text-green-800",
  отменён: "bg-red-100 text-red-800",
};

export default function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${STYLES[status]}`}>{status}</span>
  );
}
