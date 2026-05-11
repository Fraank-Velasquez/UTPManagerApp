package com.mdw.UTPManagerApp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mdw.UTPManagerApp.model.Actividad;
import com.mdw.UTPManagerApp.service.ActividadService;

@RestController
@RequestMapping("/api/actividades")
public class actividadController {

    /* Service para centraliza lectura/escritura de actividades.json. */
    @Autowired
    private ActividadService service;

    /*
     * usado por JS para renderizar inicio, tareas y calendario.
     */
    @GetMapping
    public List<Actividad> listar() throws Exception {
        return service.obtenerTodas();
    }

    /* recibe JSON desde el modal universal. */
    @PostMapping("/guardar")
    public ResponseEntity<?> guardarActividades(@RequestBody Actividad nuevaActivida) {
        try {
            service.guardar(nuevaActivida);
            return ResponseEntity.ok().body("{\"mensaje\": \"Guardado con exito\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al guardar JSON");
        }
    }

    /**
     * Actualiza el estado de una tarea existente
     */
    @PutMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(@PathVariable Long id, @RequestBody ActividadEstadoDto estadoDto) {
        try {
            service.actualizarEstado(id, estadoDto.getEstado());
            return ResponseEntity.ok().body("{\"mensaje\": \"Estado actualizado\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al actualizar estado");
        }
    }

    /**
     * Elimina una tarea por su ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarActividad(@PathVariable Long id) {
        try {
            service.eliminar(id);
            return ResponseEntity.ok().body("{\"mensaje\": \"Tarea eliminada\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al eliminar tarea");
        }
    }

    /**
     * DTO auxiliar para actualizar solo el estado
     */
    public static class ActividadEstadoDto {
        private String estado;

        public String getEstado() {
            return estado;
        }

        public void setEstado(String estado) {
            this.estado = estado;
        }
    }

}
