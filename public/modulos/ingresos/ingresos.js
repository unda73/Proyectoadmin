// export permite que app.js importe esta función.
// raiz es la sección donde se insertó ingresos.html.
// alRegistrar es la función que actualiza el resumen de Inicio.
export function iniciarIngresos(raiz, alRegistrar) {

    // Pagos del ingreso que todavía estamos preparando.
    const pagos = [];

    // Ingresos confirmados durante esta sesión.
    // Esta lista se pierde cuando recargamos o cerramos la página.
    const registros = [];

    // Guarda el total confirmado en centavos.
    let totalRegistrado = 0;

    // Busca elementos únicamente dentro de esta pantalla.
    function buscar(selector) {
        return raiz.querySelector(selector);
    }

    // Obtiene los formularios.
    const formularioDatos = buscar("#ing-datos");
    const formularioPago = buscar("#ing-formulario-pago");

    // Obtiene los campos de datos generales.
    const fecha = buscar("#ing-fecha");
    const turno = buscar("#ing-turno");
    const responsable = buscar("#ing-responsable");

    // Obtiene los campos para agregar un pago.
    const metodo = buscar("#ing-metodo");
    const destino = buscar("#ing-destino");
    const importe = buscar("#ing-importe");

    // Obtiene la tabla y el espacio para mensajes.
    const detalle = buscar("#ing-detalle");
    const aviso = buscar("#ing-aviso");

    // Nombres que mostramos en la tabla.
    const nombresMetodos = {
        efectivo: "Efectivo",
        tarjeta: "Tarjeta",
        transferencia: "Transferencia"
    };

    // Opciones de ejemplo.
    // Más adelante podrán venir de los módulos de bancos y terminales.
    const destinos = {
        efectivo: [],
        tarjeta: ["BBVA Principal", "Clip"],
        transferencia: ["Cuenta BBVA"]
    };

    // Prepara el formato de moneda mexicana.
    const moneda = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
    });

    // Convierte centavos a pesos solamente para mostrarlos.
    function mostrarDinero(centavos) {
        return moneda.format(centavos / 100);
    }

    // Coloca la fecha actual usando la fecha local de la computadora.
    function colocarFechaActual() {

        const hoy = new Date();

        const anio = hoy.getFullYear();

        // Los meses comienzan en cero; sumamos uno.
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");

        fecha.value = `${anio}-${mes}-${dia}`;
    }

    // Cambia las opciones según el método de pago seleccionado.
    function actualizarDestinos() {

        // Elimina las opciones anteriores.
        destino.replaceChildren();

        const esEfectivo = metodo.value === "efectivo";

        // En efectivo no necesitamos una terminal o cuenta.
        destino.disabled = esEfectivo;
        destino.required = !esEfectivo;

        if (esEfectivo) {

            destino.add(new Option("No aplica", ""));

        } else {

            // La opción vacía obliga a elegir una cuenta o terminal.
            destino.add(new Option("Selecciona una opción", ""));

            destinos[metodo.value].forEach(function (nombre) {
                destino.add(new Option(nombre, nombre));
            });
        }
    }

    // Suma los pagos del ingreso que estamos preparando.
    function calcularTotales() {

        const totales = {
            efectivo: 0,
            tarjeta: 0,
            transferencia: 0,
            general: 0
        };

        pagos.forEach(function (pago) {

            totales[pago.metodo] += pago.centavos;
            totales.general += pago.centavos;
        });

        return totales;
    }
    // Calcula el resumen de la fecha seleccionada.
