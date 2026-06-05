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

    @Column(nullable = false, length = 100)
    @NotBlank(message = "El titulo es obligatorio")
    @Size(max = 100, message = "max-100-caracteres")
    private String titulo;

    private String descripcion;

    @Column(nullable = false)
    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @Column(nullable = false)
    @NotBlank(message = "La prioridad es obligatoria")
    private String prioridad;

    private String estado;

    private boolean esEvento;

    private LocalTime horaInicio;
    private LocalTime horaFin;

    @ManyToOne
    @JoinColumn(name = "idProyecto", nullable = true)
    @JsonBackReference
    private Proyecto proyecto;

}
