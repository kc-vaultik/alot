import { Routes, Route, Navigate } from "react-router-dom";
import { CollectRoomPage, ClaimPage } from "@/features/collect-room";
import { CollectorProfilePage } from "@/features/collectors";
import {
  PersonalDataSection,
  DocumentKYCSection,
  SecuritySection,
  NotificationsSection,
  SupportSection,
  OthersSection,
} from "@/features/settings";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Settings from "@/pages/Settings";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import {
  AdminLayout,
  AdminDashboard,
  AdminRooms,
  AdminInventory,
  AdminEconomy,
  AdminUsers,
  AdminSupport,
  AdminSettings,
  AdminAuth,
  AdminResetPassword,
} from "@/features/admin";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing page for unauthenticated users */}
      <Route path="/" element={<Landing />} />
      
      {/* Collect Room (handles auth internally) */}
      <Route path="/collect-room" element={<CollectRoomPage />} />
      
      {/* Collector Profile (public view; interactions require login) */}
      <Route path="/collector/:userId" element={<CollectorProfilePage />} />
      
      {/* Claim page for gifts/swaps (public, handles auth internally) */}
      <Route path="/collect-room/claim/:token" element={<ClaimPage />} />
      
      {/* Settings - Main page */}
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      
      {/* Settings - Sub-sections */}
      <Route 
        path="/settings/personal-data" 
        element={
          <ProtectedRoute>
            <PersonalDataSection />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings/documents" 
        element={
          <ProtectedRoute>
            <DocumentKYCSection />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings/security" 
        element={
          <ProtectedRoute>
            <SecuritySection />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings/notifications" 
        element={
          <ProtectedRoute>
            <NotificationsSection />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings/support" 
        element={
          <ProtectedRoute>
            <SupportSection />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings/others" 
        element={
          <ProtectedRoute>
            <OthersSection />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Login - separate auth route */}
      <Route path="/admin/login" element={<AdminAuth />} />
      <Route path="/admin/reset-password" element={<AdminResetPassword />} />
      {/* Admin Panel */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="rooms" element={<AdminRooms />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="economy" element={<AdminEconomy />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      
      {/* Authentication */}
      <Route path="/auth" element={<Auth />} />
      
      {/* Legacy redirects */}
      <Route path="/mystery-card" element={<Navigate to="/collect-room" replace />} />
      
      {/* 404 fallback - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};