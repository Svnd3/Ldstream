function copyRoomURL() {
    const btn = document.getElementById("copy-button");
    if (btn.classList.contains("action-complete")) return;

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];

        // YouTube (and other SPAs) strip unknown query params from the URL.
        // We read the roomID from the tab's sessionStorage (set at document_start)
        // and reconstruct the share URL so it always includes roomID.
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => sessionStorage.getItem("lds_room_id")
        }, function(results) {
            const roomID = results?.[0]?.result;
            let shareUrl = tab.url;

            if (roomID) {
                const url = new URL(tab.url);
                url.searchParams.set("roomID", roomID);
                shareUrl = url.toString();
            }

            navigator.clipboard.writeText(shareUrl).then(() => {
                btn.classList.add("action-complete");
                btn.querySelector("p").textContent = "Copied!";
            }).catch(err => console.error("[Ldstream] Could not copy URL:", err));
        });
    });
}

document.getElementById("copy-button").addEventListener("click", copyRoomURL);
