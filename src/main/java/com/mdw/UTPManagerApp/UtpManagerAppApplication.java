package com.mdw.UTPManagerApp;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class UtpManagerAppApplication implements CommandLineRunner {
    public static void main(String[] args) {
        SpringApplication.run(UtpManagerAppApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Aplicacion iniciada correctamente");
    }
}
