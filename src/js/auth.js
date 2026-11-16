
/* ============================================================
   GESTIÓN DE TUTORES
   AUTH.JS
   Autenticación y control de sesiones
============================================================ */

let usuarioActual = null;
let perfilActual = null;


/* ============================================================
   1. INICIALIZAR AUTENTICACIÓN
============================================================ */

async function inicializarAutenticacion() {
  const db = obtenerSupabase();

  if (!db) return;

  try {
    const { data, error } = await db.auth.getSession();

    if (error) throw error;

    if (data.session) {
      await cargarPerfilUsuario(data.session.user);
    } else {
      mostrarLogin();
    }

    escucharCambiosAutenticacion();

  } catch (error) {
    console.error("Error al inicializar autenticación:", error);
    mostrarLogin();
  }
}


/* ============================================================
   2. INICIAR SESIÓN
============================================================ */

async function iniciarSesion() {
  const db = obtenerSupabase();

  if (!db) {
    mostrarErrorLogin("No se pudo conectar con Supabase.");
    return;
  }

  const correo = document
    .getElementById("login-usuario")
    ?.value.trim();

  const clave = document
    .getElementById("login-clave")
    ?.value;

  if (!correo || !clave) {
    mostrarErrorLogin("Ingresa tu correo y contraseña.");
    return;
  }

  const boton = document.getElementById("btn-login");

  if (boton) {
    boton.disabled = true;
    boton.textContent = "Ingresando...";
  }

  ocultarErrorLogin();

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email: correo,
      password: clave
    });

    if (error) throw error;

    await cargarPerfilUsuario(data.user);

  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    mostrarErrorLogin(
      "No fue posible iniciar sesión. Revisa tu correo y contraseña."
    );

  } finally {
    if (boton) {
      boton.disabled = false;
      boton.textContent = "Iniciar sesión";
    }
  }
}


/* ============================================================
   3. CARGAR PERFIL DEL USUARIO
============================================================ */

async function cargarPerfilUsuario(usuarioAuth) {
  const db = obtenerSupabase();

  if (!db || !usuarioAuth) return;

  try {
    const { data: perfil, error } = await db
      .from("perfiles")
      .select("*")
      .eq("id", usuarioAuth.id)
      .single();

    if (error) throw error;

    if (!perfil) {
      throw new Error("El perfil no existe.");
    }

    if (!perfil.activo) {
      await db.auth.signOut();
      throw new Error("Tu usuario se encuentra desactivado.");
    }

    usuarioActual = usuarioAuth;
    perfilActual = perfil;

    mostrarAplicacion();

  } catch (error) {
    console.error("Error al cargar perfil:", error);

    mostrarLogin();

    mostrarErrorLogin(
      error.message || "No fue posible cargar tu perfil."
    );
  }
}


/* ============================================================
   4. MOSTRAR APLICACIÓN
============================================================ */

function mostrarAplicacion() {
  const login = document.getElementById("login-screen");
  const aplicacion = document.getElementById("main-screen");

  if (login) login.classList.add("hidden");
  if (aplicacion) aplicacion.classList.remove("hidden");

  const nombreUsuario = document.getElementById("user-name");
  const rolUsuario = document.getElementById("user-role");

  if (nombreUsuario) {
    nombreUsuario.textContent =
      perfilActual.nombre ||
      perfilActual.usuario ||
      usuarioActual.email;
  }

  if (rolUsuario) {
    rolUsuario.textContent = perfilActual.rol;
  }

  const menuAdmin = document.getElementById("admin-navigation");

  if (menuAdmin) {
    menuAdmin.classList.toggle(
      "hidden",
      perfilActual.rol !== "ADMIN"
    );
  }

  if (typeof cargarModulo === "function") {
    cargarModulo("resumen");
  }
}


/* ============================================================
   5. MOSTRAR LOGIN
============================================================ */

function mostrarLogin() {
  const login = document.getElementById("login-screen");
  const aplicacion = document.getElementById("main-screen");

  if (login) login.classList.remove("hidden");
  if (aplicacion) aplicacion.classList.add("hidden");
}


/* ============================================================
   6. MENSAJES DE ERROR
============================================================ */

function mostrarErrorLogin(mensaje) {
  const elemento = document.getElementById("login-error");

  if (!elemento) {
    console.error(mensaje);
    return;
  }

  elemento.textContent = mensaje;
  elemento.classList.remove("hidden");
}


function ocultarErrorLogin() {
  const elemento = document.getElementById("login-error");

  if (!elemento) return;

  elemento.textContent = "";
  elemento.classList.add("hidden");
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

    usuarioActual = null;
    perfilActual = null;

    mostrarLogin();

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
      usuarioActual = null;
      perfilActual = null;
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
    perfilActual?.activo === true &&
    ["ADMIN", "TUTOR"].includes(perfilActual?.rol)
  );
}


/* ============================================================
   10. EVENTOS DE INTERFAZ
============================================================ */

document.addEventListener("DOMContentLoaded", function () {

  const formularioLogin = document.getElementById("btn-login");

  if (formularioLogin) {
    formularioLogin.addEventListener("click", iniciarSesion);
  }

  const botonSalir = document.getElementById("btn-logout");

  if (botonSalir) {
    botonSalir.addEventListener("click", cerrarSesion);
  }

  inicializarAutenticacion();
});
