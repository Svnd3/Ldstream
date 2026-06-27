package main.java.de.svnd3.ldstream.handlers;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.WebSocketSession;

import main.java.de.svnd3.ldstream.annotations.Handler;
import main.java.de.svnd3.ldstream.entities.Party;
import main.java.de.svnd3.ldstream.entities.message.ChatMessage;
import main.java.de.svnd3.ldstream.entities.message.MessageBuilder;
import main.java.de.svnd3.ldstream.service.GatewayResponseService;
import main.java.de.svnd3.ldstream.service.PartyService;

@Handler
public class ChatMessageHandler extends AbstractHandler {

    @Autowired private PartyService partyService;
    @Autowired private GatewayResponseService responder;

    @Override
    public void execute(WebSocketSession session, JSONObject data) {
        String roomID    = data.getString("roomID");
        String content   = data.getString("content").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        String colour    = data.getString("colour");
        String modifiers = data.getString("modifiers");
        String author    = data.getString("author");
        String avatar    = data.getString("avatar");

        Party party = partyService.getParty(roomID);
        if (party == null) {
            responder.sendError(session, "Room does not exist", this.getHandlerType());
            return;
        }
        if (content.length() > 2000) {
            responder.sendError(session, "Message too long (max 2000 characters)", this.getHandlerType());
            return;
        }
        ChatMessage message = new MessageBuilder()
                .partyID(roomID)
                .content(content)
                .colour(colour)
                .modifiers(modifiers)
                .author(author)
                .avatar(avatar)
                .timestamp(System.currentTimeMillis())
                .buildToChatMessage();
        responder.sendChatMessage(party, message);
    }

    @Override public String  getHandlerType()    { return "chat-message"; }
    @Override public boolean requiresRateLimit() { return true; }
}
