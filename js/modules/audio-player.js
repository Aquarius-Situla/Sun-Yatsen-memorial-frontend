/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Audio Engine Module (audio-player.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { t } from './i18n.js';

export const DEFAULT_MUSIC = {
    src: './main/sanmin/sanmin.mp3',
    titleKey: 'audio.default_title',
    artistKey: 'audio.default_artist'
};

export const SPECIAL_MEMORIAL_DAYS = [
    {
        urlKeyword:  'whampoa',
        dates:       [ { month: 6, date: 16 } ],
        config:      { src: './events/whampoa/whampoa.mp3', titleKey: 'audio.whampoa_title', artistKey: 'audio.whampoa_artist' },
        getBanner:   (year) => t('calendar.banner_whampoa', year - 1924),
        festivalPage: './events/whampoa/whampoa.html'
    },
    {
        urlKeyword:  'militaries',
        dates:       [ { month: 9, date: 3 } ],
        config:      { src: './events/militaries/militaries.mp3', titleKey: 'audio.militaries_title', artistKey: 'audio.militaries_artist' },
        getBanner:   (year) => t('calendar.banner_militaries', year - 1945),
        festivalPage: './events/militaries/militaries.html'
    },
    {
        urlKeyword:  'yatsen-passing',
        dates:       [ { month: 3,  date: 12 } ],
        config:      { src: './events/yatsen/yatsen.mp3', titleKey: 'audio.yatsen_title', artistKey: 'audio.yatsen_artist' },
        getBanner:   (year) => t('calendar.banner_yatsen_passing', year - 1925),
        festivalPage: './events/yatsen/yatsen-passing.html'
    },
    {
        urlKeyword:  'yatsen-birth',
        dates:       [ { month: 11, date: 12 } ],
        config:      { src: './events/yatsen/yatsen.mp3', titleKey: 'audio.yatsen_title', artistKey: 'audio.yatsen_artist' },
        getBanner:   (year) => t('calendar.banner_yatsen_birth', year - 1866),
        festivalPage: './events/yatsen/yatsen-birth.html'
    },
    {
        urlKeyword:  'xinhai',
        dates:       [ { month: 10, date: 10 } ],
        config:      DEFAULT_MUSIC,
        getBanner:   (year) => t('calendar.banner_xinhai', year - 1911),
        festivalPage: './events/xinhai/xinhai.html'
    },
    {
        urlKeyword:  'mayfourth',
        dates:       [ { month: 5, date: 4 } ],
        config:      DEFAULT_MUSIC,
        getBanner:   (year) => t('calendar.banner_mayfourth', year - 1919),
        festivalPage: './events/mayfourth/mayfourth.html'
    }
];

let hasDefaultMusicEnded = false;
let isPlaying = false;
let currentMusicSrc = '';

export function getTodayMusicConfig() {
    const url          = window.location.href.toLowerCase();
    const now          = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDate  = now.getDate();

    for (const item of SPECIAL_MEMORIAL_DAYS) {
        if (url.includes(item.urlKeyword.toLowerCase())) return item.config;
    }

    for (const item of SPECIAL_MEMORIAL_DAYS) {
        for (const d of item.dates) {
            if (d.month === currentMonth && d.date === currentDate) return item.config;
        }
    }

    return DEFAULT_MUSIC;
}

export function setupMediaSession(audioEl, config) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title:   t(config.titleKey),
        artist:  t(config.artistKey),
        album:   t('audio.album'),
        artwork: [ { src: './main/sanmin/album-cover.png', sizes: '1254x1254', type: 'image/png' } ]
    });

    navigator.mediaSession.setActionHandler('play',  () => {
        audioEl.play();
        isPlaying = true;
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        audioEl.pause();
        isPlaying = false;
    });
}

export function playMemorialMusic(audioEl, onPlayEnded) {
    if (!audioEl) return;

    const config = hasDefaultMusicEnded ? getTodayMusicConfig() : DEFAULT_MUSIC;

    if (currentMusicSrc !== config.src) {
        audioEl.src = config.src;
        currentMusicSrc = config.src;
        audioEl.load();
    }

    audioEl.play()
        .then(() => {
            isPlaying = true;
            setupMediaSession(audioEl, config);
        })
        .catch(() => {
            /* Handled by browser auto-play policies */
        });

    audioEl.onended = () => {
        isPlaying = false;
        hasDefaultMusicEnded = true;
        if (typeof onPlayEnded === 'function') {
            onPlayEnded();
        }
    };
}

export function isAudioPlaying() {
    return isPlaying;
}
