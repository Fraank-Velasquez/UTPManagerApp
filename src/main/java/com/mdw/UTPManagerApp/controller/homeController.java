package com.mdw.UTPManagerApp.controller;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.mdw.UTPManagerApp.model.Actividad;
import com.mdw.UTPManagerApp.model.Proyecto;
import com.mdw.UTPManagerApp.service.ActividadService;
import com.mdw.UTPManagerApp.service.ProyectoService;

@Controller
public class homeController {

        @Autowired
        private ActividadService actividadService;

        @Autowired
        private ProyectoService proyectoService;

        @GetMapping({ "/", "/login" })
        public String login() {
                return "Modulos/login";
        }

        @PostMapping("/login")
        public ResponseEntity<Void> loginPost(@RequestParam(name = "nombre-usuario-login") String usuario,
                        @RequestParam(name = "password-usuario-login") String password) {
                if ("admin".equals(usuario) && "admin".equals(password)) {
                        return ResponseEntity.ok().build();
                }
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        @GetMapping("/inicio")
        public String inicio(Model model) throws Exception {

                List<Actividad> actividades = actividadService.obtenerTodas();
                List<Proyecto> proyectos = proyectoService.obtenerTodos();

                LocalDate hoy = LocalDate.now();

                List<Actividad> tareas = actividadService.obtenerTareas();

                List<Actividad> eventos = actividades.stream()
                                .filter(Actividad::isEsEvento).toList();

                long enProgreso = tareas.stream().filter(a -> "progreso".equals(a.getEstado())).count();
                long completadas = tareas.stream().filter(a -> "completada".equals(a.getEstado())).count();
                long retrasadas = tareas.stream()
                                .filter(a -> !"completada".equals(a.getEstado()) && a.getFecha() != null
                                                && a.getFecha().isBefore(hoy))
                                .count();

                List<Actividad> recientes = actividades.stream()
                                .sorted((a, b) -> Long.compare(b.getIdActividad(), a.getIdActividad()))
                                .limit(5).collect(Collectors.toList());

                List<Actividad> eventosProximos = eventos.stream()
                                .filter(e -> e.getFecha() != null)
                                .sorted(Comparator.comparing(Actividad::getFecha))
                                .limit(5).collect(Collectors.toList());

                model.addAttribute("totalTareas", tareas.size());
                model.addAttribute("totalEnProgreso", enProgreso);
                model.addAttribute("totalCompletadas", completadas);
                model.addAttribute("totalRetrasadas", retrasadas);
                model.addAttribute("totalProyectos", proyectos.size());
                model.addAttribute("totalEventos", eventos.size());
                model.addAttribute("actividadReciente", recientes);
                model.addAttribute("eventosProximos", eventosProximos);
                model.addAttribute("proyectos", proyectos);
                model.addAttribute("moduloActivo", "inicio");

                return "Modulos/inicio";
        }

        @GetMapping("/tareas")
        public String tareas(Model model) throws Exception {

                List<Actividad> todasActividades = actividadService.obtenerTodas();
                List<Proyecto> proyectos = proyectoService.obtenerTodos();

                LocalDate hoy = LocalDate.now();

                List<Actividad> todasTareas = todasActividades.stream()
                                .filter(a -> !a.isEsEvento())
                                .collect(Collectors.toList());

                List<Actividad> tareasPorHacer = todasTareas.stream()
                                .filter(a -> "por_hacer".equalsIgnoreCase(a.getEstado())
                                                || a.getEstado() == null)
                                .collect(Collectors.toList());

                List<Actividad> tareasEnProgreso = todasTareas.stream()
                                .filter(a -> "progreso".equalsIgnoreCase(a.getEstado()))
                                .collect(Collectors.toList());

                List<Actividad> tareasCompletadas = todasTareas.stream()
                                .filter(a -> "completada".equalsIgnoreCase(a.getEstado()))
                                .collect(Collectors.toList());

                List<Actividad> tareasRetrasadas = todasTareas.stream()
                                .filter(a -> !"completada".equalsIgnoreCase(a.getEstado())
                                                && a.getFecha() != null
                                                && a.getFecha().isBefore(hoy))
                                .collect(Collectors.toList());

                Map<Long, String> nombresProyectos = new HashMap<>();
                for (Proyecto p : proyectos) {
                        nombresProyectos.put(p.getIdProyecto(), p.getNombre());
                }

                model.addAttribute("todasTareas", todasTareas);
                model.addAttribute("tareasPorHacer", tareasPorHacer);
                model.addAttribute("tareasEnProgreso", tareasEnProgreso);
                model.addAttribute("tareasCompletadas", tareasCompletadas);
                model.addAttribute("tareasRetrasadas", tareasRetrasadas);
                model.addAttribute("nombresProyectos", nombresProyectos);
                model.addAttribute("moduloActivo", "tareas");
                model.addAttribute("pageTitle", "UTPManager | Tareas");
                return "Modulos/tareas";
        }

        @GetMapping("/proyectos")
        public String proyectos(Model model) throws Exception {

                List<Proyecto> proyectos = proyectoService.obtenerTodos();
                List<Actividad> todasActividades = actividadService.obtenerTodas();

                Map<Long, Long> totalTareasPorProyecto = new HashMap<>();
                Map<Long, Long> tareasCompletadasPorProyecto = new HashMap<>();

                for (Proyecto proyecto : proyectos) {

                        long total = todasActividades.stream()
                                        .filter(actividad -> !actividad.isEsEvento()
                                                        && actividad.getProyecto() != null
                                                        && actividad.getProyecto().getIdProyecto()
                                                                        .equals(proyecto.getIdProyecto()))
                                        .count();

                        long completadas = todasActividades.stream()
                                        .filter(actividad -> !actividad.isEsEvento()
                                                        && actividad.getProyecto() != null
                                                        && actividad.getProyecto().getIdProyecto()
                                                                        .equals(proyecto.getIdProyecto())
                                                        && "completada".equals(actividad.getEstado()))
                                        .count();

                        totalTareasPorProyecto.put(proyecto.getIdProyecto(), total);
                        tareasCompletadasPorProyecto.put(proyecto.getIdProyecto(), completadas);
                }

                model.addAttribute("proyectos", proyectos);
                model.addAttribute("totalProyectos", proyectos.size());
                model.addAttribute("totalTareasPorProyecto", totalTareasPorProyecto);
                model.addAttribute("tareasCompletadasPorProyecto", tareasCompletadasPorProyecto);
                model.addAttribute("moduloActivo", "proyectos");
                model.addAttribute("pageTitle", "UTPManager | Proyectos");
                return "Modulos/proyectos";
        }

        @GetMapping("/proyectos/{id}")
        public String proyectoDetalle(@PathVariable Long id, Model model) throws Exception {

                List<Actividad> todas = actividadService.obtenerTodas();
                Optional<Proyecto> proyecto = proyectoService.obtenerPorId(id);

                if (proyecto.isEmpty()) {
                        return "redirect:/proyectos";
                }

                Proyecto proyectoEncontrado = proyecto.get();

                List<Actividad> tareasProyecto = todas.stream()
                                .filter(a -> a.getProyecto() != null && a.getProyecto().getIdProyecto().equals(id))
                                .toList();

                java.util.function.Predicate<Actividad> esPorHacer = a -> {
                        String estado = a.getEstado() == null ? "por_hacer" : a.getEstado().trim().toLowerCase();
                        return "por_hacer".equals(estado);
                };

                java.util.function.Predicate<Actividad> esProgreso = a -> {
                        String estado = a.getEstado() == null ? "por_hacer" : a.getEstado().trim().toLowerCase();
                        return "progreso".equals(estado);
                };

                java.util.function.Predicate<Actividad> esCompletada = a -> {
                        String estado = a.getEstado() == null ? "por_hacer" : a.getEstado().trim().toLowerCase();
                        return "completada".equals(estado);
                };

                model.addAttribute("tareasPorHacer", tareasProyecto.stream()
                                .filter(esPorHacer).collect(Collectors.toList()));
                model.addAttribute("tareasEnProgreso",
                                tareasProyecto.stream().filter(esProgreso).collect(Collectors.toList()));
                model.addAttribute("tareasCompletadas",
                                tareasProyecto.stream().filter(esCompletada).collect(Collectors.toList()));
                model.addAttribute("proyecto", proyectoEncontrado);
                model.addAttribute("proyectoId", id);
                model.addAttribute("moduloActivo", "proyectos");
                model.addAttribute("pageTitle", "UTPManager | " + proyectoEncontrado.getNombre());

                return "fragments/proyecto-detalle";
        }

        @GetMapping("/calendario")
        public String calendario(Model model) throws Exception {

                model.addAttribute("tareas", actividadService.obtenerTodas());
                model.addAttribute("moduloActivo", "calendario");
                model.addAttribute("pageTitle", "UTPManager | Calendario");
                return "Modulos/calendario";
        }

        @GetMapping("/logout")
        public String logout() { 
                return "redirect:/login";
        }

}
