const RESOURCE_URL = "web-production-26f3e.up.railway.app";

const SUPPORTED_HOSTS = {
    "www.netflix.com":    "Netflix",
    "www.youtube.com":    "YouTube",
    "www.disneyplus.com": "Disney+",
    "www.primevideo.com": "Prime Video",
    "www.amazon.com":     "Prime Video",
    "www.hulu.com":       "Hulu"
};

function showMessage(message) {
    document.getElementById("user-message").innerHTML = message;
}

chrome.runtime.sendMessage({ type: "LDSTREAM_CLEAR_BADGE" });

chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const tab = tabs[0];
    const url = new URL(tab.url);

    if (!SUPPORTED_HOSTS[url.host]) {
        if (url.host === RESOURCE_URL) {
            showMessage("You're on the Ldstream site — head to a streaming page to create a room!");
        } else {
            showMessage("Navigate to Netflix, YouTube, Disney+, Prime Video, or Hulu to start a stream.");
        }
        return;
    }

    // Read sessionStorage from the tab to check for an active room
    // (YouTube and other SPAs strip the roomID from the URL, so we store it in sessionStorage)
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => sessionStorage.getItem("lds_room_id")
    }, function(results) {
        const roomID = results?.[0]?.result;

        if (roomID) {
            window.location.href = "../html/shareroom.html";
            return;
        }

        // No active room — decide whether to show create or a hint
        const platform = SUPPORTED_HOSTS[url.host];
        if (url.pathname === "/browse" || url.pathname === "/" || url.pathname === "") {
            showMessage(`Choose something to watch on ${platform}, then come back to create a room!`);
        } else {
            window.location.href = "../html/createroom.html";
        }
    });
});
