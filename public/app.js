// Encuentra los botones que tienen el atributo data-pantalla.
const botonesMenu = document.querySelectorAll("[data-pantalla]");

// Encuentra las secciones que representan las pantallas.
const pantallas = document.querySelectorAll(".pantalla");

// Guarda la carga del módulo para no cargarlo varias veces.
let cargaIngresos = null;
// Guarda la carga de Bancos para no repetirla al cambiar de pantalla.
let cargaBancos = null;

// Guarda los ingresos confirmados de esta sesión en centavos.
let ingresosConfirmados = 0;

// Por ahora Gastos no tiene formulario, por eso permanece en cero.
let gastosConfirmados = 0;

// Indica si estamos cerrando el sistema.
let cerrandoSistema = false;

// Prepara el formato de moneda mexicana.
const moneda = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
});

// Actualiza las tres tarjetas de la pantalla Inicio.
function actualizarInicio() {

    // Convierte centavos a pesos para mostrar el dinero.
    document.getElementById("resumen-ingresos").textContent =
        moneda.format(ingresosConfirmados / 100);

    document.getElementById("resumen-gastos").textContent =
        moneda.format(gastosConfirmados / 100);

    // Calcula el saldo disponible.
    const saldo = ingresosConfirmados - gastosConfirmados;

    document.getElementById("resumen-saldo").textContent =
        moneda.format(saldo / 100);
}

// Busca los archivos del módulo y prepara su funcionamiento.
async function prepararIngresos() {

    // Encuentra el espacio vacío que dejamos en index.html.
    const contenedor = document.getElementById("pantalla-ingresos");

    // Muestra un mensaje mientras se obtiene el archivo.
    contenedor.textContent = "Cargando Ingresos…";

    // Solicita el HTML de Ingresos.
    // La ruta es relativa a la dirección de index.html.
    const respuesta = await fetch("./modulos/ingresos/ingresos.html");

    // Comprueba si el servidor encontró el archivo.
    if (!respuesta.ok) {
        throw new Error(
            `No se pudo cargar ingresos.html. Código: ${respuesta.status}`
        );
    }

    // Lee el contenido del archivo como texto.
    const html = await respuesta.text();

    // Importa el archivo que contiene las funciones de Ingresos.
    const modulo = await import("./modulos/ingresos/ingresos.js");

    // Coloca nuestra plantilla HTML dentro de la sección.
    // Este contenido proviene de nuestro propio archivo.
    contenedor.innerHTML = html;

    // Inicia los formularios y botones del módulo.
    // El módulo nos avisará cuando cambie el total registrado.
    modulo.iniciarIngresos(contenedor, function (totalCentavos) {

        ingresosConfirmados = totalCentavos;

        // Refleja el nuevo total en la pantalla Inicio.
        actualizarInicio();
    });
}

// Evita repetir la carga cuando cambiamos de pantalla.
async function cargarIngresos() {

    // Si ya existe una carga, reutiliza su resultado.
    if (cargaIngresos) {
        return cargaIngresos;
    }

    // Guarda la operación de carga.
    cargaIngresos = prepararIngresos();

    try {

        // Espera a que termine de prepararse el módulo.
        await cargaIngresos;

    } catch (error) {

        // Permite volver a intentarlo si ocurrió un error.
        cargaIngresos = null;

        // Entrega el error al código que llamó esta función.
        throw error;
    }
}
// Carga la interfaz y prepara sus botones.
async function prepararBancos() {

    const contenedor = document.getElementById("pantalla-BancosYCheques");

    contenedor.textContent = "Cargando Bancos y Cheques…";

    // Obtiene el formulario.
    const respuesta = await fetch("./modulos/bancos/bancos.html");

    if (!respuesta.ok) {
        throw new Error(
            `No se pudo cargar bancos.html. Código: ${respuesta.status}`
        );
    }

    const html = await respuesta.text();

    // Importa las funciones del módulo de Bancos.
    const modulo = await import("./modulos/bancos/bancos.js");

    // Primero coloca los campos en la pantalla.
    contenedor.innerHTML = html;

    // Después conecta sus eventos.
    modulo.iniciarBancos(contenedor);
}

// Evita volver a cargar el formulario cada vez que pulsamos el botón.
async function cargarBancos() {

    // Reutiliza la carga si ya había comenzado o terminado.
    if (cargaBancos) {
        return cargaBancos;
    }

    // Guarda la operación de carga.
    cargaBancos = prepararBancos();

    try {

        // Espera a que termine.
        await cargaBancos;

    } catch (error) {

        // Permite intentarlo nuevamente si falla.
        cargaBancos = null;

        // Envía el error al código del botón.
        throw error;
    }
}

