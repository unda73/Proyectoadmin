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

// Guarda los ingresos de esta sesión en una lista.
const ingresos = [];

// Encuentra el formulario.
const formularioIngreso = document.getElementById("formulario-ingreso");

// Encuentra sus campos.
const fechaIngreso = document.getElementById("fecha-ingreso");
const conceptoIngreso = document.getElementById("concepto-ingreso");
const cantidadIngreso = document.getElementById("cantidad-ingreso");

// Encuentra la tabla, el total y el mensaje.
const tablaIngresos = document.getElementById("tabla-ingresos");
const totalIngresos = document.getElementById("total-ingresos");
const avisoIngreso = document.getElementById("aviso-ingreso");

// Prepara un formato de moneda mexicana.
const formatoPesos = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
});

// Obtiene la fecha actual de esta computadora.
const hoy = new Date();

// Obtiene el año.
const anio = hoy.getFullYear();

// Los meses empiezan en cero, por eso sumamos uno.
// padStart agrega un cero cuando el número tiene un solo dígito.
const mes = String(hoy.getMonth() + 1).padStart(2, "0");

// Obtiene el día con dos dígitos.
const dia = String(hoy.getDate()).padStart(2, "0");

// Coloca hoy como fecha inicial del formulario.
fechaIngreso.value = `${anio}-${mes}-${dia}`;

// Quita el error personalizado cuando el usuario vuelve a escribir.
conceptoIngreso.addEventListener("input", function () {
    conceptoIngreso.setCustomValidity("");
});

// Detecta el envío del formulario.
formularioIngreso.addEventListener("submit", function (evento) {

    // Evita que el formulario recargue la página.
    evento.preventDefault();

    // Lee el concepto y elimina espacios al principio y al final.
    const concepto = conceptoIngreso.value.trim();

    // Rechaza conceptos que solo contienen espacios.
    if (concepto === "") {
        conceptoIngreso.setCustomValidity("Escribe un concepto.");
        conceptoIngreso.reportValidity();
        return;
    }

    // Separa los pesos y los centavos del texto capturado.
    const partes = cantidadIngreso.value.split(".");

    // Convierte los pesos en un número entero.
    const pesos = Number(partes[0]);

    // Completa la parte decimal hasta tener dos dígitos.
    const centavos = Number((partes[1] || "").padEnd(2, "0"));

    // Guarda el importe como centavos enteros para sumarlo.
    const montoCentavos = pesos * 100 + centavos;

    // Comprueba que el importe sea válido.
    if (!Number.isSafeInteger(montoCentavos) || montoCentavos <= 0) {
        avisoIngreso.textContent = "Escribe una cantidad válida mayor que cero.";
        return;
    }

    // Crea un objeto con los datos del ingreso.
    const nuevoIngreso = {
        fecha: fechaIngreso.value,
        concepto: concepto,
        montoCentavos: montoCentavos
    };

    // Agrega el objeto a la lista.
    ingresos.push(nuevoIngreso);

    // Actualiza la tabla y el total.
    mostrarIngresos();

    // Limpia el concepto y la cantidad, conservando la fecha.
    conceptoIngreso.value = "";
    cantidadIngreso.value = "";

    // Confirma el registro temporal.
    avisoIngreso.textContent = "Ingreso agregado a esta sesión.";

    // Coloca el cursor en el concepto para capturar otro ingreso.
    conceptoIngreso.focus();

});

// Dibuja la tabla utilizando la lista de ingresos.
function mostrarIngresos() {

    // Elimina las filas que se mostraban anteriormente.
    tablaIngresos.replaceChildren();

    // Comienza la suma en cero.
    let totalCentavos = 0;

    // Recorre todos los ingresos.
    ingresos.forEach(function (ingreso) {

        // Crea una fila.
        const fila = document.createElement("tr");

        // Crea las tres celdas.
        const celdaFecha = document.createElement("td");
        const celdaConcepto = document.createElement("td");
        const celdaCantidad = document.createElement("td");

        // Cambia AAAA-MM-DD por DD/MM/AAAA para mostrar la fecha.
        celdaFecha.textContent = ingreso.fecha.split("-").reverse().join("/");

        // Inserta el concepto como texto.
        celdaConcepto.textContent = ingreso.concepto;

        // Convierte los centavos a pesos y aplica formato de moneda.
        celdaCantidad.textContent = formatoPesos.format(
            ingreso.montoCentavos / 100
        );

        // Alinea el importe a la derecha.
        celdaCantidad.classList.add("columna-cantidad");

        // Coloca las celdas dentro de la fila.
        fila.append(celdaFecha, celdaConcepto, celdaCantidad);

        // Coloca la fila dentro de la tabla.
        tablaIngresos.append(fila);

        // Acumula la cantidad del ingreso.
        totalCentavos += ingreso.montoCentavos;

    });

    // Muestra la suma debajo de la tabla.
    totalIngresos.textContent = formatoPesos.format(totalCentavos / 100);

    // Encuentra la cantidad de ingresos en la pantalla Inicio.
const tarjetaIngresos = document.getElementById("resumen-ingresos");

// Encuentra la cantidad de gastos en la pantalla Inicio.
const tarjetaGastos = document.getElementById("resumen-gastos");

// Encuentra el saldo en la pantalla Inicio.
const tarjetaSaldo = document.getElementById("resumen-saldo");

// Por ahora no tenemos registros de gastos.
const gastosCentavos = 0;

// Calcula el saldo de los movimientos de esta sesión.
const saldoCentavos = totalCentavos - gastosCentavos;

// Muestra los ingresos acumulados.
tarjetaIngresos.textContent = formatoPesos.format(totalCentavos / 100);

// Muestra los gastos, que todavía están en cero.
tarjetaGastos.textContent = formatoPesos.format(gastosCentavos / 100);

// Muestra el saldo calculado.
tarjetaSaldo.textContent = formatoPesos.format(saldoCentavos / 100);

}