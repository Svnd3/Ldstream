package main.java.de.svnd3.ldstream.entities.message;

import org.json.JSONObject;

public class MessageBuilder {

    private String partyID;
    private String author;
    private String colour;
    private String content;
    private String avatar;
    private String messageModifiers;
    private long timestamp;

    private String type;
    private JSONObject data;

    public static final String SYSTEM_AUTHOR = "System";
    public static final String SYSTEM_MODIFIERS = "system";
    public static final String SYSTEM_AVATAR = "default";
    public static final JSONObject EMPTY_JSON = new JSONObject();

    public String getChatMessagePartyID()         { return partyID; }
    public String getChatMessageAuthor()          { return author; }
    public String getChatMessageColour()          { return colour; }
    public String getChatMessageContent()         { return content; }
    public String getChatMessageAvatar()          { return avatar; }
    public String getChatMessageMessageModifiers(){ return messageModifiers; }
    public long   getChatMessageTimestamp()       { return timestamp; }
    public String getSystemMessageType()          { return type; }
    public JSONObject getSystemMessageData()      { return data; }

    public MessageBuilder partyID(String partyID)          { this.partyID = partyID; return this; }
    public MessageBuilder author(String author)             { this.author = author; return this; }
    public MessageBuilder avatar(String avatar)             { this.avatar = avatar; return this; }
    public MessageBuilder colour(String colour)             { this.colour = colour; return this; }
    public MessageBuilder content(String content)           { this.content = content; return this; }
    public MessageBuilder modifiers(String modifiers)       { this.messageModifiers = modifiers; return this; }
    public MessageBuilder timestamp(long timestamp)         { this.timestamp = timestamp; return this; }
    public MessageBuilder type(String type)                 { this.type = type; return this; }
    public MessageBuilder data(JSONObject data)             { this.data = data; return this; }

    public ChatMessage buildToChatMessage()  { return new ChatMessage(this); }
    public SystemMessage buildToSystemMessage() { return new SystemMessage(this); }
}
