let terminoBusquedaTareas = '';
let filtroPrioridadTareas = '';

async function iniciarModuloTareas() {
    if (typeof cargarDatosDesdeServidor === 'function') {
        await cargarDatosDesdeServidor();
    }
    if (typeof cargarProyectosResumenDesdeServidor === 'function') {
        await cargarProyectosResumenDesdeServidor();
    }

    enlazarControlesTareas();
    enlazarEventosTareas();
}

function aplicarFiltrosTareas() {
    const termino = normalizarTextoBusqueda(terminoBusquedaTareas);
    const prioridad = filtroPrioridadTareas;

    document.querySelectorAll('.tablero-grid-tarea').forEach(col => {
        const textoTarjeta = normalizarTextoBusqueda(col.dataset.texto || '');
        const prioridadTarjeta = normalizarPrioridad(col.dataset.prioridad || '');

        const coincideTexto = !termino || textoTarjeta.includes(termino);
        const coincidePrioridad = !prioridad || prioridadTarjeta === prioridad;

        col.classList.toggle('d-none', !(coincideTexto && coincidePrioridad));
    });

    actualizarContadoresDesdeDOM();
}

function actualizarContadoresDesdeDOM() {
    const mapeo = {
        'lista-tareas-todas': 'contador-todas',
        'lista-tareas-hacer': 'contador-hacer',
        'lista-tareas-progreso': 'contador-progreso',
        'lista-tareas-completadas': 'contador-completadas',
        'lista-tareas-retrasadas': 'contador-retrasadas'
    };

    Object.entries(mapeo).forEach(([idLista, idContador]) => {
        const lista = document.getElementById(idLista);
        const contador = document.getElementById(idContador);
        if (!lista || !contador) return;

        const visibles = lista.querySelectorAll('.tablero-grid-tarea:not(.d-none)').length;
        contador.textContent = visibles;
    });
}

function enlazarControlesTareas() {
    const buscador = document.getElementById('buscadorTareas');
    if (buscador && !buscador.dataset.enlazado) {
        buscador.dataset.enlazado = 'true';
        buscador.addEventListener('input', event => {
            terminoBusquedaTareas = event.target.value;
            aplicarFiltrosTareas();
        });
    }

    document.querySelectorAll('.filtro-prioridad-opcion').forEach(boton => {
        if (boton.dataset.enlazado === 'true') return;
        boton.dataset.enlazado = 'true';
        boton.addEventListener('click', () => {
            filtroPrioridadTareas = boton.dataset.prioridad || '';
            const btnFiltro = document.getElementById('btnFiltroPrioridad');
            if (btnFiltro) {
                btnFiltro.innerHTML = `<i class="bi bi-sliders text-muted"></i> ${boton.textContent.trim() || 'Filtrar'}`;
            }
            aplicarFiltrosTareas();
        });
    });
}

function enlazarEventosTareas() {
    document.querySelectorAll('.boton-cambiar-estado').forEach(boton => {
        boton.addEventListener('click', manejarCambioEstado);
    });

    document.querySelectorAll('.boton-eliminar-tarea').forEach(boton => {
        boton.addEventListener('click', EliminarTarea);
    });
}

async function manejarCambioEstado(event) {
    event.preventDefault();

    const idTarea = this.getAttribute('data-tarea-id');
    const estadoActualDOM = this.getAttribute('data-estado-actual');

    const tarea = (datosGlobalesActividades || []).find(a => String(a.idActividad) === String(idTarea));
    const estadoActual = normalizarEstado(tarea?.estado ?? estadoActualDOM);

    if (estadoActual === 'completada') {
        const titulo = tarea?.titulo || 'esta tarea';
        mostrarModalReactivarTarea(idTarea, titulo);
        return;
    }

    const nuevoEstado = estadoActual === 'por_hacer' ? 'progreso' : 'completada';
    mostrarModalCambiarEstado(idTarea, estadoActual, nuevoEstado);
}

function mostrarModalCambiarEstado(idTarea, estadoActual, nuevoEstado) {
    const modalElement = document.getElementById('modalCambiarEstado');
    const tituloNodo = document.getElementById('modalCambiarEstadoTitulo');
    const mensajeNodo = document.getElementById('modalCambiarEstadoMensaje');
    const iconoContenedor = document.getElementById('modalCambiarEstadoIconoContenedor');
    const iconoNodo = document.getElementById('modalCambiarEstadoIcono');
    const botonNodo = document.getElementById('modalCambiarEstadoBoton');

    if (!modalElement || !botonNodo) return;

    if (nuevoEstado === 'progreso') {
        tituloNodo.textContent = 'Iniciar tarea';
        mensajeNodo.textContent = '¿Deseas marcar esta tarea como "En progreso"?';
        iconoContenedor.className = 'mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 modal-icon-large';
        iconoNodo.className = 'bi bi-hourglass-split text-primary fs-1';
        botonNodo.className = 'btn btn-primary rounded-pill px-4 fw-bold text-white';
        botonNodo.textContent = 'Iniciar';
    } else {
        tituloNodo.textContent = 'Completar tarea';
        mensajeNodo.textContent = '¿Deseas marcar esta tarea como completada?';
        iconoContenedor.className = 'mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 modal-icon-large';
        iconoNodo.className = 'bi bi-check-circle-fill text-success fs-1';
        botonNodo.className = 'btn btn-success rounded-pill px-4 fw-bold text-white';
        botonNodo.textContent = 'Completar';
    }

    botonNodo.onclick = null;
    botonNodo.onclick = async () => {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
        await actualizarEstadoTarea(idTarea, nuevoEstado);
    };

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}

