// Encuentra los botones que tienen el atributo data-pantalla.
// El botón Salir no tiene ese atributo y queda fuera de esta lista.
const botonesMenu = document.querySelectorAll("[data-pantalla]");

// Encuentra todas las secciones que funcionan como pantallas.
const pantallas = document.querySelectorAll(".pantalla");

// Recorre los botones para asignarles su acción.
botonesMenu.forEach(function (boton) {

    // Detecta cuándo se pulsa este botón.
    boton.addEventListener("click", function () {

        // Lee el identificador de la pantalla que debe mostrar.
        const pantallaDestino = boton.dataset.pantalla;

        // Recorre todas las pantallas.
        pantallas.forEach(function (pantalla) {

            // Oculta las que no coinciden y muestra la seleccionada.
            pantalla.hidden = pantalla.id !== pantallaDestino;

        });

        // Actualiza el aspecto de todos los botones del menú.
        botonesMenu.forEach(function (opcion) {

            // Comprueba si esta opción es el botón que pulsamos.
            const seleccionada = opcion === boton;

            // Agrega o quita la clase activo según corresponda.
            opcion.classList.toggle("activo", seleccionada);

            // Identifica la opción actual para tecnologías de asistencia.
            if (seleccionada) {
                opcion.setAttribute("aria-current", "page");
            } else {
                opcion.removeAttribute("aria-current");
            }

        });

    });

});


// Encuentra el botón Salir del menú.
const botonSalir = document.getElementById("boton-salir");

// Ejecuta esta función cuando se presiona el botón.
botonSalir.addEventListener("click", async function () {

    // Pregunta antes de detener el sistema.
    const deseaSalir = window.confirm(
        "¿Quieres detener el sistema? Dejará de funcionar en todas sus pestañas."
    );

    // Si el usuario cancela, termina esta función.
    if (!deseaSalir) {
        return;
    }

    // Evita pulsar el botón varias veces mientras se procesa la solicitud.
    botonSalir.disabled = true;

    try {

        // Envía al servidor una solicitud para detenerse.
        const respuesta = await fetch("/api/salir", {
            method: "POST",

            // Esta cabecera identifica una solicitud de nuestra interfaz.
            headers: {
                "X-Sistema-Local": "salir"
            }
        });

        // Si el servidor rechazó la solicitud, genera un error.
        if (!respuesta.ok) {
            throw new Error("El servidor no aceptó la solicitud.");
        }

        // Espera a recibir la respuesta completa.
        await respuesta.json();

        //intentamos cerrar unicamente esta pestaña
        window.close()

        // Crea un título para la pantalla de salida.
        const tituloSalida = document.createElement("h2");

        // Define el texto del título.
        tituloSalida.textContent = "Cierre del sistema solicitado";

        // Crea un mensaje para el usuario.
        const textoSalida = document.createElement("p");

        // Explica cómo volver a utilizar el sistema.
        textoSalida.textContent =
            "Ya puedes cerrar esta pestaña. Para volver a entrar, pulsa el icono Sistema Administrativo.";

        // Encuentra el área principal.
        const contenidoPrincipal = document.querySelector("main");

        // Sustituye su contenido por el mensaje de salida.
        contenidoPrincipal.replaceChildren(tituloSalida, textoSalida);

        // Desactiva los botones del menú al salir.
        document.querySelectorAll(".menu-lateral button").forEach(function (boton) {
            boton.disabled = true;
        });

    } catch (error) {

        // Informa que no se pudo confirmar la solicitud de cierre.
        window.alert("No se pudo confirmar el cierre: " + error.message);

        // Permite volver a intentarlo.
        botonSalir.disabled = false;

    }

});