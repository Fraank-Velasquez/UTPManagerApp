package com.mdw.UTPManagerApp.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.mdw.UTPManagerApp.model.Actividad;

public interface IActidadRepository extends JpaRepository<Actividad, Long> {
    List<Actividad> findByEsEventoFalse();

    List<Actividad> findByProyectoIdProyecto(long idProyecto);

    List<Actividad> findByEsEventoTrue();

    List<Actividad> findTop5ByOrderByIdActividadDesc();

    List<Actividad> findTop5ByEsEventoTrueAndFechaIsNotNullOrderByFechaAsc();

    List<Actividad> findByEsEventoFalseAndEstado(String estado);

    List<Actividad> findByEsEventoFalseAndEstadoNotAndFechaBefore(String estado, LocalDate fecha);

    List<Actividad> findByProyectoIdProyectoAndEsEventoFalseAndEstado(long idProyecto, String estado);

    long countByEsEventoFalseAndEstado(String estado);

    long countByProyectoIdProyecto(long idProyecto);

    long countByEstadoAndProyectoIdProyecto(String estado, long idProyecto);

    long countByEsEventoFalseAndEstadoNotAndFechaBefore(String estado, LocalDate fecha);

}
