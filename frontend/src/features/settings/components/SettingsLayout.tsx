import { memo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface SettingsLayoutProps {
  title: string;
  children: ReactNode;
  backPath?: string;
}

export const SettingsLayout = memo<SettingsLayoutProps>(({ 
  title, 
  children, 
  backPath = '/settings' 
}) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-zinc-950 border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(backPath)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <h1 className="text-xl font-light">{title}</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {children}
        </div>
      </div>
    </div>
  );
});

SettingsLayout.displayName = 'SettingsLayout';
