package com.mdw.UTPManagerApp.controller;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Predicate;
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

                LocalDate hoy = LocalDate.now();
                List<Proyecto> proyectos = proyectoService.obtenerTodos();

                List<Actividad> tareas = actividadService.obtenerSoloTareas();
                List<Actividad> eventos = actividadService.obtenerSoloEventos();

                long enProgreso = actividadService.contarTaresPorEstado("progreso");
                long completadas = actividadService.contarTaresPorEstado("completada");
                long retrasadas = actividadService.contarTareasRetrasadas("completada", hoy);

                List<Actividad> recientes = actividadService.obtener5ActividadesRecientes();
                List<Actividad> eventosProximos = actividadService.obtner5ProximosEventos();

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

                LocalDate hoy = LocalDate.now();

                List<Actividad> todasTareas = actividadService.obtenerSoloTareas();

                List<Actividad> tareasPorHacer = actividadService.obtenerTareasPorEstado("por_hacer");

                List<Actividad> tareasEnProgreso = actividadService.obtenerTareasPorEstado("progreso");

                List<Actividad> tareasCompletadas = actividadService.obtenerTareasPorEstado("completada");

                List<Actividad> tareasRetrasadas = actividadService.obtenerTareasRetrasadas("completada", hoy);

                model.addAttribute("todasTareas", todasTareas);
                model.addAttribute("tareasPorHacer", tareasPorHacer);
                model.addAttribute("tareasEnProgreso", tareasEnProgreso);
                model.addAttribute("tareasCompletadas", tareasCompletadas);
                model.addAttribute("tareasRetrasadas", tareasRetrasadas);
                model.addAttribute("moduloActivo", "tareas");
                model.addAttribute("pageTitle", "UTPManager | Tareas");
                return "Modulos/tareas";
        }

        @GetMapping("/proyectos")
        public String proyectos(Model model) throws Exception {

                List<Proyecto> proyectos = proyectoService.obtenerTodos();

                Map<Long, Long> totalTareasPorProyecto = new HashMap<>();
                Map<Long, Long> tareasCompletadasPorProyecto = new HashMap<>();

                for (Proyecto proyecto : proyectos) {

                        long total = actividadService.contarTareasPorProyecto(proyecto.getIdProyecto());

                        long completadas = actividadService.contarTareasPorEstadoPorProyecto("completada",
                                        proyecto.getIdProyecto());

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

                Optional<Proyecto> proyecto = proyectoService.obtenerPorId(id);

                if (proyecto.isEmpty()) {
                        return "redirect:/proyectos";
                }

                Proyecto proyectoEncontrado = proyecto.get();

                List<Actividad> PorHacer = actividadService.obtenerTareasDeProyectoPorEstado(id, "por_hacer");
                List<Actividad> enProgreso = actividadService.obtenerTareasDeProyectoPorEstado(id, "progreso");
                List<Actividad> completadas = actividadService.obtenerTareasDeProyectoPorEstado(id, "completada");

                model.addAttribute("tareasPorHacer", PorHacer);
                model.addAttribute("tareasEnProgreso", enProgreso);
                model.addAttribute("tareasCompletadas", completadas);
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
