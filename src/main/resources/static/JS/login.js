async function validarLoginTemporal(event) {
    event.preventDefault();
    let usuario = document.getElementById(`email-login`).value;
    let password = document.getElementById(`password-login`).value;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'nombre-usuario-login': usuario, 'password-usuario-login': password }),
        credentials: 'same-origin'
    }).then(res => {
        if (res.ok) {
            window.location.href = '/inicio';
        } else {
            alert('Error en autenticación');
        }
    }).catch(err => {
        console.error(err);
        alert('Error en autenticación');
    });
    return;
}

