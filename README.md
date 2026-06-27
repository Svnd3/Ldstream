# Ldstream

Watch Netflix, YouTube, Disney+, Prime Video, and Hulu **synced with your friends** — in real-time.

Built by [Svnd3](https://github.com/Svnd3) · Licensed under [GPL v3](LICENSE)

---

## Features

| Feature | Details |
|---|---|
| **Multi-platform** | Netflix, YouTube, Disney+, Prime Video, Hulu |
| **Play / Pause / Seek sync** | Host's controls broadcast to all viewers |
| **Live group chat** | Avatars, nickname colours, timestamps, chat history |
| **Emoji reactions** | Floating emoji animations over the video |
| **Host controls** | Only the room creator can control playback |
| **Room passwords** | Optional password protection for private rooms |
| **User list** | See who's in the room at any time |
| **Typing indicator** | Shows when someone is typing |
| **Sound notifications** | Ping when a new message arrives |
| **Text-to-speech** | `/tts` command reads messages aloud |
| **Chat commands** | `/b`, `/i`, `/u`, `/s`, `/c`, `/cc`, `/big`, `/rainbow`, `/spoiler`, `/me`, `/tts`, `/ping` |
| **Rate limiting** | Prevents message spam |
| **Manifest V3** | Modern Chrome extension standard |

---

## Server Setup

### 1. Prerequisites
- Java 11+
- Maven

### 2. Config file
Create `config.properties` at the project root:

```properties
http.port=6969
cache.TextIsEnabled=true
cache.BinaryIsEnabled=true

# Default uses H2 in-memory — no extra setup needed
hibernate.Dialect=org.hibernate.dialect.H2Dialect
hibernate.Driver=org.h2.Driver
hibernate.User=sa
hibernate.Password=password
hibernate.ConnectionURL=jdbc:h2:mem:Ldstream
```

### 3. Build and run
```bash
mvn package
java -jar target/Ldstream-2.0.0.jar
```

Server starts on port `6969` by default.

### 4. Free hosting options

| Platform | Free tier | Notes |
|---|---|---|
| **Railway.app** | 500 hrs/month | Easiest — just push to deploy |
| **Fly.io** | 3 small VMs | Best WebSocket support |
| **Oracle Always Free** | 4 cores / 24 GB RAM | Best long-term, more setup |

---

## Extension Setup

### Install
1. Clone or download this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode**
4. Click **Load unpacked** → select the `extension/` folder

### Configure server URL
Before loading, open these three files and replace `YOUR_SERVER_DOMAIN_HERE` with your deployed server domain (no `https://`, just the domain — e.g. `ldstream.up.railway.app`):
- `extension/js/ldstream-interface.js`
- `extension/js/popup.js`
- `extension/js/createroom.js`

### Usage
1. Go to any supported streaming site and start playing something
2. Click the **Ldstream** icon → **Create Room**
3. Pick a colour and optional password → **Create**
4. Click the icon again → **Copy Room URL**
5. Send the URL to friends — they click it and join instantly
6. Press **Ctrl+I** in the player to open user settings (avatar, nickname, colour)

### Chat commands

| Command | Effect |
|---|---|
| `/help` | Show all commands |
| `/b text` | **Bold** |
| `/i text` | *Italic* |
| `/u text` | Underline |
| `/s text` | ~~Strikethrough~~ |
| `/c text` | Cursive font |
| `/cc text` | cRaZy CaSe |
| `/big text` | Large text |
| `/rainbow text` | Rainbow colours |
| `/spoiler text` | Hidden until hovered |
| `/me text` | Action message |
| `/tts text` | Text-to-speech |
| `/users` | Toggle user list |
| `/ping` | Server latency |
| `/r` | Reload session |

---

## Project Structure

```
Ldstream/
├── extension/                      # Chrome extension (Manifest V3)
│   ├── js/
│   │   ├── ldstream-interface.js   # Main content script — all features
│   │   ├── background.js           # Service worker (unread badge)
│   │   ├── popup.js
│   │   ├── createroom.js
│   │   └── shareroom.js
│   ├── html/
│   └── css/
├── src/                            # Java Spring Boot backend
│   └── main/java/de/svnd3/ldstream/
│       ├── Ldstream.java
│       ├── handlers/               # WebSocket message handlers
│       ├── service/
│       ├── entities/
│       ├── api/
│       └── annotations/
├── www/                            # Landing page (served by the backend)
└── pom.xml
```

---

## License

GPL v3 — you can modify and distribute, but keep the same license and make source available.
