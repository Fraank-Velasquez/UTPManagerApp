package com.mdw.UTPManagerApp.service;

import com.mdw.UTPManagerApp.model.Proyecto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProyectoService {
    /* Ruta del archivo JSON de proyectos */
    @Value("${ruta.proyectos.datos}")
    private String rutaArchivo;

    /* Mapper para leer y escribir objetos Proyecto como JSON */
    private final ObjectMapper mapper = new ObjectMapper();

    /*
     * Lee todos los proyectos.
     * Si el archivo no existe, se usa una lista vacia para que el modulo no
     * reviente.
     */
    public List<Proyecto> obtenerTodos() throws Exception {
        File archivo = new File(rutaArchivo);
        if (!archivo.exists()) {
            return new ArrayList<>();
        }
        return mapper.readValue(archivo, new TypeReference<List<Proyecto>>() {
        });
    }

    /* Busca un proyecto por ID */
    public Proyecto obtenerPorId(Long id) throws Exception {
        return obtenerTodos().stream()
                .filter(proyecto -> proyecto.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new Exception("Proyecto no encontrado"));
    }

    /*
     * Guarda un proyecto nuevo.
     */
    public void guardar(Proyecto nuevo) throws Exception {
        List<Proyecto> lista = obtenerTodos();
        nuevo.setId(System.currentTimeMillis());
        lista.add(nuevo);
        mapper.writeValue(new File(rutaArchivo), lista);
    }

    /*
     * Elimina un proyecto por ID.
     * no elimina automaticamente tareas asociadas; esas tareas quedan con
     * idProyecto antiguo.
     */
    public void eliminar(Long id) throws Exception {
        List<Proyecto> lista = obtenerTodos();
        boolean eliminado = lista.removeIf(proyecto -> proyecto.getId().equals(id));
        if (!eliminado) {
            throw new Exception("Proyecto no encontrado");
        }
        mapper.writeValue(new File(rutaArchivo), lista);
    }
}
