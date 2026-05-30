import { statusLabels } from "../lib/copy";

type StatusBadgeProps = Readonly<{
  status: string;
}>;

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${status}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}
