
/* ============================================================
   GESTIÓN DE TUTORES
   USUARIOS.JS
   Administración de cuentas y permisos
============================================================ */


/* ============================================================
   1. VARIABLES
============================================================ */

let usuariosRegistrados = [];

let filtroUsuariosActual = "TODOS";


/* ============================================================
   2. RENDERIZAR MÓDULO
============================================================ */

async function renderizarUsuarios() {

  const contenedor = document.getElementById("module-container");

  if (!contenedor) return;

  if (!esAdministrador()) {

    contenedor.innerHTML = `
      <div class="alert">
        No tienes permisos para administrar usuarios.
      </div>
    `;

    return;

  }

  contenedor.innerHTML = `
    <div class="module-content">

      <div class="toolbar">
        <div>
          <h2>Administración de usuarios</h2>
          <p>Aprueba cuentas y administra los permisos de acceso.</p>
        </div>

        <button class="btn btn-primary" id="btn-actualizar-usuarios">
          ↻ Actualizar
        </button>
      </div>

      <div class="stats-grid" id="usuarios-estadisticas">

        <div class="stat-card">
          <span>Total de cuentas</span>
          <strong id="usuarios-total">0</strong>
        </div>

        <div class="stat-card">
          <span>Pendientes de aprobación</span>
          <strong id="usuarios-pendientes">0</strong>
        </div>

        <div class="stat-card">
          <span>Cuentas activas</span>
          <strong id="usuarios-activos">0</strong>
        </div>

        <div class="stat-card">
          <span>Cuentas desactivadas</span>
          <strong id="usuarios-inactivos">0</strong>
        </div>

      </div>

      <div id="usuarios-mensaje" class="hidden"></div>

      <div class="card">

        <div class="toolbar">

          <div>
            <h3>Listado de cuentas</h3>
            <p>Busca usuarios y administra su acceso.</p>
          </div>

          <div class="toolbar-actions">

            <input
              type="search"
              id="buscar-usuario"
              placeholder="Buscar por nombre, usuario o correo..."
            >

            <select id="filtro-estado-usuarios">

              <option value="TODOS">Todos los usuarios</option>
              <option value="PENDIENTES">Pendientes</option>
              <option value="ACTIVOS">Activos</option>
              <option value="INACTIVOS">Desactivados</option>

            </select>

          </div>

        </div>

        <div class="table-container">

          <table class="data-table">

            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registro</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody id="tabla-usuarios">

              <tr>
                <td colspan="7">Cargando usuarios...</td>
              </tr>

            </tbody>

          </table>

        </div>

      </div>

    </div>
  `;

  inicializarEventosUsuarios();

  await cargarUsuariosRegistrados();

}


/* ============================================================
   3. EVENTOS DEL MÓDULO
============================================================ */

function inicializarEventosUsuarios() {

  document
    .getElementById("btn-actualizar-usuarios")
    ?.addEventListener("click", cargarUsuariosRegistrados);

  document
    .getElementById("buscar-usuario")
    ?.addEventListener("input", aplicarFiltrosUsuarios);

  document
    .getElementById("filtro-estado-usuarios")
    ?.addEventListener("change", (evento) => {

      filtroUsuariosActual = evento.target.value;

      aplicarFiltrosUsuarios();

    });

  document
    .getElementById("tabla-usuarios")
    ?.addEventListener("click", manejarAccionesUsuarios);

  document
    .getElementById("tabla-usuarios")
    ?.addEventListener("change", manejarCambiosTablaUsuarios);

}


/* ============================================================
   4. CARGAR USUARIOS DESDE SUPABASE
============================================================ */

async function cargarUsuariosRegistrados() {

  const db = obtenerSupabase();

  const tabla = document.getElementById("tabla-usuarios");

  if (!db || !tabla) return;

  if (!esAdministrador()) return;

  tabla.innerHTML = `
    <tr>
      <td colspan="7">Cargando usuarios...</td>
    </tr>
  `;

  try {

    const { data, error } = await db

      .from("perfiles")

      .select(`
        id,
        usuario,
        nombre,
        rol,
        activo,
        fecha_registro,
        ultimo_acceso
      `)

      .order("fecha_registro", { ascending: false });

    if (error) throw error;

    usuariosRegistrados = data || [];

    actualizarEstadisticasUsuarios();

    aplicarFiltrosUsuarios();

  } catch (error) {

    console.error("Error al cargar usuarios:", error);

    tabla.innerHTML = `
      <tr>
        <td colspan="7">
          No fue posible cargar los usuarios.
        </td>
      </tr>
    `;

    mostrarMensajeUsuarios(
      "Error al consultar las cuentas: " + error.message,
      "error"
    );

  }

}


/* ============================================================
   5. ESTADÍSTICAS
============================================================ */

