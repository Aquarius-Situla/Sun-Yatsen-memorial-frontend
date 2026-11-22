/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Page Lifecycle Manager (lifecycle.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

let currentController = new AbortController();
const cleanupCallbacks = new Set();

/* ============================================================================
 * Lifecycle Signal & Teardown Registration
 * ============================================================================ */

/**
 * Returns the AbortSignal tied to the currently mounted stage page.
 * Listeners registered with `{ signal: getPageSignal() }` are automatically
 * removed when `resetPageLifecycle()` runs during Desktop SPA navigation.
 * @returns {AbortSignal}
 */
export function getPageSignal() {
    return currentController.signal;
}

/**
 * Registers a teardown callback (e.g. chart destruction or timer cleanup)
 * to execute when the current stage page unmounts.
 * @param {Function} fn
 * @returns {Function} Unregister function
 */
export function onPageUnmount(fn) {
    if (typeof fn !== 'function') {
        return () => {};
    }
    cleanupCallbacks.add(fn);
    return () => {
        cleanupCallbacks.delete(fn);
    };
}

/**
 * Aborts all listeners and runs all cleanup callbacks for the outgoing page,
 * then initializes a fresh AbortController for the incoming page.
 * @returns {AbortSignal} Fresh AbortSignal for the newly mounted page
 */
export function resetPageLifecycle() {
    currentController.abort();

    cleanupCallbacks.forEach((fn) => {
        try {
            fn();
        } catch (err) {
            console.error('[Lifecycle Cleanup Error]:', err);
        }
    });
    cleanupCallbacks.clear();

    currentController = new AbortController();
    return currentController.signal;
}
