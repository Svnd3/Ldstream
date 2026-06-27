package main.java.de.svnd3.ldstream.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Random;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import main.java.de.svnd3.ldstream.entities.Party;

@Service
public class PartyService {

    private static final List<String> LEXICON =
            Arrays.asList("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""));

    private final HashMap<String, Party> parties = new HashMap<>();

    @Autowired private SessionFactory sessionFactory;

    @EventListener(ApplicationReadyEvent.class)
    private void cleanDatabase() {
        try (Session session = sessionFactory.openSession()) {
            session.getTransaction().begin();
            session.createQuery("DELETE FROM Messages").executeUpdate();
            session.getTransaction().commit();
        }
    }

    public void deletePartyMessageHistory(String partyID) {
        try (Session session = sessionFactory.openSession()) {
            session.getTransaction().begin();
            session.createQuery("DELETE FROM Messages where partyID = :partyID")
                    .setParameter("partyID", partyID)
                    .executeUpdate();
            session.getTransaction().commit();
        }
    }

    public String generateRoomID() {
        Random random = new Random();
        StringBuilder id = new StringBuilder();
        for (int i = 0; i < 8; i++) id.append(LEXICON.get(random.nextInt(LEXICON.size())));
        return id.toString();
    }

    public synchronized Party getParty(String partyID)     { return parties.get(partyID); }
    public synchronized void  saveParty(Party party)        { parties.put(party.getPartyID(), party); }
    public synchronized void  deleteParty(String partyID)  { parties.remove(partyID); }
    public synchronized int   getPartyCount()               { return parties.size(); }

    public synchronized void removeSessionFromParty(WebSocketSession session) {
        List<String> dead = new ArrayList<>();
        for (String key : parties.keySet()) {
            Party party = parties.get(key);
            party.checkRemoveSession(session);
            if (party.getAllSessions().isEmpty() && party.hasBeenVisited()) dead.add(key);
        }
        for (String key : dead) {
            deletePartyMessageHistory(parties.get(key).getPartyID());
            parties.remove(key);
        }
    }
}
