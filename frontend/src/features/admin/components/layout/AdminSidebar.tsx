import { useAdminContext } from "../../context/AdminContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useNavigate, useLocation } from "react-router-dom";
import { ADMIN_NAV_ITEMS, ADMIN_ROUTES } from "../../constants";
import { useAdminBadgeCounts } from "../../hooks/data/useAdminBadgeCounts";
import {
  LayoutDashboard,
  Sparkles,
  Package,
  TrendingUp,
  Users,
  Headphones,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Clock,
  Search,
} from "lucide-react";
import { useState } from "react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Sparkles,
  Package,
  TrendingUp,
  Users,
  HeadphonesIcon: Headphones,
  Settings,
};

// Badge keys mapped to nav items
const badgeMap: Record<string, keyof ReturnType<typeof useAdminBadgeCounts>["data"] & string> = {
  [ADMIN_ROUTES.DROPS]: "activeDrops",
  [ADMIN_ROUTES.USERS]: "pendingKyc",
  [ADMIN_ROUTES.SUPPORT]: "pendingAwards",
};

// Sub-menu items for expandable sections
const subMenus: Record<string, { label: string; href: string }[]> = {
  [ADMIN_ROUTES.USERS]: [
    { label: "All Users", href: ADMIN_ROUTES.USERS },
    { label: "Pending KYC", href: `${ADMIN_ROUTES.USERS}?filter=pending-kyc` },
    { label: "Moderators", href: `${ADMIN_ROUTES.USERS}?filter=moderators` },
  ],
  [ADMIN_ROUTES.DROPS]: [
    { label: "All Drops", href: ADMIN_ROUTES.DROPS },
    { label: "Active", href: `${ADMIN_ROUTES.DROPS}?status=open` },
    { label: "Create New", href: `${ADMIN_ROUTES.DROPS}/new` },
  ],
};

export function AdminSidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAdminContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: badgeCounts } = useAdminBadgeCounts();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const isActive = (href: string) => {
    if (href === ADMIN_ROUTES.DASHBOARD) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href.split("?")[0]);
  };

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const getBadgeCount = (href: string): number => {
    const key = badgeMap[href];
    if (!key || !badgeCounts) return 0;
    return badgeCounts[key as keyof typeof badgeCounts] ?? 0;
  };

  const renderNavButton = (
    item: (typeof ADMIN_NAV_ITEMS)[number],
    Icon: React.ElementType,
    active: boolean,
    isCollapsibleTrigger?: boolean
  ) => {
    const badgeCount = getBadgeCount(item.href);
    const hasSubMenu = subMenus[item.href] && !sidebarCollapsed;

    const button = (
      <Button
        variant={active ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3 relative",
          sidebarCollapsed && "justify-center px-2",
          active && "bg-primary/10 text-primary hover:bg-primary/15"
        )}
        onClick={(e) => {
          // If this is a collapsible trigger, don't navigate - let Collapsible handle it
          if (isCollapsibleTrigger) {
            e.preventDefault();
            return;
          }
          navigate(item.href);
        }}
      >
        <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {badgeCount > 0 && (
              <Badge
                variant="destructive"
                className="h-5 min-w-5 px-1.5 text-[10px]"
              >
                {badgeCount > 99 ? "99+" : badgeCount}
              </Badge>
            )}
            {hasSubMenu && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  expandedMenus.includes(item.href) && "rotate-180"
                )}
              />
            )}
          </>
        )}
        {sidebarCollapsed && badgeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </Button>
    );

    if (sidebarCollapsed) {
      return (
        <TooltipProvider key={item.href}>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
              {badgeCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {badgeCount} pending
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!sidebarCollapsed && (
          <span className="text-lg font-bold text-foreground">Admin Panel</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="ml-auto"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Search Hint */}
      {!sidebarCollapsed && (
        <div className="px-3 py-2 border-b border-border">
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-md hover:bg-muted transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const active = isActive(item.href);
          const hasSubMenu = subMenus[item.href] && !sidebarCollapsed;

          if (hasSubMenu) {
            return (
              <Collapsible
                key={item.href}
                open={expandedMenus.includes(item.href)}
                onOpenChange={() => toggleMenu(item.href)}
              >
                <CollapsibleTrigger asChild>
                  <div className="w-full">
                    {renderNavButton(item, Icon, active, true)}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-8 space-y-1 mt-1">
                  {subMenus[item.href].map((subItem) => (
                    <Button
                      key={subItem.href}
                      variant={location.pathname + location.search === subItem.href ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-sm"
                      onClick={() => navigate(subItem.href)}
                    >
                      {subItem.label}
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <div key={item.href}>{renderNavButton(item, Icon, active)}</div>
          );
        })}
      </nav>

      {/* Recent Items (only when expanded) */}
      {!sidebarCollapsed && (
        <div className="border-t border-border p-2">
          <div className="flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Recent</span>
          </div>
          <div className="space-y-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground"
              onClick={() => navigate(ADMIN_ROUTES.DROPS)}
            >
              Latest Drop Activity
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground"
              onClick={() => navigate(ADMIN_ROUTES.USERS)}
            >
              New User Registrations
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-foreground",
            sidebarCollapsed && "justify-center px-2"
          )}
          onClick={() => navigate("/")}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!sidebarCollapsed && <span>Back to App</span>}
        </Button>
      </div>
    </aside>
  );
}
