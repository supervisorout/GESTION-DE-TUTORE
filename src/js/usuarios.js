
/* ============================================================
   GESTIÓN DE TUTORES
   USUARIOS.JS
   Administración de cuentas y autorizaciones
============================================================ */


/* ============================================================
   1. CARGAR MÓDULO DE USUARIOS
============================================================ */

async function renderizarUsuarios() {

  const contenedor = document.getElementById("module-container");

  if (!contenedor) return;

  if (!esAdministrador()) {

    contenedor.innerHTML = `
      <section class="panel">
        <h2>Acceso restringido</h2>
        <p>No tienes permisos para administrar usuarios.</p>
      </section>
    `;

    return;

  }

  contenedor.innerHTML = `
    <section class="panel">

      <div class="toolbar">

        <div>
          <h2>Administración de usuarios</h2>
          <p>Gestiona las cuentas y autorizaciones del sistema.</p>
        </div>

        <button
          type="button"
          class="btn btn-primary"
          id="btn-actualizar-usuarios"
        >
          ↻ Actualizar
        </button>

      </div>

      <div id="usuarios-estadisticas" class="stats-grid"></div>

      <div id="usuarios-mensaje"></div>

      <div class="toolbar">

        <div class="toolbar-left">

          <button
            type="button"
            class="btn btn-secondary"
            data-filtro-usuarios="TODOS"
          >
            Todos
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            data-filtro-usuarios="PENDIENTES"
          >
            Pendientes
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            data-filtro-usuarios="ACTIVOS"
          >
            Activos
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            data-filtro-usuarios="INACTIVOS"
          >
            Inactivos
          </button>

        </div>

      </div>

      <div id="usuarios-tabla-container">
        <p>Cargando usuarios...</p>
      </div>

    </section>
  `;

  inicializarEventosUsuarios();

  await cargarUsuarios();

}


/* ============================================================
   2. VARIABLES DEL MÓDULO
============================================================ */

let listaUsuarios = [];

let filtroUsuariosActual = "TODOS";


/* ============================================================
   3. CARGAR USUARIOS DESDE SUPABASE
============================================================ */

async function cargarUsuarios() {

  const db = obtenerSupabase();

  const contenedor = document.getElementById(
    "usuarios-tabla-container"
  );

  if (!db || !contenedor) return;

  contenedor.innerHTML = "<p>Cargando usuarios...</p>";

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

    listaUsuarios = data || [];

    actualizarEstadisticasUsuarios();

    renderizarTablaUsuarios();

  } catch (error) {

    console.error("Error al cargar usuarios:", error);

    contenedor.innerHTML = `
      <div class="alert alert-warning">
        No fue posible cargar los usuarios.
        Verifica tus permisos y la conexión con Supabase.
      </div>
    `;

  }

}


/* ============================================================
   4. ESTADÍSTICAS DE USUARIOS
============================================================ */

function actualizarEstadisticasUsuarios() {

  const contenedor = document.getElementById(
    "usuarios-estadisticas"
  );

  if (!contenedor) return;

  const total = listaUsuarios.length;

  const pendientes = listaUsuarios.filter(
    usuario => !usuario.activo
  ).length;

  const activos = listaUsuarios.filter(
    usuario => usuario.activo
  ).length;

  const administradores = listaUsuarios.filter(
    usuario => usuario.rol === "ADMIN"
  ).length;

  contenedor.innerHTML = `

    <div class="stat-card primary">

      <div class="stat-card-label">
        Total de cuentas
      </div>

      <div class="stat-card-value">
        ${total}
      </div>

    </div>


    <div class="stat-card warning">

      <div class="stat-card-label">
        Pendientes / inactivos
      </div>

      <div class="stat-card-value">
        ${pendientes}
      </div>

    </div>


    <div class="stat-card success">

      <div class="stat-card-label">
        Cuentas activas
      </div>

      <div class="stat-card-value">
        ${activos}
      </div>

    </div>


    <div class="stat-card danger">

      <div class="stat-card-label">
        Administradores
      </div>

      <div class="stat-card-value">
        ${administradores}
      </div>

    </div>

  `;

}


/* ============================================================
   5. MOSTRAR TABLA DE USUARIOS
============================================================ */

