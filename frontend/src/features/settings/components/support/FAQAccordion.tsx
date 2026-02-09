import { memo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS = [
  {
    id: 'what-is-reveal',
    question: 'What is a reveal?',
    answer: 'A reveal is when you open a mystery card pack to discover what collectible item you\'ve received. Each reveal shows you the rarity, brand, and details of your new card.'
  },
  {
    id: 'how-rooms-work',
    question: 'How do rooms work?',
    answer: 'Rooms are competitions where you stake your cards for a chance to win prizes. Each room has a specific tier and prize pool. The winner is selected through a provably fair random selection system.'
  },
  {
    id: 'what-are-battles',
    question: 'What are battles?',
    answer: 'Battles are head-to-head competitions where you compare your cards against an opponent. Each round features a different category, and the player with the best matching card wins the round.'
  },
  {
    id: 'how-to-swap',
    question: 'How do I swap cards?',
    answer: 'You can create a swap offer from any card in your collection. Share the swap link with other collectors, or browse public swap listings to find cards you want.'
  },
  {
    id: 'what-are-credits',
    question: 'What are credits used for?',
    answer: 'Credits can be used to enter rooms, purchase additional entries, or progress towards specific products. You earn credits from battles, room participation, and special events.'
  },
  {
    id: 'kyc-verification',
    question: 'Why do I need to verify my identity?',
    answer: 'Identity verification (KYC) is required to redeem physical prizes and ensures a secure, fair environment for all collectors. Your documents are encrypted and handled securely.'
  }
];

export const FAQAccordion = memo(() => {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQ_ITEMS.map((item) => (
        <AccordionItem 
          key={item.id} 
          value={item.id}
          className="border-white/10"
        >
          <AccordionTrigger className="text-sm text-white/90 hover:text-white hover:no-underline py-4">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-white/60 pb-4">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
});

FAQAccordion.displayName = 'FAQAccordion';
