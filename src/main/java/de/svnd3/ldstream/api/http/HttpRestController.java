package main.java.de.svnd3.ldstream.api.http;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import main.java.de.svnd3.ldstream.service.FileReader;

@RestController
public class HttpRestController {

    @Autowired private ApplicationContext context;
    @Autowired private FileReader fileReader;

    @RequestMapping(value = "/", produces = "text/html", method = RequestMethod.GET)
    public String indexRoute() { return fileReader.getTextFileContents("html/index.html"); }

    @RequestMapping(value = "/style.css", produces = "text/css", method = RequestMethod.GET)
    public String styleRoute() { return fileReader.getTextFileContents("css/style.css"); }

    @RequestMapping(value = "/ldstream.js", produces = "application/javascript", method = RequestMethod.GET)
    public String jsRoute() { return fileReader.getTextFileContents("js/ldstream.js"); }

    @RequestMapping(value = "/deadcat.gif", produces = "image/gif", method = RequestMethod.GET)
    public byte[] catGifRoute() { return fileReader.getBinaryFileContents("img/deadcat.gif"); }

    @RequestMapping(value = "/favicon.png", produces = "image/png", method = RequestMethod.GET)
    public byte[] faviconRoute() { return fileReader.getBinaryFileContents("img/favicon.png"); }

    @RequestMapping(value = "/favicon.ico", produces = "image/png", method = RequestMethod.GET)
    public byte[] faviconIcoRoute() { return fileReader.getBinaryFileContents("img/favicon.png"); }

    @RequestMapping(value = "/github.png", produces = "image/png", method = RequestMethod.GET)
    public byte[] githubRoute() { return fileReader.getBinaryFileContents("img/logos/github.png"); }

    @RequestMapping(value = "/chrome.png", produces = "image/png", method = RequestMethod.GET)
    public byte[] chromeRoute() { return fileReader.getBinaryFileContents("img/logos/chrome.png"); }

    @RequestMapping(value = "/avatar/{image}", produces = "image/png", method = RequestMethod.GET)
    public byte[] avatarRoute(@PathVariable String image) {
        return fileReader.getBinaryFileContents("/img/avatars/" + image + ".png");
    }

    @RequestMapping(value = "/status", produces = "text/html", method = RequestMethod.GET)
    public String statsRoute() {
        Set<Thread> threads = Thread.getAllStackTraces().keySet();
        List<String> names = new ArrayList<>();
        threads.forEach(t -> names.add(t.getName()));
        return "Threads: " + Thread.activeCount()
                + "<br>" + String.join("<br>", names)
                + "<br><br>Beans: " + context.getBeanDefinitionCount();
    }
}
