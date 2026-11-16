
/* ============================================================
   GESTIÓN DE TUTORES
   USUARIOS.JS
   Administración de cuentas
============================================================ */

let usuariosRegistrados = [];
let filtroUsuariosActual = "TODOS";


/* ============================================================
   1. RENDERIZAR MÓDULO
============================================================ */

async function renderizarUsuarios() {

  const contenedor = document.getElementById("module-container");

  if (!contenedor) return;

  if (!esAdministrador()) {

    contenedor.innerHTML = `
      <div class="alert alert-error">
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


      <div class="stats-grid">

        <div class="stat-card">
          <span>Total de cuentas</span>
          <strong id="usuarios-total">0</strong>
        </div>

        <div class="stat-card">
          <span>Pendientes</span>
          <strong id="usuarios-pendientes">0</strong>
        </div>

        <div class="stat-card">
          <span>Activos</span>
          <strong id="usuarios-activos">0</strong>
        </div>

        <div class="stat-card">
          <span>Desactivados</span>
          <strong id="usuarios-inactivos">0</strong>
        </div>

      </div>


      <div id="usuarios-mensaje" class="hidden"></div>


      <div class="card">

        <div class="toolbar">

          <div>
            <h3>Listado de cuentas</h3>
            <p>Administración de supervisores del sistema.</p>
          </div>

          <div class="toolbar-actions">

            <input
              type="search"
              id="buscar-usuario"
              placeholder="Buscar usuario..."
            >

            <select id="filtro-estado-usuarios">

              <option value="TODOS">Todos</option>
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
   2. EVENTOS
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
    ?.addEventListener("change", evento => {

      filtroUsuariosActual = evento.target.value;

      aplicarFiltrosUsuarios();

    });

  document
    .getElementById("tabla-usuarios")
    ?.addEventListener("click", manejarAccionesUsuarios);

}


/* ============================================================
   3. CARGAR USUARIOS
============================================================ */

async function cargarUsuariosRegistrados() {

  const db = obtenerSupabase();

  const tabla = document.getElementById("tabla-usuarios");

  if (!db || !tabla || !esAdministrador()) return;

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
        estado_aprobacion,
        fecha_registro,
        ultimo_acceso
      `)

      .order("fecha_registro", { ascending: false });

    if (error) throw error;

    usuariosRegistrados = data || [];

    actualizarEstadisticasUsuarios();

    aplicarFiltrosUsuarios();

  } catch (error) {

    console.error(error);

    tabla.innerHTML = `
      <tr>
        <td colspan="7">
          No fue posible cargar los usuarios.
        </td>
      </tr>
    `;

    mostrarMensajeUsuarios(
      "Error al consultar usuarios: " + error.message,
      "error"
    );

  }

}


/* ============================================================
   4. OBTENER ESTADO
============================================================ */

function obtenerEstadoUsuario(usuario) {

  if (usuario.estado_aprobacion === "PENDIENTE") {

    return "PENDIENTE";

  }

  if (usuario.estado_aprobacion === "APROBADO" && usuario.activo) {

    return "ACTIVO";

  }

  return "INACTIVO";

}


function textoEstadoUsuario(usuario) {

  const estado = obtenerEstadoUsuario(usuario);

  const etiquetas = {

    PENDIENTE: `<span class="badge badge-warning">Pendiente</span>`,

    ACTIVO: `<span class="badge badge-success">Activo</span>`,

    INACTIVO: `<span class="badge badge-danger">Desactivado</span>`

  };

  return etiquetas[estado];

}


/* ============================================================
   5. ESTADÍSTICAS
============================================================ */

function actualizarEstadisticasUsuarios() {

  const total = usuariosRegistrados.length;

  const pendientes = usuariosRegistrados.filter(
    u => obtenerEstadoUsuario(u) === "PENDIENTE"
  ).length;

  const activos = usuariosRegistrados.filter(
    u => obtenerEstadoUsuario(u) === "ACTIVO"
  ).length;

  const inactivos = usuariosRegistrados.filter(
    u => obtenerEstadoUsuario(u) === "INACTIVO"
  ).length;

  establecerTexto("usuarios-total", total);
  establecerTexto("usuarios-pendientes", pendientes);
  establecerTexto("usuarios-activos", activos);
  establecerTexto("usuarios-inactivos", inactivos);

}


