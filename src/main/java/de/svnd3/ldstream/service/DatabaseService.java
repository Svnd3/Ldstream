package main.java.de.svnd3.ldstream.service;

import java.util.EnumSet;
import java.util.Properties;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.persistence.Entity;

import org.hibernate.SessionFactory;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.cfg.Configuration;
import org.hibernate.cfg.Environment;
import org.hibernate.tool.hbm2ddl.SchemaUpdate;
import org.hibernate.tool.schema.TargetType;
import org.reflections.Reflections;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Service
@EnableTransactionManagement
@org.springframework.context.annotation.Configuration
@Order(1)
public class DatabaseService {

    private static final Logger LOGGER = Logger.getLogger(DatabaseService.class.getName());

    @Autowired private ConfigService configService;

    @Bean("sessionFactory")
    public SessionFactory getSessionFactory() {
        try {
            exportSchema();
            Properties props = getHibernateProperties();
            Configuration cfg = new Configuration();
            getAllEntities().forEach(cfg::addAnnotatedClass);
            cfg.setProperties(props);
            return cfg.buildSessionFactory();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error setting up Hibernate: " + e.getMessage());
            return null;
        }
    }

    private void exportSchema() {
        Properties props = getHibernateProperties();
        MetadataSources sources = new MetadataSources(
                new StandardServiceRegistryBuilder().applySettings(props).build());
        getAllEntities().forEach(sources::addAnnotatedClass);
        new SchemaUpdate().setFormat(true)
                .execute(EnumSet.of(TargetType.DATABASE), sources.buildMetadata());
    }

    private Properties getHibernateProperties() {
        Properties p = new Properties();
        p.put(Environment.DRIVER,  configService.getDriver());
        p.put(Environment.URL,     configService.getConnectionURL());
        p.put(Environment.USER,    configService.getDBUser());
        p.put(Environment.PASS,    configService.getDBPassword());
        p.put(Environment.DIALECT, configService.getHibernateDialect());
        return p;
    }

    private Set<Class<?>> getAllEntities() {
        return new Reflections("main.java.de.svnd3.ldstream").getTypesAnnotatedWith(Entity.class);
    }
}
