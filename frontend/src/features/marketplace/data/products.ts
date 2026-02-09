import { ProductData } from '../types';

// Import product images
import apRoyalOak from '@/assets/products/ap-royal-oak-perpetual.png';
import diorJordan from '@/assets/products/dior-jordan-1.webp';
import chanelFlap from '@/assets/products/chanel-classic-flap.png';
import rolexSubmariner from '@/assets/products/rolex-submariner.png';
import lvBackpack from '@/assets/products/lv-gradient-backpack.png';
import chromeHeartsRing from '@/assets/products/chrome-hearts-ring.png';
import messiJersey from '@/assets/products/messi-argentina-jersey.png';
import kawsCompanion from '@/assets/products/kaws-companion.webp';
import pikachuCard from '@/assets/products/pikachu-card.webp';
import jordan1SatinSnake from '@/assets/products/jordan-1-satin-snake.webp';
import chromeHeartsJeans from '@/assets/products/chrome-hearts-cross-jeans.png';
import lvMurakamiSpeedy from '@/assets/products/lv-murakami-speedy.png';
import lvMurakamiKeepal from '@/assets/products/lv-murakami-keepall.png';
import chromeHeartsHoodie from '@/assets/products/chrome-hearts-hoodie.webp';

import hermesBirkinToile from '@/assets/products/hermes-birkin-toile.webp';
import hermesBirkinOrange from '@/assets/products/hermes-birkin-orange.webp';
import patekNautilus from '@/assets/products/patek-nautilus.avif';
import patekPerpetual from '@/assets/products/patek-perpetual-calendar.avif';

// Product database sorted by rarity
export const productDatabase: ProductData[] = [
  // Mythic (95-100) - Ultra rare luxury items
  { brand: 'Patek Philippe', model: 'Perpetual Calendar 5327R', rarity_score: 99, product_image: patekPerpetual, value: 125000 },
  { brand: 'Audemars Piguet', model: 'Royal Oak Perpetual Calendar', rarity_score: 98, product_image: apRoyalOak, value: 85000 },
  { brand: 'Patek Philippe', model: 'Nautilus 5711', rarity_score: 97, product_image: patekNautilus, value: 95000 },
  { brand: 'Hermès', model: 'Birkin 35 Toile', rarity_score: 96, product_image: hermesBirkinToile, value: 42000 },
  
  // Grail (80-94) - Highly coveted collector items
  { brand: 'Hermès', model: 'Birkin 25 Orange', rarity_score: 92, product_image: hermesBirkinOrange, value: 28000 },
  { brand: 'Dior x Jordan', model: 'Air Jordan 1 Low', rarity_score: 90, product_image: diorJordan, value: 12000 },
  { brand: 'Louis Vuitton x Murakami', model: 'Keepall Bandoulière 45', rarity_score: 88, product_image: lvMurakamiKeepal, value: 8500 },
  { brand: 'Chanel', model: 'Classic Flap Bag', rarity_score: 85, product_image: chanelFlap, value: 9500 },
  { brand: 'Louis Vuitton x Murakami', model: 'Speedy 20', rarity_score: 82, product_image: lvMurakamiSpeedy, value: 6800 },
  
  // Rare (50-79) - Sought-after items
  { brand: 'Rolex', model: 'Submariner Date', rarity_score: 75, product_image: rolexSubmariner, value: 14500 },
  { brand: 'Chrome Hearts', model: 'Cross Patch Jeans', rarity_score: 70, product_image: chromeHeartsJeans, value: 4200 },
  { brand: 'Louis Vuitton', model: 'Gradient Backpack', rarity_score: 65, product_image: lvBackpack, value: 3200 },
  { brand: 'Air Jordan', model: '1 Retro Satin Snake Chicago', rarity_score: 60, product_image: jordan1SatinSnake, value: 2800 },
  { brand: 'Chrome Hearts', model: 'Cemetery Ring', rarity_score: 55, product_image: chromeHeartsRing, value: 1800 },
  { brand: 'Chrome Hearts', model: 'Horseshoe Hoodie', rarity_score: 52, product_image: chromeHeartsHoodie, value: 1500 },
  
  // Icon (1-49) - Popular collectibles
  // Icon (1-49) - Popular collectibles
  { brand: 'KAWS', model: 'Separated Companion', rarity_score: 40, product_image: kawsCompanion, value: 950 },
  { brand: 'Argentina', model: 'Messi #10 Jersey', rarity_score: 30, product_image: messiJersey, value: 450 },
  { brand: 'Pokémon', model: 'Pikachu Card', rarity_score: 20, product_image: pikachuCard, value: 280 },
];

export const getProductValue = (brand: string, model: string): number => {
  const product = productDatabase.find(p => p.brand === brand && p.model === model);
  return product?.value || 0;
};
