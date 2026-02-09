/**
 * @fileoverview Shared styling type definitions
 * Central location for all styling-related types used across card and tier styling utilities.
 */

/**
 * Aura color configuration for card reveals.
 * Provides all the color values needed for dramatic reveal animations.
 */
export interface AuraColors {
  /** Primary gradient classes for aura ring */
  primary: string;
  /** Background glow classes */
  glow: string;
  /** Particle effect classes */
  particles: string;
  /** Text color classes */
  text: string;
  /** Card gradient accent classes */
  gradient: string;
  /** RGBA glow color for box-shadow and filters */
  glowColor: string;
}
