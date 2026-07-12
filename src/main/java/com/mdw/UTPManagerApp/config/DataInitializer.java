package com.mdw.UTPManagerApp.config;

import java.time.LocalDate;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mdw.UTPManagerApp.model.Actividad;
import com.mdw.UTPManagerApp.model.Proyecto;
import com.mdw.UTPManagerApp.model.Rol;
import com.mdw.UTPManagerApp.model.Usuario;
import com.mdw.UTPManagerApp.repository.IActidadRepository;
import com.mdw.UTPManagerApp.repository.IproyectoRepository;
import com.mdw.UTPManagerApp.repository.RolRepository;
import com.mdw.UTPManagerApp.repository.UsuarioRepository;

@Configuration
public class DataInitializer {

        @Bean
        public CommandLineRunner initData(
                        RolRepository rolRepo,
                        UsuarioRepository userRepo,
                        IproyectoRepository proyectoRepo,
                        IActidadRepository actividadRepo,
                        PasswordEncoder encoder) {

                return args -> {

                        Rol admin = rolRepo.findByNombre("ROLE_ADMIN")
                                        .orElseGet(() -> rolRepo.save(new Rol("ROLE_ADMIN")));

                        Rol user = rolRepo.findByNombre("ROLE_USER")
                                        .orElseGet(() -> rolRepo.save(new Rol("ROLE_USER")));

                        if (!userRepo.existsByUsername("admin")) {
                                userRepo.save(new Usuario("admin", encoder.encode("admin123"), admin));
                                System.out.println("Usuario 'admin' creado");
                        }

                        if (!userRepo.existsByUsername("user")) {
                                userRepo.save(new Usuario("user", encoder.encode("user123"), user));
                                System.out.println("Usuario 'user' creado");
                        }

                        Usuario adminUser = userRepo.findByUsername("admin").get();

                        if (proyectoRepo.findByPropietarioUsername("admin").isEmpty()) {

                                Proyecto p1 = new Proyecto();
                                p1.setNombre("Gestión Académica");
                                p1.setDescripcion(
                                                "Desarrollo de un sistema web para gestionar notas, asistencias y horarios de la facultad de ingeniería.");
                                p1.setFechaLimite(LocalDate.of(2025, 8, 15));
                                p1.setColorIcono("#4f46e5");
                                p1.setTareasTotales(0);
                                p1.setTareasCompletadas(0);
                                p1.setPropietario(adminUser);
                                proyectoRepo.save(p1);

                                Proyecto p2 = new Proyecto();
                                p2.setNombre("Rediseño Portal Web");
                                p2.setDescripcion(
                                                "Modernización del portal institucional con nueva identidad visual y mejora de accesibilidad.");
                                p2.setFechaLimite(LocalDate.of(2025, 9, 30));
                                p2.setColorIcono("#0891b2");
                                p2.setTareasTotales(0);
                                p2.setTareasCompletadas(0);
                                p2.setPropietario(adminUser);
                                proyectoRepo.save(p2);

                                Proyecto p3 = new Proyecto();
                                p3.setNombre("App Móvil de Biblioteca");
                                p3.setDescripcion(
                                                "Aplicación para reserva de libros, consulta de disponibilidad y renovación de préstamos.");
                                p3.setFechaLimite(LocalDate.of(2025, 7, 20));
                                p3.setColorIcono("#dc2626");
                                p3.setTareasTotales(0);
                                p3.setTareasCompletadas(0);
                                p3.setPropietario(adminUser);
                                proyectoRepo.save(p3);

                                Actividad a1 = new Actividad();
                                a1.setTitulo("Diseñar modelo de base de datos");
                                a1.setDescripcion(
                                                "Crear el diagrama entidad-relación para las tablas de estudiantes, cursos y notas.");
                                a1.setFecha(LocalDate.of(2025, 7, 10));
                                a1.setPrioridad("alta");
                                a1.setEstado("completada");
                                a1.setEsEvento(false);
                                a1.setProyecto(p1);
                                a1.setPropietario(adminUser);
                                actividadRepo.save(a1);

                                Actividad a2 = new Actividad();
                                a2.setTitulo("Implementar módulo de autenticación");
                                a2.setDescripcion(
                                                "Desarrollar el sistema de login con Spring Security para los usuarios del sistema académico.");
                                a2.setFecha(LocalDate.of(2025, 7, 25));
                                a2.setPrioridad("alta");
                                a2.setEstado("progreso");
                                a2.setEsEvento(false);
                                a2.setProyecto(p1);
                                a2.setPropietario(adminUser);
                                actividadRepo.save(a2);

                                Actividad a3 = new Actividad();
                                a3.setTitulo("Pruebas de usabilidad con usuarios");
                                a3.setDescripcion(
                                                "Sesiones de prueba con estudiantes y docentes para validar la interfaz del portal rediseñado.");
                                a3.setFecha(LocalDate.of(2025, 9, 10));
                                a3.setPrioridad("media");
                                a3.setEstado("por_hacer");
                                a3.setEsEvento(false);
                                a3.setProyecto(p2);
                                a3.setPropietario(adminUser);
                                actividadRepo.save(a3);

                                Actividad a4 = new Actividad();
                                a4.setTitulo("Reunión de presentación de avances");
                                a4.setDescripcion(
                                                "Presentación del 50% del proyecto ante el comité directivo de la universidad.");
                                a4.setFecha(LocalDate.of(2025, 8, 5));
                                a4.setPrioridad("alta");
                                a4.setEstado("por_hacer");
                                a4.setEsEvento(true);
                                a4.setProyecto(p1);
                                a4.setPropietario(adminUser);
                                actividadRepo.save(a4);

                                System.out.println("Datos de demo creados correctamente");
                        }

                };
        }
}
