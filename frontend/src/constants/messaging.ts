/**
 * @fileoverview Centralized messaging constants for economy terminology.
 * 
 * Use these constants to ensure uniform language across the platform.
 * All user-facing terms for entries, credits, and lottery mechanics should
 * reference these constants for consistency.
 */

export const ECONOMY_MESSAGING = {
  ENTRIES: {
    label: 'Entries',
    singular: 'Entry',
    plural: 'Entries',
    tooltip: 'Your chances in this lot. Each $1 spent = 1 entry.',
    perDollar: '1 Entry per $1',
  },
  STASH_CREDITS: {
    label: 'Stash Credits',
    singular: 'Stash Credit',
    plural: 'Stash Credits',
    singularFull: 'Stash Credit',
    pluralFull: 'Stash Credits',
    abbreviation: 'C',
    unit: 'C',
    tooltip: 'Your balance you can spend on future lots or redeem items. Cannot be cashed out.',
    perCent: '1 Stash Credit = $0.01',
  },
  CLAIM_PROGRESS: {
    label: 'Claim Progress',
    tooltip: 'When you hit 100%, you can claim an item when available.',
  },
  ODDS: {
    label: 'Win Chance',
    tooltip: 'Your odds = Your Entries ÷ Total Entries',
    formula: 'Your Entries ÷ Total Entries',
  },
  WINNER: {
    message: 'Winner receives the collectible. Their Stash Credits for this product reset to zero.',
  },
  LOSER: {
    message: 'Non-winners receive Stash Credits proportional to their entry amount.',
  },
  LOTTERY: {
    howItWorks: [
      'Buy entries to increase your win chance (1 Entry per $1)',
      'When fully funded, a random winner is drawn',
      'Winner claims the prize, non-winners earn Stash Credits',
    ],
    oddsExplainer: 'Your odds = Your Entries ÷ Total Entries',
  },
} as const;

/**
 * Format cents as Stash Credits display string.
 * @example formatStashCredits(1500) => "$15.00"
 */
export const formatStashCredits = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

// Legacy alias for backwards compatibility
export const formatVaultCredits = formatStashCredits;
