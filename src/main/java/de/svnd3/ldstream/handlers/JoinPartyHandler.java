package main.java.de.svnd3.ldstream.handlers;

import java.util.List;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.WebSocketSession;

import main.java.de.svnd3.ldstream.annotations.Handler;
import main.java.de.svnd3.ldstream.entities.Party;
import main.java.de.svnd3.ldstream.entities.message.ChatMessage;
import main.java.de.svnd3.ldstream.entities.message.MessageBuilder;
import main.java.de.svnd3.ldstream.service.ChatMessageService;
import main.java.de.svnd3.ldstream.service.GatewayResponseService;
import main.java.de.svnd3.ldstream.service.PartyService;

@Handler
public class JoinPartyHandler extends AbstractHandler {

    @Autowired private GatewayResponseService responder;
    @Autowired private PartyService partyService;
    @Autowired private ChatMessageService messageService;

    @Override
    public void execute(WebSocketSession session, JSONObject data) {
        String roomID   = data.getString("roomID");
        String username = data.getString("username");
        String password = data.optString("password", "");

        Party party = partyService.getParty(roomID);
        if (party == null) {
            responder.sendError(session, "Room does not exist", this.getHandlerType());
            return;
        }
        if (!party.checkPassword(password)) {
            responder.sendError(session, "Incorrect room password", this.getHandlerType());
            return;
        }

        boolean isHost = party.getAllSessions().isEmpty();

        party.addToSessions(session, username);

        responder.sendSuccess(session, new JSONObject()
                .put("theme",  party.getRoomColour())
                .put("isHost", isHost), this.getHandlerType());

        deliverMessageHistory(session, roomID);

        ChatMessage joinMessage = new MessageBuilder()
                .partyID(roomID)
                .author(MessageBuilder.SYSTEM_AUTHOR)
                .colour(party.getRoomColour())
                .content(username + " has joined the stream!")
                .modifiers(MessageBuilder.SYSTEM_MODIFIERS)
                .avatar(MessageBuilder.SYSTEM_AVATAR)
                .buildToChatMessage();
        responder.sendChatMessage(party, joinMessage);
        party.broadcastUserList();
    }

    private void deliverMessageHistory(WebSocketSession session, String roomID) {
        List<ChatMessage> history = messageService.getMessageHistory(roomID);
        responder.sendChatHistory(session, history);
    }

    @Override public String  getHandlerType()    { return "join-party"; }
    @Override public boolean requiresRateLimit() { return true; }
}
