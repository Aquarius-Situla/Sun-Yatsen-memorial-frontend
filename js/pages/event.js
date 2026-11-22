/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Historical Event Page Controller
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { initSubpage } from '../subpage.js';
import { resolveSiteUrl } from '../core/routes.js';

const EVENT_CONFIGS = {
    'xinhai': {
        titleKey: 'events.xinhai_title',
        pageTitleKey: 'events.xinhai_page_title',
        tcPath: 'events/xinhai/xinhai_tc.md',
        scPath: 'events/xinhai/xinhai_sc.md'
    },
    'whampoa': {
        titleKey: 'events.whampoa_title',
        pageTitleKey: 'events.whampoa_page_title',
        tcPath: 'events/whampoa/whampoa_tc.md',
        scPath: 'events/whampoa/whampoa_sc.md'
    },
    'mayfourth': {
        titleKey: 'events.mayfourth_title',
        pageTitleKey: 'events.mayfourth_page_title',
        tcPath: 'events/mayfourth/mayfourth_tc.md',
        scPath: 'events/mayfourth/mayfourth_sc.md'
    },
    'militaries': {
        titleKey: 'events.militaries_title',
        pageTitleKey: 'events.militaries_page_title',
        tcPath: 'events/militaries/militaries_tc.md',
        scPath: 'events/militaries/militaries_sc.md'
    },
    'yatsen-birth': {
        titleKey: 'events.yatsen_birth_title',
        pageTitleKey: 'events.yatsen_birth_page_title',
        tcPath: 'events/yatsen/yatsen-birth_tc.md',
        scPath: 'events/yatsen/yatsen-birth_sc.md'
    },
    'yatsen-passing': {
        titleKey: 'events.yatsen_passing_title',
        pageTitleKey: 'events.yatsen_passing_page_title',
        tcPath: 'events/yatsen/yatsen-passing_tc.md',
        scPath: 'events/yatsen/yatsen-passing_sc.md'
    }
};

export function init() {
    const eventId = (document.body ? document.body.getAttribute('data-event') : '') || '';
    const config = EVENT_CONFIGS[eventId];
    if (!config) {
        console.warn('[Event Controller]: Unknown data-event identifier:', eventId);
        return;
    }

    initSubpage({
        activeBottomTab: 'library',
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
