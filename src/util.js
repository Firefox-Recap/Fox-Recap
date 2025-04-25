// determine concurrency limit based on environment
import { CONCURRENCY_ENABLED } from "./config"
// return a number based on the environment

export function getConcurrencyLimit() {
    if (CONCURRENCY_ENABLED) {
        return navigator.hardwareConcurrency || 4; // Fallback to 4 if not available
    }
    return 1; // Disable concurrency
    }