function renderizarInicio() {
    const actividades = Array.isArray(datosGlobalesActividades) ? datosGlobalesActividades : [];
    const proyectos = Array.isArray(datosGlobalesProyectos) ? datosGlobalesProyectos : [];
    const tareas = actividades.filter(actividad => !actividad.esEvento);
    const eventos = actividades.filter(actividad => actividad.esEvento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const tareasEnProgreso = tareas.filter(actividad => normalizarEstadoInicio(actividad.estado) === 'progreso');
    const tareasCompletadas = tareas.filter(actividad => normalizarEstadoInicio(actividad.estado) === 'completada');
    const tareasRetrasadas = tareas.filter(actividad => !esTareaFinalizada(actividad) && esFechaAnterior(actividad.fecha, hoy));
    const eventosHoy = eventos.filter(actividad => mismaFecha(actividad.fecha, hoy));

    setTextoInicio('inicioTotalTareas', tareas.length);
    setTextoInicio('inicioTotalEnProgreso', tareasEnProgreso.length);
    setTextoInicio('inicioTotalCompletadas', tareasCompletadas.length);
    setTextoInicio('inicioTotalRetrasadas', tareasRetrasadas.length);
    setTextoInicio('inicioTotalProyectos', proyectos.length);
    setTextoInicio('inicioTotalEventosHoy', eventosHoy.length);

    const badgeProyectos = document.getElementById('inicioBadgeProyectos');
    if (badgeProyectos) {
        badgeProyectos.textContent = `${proyectos.length} proyecto${proyectos.length === 1 ? '' : 's'} activos`;
    }

    const badgeEventos = document.getElementById('inicioBadgeEventos');
    if (badgeEventos) {
        badgeEventos.textContent = `${eventos.length} evento${eventos.length === 1 ? '' : 's'} programados`;
    }

    renderizarListaInicio('inicioActividadReciente', construirElementosInicioRecientes(actividades, proyectos));
    renderizarListaInicio('inicioEventosProximos', construirElementosInicioEventos(eventos, proyectos, hoy));

    setTextoInicio('inicioContadorActividad', `${actividades.length} registro${actividades.length === 1 ? '' : 's'}`);
    setTextoInicio('inicioContadorEventos', `${eventos.length} evento${eventos.length === 1 ? '' : 's'}`);
}

function normalizarEstadoInicio(estado) {
    return (estado || 'por_hacer').toString().toLowerCase();
}

function mismaFecha(fechaTexto, fechaReferencia) {
    if (!fechaTexto) return false;

    const fecha = new Date(`${fechaTexto}T00:00:00`);
    return !Number.isNaN(fecha.getTime()) && fecha.getTime() === fechaReferencia.getTime();
}

function esFechaAnterior(fechaTexto, fechaReferencia) {
    if (!fechaTexto) return false;

    const fecha = new Date(`${fechaTexto}T00:00:00`);
    return !Number.isNaN(fecha.getTime()) && fecha.getTime() < fechaReferencia.getTime();
}

function esTareaFinalizada(actividad) {
    return normalizarEstadoInicio(actividad.estado) === 'completada';
}

function setTextoInicio(id, valor) {
    const nodo = document.getElementById(id);
    if (nodo) {
        nodo.textContent = valor;
    }
}

function renderizarListaInicio(idContenedor, elementos) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    if (!elementos.length) {
        contenedor.innerHTML = `
            <div class="p-4 text-center text-muted">
                <div class="fw-semibold mb-1">Sin elementos para mostrar</div>
                <div class="small">Cuando guardes tareas o eventos aquí verás el resumen en vivo.</div>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = elementos.map(elemento => elemento).join('');
}

function construirElementosInicioRecientes(actividades, proyectos) {
    return [...actividades]
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
        .slice(0, 5)
        .map(actividad => {
            const proyecto = proyectos.find(item => Number(item.id) === Number(actividad.idProyecto));
            const etiqueta = actividad.esEvento ? 'Evento' : `Tarea ${formatearEstadoInicio(actividad.estado)}`;
            const icono = actividad.esEvento ? 'bi-calendar-event' : iconoEstadoInicio(actividad.estado);
            const detalle = actividad.esEvento
                ? `Fecha ${formatearFechaInicio(actividad.fecha)}${actividad.horaInicio ? ` · ${actividad.horaInicio}${actividad.horaFin ? ` - ${actividad.horaFin}` : ''}` : ''}`
                : `${formatearFechaInicio(actividad.fecha)} · ${proyecto ? proyecto.nombre : 'Sin proyecto'}`;

            return `
                <div class="d-flex align-items-center p-3 border-bottom gap-3">
                    <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 42px; height: 42px; background-color: ${actividad.esEvento ? '#ede9fe' : colorFondoInicio(actividad.estado)}; color: ${actividad.esEvento ? '#7c3aed' : colorTextoInicio(actividad.estado)};">
                        <i class="bi ${icono} fs-5"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="fw-bold text-dark text-truncate" style="font-size: 0.95rem;">${escapeHtmlInicio(actividad.titulo || 'Sin título')}</div>
                        <div class="text-muted small text-truncate">${escapeHtmlInicio(etiqueta)} · ${escapeHtmlInicio(detalle)}</div>
                    </div>
                </div>
            `;
        });
}

function construirElementosInicioEventos(eventos, proyectos, hoy) {
    return [...eventos]
        .filter(evento => evento.fecha)
        .sort((a, b) => new Date(`${a.fecha}T00:00:00`) - new Date(`${b.fecha}T00:00:00`))
        .slice(0, 5)
        .map(evento => {
            const proyecto = proyectos.find(item => Number(item.id) === Number(evento.idProyecto));
            const fechaEvento = new Date(`${evento.fecha}T00:00:00`);
            const esHoy = fechaEvento.getTime() === hoy.getTime();

            return `
                <div class="d-flex align-items-center p-3 border-bottom gap-3">
                    <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 42px; height: 42px; background-color: ${esHoy ? '#eff6ff' : '#f3e8ff'}; color: ${esHoy ? '#2563eb' : '#7c3aed'};">
                        <i class="bi bi-calendar3 fs-5"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="fw-bold text-dark text-truncate" style="font-size: 0.95rem;">${escapeHtmlInicio(evento.titulo || 'Evento')}</div>
                        <div class="text-muted small text-truncate">${escapeHtmlInicio(formatearFechaInicio(evento.fecha))}${evento.horaInicio ? ` · ${escapeHtmlInicio(evento.horaInicio)}${evento.horaFin ? ` - ${escapeHtmlInicio(evento.horaFin)}` : ''}` : ''}${proyecto ? ` · ${escapeHtmlInicio(proyecto.nombre)}` : ''}</div>
                    </div>
                </div>
            `;
        });
}

function formatearFechaInicio(fechaTexto) {
    if (!fechaTexto) return 'Sin fecha';

    const fecha = new Date(`${fechaTexto}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return fechaTexto;

    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatearEstadoInicio(estado) {
    const normalizado = normalizarEstadoInicio(estado);
    if (normalizado === 'progreso') return 'en progreso';
    if (normalizado === 'completada') return 'completada';
    return 'pendiente';
}

function iconoEstadoInicio(estado) {
    const normalizado = normalizarEstadoInicio(estado);
    if (normalizado === 'progreso') return 'bi-arrow-repeat';
    if (normalizado === 'completada') return 'bi-check-circle';
    return 'bi-list-task';
}

function colorFondoInicio(estado) {
    const normalizado = normalizarEstadoInicio(estado);
    if (normalizado === 'progreso') return '#eff6ff';
    if (normalizado === 'completada') return '#dcfce7';
    return '#fef3c7';
}

function colorTextoInicio(estado) {
    const normalizado = normalizarEstadoInicio(estado);
    if (normalizado === 'progreso') return '#2563eb';
    if (normalizado === 'completada') return '#16a34a';
    return '#d97706';
}

function escapeHtmlInicio(texto) {
    return String(texto)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
