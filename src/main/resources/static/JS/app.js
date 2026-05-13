// Variable global para almacenar los datos temporalmente en memoria
let datosGlobalesActividades = [];
let datosGlobalesProyectos = [];
let accionConfirmacionPendiente = null;

// cerrar sesión / solicitar al servidor invalidar la sesión
const btnCerrarSesion = document.getElementById('btnCerrarSesion');
if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/logout';
    });
}
// Listener para el formulario único del modal actividad
document.getElementById('formActividadUniversal')?.addEventListener('submit', function (e) {
    e.preventDefault();

    // Recolectar datos  
    const datosActividad = {
        titulo: document.getElementById('actividadTitulo').value,
        descripcion: document.getElementById('actividadDesc').value,
        fecha: document.getElementById('actividadFecha').value,
        prioridad: document.getElementById('actividadPrioridad').value,
        idProyecto: document.getElementById('ctx_proyecto_id').value ? parseInt(document.getElementById('ctx_proyecto_id').value) : null,
        esEvento: document.getElementById('ctx_es_evento').value === "true",
        estado: document.getElementById('actividadEstado').value || 'por_hacer'
    };

    //  Si es evento, agregar campos específicos
    if (datosActividad.esEvento) {
        datosActividad.horaInicio = document.getElementById('horaInicio').value;
        datosActividad.horaFin = document.getElementById('horaFin').value;
        datosActividad.estado = null;
    }

    // Enviar al backend: actividadController.guardarActividades().
    fetch('/api/actividades/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActividad)
    })
        .then(res => res.json())
        .then(async () => {
            const modalEl = document.getElementById('modalActividadUniversal');
            const modalFormulario = bootstrap.Modal.getInstance(modalEl);
            if (modalFormulario) {
                modalFormulario.hide();
            }

            mostrarModalExitoGuardado('Tarea creada', 'La tarea se guardó correctamente.', async () => {
                // Recargar datos desde el servidor sin recargar la página completa
                await cargarDatosDesdeServidor();

                // Reiniciar el módulo activo según dónde se hizo la acción
                if (moduloActivo === 'inicio' && typeof renderizarInicio === 'function') {
                    await cargarProyectosResumenDesdeServidor();
                    renderizarInicio();
                } else if (moduloActivo === 'tareas') {
                    /* El modal de éxito tapa el flash: recargamos mientras está visible. */
                    window.location.reload();
                } else if (moduloActivo === 'proyectos') {
                    if (typeof proyectoActivo !== 'undefined' && proyectoActivo !== null) {
                        window.location.reload();
                    } else {
                        window.location.reload();
                    }
                } else if (moduloActivo === 'calendario' && typeof iniciarModuloCalendario === 'function') {
                    iniciarModuloCalendario();
                }
            });
        })
        .catch(err => console.error("Error al guardar:", err));
});

// Listener para el formulario de creación de proyectos
document.getElementById('formProyectoNuevo')?.addEventListener('submit', function (e) {
    e.preventDefault();

    /*
     * Crear proyectos desde el modal.
     */
    const nuevoProyecto = {
        nombre: document.getElementById('proyectoNombre').value,
        descripcion: document.getElementById('proyectoDescripcion').value,
        fechaLimite: document.getElementById('proyectoFechaLimite').value,
        colorIcono: document.getElementById('proyectoColorIcono').value || '#0d6efd',
        tareasTotales: 0,
        tareasCompletadas: 0
    };

    fetch('/api/proyectos/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProyecto)
    })
        .then(res => res.json())
        .then(async () => {
            const modalEl = document.getElementById('modalCrearProyecto');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
            }

            // Recargar datos desde el servidor sin recargar la página completa
            await cargarProyectosResumenDesdeServidor();

            // Reiniciar el módulo de proyectos si está activo
            if (moduloActivo === 'proyectos') {
                if (typeof iniciarModuloProyectos === 'function') {
                    iniciarModuloProyectos();
                } else {
                    window.location.reload();
                }
            }
        })
        .catch(err => console.error('Error al guardar proyecto:', err));
});



// COMUNICACIÓN CON EL BACKEND: API REST / FETCH


