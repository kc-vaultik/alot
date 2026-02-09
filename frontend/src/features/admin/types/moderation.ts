// User moderation types for admin panel

import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

export type CollectorProfile = Database["public"]["Tables"]["collector_profiles"]["Row"];
export type KYCDocument = Database["public"]["Tables"]["kyc_documents"]["Row"];

export type UserStatus = 'active' | 'suspended' | 'banned';

export interface AdminUser {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
  profile?: CollectorProfile;
  roles: AppRole[];
  status: UserStatus;
  card_count: number;
  total_spent_usd: number;
}

export interface UserModerationAction {
  type: 'suspend' | 'ban' | 'unsuspend' | 'unban' | 'add_role' | 'remove_role';
  user_id: string;
  reason?: string;
  role?: AppRole;
}

export interface KYCReviewAction {
  document_id: string;
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}
