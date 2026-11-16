
/* ============================================================
   GESTIÓN DE TUTORES
   APP.JS
   Coordinador principal de la aplicación
============================================================ */


/* ============================================================
   1. INICIALIZACIÓN GENERAL
============================================================ */

let aplicacionInicializada = false;

async function inicializarAplicacion() {

  if (aplicacionInicializada) {
    return;
  }

  console.log("Iniciando Gestión de Tutores...");

  // Inicializar conexión
  const db = obtenerSupabase();

  if (!db) {

    actualizarEstadoConexion(
      "Sin configuración",
      false
    );

    console.error(
      "No se pudo inicializar Supabase."
    );

    return;
  }

  actualizarEstadoConexion(
    "Conectando...",
    false
  );

  // Verificar conexión
  await comprobarConexion();

  aplicacionInicializada = true;

  console.log(
    "Aplicación inicializada correctamente."
  );

}


/* ============================================================
   2. COMPROBAR CONEXIÓN CON SUPABASE
============================================================ */

async function comprobarConexion() {

  const db = obtenerSupabase();

  if (!db) {
    return false;
  }

  try {

    const { error } = await db
      .from("areas")
      .select("id")
      .limit(1);

    if (error) {
      throw error;
    }

    actualizarEstadoConexion(
      "Conectado",
      true
    );

    return true;

  } catch (error) {

    console.error(
      "Error de conexión:",
      error
    );

    actualizarEstadoConexion(
      "Error de conexión",
      false
    );

    return false;

  }

}


/* ============================================================
   3. ACTUALIZAR INDICADOR DE CONEXIÓN
============================================================ */

function actualizarEstadoConexion(
  mensaje,
  conectado
) {

  const indicador = document.getElementById(
    "connection-status"
  );

  if (!indicador) {
    return;
  }

  indicador.textContent = mensaje;

  indicador.style.color = conectado
    ? "#198754"
    : "#d52b35";

}


/* ============================================================
   4. COMPROBAR PERMISOS OPERATIVOS
============================================================ */

function verificarPermisosOperativos() {

  if (typeof puedeOperar !== "function") {
    return false;
  }

  return puedeOperar();

}


/* ============================================================
   5. CONTROL DE ERRORES GENERALES
============================================================ */

window.addEventListener("error", event => {

  console.error(
    "Error general de la aplicación:",
    event.message
  );

});


window.addEventListener("unhandledrejection", event => {

  console.error(
    "Error en operación asíncrona:",
    event.reason
  );

});


/* ============================================================
   6. INICIAR APLICACIÓN
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  inicializarAplicacion();

});
