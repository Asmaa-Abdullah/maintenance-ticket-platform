interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles =
    status === "OPEN"
      ? "bg-blue-50 text-blue-700"
      : status === "IN_PROGRESS"
        ? "bg-amber-50 text-amber-700"
        : status === "COMPLETED"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
