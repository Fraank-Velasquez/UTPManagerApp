package com.mdw.UTPManagerApp.service;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.mdw.UTPManagerApp.model.Actividad;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Service
public class ActividadService {

    /* Ruta del archivo JSON. */
    @Value("${ruta.actividades.datos}")
    private String rutaArchivo;
    /* Convierte entre JSON y objetos Java Actividad. */
    private final ObjectMapper mapper = new ObjectMapper();

    /*
     * Lee todas las actividades del archivo.
     * Si el archivo todavia no existe, devuelve una lista vacia para que la UI
     * pueda renderizar.
     */
    public List<Actividad> obtenerTodas() throws Exception {
        File archivo = new File(rutaArchivo);
        if (!archivo.exists())
            return new ArrayList<>();
        List<Actividad> actividades = mapper.readValue(archivo, new TypeReference<List<Actividad>>() {
        });

        actividades.forEach(actividad -> actividad.setEstado(actividad.getEstado()));
        return actividades;

    }

    /*
     * Guarda una actividad nueva.
     * Primero carga la lista completa, agrega el elemento y reescribe el JSON.
     */
    public void guardar(Actividad nueva) throws Exception {
        List<Actividad> lista = obtenerTodas();
        nueva.setId(System.currentTimeMillis());
        nueva.setEstado(nueva.getEstado());
        lista.add(nueva);
        mapper.writeValue(new File(rutaArchivo), lista);
    }

    /**
     * Actualiza el estado de una tarea existente
     */
    public void actualizarEstado(Long id, String nuevoEstado) throws Exception {
        List<Actividad> lista = obtenerTodas();

        for (Actividad actividad : lista) {
            if (actividad.getId().equals(id)) {
                actividad.setEstado(nuevoEstado);
                mapper.writeValue(new File(rutaArchivo), lista);
                return;
            }
        }
        throw new Exception("Tarea no encontrada");
    }

    /**
     * Elimina una tarea de la lista por su ID
     */
    public void eliminar(Long id) throws Exception {
        List<Actividad> lista = obtenerTodas();
        boolean encontrada = lista.removeIf(actividad -> actividad.getId().equals(id));
        if (!encontrada) {
            throw new Exception("Tarea no encontrada");
        }
        mapper.writeValue(new File(rutaArchivo), lista);
    }

}
