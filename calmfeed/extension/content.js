// Calmfeed: hides unwanted posts in the LinkedIn feed.
// LinkedIn's class names change often, so posts are matched mostly by their visible text.
(() => {
  if (window.__calmfeed) return;
  window.__calmfeed = true;

  const HIDDEN = 'calmfeed-hidden';
  let settings = { ...CALMFEED.DEFAULTS };

  // ---- styles (injected at document_start so the sidebar never flashes) ----
  const style = document.createElement('style');
  style.textContent = `
    .${HIDDEN}{display:none!important}
    html.calmfeed-no-aside aside.scaffold-layout__aside,
    html.calmfeed-no-aside .scaffold-layout__aside{display:none!important}
  `;
  (document.head || document.documentElement).appendChild(style);

  // ---- matchers ----
  // e.g. "Jane Doe likes this", "and 3 others like this", "finds this insightful", "replied to Sam's comment"
  const ACTIVITY_RE = /^(.{1,80}\s)?(likes?|loves?|celebrates?|supports?|finds?|commented on|reacted to) (this|a (post|comment))\b|replied to .{1,60}comment$/i;
  const CELEBRATION_RE = /(started a new position|starting a new position|work anniversary|new certification|is celebrating|celebrating \d+ years?|Congratulate .+ on)/i;
  const POLL_RE = /^(\d[\d,.]*k?\s+votes?|You can see how people vote)/i;
  const REPOST_RE = /\breposted this\b/i;
  const SUGGESTED_EXACT = new Set(['Suggested', 'People you may know', 'Recommended for you', 'Jobs recommended for you', 'More suggestions for you']);

  function isPromoted(t) {
    return t === 'Promoted' || t.startsWith('Promoted by') || t === 'Sponsored';
  }

  // Short text nodes near the top of a post (the "header" lines).
  function headerLines(post) {
    const lines = [];
    const walker = document.createTreeWalker(post, NodeFilter.SHOW_TEXT);
    let n;
    let scanned = 0;
    while ((n = walker.nextNode()) && scanned < 400) {
      scanned++;
      const t = n.data.trim();
      if (t && t.length <= 160) lines.push(t);
    }
    return lines;
  }

  function reasonFor(post) {
    const f = settings.filters || {};
    const pro = settings.pro;
    const lines = headerLines(post);
    const top = lines.slice(0, 25);

    if (f.promoted && lines.some(isPromoted)) return 'promoted';
    if (f.suggested && top.some(t => SUGGESTED_EXACT.has(t))) return 'suggested';
    if (!pro) return null;

    if (f.activity && top.slice(0, 8).some(t => t.length < 120 && ACTIVITY_RE.test(t))) return 'activity';
    if (f.reposts && top.slice(0, 8).some(t => REPOST_RE.test(t))) return 'reposts';
    if (f.polls && (post.querySelector('[class*="poll"]') || lines.some(t => POLL_RE.test(t)))) return 'polls';
    if (f.celebrations && (post.querySelector('[class*="celebration"]') || top.some(t => CELEBRATION_RE.test(t)))) return 'celebrations';
    if (f.videos && post.querySelector('video, [class*="video-player"], [data-test-id*="video"]')) return 'videos';

    const kws = (settings.keywords || []).filter(Boolean);
    if (kws.length) {
      const text = post.textContent.toLowerCase();
      if (kws.some(k => text.includes(k.toLowerCase()))) return 'keyword';
    }
    return null;
  }

  // ---- finding posts ----
  // Two ways, so a LinkedIn redesign doesn't break us:
  //  1. Known markup (fast, works on today's LinkedIn).
  //  2. Layout: find a label like "Promoted", climb up to the element that sits in
  //     a list of several big blocks (the feed), and treat that block as the post.
  //     Every other block in that list is then a post too.
  const POST_SELECTOR = [
    '[data-id^="urn:li:activity"]',
    '[data-id^="urn:li:aggregate"]',
    '[data-urn^="urn:li:activity"]',
    '[data-urn^="urn:li:aggregate"]',
    '.feed-shared-update-v2',
    '.occludable-update',
    '[data-view-name="feed-full-update"]'
  ].join(',');

  const MIN_POST_PX = 120;   // a feed post is at least this tall
  const MAX_POST_PX = 2600;  // anything taller is probably the whole feed, not one post
  const feedLists = new Set();

  function onFeed() {
    return location.pathname === '/' || location.pathname.startsWith('/feed');
  }

  function feedRoot() {
    return document.querySelector('main') || document.body;
  }

  function isAnchor(t) {
    return isPromoted(t) || SUGGESTED_EXACT.has(t) || POLL_RE.test(t) ||
      (t.length < 120 && (ACTIVITY_RE.test(t) || REPOST_RE.test(t) || CELEBRATION_RE.test(t)));
  }

  function isBlock(el) {
    return el.classList.contains(HIDDEN) || el.offsetHeight >= MIN_POST_PX;
  }

  function blockCount(list) {
    let n = 0;
    for (const c of list.children) if (isBlock(c) && ++n >= 3) break;
    return n;
  }

  // Climb from a label to the post that contains it.
  function postFromAnchor(textNode, root) {
    let el = textNode.parentElement;
    while (el && el !== root && el.parentElement) {
      const list = el.parentElement;
      if (isBlock(el) && blockCount(list) >= 3) {
        if (el.offsetHeight > MAX_POST_PX) return null;
        feedLists.add(list);
        return el;
      }
      el = list;
    }
    return null;
  }

  function outermost(set) {
    return [...set].filter(el => {
      for (let p = el.parentElement; p; p = p.parentElement) if (set.has(p)) return false;
      return true;
    });
  }

  function findPosts() {
    const posts = new Set();

    // 1. known markup
    for (const el of document.querySelectorAll(POST_SELECTOR)) {
      posts.add(el.closest('.occludable-update') || el);
    }

    // 2. labels -> posts (only for labels not already inside a known post)
    const root = feedRoot();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const t = n.data.trim();
      if (!t || t.length > 160 || !isAnchor(t)) continue;
      const parent = n.parentElement;
      if (!parent || parent.closest(POST_SELECTOR) || parent.closest('.' + HIDDEN)) continue;
      const post = postFromAnchor(n, root);
      if (post) posts.add(post);
    }

    // 3. every block in a feed list we've found is a post (for keywords/videos)
    for (const list of feedLists) {
      if (!list.isConnected) { feedLists.delete(list); continue; }
      for (const c of list.children) if (isBlock(c)) posts.add(c);
    }

    return outermost(posts);
  }

  // ---- stats ----
  let pendingCount = 0;
  let statsTimer = null;
  function countHidden() {
    pendingCount++;
    clearTimeout(statsTimer);
    statsTimer = setTimeout(() => {
      const add = pendingCount;
      pendingCount = 0;
      const today = new Date().toISOString().slice(0, 10);
      chrome.storage.local.get(['stats'], d => {
        const s = d.stats || {};
        const day = s.day === today ? s.today || 0 : 0;
        chrome.storage.local.set({ stats: { day: today, today: day + add, total: (s.total || 0) + add } });
      });
    }, 800);
  }

  // ---- health: lets the popup say "working" or "can't see your feed" ----
  let lastHealth = -1;
  let healthTimer = null;
  function reportHealth(count) {
    if (count === lastHealth) return;
    lastHealth = count;
    clearTimeout(healthTimer);
    healthTimer = setTimeout(() => {
      chrome.storage.local.set({ health: { posts: count, at: Date.now() } });
    }, 1500);
  }

  // ---- main pass ----
  function scan(force) {
    document.documentElement.classList.toggle('calmfeed-no-aside', !!(settings.enabled && settings.pro && settings.filters.sidebar && onFeed()));
    if (!onFeed()) return;
    const posts = findPosts();
    reportHealth(posts.length);
    for (const post of posts) {
      const len = String(post.textContent.length);
      if (!force && post.dataset.calmfeedLen === len) continue;
      post.dataset.calmfeedLen = len;
      const reason = settings.enabled ? reasonFor(post) : null;
      const wasHidden = post.classList.contains(HIDDEN);
      post.classList.toggle(HIDDEN, !!reason);
      if (reason && !wasHidden) countHidden();
    }
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => setTimeout(() => { scheduled = false; scan(false); }, 120));
  }

  function load(force) {
    chrome.storage.local.get(['enabled', 'pro', 'filters', 'keywords'], d => {
      settings = {
        enabled: d.enabled !== false,
        pro: !!d.pro,
        filters: { ...CALMFEED.DEFAULTS.filters, ...(d.filters || {}) },
        keywords: d.keywords || []
      };
      scan(force);
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.enabled || changes.pro || changes.filters || changes.keywords) load(true);
  });

  function start() {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    load(true);
  }
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
