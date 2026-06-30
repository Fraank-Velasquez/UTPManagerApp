package com.mdw.UTPManagerApp.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.mdw.UTPManagerApp.model.Actividad;

public interface IActidadRepository extends JpaRepository<Actividad, Long> {

    List<Actividad> findByEsEventoFalseAndPropietarioUsername(String username);

    List<Actividad> findByEsEventoTrueAndPropietarioUsername(String username);

    List<Actividad> findTop5ByPropietarioUsernameOrderByIdActividadDesc(String username);

    List<Actividad> findTop5ByEsEventoTrueAndFechaIsNotNullAndPropietarioUsernameOrderByFechaAsc(String username);

    List<Actividad> findByEsEventoFalseAndEstadoAndPropietarioUsername(String estado, String username);

    List<Actividad> findByEsEventoFalseAndEstadoNotAndFechaBeforeAndPropietarioUsername(String estado, LocalDate fecha, String username);

    long countByEsEventoFalseAndEstadoAndPropietarioUsername(String estado, String username);

    long countByEsEventoFalseAndEstadoNotAndFechaBeforeAndPropietarioUsername(String estado, LocalDate fecha, String username);

    List<Actividad> findByProyectoIdProyecto(long idProyecto);
    
    List<Actividad> findByProyectoIdProyectoAndEsEventoFalseAndEstado(long idProyecto, String estado);

    long countByProyectoIdProyecto(long idProyecto);

    long countByEstadoAndProyectoIdProyecto(String estado, long idProyecto);

}