function renderizarTablaUsuarios() {

  const contenedor = document.getElementById(
    "usuarios-tabla-container"
  );

  if (!contenedor) return;

  let usuariosFiltrados = [...listaUsuarios];

  if (filtroUsuariosActual === "PENDIENTES") {

    usuariosFiltrados = usuariosFiltrados.filter(
      usuario => !usuario.activo
    );

  }

  if (filtroUsuariosActual === "ACTIVOS") {

    usuariosFiltrados = usuariosFiltrados.filter(
      usuario => usuario.activo
    );

  }

  if (filtroUsuariosActual === "INACTIVOS") {

    usuariosFiltrados = usuariosFiltrados.filter(
      usuario => !usuario.activo
    );

  }

  if (usuariosFiltrados.length === 0) {

    contenedor.innerHTML = `
      <div class="panel">
        <p>No hay usuarios para mostrar.</p>
      </div>
    `;

    return;

  }

  let filas = "";

  usuariosFiltrados.forEach(usuario => {

    const nombre = escaparHTML(
      usuario.nombre || "Sin nombre"
    );

    const nombreUsuario = escaparHTML(
      usuario.usuario || "Sin usuario"
    );

    const rol = escaparHTML(usuario.rol);

    const estado = usuario.activo
      ? `<span class="badge badge-success">ACTIVO</span>`
      : `<span class="badge badge-warning">PENDIENTE / INACTIVO</span>`;

    const fechaRegistro = formatearFechaUsuario(
      usuario.fecha_registro
    );

    const ultimoAcceso = formatearFechaUsuario(
      usuario.ultimo_acceso
    );

    const esUsuarioActual =
      usuario.id === usuarioActual?.id;

    filas += `

      <tr>

        <td>
          <strong>${nombre}</strong>
        </td>

        <td>
          ${nombreUsuario}
        </td>

        <td>
          <span class="badge badge-primary">
            ${rol}
          </span>
        </td>

        <td>
          ${estado}
        </td>

        <td>
          ${fechaRegistro}
        </td>

        <td>
          ${ultimoAcceso}
        </td>

        <td>

          <div class="toolbar-left">

            ${
              usuario.activo
                ? `
                  <button
                    type="button"
                    class="btn btn-danger btn-sm"
                    data-accion-usuario="desactivar"
                    data-id="${usuario.id}"
                    ${esUsuarioActual ? "disabled" : ""}
                  >
                    Desactivar
                  </button>
                `
                : `
                  <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    data-accion-usuario="activar"
                    data-id="${usuario.id}"
                  >
                    Aprobar / Activar
                  </button>
                `
            }

            <select
              class="select-rol-usuario"
              data-rol-id="${usuario.id}"
              aria-label="Cambiar rol de ${nombreUsuario}"
              ${esUsuarioActual ? "disabled" : ""}
            >

              <option
                value="TUTOR"
                ${usuario.rol === "TUTOR" ? "selected" : ""}
              >
                TUTOR
              </option>

              <option
                value="ADMIN"
                ${usuario.rol === "ADMIN" ? "selected" : ""}
              >
                ADMIN
              </option>

            </select>

          </div>

        </td>

      </tr>

    `;

  });

  contenedor.innerHTML = `

    <div class="table-container">

      <table>

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

        <tbody>
          ${filas}
        </tbody>

      </table>

    </div>

  `;

}


/* ============================================================
   6. INICIALIZAR EVENTOS DEL MÓDULO
============================================================ */

function inicializarEventosUsuarios() {

  const contenedor = document.getElementById("module-container");

  if (!contenedor) return;

  const botonActualizar = document.getElementById(
    "btn-actualizar-usuarios"
  );

  if (botonActualizar) {

    botonActualizar.addEventListener("click", cargarUsuarios);

  }

  contenedor.querySelectorAll("[data-filtro-usuarios]").forEach(
    boton => {

      boton.addEventListener("click", function () {

        filtroUsuariosActual =
          this.dataset.filtroUsuarios;

        renderizarTablaUsuarios();

      });

    }
  );

  contenedor.addEventListener(
    "click",
    manejarAccionUsuario
  );

  contenedor.addEventListener(
    "change",
    manejarCambioRolUsuario
  );

}


