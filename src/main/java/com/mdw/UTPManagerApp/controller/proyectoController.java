package com.mdw.UTPManagerApp.controller;

import java.security.Principal;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mdw.UTPManagerApp.model.Proyecto;
import com.mdw.UTPManagerApp.model.Usuario;
import com.mdw.UTPManagerApp.service.ProyectoService;
import com.mdw.UTPManagerApp.service.UsuarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos")
public class proyectoController {

    @Autowired
    private ProyectoService service;

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    public List<Proyecto> listar(Principal principal) throws Exception {
        return service.obtenerPorPropietario(principal.getName());
    }

    @PostMapping("/guardar")
    public ResponseEntity<?> guardarProyecto(@Valid @RequestBody Proyecto nuevoProyecto, BindingResult result, Principal principal) {
        if (result.hasErrors()) {
            return ResponseEntity.badRequest().body(obtenerErrores(result));
        }

        try {
            Usuario propietario = (Usuario) usuarioService.loadUserByUsername(principal.getName());
            nuevoProyecto.setPropietario(propietario);
            service.guardar(nuevoProyecto);
            return ResponseEntity.ok().body(Map.of("mensaje", "Proyecto guardado con exito"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al guardar proyecto");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarProyecto(@PathVariable Long id, @RequestBody Proyecto proyectoActualizado, Principal principal) {
        try {
            Usuario propietario = (Usuario) usuarioService.loadUserByUsername(principal.getName());
            proyectoActualizado.setIdProyecto(id);
            proyectoActualizado.setPropietario(propietario);
            service.guardar(proyectoActualizado);
            return ResponseEntity.ok().body("{\"mensaje\": \"Proyecto actualizado con exito\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al actualizar proyecto");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarProyecto(@PathVariable Long id) {
        try {
            service.eliminar(id);
            return ResponseEntity.ok().body("{\"mensaje\": \"Proyecto eliminado\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al eliminar proyecto");
        }
    }

    private Map<String, String> obtenerErrores(BindingResult result) {
        Map<String, String> errores = new HashMap<>();

        result.getFieldErrors().forEach(error ->
                errores.put(error.getField(), error.getDefaultMessage())
        );

        return errores;
    }
}
