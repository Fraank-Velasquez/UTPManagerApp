async function iniciarModuloCalendario() {

    const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const HORAS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

    const hoy = normalizarFecha(new Date());
    let fechaVista = new Date(hoy);
    let modoVista = 'mes';
    let tabActiva = 'todos';
    let filtroPrioridad = '';
    let filtroTipo = '';
    let diaSeleccionado = null;
    let eventosCalendario = [];

    await recargarEventos();
    enlazarControles();
    renderizarVista();
    actualizarContadoresPestañas();
    actualizarResumenPanel();


    // CARGA DE DATOS


    async function recargarEventos() {
        if (typeof cargarDatosDesdeServidor === 'function') {
            await cargarDatosDesdeServidor();
        }
        eventosCalendario = (datosGlobalesActividades || [])
            .filter(a => a && a.esEvento === true);
    }


    function normalizarFecha(fecha) {
        const c = new Date(fecha);
        c.setHours(0, 0, 0, 0);
        return c;
    }

    function obtenerFechaClave(fecha) {
        return [
            fecha.getFullYear(),
            String(fecha.getMonth() + 1).padStart(2, '0'),
            String(fecha.getDate()).padStart(2, '0')
        ].join('-');
    }

    function obtenerLunes(fecha) {
        const c = normalizarFecha(fecha);
        const dia = c.getDay();
        c.setDate(c.getDate() + (dia === 0 ? -6 : 1 - dia));
        return c;
    }

    function formatearFechaInput(fecha) {
        return obtenerFechaClave(fecha);
    }

    function formatearFechaLarga(fechaIso) {
        if (!fechaIso) return 'Sin fecha';
        const f = normalizarFecha(new Date(`${fechaIso}T00:00:00`));
        if (Number.isNaN(f.getTime())) return fechaIso;
        return f.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    function obtenerTemporalidad(evento) {
        if (!evento.fecha) return 'futuros';
        const f = normalizarFecha(new Date(`${evento.fecha}T00:00:00`));
        if (Number.isNaN(f.getTime())) return 'futuros';
        if (f.getTime() === hoy.getTime()) return 'hoy';
        if (f < hoy) return 'pasados';
        return 'futuros';
    }


    function normalizarPrioridad(evento) {
        const p = (evento.prioridad || '').toString().trim().toLowerCase();
        if (p === 'urgente' || p === 'alta') return 'urgente';
        if (p === 'importante' || p === 'media') return 'importante';
        return 'flexible';
    }


    function normalizarTipoEvento(evento) {
        const t = (evento.tipoEvento || evento.tipo || '').toString().trim().toLowerCase();
        if (t === 'externo') return 'externo';
        return 'propio';
    }


    function eventosPorTab(tab) {
        return eventosCalendario.filter(e => {
            if (tab !== 'todos' && obtenerTemporalidad(e) !== tab) return false;
            if (filtroPrioridad && normalizarPrioridad(e) !== filtroPrioridad) return false;
            if (filtroTipo && normalizarTipoEvento(e) !== filtroTipo) return false;
            return true;
        });
    }

    function eventosFiltradosActivos() {
        return eventosPorTab(tabActiva);
    }

    function actualizarContadoresPestañas() {
        const grupos = {
            todos: eventosPorTab('todos').length,
            futuros: eventosPorTab('futuros').length,
            hoy: eventosPorTab('hoy').length,
            pasados: eventosPorTab('pasados').length,
        };
        Object.entries(grupos).forEach(([tab, num]) => {
            const el = document.getElementById(`contador-${tab}`);
            if (el) el.textContent = num;
        });
    }

    function actualizarResumenPanel() {
        const setNum = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
        setNum('resumenNumFuturos', eventosCalendario.filter(e => obtenerTemporalidad(e) === 'futuros').length);
        setNum('resumenNumHoy', eventosCalendario.filter(e => obtenerTemporalidad(e) === 'hoy').length);
        setNum('resumenNumPasados', eventosCalendario.filter(e => obtenerTemporalidad(e) === 'pasados').length);
    }


    function clasesBadgePrioridad(evento) {
        const p = normalizarPrioridad(evento);
        if (p === 'urgente') return 'event-badge-urgente';
        if (p === 'importante') return 'event-badge-importante';
        return 'event-badge-flexible';
    }

    function etiquetaHoraEvento(evento) {
        const hora = evento.horaInicio
            ? ` ${evento.horaInicio}${evento.horaFin ? `–${evento.horaFin}` : ''}`
            : '';
        return `${evento.titulo || 'Evento'}${hora}`;
    }

    function crearBadgeEvento(evento) {
        const badge = document.createElement('div');
        const tipo = normalizarTipoEvento(evento);
        const temp = obtenerTemporalidad(evento);

        badge.className = `event-badge ${clasesBadgePrioridad(evento)}`;

        // Destaca eventos externos.
        if (tipo === 'externo') badge.classList.add('event-badge-externo');

        // opacidad en los eventos pasados.
        if (temp === 'pasados') badge.classList.add('event-badge-pasado');

        badge.textContent = etiquetaHoraEvento(evento);
        badge.title = `${evento.titulo || 'Evento'}\nPrioridad: ${normalizarPrioridad(evento)}\nTipo: ${tipo}`;
        return badge;
    }


    function agruparEventos(listaEventos) {
        const agrupados = {};
        (listaEventos || eventosCalendario).forEach(ev => {
            if (!ev.fecha) return;
            const f = normalizarFecha(new Date(`${ev.fecha}T00:00:00`));
            if (Number.isNaN(f.getTime())) return;
            const clave = obtenerFechaClave(f);
            if (!agrupados[clave]) agrupados[clave] = [];
            agrupados[clave].push({ ...ev, _fecha: f });
        });
        return agrupados;
    }


    function abrirPanelDia(fechaIso) {
        diaSeleccionado = fechaIso;

        const panelTitulo = document.getElementById('panelFechaTitulo');
        const panelSub = document.getElementById('panelFechaSubtitulo');
        const panelContador = document.getElementById('panelContadorEventos');
        const panelBody = document.getElementById('panelEventosList');

        if (!panelBody) return;

        // Todos los eventos del día (sin filtro de tab para el panel)
        const eventosDia = (agruparEventos(eventosCalendario))[fechaIso] || [];

        // Fecha bonita
        const fechaObj = normalizarFecha(new Date(`${fechaIso}T00:00:00`));
        const esHoyDia = fechaObj.getTime() === hoy.getTime();

        if (panelTitulo) {
            panelTitulo.textContent = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        }
        if (panelSub) {
            panelSub.textContent = esHoyDia ? '📍 Hoy' : fechaObj.getFullYear();
        }
        if (panelContador) {
            panelContador.textContent = eventosDia.length ? `${eventosDia.length} evento${eventosDia.length > 1 ? 's' : ''}` : '';
            panelContador.style.display = eventosDia.length ? '' : 'none';
        }

        if (!eventosDia.length) {
            panelBody.innerHTML = `
                <div class="cal-panel-empty">
                    <i class="bi bi-calendar2-x cal-panel-empty-icon"></i>
                    <p>Sin eventos este día</p>
                    <button class="btn btn-sm btn-primary rounded-pill mt-2"
                            onclick="abrirModalTareaUniversal('calendario', null, '${fechaIso}')">
                        <i class="bi bi-plus-lg me-1"></i>Añadir evento
                    </button>
                </div>`;
            return;
        }

        panelBody.innerHTML = '';
        eventosDia.forEach(ev => {
            panelBody.appendChild(crearTarjetaPanel(ev, fechaIso));
        });
    }

    function crearTarjetaPanel(evento, fechaIso) {
        const card = document.createElement('div');
        const prior = normalizarPrioridad(evento);
        const tipo = normalizarTipoEvento(evento);
        const temp = obtenerTemporalidad(evento);

        card.className = `cal-panel-card cal-panel-card-${prior}${temp === 'pasados' ? ' cal-panel-card-pasado' : ''}`;

        const iconoPrioridad = prior === 'urgente' ? '🔴' : prior === 'importante' ? '🟡' : '🟢';
        const iconoTipo = tipo === 'externo' ? '<i class="bi bi-globe"></i>' : '<i class="bi bi-person-fill"></i>';
        const horaTexto = evento.horaInicio
            ? `${evento.horaInicio}${evento.horaFin ? ` – ${evento.horaFin}` : ''}`
            : 'Todo el día';

        card.innerHTML = `
            <div class="cal-panel-card-top">
                <span class="cal-panel-card-icon">${iconoPrioridad}</span>
                <span class="cal-panel-card-titulo">${escapeHtml(evento.titulo || 'Sin título')}</span>
                <span class="cal-panel-card-tipo" title="Tipo: ${tipo}">${iconoTipo}</span>
            </div>
            <div class="cal-panel-card-hora">
                <i class="bi bi-clock me-1"></i>${horaTexto}
            </div>
            ${evento.descripcion ? `<div class="cal-panel-card-desc">${escapeHtml(evento.descripcion)}</div>` : ''}
            <div class="cal-panel-card-badges">
                <span class="cal-pill cal-pill-${prior}">${prior.charAt(0).toUpperCase() + prior.slice(1)}</span>
                <span class="cal-pill cal-pill-tipo-${tipo}">${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
                ${temp === 'pasados' ? '<span class="cal-pill cal-pill-pasado">Pasado</span>' : ''}
                ${temp === 'hoy' ? '<span class="cal-pill cal-pill-hoy">Hoy</span>' : ''}
            </div>
            <div class="cal-panel-card-acciones">
                <button class="cal-accion-btn cal-accion-editar"
                        onclick="abrirModalTareaUniversal('calendario', ${evento.id}, '${fechaIso}')"
                        title="Editar evento">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="cal-accion-btn cal-accion-eliminar"
                        onclick="eliminarEventoCalendario(${evento.id})"
                        title="Eliminar evento">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
        `;

        return card;
    }


    window.eliminarEventoCalendario = function (idEvento) {
        if (typeof mostrarModalConfirmacionAccion === 'function') {
            mostrarModalConfirmacionAccion(
                'Eliminar evento',
                '¿Deseas eliminar este evento? Esta acción no se puede deshacer.',
                'Eliminar',
                async () => {
                    try {
                        const resp = await fetch(`/api/actividades/${idEvento}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        if (!resp.ok) throw new Error('Error al eliminar');
                        await recargarEventos();
                        renderizarVista();
                        actualizarContadoresPestañas();
                        actualizarResumenPanel();
                        if (diaSeleccionado) abrirPanelDia(diaSeleccionado);
                    } catch (err) {
                        console.error('Error al eliminar evento:', err);
                    }
                }
            );
        }
    };


    function renderizarVistaMes() {
        const titulo = document.getElementById('calendarTitle');
        const cuerpo = document.getElementById('monthBody');

        // Filtrar según tab y filtros activos
        const eventosFiltrados = eventosFiltradosActivos();
        const indiceEventos = agruparEventos(eventosFiltrados);

        if (titulo) {
            titulo.textContent = `${MESES[fechaVista.getMonth()]} ${fechaVista.getFullYear()}`;
        }
        if (!cuerpo) return;
        cuerpo.innerHTML = '';

        const primerDia = new Date(fechaVista.getFullYear(), fechaVista.getMonth(), 1);
        const totalDias = new Date(fechaVista.getFullYear(), fechaVista.getMonth() + 1, 0).getDate();
        const inicioSemana = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;
        const totalCeldas = Math.ceil((inicioSemana + totalDias) / 7) * 7;

        const celda = new Date(primerDia);
        celda.setDate(1 - inicioSemana);

        for (let fila = 0; fila < totalCeldas / 7; fila++) {
            const tr = document.createElement('tr');

            for (let col = 0; col < 7; col++) {
                const fechaCelda = normalizarFecha(celda);
                const esMesActual = fechaCelda.getMonth() === fechaVista.getMonth()
                    && fechaCelda.getFullYear() === fechaVista.getFullYear();
                const esHoyDia = fechaCelda.getTime() === hoy.getTime();
                const esPasado = fechaCelda < hoy && !esHoyDia;
                const clave = obtenerFechaClave(fechaCelda);
                const eventosDia = indiceEventos[clave] || [];
                const esSeleccionado = diaSeleccionado === clave;

                const td = document.createElement('td');
                td.className = [
                    'calendar-day',
                    !esMesActual ? 'other-month' : '',
                    esHoyDia ? 'dia-hoy' : '',
                    esPasado && esMesActual ? 'dia-pasado' : '',
                    esSeleccionado ? 'dia-seleccionado' : ''
                ].filter(Boolean).join(' ');

                td.dataset.fecha = clave;
                td.addEventListener('click', () => {
                    // Quitar selección anterior
                    document.querySelectorAll('.dia-seleccionado').forEach(el => el.classList.remove('dia-seleccionado'));
                    td.classList.add('dia-seleccionado');
                    abrirPanelDia(clave);
                });

                // Encabezado del número de día
                const encabezado = document.createElement('div');
                encabezado.className = 'd-flex justify-content-between align-items-center mb-1';

                const numero = document.createElement('span');
                numero.className = `day-number${esHoyDia ? ' day-number-hoy' : ''}`;
                numero.textContent = fechaCelda.getDate();
                encabezado.appendChild(numero);

                if (esHoyDia) {
                    const badgeHoy = document.createElement('span');
                    badgeHoy.className = 'badge-hoy';
                    badgeHoy.textContent = 'HOY';
                    encabezado.appendChild(badgeHoy);
                }

                td.appendChild(encabezado);

                // Eventos del día (solo en mes actual)
                if (esMesActual && eventosDia.length) {
                    const LIMITE = 3;
                    eventosDia.slice(0, LIMITE).forEach(ev => td.appendChild(crearBadgeEvento(ev)));

                    if (eventosDia.length > LIMITE) {
                        const mas = document.createElement('div');
                        mas.className = 'calendar-mas-eventos';
                        mas.textContent = `+ ${eventosDia.length - LIMITE} más`;
                        td.appendChild(mas);
                    }
                }

                tr.appendChild(td);
                celda.setDate(celda.getDate() + 1);
            }

            cuerpo.appendChild(tr);
        }
    }

    /*
       VISTA SEMANA
     */

    function renderizarVistaSemana() {
        const titulo = document.getElementById('calendarTitle');
        const cuerpo = document.getElementById('weekBody');
        const semanaInicio = obtenerLunes(fechaVista);
        const semanaFin = normalizarFecha(new Date(semanaInicio));
        semanaFin.setDate(semanaFin.getDate() + 6);

        const eventosFiltrados = eventosFiltradosActivos();
        const indiceEventos = agruparEventos(eventosFiltrados);

        if (titulo) {
            const mismoMes = semanaInicio.getMonth() === semanaFin.getMonth();
            titulo.textContent = mismoMes
                ? `${semanaInicio.getDate()} - ${semanaFin.getDate()} de ${MESES[semanaInicio.getMonth()]} ${semanaInicio.getFullYear()}`
                : `${semanaInicio.getDate()} ${MESES[semanaInicio.getMonth()]} — ${semanaFin.getDate()} ${MESES[semanaFin.getMonth()]} ${semanaFin.getFullYear()}`;
        }

        // Fechas en encabezados de columna
        for (let i = 0; i < 7; i++) {
            const fd = new Date(semanaInicio);
            fd.setDate(fd.getDate() + i);
            const el = document.getElementById(`wDay${i}`);
            if (el) el.textContent = `${fd.getDate()} ${MESES[fd.getMonth()].slice(0, 3)}`;
        }

        if (!cuerpo) return;
        cuerpo.innerHTML = '';

        HORAS.forEach(hora => {
            const horaHH = hora.substring(0, 2);
            const tr = document.createElement('tr');

            const celdaHora = document.createElement('td');
            celdaHora.className = 'calendar-week-hour';
            celdaHora.textContent = hora;
            tr.appendChild(celdaHora);

            for (let i = 0; i < 7; i++) {
                const fechaDia = new Date(semanaInicio);
                fechaDia.setDate(fechaDia.getDate() + i);

                const clave = obtenerFechaClave(fechaDia);
                const eventosDia = indiceEventos[clave] || [];
                const esHoyDia = fechaDia.getTime() === hoy.getTime();
                const esSeleccionado = diaSeleccionado === clave;

                const td = document.createElement('td');
                td.className = [
                    'calendar-week-cell',
                    esHoyDia ? 'celda-hoy' : '',
                    esSeleccionado ? 'dia-seleccionado' : ''
                ].filter(Boolean).join(' ');

                td.dataset.fecha = clave;
                td.addEventListener('click', () => {
                    document.querySelectorAll('.dia-seleccionado').forEach(el => el.classList.remove('dia-seleccionado'));
                    td.classList.add('dia-seleccionado');
                    abrirPanelDia(clave);
                });

                // Mostrar eventos filtrados por hora
                const eventosDeLaHora = eventosDia.filter(ev => {
                    if (!ev.horaInicio) return horaHH === '08';
                    return ev.horaInicio.startsWith(horaHH);
                });

                eventosDeLaHora.slice(0, 2).forEach(ev => td.appendChild(crearBadgeEvento(ev)));

                tr.appendChild(td);
            }

            cuerpo.appendChild(tr);
        });
    }

    /* 
       COORDINADOR DE VISTAS
     */

    function renderizarVista() {
        const vistaMes = document.getElementById('vistasMes');
        const vistaSemana = document.getElementById('vistaSemana');
        const btnMes = document.getElementById('btnMes');
        const btnSemana = document.getElementById('btnSemana');

        if (!vistaMes || !vistaSemana) return;

        if (modoVista === 'mes') {
            vistaMes.classList.remove('vista-oculta');
            vistaSemana.classList.add('vista-oculta');
            btnMes?.classList.replace('btn-vista-inactivo', 'btn-vista-activo');
            btnSemana?.classList.replace('btn-vista-activo', 'btn-vista-inactivo');
            renderizarVistaMes();
        } else {
            vistaMes.classList.add('vista-oculta');
            vistaSemana.classList.remove('vista-oculta');
            btnSemana?.classList.replace('btn-vista-inactivo', 'btn-vista-activo');
            btnMes?.classList.replace('btn-vista-activo', 'btn-vista-inactivo');
            renderizarVistaSemana();
        }

        // Re-abrir panel si hay día seleccionado
        if (diaSeleccionado) abrirPanelDia(diaSeleccionado);
    }

    /* 
    ESCAPE XSS
     */

    function escapeHtml(texto) {
        return String(texto)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    /* 
    ENLAZAR CONTROLES
     */

    function enlazarControles() {

        // Navegación mes/semana
        document.getElementById('btnMes')?.addEventListener('click', () => {
            modoVista = 'mes';
            renderizarVista();
        });

        document.getElementById('btnSemana')?.addEventListener('click', () => {
            modoVista = 'semana';
            renderizarVista();
        });

        document.getElementById('btnHoy')?.addEventListener('click', () => {
            fechaVista = new Date(hoy);
            renderizarVista();
        });

        document.getElementById('btnPrev')?.addEventListener('click', () => {
            if (modoVista === 'mes') {
                fechaVista = new Date(fechaVista.getFullYear(), fechaVista.getMonth() - 1, 1);
            } else {
                fechaVista = new Date(fechaVista);
                fechaVista.setDate(fechaVista.getDate() - 7);
            }
            renderizarVista();
        });

        document.getElementById('btnNext')?.addEventListener('click', () => {
            if (modoVista === 'mes') {
                fechaVista = new Date(fechaVista.getFullYear(), fechaVista.getMonth() + 1, 1);
            } else {
                fechaVista = new Date(fechaVista);
                fechaVista.setDate(fechaVista.getDate() + 7);
            }
            renderizarVista();
        });

        // Pestañas de temporalidad
        document.querySelectorAll('.cal-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cal-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                tabActiva = btn.dataset.tab;
                renderizarVista();
                actualizarContadoresPestañas();
            });
        });

        // Filtros
        document.getElementById('filtroPrioridad')?.addEventListener('change', e => {
            filtroPrioridad = e.target.value;
            renderizarVista();
            actualizarContadoresPestañas();
        });

        document.getElementById('filtroTipo')?.addEventListener('change', e => {
            filtroTipo = e.target.value;
            renderizarVista();
            actualizarContadoresPestañas();
        });
    }
}