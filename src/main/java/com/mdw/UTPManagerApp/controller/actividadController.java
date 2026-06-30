package com.mdw.UTPManagerApp.controller;

import java.security.Principal;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mdw.UTPManagerApp.model.Actividad;
import com.mdw.UTPManagerApp.model.Usuario;
import com.mdw.UTPManagerApp.service.ActividadService;
import com.mdw.UTPManagerApp.service.UsuarioService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "http://127.0.0.1:5500")
@RestController
@RequestMapping("/api/actividades")
public class actividadController {

    @Autowired
    private ActividadService service;

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    public List<Actividad> listar(Principal principal) throws Exception {
        return service.obtenerSoloTareas(principal.getName());
    }

    @PostMapping("/guardar")
    public ResponseEntity<?> guardarActividades(@Valid @RequestBody Actividad nuevaActivida, BindingResult result, Principal principal) {
        if (result.hasErrors()) {
            return ResponseEntity.badRequest().body(obtenerErrores(result));
        }

        try {
            Usuario propietario = (Usuario) usuarioService.loadUserByUsername(principal.getName());
            nuevaActivida.setPropietario(propietario);
            service.guardar(nuevaActivida);
            return ResponseEntity.ok().body(Map.of("mensaje", "Guardado con exito"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al guardar JSON");
        }
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(@PathVariable Long id, @RequestBody ActividadEstadoDto estadoDto) {
        try {
            service.actualizarEstado(id, estadoDto.getEstado());
            return ResponseEntity.ok().body("{\"mensaje\": \"Estado actualizado\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al actualizar estado");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarActividad(@PathVariable Long id) {
        try {
            service.eliminar(id);
            return ResponseEntity.ok().body("{\"mensaje\": \"Tarea eliminada\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al eliminar tarea");
        }
    }

    private Map<String, String> obtenerErrores(BindingResult result) {
        Map<String, String> errores = new HashMap<>();

        result.getFieldErrors().forEach(error ->
                errores.put(error.getField(), error.getDefaultMessage())
        );

        return errores;
    }

    @Setter
    @Getter
    public static class ActividadEstadoDto {
        private String estado;

    }

}
