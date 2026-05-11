package com.mdw.UTPManagerApp.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.mdw.UTPManagerApp.model.Actividad;
import com.mdw.UTPManagerApp.model.Proyecto;
import com.mdw.UTPManagerApp.service.ActividadService;
import com.mdw.UTPManagerApp.service.ProyectoService;

import jakarta.servlet.http.HttpSession;

@Controller
public class homeController {

    /* Service para cargar tareas/eventos desde actividades.json. */
    @Autowired
    private ActividadService actividadService;

    /* Service para cargar proyectos desde proyectos.json. */
    @Autowired
    private ProyectoService proyectoService;

    /* Redirige al inicio si ya hay sesión. */
    @GetMapping("/login")
    public String login(HttpSession session) {
        if (session.getAttribute("usuario") != null) {
            return "redirect:/inicio";
        }
        return "Modulos/login";
    }

    /* Valida credenciales y crea la sesión. */
    @PostMapping("/login")
    public String loginPost(@RequestParam(name = "nombre-usuario-login") String usuario,
            @RequestParam(name = "password-usuario-login") String password,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        if ("admin".equals(usuario) && "admin".equals(password)) {
            session.setAttribute("usuario", "admin");
            return "redirect:/inicio";
        }
        redirectAttributes.addFlashAttribute("error", "Credenciales inválidas");
        return "redirect:/login";
    }

    @GetMapping({ "/", "/inicio" })
    public String inicio(Model model/* , HttpSession session, RedirectAttributes redirectAttributes */)
            throws Exception {
        /* Bloquea acceso sin sesión. */
        /*
         * if (session.getAttribute("usuario") == null) {
         * redirectAttributes.addFlashAttribute("msg", "Debe iniciar sesión");
         * return "redirect:/login";
         * }
         */

        List<Actividad> tareas = actividadService.obtenerTodas();
        List<Proyecto> proyectos = proyectoService.obtenerTodos();

        model.addAttribute("tareas", tareas);
        model.addAttribute("proyectos", proyectos);
        model.addAttribute("moduloActivo", "inicio");
        model.addAttribute("pageTitle", "UTPManager");
        return "Modulos/inicio";
    }

    @GetMapping("/tareas")
    public String tareas(Model model/* , HttpSession session, RedirectAttributes redirectAttributes */)
            throws Exception {

        /*
         * if (session.getAttribute("usuario") == null) {
         * redirectAttributes.addFlashAttribute("msg", "Debe iniciar sesión");
         * return "redirect:/login";
         * }
         */

        model.addAttribute("tareas", actividadService.obtenerTodas());
        model.addAttribute("moduloActivo", "tareas");
        model.addAttribute("pageTitle", "UTPManager | Tareas");
        return "Modulos/tareas";
    }

    @GetMapping("/proyectos")
    public String proyectos(Model model/* , HttpSession session, RedirectAttributes redirectAttributes */)
            throws Exception {
        /*
         * if (session.getAttribute("usuario") == null) {
         * redirectAttributes.addFlashAttribute("msg", "Debe iniciar sesión");
         * return "redirect:/login";
         * }
         */

        List<Proyecto> proyectos = proyectoService.obtenerTodos();
        List<Actividad> todasActividades = actividadService.obtenerTodas();

        Map<Long, Long> totalTareasPorProyecto = new HashMap<>();
        Map<Long, Long> tareasCompletadasPorProyecto = new HashMap<>();

        for (Proyecto proyecto : proyectos) {

            long total = todasActividades.stream()
                    .filter(actividad -> !Boolean.TRUE.equals(actividad.isEsEvento())
                            && actividad.getIdProyecto() != null
                            && actividad.getIdProyecto().equals(proyecto.getId()))
                    .count();

            long completadas = todasActividades.stream()
                    .filter(actividad -> !Boolean.TRUE.equals(actividad.isEsEvento())
                            && actividad.getIdProyecto() != null
                            && actividad.getIdProyecto().equals(proyecto.getId())
                            && "completada".equals(actividad.getEstado()))
                    .count();

            totalTareasPorProyecto.put(proyecto.getId(), total);
            tareasCompletadasPorProyecto.put(proyecto.getId(), completadas);
        }

        model.addAttribute("proyectos", proyectos);
        model.addAttribute("totalTareasPorProyecto", totalTareasPorProyecto);
        model.addAttribute("tareasCompletadasPorProyecto", tareasCompletadasPorProyecto);
        model.addAttribute("moduloActivo", "proyectos");
        model.addAttribute("pageTitle", "UTPManager | Proyectos");
        return "Modulos/proyectos";
    }

    @GetMapping("/proyectos/{id}")
    public String proyectoDetalle(@PathVariable Long id, Model model/*
                                                                     * , HttpSession session,
                                                                     * RedirectAttributes redirectAttributes
                                                                     */) throws Exception {
        /*
         * if (session.getAttribute("usuario") == null) {
         * redirectAttributes.addFlashAttribute("msg", "Debe iniciar sesión");
         * return "redirect:/login";
         * }
         */

        List<Actividad> todas = actividadService.obtenerTodas();
        Proyecto proyecto = proyectoService.obtenerPorId(id);
        /* Filtra solo tareas relacionadas con el proyecto de la URL. */
        List<Actividad> tareasProyecto = todas.stream()
                .filter(a -> a.getIdProyecto() != null && a.getIdProyecto().equals(id))
                .collect(Collectors.toList());

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
        model.addAttribute("proyecto", proyecto);
        model.addAttribute("proyectoId", id);
        model.addAttribute("moduloActivo", "proyectos");
        model.addAttribute("pageTitle", "UTPManager | " + proyecto.getNombre());
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
    public String logout(HttpSession session) {
        /* Invalida la sesion para que las rutas protegidas vuelvan a /login. */
        session.invalidate();
        return "redirect:/login";
    }

}
