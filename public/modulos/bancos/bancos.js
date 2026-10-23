// app.js llamará esta función después de cargar bancos.html.
export function iniciarBancos(contenedor) {

    // Guarda las cuentas temporalmente mientras está abierta la página.
    const cuentas = [];
    // Guarda la cuenta que estamos editando.
// null significa que estamos capturando una cuenta nueva.
let cuentaEnEdicion = null;
    // Encuentra los elementos dentro del módulo.
    const formulario = contenedor.querySelector("#formulario-banco");
    const lista = contenedor.querySelector("#bancos-lista");
    const contador = contenedor.querySelector("#bancos-contador");
    const buscador = contenedor.querySelector("#bancos-buscar");
    const guardar = contenedor.querySelector("#banco-guardar");
    const aviso = contenedor.querySelector(".bancos-aviso");

    // Habilita el botón y las validaciones del formulario.
    guardar.disabled = false;
    guardar.type = "submit";

    // Habilita la búsqueda.
    buscador.disabled = false;

    // Permite anunciar los mensajes sin mover el cursor.
    aviso.setAttribute("role", "status");
    aviso.textContent =
        "Prueba de interfaz: los registros se pierden al recargar.";

    // Convierte el texto para buscar sin distinguir mayúsculas ni acentos.
    function normalizar(texto) {
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    // Dibuja las tarjetas del panel derecho.
    function mostrarCuentas() {

        // Quita las tarjetas anteriores.
        lista.replaceChildren();

        const total = cuentas.length;

        contador.textContent =
            `${total} ${total === 1 ? "cuenta registrada" : "cuentas registradas"}`;

        // Obtiene lo que se escribió en el buscador.
        const texto = normalizar(buscador.value);

        // Filtra por banco o nombre de la cuenta.
        const resultados = cuentas.filter(function (cuenta) {
            const nombre = normalizar(
                cuenta.banco + " " + cuenta.nombreCuenta
            );

            return nombre.includes(texto);
        });

        // Muestra un mensaje si no hay resultados.
        if (resultados.length === 0) {
            const mensaje = document.createElement("p");
            mensaje.className = "bancos-vacio";

            mensaje.textContent = total === 0
                ? "Todavía no hay cuentas registradas."
                : "No se encontraron cuentas con esa búsqueda.";

            lista.append(mensaje);
            return;
        }

        // Crea una tarjeta por cada cuenta encontrada.
        resultados.forEach(function (cuenta) {

            const tarjeta = document.createElement("article");
            tarjeta.className = "bancos-tarjeta";

            const nombre = document.createElement("h4");
            nombre.textContent = cuenta.banco;

            const detalle = document.createElement("p");

            // Muestra únicamente los últimos cuatro dígitos.
            detalle.textContent =
                `${cuenta.nombreCuenta} · Terminación ${cuenta.numeroCuenta.slice(-4)}`;

            const estado = document.createElement("span");
            estado.className = "bancos-estado";

            estado.textContent =
                cuenta.estado === "activa" ? "Activa" : "Inactiva";

            estado.classList.toggle(
                "bancos-estado-inactivo",
                cuenta.estado === "inactiva"
            );

            // textContent muestra los datos como texto de forma segura.
        // Crea el botón para eliminar esta cuenta.
const eliminar = document.createElement("button");
eliminar.type = "button";
eliminar.className = "bancos-eliminar";
eliminar.textContent = "Eliminar";

// Indica qué cuenta elimina para quienes usan lector de pantalla.
eliminar.setAttribute(
    "aria-label",
    `Eliminar ${cuenta.nombreCuenta} de ${cuenta.banco}`
);

// Atiende el clic en Eliminar.
eliminar.addEventListener("click", function () {

    // Solicita confirmación antes de quitar la tarjeta.
    const confirmar = window.confirm(
        `¿Eliminar la cuenta "${cuenta.nombreCuenta}" de ${cuenta.banco}?`
    );

    if (!confirmar) {
        return;
    }

    // Encuentra la cuenta original, incluso si usamos el buscador.
    const posicion = cuentas.indexOf(cuenta);

    if (posicion === -1) {
        return;
    }
    // Si eliminamos la cuenta que se estaba editando,
// limpia el formulario y termina esa edición.
if (cuentaEnEdicion === cuenta) {
    formulario.reset();
}

    // Quita únicamente esa cuenta del arreglo.
    cuentas.splice(posicion, 1);

    // Actualiza las tarjetas y el contador.
    mostrarCuentas();

    aviso.textContent = "Cuenta eliminada de la lista temporal.";

    // Devuelve el foco a un elemento que sigue en pantalla.
    buscador.focus();
});

// Agrupa el estado y el botón.
const acciones = document.createElement("div");
acciones.className = "bancos-tarjeta-acciones";
// Crea el botón Editar.
const editar = document.createElement("button");
editar.type = "button";
editar.className = "bancos-editar";
editar.textContent = "Editar";

editar.setAttribute(
    "aria-label",
    `Editar ${cuenta.nombreCuenta} de ${cuenta.banco}`
);

editar.addEventListener("click", function () {

    // Recuerda qué cuenta vamos a modificar.
    cuentaEnEdicion = cuenta;

    // Coloca los datos en los campos usando su atributo name.
    Object.entries(cuenta).forEach(function ([nombreCampo, valor]) {
        const campo = formulario.elements.namedItem(nombreCampo);

        if (campo) {
            campo.value = valor;
        }
    });

    guardar.textContent = "Guardar cambios";
    aviso.textContent =
        "Editando la cuenta. Pulsa Cancelar para descartar los cambios.";

    formulario.querySelector("#banco-nombre").focus();
});

// Muestra estado, Editar y Eliminar.
acciones.append(estado, editar, eliminar);

// Agrega el contenido a la tarjeta.
tarjeta.append(nombre, detalle, acciones);
            lista.append(tarjeta);
        });
    }

    // Atiende Guardar banco y también la tecla Enter.
    formulario.addEventListener("submit", function (evento) {

        // Evita que el formulario recargue la página.
        evento.preventDefault();

        // Lee los campos por sus atributos name.
        const datos = new FormData(formulario);

        const cuenta = {
            banco: datos.get("banco").trim(),
            nombreCuenta: datos.get("nombreCuenta").trim(),
            numeroCuenta: datos.get("numeroCuenta").trim(),
            clabe: datos.get("clabe").trim(),
            titular: datos.get("titular").trim(),
            tipoCuenta: datos.get("tipoCuenta"),
            saldoInicial: datos.get("saldoInicial") || "0.00",
            estado: datos.get("estado"),
            observaciones: datos.get("observaciones").trim()
        };

        // Evita registrar nombres que contengan solo espacios.
        if (!cuenta.banco || !cuenta.nombreCuenta || !cuenta.titular) {
            aviso.textContent =
                "Completa banco, nombre de la cuenta y titular con texto válido.";
            return;
        }

        // Al editar, excluye la propia cuenta de la búsqueda de duplicados.
const repetida = cuentas.some(function (actual) {
    return actual !== cuentaEnEdicion
        && normalizar(actual.banco) === normalizar(cuenta.banco)
        && actual.numeroCuenta === cuenta.numeroCuenta;
});

        if (repetida) {
            aviso.textContent =
                "Ese número de cuenta ya está registrado en ese banco.";
            return;
        }
        // Recuerda si esta operación es una edición.
const esEdicion = cuentaEnEdicion !== null;

if (esEdicion) {

    // Actualiza la cuenta existente sin crear otra tarjeta.
    Object.assign(cuentaEnEdicion, cuenta);

} else {

    // Agrega una cuenta nueva.
    cuentas.unshift(cuenta);
}

// Limpia los campos y termina el modo de edición.
formulario.reset();
buscador.value = "";

// Actualiza las tarjetas.
mostrarCuentas();

aviso.textContent = esEdicion
    ? "Cambios aplicados a la lista temporal. Se perderán al recargar."
    : "Cuenta agregada a la prueba. Se perderá al recargar la página.";

        // Prepara el primer campo para otra captura.
        formulario.querySelector("#banco-nombre").focus();
    });

    // Actualiza los resultados mientras escribimos.
    buscador.addEventListener("input", mostrarCuentas);

    formulario.addEventListener("reset", function () {

    // Sale del modo de edición sin modificar la cuenta.
    cuentaEnEdicion = null;

    guardar.textContent = "Guardar banco";

    aviso.textContent =
        "Prueba de interfaz: los registros se pierden al recargar.";
});
    // Muestra el estado inicial del listado.
    mostrarCuentas();
}