async function EliminarTarea(event) {
    event.preventDefault();

    const idTarea = this.getAttribute('data-tarea-id');

    mostrarModalConfirmacionAccion(
        'Eliminar tarea',
        '¿Deseas eliminar esta tarea? Esta acción no se puede deshacer.',
        'Eliminar',
        async () => {
            try {
                const respuesta = await fetch(`/api/actividades/${idTarea}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!respuesta.ok) throw new Error('Error al eliminar');

                if (moduloActivo === 'proyectos' && typeof proyectoActivo !== 'undefined' && proyectoActivo !== null) {
                    eliminarTarjetaProyectoDePantalla(idTarea);
                } else {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Error al eliminar tarea:', error);
            }
        }
    );
}

async function actualizarEstadoTarea(idTarea, nuevoEstado) {
    try {
        const respuesta = await fetch(`/api/actividades/${idTarea}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!respuesta.ok) throw new Error('Error al actualizar estado');

        if (moduloActivo === 'proyectos' && typeof proyectoActivo !== 'undefined' && proyectoActivo !== null) {
            const tarea = datosGlobalesActividades.find(a => a.idActividad === parseInt(idTarea));
            if (tarea) tarea.estado = nuevoEstado;
            actualizarTarjetaProyectoEnPantalla(idTarea, nuevoEstado);
        } else {
            window.location.reload();
        }
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        alert('No se pudo actualizar el estado de la tarea');
    }
}

function mostrarModalReactivarTarea(idTarea, titulo) {
    const modalElement = document.getElementById('modalReactivarTarea');
    const tituloNodo = document.getElementById('tituloReactivacion');
    const botonConfirmar = document.getElementById('btnConfirmarReactivar');

    if (!modalElement || !tituloNodo || !botonConfirmar) {
        console.error('Modal de reactivación no encontrado');
        return;
    }

    tituloNodo.textContent = `¿Reactivar "${titulo}"?`;

    botonConfirmar.onclick = null;
    botonConfirmar.onclick = async () => {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
        await actualizarEstadoTarea(idTarea, 'por_hacer');
    };

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}

function actualizarTarjetaProyectoEnPantalla(idTarea, nuevoEstado) {
    const tarjeta = document.querySelector(`article.tarjeta-tarea[data-tarea-id="${idTarea}"]`);
    if (!tarjeta) return;

    const contenedorDestino = obtenerContenedorProyectoPorEstado(nuevoEstado);
    if (!contenedorDestino) return;

    limpiarEstadoVacioProyecto(contenedorDestino);

    const envoltorio = tarjeta.parentElement;
    contenedorDestino.appendChild(envoltorio);

    tarjeta.dataset.estadoActual = nuevoEstado;
    tarjeta.classList.toggle('tarjeta-tarea-completada', nuevoEstado === 'completada');

    const botonEstado = tarjeta.querySelector('.boton-cambiar-estado');
    const indicadorEstado = tarjeta.querySelector('.kanban-state-dot');
    const iconoEstado = indicadorEstado?.querySelector('i');
    const etiquetaEstado = tarjeta.querySelector('.etiqueta-estado-tarea');

    if (botonEstado) {
        botonEstado.dataset.estadoActual = nuevoEstado;
        botonEstado.title = obtenerTituloBotonEstadoProyecto(nuevoEstado);
        botonEstado.setAttribute('aria-label', obtenerTituloBotonEstadoProyecto(nuevoEstado));
    }

    if (indicadorEstado) {
        indicadorEstado.className = `kanban-state-dot ${obtenerClaseIndicadorProyecto(nuevoEstado)}`;
    }

    if (iconoEstado) {
        iconoEstado.className = `bi ${obtenerIconoEstadoProyecto(nuevoEstado)}`;
    }

    if (etiquetaEstado) {
        etiquetaEstado.className = `badge etiqueta-reducida rounded-pill px-2 py-1 etiqueta-estado-tarea ${obtenerClaseEtiquetaEstadoProyecto(nuevoEstado)}`;
        etiquetaEstado.textContent = obtenerEtiquetaEstado(nuevoEstado);
    }

    actualizarEstadosVaciosProyecto();
    actualizarContadoresProyecto();
}

function eliminarTarjetaProyectoDePantalla(idTarea) {
    const tarjeta = document.querySelector(`article.tarjeta-tarea[data-tarea-id="${idTarea}"]`);
    if (!tarjeta) return;

    const envoltorio = tarjeta.parentElement;
    envoltorio.remove();

    datosGlobalesActividades = datosGlobalesActividades.filter(a => a.idActividad !== parseInt(idTarea));
    actualizarEstadosVaciosProyecto();
    actualizarContadoresProyecto();
}

function obtenerContenedorProyectoPorEstado(estado) {
    const estadoNormalizado = normalizarEstado(estado);
    if (estadoNormalizado === 'progreso') return document.getElementById('contenedor-proyecto-en-progreso');
    if (estadoNormalizado === 'completada') return document.getElementById('contenedor-proyecto-terminadas');
    return document.getElementById('contenedor-proyecto-por-hacer');
}

function limpiarEstadoVacioProyecto(contenedor) {
    contenedor.querySelector('.kanban-empty-state')?.remove();
}

function actualizarEstadosVaciosProyecto() {
    agregarEstadoVacioProyecto('contenedor-proyecto-por-hacer', 'No hay tareas por hacer', 'Agrega una nueva tarea para comenzar.');
    agregarEstadoVacioProyecto('contenedor-proyecto-en-progreso', 'No hay tareas en progreso', 'Las tareas activas aparecerán aquí.');
    agregarEstadoVacioProyecto('contenedor-proyecto-terminadas', 'No hay tareas terminadas', 'Cuando completes tareas se verán aquí.');
}

function agregarEstadoVacioProyecto(idContenedor, titulo, descripcion) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    const tieneTarjetas = contenedor.querySelector('article.tarjeta-tarea');
    const estadoVacio = contenedor.querySelector('.kanban-empty-state');

    if (tieneTarjetas) {
        estadoVacio?.remove();
        return;
    }

    if (!estadoVacio) {
        contenedor.insertAdjacentHTML('afterbegin', `
            <div class="kanban-empty-state">
                <div class="fw-semibold mb-1">${titulo}</div>
                <div class="small text-muted">${descripcion}</div>
            </div>
        `);
    }
}

function actualizarContadoresProyecto() {
    actualizarContadorColumnaProyecto('contenedor-proyecto-por-hacer');
    actualizarContadorColumnaProyecto('contenedor-proyecto-en-progreso');
    actualizarContadorColumnaProyecto('contenedor-proyecto-terminadas');
}

function actualizarContadorColumnaProyecto(idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    const columna = contenedor?.closest('.kanban-column-proyecto');
    const contador = columna?.querySelector('.kanban-column-head .badge');
    if (contador) contador.textContent = contenedor.querySelectorAll('article.tarjeta-tarea').length;
}

function normalizarEstado(estado) {
    return (estado || 'por_hacer').toString().trim().toLowerCase();
}

function normalizarTextoBusqueda(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function normalizarPrioridad(prioridad) {
    const valor = (prioridad || 'flexible').toString().trim().toLowerCase();
    if (valor === 'alta' || valor === 'urgente') return 'urgente';
    if (valor === 'media' || valor === 'importante') return 'importante';
    return 'flexible';
}

function obtenerEtiquetaEstado(estado) {
    if (estado === 'progreso') return 'En progreso';
    if (estado === 'completada') return 'Completada';
    return 'Por hacer';
}

function obtenerTituloBotonEstadoProyecto(estado) {
    const estadoNormalizado = normalizarEstado(estado);
    if (estadoNormalizado === 'progreso') return 'Cambiar a Completada';
    if (estadoNormalizado === 'completada') return 'Reactivar tarea';
    return 'Cambiar a En progreso';
}

function obtenerClaseIndicadorProyecto(estado) {
    const estadoNormalizado = normalizarEstado(estado);
    if (estadoNormalizado === 'progreso') return 'kanban-state-progreso';
    if (estadoNormalizado === 'completada') return 'kanban-state-completada';
    return 'kanban-state-por-hacer';
}

function obtenerIconoEstadoProyecto(estado) {
    const estadoNormalizado = normalizarEstado(estado);
    if (estadoNormalizado === 'progreso') return 'bi-hourglass-split';
    if (estadoNormalizado === 'completada') return 'bi-check-lg';
    return 'bi-play-fill';
}

function obtenerClaseEtiquetaEstadoProyecto(estado) {
    const estadoNormalizado = normalizarEstado(estado);
    if (estadoNormalizado === 'progreso') return 'etiqueta-estado-progreso';
    if (estadoNormalizado === 'completada') return 'etiqueta-estado-terminada';
    return 'etiqueta-estado-pendiente';
}
