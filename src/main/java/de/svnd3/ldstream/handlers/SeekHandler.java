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
public class SeekHandler extends AbstractHandler {

    @Autowired private GatewayResponseService responder;
    @Autowired private PartyService partyService;

    @Override
    public void execute(WebSocketSession session, JSONObject data) {
        String roomID    = data.getString("roomID");
        long   timestamp = data.getLong("timestamp");

        Party party = partyService.getParty(roomID);
        if (party == null) {
            responder.sendError(session, "Room does not exist", this.getHandlerType());
            return;
        }
        if (!party.isHost(session)) {
            responder.sendError(session, "Only the host can seek", this.getHandlerType());
            return;
        }
        responder.sendSystemMessage(party, new MessageBuilder()
                .type(this.getHandlerType())
                .data(new JSONObject().put("timestamp", timestamp))
                .buildToSystemMessage());
    }

    @Override public String  getHandlerType()    { return "seek-video"; }
    @Override public boolean requiresRateLimit() { return false; }
}
