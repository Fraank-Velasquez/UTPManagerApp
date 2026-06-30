package com.mdw.UTPManagerApp.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.mdw.UTPManagerApp.model.Usuario;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Proyecto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idProyecto;

    @NotBlank(message = "El nombre del proyecto es obligatorio")
    @Size(max = 100, message = "El nombre del proyecto no puede superar los 100 caracteres")
    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    @NotNull(message = "La fecha limite es obligatoria")
    private LocalDate fechaLimite;

    @Size(min = 4, max = 9)
    private String colorIcono;

    @Min(value = 0)
    private Integer tareasTotales;

    @Min(value = 0)
    private Integer tareasCompletadas;

    @OneToMany(mappedBy = "proyecto", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Actividad> actividadesProy = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "idUsuarioPropietario")
    private Usuario propietario;

}