// Asigna una acción a cada botón del menú.
botonesMenu.forEach(function (boton) {

    boton.addEventListener("click", async function () {

        // Evita navegar mientras se está cerrando el sistema.
        if (cerrandoSistema) {
            return;
        }

        // Lee el ID de la pantalla que corresponde al botón.
        const idPantalla = boton.dataset.pantalla;

        // Comprueba que la pantalla exista.
        if (!document.getElementById(idPantalla)) {
            console.error("No existe la pantalla:", idPantalla);
            return;
        }

        // Muestra la pantalla seleccionada y oculta las demás.
        pantallas.forEach(function (pantalla) {
            pantalla.hidden = pantalla.id !== idPantalla;
        });

        // Actualiza el aspecto de los botones.
        botonesMenu.forEach(function (otroBoton) {

            const seleccionado = otroBoton === boton;

            otroBoton.classList.toggle("activo", seleccionado);

            // Indica cuál es el botón seleccionado.
            if (seleccionado) {
                otroBoton.setAttribute("aria-current", "page");
            } else {
                otroBoton.removeAttribute("aria-current");
            }
        });
                // Carga el módulo cuando se selecciona Bancos y Cheques.
        if (idPantalla === "pantalla-BancosYCheques") {

            try {

                await cargarBancos();

            } catch (error) {

                // Muestra el error dentro de la pantalla de Bancos.
                document.getElementById("pantalla-BancosYCheques").textContent =
                    "No se pudo cargar Bancos y Cheques. " +
                    "Revisa que exista modulos/bancos/bancos.html. " +
                    "Pulsa Bancos y Cheques para intentarlo otra vez.";

                // Muestra el detalle técnico en la consola.
                console.error("Error al cargar Bancos:", error);
            }
        }

        // Carga el módulo cuando se selecciona Ingresos.
        if (idPantalla === "pantalla-ingresos") {

            try {

                await cargarIngresos();

            } catch (error) {

                // Muestra una explicación dentro de la pantalla.
                document.getElementById("pantalla-ingresos").textContent =
                    "No se pudo cargar Ingresos. Revisa que existan " +
                    "ingresos.html e ingresos.js en modulos/ingresos. " +
                    "Pulsa Ingresos para intentarlo otra vez.";

                // Guarda el detalle en la consola del navegador.
                console.error("Error al cargar Ingresos:", error);
            }
        }
    });
});

// Encuentra el botón Salir del menú.
const botonSalir = document.getElementById("boton-salir");

// Atiende el clic en Salir del sistema.
botonSalir.addEventListener("click", async function () {

    if (cerrandoSistema) {
        return;
    }

    // Advierte que los registros todavía son temporales.
    const confirmar = window.confirm(
        "¿Quieres salir del sistema? Los registros de esta sesión se perderán."
    );

    if (!confirmar) {
        return;
    }

    // Evita repetir la solicitud mientras esperamos.
    cerrandoSistema = true;
    botonSalir.disabled = true;

    try {

        // Solicita el cierre a la ruta que ya tiene tu servidor.
        const respuesta = await fetch("/api/salir", {
            method: "POST",
            headers: {
                "X-Sistema-Local": "salir"
            }
        });

        if (!respuesta.ok) {
            throw new Error("El servidor rechazó la solicitud de cierre.");
        }

        // Comprueba que el servidor aceptó detenerse.
        const datos = await respuesta.json();

        if (!datos.aceptado) {
            throw new Error("El servidor no confirmó el cierre.");
        }

        // Deshabilita la navegación porque el servidor se detendrá.
        botonesMenu.forEach(function (boton) {
            boton.disabled = true;
        });

        // Muestra un mensaje si Chrome no permite cerrar la pestaña.
        const contenido = document.querySelector(".contenido");
        const titulo = document.createElement("h2");
        const mensaje = document.createElement("p");

        titulo.textContent = "Sistema cerrado";
        mensaje.textContent = "Ya puedes cerrar esta pestaña.";

        contenido.replaceChildren(titulo, mensaje);

        // Chrome puede bloquear esta acción si no se abrió con JavaScript.
        window.close();

    } catch (error) {

        // Permite volver a intentar salir si la solicitud falló.
        cerrandoSistema = false;
        botonSalir.disabled = false;

        console.error("Error al salir:", error);

        window.alert(
            "No se pudo cerrar el servidor. " +
            "Abre el sistema desde http://127.0.0.1:3000 e intenta otra vez."
        );
    }
});

// Muestra los valores iniciales al abrir el sistema.
actualizarInicio();