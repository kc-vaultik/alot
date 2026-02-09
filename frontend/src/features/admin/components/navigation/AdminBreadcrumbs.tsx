import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { ADMIN_ROUTES } from "../../constants";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  drops: "Drops",
  rooms: "Drops", // Legacy alias
  inventory: "Inventory",
  economy: "Economy",
  users: "Users",
  support: "Support",
  settings: "Settings",
  new: "Create New",
};

export function AdminBreadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const breadcrumbs: BreadcrumbSegment[] = [];
  let currentPath = "";

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Check if this is an ID (UUID pattern)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    
    if (isUuid) {
      breadcrumbs.push({
        label: "Details",
        href: index < pathSegments.length - 1 ? currentPath : undefined,
      });
    } else {
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({
        label,
        href: index < pathSegments.length - 1 ? currentPath : undefined,
      });
    }
  });

  // Don't show breadcrumbs if we're at the root admin page
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={ADMIN_ROUTES.DASHBOARD} className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        
        {breadcrumbs.slice(1).map((crumb, index) => (
          <BreadcrumbItem key={index}>
            {crumb.href ? (
              <>
                <BreadcrumbLink asChild>
                  <Link to={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
                {index < breadcrumbs.length - 2 && <BreadcrumbSeparator />}
              </>
            ) : (
              <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
