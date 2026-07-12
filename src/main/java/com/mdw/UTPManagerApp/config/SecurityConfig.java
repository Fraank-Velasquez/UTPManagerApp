package com.mdw.UTPManagerApp.config;

import com.mdw.UTPManagerApp.service.UsuarioService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        private final UsuarioService usuarioService;
        private final PasswordEncoder passwordEncoder;

        public SecurityConfig(UsuarioService usuarioService, PasswordEncoder passwordEncoder) {
                this.usuarioService = usuarioService;
                this.passwordEncoder = passwordEncoder;
        }

        @Bean
        public DaoAuthenticationProvider authProvider() {
                DaoAuthenticationProvider provider = new DaoAuthenticationProvider(usuarioService);
                provider.setPasswordEncoder(passwordEncoder);
                return provider;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .authenticationProvider(authProvider())
                                .csrf(csrf -> csrf
                                                .ignoringRequestMatchers("/api/**") // Deshabilitamos protección CSRF
                                                                                    // solo para las rutas de la api
                                )
                                // Reglas de acceso
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/CSS/**", "/JS/**", "/resources-media/**").permitAll()
                                                .requestMatchers("/login", "/registro").permitAll()
                                                .anyRequest().authenticated())
                                // Flujo de Login y Errores
                                .formLogin(form -> form
                                                .loginPage("/login")
                                                .loginProcessingUrl("/login")
                                                .defaultSuccessUrl("/inicio", true)
                                                .failureUrl("/login?error")
                                                .permitAll())
                                .logout(logout -> logout
                                                .logoutUrl("/logout")
                                                .logoutSuccessUrl("/login?logout")
                                                .permitAll())
                                .exceptionHandling(ex -> ex
                                                .accessDeniedPage("/error/403-redirect"));

                return http.build();
        }
}