function actualizarEstadisticasUsuarios() {

  const total = usuariosRegistrados.length;

  const pendientes = usuariosRegistrados.filter(
    usuario => !usuario.activo
  ).length;

  const activos = usuariosRegistrados.filter(
    usuario => usuario.activo
  ).length;

  const inactivos = total - activos;

  establecerTexto("usuarios-total", total);

  establecerTexto("usuarios-pendientes", pendientes);

  establecerTexto("usuarios-activos", activos);

  establecerTexto("usuarios-inactivos", inactivos);

}


function establecerTexto(id, valor) {

  const elemento = document.getElementById(id);

  if (elemento) {

    elemento.textContent = valor;

  }

}


/* ============================================================
   6. FILTRAR Y BUSCAR
============================================================ */

function aplicarFiltrosUsuarios() {

  const tabla = document.getElementById("tabla-usuarios");

  if (!tabla) return;

  const busqueda = (
    document.getElementById("buscar-usuario")?.value || ""
  ).trim().toLowerCase();

  let resultados = [...usuariosRegistrados];

  if (filtroUsuariosActual === "PENDIENTES") {

    resultados = resultados.filter(
      usuario => !usuario.activo
    );

  }

  if (filtroUsuariosActual === "ACTIVOS") {

    resultados = resultados.filter(
      usuario => usuario.activo
    );

  }

  if (filtroUsuariosActual === "INACTIVOS") {

    resultados = resultados.filter(
      usuario => !usuario.activo
    );

  }

  if (busqueda) {

    resultados = resultados.filter(usuario => {

      const texto = [

        usuario.nombre,

        usuario.usuario,

        usuario.id

      ].join(" ").toLowerCase();

      return texto.includes(busqueda);

    });

  }

  /*
    Los pendientes aparecen primero.
  */

  resultados.sort((a, b) => {

    return Number(a.activo) - Number(b.activo);

  });

  dibujarTablaUsuarios(resultados);

}


/* ============================================================
   7. DIBUJAR TABLA
============================================================ */

function dibujarTablaUsuarios(usuarios) {

  const tabla = document.getElementById("tabla-usuarios");

  if (!tabla) return;

  if (!usuarios.length) {

    tabla.innerHTML = `
      <tr>
        <td colspan="7">
          No se encontraron usuarios.
        </td>
      </tr>
    `;

    return;

  }

  const idActual = obtenerUsuarioActual()?.id;

  tabla.innerHTML = usuarios.map(usuario => {

    const esPropio = usuario.id === idActual;

    const nombre = escaparHTML(
      usuario.nombre || "Sin nombre"
    );

    const nombreUsuario = escaparHTML(
      usuario.usuario || "Sin usuario"
    );

    const rol = escaparHTML(usuario.rol || "TUTOR");

    const estado = usuario.activo
      ? `<span class="badge badge-success">Activo</span>`
      : `<span class="badge badge-warning">Pendiente / Inactivo</span>`;

    const fechaRegistro = formatearFechaUsuario(
      usuario.fecha_registro
    );

    const ultimoAcceso = formatearFechaUsuario(
      usuario.ultimo_acceso
    );

    const accionEstado = usuario.activo
      ? "desactivar"
      : "aprobar";

    const textoEstado = usuario.activo
      ? "Desactivar"
      : "Aprobar";

    const botonEstado = esPropio
      ? `<span class="text-muted">Cuenta actual</span>`
      : `
        <button
          class="btn btn-small ${usuario.activo ? "btn-secondary" : "btn-primary"}"
          data-accion="${accionEstado}"
          data-id="${escaparHTML(usuario.id)}"
        >
          ${textoEstado}
        </button>
      `;

    return `
      <tr>

        <td>
          <strong>${nombre}</strong>
          ${esPropio ? `<span class="badge">Tú</span>` : ""}
        </td>

        <td>${nombreUsuario}</td>

        <td>
          <select
            class="select-rol-usuario"
            data-id="${escaparHTML(usuario.id)}"
            ${esPropio ? "disabled" : ""}
          >
            <option value="TUTOR" ${rol === "TUTOR" ? "selected" : ""}>
              TUTOR
            </option>

            <option value="ADMIN" ${rol === "ADMIN" ? "selected" : ""}>
              ADMIN
            </option>
          </select>
        </td>

        <td>${estado}</td>

        <td>${fechaRegistro}</td>

        <td>${ultimoAcceso}</td>

        <td>
          <div class="table-actions">

            ${botonEstado}

            ${
              !esPropio
                ? `
                  <button
                    class="btn btn-small btn-outline"
                    data-accion="guardar-rol"
                    data-id="${escaparHTML(usuario.id)}"
                  >
                    Guardar rol
                  </button>
                `
                : ""
            }

          </div>
        </td>

      </tr>
    `;

  }).join("");

}


/* ============================================================
   8. MANEJAR ACCIONES
============================================================ */