function establecerTexto(id, valor) {

  const elemento = document.getElementById(id);

  if (elemento) elemento.textContent = valor;

}


/* ============================================================
   6. FILTROS
============================================================ */

function aplicarFiltrosUsuarios() {

  const busqueda = (
    document.getElementById("buscar-usuario")?.value || ""
  ).trim().toLowerCase();

  let resultados = [...usuariosRegistrados];

  if (filtroUsuariosActual !== "TODOS") {

    resultados = resultados.filter(usuario => {

      return obtenerEstadoUsuario(usuario) ===
        filtroUsuariosActual.replace("PENDIENTES", "PENDIENTE")
          .replace("ACTIVOS", "ACTIVO")
          .replace("INACTIVOS", "INACTIVO");

    });

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

  resultados.sort((a, b) => {

    const orden = {
      PENDIENTE: 1,
      ACTIVO: 2,
      INACTIVO: 3
    };

    return orden[obtenerEstadoUsuario(a)] -
      orden[obtenerEstadoUsuario(b)];

  });

  dibujarTablaUsuarios(resultados);

}


/* ============================================================
   7. TABLA DE USUARIOS
============================================================ */

function dibujarTablaUsuarios(usuarios) {

  const tabla = document.getElementById("tabla-usuarios");

  if (!tabla) return;

  if (!usuarios.length) {

    tabla.innerHTML = `
      <tr>
        <td colspan="7">No se encontraron usuarios.</td>
      </tr>
    `;

    return;

  }

  const idActual = obtenerUsuarioActual()?.id;

  tabla.innerHTML = usuarios.map(usuario => {

    const propio = usuario.id === idActual;

    const estado = obtenerEstadoUsuario(usuario);

    const nombre = escaparHTML(usuario.nombre || "Sin nombre");

    const usuarioTexto = escaparHTML(usuario.usuario || "Sin usuario");

    let botonEstado = "";

    if (!propio && estado === "PENDIENTE") {

      botonEstado = `
        <button
          class="btn btn-small btn-primary"
          data-accion="aprobar"
          data-id="${escaparHTML(usuario.id)}"
        >
          Aprobar
        </button>
      `;

    }

    if (!propio && estado === "ACTIVO") {

      botonEstado = `
        <button
          class="btn btn-small btn-secondary"
          data-accion="desactivar"
          data-id="${escaparHTML(usuario.id)}"
        >
          Desactivar
        </button>
      `;

    }

    if (!propio && estado === "INACTIVO") {

      botonEstado = `
        <button
          class="btn btn-small btn-primary"
          data-accion="reactivar"
          data-id="${escaparHTML(usuario.id)}"
        >
          Reactivar
        </button>
      `;

    }

    return `

      <tr>

        <td>
          <strong>${nombre}</strong>
          ${propio ? `<span class="badge">Tú</span>` : ""}
        </td>

        <td>${usuarioTexto}</td>

        <td>

          <select
            class="select-rol-usuario"
            data-id="${escaparHTML(usuario.id)}"
            ${propio ? "disabled" : ""}
          >

            <option value="TUTOR" ${usuario.rol === "TUTOR" ? "selected" : ""}>
              TUTOR
            </option>

            <option value="ADMIN" ${usuario.rol === "ADMIN" ? "selected" : ""}>
              ADMIN
            </option>

          </select>

        </td>

        <td>${textoEstadoUsuario(usuario)}</td>

        <td>${formatearFechaUsuario(usuario.fecha_registro)}</td>

        <td>${formatearFechaUsuario(usuario.ultimo_acceso)}</td>

        <td>

          <div class="table-actions">

            ${botonEstado}

            ${
              !propio
                ? `
                  <button
                    class="btn btn-small btn-outline"
                    data-accion="guardar-rol"
                    data-id="${escaparHTML(usuario.id)}"
                  >
                    Guardar rol
                  </button>
                `
                : "Cuenta actual"
            }

          </div>

        </td>

      </tr>

    `;

  }).join("");

}


/* ============================================================
   8. ACCIONES DE TABLA
============================================================ */

async function manejarAccionesUsuarios(evento) {

  const boton = evento.target.closest("button[data-accion]");

  if (!boton) return;

  const accion = boton.dataset.accion;

  const id = boton.dataset.id;

  if (accion === "aprobar") {

    await cambiarEstadoUsuario(id, "APROBAR");

  }

  if (accion === "desactivar") {

    await cambiarEstadoUsuario(id, "DESACTIVAR");

  }

  if (accion === "reactivar") {

    await cambiarEstadoUsuario(id, "REACTIVAR");

  }

  if (accion === "guardar-rol") {

    await guardarRolUsuario(id);

  }

}


/* ============================================================
   9. CAMBIAR ESTADO DE CUENTA
============================================================ */

async function cambiarEstadoUsuario(id, accion) {

  const db = obtenerSupabase();

  if (!db || !esAdministrador()) return;

  const usuario = usuariosRegistrados.find(
    u => u.id === id
  );

  if (!usuario) return;

  if (id === obtenerUsuarioActual()?.id) {

    mostrarMensajeUsuarios(
      "No puedes modificar tu propia cuenta.",
      "error"
    );

    return;

  }

  const configuraciones = {

    APROBAR: {
      estado: "APROBADO",
      activo: true,
      pregunta: "¿Deseas aprobar esta cuenta?",
      exito: "La cuenta fue aprobada correctamente."
    },

    DESACTIVAR: {
      estado: "APROBADO",
      activo: false,
      pregunta: "¿Deseas desactivar esta cuenta?",
      exito: "La cuenta fue desactivada correctamente."
    },

    REACTIVAR: {
      estado: "APROBADO",
      activo: true,
      pregunta: "¿Deseas reactivar esta cuenta?",
      exito: "La cuenta fue reactivada correctamente."
    }

  };

  const config = configuraciones[accion];

  if (!config) return;

  if (!confirm(
    `${config.pregunta}\n\nUsuario: ${usuario.nombre || usuario.usuario}`
  )) return;

  try {

    const { error } = await db

      .from("perfiles")

      .update({

        estado_aprobacion: config.estado,

        activo: config.activo

      })

      .eq("id", id);

    if (error) throw error;

    mostrarMensajeUsuarios(config.exito, "success");

    await cargarUsuariosRegistrados();

  } catch (error) {

    console.error(error);

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
    u => u.id === id
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

  if (nuevoRol === usuario.rol) {

    mostrarMensajeUsuarios(
      "El usuario ya tiene ese rol.",
      "warning"
    );

    return;

  }

  if (!confirm(
    `¿Cambiar el rol de ${usuario.nombre || usuario.usuario} a ${nuevoRol}?`
  )) return;

  try {

    const { error } = await db

      .from("perfiles")

      .update({ rol: nuevoRol })

      .eq("id", id);

    if (error) throw error;

    mostrarMensajeUsuarios(
      "El rol fue actualizado correctamente.",
      "success"
    );

    await cargarUsuariosRegistrados();

  } catch (error) {

    console.error(error);

    mostrarMensajeUsuarios(
      "No fue posible actualizar el rol: " + error.message,
      "error"
    );

  }

}


/* ============================================================
   11. MENSAJES
============================================================ */

function mostrarMensajeUsuarios(mensaje, tipo = "success") {

  const elemento = document.getElementById("usuarios-mensaje");

  if (!elemento) return;

  elemento.className = `alert alert-${tipo}`;

  elemento.textContent = mensaje;

  elemento.classList.remove("hidden");

}


/* ============================================================
   12. FORMATEAR FECHAS
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
   13. ESCAPAR HTML
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
