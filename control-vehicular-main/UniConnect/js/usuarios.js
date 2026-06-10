// ===============================
// MÓDULO DE GESTIÓN DE USUARIOS
// ===============================

document.addEventListener("DOMContentLoaded", function() {
  const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));

  // Proteger la página
  if (!usuarioActivo) {
    window.location.href = "index.html";
    return;
  }

  // Solo el administrador puede entrar a gestión de usuarios
  if (usuarioActivo.rol !== "Administrador") {
    alert("No tienes permiso para ingresar a este módulo.");
    window.location.href = "dashboard.html";
    return;
  }

  const backBtn = document.getElementById("backBtn");

  if (backBtn) {
    backBtn.addEventListener("click", function() {
      window.location.href = "dashboard.html";
    });
  }

  const userForm = document.getElementById("userForm");
  const searchUser = document.getElementById("searchUser");

  cargarUsuarios();

  userForm.addEventListener("submit", function(event) {
    event.preventDefault();
    registrarUsuario();
  });

  searchUser.addEventListener("input", function() {
    cargarUsuarios(searchUser.value);
  });
});

function registrarUsuario() {
  const nombre = document.getElementById("nombre").value.trim();
  const dni = document.getElementById("dni").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const rol = document.getElementById("rol").value;
  const area = document.getElementById("area").value;
  const aula = document.getElementById("aula").value.trim();
  const fotoInput = document.getElementById("foto");
  const userMessage = document.getElementById("userMessage");

  if (dni.length !== 8) {
    mostrarMensaje("El DNI debe tener 8 dígitos.", "error");
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const existeDni = usuarios.some(function(usuario) {
    return usuario.dni === dni;
  });

  if (existeDni) {
    mostrarMensaje("Ya existe un usuario registrado con ese DNI.", "error");
    return;
  }

  const existeEmail = usuarios.some(function(usuario) {
    return usuario.email === email;
  });

  if (existeEmail) {
    mostrarMensaje("Ya existe un usuario registrado con ese correo.", "error");
    return;
  }

  const archivoFoto = fotoInput.files[0];

  if (archivoFoto) {
    const reader = new FileReader();

    reader.onload = function(event) {
      guardarUsuario(nombre, dni, email, password, rol, area, aula, event.target.result);
    };

    reader.readAsDataURL(archivoFoto);
  } else {
    guardarUsuario(nombre, dni, email, password, rol, area, aula, "");
  }
}

function guardarUsuario(nombre, dni, email, password, rol, area, aula, foto) {
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const nuevoUsuario = {
    id: Date.now(),
    nombre: nombre,
    dni: dni,
    email: email,
    password: password,
    rol: rol,
    area: area,
    aula: aula,
    foto: foto,
    estado: "Activo"
  };

  usuarios.push(nuevoUsuario);

  localStorage.setItem("usuarios", JSON.stringify(usuarios));

  document.getElementById("userForm").reset();

  mostrarMensaje("Usuario registrado correctamente.", "success");

  cargarUsuarios();
}

function cargarUsuarios(filtro = "") {
  const usersTableBody = document.getElementById("usersTableBody");

  if (!usersTableBody) {
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const textoFiltro = filtro.toLowerCase();

 const usuariosFiltrados = usuarios.filter(function(usuario) {
  return (
    String(usuario.nombre || "").toLowerCase().includes(textoFiltro) ||
    String(usuario.dni || "").toLowerCase().includes(textoFiltro) ||
    String(usuario.email || "").toLowerCase().includes(textoFiltro) ||
    String(usuario.rol || "").toLowerCase().includes(textoFiltro) ||
    String(usuario.area || "").toLowerCase().includes(textoFiltro)
  );
});

  usersTableBody.innerHTML = "";

  if (usuariosFiltrados.length === 0) {
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="8">No se encontraron usuarios.</td>
      </tr>
    `;
    return;
  }

  usuariosFiltrados.forEach(function(usuario) {
    const fila = document.createElement("tr");

    const foto = usuario.foto 
      ? usuario.foto 
      : "https://via.placeholder.com/45?text=U";

    fila.innerHTML = `
      <td>
        <img src="${foto}" class="user-photo" alt="Foto de usuario">
      </td>
      <td>${usuario.nombre}</td>
      <td>${usuario.dni || "Sin DNI"}</td>
      <td>${usuario.email}</td>
      <td><span class="role-badge">${usuario.rol}</span></td>
      <td>${usuario.area}</td>
      <td>${usuario.aula || "No asignado"}</td>
      <td>
        <button class="delete-btn" onclick="eliminarUsuario(${usuario.id})">
          Eliminar
        </button>
      </td>
    `;

    usersTableBody.appendChild(fila);
  });
}

function eliminarUsuario(id) {
  const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));

  if (usuarioActivo && usuarioActivo.id === id) {
    alert("No puedes eliminar el usuario con el que tienes la sesión iniciada.");
    return;
  }

  const confirmar = confirm("¿Seguro que deseas eliminar este usuario?");

  if (!confirmar) {
    return;
  }

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  usuarios = usuarios.filter(function(usuario) {
    return usuario.id !== id;
  });

  localStorage.setItem("usuarios", JSON.stringify(usuarios));

  cargarUsuarios();

  mostrarMensaje("Usuario eliminado correctamente.", "success");
}

function mostrarMensaje(texto, tipo) {
  const userMessage = document.getElementById("userMessage");

  userMessage.textContent = texto;
  userMessage.className = "message " + tipo;

  setTimeout(function() {
    userMessage.textContent = "";
    userMessage.className = "message";
  }, 3000);
}