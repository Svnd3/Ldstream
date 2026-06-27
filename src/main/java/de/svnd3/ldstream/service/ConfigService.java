package main.java.de.svnd3.ldstream.service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ConfigService {

    private static final Logger LOGGER = Logger.getLogger(ConfigService.class.getName());
    private final Properties config = new Properties();
    private boolean loadedSuccessfully;

    public ConfigService() {
        loadedSuccessfully = false;
        File configFile = new File("config.properties");
        if (configFile.exists()) {
            try (FileInputStream fis = new FileInputStream(configFile)) {
                loadedSuccessfully = true;
                config.load(fis);
            } catch (IOException e) {
                LOGGER.log(Level.SEVERE, "Error reading config: " + e.getMessage());
            }
        } else {
            LOGGER.log(Level.SEVERE, "No config.properties found at project root!");
        }
    }

    public boolean configLoaded()        { return loadedSuccessfully; }
    public String  getHibernateDialect() { return config.getProperty("hibernate.Dialect",      "org.hibernate.dialect.H2Dialect"); }
    public String  getDriver()           { return config.getProperty("hibernate.Driver",        "org.h2.Driver"); }
    public String  getDBUser()           { return config.getProperty("hibernate.User",          "sa"); }
    public String  getDBPassword()       { return config.getProperty("hibernate.Password",      "password"); }
    public String  getConnectionURL()    { return config.getProperty("hibernate.ConnectionURL", "jdbc:h2:mem:Ldstream"); }
    public String  getHttpPort()         { return config.getProperty("http.port",               "6969"); }
    public boolean textCacheEnabled()    { return Boolean.parseBoolean(config.getProperty("cache.TextIsEnabled",   "true")); }
    public boolean binaryCacheEnabled()  { return Boolean.parseBoolean(config.getProperty("cache.BinaryIsEnabled", "true")); }
}
