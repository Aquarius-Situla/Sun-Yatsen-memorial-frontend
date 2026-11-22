/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Library Hub Page Controller
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { initSubpage } from '../subpage.js';

export function init() {
    initSubpage({
        activeBottomTab: 'library',
        basePath: '../../'
    });
}
