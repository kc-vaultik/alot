import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to check if the current user has admin role.
 * Uses server-side validation via user_roles table.
 * NEVER use localStorage or client-side checks for security.
 */
export function useIsAdmin() {
  const { user, isAuthenticated } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["user-is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      // Use the has_role function which is SECURITY DEFINER
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }

      return data === true;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  return {
    isAdmin: isAdmin ?? false,
    isLoading,
    isAuthenticated,
  };
}
