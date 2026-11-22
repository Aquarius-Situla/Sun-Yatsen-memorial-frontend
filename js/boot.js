/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Unified Page Bootstrapper (boot.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

const PAGE_LOADERS = {
    'library': () => import('./pages/library.js'),
    'settings': () => import('./pages/settings.js'),
    'language': () => import('./pages/language.js'),
    'announcement': () => import('./pages/announcement.js'),
    'announcement-detail': () => import('./pages/announcement-detail.js'),
    'about': () => import('./pages/about.js'),
    'about-detail': () => import('./pages/about-detail.js'),
    'thanks': () => import('./pages/thanks.js'),
    'biography': () => import('./pages/biography.js'),
    'biography-detail': () => import('./pages/biography-detail.js'),
    'event': () => import('./pages/event.js')
};

/* ============================================================================
 * Dynamic Page Controller Dispatcher
 * ============================================================================ */
export async function bootPage(pageName) {
    if (!pageName) return;
    const loader = PAGE_LOADERS[pageName];
    if (!loader) {
        console.warn('[Boot]: Unknown data-page identifier:', pageName);
        return;
    }

    const mod = await loader();
    if (typeof mod.init === 'function') {
        await mod.init();
    }
}

/* ============================================================================
 * Direct Hard-Load Auto-Bootstrap
 * Desktop SPA stage transitions bypass auto-boot and invoke bootPage() directly.
 * ============================================================================ */
function autoBootCurrentPage() {
    if (document.getElementById('desktop-stage')) return;
    const pageName = document.body ? document.body.getAttribute('data-page') : null;
    if (pageName) {
        bootPage(pageName).catch((err) => {
            console.error('[Boot Auto-Init Error]:', err);
        });
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoBootCurrentPage, { once: true });
    } else {
        autoBootCurrentPage();
    }
}
