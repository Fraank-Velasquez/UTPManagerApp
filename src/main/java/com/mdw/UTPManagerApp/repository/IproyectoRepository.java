package com.mdw.UTPManagerApp.repository;

import com.mdw.UTPManagerApp.model.Proyecto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IproyectoRepository extends JpaRepository<Proyecto,Long> {
    java.util.List<Proyecto> findByPropietarioUsername(String username);
}
