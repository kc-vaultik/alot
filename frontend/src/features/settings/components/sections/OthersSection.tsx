import { SettingsLayout } from '../SettingsLayout';
import { SettingsSection } from '../SettingsSection';
import { ThemeToggle } from '../preferences/ThemeToggle';
import { LanguageSelector } from '../preferences/LanguageSelector';
import { AppPreferences } from '../preferences/AppPreferences';

export const OthersSection = () => {
  return (
    <SettingsLayout title="Others">
      <SettingsSection 
        title="Appearance"
        description="Customize how the app looks"
      >
        <ThemeToggle />
      </SettingsSection>

      <SettingsSection 
        title="Language"
        description="Set your preferred display language"
      >
        <LanguageSelector />
      </SettingsSection>

      <SettingsSection 
        title="App Preferences"
        description="Control app behavior and accessibility"
      >
        <AppPreferences />
      </SettingsSection>
    </SettingsLayout>
  );
};
