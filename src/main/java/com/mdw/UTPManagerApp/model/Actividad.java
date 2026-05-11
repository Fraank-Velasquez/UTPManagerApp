package com.mdw.UTPManagerApp.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Actividad {
    private Long id;
    private String titulo;
    private String descripcion;
    private String fecha;
    private String prioridad;
    private String estado;
    private Long idProyecto;
    private boolean esEvento;
    private String horaInicio;
    private String horaFin;
}
