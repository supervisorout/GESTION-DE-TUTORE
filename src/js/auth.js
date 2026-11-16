
/* ============================================================
   GESTIÓN DE TUTORES
   AUTH.JS
   Autenticación y control de sesiones
============================================================ */

let usuarioActual = null;
let perfilActual = null;


/* ============================================================
   1. INICIALIZACIÓN
============================================================ */

async function inicializarAutenticacion() {

  const db = obtenerSupabase();

  if (!db) {
    mostrarErrorLogin("No se pudo conectar con el servidor.");
    return;
  }

  try {

    const { data, error } = await db.auth.getSession();

    if (error) throw error;

    if (data.session) {
      await cargarPerfilUsuario(data.session.user);
    } else {
      mostrarLogin();
    }

  } catch (error) {

    console.error("Error al recuperar sesión:", error);
    mostrarLogin();

  }

}


/* ============================================================
   2. INICIAR SESIÓN
============================================================ */

async function iniciarSesion(event) {

  event.preventDefault();

  const db = obtenerSupabase();

  if (!db) {
    mostrarErrorLogin("No hay conexión con Supabase.");
    return;
  }

  const correo = document
    .getElementById("login-usuario")
    .value
    .trim();

  const clave = document
    .getElementById("login-clave")
    .value;

  const boton = document.getElementById("btn-login");

  boton.disabled = true;
  boton.textContent = "Ingresando...";

  mostrarErrorLogin("");

  try {

    const { data, error } = await db.auth.signInWithPassword({
      email: correo,
      password: clave
    });

    if (error) throw error;

    await cargarPerfilUsuario(data.user);

  } catch (error) {

    console.error("Error de inicio de sesión:", error);

    mostrarErrorLogin(
      "Correo electrónico o contraseña incorrectos."
    );

  } finally {

    boton.disabled = false;
    boton.textContent = "Ingresar";

  }

}


/* ============================================================
   3. CARGAR PERFIL
============================================================ */

async function cargarPerfilUsuario(usuarioAuth) {

  const db = obtenerSupabase();

  if (!db || !usuarioAuth) {
    mostrarLogin();
    return;
  }

  try {

    const { data: perfil, error } = await db
      .from("perfiles")
      .select("*")
      .eq("id", usuarioAuth.id)
      .maybeSingle();

    if (error) throw error;

    if (!perfil || !perfil.activo) {

      await db.auth.signOut();

      mostrarLogin();

      mostrarErrorLogin(
        "Tu cuenta no está habilitada."
      );

      return;

    }

    usuarioActual = usuarioAuth;
    perfilActual = perfil;

    const { error: errorAcceso } = await db
      .from("perfiles")
      .update({
        ultimo_acceso: new Date().toISOString()
      })
      .eq("id", perfil.id);

    if (errorAcceso) {
      console.warn("No se pudo actualizar el acceso:", errorAcceso);
    }

    mostrarAplicacion();

  } catch (error) {

    console.error("Error al cargar perfil:", error);

    await db.auth.signOut();

    mostrarLogin();

    mostrarErrorLogin(
      "No se pudo cargar tu perfil."
    );

  }

}


/* ============================================================
   4. MOSTRAR APLICACIÓN
============================================================ */

function mostrarAplicacion() {

  document.getElementById("login-screen").classList.add("hidden");

  document.getElementById("main-screen").classList.remove("hidden");

  const nombre = perfilActual.nombre || perfilActual.usuario;

  document.getElementById("user-name").textContent = nombre;

  document.getElementById("user-role").textContent =
    perfilActual.rol === "ADMIN"
      ? "Administrador"
      : "Supervisor";

  document.getElementById("user-avatar").textContent =
    nombre.charAt(0).toUpperCase();

  document.getElementById("admin-navigation").classList.toggle(
    "hidden",
    perfilActual.rol !== "ADMIN"
  );

  if (typeof cargarModulo === "function") {
    cargarModulo("resumen");
  }

}


/* ============================================================
   5. MOSTRAR LOGIN
============================================================ */

function mostrarLogin() {

  document.getElementById("main-screen").classList.add("hidden");

  document.getElementById("login-screen").classList.remove("hidden");

  usuarioActual = null;
  perfilActual = null;

}


/* ============================================================
   6. ERRORES DE LOGIN
============================================================ */

function mostrarErrorLogin(mensaje) {

  const elemento = document.getElementById("login-error");

  if (elemento) {
    elemento.textContent = mensaje;
  }

}


/* ============================================================
   7. CERRAR SESIÓN
============================================================ */

async function cerrarSesion() {

  const db = obtenerSupabase();

  if (!db) return;

  try {

    const { error } = await db.auth.signOut();

    if (error) throw error;

    mostrarLogin();

    document.getElementById("login-form").reset();

    mostrarErrorLogin("");

  } catch (error) {

    console.error("Error al cerrar sesión:", error);

    alert("No fue posible cerrar la sesión.");

  }

}


/* ============================================================
   8. ESCUCHAR CAMBIOS DE AUTENTICACIÓN
============================================================ */

function escucharCambiosAutenticacion() {

  const db = obtenerSupabase();

  if (!db) return;

  db.auth.onAuthStateChange((evento) => {

    if (evento === "SIGNED_OUT") {
      mostrarLogin();
    }

  });

}


/* ============================================================
   9. CONSULTAS DE USUARIO Y PERMISOS
============================================================ */

function obtenerUsuarioActual() {
  return usuarioActual;
}

function obtenerPerfilActual() {
  return perfilActual;
}

function esAdministrador() {
  return perfilActual?.rol === "ADMIN";
}

function puedeOperar() {

  return (
    perfilActual &&
    perfilActual.activo === true &&
    ["ADMIN", "TUTOR"].includes(perfilActual.rol)
  );

}


/* ============================================================
   10. EVENTOS INICIALES
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  const formulario = document.getElementById("login-form");

  if (formulario) {
    formulario.addEventListener("submit", iniciarSesion);
  }

  const botonSalir = document.getElementById("btn-logout");

  if (botonSalir) {
    botonSalir.addEventListener("click", cerrarSesion);
  }

  inicializarSupabase();

  inicializarAutenticacion();

  escucharCambiosAutenticacion();

});
