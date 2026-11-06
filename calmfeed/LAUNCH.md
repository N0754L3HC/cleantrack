# Calmfeed launch checklist

Goal: £110–120/month ≈ **31 Pro subscribers at £3.99** (about £3.55 each after Stripe + ExtensionPay fees).

```
calmfeed/
  extension/   the Chrome extension (load this folder unpacked to test)
  site/        landing page + privacy policy + calmfeed.zip download
  store/       Chrome Web Store images (2 screenshots, promo tile)
```

## Hour 1: ship (about 25 minutes of clicking)

### 1. Payments: ExtensionPay (10 min)
1. Sign up at https://extensionpay.com and click **Add extension**.
2. Use the ID `calmfeed`. If it's taken, choose another and change `EXTPAY_ID` in `extension/config.js`, then rebuild the zip (step 4).
3. Connect your Stripe account (or create one). Payouts go straight to Stripe.
4. Add plans:
   - **Monthly: £3.99 / month** (main plan)
   - Optional **Founding member: £19 one-off, lifetime** (limit it to the first 20 buyers; good for the first-hour push)
5. Test: load `extension/` unpacked → click the icon → **Go Pro** → the Stripe checkout should open.

### 2. Landing page (5 min)
Host the `site/` folder on Vercel, Netlify Drop (drag and drop the folder), or GitHub Pages. You need its URL for the store's privacy policy field: `https://YOUR-SITE/privacy.html`.

### 3. Chrome Web Store (10 min, then review)
1. https://chrome.google.com/webstore/devconsole: pay the one-off **$5** developer fee.
2. **New item** → upload `site/calmfeed.zip`.
3. Fill in the listing using the copy below and the images in `store/`.
4. Privacy tab:
   - Single purpose: "Hides selected posts from the user's LinkedIn feed."
   - Host permission (linkedin.com): "Needed to hide posts on the LinkedIn feed page."
   - Storage: "Saves the user's filter settings locally."
   - Data usage: tick nothing collected; certify the three statements.
   - Privacy policy URL: your `/privacy.html`.
5. Submit. Review usually takes 1–3 days. Until it's approved, people install from the zip on the landing page.
6. When it's live, paste the store URL into `STORE_URL` at the bottom of `site/index.html` and redeploy. Every button then points to the store.

### 4. Rebuilding the zip after any change
```
cd calmfeed/extension && rm -f ../site/calmfeed.zip && zip -qr ../site/calmfeed.zip . -x 'icons/icon.svg'
```
Bump `"version"` in `manifest.json` before uploading an update to the store.

## Store listing copy

**Name:** Calmfeed - Clean LinkedIn Feed
**Summary (132 chars max):** Hide promoted posts, suggested posts, polls, "X liked this" noise and muted keywords from your LinkedIn feed.
**Category:** Productivity

**Description:**
> Your LinkedIn feed, minus the noise.
>
> Calmfeed hides the stuff you never asked to see so your feed is just the people you follow.
>
> FREE
> • Hide promoted posts (ads)
> • Hide "Suggested" posts and "People you may know"
> • See how many junk posts were hidden today
>
> PRO (£3.99/month)
> • Hide "X liked / commented on this" posts
> • Hide polls, reposts and videos
> • Hide job changes and work anniversaries
> • Hide the News & puzzles sidebar
> • Mute any keyword or phrase ("thrilled to announce", "AI", "crypto"…)
>
> Private by design: Calmfeed runs only in your browser. No account, no tracking, nothing sent anywhere.
> Not affiliated with LinkedIn.

## Hour 2: first 5 customers

People who hate their LinkedIn feed are *on LinkedIn*, so start there.

**1. LinkedIn post (do this first).** Attach `store/screenshot-1280x800.png`.
> I got tired of my LinkedIn feed being mostly ads, polls and "Dave liked this".
>
> So I built a little Chrome extension that hides all of it. Now I only see posts from people I actually follow.
>
> It's called Calmfeed. Free to use, and the first 20 people can get Pro for life for £19.
>
> Link in the comments 👇 (and yes, I see the irony of posting this here)

Put the landing page link in the first comment. Posts with links in the body get shown to fewer people.

**2. DM 30 people (the biggest lever).** Recruiters, salespeople, job seekers and founders you know:
> Hey [name], quick one: I just built a Chrome extension that strips the ads, polls and "X liked this" junk out of the LinkedIn feed. You're on here more than anyone I know, so I'd love you to try it: [link]. Free, takes 30 seconds. Honest feedback welcome!

Follow up with anyone who installs: "Want Pro for life for £19? I'm doing it for the first 20 people."

**3. Group chats and friends.** WhatsApp/Slack groups with job seekers or people in sales.

**4. Reddit** (read each subreddit's self-promo rules first): r/linkedin, r/recruitinghell, r/sales, r/jobs, r/chrome_extensions, r/SideProject. Lead with the annoyance and the screenshot, not the pitch.

**5. X / Threads:** the same post as LinkedIn, with the screenshot.

Expect roughly 2–5% of installs to pay, so getting to 5 buyers in an hour means about 100+ installs or a lot of personal DMs. The £19 lifetime founding offer is the fastest way to get first payments. The £3.99 monthly plan is what builds the recurring £110+.

## Ideas for later
- Annual plan (£29/yr).
- 7-day Pro trial (ExtensionPay supports trials).
- "Hide posts with more than N hashtags", "Hide 'Agree?' engagement bait".
- Firefox / Edge store listings (same code).
