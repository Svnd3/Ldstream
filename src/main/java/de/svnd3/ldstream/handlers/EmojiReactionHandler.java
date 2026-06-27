package main.java.de.svnd3.ldstream.handlers;

import java.util.Set;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.WebSocketSession;

import main.java.de.svnd3.ldstream.annotations.Handler;
import main.java.de.svnd3.ldstream.entities.Party;
import main.java.de.svnd3.ldstream.entities.message.MessageBuilder;
import main.java.de.svnd3.ldstream.service.GatewayResponseService;
import main.java.de.svnd3.ldstream.service.PartyService;

@Handler
public class EmojiReactionHandler extends AbstractHandler {

    private static final Set<String> ALLOWED_EMOJIS = Set.of("👍","❤️","😂","😮","😢","😡","🔥","👏","🎉","💀");

    @Autowired private GatewayResponseService responder;
    @Autowired private PartyService partyService;

    @Override
    public void execute(WebSocketSession session, JSONObject data) {
        String roomID = data.getString("roomID");
        String emoji  = data.getString("emoji");

        if (!ALLOWED_EMOJIS.contains(emoji)) {
            responder.sendError(session, "Invalid emoji", this.getHandlerType());
            return;
        }
        Party party = partyService.getParty(roomID);
        if (party == null) {
            responder.sendError(session, "Room does not exist", this.getHandlerType());
            return;
        }
        responder.sendSystemMessage(party, new MessageBuilder()
                .type(this.getHandlerType())
                .data(new JSONObject().put("emoji", emoji))
                .buildToSystemMessage());
    }

    @Override public String  getHandlerType()    { return "emoji-reaction"; }
    @Override public boolean requiresRateLimit() { return true; }
}
