import { SettingsLayout } from '../SettingsLayout';
import { SettingsSection } from '../SettingsSection';
import { FAQAccordion } from '../support/FAQAccordion';
import { ContactForm } from '../support/ContactForm';
import { HelpResources } from '../support/HelpResources';

export const SupportSection = () => {
  return (
    <SettingsLayout title="Support">
      <SettingsSection 
        title="Frequently Asked Questions"
        description="Find quick answers to common questions"
      >
        <FAQAccordion />
      </SettingsSection>

      <SettingsSection 
        title="Contact Support"
        description="Can't find what you're looking for? Send us a message"
      >
        <ContactForm />
      </SettingsSection>

      <SettingsSection 
        title="Help Resources"
        description="Additional resources to help you get started"
      >
        <HelpResources />
      </SettingsSection>
    </SettingsLayout>
  );
};
