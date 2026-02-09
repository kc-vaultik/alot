import { Outlet } from "react-router-dom";
import { AdminProvider, useAdminContext } from "../../context/AdminContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminBreadcrumbs, AdminCommandPalette } from "../navigation";
import { AdminErrorBoundary } from "../shared";
import { cn } from "@/lib/utils";

function AdminLayoutContent() {
  const { sidebarCollapsed } = useAdminContext();

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminCommandPalette />
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <AdminHeader />
        <main className="p-6">
          <AdminBreadcrumbs />
          <AdminErrorBoundary>
            <Outlet />
          </AdminErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export function AdminLayout() {
  return (
    <AdminProvider>
      <AdminErrorBoundary>
        <AdminLayoutContent />
      </AdminErrorBoundary>
    </AdminProvider>
  );
}