/* ============================================================
   7. ACTIVAR O DESACTIVAR CUENTAS
============================================================ */

async function manejarAccionUsuario(evento) {

  const boton = evento.target.closest(
    "[data-accion-usuario]"
  );

  if (!boton) return;

  if (!esAdministrador()) {

    alert("No tienes permisos para realizar esta acción.");

    return;

  }

  const accion = boton.dataset.accionUsuario;

  const id = boton.dataset.id;

  const usuario = listaUsuarios.find(
    elemento => elemento.id === id
  );

  if (!usuario) return;

  if (usuario.id === usuarioActual?.id) {

    alert("No puedes modificar el estado de tu propia cuenta.");

    return;

  }

  const activar = accion === "activar";

  const mensaje = activar

    ? `¿Deseas aprobar y activar la cuenta de ${usuario.usuario}?`

    : `¿Deseas desactivar la cuenta de ${usuario.usuario}?`;

  if (!confirm(mensaje)) return;

  boton.disabled = true;

  try {

    const db = obtenerSupabase();

    const { error } = await db

      .from("perfiles")

      .update({
        activo: activar
      })

      .eq("id", id);

    if (error) throw error;

    mostrarMensajeUsuarios(
      activar
        ? "La cuenta fue aprobada y activada correctamente."
        : "La cuenta fue desactivada correctamente.",
      "success"
    );

    await cargarUsuarios();

  } catch (error) {

    console.error("Error al modificar usuario:", error);

    alert(
      "No fue posible modificar la cuenta. Revisa los permisos."
    );

    boton.disabled = false;

  }

}


/* ============================================================
   8. CAMBIAR ROL
============================================================ */

async function manejarCambioRolUsuario(evento) {

  const selector = evento.target.closest(
    "[data-rol-id]"
  );

  if (!selector) return;

  if (!esAdministrador()) return;

  const id = selector.dataset.rolId;

  const nuevoRol = selector.value;

  const usuario = listaUsuarios.find(
    elemento => elemento.id === id
  );

  if (!usuario) return;

  if (usuario.id === usuarioActual?.id) {

    alert("No puedes modificar tu propio rol.");

    selector.value = usuario.rol;

    return;

  }

  if (!["ADMIN", "TUTOR"].includes(nuevoRol)) {

    selector.value = usuario.rol;

    return;

  }

  const rolAnterior = usuario.rol;

  if (nuevoRol === rolAnterior) return;

  const confirmar = confirm(
    `¿Deseas cambiar el rol de ${usuario.usuario} de ${rolAnterior} a ${nuevoRol}?`
  );

  if (!confirmar) {

    selector.value = rolAnterior;

    return;

  }

  selector.disabled = true;

  try {

    const db = obtenerSupabase();

    const { error } = await db

      .from("perfiles")

      .update({
        rol: nuevoRol
      })

      .eq("id", id);

    if (error) throw error;

    mostrarMensajeUsuarios(
      "El rol del usuario fue actualizado correctamente.",
      "success"
    );

    await cargarUsuarios();

  } catch (error) {

    console.error("Error al cambiar rol:", error);

    alert(
      "No fue posible cambiar el rol del usuario."
    );

    selector.disabled = false;

    selector.value = rolAnterior;

  }

}


/* ============================================================
   9. MENSAJES DEL MÓDULO
============================================================ */

function mostrarMensajeUsuarios(mensaje, tipo = "info") {

  const contenedor = document.getElementById(
    "usuarios-mensaje"
  );

  if (!contenedor) return;

  const clase = tipo === "success"
    ? "alert-success"
    : tipo === "warning"
      ? "alert-warning"
      : "alert-info";

  contenedor.innerHTML = `
    <div class="alert ${clase}">
      ${escaparHTML(mensaje)}
    </div>
  `;

}


/* ============================================================
   10. FUNCIONES AUXILIARES
============================================================ */

function escaparHTML(valor) {

  return String(valor ?? "").replace(
    /[&<>"']/g,
    caracter => ({

      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"

    })[caracter]
  );

}


function formatearFechaUsuario(fecha) {

  if (!fecha) return "Nunca";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return "No disponible";

  return valor.toLocaleString("es-CL", {

    day: "2-digit",

    month: "2-digit",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit"

  });

}
