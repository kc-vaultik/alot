/**
 * @fileoverview Constants for Sealed Pack component
 */

// Product images for roulette
import lvBag from '@/assets/mystery/lv-bag.png';
import chromeHoodie from '@/assets/mystery/chrome-hoodie.webp';
import birkin from '@/assets/mystery/birkin.webp';
import messiJersey from '@/assets/mystery/messi-jersey.png';
import apWatch from '@/assets/mystery/ap-watch.png';
import chromeRing from '@/assets/mystery/chrome-ring.png';

export interface RouletteProduct {
  src: string;
  alt: string;
}

export const rouletteProducts: RouletteProduct[] = [
  { src: lvBag, alt: 'Louis Vuitton' },
  { src: apWatch, alt: 'Audemars Piguet' },
  { src: birkin, alt: 'Hermès Birkin' },
  { src: messiJersey, alt: 'Messi Jersey' },
  { src: chromeHoodie, alt: 'Chrome Hearts' },
  { src: chromeRing, alt: 'Chrome Hearts Ring' },
];
