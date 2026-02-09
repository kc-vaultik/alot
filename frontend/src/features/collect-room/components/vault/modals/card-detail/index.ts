/**
 * @fileoverview Card Detail Modal - Barrel Export
 * Re-exports the main modal and sub-components
 */

// Main component
export { CardDetailModal } from './CardDetailModal';

// Sub-components (for advanced usage)
export { CardPreview } from './CardPreview';
export { InPlayStatus } from './InPlayStatus';
export { ProductInfo } from './ProductInfo';
export { CreditsProgress } from './CreditsProgress';
export { EmbeddedPerks } from './EmbeddedPerks';
export { GoldenPerks } from './GoldenPerks';
export { HowToWin } from './HowToWin';
export { CardActions } from './CardActions';

// Types
export type { CardDetailModalProps, CardOrListing, TierColors } from './types';
export { isMarketplaceListing, getTierColors, EMBEDDED_PERKS } from './types';
