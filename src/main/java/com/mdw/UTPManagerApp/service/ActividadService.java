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

    public List<Actividad> obtenerSoloTareas(String username) {
        return actividadRepository.findByEsEventoFalseAndPropietarioUsername(username);
    }

    public List<Actividad> obtenerSoloEventos(String username) {
        return actividadRepository.findByEsEventoTrueAndPropietarioUsername(username);
    }

    public List<Actividad> obtener5ActividadesRecientes(String username) {
        return actividadRepository.findTop5ByPropietarioUsernameOrderByIdActividadDesc(username);
    }

    public List<Actividad> obtner5ProximosEventos(String username) {
        return actividadRepository.findTop5ByEsEventoTrueAndFechaIsNotNullAndPropietarioUsernameOrderByFechaAsc(username);
    }

    public List<Actividad> obtenerTareasPorEstado(String estado, String username) {
        return actividadRepository.findByEsEventoFalseAndEstadoAndPropietarioUsername(estado, username);
    }

    public List<Actividad> obtenerTareasRetrasadas(String estado, LocalDate fecha, String username) {
        return actividadRepository.findByEsEventoFalseAndEstadoNotAndFechaBeforeAndPropietarioUsername(estado, fecha, username);
    }

    public long contarTaresPorEstado(String estado, String username) {
        return actividadRepository.countByEsEventoFalseAndEstadoAndPropietarioUsername(estado, username);
    }

    public long contarTareasRetrasadas(String estado, LocalDate fecha, String username) {
        return actividadRepository.countByEsEventoFalseAndEstadoNotAndFechaBeforeAndPropietarioUsername(estado, fecha, username);
    }

    public List<Actividad> obtenerTareasPorProyecto(long idProyecto) {
        return actividadRepository.findByProyectoIdProyecto(idProyecto);
    }

    public List<Actividad> obtenerTareasDeProyectoPorEstado(long idProyecto, String estado) {
        return actividadRepository.findByProyectoIdProyectoAndEsEventoFalseAndEstado(idProyecto, estado);
    }

    public long contarTareasPorProyecto(long idProyecto) {
        return actividadRepository.countByProyectoIdProyecto(idProyecto);
    }

    public long contarTareasPorEstadoPorProyecto(String estado, long idProyecto) {
        return actividadRepository.countByEstadoAndProyectoIdProyecto(estado, idProyecto);
    }

    public void guardar(Actividad nueva) {
        if (nueva.getProyecto() != null && nueva.getProyecto().getIdProyecto() != null) {
            nueva.setProyecto(proyectoRepository.getReferenceById(nueva.getProyecto().getIdProyecto()));
        }
        actividadRepository.save(nueva);
    }

    public void actualizarEstado(Long id, String nuevoEstado) {
        actividadRepository.findById(id).ifPresent(actividad -> {
            actividad.setEstado(nuevoEstado);
            actividadRepository.save(actividad);
        });
    }

    public void eliminar(Long id) throws Exception {
        actividadRepository.deleteById(id);
    }

}
