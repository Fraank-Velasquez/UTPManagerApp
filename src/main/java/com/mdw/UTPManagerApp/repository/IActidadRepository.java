package com.mdw.UTPManagerApp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mdw.UTPManagerApp.model.Actividad;

import java.util.List;

public interface IActidadRepository extends JpaRepository<Actividad, Long> {
public List<Actividad> findByEsEventoFalse();

}
