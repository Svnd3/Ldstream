package main.java.de.svnd3.ldstream.handlers;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.WebSocketSession;

import main.java.de.svnd3.ldstream.annotations.Handler;
import main.java.de.svnd3.ldstream.service.GatewayResponseService;

@Handler
public class PingHandler extends AbstractHandler {

    @Autowired private GatewayResponseService responder;

    @Override
    public void execute(WebSocketSession session, JSONObject data) {
        long start = data.getLong("start");
        responder.sendSuccess(session, new JSONObject().put("start", start), getHandlerType());
    }

    @Override public String  getHandlerType()    { return "system-ping"; }
    @Override public boolean requiresRateLimit() { return false; }
}
