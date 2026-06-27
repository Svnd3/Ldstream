const RESOURCE_URL = "YOUR_SERVER_DOMAIN_HERE";

const SUPPORTED_HOSTS = {
    "www.netflix.com":   "Netflix",
    "www.youtube.com":   "YouTube",
    "www.disneyplus.com":"Disney+",
    "www.primevideo.com":"Prime Video",
    "www.amazon.com":    "Prime Video",
    "www.hulu.com":      "Hulu"
};

function showMessage(message) {
    document.getElementById("user-message").innerHTML = message;
}

chrome.runtime.sendMessage({ type: "LDSTREAM_CLEAR_BADGE" });

chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const tab = tabs[0];
    const url = new URL(tab.url);

    if (SUPPORTED_HOSTS[url.host]) {
        const platform = SUPPORTED_HOSTS[url.host];
        if (url.pathname === "/browse" || url.pathname === "/" || url.pathname === "") {
            showMessage(`Choose something to watch on ${platform}, then come back to create a room!`);
        } else if (url.searchParams.has("roomID")) {
            window.location.href = "../html/shareroom.html";
        } else {
            window.location.href = "../html/createroom.html";
        }
    } else if (url.host === RESOURCE_URL) {
        showMessage("You're on the Ldstream site — the extension does the magic for you on a streaming page!");
    } else {
        showMessage("Navigate to Netflix, YouTube, Disney+, Prime Video, or Hulu to start a stream.");
    }
});
