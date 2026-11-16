
/* ============================================================
   GESTIÓN DE TUTORES
   APP.JS
   Inicialización general de la aplicación
============================================================ */

function inicializarAplicacion() {
  console.log("Iniciando Gestión de Tutores...");

  const db = obtenerSupabase();

  if (!db) {
    actualizarEstadoConexion(
      "No se pudo inicializar Supabase",
      "error"
    );
    return;
  }

  actualizarEstadoConexion(
    "Supabase configurado",
    "success"
  );

  console.log("Cliente Supabase inicializado correctamente.");
}


/* ============================================================
   ACTUALIZAR INDICADOR DE CONEXIÓN
============================================================ */

function actualizarEstadoConexion(mensaje, estado = "info") {
  const indicador = document.getElementById("connection-status");

  if (!indicador) return;

  indicador.textContent = mensaje;

  indicador.classList.remove(
    "status-success",
    "status-error",
    "status-warning"
  );

  if (estado === "success") {
    indicador.classList.add("status-success");
  } else if (estado === "error") {
    indicador.classList.add("status-error");
  } else if (estado === "warning") {
    indicador.classList.add("status-warning");
  }
}


/* ============================================================
   INICIAR APLICACIÓN
============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  inicializarAplicacion();
});
