import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Circle, CheckCircle2, Clock, Lock, Trophy, XCircle, Sparkles } from "lucide-react";

interface DropTimelineProps {
  startAt: string;
  lockAt?: string | null;
  deadlineAt?: string | null;
  endAt: string;
  status: string;
}

interface TimelineEvent {
  id: string;
  label: string;
  date: Date;
  icon: React.ElementType;
  status: "complete" | "current" | "upcoming" | "cancelled";
}

export function DropTimeline({ startAt, lockAt, deadlineAt, endAt, status }: DropTimelineProps) {
  const now = new Date();
  const start = new Date(startAt);
  const lock = lockAt ? new Date(lockAt) : null;
  const deadline = deadlineAt ? new Date(deadlineAt) : null;
  const end = new Date(endAt);

  const getEventStatus = (date: Date): "complete" | "current" | "upcoming" | "cancelled" => {
    if (status === "CANCELLED") return "cancelled";
    if (now >= date) return "complete";
    return "upcoming";
  };

  const events: TimelineEvent[] = [
    {
      id: "start",
      label: "Start",
      date: start,
      icon: Sparkles,
      status: getEventStatus(start),
    },
  ];

  if (lock) {
    events.push({
      id: "lock",
      label: "Lock",
      date: lock,
      icon: Lock,
      status: getEventStatus(lock),
    });
  }

  if (deadline) {
    events.push({
      id: "deadline",
      label: "Deadline",
      date: deadline,
      icon: Clock,
      status: getEventStatus(deadline),
    });
  }

  events.push({
    id: "end",
    label: status === "SETTLED" ? "Settled" : "End",
    date: end,
    icon: status === "SETTLED" ? Trophy : Circle,
    status: status === "SETTLED" ? "complete" : getEventStatus(end),
  });

  // Find current event
  const currentIndex = events.findIndex((e) => e.status === "upcoming");
  if (currentIndex > 0) {
    events[currentIndex - 1].status = "current";
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-8 bottom-4 w-0.5 bg-border" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const Icon = event.icon;
          const isLast = index === events.length - 1;

          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
                  event.status === "complete" && "bg-primary/20 border-primary text-primary",
                  event.status === "current" && "bg-primary border-primary text-primary-foreground animate-pulse",
                  event.status === "upcoming" && "bg-muted border-border text-muted-foreground",
                  event.status === "cancelled" && "bg-destructive/20 border-destructive text-destructive"
                )}
              >
                {event.status === "complete" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : event.status === "cancelled" ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Content */}
              <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      event.status === "current" && "text-primary",
                      event.status === "upcoming" && "text-muted-foreground",
                      event.status === "cancelled" && "text-destructive"
                    )}
                  >
                    {event.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(event.date, "MMM d, HH:mm")}
                  </span>
                </div>
                {event.status === "current" && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    In progress
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
