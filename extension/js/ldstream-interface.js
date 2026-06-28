// Ldstream — multi-platform watch party extension
// Content script: detects platform, embeds player controls, manages WebSocket

function LdstreamEmbeddedSource() {
    "use strict";

    // ─── Constants ──────────────────────────────────────────────────────────────
    const RESOURCE_URL = "web-production-26f3e.up.railway.app"; // no protocol, just domain

    const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "👏", "🎉", "💀"];

    const AVATARS = [
        "beagle","bernese","bichon","birb","corgi","hedgehog",
        "maincoon","mutt","otter","persian","pom","pug",
        "quokka","siamese","sloth","tabby","toad","tuxedo"
    ];

    // ─── Globals ─────────────────────────────────────────────────────────────────
    const G = {
        ROOM_ID:    "",
        ROOM_COLOUR:"",
        IS_HOST:    false,
        GATEWAY:    null,
        CHAT_READY: false,
        TYPING_COUNT: 0,
        TYPING:     false,
        UNREAD:     0,
        LAST_AUTHOR:"",
        CONTROLS_FROZEN: false,
        FREEZE_TIMER:    null,
        PLATFORM:   detectPlatform(),
    };

    // ─── Platform Detection ───────────────────────────────────────────────────────
    function detectPlatform() {
        const h = location.hostname;
        if (h.includes("netflix.com"))    return "netflix";
        if (h.includes("youtube.com"))    return "youtube";
        if (h.includes("disneyplus.com")) return "disney";
        if (h.includes("primevideo.com") || h.includes("amazon.com")) return "prime";
        if (h.includes("hulu.com"))       return "hulu";
        return "generic";
    }

    // ─── Video Player Abstraction ─────────────────────────────────────────────────
    function netflixPlayer() {
        try {
            const e = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
            const t = e.getAllPlayerSessionIds().find(v => v.includes("watch"));
            return e.getVideoPlayerBySessionId(t);
        } catch { return null; }
    }

    function getVideoEl() {
        return document.querySelector("video");
    }

    const Player = {
        isReady() {
            if (G.PLATFORM === "netflix") {
                const p = netflixPlayer();
                return p && p.isReady();
            }
            return !!getVideoEl();
        },
        isPaused() {
            if (G.PLATFORM === "netflix") return netflixPlayer()?.isPaused() ?? true;
            return getVideoEl()?.paused ?? true;
        },
        pause() {
            if (G.PLATFORM === "netflix") netflixPlayer()?.pause();
            else getVideoEl()?.pause();
        },
        play() {
            if (G.PLATFORM === "netflix") netflixPlayer()?.play();
            else getVideoEl()?.play();
        },
        seek(ms) {
            if (G.PLATFORM === "netflix") netflixPlayer()?.seek(ms);
            else if (getVideoEl()) getVideoEl().currentTime = ms / 1000;
        },
        currentTimeMs() {
            if (G.PLATFORM === "netflix") return netflixPlayer()?.getCurrentTime() ?? 0;
            return (getVideoEl()?.currentTime ?? 0) * 1000;
        },
    };

    // ─── Control Freeze (prevents event echo) ─────────────────────────────────────
    function freezeControls() {
        G.CONTROLS_FROZEN = true;
        clearTimeout(G.FREEZE_TIMER);
        G.FREEZE_TIMER = setTimeout(() => { G.CONTROLS_FROZEN = false; }, 800);
    }

    // ─── Gateway ──────────────────────────────────────────────────────────────────
    function gateway(msg) {
        if (G.GATEWAY && G.GATEWAY.readyState === WebSocket.OPEN)
            G.GATEWAY.send(JSON.stringify(msg));
    }

    // ─── Storage helpers ──────────────────────────────────────────────────────────
    const DEFAULTS = { username: "Ldstream User", colour: "#E50914", avatar: "default" };
    function get(k)        { return localStorage.getItem(k) ?? DEFAULTS[k]; }
    function set(k, v)     { localStorage.setItem(k, v); }

    // ─── Audio notification ───────────────────────────────────────────────────────
    function playNotification() {
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.25);
        } catch {}
    }

    // ─── Timestamps ───────────────────────────────────────────────────────────────
    function formatTime(ts) {
        const d = ts ? new Date(ts) : new Date();
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    // ─── Rainbow text ─────────────────────────────────────────────────────────────
    function toRainbow(text) {
        const colours = ["#E50914","#FF6B35","#FFD700","#00C853","#00B0FF","#AA00FF"];
        return text.split("").map((c, i) =>
            `<span style="color:${colours[i % colours.length]}">${c}</span>`
        ).join("");
    }

    // ─── CrazyCase ────────────────────────────────────────────────────────────────
    function toCrazyCase(text) {
        let upper = Math.random() > 0.5;
        return text.split("").map(c => {
            if (/[a-zA-Z]/.test(c)) { const r = upper ? c.toUpperCase() : c.toLowerCase(); upper = !upper; return r; }
            return c;
        }).join("");
    }

    // ─── Chat UI ──────────────────────────────────────────────────────────────────
    function addChatMessage(data) {
        if (!G.CHAT_READY) return;
        const { author, colour, content, modifiers = "", avatar, timestamp } = data;
        const el = document.getElementById("lds-chat-history");
        if (!el) return;

        let msgHtml = `<div class="lds-msg">`;
        if (G.LAST_AUTHOR !== author) {
            const avatarSrc = avatar === "default" || modifiers.includes("system")
                ? `https://${RESOURCE_URL}/avatar/default`
                : `https://${RESOURCE_URL}/avatar/${avatar}`;
            msgHtml += `<img class="lds-avatar" src="${avatarSrc}">`;
            msgHtml += `<span class="lds-nick" style="color:${colour}">${author}</span>`;
            msgHtml += `<span class="lds-time">${formatTime(timestamp)}</span><br>`;
        }

        // Apply modifier
        let inner = content;
        if (modifiers === "rainbow") inner = toRainbow(content);
        else if (modifiers === "spoiler") inner = `<span class="lds-spoiler">${content}</span>`;
        else if (modifiers)               inner = `<span class="${modifiers}">${content}</span>`;

        msgHtml += `<span class="lds-content">${inner}</span></div>`;

        G.LAST_AUTHOR = author;
        el.insertAdjacentHTML("afterbegin", msgHtml);

        // Notification for new incoming messages (not own)
        if (author !== get("username") && !modifiers.includes("system")) {
            if (document.visibilityState === "hidden") {
                G.UNREAD++;
                window.postMessage({ type: "LDSTREAM_NEW_MESSAGE" }, "*");
            }
            playNotification();
        }
    }

    function displayLocal(msg) {
        addChatMessage({ author: "System", colour: G.ROOM_COLOUR, content: msg, modifiers: "lds-system", avatar: "default" });
    }

    // ─── Emoji float animation ────────────────────────────────────────────────────
    function showFloatingEmoji(emoji) {
        const div = document.createElement("div");
        div.textContent = emoji;
        div.style.cssText = [
            "position:fixed",
            `left:${20 + Math.random() * 60}%`,
            "bottom:25%",
            "font-size:3rem",
            "pointer-events:none",
            "z-index:2147483647",
            "animation:lds-float 2.5s ease-out forwards",
        ].join(";");
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2600);
    }

    // ─── User list UI ─────────────────────────────────────────────────────────────
    function updateUserList(users) {
        const el = document.getElementById("lds-userlist-body");
        const cnt = document.getElementById("lds-user-count");
        if (!el) return;
        el.innerHTML = users.map(u =>
            `<div class="lds-user-item">👤 ${u}</div>`
        ).join("");
        if (cnt) cnt.textContent = users.length;
    }

    // ─── Typing indicator ─────────────────────────────────────────────────────────
    function updateTyping(data) {
        if (data.user === get("username")) return;
        if (data.mode === "start") G.TYPING_COUNT = Math.max(0, G.TYPING_COUNT + 1);
        else G.TYPING_COUNT = Math.max(0, G.TYPING_COUNT - 1);
        const el = document.getElementById("lds-typing");
        if (el) el.style.display = G.TYPING_COUNT > 0 ? "block" : "none";
    }

    function typingStart() {
        if (!G.TYPING) {
            G.TYPING = true;
            gateway({ type: "typing-update", data: { mode: "start", user: get("username"), roomID: G.ROOM_ID } });
        }
    }
    function typingStop() {
        if (G.TYPING) {
            G.TYPING = false;
            gateway({ type: "typing-update", data: { mode: "stop", user: get("username"), roomID: G.ROOM_ID } });
        }
    }

    // ─── Video event handlers ─────────────────────────────────────────────────────
    function onPause() {
        if (G.CONTROLS_FROZEN) return;
        if (!G.IS_HOST) { displayLocal("Only the host can control playback."); return; }
        displayLocal("⏸ Paused");
        gateway({ type: "pause-video", data: { roomID: G.ROOM_ID } });
    }

    function onPlay() {
        if (G.CONTROLS_FROZEN) return;
        if (!G.IS_HOST) { displayLocal("Only the host can control playback."); return; }
        const ts = Player.currentTimeMs();
        displayLocal(`▶ Playing at ${msToTimestamp(ts)}`);
        gateway({ type: "play-video", data: { timestamp: ts, roomID: G.ROOM_ID } });
    }

    function onSeeked() {
        if (G.CONTROLS_FROZEN) return;
        if (!G.IS_HOST) return;
        const ts = Player.currentTimeMs();
        displayLocal(`⏩ Seeked to ${msToTimestamp(ts)}`);
        gateway({ type: "seek-video", data: { timestamp: ts, roomID: G.ROOM_ID } });
    }

    function msToTimestamp(ms) {
        return new Date(ms).toISOString().slice(11, 19);
    }

    // ─── Remote playback commands ─────────────────────────────────────────────────
    function remotePlay(timeMs) {
        if (G.CONTROLS_FROZEN) return;
        freezeControls();
        Player.seek(timeMs);
        Player.play();
    }

    function remotePause() {
        if (G.CONTROLS_FROZEN) return;
        freezeControls();
        Player.pause();
    }

    function remoteSeek(timeMs) {
        if (G.CONTROLS_FROZEN) return;
        freezeControls();
        Player.seek(timeMs);
    }

    // ─── Listener attachment ──────────────────────────────────────────────────────
    function attachVideoListeners() {
        const vid = getVideoEl();
        if (!vid) return;

        vid.onpause  = onPause;
        vid.onplay   = onPlay;
        vid.onseeked = onSeeked;

        // Re-attach if source changes (Netflix swaps src)
        const obs = new MutationObserver(changes => {
            if (changes.some(c => c.attributeName === "src")) attachVideoListeners();
        });
        obs.observe(vid, { attributes: true });
    }

    function waitForPlayer(cb) {
        if (Player.isReady() && getVideoEl()) {
            cb();
        } else {
            setTimeout(() => waitForPlayer(cb), 1000);
        }
    }

    // ─── Chat commands ────────────────────────────────────────────────────────────
    function helpText() {
        displayLocal(
            "Ldstream Chat Commands:<br>" +
            "/help — this list<br>" +
            "/b [msg] — bold<br>" +
            "/i [msg] — italic<br>" +
            "/u [msg] — underline<br>" +
            "/s [msg] — strikethrough<br>" +
            "/c [msg] — cursive<br>" +
            "/cc [msg] — cRaZy CaSe<br>" +
            "/big [msg] — big text<br>" +
            "/rainbow [msg] — rainbow colours<br>" +
            "/spoiler [msg] — hidden until hovered<br>" +
            "/me [msg] — action message<br>" +
            "/tts [msg] — text-to-speech<br>" +
            "/users — show who's in the room<br>" +
            "/ping — server latency<br>" +
            "/r — reload session"
        );
    }

    function handleChatInput(event) {
        const input = document.getElementById("lds-chat-input");
        if (!input) return;

        if (event.key !== "Enter") {
            typingStart();
            if (input.value.trim() === "") typingStop();
            return;
        }

        typingStop();
        const raw = input.value.trim();
        input.value = "";
        if (!raw) return;
        if (raw.length > 2000) { displayLocal("Message too long (max 2000 chars)"); return; }

        let send = true;
        let content = raw;
        let modifiers = "";

        if (raw.startsWith("/")) {
            const parts = raw.slice(1).split(/ +/);
            const cmd = parts.shift().toLowerCase();
            const body = parts.join(" ");

            switch (cmd) {
                case "help":    helpText(); send = false; break;
                case "b":       modifiers = "bold";          content = body; break;
                case "i":       modifiers = "italic";        content = body; break;
                case "u":       modifiers = "underline";     content = body; break;
                case "s":       modifiers = "strikethrough"; content = body; break;
                case "c":       modifiers = "cursive";       content = body; break;
                case "cc":      content = toCrazyCase(body);                break;
                case "big":     modifiers = "big";           content = body; break;
                case "rainbow": modifiers = "rainbow";       content = body; break;
                case "spoiler": modifiers = "spoiler";       content = body; break;
                case "me":      modifiers = "italic";        content = `* ${get("username")} ${body}`; break;
                case "tts":     modifiers = "tts";           content = body; break;
                case "users":
                    const panel = document.getElementById("lds-userlist");
                    if (panel) panel.style.display = panel.style.display === "none" ? "block" : "none";
                    send = false; break;
                case "ping":
                    gateway({ type: "system-ping", data: { start: Date.now() } });
                    send = false; break;
                case "r":       location.reload(); send = false; break;
            }
        }

        if (send) {
            gateway({
                type: "chat-message",
                data: {
                    roomID:    G.ROOM_ID,
                    content,
                    colour:    get("colour"),
                    author:    get("username"),
                    avatar:    get("avatar"),
                    modifiers,
                }
            });
        }
    }

    // ─── TTS ─────────────────────────────────────────────────────────────────────
    function speakMessage(text) {
        const u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(u);
    }

    // ─── Gateway message router ───────────────────────────────────────────────────
    function handleGatewayMessage(raw) {
        const msg = JSON.parse(raw);

        switch (msg.type) {
            case "join-party":
                if (msg.success) {
                    G.ROOM_COLOUR = msg.response.theme;
                    G.IS_HOST     = msg.response.isHost;
                    injectUI();
                    if (G.IS_HOST) displayLocal("👑 You are the host — you control playback.");
                    else displayLocal("You joined! The host controls play/pause/seek.");
                } else {
                    alert("Ldstream: " + msg.response);
                }
                break;

            case "chat-message":
                if (msg.data.modifiers?.includes("tts")) speakMessage(msg.data.content);
                addChatMessage(msg.data);
                break;

            case "pause-video":  remotePause(); break;
            case "play-video":   remotePlay(msg.data.time); break;
            case "seek-video":   remoteSeek(msg.data.timestamp); break;

            case "emoji-reaction":
                showFloatingEmoji(msg.data.emoji);
                break;

            case "user-list-update":
                updateUserList(msg.data.users);
                break;

            case "system-ping":
                displayLocal(`🏓 Ping: ${Date.now() - msg.response.start}ms`);
                break;

            case "typing-update":
                updateTyping(msg.data ?? msg.response);
                break;

            default:
                if (!msg.success && msg.response) displayLocal("⚠ " + msg.response);
        }
    }

    // ─── CSS (injected) ───────────────────────────────────────────────────────────
    const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lobster+Two&family=Paytone+One&display=swap');

