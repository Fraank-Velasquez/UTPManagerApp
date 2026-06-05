package com.mdw.UTPManagerApp.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mdw.UTPManagerApp.model.Actividad;
import com.mdw.UTPManagerApp.repository.IActidadRepository;
import com.mdw.UTPManagerApp.repository.IproyectoRepository;

@Service
public class ActividadService {

    @Autowired
    IActidadRepository actividadRepository;

    @Autowired
    IproyectoRepository proyectoRepository;

    public List<Actividad> obtenerTodas() {
        return actividadRepository.findAll();
    }

    public void guardar(Actividad nueva) {
        if (nueva.getProyecto() != null && nueva.getProyecto().getIdProyecto() != null) {
            nueva.setProyecto(proyectoRepository.getReferenceById(nueva.getProyecto().getIdProyecto()));
        }
        actividadRepository.save(nueva);
    }
    public List<Actividad> obtenerTareas(){
        return actividadRepository.findByEsEventoFalse();
    }

    public void actualizarEstado(Long id, String nuevoEstado) {
        List<Actividad> lista = obtenerTodas();

        for (Actividad actividad : lista) {
            if (actividad.getIdActividad().equals(id)) {
                actividad.setEstado(nuevoEstado);
                actividadRepository.save(actividad);
                return;
            }
        }
    }

    public void eliminar(Long id) throws Exception {
        actividadRepository.deleteById(id);
    }

}
