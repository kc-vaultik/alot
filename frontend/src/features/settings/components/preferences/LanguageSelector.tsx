
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
] as const;

export const LanguageSelector = () => {
  const [language, setLanguage] = useLocalStorage('app-language', 'en');

  const handleChange = (value: string) => {
    setLanguage(value);
    const lang = LANGUAGES.find(l => l.code === value);
    toast.success(`Language changed to ${lang?.name}`);
    // In a real app, this would update i18n settings
  };

  const selectedLang = LANGUAGES.find(l => l.code === language);

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
        <Globe className="w-5 h-5 text-white/70" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">Display Language</p>
        <p className="text-xs text-white/50">Choose your preferred language</p>
      </div>
      <Select value={language} onValueChange={handleChange}>
        <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{selectedLang?.flag}</span>
              <span>{selectedLang?.name}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