async function manejarAccionesUsuarios(evento) {

  const boton = evento.target.closest("button[data-accion]");

  if (!boton) return;

  const accion = boton.dataset.accion;

  const id = boton.dataset.id;

  if (!id) return;

  if (accion === "aprobar") {

    await cambiarEstadoUsuario(id, true);

  }

  if (accion === "desactivar") {

    await cambiarEstadoUsuario(id, false);

  }

  if (accion === "guardar-rol") {

    await guardarRolUsuario(id);

  }

}


/* ============================================================
   9. APROBAR O DESACTIVAR USUARIO
============================================================ */

async function cambiarEstadoUsuario(id, nuevoEstado) {

  const db = obtenerSupabase();

  if (!db || !esAdministrador()) return;

  const usuario = usuariosRegistrados.find(
    item => item.id === id
  );

  if (!usuario) return;

  if (id === obtenerUsuarioActual()?.id) {

    mostrarMensajeUsuarios(
      "No puedes modificar el estado de tu propia cuenta.",
      "error"
    );

    return;

  }

  const accion = nuevoEstado ? "aprobar" : "desactivar";

  const confirmado = confirm(
    `¿Deseas ${accion} la cuenta de ${usuario.nombre || usuario.usuario}?`
  );

  if (!confirmado) return;

  try {

    const { error } = await db

      .from("perfiles")

      .update({

        activo: nuevoEstado

      })

      .eq("id", id);

    if (error) throw error;

    mostrarMensajeUsuarios(
      nuevoEstado
        ? "La cuenta fue aprobada correctamente."
        : "La cuenta fue desactivada correctamente.",
      "success"
    );

    await cargarUsuariosRegistrados();

  } catch (error) {

    console.error("Error al cambiar estado:", error);

    mostrarMensajeUsuarios(
      "No fue posible modificar la cuenta: " + error.message,
      "error"
    );

  }

}


/* ============================================================
   10. CAMBIAR ROL
============================================================ */

async function guardarRolUsuario(id) {

  const db = obtenerSupabase();

  if (!db || !esAdministrador()) return;

  const usuario = usuariosRegistrados.find(
    item => item.id === id
  );

  if (!usuario) return;

  if (id === obtenerUsuarioActual()?.id) {

    mostrarMensajeUsuarios(
      "No puedes modificar tu propio rol.",
      "error"
    );

    return;

  }

  const selector = document.querySelector(
    `.select-rol-usuario[data-id="${id}"]`
  );

  if (!selector) return;

  const nuevoRol = selector.value;

  if (!["ADMIN", "TUTOR"].includes(nuevoRol)) {

    mostrarMensajeUsuarios(
      "El rol seleccionado no es válido.",
      "error"
    );

    return;

  }

  if (nuevoRol === usuario.rol) {

    mostrarMensajeUsuarios(
      "El usuario ya tiene ese rol.",
      "warning"
    );

    return;

  }

  const confirmado = confirm(
    `¿Deseas cambiar el rol de ${usuario.nombre || usuario.usuario} a ${nuevoRol}?`
  );

  if (!confirmado) return;

  try {

    const { error } = await db

      .from("perfiles")

      .update({

        rol: nuevoRol

      })

      .eq("id", id);

    if (error) throw error;

    mostrarMensajeUsuarios(
      "El rol fue actualizado correctamente.",
      "success"
    );

    await cargarUsuariosRegistrados();

  } catch (error) {

    console.error("Error al cambiar rol:", error);

    mostrarMensajeUsuarios(
      "No fue posible actualizar el rol: " + error.message,
      "error"
    );

  }

}


/* ============================================================
   11. CAMBIOS EN SELECTORES
============================================================ */

function manejarCambiosTablaUsuarios(evento) {

  const selector = evento.target.closest(
    ".select-rol-usuario"
  );

  if (!selector) return;

  selector.dataset.modificado = "true";

}


/* ============================================================
   12. MENSAJES
============================================================ */

function mostrarMensajeUsuarios(mensaje, tipo = "success") {

  const elemento = document.getElementById("usuarios-mensaje");

  if (!elemento) return;

  elemento.className = `alert alert-${tipo}`;

  elemento.textContent = mensaje;

  elemento.classList.remove("hidden");

}


/* ============================================================
   13. FORMATEAR FECHAS
============================================================ */

function formatearFechaUsuario(fecha) {

  if (!fecha) return "Nunca";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return "—";

  return valor.toLocaleString("es-CL", {

    day: "2-digit",

    month: "2-digit",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit"

  });

}


/* ============================================================
   14. SEGURIDAD HTML
============================================================ */

function escaparHTML(valor) {

  return String(valor ?? "").replace(/[&<>"']/g, caracter => {

    const entidades = {

      "&": "&amp;",

      "<": "&lt;",

      ">": "&gt;",

      '"': "&quot;",

      "'": "&#039;"

    };

    return entidades[caracter];

  });

}
