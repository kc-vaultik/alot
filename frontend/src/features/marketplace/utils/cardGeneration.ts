import { DesignTraits, CardRewards, ProgressShards, CollectCard } from '@/features/collect-room/types';
import { productDatabase } from '../data/products';
import { MarketplaceListing } from '../types';

const getShardsForRarity = (rarityScore: number, isGolden: boolean, productKey: string): ProgressShards => {
  if (isGolden) {
    return { shards_earned: 100, product_key: productKey };
  }
  
  let baseShards: number;
  if (rarityScore >= 95) {
    baseShards = 15 + Math.random() * 10;
  } else if (rarityScore >= 80) {
    baseShards = 8 + Math.random() * 7;
  } else if (rarityScore >= 50) {
    baseShards = 3 + Math.random() * 5;
  } else {
    baseShards = 1 + Math.random() * 2;
  }
  
  return {
    shards_earned: Math.round(baseShards * 10) / 10,
    product_key: productKey,
  };
};

const getRewardsForRarity = (rarityScore: number, isGolden: boolean, productKey: string): CardRewards => {
  const basePoints = Math.floor(rarityScore * 10);
  const goldenMultiplier = isGolden ? 5 : 1;
  
  const rewards: string[] = [];
  let prize: CardRewards['prize'] = undefined;
  const progress = getShardsForRarity(rarityScore, isGolden, productKey);

  if (rarityScore >= 95 || isGolden) {
    rewards.push('VIP Event Access', 'Exclusive Drop Priority', 'Lifetime Warranty');
    prize = {
      name: isGolden ? 'Instant Redemption' : 'Mythic Collector Box',
      description: isGolden 
        ? 'Congratulations! You can redeem this product immediately!'
        : 'Limited edition collector merchandise bundle',
      redeemable: true,
    };
  } else if (rarityScore >= 80) {
    rewards.push('Priority Support', 'Early Access Drops');
    prize = {
      name: 'Grail Reward Bundle',
      description: 'Premium merchandise and store credit package',
      redeemable: true,
    };
  } else if (rarityScore >= 50) {
    rewards.push('Store Discount 15%', 'Early Notifications');
  } else {
    rewards.push('Store Discount 5%');
  }

  return {
    points: basePoints * goldenMultiplier,
    rewards,
    progress,
    prize,
  };
};

export const getDesignTraits = (rarityScore: number): DesignTraits => {
  if (rarityScore >= 95) {
    return {
      background: 'obsidian',
      texture: 'holographic',
      emblem: 'prismatic',
      borderStyle: 'radiant',
      foilType: 'full',
      typography: 'display',
    };
  } else if (rarityScore >= 80) {
    return {
      background: 'midnight-blue',
      texture: 'hammered',
      emblem: 'gilt',
      borderStyle: 'ornate',
      foilType: 'accent',
      typography: 'luxury',
    };
  } else if (rarityScore >= 50) {
    return {
      background: 'deep-charcoal',
      texture: 'brushed',
      emblem: 'embossed',
      borderStyle: 'beveled',
      foilType: 'subtle',
      typography: 'classic',
    };
  }
  return {
    background: 'matte-black',
    texture: 'smooth',
    emblem: 'standard',
    borderStyle: 'clean',
    foilType: 'none',
    typography: 'modern',
  };
};

const generateSerialNumber = (index: number): string => {
  return `${String(index).padStart(4, '0')}/10000`;
};

const generateCardId = (): string => {
  return `MC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const generateRandomCard = (forceGolden?: boolean): CollectCard => {
  const weights = productDatabase.map(p => {
    if (p.rarity_score >= 95) return 25;
    if (p.rarity_score >= 80) return 20;
    if (p.rarity_score >= 50) return 15;
    return 10;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  let selectedProduct = productDatabase[0];
  for (let i = 0; i < productDatabase.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      selectedProduct = productDatabase[i];
      break;
    }
  }
  
  const isGolden = forceGolden ?? Math.random() < 0.02;
  
  return {
    card_id: generateCardId(),
    product_reveal: `${selectedProduct.brand} ${selectedProduct.model}`,
    brand: selectedProduct.brand,
    model: selectedProduct.model,
    product_image: selectedProduct.product_image,
    product_value: selectedProduct.value,
    rarity_score: selectedProduct.rarity_score,
    is_golden: isGolden,
    design_traits: getDesignTraits(selectedProduct.rarity_score),
    serial_number: generateSerialNumber(Math.floor(Math.random() * 10000) + 1),
    owner_id: 'current-user',
    pulled_at: new Date().toISOString(),
    rewards: getRewardsForRarity(selectedProduct.rarity_score, isGolden, `${selectedProduct.brand}-${selectedProduct.model}`.toLowerCase().replace(/\s+/g, '-')),
    // Room Stats
    priority_points: 0,
    redeem_credits_cents: 0,
    card_state: 'owned',
    staked_room_id: null,
    band: selectedProduct.rarity_score >= 95 ? 'MYTHIC' : selectedProduct.rarity_score >= 80 ? 'GRAIL' : selectedProduct.rarity_score >= 50 ? 'RARE' : 'ICON',
  };
};

export const generateDemoCollection = (count: number = 5): CollectCard[] => {
  return Array.from({ length: count }, () => generateRandomCard());
};

const randomUsernames = ['collector_elite', 'rare_hunter', 'lux_vault', 'grail_seeker', 'card_master', 'vintage_king'];

export const generateMarketplaceCards = (count: number = 12): MarketplaceListing[] => {
  return Array.from({ length: count }, () => {
    const card = generateRandomCard(Math.random() < 0.1);
    const isGift = Math.random() < 0.3; // 30% chance of being a gift
    return {
      ...card,
      card_id: generateCardId(),
      owner_id: randomUsernames[Math.floor(Math.random() * randomUsernames.length)],
      pulled_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      listing_type: isGift ? 'GIFT' : 'SWAP',
      transfer_id: `transfer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      from_username: randomUsernames[Math.floor(Math.random() * randomUsernames.length)],
      listed_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
};
