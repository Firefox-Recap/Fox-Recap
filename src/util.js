/**
 * @fileoverview Utility functions for Firefox-Recap, including environment-based
 * concurrency determination.
 */

import { CONCURRENCY_ENABLED } from "./config"

/**
 * Determine the maximum number of concurrent tasks allowed.
 *
 * If concurrency is enabled via configuration, this returns the number of logical
 * CPU cores exposed by the browser's `navigator.hardwareConcurrency` API, falling back
 * to 1 if that API is unavailable. If concurrency is disabled, it always returns 1.
 *
 * @returns {number} The concurrency limit (number of parallel tasks).
 */
export function getConcurrencyLimit() {
    if (CONCURRENCY_ENABLED) {
        return navigator.hardwareConcurrency || 1; // Fallback to 1 if not available
    }
    return 1; // Disable concurrency
}