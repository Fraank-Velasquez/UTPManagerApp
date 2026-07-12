package com.mdw.UTPManagerApp.controller;

import java.security.Principal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
import com.mdw.UTPManagerApp.service.UsuarioService;

@Controller
public class homeController {

    @Autowired
    private ActividadService actividadService;

    @Autowired
    private ProyectoService proyectoService;

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/")
    public String raiz() {
        return "redirect:/inicio";
    }

    @GetMapping("/login")
    public String login() {
        return "Modulos/login";
    }

    @GetMapping("/registro")
    public String registroGet() {
        return "Modulos/login";
    }

    @PostMapping("/registro")
    public String registroPost( @RequestParam("username") String username, @RequestParam("password") String password, RedirectAttributes redirectAttrs) {
        boolean exitoso = usuarioService.registrar(username, password, "ROLE_ADMIN");

        if (exitoso) {
            redirectAttrs.addFlashAttribute("registroExitoso", true);
            return "redirect:/login";
        } else {
            redirectAttrs.addFlashAttribute("registroError", true);
            return "redirect:/registro";
        }
    }

    @GetMapping("/inicio")
    public String inicio(Model model, Principal principal) throws Exception {

        String username = principal.getName();
        LocalDate hoy = LocalDate.now();
        List<Proyecto> proyectos = proyectoService.obtenerPorPropietario(username);

        List<Actividad> tareas = actividadService.obtenerSoloTareas(username);
        List<Actividad> eventos = actividadService.obtenerSoloEventos(username);

        long enProgreso = actividadService.contarTaresPorEstado("progreso", username);
        long completadas = actividadService.contarTaresPorEstado("completada", username);
        long retrasadas = actividadService.contarTareasRetrasadas("completada", hoy, username);

        List<Actividad> recientes = actividadService.obtener5ActividadesRecientes(username);
        List<Actividad> eventosProximos = actividadService.obtner5ProximosEventos(username);

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
    public String tareas(Model model, Principal principal) throws Exception {

        String username = principal.getName();
        LocalDate hoy = LocalDate.now();

        List<Actividad> todasTareas = actividadService.obtenerSoloTareas(username);

        List<Actividad> tareasPorHacer = actividadService.obtenerTareasPorEstado("por_hacer", username);

        List<Actividad> tareasEnProgreso = actividadService.obtenerTareasPorEstado("progreso", username);

        List<Actividad> tareasCompletadas = actividadService.obtenerTareasPorEstado("completada", username);

        List<Actividad> tareasRetrasadas = actividadService.obtenerTareasRetrasadas("completada", hoy, username);

        model.addAttribute("todasTareas", todasTareas);
        model.addAttribute( "tareasPorHacer", tareasPorHacer);
        model.addAttribute("tareasEnProgreso", tareasEnProgreso);
        model.addAttribute("tareasCompletadas", tareasCompletadas);
        model.addAttribute("tareasRetrasadas", tareasRetrasadas);
        model.addAttribute("moduloActivo", "tareas");
        model.addAttribute("pageTitle", "UTPManager | Tareas");
        return "Modulos/tareas";
    }

    @GetMapping("/proyectos")
    public String proyectos(Model model, Principal principal) throws Exception {

        String username = principal.getName();
        List<Proyecto> proyectos = proyectoService.obtenerPorPropietario(username);

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
    public String proyectoDetalle(@PathVariable Long id, Model model, Principal principal) throws Exception {

        Optional<Proyecto> proyectoOpt = proyectoService.obtenerPorId(id);

        if (proyectoOpt.isEmpty()) {
            return "redirect:/proyectos";
        }

        Proyecto proyectoEncontrado = proyectoOpt.get();

        if (proyectoEncontrado.getPropietario() == null
                || !proyectoEncontrado.getPropietario().getUsername().equals(principal.getName())) {
            return "redirect:/error/403-redirect";
        }

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
    public String calendario(Model model, Principal principal) throws Exception {
        String username = principal.getName();
        model.addAttribute("eventos", actividadService.obtenerSoloEventos(username));
        model.addAttribute("moduloActivo", "calendario");
        model.addAttribute("pageTitle", "UTPManager | Calendario");
        return "Modulos/calendario";
    }

    @GetMapping("/error/403-redirect")
    public String error403() {
        return "error/403";
    }

}
