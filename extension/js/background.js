// Service worker — manages the unread message badge on the extension icon

let unreadCount = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'LDSTREAM_NEW_MESSAGE') {
        unreadCount++;
        chrome.action.setBadgeText({ text: String(unreadCount), tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#E50914', tabId: sender.tab.id });
    }
    if (message.type === 'LDSTREAM_CLEAR_BADGE') {
        unreadCount = 0;
        chrome.action.setBadgeText({ text: '', tabId: sender.tab.id });
    }
});

chrome.tabs.onActivated.addListener(() => {
    unreadCount = 0;
});
