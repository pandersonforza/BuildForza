import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];

  if (!colors) {
    return (
      <Badge variant="secondary" className={className}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={cn(colors.bg, colors.text, "border-transparent", className)}
    >
      {status}
    </Badge>
  );
}
