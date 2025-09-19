import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

export interface StatusIndicatorProps {
  status:
    | "healthy"
    | "unreachable"
    | "invalid-response"
    | "warning"
    | "offline";
  label: string;
  description?: string;
  latencyMs?: number | null;
  className?: string;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
  },
  warning: {
    icon: AlertCircle,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  "invalid-response": {
    icon: AlertCircle,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  unreachable: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    iconColor: "text-red-600 dark:text-red-400",
  },
  offline: {
    icon: Clock,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    borderColor: "border-gray-200 dark:border-gray-800",
    iconColor: "text-gray-600 dark:text-gray-400",
  },
};

export function StatusIndicator({
  status,
  label,
  description,
  latencyMs,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 hover:shadow-sm",
        config.bgColor,
        config.borderColor,
        className,
      )}
    >
      <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className={cn("font-medium text-sm", config.color)}>{label}</h3>
          {latencyMs !== null && (
            <span className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 px-2 py-1 rounded-full">
              {latencyMs}ms
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className={cn("text-xs font-medium", config.color)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function StatusList({
  items,
  className,
}: {
  items: StatusIndicatorProps[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3", className)}>
      {items.map((item, index) => (
        <StatusIndicator key={index} {...item} />
      ))}
    </div>
  );
}
