/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Special Thanks Page Controller
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { initSubpage } from '../subpage.js';
import { resolveSiteUrl } from '../core/routes.js';

export function init() {
    initSubpage({
        activeBottomTab: 'settings',
        basePath: '../../',
        texts: {
            tc: {
                pageTitleKey: 'thanks.page_title',
                src: resolveSiteUrl('pages/thanks/thanks_tc.md')
            },
            sc: {
                pageTitleKey: 'thanks.page_title',
                src: resolveSiteUrl('pages/thanks/thanks_sc.md')
            }
        }
    });
}
