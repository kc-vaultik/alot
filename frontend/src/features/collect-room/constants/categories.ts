// Category Pack Constants
// Configuration for category-specific packs

import type { Database } from '@/integrations/supabase/types';

export type ProductCategory = Database['public']['Enums']['product_category'];

export interface CategoryPackConfig {
  id: ProductCategory;
  name: string;
  icon: string;
  gradient: string;
  borderColor: string;
  glowColor: string;
  brands: {
    icon: string[];
    rare: string[];
    grail: string[];
    mythic: string[];
  };
}

export const CATEGORY_PACKS: CategoryPackConfig[] = [
  {
    id: 'HANDBAGS',
    name: 'Handbags',
    icon: '👜',
    gradient: 'from-rose-500 to-pink-600',
    borderColor: 'border-rose-500/30',
    glowColor: 'rose-500',
    brands: {
      icon: ['Gucci', 'Prada'],
      rare: ['YSL', 'Louis Vuitton'],
      grail: ['Chanel', 'Dior'],
      mythic: ['Hermès Birkin'],
    },
  },
  {
    id: 'WATCHES',
    name: 'Watches',
    icon: '⌚',
    gradient: 'from-amber-500 to-yellow-600',
    borderColor: 'border-amber-500/30',
    glowColor: 'amber-500',
    brands: {
      icon: ['Seiko', 'Tissot'],
      rare: ['Rolex', 'Omega'],
      grail: ['AP', 'Patek Philippe'],
      mythic: ['Richard Mille'],
    },
  },
  {
    id: 'SNEAKERS',
    name: 'Sneakers',
    icon: '👟',
    gradient: 'from-blue-500 to-cyan-600',
    borderColor: 'border-blue-500/30',
    glowColor: 'blue-500',
    brands: {
      icon: ['Nike', 'Adidas'],
      rare: ['Jordan', 'Dunks'],
      grail: ['Dior J1', 'Off-White'],
      mythic: ['Trophy Room'],
    },
  },
  {
    id: 'POKEMON',
    name: 'Trading Cards',
    icon: '🃏',
    gradient: 'from-yellow-500 to-orange-600',
    borderColor: 'border-yellow-500/30',
    glowColor: 'yellow-500',
    brands: {
      icon: ['Base Set', 'Jungle'],
      rare: ['Holo', 'Reverse Holo'],
      grail: ['1st Edition', 'Shadowless'],
      mythic: ['Charizard PSA 10'],
    },
  },
  {
    id: 'CLOTHING',
    name: 'Clothing',
    icon: '👕',
    gradient: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-500/30',
    glowColor: 'violet-500',
    brands: {
      icon: ['Chrome Hearts', 'Stüssy'],
      rare: ['Off-White', 'Fear of God'],
      grail: ['Kapital', 'Visvim'],
      mythic: ['Archive Pieces'],
    },
  },
  {
    id: 'JEWELLERY',
    name: 'Jewellery',
    icon: '💎',
    gradient: 'from-cyan-400 to-teal-500',
    borderColor: 'border-cyan-400/30',
    glowColor: 'cyan-400',
    brands: {
      icon: ['Silver', 'Sterling'],
      rare: ['Gold', '14K'],
      grail: ['Diamond', 'Platinum'],
      mythic: ['Cartier', 'Van Cleef'],
    },
  },
  {
    id: 'ART_TOYS',
    name: 'Art & Toys',
    icon: '🎨',
    gradient: 'from-pink-500 to-fuchsia-600',
    borderColor: 'border-pink-500/30',
    glowColor: 'pink-500',
    brands: {
      icon: ['Pop Mart', 'Funko'],
      rare: ['KAWS', 'Bearbrick 100%'],
      grail: ['Bearbrick 1000%', 'Companion'],
      mythic: ['Murakami', 'Banksy'],
    },
  },
  {
    id: 'SPORT_MEMORABILIA',
    name: 'Sports',
    icon: '🏆',
    gradient: 'from-green-500 to-emerald-600',
    borderColor: 'border-green-500/30',
    glowColor: 'green-500',
    brands: {
      icon: ['Jerseys', 'Cards'],
      rare: ['Signed Items', 'Match Worn'],
      grail: ['Game Worn', 'Championship'],
      mythic: ['Historic Pieces'],
    },
  },
];

export const getCategoryConfig = (category: ProductCategory): CategoryPackConfig | undefined => {
  return CATEGORY_PACKS.find(c => c.id === category);
};
