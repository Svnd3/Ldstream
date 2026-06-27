package main.java.de.svnd3.ldstream.handlers;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.WebSocketSession;

import main.java.de.svnd3.ldstream.annotations.Handler;
import main.java.de.svnd3.ldstream.entities.Party;
import main.java.de.svnd3.ldstream.service.GatewayResponseService;
import main.java.de.svnd3.ldstream.service.PartyService;

@Handler
public class CreatePartyHandler extends AbstractHandler {

    @Autowired private GatewayResponseService responder;
    @Autowired private PartyService partyService;

    @Override
    public void execute(WebSocketSession session, JSONObject data) {
        String theme    = data.getString("theme");
        String password = data.optString("password", "");

        Party party = new Party(partyService.generateRoomID(), theme, password);
        partyService.saveParty(party);

        responder.sendSuccess(session, new JSONObject()
                .put("roomID",      party.getPartyID())
                .put("hasPassword", party.hasPassword()), this.getHandlerType());
    }

    @Override public String  getHandlerType()    { return "create-party"; }
    @Override public boolean requiresRateLimit() { return true; }
}
