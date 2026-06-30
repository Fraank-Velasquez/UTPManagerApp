package com.mdw.UTPManagerApp.model;

import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import com.mdw.UTPManagerApp.model.Usuario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Actividad {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idActividad;

    @NotBlank(message = "El titulo es obligatorio")
    @Size(max = 100, message = "max-100-caracteres")
    @Column(nullable = false, length = 100)
    private String titulo;

    private String descripcion;

    @NotNull(message = "La fecha es obligatoria")
    @Column(nullable = false)
    private LocalDate fecha;

    @NotBlank(message = "La prioridad es obligatoria")
    @Column(nullable = false)
    private String prioridad;

    private String estado;

    private boolean esEvento;

    private LocalTime horaInicio;
    private LocalTime horaFin;

    @ManyToOne
    @JoinColumn(name = "idProyecto", nullable = true)
    @JsonBackReference
    private Proyecto proyecto;

    @ManyToOne
    @JoinColumn(name = "idUsuarioPropietario")
    private Usuario propietario;

}
