
let terminoBusquedaTareas = '';
let filtroPrioridadTareas = '';

/**
 * Inicializa el módulo de tareas: carga datos, renderizar por estado y enlazar eventos
 */
async function iniciarModuloTareas() {
    await cargarDatosDesdeServidor();
    if (typeof cargarProyectosResumenDesdeServidor === 'function') {
        await cargarProyectosResumenDesdeServidor();
    }

    renderizarModuloTareas();
    enlazarControlesTareas();
}

function renderizarModuloTareas() {
    const tareasBase = (datosGlobalesActividades || []).filter(act => act.esEvento === false);
    const termino = normalizarTextoBusqueda(terminoBusquedaTareas);

    const tareas = tareasBase.filter(tarea => {
        if (filtroPrioridadTareas && normalizarPrioridad(tarea.prioridad) !== filtroPrioridadTareas) {
            return false;
        }

        if (!termino) return true;

        const textoBusqueda = normalizarTextoBusqueda([
            tarea.titulo,
            tarea.descripcion,
            obtenerNombreProyectoTarea(tarea),
            obtenerEtiquetaEstado(normalizarEstado(tarea.estado)),
            obtenerEtiquetaPrioridad(normalizarPrioridad(tarea.prioridad))
        ].join(' '));

        return textoBusqueda.includes(termino);
    });

    const contenedores = {
        todas: document.getElementById('lista-tareas-todas'),
        hacer: document.getElementById('lista-tareas-hacer'),
        progreso: document.getElementById('lista-tareas-progreso'),
        completadas: document.getElementById('lista-tareas-completadas'),
        retrasadas: document.getElementById('lista-tareas-retrasadas')
    };

    // Limpiar contenedores antes de renderizar
    Object.values(contenedores).forEach(contenedor => {
        if (contenedor) contenedor.innerHTML = '';
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Agrupar tareas por estado y fecha límite
    const grupos = {
        todas: tareas,
        hacer: tareas.filter(tarea => normalizarEstado(tarea.estado) === 'por_hacer'),
        progreso: tareas.filter(tarea => normalizarEstado(tarea.estado) === 'progreso'),
        completadas: tareas.filter(tarea => normalizarEstado(tarea.estado) === 'completada'),
        retrasadas: tareas.filter(tarea => {
            const estado = normalizarEstado(tarea.estado);
            if (estado === 'completada') return false;
            if (!tarea.fecha) return false;
            const fechaTarea = new Date(`${tarea.fecha}T00:00:00`);
            return !Number.isNaN(fechaTarea.getTime()) && fechaTarea < hoy;
        })
    };

    actualizarContadores(grupos);

    // Renderizar cada vista de estado
    renderizarGrupo(contenedores.todas, grupos.todas, 'todas');
    renderizarGrupo(contenedores.hacer, grupos.hacer, 'por_hacer');
    renderizarGrupo(contenedores.progreso, grupos.progreso, 'progreso');
    renderizarGrupo(contenedores.completadas, grupos.completadas, 'completada');
    renderizarGrupo(contenedores.retrasadas, grupos.retrasadas, 'retrasada');

    enlazarEventosTareas();
}

/**
 * Normalizar el estado de una tarea a minúsculas para comparación consistente
 * Estados válidos: 'por_hacer', 'progreso', 'completada'
 */
function normalizarEstado(estado) {
    const valor = (estado || 'por_hacer').toString().trim().toLowerCase();
    if (valor === 'todo') return 'por_hacer';
    if (valor === 'progress') return 'progreso';
    if (valor === 'done') return 'completada';
    return valor;
}

function normalizarTextoBusqueda(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

/**
 * Actualiza los contadores dinámicos de cada pestaña
 */
function actualizarContadores(grupos) {
    const mapeo = {
        'contador-todas': grupos.todas.length,
        'contador-hacer': grupos.hacer.length,
        'contador-progreso': grupos.progreso.length,
        'contador-completadas': grupos.completadas.length,
        'contador-retrasadas': grupos.retrasadas.length
    };

    Object.entries(mapeo).forEach(([id, valor]) => {
        const nodo = document.getElementById(id);
        if (nodo) nodo.textContent = valor;
    });
}

function renderizarGrupo(contenedor, tareas, tipoVista) {
    if (!contenedor) return;

    if (!tareas.length) {
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="contenedor-estado-vacio">
                    <div>
                        <div class="fw-semibold mb-1">No hay tareas para mostrar</div>
                        <div class="small text-muted">Crea una nueva tarea o cambia de pestaña para ver otras.</div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = tareas.map(tarea => crearTarjetaTarea(tarea, tipoVista)).join('');
}

function crearTarjetaTarea(tarea, tipoVista) {
    const prioridad = normalizarPrioridad(tarea.prioridad);
    const estado = normalizarEstado(tarea.estado);
    const esRetrasada = tipoVista === 'retrasada' || (tipoVista === 'todas' && estado !== 'completada' && tarea.fecha && new Date(`${tarea.fecha}T00:00:00`) < new Date(new Date().setHours(0, 0, 0, 0)));

    const prioridadClass = prioridad === 'urgente' ? 'etiqueta-prioridad-alta' : prioridad === 'importante' ? 'etiqueta-prioridad-media' : 'etiqueta-prioridad-baja';
    const estadoClass = esRetrasada ? 'etiqueta-estado-retrasada' : estado === 'completada' ? 'etiqueta-estado-terminada' : estado === 'progreso' ? 'etiqueta-estado-progreso' : 'etiqueta-estado-pendiente';
    const estadoLabel = esRetrasada ? 'Retrasada' : obtenerEtiquetaEstado(estado);
    const prioridadLabel = obtenerEtiquetaPrioridad(prioridad);
    const titulo = escapeHtml(tarea.titulo || 'Sin título');
    const descripcion = escapeHtml(tarea.descripcion || 'Sin descripción');
    const fecha = escapeHtml(formatearFecha(tarea.fecha));
    const id = escapeHtml(String(tarea.id ?? ''));
    const nombreProyecto = escapeHtml(obtenerNombreProyectoTarea(tarea));

    // Clases condicionales para opacidad en tareas completadas
    const claseOpacidad = estado === 'completada' ? 'tarjeta-tarea-completada' : '';

    // Determinar icono según estado actual
    let iconoEstado = 'bi-play-circle-fill';    // Por defecto: Por hacer
    let colorIcono = 'text-primary';
    let titleIcono = 'Cambiar a En progreso';

    if (estado === 'progreso') {
        iconoEstado = 'bi-hourglass-split';      // En progreso
        colorIcono = 'text-warning';
        titleIcono = 'Cambiar a Completada';
    } else if (estado === 'completada') {
        iconoEstado = 'bi-check-circle-fill';    // Completada
        colorIcono = 'text-success';
        titleIcono = 'Reactivar tarea';
    }

    return `
        <div class="col tablero-grid-tarea">
            <article class="tarjeta-tarea p-3 h-100 ${claseOpacidad}" data-tarea-id="${id}" data-estado-actual="${estado}">
                <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
                    <div class="flex-grow-1">
                        <h6 class="titulo-tarea fw-bold text-dark mb-1">${titulo}</h6>
                        <div class="small text-secondary d-flex align-items-center gap-1">
                            <i class="bi bi-folder2-open"></i>
                            <span>${nombreProyecto}</span>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <!-- Botón para cambiar estado: icono dinámico según estado actual -->
                        <button type="button" class="btn btn-link p-0 ${colorIcono} border-0 shadow-none boton-cambiar-estado" 
                                aria-label="${titleIcono}" title="${titleIcono}" data-tarea-id="${id}" data-estado-actual="${estado}">
                            <i class="bi ${iconoEstado} fs-5"></i>
                        </button>
                        <!-- Botón para eliminar tarea -->
                        <button type="button" class="btn btn-link p-0 text-danger border-0 shadow-none boton-eliminar-tarea" 
                                aria-label="Eliminar tarea" title="Eliminar tarea" data-tarea-id="${id}">
                            <i class="bi bi-trash3 fs-6"></i>
                        </button>
                    </div>
                </div>

                <p class="text-secondary mb-3 lh-sm" style="font-size: 0.9rem; min-height: 2.5rem;">
                    ${descripcion}
                </p>

                <div class="meta-etiquetas-tarea">
                    <span class="etiqueta-id-oculta badge rounded-pill border bg-light text-secondary px-2 py-1">#${id}</span>
                    <span class="badge etiqueta-reducida rounded-pill px-2 py-1 ${prioridadClass}">${prioridadLabel}</span>
                    <span class="badge etiqueta-reducida rounded-pill px-2 py-1 ${estadoClass}">${estadoLabel}</span>
                    <span class="badge etiqueta-reducida rounded-pill border bg-light text-dark px-2 py-1"><i class="bi bi-calendar3 me-1"></i>${fecha}</span>
                </div>
            </article>
        </div>
    `;
}

/**
 * Prioridades válidas: 'alta', 'media', 'baja'
 */
function normalizarPrioridad(prioridad) {
    const valor = (prioridad || 'flexible').toString().trim().toLowerCase();
    if (valor === 'alta' || valor === 'urgente') return 'urgente';
    if (valor === 'media' || valor === 'importante') return 'importante';
    return 'flexible';
}

/**
 * Retorna la etiqueta legible para la prioridad
 */
function obtenerEtiquetaPrioridad(prioridad) {
    if (prioridad === 'urgente') return 'Urgente';
    if (prioridad === 'importante') return 'Importante';
    return 'Flexible';
}

function enlazarControlesTareas() {
    const buscador = document.getElementById('buscadorTareas');
    if (buscador && !buscador.dataset.enlazado) {
        buscador.dataset.enlazado = 'true';
        buscador.addEventListener('input', event => {
            terminoBusquedaTareas = event.target.value;
            renderizarModuloTareas();
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
            renderizarModuloTareas();
        });
    });
}

function obtenerNombreProyectoTarea(tarea) {
    if (!tarea || tarea.idProyecto === null || tarea.idProyecto === '' || typeof tarea.idProyecto === 'undefined') {
        return 'General';
    }

    const proyecto = (datosGlobalesProyectos || []).find(item => Number(item.id) === Number(tarea.idProyecto));
    return proyecto?.nombre || 'General';
}

/**
 * Retorna la etiqueta legible para el estado
 */
function obtenerEtiquetaEstado(estado) {
    if (estado === 'progreso') return 'En progreso';
    if (estado === 'completada') return 'Completada';
    return 'Por hacer';
}

/**
 * Formatea  fecha a formato  (DD/MM/YYYY)
 */
function formatearFecha(fechaIso) {
    if (!fechaIso) return 'Sin fecha';
    const fecha = new Date(`${fechaIso}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return fechaIso;
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Escapa caracteres HTML peligrosos para prevenir XSS
 */
function escapeHtml(texto) {
    return String(texto)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/**
 * GESTIÓN DE EVENTOS 
 */

/**
 * Enlaza eventos a los botones de las tareas después del renderizado
 */
function enlazarEventosTareas() {
    // Eventos para cambiar estado
    document.querySelectorAll('.boton-cambiar-estado').forEach(boton => {
        boton.addEventListener('click', manejarCambioEstado);
    });

    // Eventos para eliminar
    document.querySelectorAll('.boton-eliminar-tarea').forEach(boton => {
        boton.addEventListener('click', EliminarTarea);
    });
}

/**
 * Maneja el cambio de estado de una tarea
 * Actualiza iconos dinámicamente según el nuevo estado
 */
async function manejarCambioEstado(event) {
    event.preventDefault();

    const idTarea = this.getAttribute('data-tarea-id');
    const tarjeta = document.querySelector(`[data-tarea-id="${idTarea}"]`);

    if (!tarjeta) return;

    // Buscar la tarea en los datos globales
    const tarea = datosGlobalesActividades.find(a => a.id === parseInt(idTarea));
    if (!tarea) return;

    const estadoActual = normalizarEstado(tarea.estado);

    // Ciclo de cambio de estado
    let nuevoEstado;
    if (estadoActual === 'por_hacer') {
        nuevoEstado = 'progreso';
    } else if (estadoActual === 'progreso') {
        nuevoEstado = 'completada';
    } else if (estadoActual === 'completada') {
        // Si ya está completada, mostrar modal de reactivación
        mostrarModalReactivarTarea(idTarea, tarea.titulo);
        return;
    } else {
        nuevoEstado = 'por_hacer';
    }

    // Enviar actualización al servidor
    await actualizarEstadoTarea(idTarea, nuevoEstado);
}

/**
 * Maneja la eliminación de una tarea
 */
async function EliminarTarea(event) {
    event.preventDefault();

    const idTarea = this.getAttribute('data-tarea-id');
    const tarjeta = document.querySelector(`[data-tarea-id="${idTarea}"]`);

    if (!tarjeta) return;

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

                if (!respuesta.ok) {
                    throw new Error('Error al eliminar');
                }

                if (moduloActivo === 'proyectos' && typeof proyectoActivo !== 'undefined' && proyectoActivo !== null) {
                    eliminarTarjetaProyectoDePantalla(idTarea);
                } else if (moduloActivo === 'tareas') {
                    iniciarModuloTareas();
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

        if (!respuesta.ok) {
            throw new Error('Error al actualizar estado');
        }

        if (moduloActivo === 'proyectos' && typeof proyectoActivo !== 'undefined' && proyectoActivo !== null) {
            const tarea = datosGlobalesActividades.find(a => a.id === parseInt(idTarea));
            if (tarea) tarea.estado = nuevoEstado;
            actualizarTarjetaProyectoEnPantalla(idTarea, nuevoEstado);
        } else if (moduloActivo === 'tareas') {
            await cargarDatosDesdeServidor();
            iniciarModuloTareas();
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

    tituloNodo.textContent = `¿Reactivar "${escapeHtml(titulo)}"?`;

    // Limpiar eventos anteriores
    botonConfirmar.onclick = null;

    // Evento para confirmar reactivación
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

    datosGlobalesActividades = datosGlobalesActividades.filter(a => a.id !== parseInt(idTarea));
    actualizarEstadosVaciosProyecto();
    actualizarContadoresProyecto();
}

function obtenerContenedorProyectoPorEstado(estado) {
    const estadoNormalizado = normalizarEstado(estado);
    if (estadoNormalizado === 'progreso') return document.getElementById('contenedor-proyecto-progreso');
    if (estadoNormalizado === 'completada') return document.getElementById('contenedor-proyecto-terminadas');
    return document.getElementById('contenedor-proyecto-todo');
}

function limpiarEstadoVacioProyecto(contenedor) {
    contenedor.querySelector('.kanban-empty-state')?.remove();
}

function actualizarEstadosVaciosProyecto() {
    agregarEstadoVacioProyecto('contenedor-proyecto-todo', 'No hay tareas por hacer', 'Agrega una nueva tarea para comenzar.');
    agregarEstadoVacioProyecto('contenedor-proyecto-progreso', 'No hay tareas en progreso', 'Las tareas activas aparecerán aquí.');
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
    actualizarContadorColumnaProyecto('contenedor-proyecto-todo');
    actualizarContadorColumnaProyecto('contenedor-proyecto-progreso');
    actualizarContadorColumnaProyecto('contenedor-proyecto-terminadas');
}

function actualizarContadorColumnaProyecto(idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    const columna = contenedor?.closest('.kanban-column-proyecto');
    const contador = columna?.querySelector('.kanban-column-head .badge');
    if (contador) contador.textContent = contenedor.querySelectorAll('article.tarjeta-tarea').length;
}

function obtenerTituloBotonEstadoProyecto(estado) {
    const estadoNormalizado = normalizarEstado(estado);
    if (estadoNormalizado === 'progreso') return 'Cambiar a Completada';
    if (estadoNormalizado === 'completada') return 'Reactivar tarea';
    return 'Cambiar a En progreso';
}

function obtenerClaseIndicadorProyecto(estado) {
    const estadoNormalizado = normalizarEstado(estado);
    if (estadoNormalizado === 'progreso') return 'kanban-state-progress';
    if (estadoNormalizado === 'completada') return 'kanban-state-done';
    return 'kanban-state-todo';
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
