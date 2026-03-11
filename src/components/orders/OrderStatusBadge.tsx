/**
 * Order Status Badge Component
 * Displays order status with appropriate icon, color, and animation
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Ban,
} from "lucide-react";

export type OrderStatus =
  | "pending"
  | "processing"
  | "in_progress"
  | "completed"
  | "partial"
  | "canceled"
  | "cancelled"
  | "refunded";

interface OrderStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    icon: typeof Clock;
    colorClass: string;
    bgClass: string;
    animated: boolean;
  }
> = {
  pending: {
    label: "Ожидает",
    icon: Clock,
    colorClass: "text-amber-700 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
    animated: false,
  },
  processing: {
    label: "В обработке",
    icon: Loader2,
    colorClass: "text-blue-700 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
    animated: true,
  },
  in_progress: {
    label: "В работе",
    icon: RefreshCw,
    colorClass: "text-sky-700 dark:text-sky-400",
    bgClass: "bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800",
    animated: true,
  },
  completed: {
    label: "Выполнен",
    icon: CheckCircle2,
    colorClass: "text-green-700 dark:text-green-400",
    bgClass: "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800",
    animated: false,
  },
  partial: {
    label: "Частично",
    icon: AlertCircle,
    colorClass: "text-orange-700 dark:text-orange-400",
    bgClass: "bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800",
    animated: false,
  },
  canceled: {
    label: "Отменён",
    icon: XCircle,
    colorClass: "text-red-700 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800",
    animated: false,
  },
  cancelled: {
    label: "Отменён",
    icon: XCircle,
    colorClass: "text-red-700 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800",
    animated: false,
  },
  refunded: {
    label: "Возврат",
    icon: Ban,
    colorClass: "text-purple-700 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800",
    animated: false,
  },
};

const sizeClasses = {
  sm: "text-[10px] px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
  lg: "text-sm px-3 py-1.5 gap-2",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

export function OrderStatusBadge({
  status,
  size = "md",
  showIcon = true,
  animated = true,
  className,
}: OrderStatusBadgeProps) {
  const config = statusConfig[status as OrderStatus] || {
    label: status,
    icon: AlertCircle,
    colorClass: "text-gray-700 dark:text-gray-400",
    bgClass: "bg-gray-50 dark:bg-gray-950/50 border-gray-200 dark:border-gray-800",
    animated: false,
  };

  const Icon = config.icon;
  const isAnimated = animated && config.animated;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border inline-flex items-center",
        config.colorClass,
        config.bgClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            iconSizes[size],
            isAnimated && "animate-spin"
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}

// Progress indicator component for orders
interface OrderProgressProps {
  current: number;
  total: number;
  showPercentage?: boolean;
  className?: string;
}

export function OrderProgress({
  current,
  total,
  showPercentage = true,
  className,
}: OrderProgressProps) {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-xs text-muted-foreground font-medium min-w-[3rem] text-right">
          {percentage}%
        </span>
      )}
    </div>
  );
}

// Status timeline for order detail page
interface StatusTimelineProps {
  status: string;
  createdAt: string;
  updatedAt: string;
  className?: string;
}

export function StatusTimeline({
  status,
  createdAt,
  updatedAt,
  className,
}: StatusTimelineProps) {
  const steps = [
    { key: "created", label: "Создан", completed: true },
    { key: "processing", label: "В обработке", completed: ["processing", "in_progress", "completed", "partial"].includes(status) },
    { key: "in_progress", label: "В работе", completed: ["in_progress", "completed", "partial"].includes(status) },
    { key: "completed", label: "Завершён", completed: status === "completed" },
  ];

  if (["canceled", "cancelled", "refunded"].includes(status)) {
    steps.push({ key: "cancelled", label: "Отменён", completed: true });
  }

  return (
    <div className={cn("space-y-2", className)}>
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center gap-3">
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
              step.completed
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {step.completed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              index + 1
            )}
          </div>
          <span
            className={cn(
              "text-sm",
              step.completed ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default OrderStatusBadge;
