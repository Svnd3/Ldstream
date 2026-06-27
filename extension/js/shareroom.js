function copyRoomURL() {
    const btn = document.getElementById("copy-button");
    if (btn.classList.contains("action-complete")) return;
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        navigator.clipboard.writeText(tabs[0].url).then(() => {
            btn.classList.add("action-complete");
            btn.querySelector("p").textContent = "Copied!";
        }).catch(err => console.error("[Ldstream] Could not copy URL:", err));
    });
}

document.getElementById("copy-button").addEventListener("click", copyRoomURL);
