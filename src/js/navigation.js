
/* ============================================================
   GESTIÓN DE TUTORES
   NAVIGATION.JS
   Navegación principal de la aplicación
============================================================ */


/* ============================================================
   1. CONFIGURACIÓN DE MÓDULOS
============================================================ */

const MODULOS = {

  resumen: {
    titulo: "Resumen",
    subtitulo: "Panel general de gestión"
  },

  planificaciones: {
    titulo: "Planificaciones",
    subtitulo: "Administración de jornadas"
  },

  asignaciones: {
    titulo: "Asignaciones",
    subtitulo: "Gestión de asignaciones de tutores"
  },

  tutores: {
    titulo: "Tutores",
    subtitulo: "Administración de tutores"
  },

  bases: {
    titulo: "Bases",
    subtitulo: "Administración de bases"
  },

  ubicaciones: {
    titulo: "Ubicaciones",
    subtitulo: "Administración de ubicaciones"
  },

  carga: {
    titulo: "Carga de información",
    subtitulo: "Importación de información"
  },

  asistencia: {
    titulo: "Asistencia",
    subtitulo: "Registro y control de asistencia"
  },

  reportes: {
    titulo: "Reportes",
    subtitulo: "Consultas y estadísticas"
  },

  auditoria: {
    titulo: "Auditoría",
    subtitulo: "Historial de cambios del sistema"
  },

  usuarios: {
    titulo: "Usuarios",
    subtitulo: "Administración de cuentas y permisos"
  }

};


/* ============================================================
   2. INICIALIZAR NAVEGACIÓN
============================================================ */

function inicializarNavegacion() {

  document.querySelectorAll(".nav-item").forEach(boton => {

    boton.addEventListener("click", () => {

      const modulo = boton.dataset.module;

      if (!modulo) {
        return;
      }

      cargarModulo(modulo);

      cerrarMenuMovil();

    });

  });

  const botonMenu = document.getElementById("btn-menu");

  if (botonMenu) {

    botonMenu.addEventListener("click", () => {

      const sidebar = document.getElementById("sidebar");

      sidebar.classList.toggle("open");

    });

  }

}


/* ============================================================
   3. CARGAR MÓDULO
============================================================ */

function cargarModulo(nombreModulo) {

  const modulo = MODULOS[nombreModulo];

  if (!modulo) {
    console.warn("Módulo no encontrado:", nombreModulo);
    return;
  }

  // Comprobar permisos
  if (nombreModulo === "usuarios" && !esAdministrador()) {

    alert("No tienes permisos para acceder a esta sección.");

    cargarModulo("resumen");

    return;
  }

  if (!puedeOperar()) {
    return;
  }

  // Actualizar título
  document.getElementById("page-title").textContent =
    modulo.titulo;

  document.getElementById("page-subtitle").textContent =
    modulo.subtitulo;

  // Actualizar botón activo
  document.querySelectorAll(".nav-item").forEach(boton => {

    boton.classList.toggle(
      "active",
      boton.dataset.module === nombreModulo
    );

  });

  // Cargar contenido
  renderizarModulo(nombreModulo);

}


/* ============================================================
   4. RENDERIZAR CONTENIDO DEL MÓDULO
============================================================ */

function renderizarModulo(nombreModulo) {

  const contenedor = document.getElementById("module-container");

  if (!contenedor) {
    return;
  }

  /*
    Mientras desarrollamos los módulos,
    mostraremos una pantalla provisional.

    Cada módulo tendrá posteriormente su propio
    archivo JavaScript y su interfaz.
  */

  if (nombreModulo === "resumen") {

    contenedor.innerHTML = `
      <div class="welcome-panel">
        <h2>Bienvenido a Gestión de Tutores</h2>
        <p>
          Desde aquí podrás administrar las planificaciones,
          asignaciones, tutores, bases y asistencia.
        </p>
      </div>
    `;

    return;

  }

  contenedor.innerHTML = `
    <div class="welcome-panel">
      <h2>${MODULOS[nombreModulo].titulo}</h2>
      <p>
        Estamos preparando este módulo.
        Próximamente estará disponible.
      </p>
    </div>
  `;

}


/* ============================================================
   5. CERRAR MENÚ MÓVIL
============================================================ */

function cerrarMenuMovil() {

  const sidebar = document.getElementById("sidebar");

  if (sidebar) {
    sidebar.classList.remove("open");
  }

}


/* ============================================================
   6. INICIALIZAR AL CARGAR LA PÁGINA
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  inicializarNavegacion();

});
