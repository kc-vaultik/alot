import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Shield, 
  Bell, 
  HelpCircle, 
  Settings as SettingsIcon,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { SettingsMenuItem } from '@/features/settings';

const menuItems: SettingsMenuItem[] = [
  { icon: User, label: 'Personal Data', description: 'Manage your profile information', path: '/settings/personal-data' },
  { icon: FileText, label: 'Document & KYC', description: 'Identity verification documents', path: '/settings/documents' },
  { icon: Shield, label: 'Security', description: 'Password and authentication', path: '/settings/security' },
  { icon: Bell, label: 'Notifications', description: 'Manage your alerts', path: '/settings/notifications' },
  { icon: HelpCircle, label: 'Support', description: 'Get help and contact us', path: '/settings/support' },
  { icon: SettingsIcon, label: 'Others', description: 'Additional settings', path: '/settings/others' },
];

const Settings = memo(() => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const displayName = user?.email?.split('@')[0] || 'Collector';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-zinc-950 border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/collect-room')}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <h1 className="text-xl font-light">Settings</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-cyan-400/50 via-violet-500/50 to-purple-600/50 mb-6">
          <div className="rounded-2xl bg-zinc-900/90 backdrop-blur-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/30 via-violet-500/30 to-purple-600/30 flex items-center justify-center border border-white/10">
                <User className="w-8 h-8 text-white/70" />
              </div>
              <div>
                <p className="text-xl font-medium text-white">{displayName}</p>
                <p className="text-white/40 text-sm">{user?.email || 'No email'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleMenuClick(item.path)}
              className="w-full relative rounded-xl p-[1px] overflow-hidden group"
            >
              {/* Base gradient */}
              <span className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0" />
              {/* Hover gradient overlay */}
              <span className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-violet-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative rounded-xl bg-zinc-900/80 backdrop-blur-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-purple-600/10 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors duration-200">
                    <item.icon className="w-5 h-5 text-white/60 group-hover:text-violet-400 transition-colors duration-200" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-white/40 text-xs">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors duration-200" />
              </div>
            </button>
          ))}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full relative rounded-xl p-[1px] overflow-hidden group mt-4"
          >
            {/* Base gradient */}
            <span className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-red-600/10" />
            {/* Hover gradient overlay */}
            <span className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            
            <div className="relative rounded-xl bg-zinc-900/80 backdrop-blur-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/10 group-hover:border-red-500/20 transition-colors duration-200">
                  <LogOut className="w-5 h-5 text-red-400/70 group-hover:text-red-400 transition-colors duration-200" />
                </div>
                <div className="text-left">
                  <p className="text-red-400/90 font-medium">Logout</p>
                  <p className="text-white/40 text-xs">Sign out of your account</p>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Version Info */}
        <div className="mt-8 text-center">
          <p className="text-white/20 text-xs">Collect Room v1.0.0</p>
        </div>
      </div>
      </div>
    </div>
  );
});

Settings.displayName = 'Settings';

export default Settings;
