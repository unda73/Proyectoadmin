// Carga Express para crear el servidor.
const express = require("express");

// Permite construir rutas compatibles con Linux y Windows.
const path = require("node:path");

// Crea la aplicación.
const app = express();

// Define el puerto del servidor.
const PUERTO = 3000;

// Limita el acceso a esta computadora.
const HOST = "127.0.0.1";

// Construye la dirección del sistema.
const URL_SISTEMA = `http://${HOST}:${PUERTO}`;

// Identifica esta aplicación al comprobar un servidor existente.
const ID_SISTEMA = "sistema-administrativo-local-v1";

// Obtiene la ubicación de la interfaz.
const carpetaPublica = path.join(__dirname, "public");

// Crea una dirección para comprobar si nuestro sistema está activo.
app.get("/api/estado", function (req, res) {

    // Evita guardar esta respuesta en caché.
    res.setHeader("Cache-Control", "no-store");

    // Responde con el identificador de nuestra aplicación.
    res.json({
        sistema: ID_SISTEMA
    });

});


// Recibe la solicitud para detener el sistema.
app.post("/api/salir", function (req, res) {

    // Comprueba que la solicitud venga de la dirección de nuestra interfaz.
    const origenCorrecto = req.get("Origin") === URL_SISTEMA;

    // Comprueba que incluya la cabecera enviada por nuestro botón.
    const cabeceraCorrecta = req.get("X-Sistema-Local") === "salir";

    // Rechaza solicitudes que no cumplan ambas condiciones.
    if (!origenCorrecto || !cabeceraCorrecta) {
        return res.status(403).json({
            error: "Solicitud de cierre no permitida."
        });
    }

    // Evita mantener abierta esta conexión después de la respuesta.
    res.setHeader("Connection", "close");

    // Espera a enviar la respuesta antes de comenzar el cierre.
    res.once("finish", function () {

        // Deja de aceptar conexiones y espera que terminen las activas.
        servidor.close(function () {

            // Registra que el servidor se detuvo.
            console.log("Sistema detenido correctamente.");

        });

    });

    // Confirma a la interfaz que aceptamos la solicitud.
    res.json({
        aceptado: true
    });

});

// Entrega al navegador los archivos de la carpeta public.
app.use(express.static(carpetaPublica));

// Agrupa las instrucciones para abrir Chrome.
// Así podemos utilizarlas desde distintas partes del código.
async function abrirChrome() {

    // Carga el paquete open.
    const moduloOpen = await import("open");

    // Obtiene su función principal.
    const abrirNavegador = moduloOpen.default;

    // Abre la dirección del sistema en Google Chrome.
    await abrirNavegador(URL_SISTEMA, {
        app: {
            name: moduloOpen.apps.chrome
        }
    });

}

// Comprueba si el servidor que está funcionando es nuestro sistema.
async function comprobarSistema() {

    try {

        // Consulta su estado y espera un máximo de tres segundos.
        const respuesta = await fetch(`${URL_SISTEMA}/api/estado`, {
            signal: AbortSignal.timeout(3000)
        });

        // Si la respuesta indica un error, no lo reconocemos.
        if (!respuesta.ok) {
            return false;
        }

        // Convierte la respuesta JSON en un objeto de JavaScript.
        const datos = await respuesta.json();

        // Devuelve true únicamente si coincide el identificador.
        return datos.sistema === ID_SISTEMA;

    } catch (error) {

        // Si no responde o devuelve datos inválidos, devuelve false.
        return false;

    }

}

// Intenta iniciar el servidor.
const servidor = app.listen(PUERTO, HOST, async function () {

    // Esta función se ejecuta cuando el servidor ya está listo.
    console.log(`Sistema disponible en: ${URL_SISTEMA}`);

    try {

        // Abre Chrome después de iniciar el servidor.
        await abrirChrome();

    } catch (error) {

        // La aplicación sigue funcionando aunque Chrome no se abra.
        console.error("No se pudo abrir Chrome:", error.message);

        // Muestra la dirección para abrirla manualmente.
        console.log(`Abre manualmente: ${URL_SISTEMA}`);

    }

});

// Atiende errores al intentar iniciar el servidor.
servidor.on("error", async function (error) {

    // Comprueba si el problema es que el puerto ya está ocupado.
    if (error.code === "EADDRINUSE") {

        // Verifica que el servidor existente pertenezca a nuestro sistema.
        const sistemaActivo = await comprobarSistema();

        if (sistemaActivo) {

            try {

                // Utiliza el servidor existente y vuelve a abrir Chrome.
                await abrirChrome();

                // Termina solo este segundo intento de arranque.
                // El servidor original continúa funcionando.
                process.exitCode = 0;
                return;

            } catch (errorChrome) {

                // Registra un posible error al abrir Chrome.
                console.error("No se pudo abrir Chrome:", errorChrome.message);

            }

        } else {

            // No abre un programa distinto que esté usando el mismo puerto.
            console.error(
                "El puerto 3000 está ocupado por otra aplicación o por una versión anterior del sistema."
            );

        }

    } else {

        // Informa otros errores de inicio.
        console.error("No se pudo iniciar el servidor:", error.message);

    }

    // Indica que este intento de arranque falló.
    process.exitCode = 1;

});

