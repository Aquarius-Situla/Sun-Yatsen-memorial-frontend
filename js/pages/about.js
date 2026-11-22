/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — About & Legal Menu Controller
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { initSubpage } from '../subpage.js';
import { resolveSiteUrl } from '../core/routes.js';

export function init() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'changelog') {
        window.location.replace(resolveSiteUrl('pages/about/detail.html?doc=changelog'));
        return;
    }

    initSubpage({
        activeBottomTab: 'settings',
        basePath: '../../'
    });
}
