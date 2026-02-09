import { memo } from 'react';
import { 
  BookOpen, 
  MessageCircle, 
  Youtube, 
  Twitter,
  ExternalLink
} from 'lucide-react';

interface ResourceLinkProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

const ResourceLink = ({ icon, title, description, href }: ResourceLinkProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-[background-color,border-color] duration-200 group"
  >
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white/90 group-hover:text-white">{title}</p>
      <p className="text-xs text-white/50 truncate">{description}</p>
    </div>
    <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/50 shrink-0" />
  </a>
);

export const HelpResources = memo(() => {
  return (
    <div className="space-y-3">
      <ResourceLink
        icon={<BookOpen className="w-5 h-5 text-cyan-400" />}
        title="Documentation"
        description="Guides, tutorials, and API reference"
        href="#"
      />
      <ResourceLink
        icon={<MessageCircle className="w-5 h-5 text-violet-400" />}
        title="Discord Community"
        description="Chat with collectors and get help"
        href="#"
      />
      <ResourceLink
        icon={<Youtube className="w-5 h-5 text-red-400" />}
        title="Video Tutorials"
        description="Learn through step-by-step videos"
        href="#"
      />
      <ResourceLink
        icon={<Twitter className="w-5 h-5 text-blue-400" />}
        title="Twitter / X"
        description="Latest updates and announcements"
        href="#"
      />
    </div>
  );
});

HelpResources.displayName = 'HelpResources';
