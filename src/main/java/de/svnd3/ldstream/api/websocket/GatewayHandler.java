package main.java.de.svnd3.ldstream.api.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import main.java.de.svnd3.ldstream.service.MessageHandler;
import main.java.de.svnd3.ldstream.service.PartyService;

@Component
public class GatewayHandler extends AbstractWebSocketHandler {

    @Autowired private MessageHandler messageHandler;
    @Autowired private PartyService partyService;

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        messageHandler.handleMessage(session, message.getPayload());
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {}

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        partyService.removeSessionFromParty(session);
    }
}
