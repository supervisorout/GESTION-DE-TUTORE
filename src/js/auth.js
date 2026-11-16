
/* ============================================================
   GESTIÓN DE TUTORES
   AUTH.JS
   Autenticación, registro y control de usuarios
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

  cambiarEstadoBoton(boton, true, "Ingresando...");

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

    cambiarEstadoBoton(boton, false, "Iniciar sesión");

  }

}


/* ============================================================
   3. REGISTRAR NUEVA CUENTA
============================================================ */

async function registrarUsuario() {

  const db = obtenerSupabase();

  if (!db) {

    mostrarErrorRegistro("No se pudo conectar con Supabase.");

    return;

  }

  const nombre = document
    .getElementById("registro-nombre")
    ?.value.trim();

  const usuario = document
    .getElementById("registro-usuario")
    ?.value.trim();

  const correo = document
    .getElementById("registro-correo")
    ?.value.trim();

  const clave = document
    .getElementById("registro-clave")
    ?.value;

  const confirmacion = document
    .getElementById("registro-clave-confirmacion")
    ?.value;

  ocultarErrorRegistro();
  ocultarMensajeRegistro();

  /* VALIDACIONES */

  if (!nombre || !usuario || !correo || !clave || !confirmacion) {

    mostrarErrorRegistro(
      "Completa todos los campos para continuar."
    );

    return;

  }

  if (nombre.length < 3) {

    mostrarErrorRegistro(
      "Ingresa un nombre completo válido."
    );

    return;

  }

  if (usuario.length < 3) {

    mostrarErrorRegistro(
      "El nombre de usuario debe tener al menos 3 caracteres."
    );

    return;

  }

  if (/\s/.test(usuario)) {

    mostrarErrorRegistro(
      "El nombre de usuario no debe contener espacios."
    );

    return;

  }

  if (clave.length < 8) {

    mostrarErrorRegistro(
      "La contraseña debe tener al menos 8 caracteres."
    );

    return;

  }

  if (clave !== confirmacion) {

    mostrarErrorRegistro(
      "Las contraseñas ingresadas no coinciden."
    );

    return;

  }

  const boton = document.getElementById("btn-registro");

  cambiarEstadoBoton(boton, true, "Enviando solicitud...");

  try {

    const { data, error } = await db.auth.signUp({

      email: correo,

      password: clave,

      options: {

        data: {

          nombre: nombre,

          usuario: usuario

        }

      }

    });

    if (error) throw error;

    if (!data.user) {

      throw new Error(
        "No se pudo completar el registro. Intenta nuevamente."
      );

    }

    /*
      Si Supabase devuelve una sesión automáticamente,
      la cerramos porque la cuenta todavía está pendiente
      de aprobación por el administrador.
    */

    if (data.session) {

      const { error: errorSalida } = await db.auth.signOut();

      if (errorSalida) throw errorSalida;

    }

    limpiarFormularioRegistro();

    mostrarMensajeRegistro(
      "¡Solicitud enviada correctamente! Tu cuenta quedó pendiente de aprobación por el administrador. Una vez autorizada, podrás iniciar sesión."
    );

  } catch (error) {

    console.error("Error al registrar usuario:", error);

    mostrarErrorRegistro(
      traducirErrorRegistro(error)
    );

  } finally {

    cambiarEstadoBoton(boton, false, "Solicitar cuenta");

  }

}


/* ============================================================
   4. CARGAR PERFIL DEL USUARIO
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

      throw new Error("El perfil del usuario no existe.");

    }

    if (!perfil.activo) {

      usuarioActual = null;
      perfilActual = null;

      await db.auth.signOut();

      mostrarLogin();

      mostrarErrorLogin(
        "Tu cuenta todavía no ha sido autorizada por el administrador."
      );

      return;

    }

    if (!["ADMIN", "TUTOR"].includes(perfil.rol)) {

      await db.auth.signOut();

      mostrarLogin();

      mostrarErrorLogin(
        "Tu cuenta no tiene un rol válido para ingresar."
      );

      return;

    }

    usuarioActual = usuarioAuth;

    perfilActual = perfil;

    ocultarErrorLogin();

    mostrarAplicacion();

  } catch (error) {

    console.error("Error al cargar perfil:", error);

    usuarioActual = null;

    perfilActual = null;

    mostrarLogin();

    mostrarErrorLogin(
      "No fue posible validar tu perfil. Contacta al administrador."
    );

    if (error.message !== "Auth session missing!") {

      await db.auth.signOut().catch(() => {});

    }

  }

}


/* ============================================================
   5. MOSTRAR APLICACIÓN
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

  const avatar = document.querySelector(".user-avatar span");

  if (avatar) {

    avatar.textContent = (
      perfilActual.nombre ||
      perfilActual.usuario ||
      "U"
    ).charAt(0).toUpperCase();

  }

  if (typeof cargarModulo === "function") {

    cargarModulo("resumen");

  }

}


/* ============================================================
   6. MOSTRAR LOGIN
============================================================ */

