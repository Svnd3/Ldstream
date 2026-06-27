package main.java.de.svnd3.ldstream.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import main.java.de.svnd3.ldstream.handlers.AbstractHandler;

@Service
public class MessageHandler {

    @Autowired private List<AbstractHandler> handlers;
    @Autowired private GatewayResponseService responder;

    private static final String RESPONSE_SOURCE = "Gateway";
    private static final long   RATE_LIMIT_MS   = 500;
    private static final Logger LOGGER = Logger.getLogger(MessageHandler.class.getName());

    private final Map<String, Long> lastMessageTime = new HashMap<>();

    public void handleMessage(WebSocketSession session, String message) {
        try {
            JSONObject msg = new JSONObject(message);
            if (!msg.has("type") || !msg.has("data")) {
                responder.sendError(session, "Invalid message format", RESPONSE_SOURCE);
                return;
            }

            List<AbstractHandler> compatible = handlers.stream()
                    .filter(h -> h.getHandlerType().equals(msg.get("type")))
                    .collect(Collectors.toList());

            if (compatible.isEmpty()) {
                responder.sendError(session, "Unknown message type", RESPONSE_SOURCE);
                return;
            }

            AbstractHandler handler = compatible.get(0);
            if (handler.requiresRateLimit()) {
                String key = session.getId() + ":" + handler.getHandlerType();
                long now = System.currentTimeMillis();
                if (lastMessageTime.containsKey(key) && now - lastMessageTime.get(key) < RATE_LIMIT_MS) {
                    responder.sendError(session, "You are sending messages too fast", RESPONSE_SOURCE);
                    return;
                }
                lastMessageTime.put(key, now);
            }

            LOGGER.log(Level.INFO, "Gateway message: " + msg.getString("type"));
            handler.execute(session, msg.getJSONObject("data"));

        } catch (JSONException e) {
            responder.sendError(session, "Invalid message - " + e.getMessage(), RESPONSE_SOURCE);
            LOGGER.log(Level.SEVERE, "Error during Service Execution: " + e.getMessage());
        }
    }
}
