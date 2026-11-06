// Shared settings. EXTPAY_ID must match the extension ID you register on extensionpay.com.
var CALMFEED = {
  EXTPAY_ID: 'calmfeed',
  PRICE_LABEL: '£3.99/month',
  FILTERS: [
    { id: 'promoted', label: 'Promoted posts (ads)', pro: false },
    { id: 'suggested', label: 'Suggested posts & "People you may know"', pro: false },
    { id: 'activity', label: '"X liked / commented on this"', pro: true },
    { id: 'polls', label: 'Polls', pro: true },
    { id: 'celebrations', label: 'Job changes & work anniversaries', pro: true },
    { id: 'videos', label: 'Videos', pro: true },
    { id: 'reposts', label: 'Reposts', pro: true },
    { id: 'sidebar', label: 'Right sidebar (News, puzzles, ads)', pro: true }
  ],
  DEFAULTS: {
    enabled: true,
    pro: false,
    filters: { promoted: true, suggested: true, activity: true, polls: true, celebrations: false, videos: false, reposts: false, sidebar: true },
    keywords: []
  }
};
