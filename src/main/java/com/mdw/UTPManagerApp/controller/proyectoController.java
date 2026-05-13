package com.mdw.UTPManagerApp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mdw.UTPManagerApp.model.Proyecto;
import com.mdw.UTPManagerApp.service.ProyectoService;

@RestController
@RequestMapping("/api/proyectos")
public class proyectoController {

    /* Servicio para leer y escribir en proyectos.json. */
    @Autowired
    private ProyectoService service;

    @GetMapping
    public List<Proyecto> listar() throws Exception {
        return service.obtenerTodos();
    }

    @PostMapping("/guardar")
    public ResponseEntity<?> guardarProyecto(@RequestBody Proyecto nuevoProyecto) {
        try {
            service.guardar(nuevoProyecto);
            return ResponseEntity.ok().body("{\"mensaje\": \"Proyecto guardado con exito\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al guardar proyecto");
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
}
