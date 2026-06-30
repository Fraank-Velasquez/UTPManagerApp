package com.mdw.UTPManagerApp.service;

import com.mdw.UTPManagerApp.model.Proyecto;
import com.mdw.UTPManagerApp.repository.IproyectoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProyectoService {

    @Autowired
    IproyectoRepository proyectosRepository;

    public List<Proyecto> obtenerTodos() {
        return proyectosRepository.findAll();
    }

    public List<Proyecto> obtenerPorPropietario(String username) {
        return proyectosRepository.findByPropietarioUsername(username);
    }

    public Optional<Proyecto> obtenerPorId(Long id) {
        return proyectosRepository.findById(id);
    }

    public void guardar(Proyecto nuevo) {
        proyectosRepository.save(nuevo);
    }

    public void eliminar(Long id) {
        proyectosRepository.deleteById(id);
    }
}
