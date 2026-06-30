function abrirModalProyecto() {
    const modalElement = document.getElementById('modalCrearProyecto');
    if (!modalElement) return;

    const form = document.getElementById('formProyectoNuevo');
    if (form) form.reset();
    limpiarErroresFormulario(form);

    const color = document.getElementById('proyectoColorIcono');
    if (color) color.value = '#0d6efd';

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}

function solicitarEliminarProyecto(proyectoId, nombreProyecto = '') {
    const nombreLimpio = String(nombreProyecto || '').trim();
    const mensajeProyecto = nombreLimpio ? `"${nombreLimpio}"` : 'este proyecto';

    mostrarModalConfirmacionAccion(
        'Eliminar proyecto',
        `¿Deseas eliminar el proyecto ${mensajeProyecto}? Esta acción no se puede deshacer.`,
        'Eliminar',
        async () => {
            try {
                const respuesta = await fetch(`/api/proyectos/${proyectoId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!respuesta.ok) {
                    throw new Error('Error al eliminar proyecto');
                }
                window.location.href = '/proyectos';
            } catch (error) {
                console.error('No se pudo eliminar el proyecto:', error);
            }
        }
    );
}
