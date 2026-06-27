package main.java.de.svnd3.ldstream.api.http;

import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.RequestDispatcher;
import javax.servlet.http.HttpServletRequest;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HttpErrorController implements ErrorController {

    private static final Logger LOGGER = Logger.getLogger(HttpErrorController.class.getName());
    private static final String PATH   = "/error";

    @RequestMapping(value = PATH)
    public String error(HttpServletRequest request) {
        Object statusObj = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        String url       = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        String msg       = (String) request.getAttribute(RequestDispatcher.ERROR_MESSAGE);

        int statusCode = statusObj != null ? Integer.parseInt(statusObj.toString()) : 0;
        LOGGER.log(Level.WARNING, "Error " + statusCode + " on '" + url + "' " + msg);
        return formatErrorPage(statusCode);
    }

    @Override
    public String getErrorPath() { return PATH; }

    private String formatErrorPage(int code) {
        return String.format(
                "<html><title>Ldstream Error</title><center>" +
                "<h1>Something went wrong...</h1><hr/>Error: %s" +
                "<br/><img src='/deadcat.gif'/><br/>" +
                "<a href='https://http.cat/%s'>What does this error mean?</a>" +
                "</center></html>",
                code == 0 ? "Unknown" : code,
                code == 0 ? 404 : code);
    }
}
