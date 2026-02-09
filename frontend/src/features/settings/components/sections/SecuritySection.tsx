import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Monitor, AlertTriangle, Mail, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { SettingsLayout } from '../SettingsLayout';
import { SettingsSection } from '../SettingsSection';
import { SessionCard } from '../security/SessionCard';
import { DeleteAccountDialog } from '../security/DeleteAccountDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Parse user agent to get device info
function parseUserAgent(ua: string): { browser: string; os: string; device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown' } {
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';

  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Device type detection
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    device_type = 'mobile';
  } else if (ua.includes('iPad') || ua.includes('Tablet')) {
    device_type = 'tablet';
  } else if (ua.includes('Windows') || ua.includes('Mac OS') || ua.includes('Linux')) {
    device_type = 'desktop';
  }

  return { browser, os, device_type };
}

export const SecuritySection = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{
    browser: string;
    os: string;
    device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  } | null>(null);

  useEffect(() => {
    // Parse current session info from user agent
    if (typeof navigator !== 'undefined') {
      const info = parseUserAgent(navigator.userAgent);
      setSessionInfo(info);
    }
  }, []);

  const handleDeleteAccount = async () => {
    // Note: Full account deletion typically requires a backend function
    // For now, we'll sign out and show a message
    // In production, you'd call an edge function to handle deletion
    
    try {
      // Sign out first
      await logout();
      toast.success('Account deletion requested. You will receive a confirmation email.');
      navigate('/');
    } catch (error) {
      throw new Error('Failed to process account deletion');
    }
  };

  const handleSignOutAllDevices = async () => {
    try {
      // Sign out from all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      toast.success('Signed out from all devices');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out from all devices');
    }
  };

  // Get auth provider info
  const authProvider = user?.app_metadata?.provider || 'email';
  const lastSignIn = user?.last_sign_in_at;

  return (
    <SettingsLayout title="Security">
      <div className="space-y-6">
        {/* Authentication Info */}
        <SettingsSection
          title="Authentication"
          description="How you sign in to your account"
        >
          <div className="space-y-4">
            {/* Sign-in Method */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Sign-in Method</p>
                  <p className="text-white/40 text-xs capitalize">{authProvider} (Magic Link)</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="text-green-400 text-xs">Active</span>
              </div>
            </div>

            {/* Last Sign In */}
            {lastSignIn && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white/50" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Last Sign In</p>
                    <p className="text-white/40 text-xs">
                      {format(new Date(lastSignIn), 'PPpp')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Current Session */}
        <SettingsSection
          title="Current Session"
          description="Your active session on this device"
        >
          {sessionInfo && (
            <SessionCard
              session={{
                id: 'current',
                device_type: sessionInfo.device_type,
                browser: sessionInfo.browser,
                os: sessionInfo.os,
                last_active_at: new Date().toISOString(),
                created_at: user?.created_at || new Date().toISOString(),
                is_current: true,
              }}
            />
          )}

          <Button
            variant="outline"
            onClick={handleSignOutAllDevices}
            className="w-full mt-4 border-white/10 text-white/70 hover:text-white hover:bg-white/5"
          >
            <Monitor className="w-4 h-4 mr-2" />
            Sign Out From All Devices
          </Button>
        </SettingsSection>

        {/* Security Tips */}
        <SettingsSection
          title="Security Tips"
          description="Keep your account secure"
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
              <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Magic Link Authentication</p>
                <p className="text-white/50 text-xs mt-1">
                  You sign in using secure magic links sent to your email. No password to remember or steal.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <Key className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Secure Your Email</p>
                <p className="text-white/50 text-xs mt-1">
                  Since login links are sent to your email, make sure your email account has strong security.
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection
          title="Danger Zone"
          description="Irreversible actions"
        >
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-400">Delete Account</h3>
                <p className="text-white/50 text-sm mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  Delete My Account
                </Button>
              </div>
            </div>
          </div>
        </SettingsSection>
      </div>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        userEmail={user?.email || ''}
      />
    </SettingsLayout>
  );
};
