// AUTENTICACIÓN GOOGLE // PRUEBA
function manejarRespuestaGoogle(response) {

    const { name, email, picture } = JSON.parse(atob(response.credential.split('.')[1]));

    // Variables disponibles para integracion con backend.
    void name;
    void email;
    void picture;
}

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

function valiarRegistroUsaario(event) {
    event.preventDefault();
    alert(`AUN EN DESARROLLO :/  \t inicia sesión nomas mi king user: admin pass: admin`)
}