#lds-sidebar {
    position: fixed;
    top: 0; right: 0;
    width: 22%;
    height: 100vh;
    background: #111;
    display: flex;
    flex-direction: column;
    z-index: 2147483646;
    box-shadow: -3px 0 12px rgba(0,0,0,.6);
    font-family: Arial, Helvetica, sans-serif;
}

#lds-sidebar-header {
    background: #E50914;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: 'Paytone One', sans-serif;
    font-size: 18px;
    color: #fff;
    letter-spacing: .04em;
    cursor: default;
}

#lds-user-count {
    background: rgba(0,0,0,.3);
    border-radius: 50px;
    padding: 2px 10px;
    font-size: 13px;
}

#lds-chat-history {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    background: #1a1a1a;
    display: flex;
    flex-direction: column-reverse;
    padding: 6px;
    word-break: break-word;
}

.lds-msg { background:#212121; border-radius:6px; padding:5px 7px; margin-bottom:3px; animation: ldsSlide .3s ease; }
.lds-msg:hover { background:#2a2a2a; }

.lds-avatar { border-radius:50%; height:26px; width:26px; vertical-align:middle; margin-right:5px; }
.lds-nick   { font-family:'Paytone One',sans-serif; font-size:14px; vertical-align:middle; }
.lds-time   { color:#666; font-size:11px; margin-left:6px; vertical-align:middle; }
.lds-content { color:#ddd; font-size:13px; display:block; margin-top:2px; white-space:pre-wrap; }

.lds-system { color:#888 !important; font-style:italic; }

.bold          { font-weight:700; }
.italic        { font-style:italic; }
.underline     { text-decoration:underline; }
.strikethrough { text-decoration:line-through; }
.cursive       { font-family:'Lobster Two',cursive; font-size:18px; }
.big           { font-size:28px; }
.tts           { font-style:italic; }

.lds-spoiler { filter:blur(4px); cursor:pointer; transition:.2s; }
.lds-spoiler:hover { filter:none; }

#lds-emoji-bar {
    display: flex;
    justify-content: space-around;
    padding: 4px 0;
    background: #181818;
    border-top: 1px solid #2a2a2a;
}
.lds-emoji-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    transition: transform .15s;
}
.lds-emoji-btn:hover { transform: scale(1.35); }

#lds-chat-controls {
    padding: 6px;
    background: #111;
    border-top: 1px solid #2a2a2a;
}

#lds-chat-input {
    width: 100%;
    box-sizing: border-box;
    background: #292929;
    border: none;
    border-bottom: 2px solid #555;
    color: #fff;
    font-size: 13px;
    padding: 6px 8px;
    outline: none;
}
#lds-chat-input:focus { border-bottom-color: #E50914; }

#lds-typing {
    color: #777;
    font-style: italic;
    font-size: 12px;
    padding: 2px 4px;
    display: none;
}

