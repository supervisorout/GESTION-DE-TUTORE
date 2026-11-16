
/* ============================================================
   GESTIÓN DE TUTORES
   SUPABASE.JS
   Conexión central con Supabase
============================================================ */

let supabaseClient = null;

/**
 * Inicializa la conexión con Supabase.
 */
function inicializarSupabase() {

  // Evitar conexiones duplicadas
  if (supabaseClient) {
    return supabaseClient;
  }

  // Comprobar que exista la librería
  if (!window.supabase) {
    console.error("No se encontró la librería de Supabase.");
    return null;
  }

  // Comprobar configuración
  if (
    !APP_CONFIG.supabase.url ||
    !APP_CONFIG.supabase.anonKey ||
    APP_CONFIG.supabase.url === "AQUI_TU_SUPABASE_URL" ||
    APP_CONFIG.supabase.anonKey === "AQUI_TU_SUPABASE_PUBLISHABLE_KEY"
  ) {
    console.warn("Falta configurar las credenciales de Supabase.");
    return null;
  }

  try {

    supabaseClient = window.supabase.createClient(
      APP_CONFIG.supabase.url,
      APP_CONFIG.supabase.anonKey
    );

    console.log("Conexión con Supabase inicializada.");

    return supabaseClient;

  } catch (error) {

    console.error(
      "Error al inicializar Supabase:",
      error
    );

    return null;
  }
}

/**
 * Devuelve el cliente de Supabase.
 */
function obtenerSupabase() {

  if (!supabaseClient) {
    return inicializarSupabase();
  }

  return supabaseClient;
}
