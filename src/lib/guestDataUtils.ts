// Guest data management utilities

const GUEST_DATA_TIMESTAMP_KEY = 'guest-data-created-at';
const GUEST_WARNING_SHOWN_KEY = 'guest-warning-shown';
export const CLOUD_ONLY_MODE_KEY = 'cloud-only-mode-active';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const CLOUD_CACHE_KEYS = [
    'taskflow-tasks-basic',
    'taskflow-tasks-advanced',
    'taskflow-tasks-customize',
    'task-categories',
    'task-tags',
    'app-mode',
    'advanced-view-mode',
    'big-data-workspaces',
    'big-data-active-ids',
    'big-data-ai-usage'
];

/**
 * Initialize guest data timestamp (called when first task is created)
 */
export function initializeGuestDataTimestamp() {
    const existing = localStorage.getItem(GUEST_DATA_TIMESTAMP_KEY);
    if (!existing) {
        localStorage.setItem(GUEST_DATA_TIMESTAMP_KEY, Date.now().toString());
    }
}

/**
 * Check if guest data is expired (> 24 hours)
 */
export function isGuestDataExpired(): boolean {
    const timestamp = localStorage.getItem(GUEST_DATA_TIMESTAMP_KEY);
    if (!timestamp) return false;

    const createdAt = parseInt(timestamp, 10);
    const now = Date.now();
    const age = now - createdAt;

    return age > TWENTY_FOUR_HOURS_MS;
}

/**
 * Clear all guest data from localStorage
 */
export function clearGuestData() {
    const keysToRemove = [
        ...CLOUD_CACHE_KEYS,
        GUEST_DATA_TIMESTAMP_KEY,
        GUEST_WARNING_SHOWN_KEY
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('Guest data cleared due to 24h expiration');
}

export function clearCloudCachedData() {
    CLOUD_CACHE_KEYS.forEach(key => localStorage.removeItem(key));
}

export function setCloudOnlyModeActive(active: boolean) {
    if (active) {
        localStorage.setItem(CLOUD_ONLY_MODE_KEY, 'true');
    } else {
        localStorage.removeItem(CLOUD_ONLY_MODE_KEY);
    }
}

/**
 * Check if guest user has seen the warning dialog
 */
export function hasSeenGuestWarning(): boolean {
    return localStorage.getItem(GUEST_WARNING_SHOWN_KEY) === 'true';
}

/**
 * Mark that user has seen the guest warning
 */
export function markGuestWarningAsShown() {
    localStorage.setItem(GUEST_WARNING_SHOWN_KEY, 'true');
}

/**
 * Get hours remaining until guest data expires
 */
export function getHoursUntilExpiration(): number {
    const timestamp = localStorage.getItem(GUEST_DATA_TIMESTAMP_KEY);
    if (!timestamp) return 24;

    const createdAt = parseInt(timestamp, 10);
    const now = Date.now();
    const age = now - createdAt;
    const remaining = TWENTY_FOUR_HOURS_MS - age;

    return Math.max(0, Math.floor(remaining / (60 * 60 * 1000)));
}

/**
 * Check if there is any guest data
 */
export function hasGuestData(): boolean {
    const basicTasks = localStorage.getItem('taskflow-tasks-basic');
    const advancedTasks = localStorage.getItem('taskflow-tasks-advanced');
    const customizeTasks = localStorage.getItem('taskflow-tasks-customize');
    const categories = localStorage.getItem('task-categories');
    const tags = localStorage.getItem('task-tags');
    const bigData = localStorage.getItem('big-data-workspaces');

    return !!(basicTasks || advancedTasks || customizeTasks || categories || tags || bigData);
}

/**
 * Reset guest data warning (after login migration)
 */
export function resetGuestWarningState() {
    localStorage.removeItem(GUEST_WARNING_SHOWN_KEY);
    localStorage.removeItem(GUEST_DATA_TIMESTAMP_KEY);
}
