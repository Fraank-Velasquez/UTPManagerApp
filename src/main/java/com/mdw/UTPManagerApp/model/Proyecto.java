package com.mdw.UTPManagerApp.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Proyecto {

    private Long id;
    private String nombre;
    private String descripcion;
    private String fechaLimite;
    private String colorIcono;

    private Integer tareasTotales;
    private Integer tareasCompletadas;
}