/* Blinking dots */
.lds-dots span { animation: ldsBlink 1.4s infinite; display:inline; }
.lds-dots span:nth-child(2) { animation-delay:.2s; }
.lds-dots span:nth-child(3) { animation-delay:.4s; }
@keyframes ldsBlink { 0%,100%{opacity:.2} 20%{opacity:1} }

/* User list panel */
#lds-userlist {
    position: fixed;
    top: 80px; right: 23%;
    width: 180px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    z-index: 2147483647;
    padding: 8px;
    display: none;
}
#lds-userlist h4 { color:#E50914; margin:0 0 6px; font-size:13px; }
.lds-user-item { color:#ccc; font-size:13px; padding:3px 0; }

/* Settings modal */
#lds-modal {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.6);
    z-index: 2147483647;
    align-items: center;
    justify-content: center;
}
#lds-modal.open { display:flex; }
#lds-modal-box {
    background: #1a1a1a;
    border-radius: 10px;
    width: 340px;
    overflow: hidden;
    animation: ldsSlide .3s ease;
}
#lds-modal-head {
    background: #E50914;
    padding: 12px 16px;
    color: #fff;
    font-family: 'Paytone One',sans-serif;
    font-size: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
#lds-modal-close { cursor:pointer; font-size:22px; }
#lds-modal-body { padding: 16px; }
.lds-field { margin-bottom:14px; }
.lds-field label { color:#aaa; font-size:12px; display:block; margin-bottom:4px; }
.lds-field input[type=text] {
    width:100%; box-sizing:border-box;
    background:#292929; border:none; border-bottom:2px solid #555;
    color:#fff; font-size:14px; padding:6px; outline:none;
}
.lds-field input[type=text]:focus { border-bottom-color:#E50914; }
.lds-field input[type=color] { width:100%; border-radius:6px; height:36px; cursor:pointer; }
.lds-field select {
    width:100%; background:#111; border:2px solid #555; border-radius:50px;
    color:#fff; padding:10px; outline:none;
}
#lds-avatar-preview { border-radius:50%; width:80px; height:80px; display:block; margin:0 auto 10px; }
#lds-save-btn {
    width:100%; background:#E50914; color:#fff; border:none;
    border-radius:50px; padding:10px; font-size:15px; cursor:pointer;
}
#lds-save-btn:hover { background:#c0070f; }

/* Float animation */
@keyframes lds-float {
    0%   { opacity:1; transform:translateY(0) scale(1); }
    100% { opacity:0; transform:translateY(-200px) scale(1.6); }
}
@keyframes ldsSlide {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
}

/* Scrollbar */
#lds-chat-history::-webkit-scrollbar { width:4px; }
#lds-chat-history::-webkit-scrollbar-thumb { background:#E50914; border-radius:4px; }

/* Resize main video area on Netflix */
#appMountPoint .watch-video > div { width:78% !important; float:left !important; display:inline-block !important; }
`;

    // ─── UI Injection ─────────────────────────────────────────────────────────────
    function injectUI() {
        if (document.getElementById("lds-sidebar")) return; // already injected

        // Stylesheet
        const style = document.createElement("style");
        style.textContent = CSS;
        document.head.appendChild(style);

        // Settings modal
        document.body.insertAdjacentHTML("beforeend", `
<div id="lds-modal">
  <div id="lds-modal-box">
    <div id="lds-modal-head">
      User Settings
      <span id="lds-modal-close">&#x2715;</span>
    </div>
    <div id="lds-modal-body">
      <div class="lds-field">
        <label>Nickname</label>
        <input type="text" id="lds-nick-input" placeholder="Your name" maxlength="30">
      </div>
      <div class="lds-field">
        <label>Colour</label>
        <input type="color" id="lds-colour-input" value="#E50914">
      </div>
      <div class="lds-field">
        <img id="lds-avatar-preview" src="https://${RESOURCE_URL}/avatar/default" alt="avatar">
        <label>Avatar</label>
        <select id="lds-avatar-select">
          ${AVATARS.map(a => `<option value="${a}">${a.charAt(0).toUpperCase() + a.slice(1)}</option>`).join("")}
        </select>
      </div>
      <button id="lds-save-btn">Save</button>
    </div>
  </div>
</div>
        `);

        // User list floating panel
        document.body.insertAdjacentHTML("beforeend", `
<div id="lds-userlist">
  <h4>In this room</h4>
  <div id="lds-userlist-body"></div>
</div>
        `);

        // Sidebar
        const sidebar = document.createElement("div");
        sidebar.id = "lds-sidebar";
        sidebar.innerHTML = `
<div id="lds-sidebar-header">
  Ldstream
  <span id="lds-user-count">0</span>
</div>
<div id="lds-chat-history"></div>
<div id="lds-emoji-bar">
  ${EMOJIS.map(e => `<button class="lds-emoji-btn" data-emoji="${e}" title="${e}">${e}</button>`).join("")}
</div>
<div id="lds-chat-controls">
  <input type="text" id="lds-chat-input" placeholder="Chat… (Enter to send)" autocomplete="off" maxlength="2000">
  <div id="lds-typing" class="lds-dots">
    <span>•</span><span>•</span><span>•</span> someone is typing
  </div>
</div>
        `;
        document.body.appendChild(sidebar);

        G.CHAT_READY = true;
        attachUIListeners();
        displayLocal("Welcome to Ldstream! Press Ctrl+I to open settings, /help for commands.");

        remotePause();
    }

    // ─── UI Event Listeners ───────────────────────────────────────────────────────
    function attachUIListeners() {
        // Close modal
        document.getElementById("lds-modal-close").onclick = () =>
            document.getElementById("lds-modal").classList.remove("open");
        document.getElementById("lds-modal").onclick = (e) => {
            if (e.target.id === "lds-modal") e.target.classList.remove("open");
        };

        // Save settings
        document.getElementById("lds-save-btn").onclick = () => {
            set("username", document.getElementById("lds-nick-input").value || DEFAULTS.username);
            set("colour",   document.getElementById("lds-colour-input").value);
            set("avatar",   document.getElementById("lds-avatar-select").value);
            document.getElementById("lds-modal").classList.remove("open");
            displayLocal("Settings saved!");
        };

        // Avatar preview
        document.getElementById("lds-avatar-select").onchange = function() {
            document.getElementById("lds-avatar-preview").src =
                `https://${RESOURCE_URL}/avatar/${this.value}`;
        };

        // Chat input
        const input = document.getElementById("lds-chat-input");
        input.addEventListener("keydown", handleChatInput);
        input.addEventListener("blur", e => { if (e.relatedTarget !== null) input.focus(); });

        // Emoji buttons
        document.getElementById("lds-emoji-bar").addEventListener("click", e => {
            const btn = e.target.closest(".lds-emoji-btn");
            if (!btn) return;
            const emoji = btn.dataset.emoji;
            gateway({ type: "emoji-reaction", data: { roomID: G.ROOM_ID, emoji } });
        });

        // Keyboard shortcuts
        window.addEventListener("keydown", e => {
            if (e.code === "KeyI" && e.ctrlKey && !e.shiftKey) {
                const modal = document.getElementById("lds-modal");
                document.getElementById("lds-nick-input").value    = get("username");
                document.getElementById("lds-colour-input").value  = get("colour");
                document.getElementById("lds-avatar-select").value = get("avatar");
                document.getElementById("lds-avatar-preview").src  =
                    `https://${RESOURCE_URL}/avatar/${get("avatar")}`;
                modal.classList.toggle("open");
            }
            if (e.code === "Escape") {
                document.getElementById("lds-modal")?.classList.remove("open");
                document.getElementById("lds-userlist").style.display = "none";
            }
        });
    }

    // ─── Init ─────────────────────────────────────────────────────────────────────
    function init() {
        const url = new URL(location.href);
        G.ROOM_ID = url.searchParams.get("roomID") || sessionStorage.getItem("lds_room_id");
        if (!G.ROOM_ID) return;

        G.GATEWAY = new WebSocket("wss://" + RESOURCE_URL + "/gateway");
        G.GATEWAY.onopen  = () => {
            gateway({ type: "join-party", data: {
                roomID:   G.ROOM_ID,
                username: get("username"),
                password: "",           // password support — set if room has one
            }});
        };
        G.GATEWAY.onclose  = () => displayLocal("Disconnected from Ldstream server.");
        G.GATEWAY.onmessage = e => handleGatewayMessage(e.data);

        waitForPlayer(() => {
            attachVideoListeners();
        });
    }

    init();
}

// ─── Content script wrapper ────────────────────────────────────────────────────
// Embeds LdstreamEmbeddedSource into page context so window.netflix is accessible.
window.addEventListener("message", e => {
    if (e.data?.type === "LDSTREAM_NEW_MESSAGE") {
        chrome.runtime.sendMessage({ type: "LDSTREAM_NEW_MESSAGE" });
    }
});

const _roomID = new URLSearchParams(location.search).get("roomID")
              || sessionStorage.getItem("lds_room_id");

if (_roomID) {
    if (location.hostname.includes("netflix.com")) {
        // Netflix needs page context to access window.netflix; Netflix's CSP allows this
        const script = document.createElement("script");
        script.text = `(${LdstreamEmbeddedSource.toString()})();`;
        document.documentElement.appendChild(script);
        script.remove();
    } else {
        // YouTube/Disney+/Prime/Hulu: run directly in content script context
        // (avoids CSP violation — these platforms only need the <video> element)
        LdstreamEmbeddedSource();
    }
}
