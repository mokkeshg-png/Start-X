package com.startx;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StartXApplication {

    public static void main(String[] args) {
        // Load .env file into system properties before Spring context initializes.
        // ignoreIfMissing() allows production environments to use real env vars instead.
        // ignoreIfMalformed() prevents startup failure on blank/comment-only lines.
        Dotenv dotenv = Dotenv.configure()
                .directory("./")          // relative to working directory (backend-java/)
                .ignoreIfMissing()        // no .env in production → use OS env vars
                .ignoreIfMalformed()
                .load();

        dotenv.entries().forEach(entry -> {
            // Only set if not already provided by the OS environment (OS takes precedence)
            if (System.getenv(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        });

        SpringApplication.run(StartXApplication.class, args);
    }
}
