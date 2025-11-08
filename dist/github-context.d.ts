import { GitHubMetadata } from './types';
/**
 * Extract GitHub context metadata for events
 */
export declare function getGitHubMetadata(): GitHubMetadata;
/**
 * Extract auto-detected GitHub metadata with vi_gh_ prefix
 * Following ADR-013: Auto-Detected Extra Metadata
 */
export declare function getAutoDetectedMetadata(): Record<string, unknown>;
/**
 * Merge auto-detected metadata with user-provided metadata
 * User values take precedence over auto-detected values
 * Following ADR-013: Auto-Detected Extra Metadata
 */
export declare function mergeMetadata(autoDetected: Record<string, unknown>, userProvided: Record<string, unknown>): Record<string, unknown>;
