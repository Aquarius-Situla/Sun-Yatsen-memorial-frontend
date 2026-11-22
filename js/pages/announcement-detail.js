/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Announcement Detail Page Controller
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { initSubpage } from '../subpage.js';
import { resolveSiteUrl } from '../core/routes.js';

const ITEM_CONFIGS = {
    status: {
        titleKey: 'announcement.label_status',
        pageTitleKey: 'announcement.status_page_title',
        tcPath: 'pages/announcement/status_tc.md',
        scPath: 'pages/announcement/status_sc.md'
    },
    memorial: {
        titleKey: 'announcement.label_memorial',
        pageTitleKey: 'announcement.memorial_page_title',
        tcPath: 'pages/announcement/memorial_tc.md',
        scPath: 'pages/announcement/memorial_sc.md'
    },
    ukraine: {
        titleKey: 'announcement.label_ukraine',
        pageTitleKey: 'announcement.ukraine_page_title',
        tcPath: 'pages/announcement/Ukraine_tc.md',
        scPath: 'pages/announcement/Ukraine_sc.md'
    }
};

export function init() {
    const params = new URLSearchParams(window.location.search);
    const item = (params.get('item') || 'status').toLowerCase();
    const config = ITEM_CONFIGS[item] || ITEM_CONFIGS.status;

    const pageTitleEl = document.getElementById('page-title');
    const topNavTitleEl = document.getElementById('top-nav-title');
    if (pageTitleEl) pageTitleEl.setAttribute('data-i18n', config.pageTitleKey);
    if (topNavTitleEl) topNavTitleEl.setAttribute('data-i18n', config.titleKey);

    initSubpage({
        activeBottomTab: 'announcement',
        basePath: '../../',
        texts: {
            tc: {
                titleKey: config.titleKey,
                pageTitleKey: config.pageTitleKey,
                src: resolveSiteUrl(config.tcPath)
            },
            sc: {
                titleKey: config.titleKey,
                pageTitleKey: config.pageTitleKey,
                src: resolveSiteUrl(config.scPath)
            }
        }
    });
}
