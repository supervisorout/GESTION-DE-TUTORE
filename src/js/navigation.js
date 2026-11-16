
/* ============================================================
   GESTIÓN DE TUTORES
   NAVIGATION.JS
   Navegación principal entre módulos
============================================================ */


/* ============================================================
   1. CONFIGURACIÓN DE MÓDULOS
============================================================ */

const MODULOS = {
  resumen: {
    titulo: "Resumen diario",
    subtitulo: "Vista general de la actividad diaria."
  },

  planificaciones: {
    titulo: "Planificaciones",
    subtitulo: "Creación y administración de jornadas."
  },

  asignaciones: {
    titulo: "Asignaciones",
    subtitulo: "Administración de tutores y sus asignaciones."
  },

  tutores: {
    titulo: "Tutores",
    subtitulo: "Registro y administración de tutores."
  },

  bases: {
    titulo: "Bases",
    subtitulo: "Administración de bases de trabajo."
  },

  ubicaciones: {
    titulo: "Ubicaciones",
    subtitulo: "Administración de lugares de trabajo."
  },

  carga: {
    titulo: "Carga de información",
    subtitulo: "Importación y procesamiento de archivos."
  },

  asistencia: {
    titulo: "Asistencia",
    subtitulo: "Registro y consulta de asistencias."
  },

  reportes: {
    titulo: "Reportes",
    subtitulo: "Informes y estadísticas de gestión."
  },

  auditoria: {
    titulo: "Auditoría",
    subtitulo: "Historial de modificaciones del sistema."
  },

  usuarios: {
    titulo: "Usuarios",
    subtitulo: "Administración de cuentas y permisos."
  }
};


/* ============================================================
   2. INICIALIZAR NAVEGACIÓN
============================================================ */

function inicializarNavegacion() {
  const botones = document.querySelectorAll(".nav-item");

  botones.forEach((boton) => {
    boton.addEventListener("click", function () {
      const modulo = this.dataset.module;

      if (!modulo) return;

      cargarModulo(modulo);
      cerrarMenuMovil();
    });
  });

  const botonMenu = document.getElementById("btn-menu");

  if (botonMenu) {
    botonMenu.addEventListener("click", alternarMenuMovil);
  }
}


/* ============================================================
   3. CARGAR MÓDULO
============================================================ */

function cargarModulo(nombreModulo) {
  if (!MODULOS[nombreModulo]) {
    console.error("Módulo no encontrado:", nombreModulo);
    return;
  }

  if (!puedeOperar()) {
    console.warn("El usuario no tiene permisos para operar.");
    return;
  }

  if (nombreModulo === "usuarios" && !esAdministrador()) {
    alert("No tienes permisos para acceder a este módulo.");
    return;
  }

  const configuracion = MODULOS[nombreModulo];

  const titulo = document.getElementById("page-title");
  const subtitulo = document.getElementById("page-subtitle");

  if (titulo) {
    titulo.textContent = configuracion.titulo;
  }

  if (subtitulo) {
    subtitulo.textContent = configuracion.subtitulo;
  }

  actualizarBotonActivo(nombreModulo);

  renderizarModulo(nombreModulo);
}


/* ============================================================
   4. ACTUALIZAR BOTÓN ACTIVO
============================================================ */

function actualizarBotonActivo(nombreModulo) {
  document.querySelectorAll(".nav-item").forEach((boton) => {
    const seleccionado = boton.dataset.module === nombreModulo;

    boton.classList.toggle("active", seleccionado);
  });
}


/* ============================================================
   5. RENDERIZAR MÓDULO
============================================================ */

function renderizarModulo(nombreModulo) {
  const contenedor = document.getElementById("module-container");

  if (!contenedor) return;

  /*
    Cada módulo tendrá su propio renderizador.
    Por ahora mostramos una pantalla provisional.
  */

  const renderizadores = {
    resumen: renderizarResumen,
    planificaciones: renderizarPlanificaciones,
    asignaciones: renderizarAsignaciones,
    tutores: renderizarTutores,
    bases: renderizarBases,
    ubicaciones: renderizarUbicaciones,
    carga: renderizarCarga,
    asistencia: renderizarAsistencia,
    reportes: renderizarReportes,
    auditoria: renderizarAuditoria,
    usuarios: renderizarUsuarios
  };

  const renderizador = renderizadores[nombreModulo];

  if (typeof renderizador === "function") {
    renderizador();
    return;
  }

  contenedor.innerHTML = `
    <section class="panel">
      <h2>${MODULOS[nombreModulo].titulo}</h2>
      <p>Este módulo se encuentra en preparación.</p>
    </section>
  `;
}


/* ============================================================
   6. RENDERIZADORES PROVISIONALES
============================================================ */

function mostrarModuloEnPreparacion(nombreModulo) {
  const contenedor = document.getElementById("module-container");

  if (!contenedor) return;

  contenedor.innerHTML = `
    <section class="panel">
      <h2>${MODULOS[nombreModulo].titulo}</h2>
      <p>${MODULOS[nombreModulo].subtitulo}</p>
      <p>Este módulo se desarrollará en una próxima etapa.</p>
    </section>
  `;
}


function renderizarResumen() {
  mostrarModuloEnPreparacion("resumen");
}

function renderizarPlanificaciones() {
  mostrarModuloEnPreparacion("planificaciones");
}

function renderizarAsignaciones() {
  mostrarModuloEnPreparacion("asignaciones");
}

function renderizarTutores() {
  mostrarModuloEnPreparacion("tutores");
}

function renderizarBases() {
  mostrarModuloEnPreparacion("bases");
}

function renderizarUbicaciones() {
  mostrarModuloEnPreparacion("ubicaciones");
}

function renderizarCarga() {
  mostrarModuloEnPreparacion("carga");
}

function renderizarAsistencia() {
  mostrarModuloEnPreparacion("asistencia");
}

function renderizarReportes() {
  mostrarModuloEnPreparacion("reportes");
}

function renderizarAuditoria() {
  mostrarModuloEnPreparacion("auditoria");
}

function renderizarUsuarios() {
  mostrarModuloEnPreparacion("usuarios");
}


/* ============================================================
   7. MENÚ PARA DISPOSITIVOS MÓVILES
============================================================ */

function alternarMenuMovil() {
  const sidebar = document.querySelector(".sidebar");

  if (!sidebar) return;

  sidebar.classList.toggle("open");
}


function cerrarMenuMovil() {
  const sidebar = document.querySelector(".sidebar");

  if (!sidebar) return;

  sidebar.classList.remove("open");
}


/* ============================================================
   8. INICIALIZAR EVENTOS
============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  inicializarNavegacion();
});
