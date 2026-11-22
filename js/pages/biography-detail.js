/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Biography & Theories Detail Controller
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { initSubpage } from '../subpage.js';
import { t } from '../modules/i18n.js';
import { resolveSiteUrl } from '../core/routes.js';
import { getPageSignal, onPageUnmount } from '../core/lifecycle.js';

export function init() {
    const pageSignal = getPageSignal();
    const params = new URLSearchParams(window.location.search);
    const viewParam = (params.get('view') || params.get('tab') || 'biography').toLowerCase();
    const isTheories = viewParam === 'theories';

    const pageTitleEl = document.getElementById('page-title');
    const topNavTitleEl = document.getElementById('top-nav-title');
    const mdSection = document.getElementById('md-section');
    const mdViewer = document.getElementById('md-viewer');
    const chartsSection = document.getElementById('charts-section');
    const showAllBtn = document.getElementById('show-all-btn');

    const titleKey = isTheories ? 'biography.tab_theories' : 'biography.tab_biography';
    const pageTitleKey = isTheories ? 'biography.theories_page_title' : 'biography.bio_page_title';

    if (pageTitleEl) pageTitleEl.setAttribute('data-i18n', pageTitleKey);
    if (topNavTitleEl) topNavTitleEl.setAttribute('data-i18n', titleKey);

    if (!isTheories) {
        if (chartsSection) {
            chartsSection.style.display = 'none';
            chartsSection.classList.remove('active', 'loaded');
        }
        if (mdSection) {
            mdSection.style.display = 'block';
            mdSection.classList.add('active');
        }

        initSubpage({
            activeBottomTab: 'library',
            basePath: '../../',
            texts: {
                tc: {
                    titleKey: 'biography.tab_biography',
                    pageTitleKey: 'biography.bio_page_title',
                    src: resolveSiteUrl('pages/biography/biography_tc.md')
                },
                sc: {
                    titleKey: 'biography.tab_biography',
                    pageTitleKey: 'biography.bio_page_title',
                    src: resolveSiteUrl('pages/biography/biography_sc.md')
                }
            }
        });
        return;
    }

    /* Theories & Charts view: remove unused markdown viewer before initSubpage so no loader spins */
    if (mdViewer) mdViewer.remove();
    if (mdSection) {
        mdSection.style.display = 'none';
        mdSection.classList.remove('active');
    }
    if (chartsSection) {
        chartsSection.style.display = 'block';
        chartsSection.classList.add('active', 'loaded');
    }

    initSubpage({
        activeBottomTab: 'library',
        basePath: '../../',
        texts: {
            tc: {
                titleKey: 'biography.tab_theories',
                pageTitleKey: 'biography.theories_page_title'
            },
            sc: {
                titleKey: 'biography.tab_theories',
                pageTitleKey: 'biography.theories_page_title'
            }
        }
    });

    let influenceChartInstance = null;
    let sanminChartInstance = null;
    let isAllShown = false;

    function destroyCharts() {
        if (influenceChartInstance) {
            influenceChartInstance.destroy();
            influenceChartInstance = null;
        }
        if (sanminChartInstance) {
            sanminChartInstance.destroy();
            sanminChartInstance = null;
        }
    }

    onPageUnmount(destroyCharts);

    function syncShowAllLabel() {
        if (showAllBtn) {
            showAllBtn.textContent = isAllShown ? t('biography.hide_all') : t('biography.show_all');
        }
    }

    if (showAllBtn) {
        showAllBtn.addEventListener('click', () => {
            if (!sanminChartInstance) return;
            isAllShown = !isAllShown;
            sanminChartInstance.data.datasets.forEach((ds, i) => {
                sanminChartInstance.setDatasetVisibility(i, isAllShown);
            });
            sanminChartInstance.update();
            syncShowAllLabel();
        }, { signal: pageSignal });
    }

    function renderCharts(retryCount = 0) {
        if (pageSignal.aborted) return;

        if (typeof window.Chart === 'undefined') {
            if (retryCount < 20) {
                setTimeout(() => renderCharts(retryCount + 1), 100);
            }
            return;
        }

        const ChartLib = window.Chart;

        try {
            destroyCharts();

            const canvas1 = document.getElementById('influenceChart');
            const canvas2 = document.getElementById('sanminChart');
            if (!canvas1 || !canvas2) return;

            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            ChartLib.defaults.color = isDarkMode ? '#aaaaaa' : '#6b4c35';
            ChartLib.defaults.font.family = '-apple-system, BlinkMacSystemFont, "PingFang TC", "PingFang SC", "Microsoft JhengHei", sans-serif';

            const stageLabels = [
                t('biography.stage_0'),
                t('biography.stage_1'),
                t('biography.stage_2'),
                t('biography.stage_3'),
                t('biography.stage_4'),
                t('biography.stage_5')
            ];

            const ctx1 = canvas1.getContext('2d');
            influenceChartInstance = new ChartLib(ctx1, {
                type: 'line',
                data: {
                    labels: stageLabels,
                    datasets: [{
                        label: t('biography.chart1_label'),
                        data: [10, 30, 80, 100, 60, 90],
                        borderColor: '#f1c40f',
                        backgroundColor: 'rgba(241, 196, 15, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: isDarkMode ? '#111111' : '#f5f0e8',
                        pointBorderColor: '#f1c40f',
                        pointHoverBackgroundColor: '#f1c40f',
                        pointHoverBorderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { display: false, min: 0, max: 110 },
                        x: { grid: { color: isDarkMode ? '#333333' : '#d4c4a0' } }
                    }
                }
            });

            const principleLabels = [
                t('biography.principle_0'),
                t('biography.principle_1'),
                t('biography.principle_2')
            ];

            const tooltipDetails = {
                [principleLabels[0]]: [t('biography.principle_0_line1'), t('biography.principle_0_line2')],
                [principleLabels[1]]: [t('biography.principle_1_line1'), t('biography.principle_1_line2')],
                [principleLabels[2]]: [t('biography.principle_2_line1'), t('biography.principle_2_line2')]
            };

            const ctx2 = canvas2.getContext('2d');
            sanminChartInstance = new ChartLib(ctx2, {
                type: 'radar',
                data: {
                    labels: principleLabels,
                    datasets: [
                        {
                            label: stageLabels[0],
                            data: [75, 45, 15],
                            backgroundColor: 'rgba(155, 89, 182, 0.3)',
                            borderColor: '#9b59b6',
                            pointBackgroundColor: '#9b59b6',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: '#9b59b6',
                            borderWidth: 2,
                            hidden: !isAllShown
                        },
                        {
                            label: stageLabels[1],
                            data: [85, 65, 45],
                            backgroundColor: 'rgba(52, 152, 219, 0.3)',
                            borderColor: '#3498db',
                            pointBackgroundColor: '#3498db',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: '#3498db',
                            borderWidth: 2,
                            hidden: !isAllShown
                        },
                        {
                            label: stageLabels[2],
                            data: [100, 70, 50],
                            backgroundColor: 'rgba(243, 156, 18, 0.3)',
                            borderColor: '#f39c12',
                            pointBackgroundColor: '#f39c12',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: '#f39c12',
                            borderWidth: 2,
                            hidden: false
                        },
                        {
                            label: stageLabels[3],
                            data: [90, 100, 60],
                            backgroundColor: 'rgba(46, 204, 113, 0.3)',
                            borderColor: '#2ecc71',
                            pointBackgroundColor: '#2ecc71',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: '#2ecc71',
                            borderWidth: 2,
                            hidden: !isAllShown
                        },
                        {
                            label: stageLabels[4],
                            data: [80, 90, 60],
                            backgroundColor: 'rgba(26, 188, 156, 0.3)',
                            borderColor: '#1abc9c',
                            pointBackgroundColor: '#1abc9c',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: '#1abc9c',
                            borderWidth: 2,
                            hidden: !isAllShown
                        },
                        {
                            label: stageLabels[5],
                            data: [100, 95, 100],
                            backgroundColor: 'rgba(231, 76, 60, 0.3)',
                            borderColor: '#e74c3c',
                            pointBackgroundColor: '#e74c3c',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: '#e74c3c',
                            borderWidth: 2,
                            hidden: !isAllShown
                        }
                    ]
                },
                options: {
                    responsive: true,
                    animation: {
                        duration: 1500,
                        easing: 'easeOutQuart'
                    },
                    scales: {
                        r: {
                            min: 0,
                            max: 110,
                            angleLines: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                            grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                            pointLabels: {
                                font: { size: 14, weight: 'bold' },
                                color: isDarkMode ? '#e5e7eb' : '#6b4c35',
                                backdropColor: 'transparent'
                            },
                            ticks: { display: false }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: isDarkMode ? '#aaa' : '#6b4c35', padding: 15 }
                        },
                        tooltip: {
                            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                            titleColor: isDarkMode ? '#fff' : '#000',
                            bodyColor: isDarkMode ? '#ddd' : '#333',
                            borderColor: isDarkMode ? '#444' : '#ddd',
                            borderWidth: 1,
                            padding: 10,
                            titleFont: { size: 14 },
                            bodyFont: { size: 12 },
                            callbacks: {
                                beforeBody: function(context) {
                                    const label = context[0].label;
                                    const details = tooltipDetails[label];
                                    return ['', details[0], details[1], ''];
                                },
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });
        } catch (err) {
            /* Ignore chart rendering failure gracefully */
        }

        if (chartsSection) {
            chartsSection.classList.add('loaded');
        }
    }

    syncShowAllLabel();
    renderCharts();

    window.addEventListener('sys-lang-change', () => {
        syncShowAllLabel();
        renderCharts();
    }, { signal: pageSignal });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        renderCharts();
    }, { signal: pageSignal });
}