// obtener todas las actividades tareas/eventos para Inicio, Tareas, Proyecto y Calendario. 
async function cargarDatosDesdeServidor() {

    try {
        const respuesta = await fetch('/api/actividades');
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        //variable global para los datos
        datosGlobalesActividades = await respuesta.json();
        return datosGlobalesActividades;
    } catch (error) {
        console.error("Error al cargar los datos desde el servidor:", error);
        return [];
    }
}

async function cargarProyectosResumenDesdeServidor() {
    try {
        const respuesta = await fetch('/api/proyectos');
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        datosGlobalesProyectos = await respuesta.json();
        return datosGlobalesProyectos;
    } catch (error) {
        console.error('Error al cargar los proyectos desde el servidor:', error);
        datosGlobalesProyectos = [];
        return [];
    }
}

async function iniciarModuloInicio() {
    await Promise.all([
        cargarDatosDesdeServidor(),
        cargarProyectosResumenDesdeServidor()
    ]);

    renderizarInicio();
}


// GESTIÓN DE MODALES E INTERFAZ

function abrirModalTareaUniversal(contexto, idProyecto = null, fechaPrefijada = null) {

    const modalElement = document.getElementById('modalActividadUniversal');

    if (!modalElement) {
        console.error("No se encontró el modal en el HTML.");
        return;
    }

    const form = document.getElementById('formActividadUniversal');
    if (form) form.reset();

    // Referencias a elementos que cambian según contexto
    const tituloModal = document.getElementById('modalTitulo');
    const secHoras = document.getElementById('seccionHoras');
    const secEstado = document.getElementById('seccionEstado');
    const inputTitulo = document.getElementById('actividadTitulo');
    const inputDesc = document.getElementById('actividadDesc');
    const inputFecha = document.getElementById('actividadFecha');
    const inputPrioridad = document.getElementById('actividadPrioridad');
    const inputEstado = document.getElementById('actividadEstado');
    const etiquetaFecha = document.querySelector('label[for="actividadFecha"]');
    const secFecha = document.getElementById('seccionFecha');
    const campoFecha = inputFecha?.parentElement;
    const campoPrioridad = inputPrioridad?.parentElement;

    if (campoFecha) campoFecha.className = 'col-6 form-floating';
    if (campoPrioridad) campoPrioridad.style.display = 'block';
    if (etiquetaFecha) etiquetaFecha.textContent = 'Fecha límite';

    // Limpiar campos ocultos
    document.getElementById('ctx_es_evento').value = "false";
    document.getElementById('ctx_proyecto_id').value = "";
    if (inputFecha) {
        inputFecha.value = fechaPrefijada || '';
        // Sincroniza el valor en el DOM.
        try {
            inputFecha.setAttribute('value', inputFecha.value || '');
            inputFecha.dispatchEvent(new Event('input', { bubbles: true }));
            inputFecha.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (e) { /* no crítico */ }
    }

    /**
     * CONTEXTO: TAREAS
     * Campos visibles: título, descripción, fecha, prioridad, estado
     * Es una tarea personal (esEvento = false, idProyecto = null)
     */
    if (contexto === 'tareas') {
        tituloModal.innerText = 'Nueva Tarea Personal';

        // Mostrar secciones relevantes
        if (inputTitulo) inputTitulo.parentElement.style.display = 'block';
        if (inputDesc) inputDesc.parentElement.style.display = 'block';
        if (secFecha) secFecha.style.display = 'flex';
        if (campoPrioridad) campoPrioridad.style.display = 'block';

        // Secciones específicas
        secHoras.classList.add('d-none');
        secHoras.style.display = 'none';
        secEstado.style.display = 'block';

        // Valores por defecto
        if (inputEstado) inputEstado.value = 'por_hacer';
        document.getElementById('ctx_es_evento').value = "false";
        document.getElementById('ctx_proyecto_id').value = "";
    }
    /**
     * CONTEXTO: PROYECTOS
     * Campos visibles: título, descripción, fecha, prioridad, ESTADO
     * Es una tarea vinculada a proyecto (esEvento = false, idProyecto = idProyecto)
     */
    else if (contexto === 'proyectos') {
        tituloModal.innerText = 'Nueva Tarea de Proyecto';

        // Mostrar secciones relevantes
        if (inputTitulo) inputTitulo.parentElement.style.display = 'block';
        if (inputDesc) inputDesc.parentElement.style.display = 'block';
        if (secFecha) secFecha.style.display = 'flex';
        if (campoPrioridad) campoPrioridad.style.display = 'block';

        // Secciones específicas
        secHoras.classList.add('d-none');
        secHoras.style.display = 'none';
        secEstado.style.display = 'block';

        // Valores por defecto
        if (inputEstado) inputEstado.value = 'por_hacer';  // Estado inicial
        document.getElementById('ctx_es_evento').value = "false";
        document.getElementById('ctx_proyecto_id').value = idProyecto || "";
    }
    /**
     * CONTEXTO: CALENDARIO
     * Campos visibles: título, descripción, fecha, hora inicio, hora fin
     * Es un evento (esEvento = true, sin proyecto)
     */
    else if (contexto === 'calendario') {
        tituloModal.innerText = 'Nuevo Evento de Calendario';

        // Mostrar secciones relevantes
        if (inputTitulo) inputTitulo.parentElement.style.display = 'block';
        if (inputDesc) inputDesc.parentElement.style.display = 'block';
        if (secFecha) secFecha.style.display = 'flex';
        if (campoFecha) campoFecha.className = 'col-12 form-floating';
        if (campoPrioridad) campoPrioridad.style.display = 'none';
        if (etiquetaFecha) etiquetaFecha.textContent = 'Fecha del evento';

        // Secciones específicas
        secHoras.classList.remove('d-none');
        secHoras.style.display = 'flex';
        secEstado.style.display = 'none';

        // Valores por defecto
        document.getElementById('ctx_es_evento').value = "true";
        document.getElementById('ctx_proyecto_id').value = "";
        if (inputFecha && fechaPrefijada) inputFecha.value = fechaPrefijada;
        if (inputFecha && fechaPrefijada) {
            try {
                inputFecha.setAttribute('value', fechaPrefijada);
                inputFecha.dispatchEvent(new Event('input', { bubbles: true }));
                inputFecha.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (e) { }
            try { inputFecha.focus(); } catch (e) { }
        }
    } else if (etiquetaFecha) {
        etiquetaFecha.textContent = 'Fecha límite';
    }

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

function mostrarModalExitoGuardado(titulo, mensaje, alCerrar = null) {
    const modalElement = document.getElementById('modalExitoGuardado');
    const tituloNodo = document.getElementById('modalExitoTitulo');
    const mensajeNodo = document.getElementById('modalExitoMensaje');

    if (!modalElement || !tituloNodo || !mensajeNodo) {
        window.location.reload();
        return;
    }

    tituloNodo.textContent = titulo;
    mensajeNodo.textContent = mensaje;

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    if (typeof alCerrar === 'function') {
        const ejecutarCallback = () => {
            modalElement.removeEventListener('hidden.bs.modal', ejecutarCallback);
            alCerrar();
        };

        modalElement.addEventListener('hidden.bs.modal', ejecutarCallback);
    }

    modal.show();
}

/**
 * Muestra el modal reutilizable de confirmación.
 */
function mostrarModalConfirmacionAccion(titulo, mensaje, textoBoton, accionConfirmada) {
    const modalElement = document.getElementById('modalConfirmacionAccion');
    const tituloNodo = document.getElementById('modalConfirmacionTitulo');
    const mensajeNodo = document.getElementById('modalConfirmacionMensaje');
    const botonNodo = document.getElementById('modalConfirmacionBoton');

    if (!modalElement || !tituloNodo || !mensajeNodo || !botonNodo) {
        if (typeof accionConfirmada === 'function') {
            accionConfirmada();
        }
        return;
    }

    tituloNodo.textContent = titulo;
    mensajeNodo.textContent = mensaje;
    botonNodo.textContent = textoBoton;

    accionConfirmacionPendiente = accionConfirmada;

    botonNodo.onclick = async () => {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }

        const accion = accionConfirmacionPendiente;
        accionConfirmacionPendiente = null;

        if (typeof accion === 'function') {
            await accion();
        }
    };

    modalElement.addEventListener('hidden.bs.modal', () => {
        accionConfirmacionPendiente = null;
    }, { once: true });

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}