// Incluye registros confirmados y la captura actual como vista previa.
function actualizarResumenDia() {

    // Comienza los dos turnos en cero.
    const totalesDia = {
        Matutino: 0,
        Vespertino: 0
    };

    // Obtiene la fecha del formulario, por ejemplo: 2026-10-16.
    const fechaSeleccionada = fecha.value;

    // Recorre los ingresos que ya confirmamos durante esta sesión.
    registros.forEach(function (registro) {

        // Solo suma los registros de la fecha seleccionada.
        if (registro.fecha === fechaSeleccionada) {
            totalesDia[registro.turno] += registro.totalCentavos;
        }
    });

    // Comprueba si seleccionamos uno de los dos turnos disponibles.
    const turnoValido =
        turno.value === "Matutino" ||
        turno.value === "Vespertino";

    // Los pagos actuales todavía no están registrados.
    // Los mostramos como vista previa en el turno seleccionado.
    if (fechaSeleccionada && turnoValido) {
        totalesDia[turno.value] += calcularTotales().general;
    }

    // Suma ambos turnos para obtener el total del día.
    const totalDia = totalesDia.Matutino + totalesDia.Vespertino;

    // Actualiza las tarjetas del resumen.
    buscar("#ing-total-matutino").textContent =
        mostrarDinero(totalesDia.Matutino);

    buscar("#ing-total-vespertino").textContent =
        mostrarDinero(totalesDia.Vespertino);

    buscar("#ing-total-dia").textContent =
        mostrarDinero(totalDia);

    // Muestra la fecha sin convertirla a otra zona horaria.
    if (fechaSeleccionada) {

        const partes = fechaSeleccionada.split("-");

        buscar("#ing-fecha-resumen").textContent =
            `Fecha: ${partes[2]}/${partes[1]}/${partes[0]}`;

    } else {

        buscar("#ing-fecha-resumen").textContent =
            "Selecciona una fecha.";
    }

    // Explica qué cantidades se están mostrando.
    const notaResumen = buscar("#ing-nota-resumen");

    if (!fechaSeleccionada) {

        notaResumen.textContent =
            "Selecciona la fecha para consultar sus ingresos.";

    } else if (pagos.length > 0 && !turnoValido) {

        notaResumen.textContent =
            "Selecciona un turno para incluir los pagos que estás preparando.";

    } else if (pagos.length > 0) {

        notaResumen.textContent =
            "Incluye los pagos que estás preparando para el turno " +
            turno.value.toLowerCase() +
            ". Confírmalos con Registrar ingreso.";

    } else {

        notaResumen.textContent =
            "Muestra los ingresos confirmados de este día durante la sesión.";
    }
}

    // Dibuja las filas de la tabla y actualiza el resumen lateral.
    function dibujarPagos() {

        // Elimina las filas anteriores antes de reconstruir la tabla.
        detalle.replaceChildren();

        if (pagos.length === 0) {

            const fila = document.createElement("tr");
            const celda = document.createElement("td");

            // Hace que el mensaje ocupe las cuatro columnas.
            celda.colSpan = 4;
            celda.textContent = "Todavía no has agregado pagos.";

            fila.appendChild(celda);
            detalle.appendChild(fila);
        }

        pagos.forEach(function (pago, indice) {

            const fila = document.createElement("tr");

            // Prepara el texto de las primeras tres columnas.
            const valores = [
                nombresMetodos[pago.metodo],
                pago.destino,
                mostrarDinero(pago.centavos)
            ];

            valores.forEach(function (valor) {

                const celda = document.createElement("td");

                // textContent coloca el contenido como texto.
                celda.textContent = valor;

                fila.appendChild(celda);
            });

            // Crea la columna de acciones.
            const celdaAccion = document.createElement("td");
            const botonEliminar = document.createElement("button");

            botonEliminar.type = "button";
            botonEliminar.className = "ing-boton ing-eliminar";
            botonEliminar.textContent = "Eliminar";

            botonEliminar.addEventListener("click", function () {

                // Elimina únicamente el pago seleccionado.
                pagos.splice(indice, 1);

                // Actualiza la tabla y los totales.
                dibujarPagos();

                aviso.textContent = "Pago eliminado del detalle.";
            });

            celdaAccion.appendChild(botonEliminar);
            fila.appendChild(celdaAccion);
            detalle.appendChild(fila);
        });

        // Actualiza el resumen diario después de agregar o eliminar un pago.
actualizarResumenDia();
    }

    // Actualiza terminales o cuentas al cambiar de método.
    metodo.addEventListener("change", actualizarDestinos);
    // Consulta los ingresos correspondientes a la fecha seleccionada.
fecha.addEventListener("change", actualizarResumenDia);

