package main.java.de.svnd3.ldstream.entities;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import main.java.de.svnd3.ldstream.entities.message.ChatMessage;
import main.java.de.svnd3.ldstream.entities.message.MessageBuilder;
import main.java.de.svnd3.ldstream.entities.message.SystemMessage;

public class Party {

    private final String partyID;
    private final String roomColour;
    private final String password;
    private boolean hasBeenVisited;

    private final Map<WebSocketSession, String> sessionUserMap = new HashMap<>();
    private WebSocketSession hostSession;

    private static final Logger LOGGER = Logger.getLogger(Party.class.getName());

    public Party(String partyID, String roomColour, String password) {
        this.partyID     = partyID;
        this.roomColour  = roomColour;
        this.password    = password == null ? "" : password;
    }

    public String getPartyID()    { return partyID; }
    public String getRoomColour() { return roomColour; }
    public boolean hasPassword()  { return !password.isEmpty(); }

    public boolean checkPassword(String supplied) {
        if (!hasPassword()) return true;
        return password.equals(supplied);
    }

    public boolean isHost(WebSocketSession session) {
        return session.equals(hostSession);
    }

    public List<WebSocketSession> getAllSessions() {
        return new ArrayList<>(sessionUserMap.keySet());
    }

    public List<String> getAllUsernames() {
        return new ArrayList<>(sessionUserMap.values());
    }

    public void addToSessions(WebSocketSession session, String username) {
        if (!hasBeenVisited) hasBeenVisited = true;
        sessionUserMap.put(session, username);
        if (hostSession == null) hostSession = session;
    }

    public boolean hasBeenVisited() { return hasBeenVisited; }

    public void checkRemoveSession(WebSocketSession session) {
        if (!sessionUserMap.containsKey(session)) return;
        String username = sessionUserMap.remove(session);
        if (session.equals(hostSession)) {
            hostSession = sessionUserMap.isEmpty() ? null : sessionUserMap.keySet().iterator().next();
        }
        String leaveMsg = username + " has left the stream.";
        ChatMessage leftMessage = new MessageBuilder()
                .author(MessageBuilder.SYSTEM_AUTHOR)
                .modifiers(MessageBuilder.SYSTEM_MODIFIERS)
                .colour(roomColour)
                .content(leaveMsg)
                .avatar(MessageBuilder.SYSTEM_AVATAR)
                .partyID(partyID)
                .buildToChatMessage();
        broadcastMessage(leftMessage);
        broadcastUserList();
    }

    public void broadcastUserList() {
        JSONArray users = new JSONArray(getAllUsernames());
        SystemMessage msg = new MessageBuilder()
                .type("user-list-update")
                .data(new JSONObject().put("users", users).put("count", sessionUserMap.size()))
                .buildToSystemMessage();
        broadcastMessage(msg);
    }

    public void broadcastMessage(SystemMessage message) {
        List<WebSocketSession> dead = new ArrayList<>();
        for (WebSocketSession s : sessionUserMap.keySet()) {
            if (s.isOpen()) sendMessage(message.convertToJson(), s);
            else dead.add(s);
        }
        dead.forEach(sessionUserMap::remove);
    }

    public void broadcastMessage(ChatMessage message) {
        List<WebSocketSession> dead = new ArrayList<>();
        for (WebSocketSession s : sessionUserMap.keySet()) {
            if (s.isOpen()) sendMessage(message.convertToJson(), s);
            else dead.add(s);
        }
        dead.forEach(sessionUserMap::remove);
    }

    public void sendMessage(String message, WebSocketSession session) {
        try {
            session.sendMessage(new TextMessage(message));
        } catch (JSONException | IOException e) {
            LOGGER.log(Level.SEVERE, "Error during Gateway Execution: " + e.getMessage());
        }
    }
}
