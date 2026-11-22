/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Calendar & Festivals Module (calendar.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { SPECIAL_MEMORIAL_DAYS } from './audio-player.js';
import { isMobileLayout } from './device-detect.js';
import { t } from './i18n.js';
import { getPageSignal } from '../core/lifecycle.js';

/* ============================================================================
 * Republic of China Calendar Formatting
 * ============================================================================ */
export function displayMinguoDate(targetEl) {
    if (!targetEl) targetEl = document.getElementById('minguo-date-display');
    if (!targetEl) return;

    const now        = new Date();
    const minguoYear = now.getFullYear() - 1911;
    const month      = now.getMonth() + 1;
    const date       = now.getDate();
    const dayOfWeek  = t(`calendar.day_${now.getDay()}`);

    targetEl.removeAttribute('data-i18n');
    targetEl.innerText = t('calendar.minguo_date', minguoYear, month, date, dayOfWeek);
}

/* ============================================================================
 * Festival Banner & Mode Resolution
 * ============================================================================ */
function findActiveFestival() {
    const url          = window.location.href.toLowerCase();
    const now          = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDate  = now.getDate();
    const currentYear  = now.getFullYear();

    for (const item of SPECIAL_MEMORIAL_DAYS) {
        if (url.includes(item.urlKeyword.toLowerCase())) {
            return { item, year: currentYear };
        }
    }

    for (const item of SPECIAL_MEMORIAL_DAYS) {
        for (const d of item.dates) {
            if (d.month === currentMonth && d.date === currentDate) {
                return { item, year: currentYear };
            }
        }
    }

    return null;
}

export function initFestivalBanner(navBannerEl, onFestivalTrigger) {
    if (!navBannerEl) return;

    const activeFestival = findActiveFestival();
    const bannerText     = activeFestival ? activeFestival.item.getBanner(activeFestival.year) : '';
    const festivalPage   = activeFestival ? (activeFestival.item.festivalPage || '') : '';

    if (activeFestival && bannerText) {
        navBannerEl.innerText = bannerText;
        document.body.classList.add('has-festival');

        /* Elevate the banner to an accessible link if a festival page exists */
        if (festivalPage) {
            navBannerEl.style.cursor = 'pointer';
            navBannerEl.setAttribute('role',       'link');
            navBannerEl.setAttribute('tabindex',   '0');
            navBannerEl.setAttribute('aria-label', t('calendar.festival_aria', bannerText));
            navBannerEl.setAttribute('data-href', festivalPage);
            navBannerEl.addEventListener('click',   (e) => {
                if (isMobileLayout() && typeof window.__triggerMobileNav === 'function') {
                    e.preventDefault();
                    window.__triggerMobileNav(festivalPage, 'library');
                    return;
                }
                window.location.href = festivalPage;
            });
            navBannerEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isMobileLayout() && typeof window.__triggerMobileNav === 'function') {
                        window.__triggerMobileNav(festivalPage, 'library');
                        return;
                    }
                    window.location.href = festivalPage;
                }
            });
        }

        if (typeof onFestivalTrigger === 'function') {
            onFestivalTrigger();
        }
    } else {
        navBannerEl.innerText = '';
        document.body.classList.remove('has-festival');
    }

    /* Live sync Minguo date and festival banner on language switch */
    window.addEventListener('sys-lang-change', () => {
        displayMinguoDate();
        if (activeFestival) {
            const updatedBanner = activeFestival.item.getBanner(activeFestival.year);
            navBannerEl.innerText = updatedBanner;
            if (festivalPage) {
                navBannerEl.setAttribute('aria-label', t('calendar.festival_aria', updatedBanner));
            }
        }
    }, { signal: getPageSignal() });

    /* Developer testing hook via URL hash */
    if (window.location.hash.includes('celebration') && typeof onFestivalTrigger === 'function') {
        onFestivalTrigger();
    }
}
