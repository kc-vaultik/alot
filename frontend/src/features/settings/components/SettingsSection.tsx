import { memo, ReactNode } from 'react';

interface SettingsSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export const SettingsSection = memo<SettingsSectionProps>(({ 
  title, 
  description, 
  children,
  className = ''
}) => {
  return (
    <div
      className={`relative rounded-2xl p-[1px] bg-gradient-to-br from-white/10 via-white/5 to-white/0 ${className}`}
    >
      <div className="rounded-2xl bg-zinc-900/90 backdrop-blur-sm p-6">
        {(title || description) && (
          <div className="mb-4">
            {title && (
              <h2 className="text-lg font-medium text-white">{title}</h2>
            )}
            {description && (
              <p className="text-white/50 text-sm mt-1">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
});

SettingsSection.displayName = 'SettingsSection';