function mostrarLogin() {

  const login = document.getElementById("login-screen");

  const aplicacion = document.getElementById("main-screen");

  if (login) login.classList.remove("hidden");

  if (aplicacion) aplicacion.classList.add("hidden");

}


/* ============================================================
   7. MENSAJES DEL LOGIN
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
   8. MENSAJES DEL REGISTRO
============================================================ */

function mostrarErrorRegistro(mensaje) {

  const elemento = document.getElementById("register-error");

  if (!elemento) return;

  elemento.textContent = mensaje;

  elemento.className = "error-message";

  elemento.classList.remove("hidden");

}


function ocultarErrorRegistro() {

  const elemento = document.getElementById("register-error");

  if (!elemento) return;

  elemento.textContent = "";

  elemento.classList.add("hidden");

}


function mostrarMensajeRegistro(mensaje) {

  const formulario = document.getElementById(
    "register-form-container"
  );

  if (!formulario) return;

  let elemento = document.getElementById("register-success");

  if (!elemento) {

    elemento = document.createElement("div");

    elemento.id = "register-success";

    elemento.className = "alert alert-success";

    const error = document.getElementById("register-error");

    if (error) {

      error.insertAdjacentElement("afterend", elemento);

    } else {

      formulario.prepend(elemento);

    }

  }

  elemento.textContent = mensaje;

  elemento.classList.remove("hidden");

}


function ocultarMensajeRegistro() {

  const elemento = document.getElementById("register-success");

  if (!elemento) return;

  elemento.textContent = "";

  elemento.classList.add("hidden");

}


/* ============================================================
   9. TRADUCIR ERRORES DE REGISTRO
============================================================ */

function traducirErrorRegistro(error) {

  const mensaje = String(error.message || "").toLowerCase();

  if (
    mensaje.includes("already registered") ||
    mensaje.includes("already exists") ||
    mensaje.includes("user already")
  ) {

    return "Este correo electrónico ya tiene una cuenta registrada.";

  }

  if (
    mensaje.includes("password") &&
    mensaje.includes("weak")
  ) {

    return "La contraseña es demasiado débil. Utiliza una contraseña más segura.";

  }

  if (
    mensaje.includes("duplicate key") ||
    mensaje.includes("unique constraint")
  ) {

    return "El nombre de usuario ya está registrado. Elige otro.";

  }

  if (mensaje.includes("rate limit")) {

    return "Se alcanzó el límite de registros. Intenta nuevamente más tarde.";

  }

  return (
    error.message ||
    "No fue posible registrar la cuenta. Intenta nuevamente."
  );

}


/* ============================================================
   10. LIMPIAR FORMULARIO DE REGISTRO
============================================================ */

function limpiarFormularioRegistro() {

  const campos = [

    "registro-nombre",

    "registro-usuario",

    "registro-correo",

    "registro-clave",

    "registro-clave-confirmacion"

  ];

  campos.forEach((id) => {

    const campo = document.getElementById(id);

    if (campo) campo.value = "";

  });

}


/* ============================================================
   11. CAMBIAR ESTADO DE BOTONES
============================================================ */

function cambiarEstadoBoton(boton, deshabilitado, texto) {

  if (!boton) return;

  boton.disabled = deshabilitado;

  boton.textContent = texto;

}


/* ============================================================
   12. CERRAR SESIÓN
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
   13. ESCUCHAR CAMBIOS DE AUTENTICACIÓN
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
   14. CONSULTAS DE USUARIO Y PERMISOS
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
   15. INICIALIZAR EVENTOS
============================================================ */

document.addEventListener("DOMContentLoaded", function () {

  const botonLogin = document.getElementById("btn-login");

  const botonRegistro = document.getElementById("btn-registro");

  const botonSalir = document.getElementById("btn-logout");


  if (botonLogin) {

    botonLogin.addEventListener("click", iniciarSesion);

  }


  if (botonRegistro) {

    botonRegistro.addEventListener("click", registrarUsuario);

  }


  if (botonSalir) {

    botonSalir.addEventListener("click", cerrarSesion);

  }


  inicializarAutenticacion();

});
