package com.mdw.UTPManagerApp.service;

import java.time.LocalDate;
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

    public List<Actividad> obtenerSoloTareas() {
        return actividadRepository.findByEsEventoFalse();
    }

    public List<Actividad> obtenerTareasPorProyecto(long idProyecto) {
        return actividadRepository.findByProyectoIdProyecto(idProyecto);
    }

    public List<Actividad> obtenerSoloEventos() {
        return actividadRepository.findByEsEventoTrue();
    }

    public List<Actividad> obtener5ActividadesRecientes() {
        return actividadRepository.findTop5ByOrderByIdActividadDesc();
    }

    public List<Actividad> obtner5ProximosEventos() {
        return actividadRepository.findTop5ByEsEventoTrueAndFechaIsNotNullOrderByFechaAsc();
    }

    public List<Actividad> obtenerTareasPorEstado(String estado) {
        return actividadRepository.findByEsEventoFalseAndEstado(estado);
    }

    public List<Actividad> obtenerTareasRetrasadas(String estado, LocalDate fecha) {
        return actividadRepository.findByEsEventoFalseAndEstadoNotAndFechaBefore(estado, fecha);
    }

    public List<Actividad> obtenerTareasDeProyectoPorEstado(long idProyecto, String estado) {
        return actividadRepository.findByProyectoIdProyectoAndEsEventoFalseAndEstado(idProyecto, estado);
    }

    public long contarTaresPorEstado(String estado) {
        return actividadRepository.countByEsEventoFalseAndEstado(estado);
    }

    public long contarTareasPorProyecto(long idProyecto) {
        return actividadRepository.countByProyectoIdProyecto(idProyecto);
    }

    public long contarTareasPorEstadoPorProyecto(String estado, long idProyecto) {
        return actividadRepository.countByEstadoAndProyectoIdProyecto(estado, idProyecto);
    }

    public long contarTareasRetrasadas(String estado, LocalDate fecha) {
        return actividadRepository.countByEsEventoFalseAndEstadoNotAndFechaBefore(estado, fecha);
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
