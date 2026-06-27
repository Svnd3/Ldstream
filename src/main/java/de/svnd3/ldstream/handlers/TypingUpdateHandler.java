package main.java.de.svnd3.ldstream.handlers;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.WebSocketSession;

import main.java.de.svnd3.ldstream.annotations.Handler;
import main.java.de.svnd3.ldstream.entities.Party;
import main.java.de.svnd3.ldstream.entities.message.MessageBuilder;
import main.java.de.svnd3.ldstream.service.GatewayResponseService;
import main.java.de.svnd3.ldstream.service.PartyService;

@Handler
public class TypingUpdateHandler extends AbstractHandler {

    @Autowired private GatewayResponseService responder;
    @Autowired private PartyService partyService;

    @Override
    public void execute(WebSocketSession session, JSONObject data) {
        String roomID = data.getString("roomID");
        String mode   = data.getString("mode");
        String user   = data.getString("user");

        Party party = partyService.getParty(roomID);
        if (party == null) {
            responder.sendError(session, "Room does not exist", this.getHandlerType());
            return;
        }
        if (!mode.equals("start") && !mode.equals("stop")) {
            responder.sendError(session, "Invalid typing mode", this.getHandlerType());
            return;
        }
        responder.sendSystemMessage(party, new MessageBuilder()
                .type(this.getHandlerType())
                .data(new JSONObject().put("mode", mode).put("user", user))
                .buildToSystemMessage());
    }

    @Override public String  getHandlerType()    { return "typing-update"; }
    @Override public boolean requiresRateLimit() { return false; }
}