// Coloca la vista previa de los pagos en el turno seleccionado.
turno.addEventListener("change", actualizarResumenDia);

    // Atiende el botón Agregar pago.
    formularioPago.addEventListener("submit", function (evento) {

        // Evita que el formulario recargue la página.
        evento.preventDefault();

        // Comprueba las restricciones de los campos HTML.
        if (!formularioPago.reportValidity()) {
            return;
        }

        const texto = importe.value.trim();

        // Acepta números con un máximo de dos decimales.
        // Ejemplos válidos: 150, 150.0, 150.00 y 150.01.
        if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
            aviso.textContent = "Escribe una cantidad con máximo dos decimales.";
            return;
        }

        // Separa los pesos y los centavos.
        const partes = texto.split(".");
        const pesos = Number(partes[0]);
        const decimales = (partes[1] || "").padEnd(2, "0");

        // Trabaja con centavos enteros para sumar dinero.
        const centavos = pesos * 100 + Number(decimales);

        if (
            !Number.isSafeInteger(centavos) ||
            centavos <= 0 ||
            centavos > 99999999999
        ) {
            aviso.textContent = "Escribe una cantidad válida mayor que cero.";
            return;
        }

        // Comprueba que la suma siga siendo un entero seguro.
        const nuevoTotal = calcularTotales().general + centavos;

        if (!Number.isSafeInteger(nuevoTotal)) {
            aviso.textContent = "El total supera el límite permitido.";
            return;
        }

        // Agrega el pago al ingreso que estamos preparando.
        pagos.push({
            metodo: metodo.value,
            destino: metodo.value === "efectivo"
                ? "No aplica"
                : destino.value,
            centavos: centavos
        });

        dibujarPagos();

        // Limpia solamente el importe para capturar otro pago.
        importe.value = "";
        importe.focus();

        aviso.textContent =
            "Pago agregado. Pulsa Registrar ingreso para confirmarlo.";
    });

    // Limpia los campos para comenzar otro ingreso.
    function limpiarCaptura() {

        pagos.length = 0;

        formularioDatos.reset();
        formularioPago.reset();

        colocarFechaActual();
        actualizarDestinos();
        dibujarPagos();
    }

    // Atiende el botón Registrar ingreso.
    // Aunque está fuera del formulario, su atributo form lo conecta.
    formularioDatos.addEventListener("submit", function (evento) {

        evento.preventDefault();

        // Verifica fecha, turno y responsable.
        if (!formularioDatos.reportValidity()) {
            return;
        }

        if (pagos.length === 0) {
            aviso.textContent = "Agrega al menos un pago antes de registrar.";
            return;
        }

        const totalIngreso = calcularTotales().general;
        const nuevoAcumulado = totalRegistrado + totalIngreso;

        if (!Number.isSafeInteger(nuevoAcumulado)) {
            aviso.textContent = "El acumulado supera el límite permitido.";
            return;
        }

        // Guarda una copia del ingreso en memoria.
        registros.push({
            fecha: fecha.value,
            turno: turno.value,
            responsable: responsable.value,

            // Copia los pagos para conservarlos al limpiar la captura.
            pagos: pagos.map(function (pago) {
                return { ...pago };
            }),

            totalCentavos: totalIngreso
        });

        totalRegistrado = nuevoAcumulado;

        // Comunica a app.js el total acumulado de la sesión.
        alRegistrar(totalRegistrado);

        // Prepara el formulario para el siguiente ingreso.
        // Conserva la fecha que acabamos de registrar.
// Así el resumen no cambia a hoy si capturamos otro día.
const fechaRegistrada = fecha.value;

// Limpia los pagos y prepara una nueva captura.
limpiarCaptura();

// Recupera la fecha registrada y muestra sus totales.
fecha.value = fechaRegistrada;
actualizarResumenDia();

        aviso.textContent =
            `Ingreso de ${mostrarDinero(totalIngreso)} registrado en esta sesión. ` +
            "Los registros se perderán al recargar.";
    });

    // Atiende el botón Cancelar.
    buscar("#ing-cancelar").addEventListener("click", function () {

        const confirmar = window.confirm(
            "¿Quieres limpiar los datos y pagos que estás preparando?"
        );

        if (!confirmar) {
            return;
        }

        // Limpia la captura actual.
        // Los ingresos ya confirmados permanecen en la sesión.
        limpiarCaptura();

        aviso.textContent = "Captura cancelada.";
    });

    // Prepara la pantalla al cargarla por primera vez.
    colocarFechaActual();
    actualizarDestinos();
    dibujarPagos();
}