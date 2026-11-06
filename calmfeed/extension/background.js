importScripts('config.js', 'ExtPay.js');

const extpay = ExtPay(CALMFEED.EXTPAY_ID);
extpay.startBackground();

function syncPaid() {
  return extpay.getUser()
    .then(user => chrome.storage.local.set({ pro: !!user.paid }))
    .catch(() => {}); // offline or not set up yet: keep the last known status
}

extpay.onPaid.addListener(() => chrome.storage.local.set({ pro: true }));

chrome.runtime.onInstalled.addListener(async details => {
  if (details.reason === 'install') {
    await chrome.storage.local.set(CALMFEED.DEFAULTS);
    chrome.tabs.create({ url: 'welcome.html' });
  }
  syncPaid();
});

chrome.runtime.onStartup.addListener(syncPaid);

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (!msg) return;
  if (msg.type === 'upgrade') extpay.openPaymentPage();
  if (msg.type === 'login') extpay.openLoginPage();
  if (msg.type === 'sync') {
    syncPaid().then(() => reply(true));
    return true;
  }
});
