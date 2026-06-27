const RESOURCE_URL = "YOUR_SERVER_DOMAIN_HERE";

function showMessage(message) {
    document.getElementById("message").style.display = "block";
    document.getElementById("subtitle").style.display = "none";
    document.getElementById("message").innerHTML = message;
}

const Gateway = new WebSocket("wss://" + RESOURCE_URL + "/gateway");

Gateway.onopen = () => console.log("[Ldstream] Connected to gateway");
Gateway.onclose = () => console.log("[Ldstream] Gateway closed");

function reloadWithRoomID(roomID) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const url = new URL(tabs[0].url);
        if (url.searchParams.has("roomID")) url.searchParams.set("roomID", roomID);
        else url.searchParams.append("roomID", roomID);
        chrome.tabs.update(tabs[0].id, { url: url.toString() });
        window.close();
    });
}

Gateway.onmessage = function(msg) {
    const response = JSON.parse(msg.data);
    if (response.success) reloadWithRoomID(response.response.roomID);
    else showMessage("Error: " + response.response);
};

function createRoom() {
    const theme    = document.getElementById("room-colour-picker").value;
    const password = document.getElementById("room-password").value.trim();
    Gateway.send(JSON.stringify({
        type: "create-party",
        data: { theme, password }
    }));
}

document.getElementById("create-button").addEventListener("click", createRoom);
