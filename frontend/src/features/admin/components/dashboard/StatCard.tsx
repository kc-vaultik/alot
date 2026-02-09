import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  sparklineData?: number[];
  tooltipContent?: string;
  href?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  sparklineData,
  tooltipContent,
  href,
  onRefresh,
  isRefreshing,
  className,
}: StatCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (href) {
      navigate(href);
    }
  };

  const cardContent = (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all",
        href && "cursor-pointer hover:border-primary/50 hover:shadow-md",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                  }}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                </Button>
              )}
            </div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            
            {/* Trend indicator */}
            {trend && (
              <div className="flex items-center gap-1.5">
                {trend.value > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : trend.value < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    trend.value > 0 ? "text-green-500" : trend.value < 0 ? "text-red-500" : "text-muted-foreground"
                  )}
                >
                  {trend.value > 0 ? "+" : ""}{trend.value}%
                </span>
                {trend.label && (
                  <span className="text-xs text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
            
            {subtitle && !trend && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {Icon && (
              <div className="rounded-lg bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
            )}
            
            {/* Sparkline mini-chart */}
            {sparklineData && sparklineData.length > 0 && (
              <div className="flex items-end gap-px h-8 w-20">
                {sparklineData.slice(-10).map((val, i) => {
                  const max = Math.max(...sparklineData, 1);
                  const height = (val / max) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary/40 rounded-t"
                      style={{ height: `${Math.max(height, 8)}%` }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {subtitle && trend && (
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  if (tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="group">{cardContent}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <div className="group">{cardContent}</div>;
}
