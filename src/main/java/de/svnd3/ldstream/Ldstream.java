package main.java.de.svnd3.ldstream;

import java.util.Properties;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import main.java.de.svnd3.ldstream.service.ConfigService;

@SpringBootApplication
public class Ldstream {

    private static ConfigService configService;

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(Ldstream.class);
        Properties props = new Properties();

        configService = new ConfigService();
        if (configService.configLoaded()) {
            props.put("server.port",                      configService.getHttpPort());
            props.put("server.error.whitelabel.enabled",  false);
            props.put("server.error.path",                "/error");
            props.put("spring.datasource.url",            configService.getConnectionURL());
            props.put("spring.datasource.driverClassName",configService.getDriver());
            props.put("spring.datasource.username",       configService.getDBUser());
            props.put("spring.datasource.password",       configService.getDBPassword());
            props.put("spring.jpa.database-platform",     configService.getHibernateDialect());

            app.setDefaultProperties(props);
            app.run(args);
        }
    }

    @Bean
    public ConfigService getConfigService() { return configService; }
}
