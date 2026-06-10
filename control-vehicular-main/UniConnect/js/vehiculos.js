// ===============================
// UNICONNECT - CONTROL VEHICULAR
// ===============================

document.addEventListener("DOMContentLoaded", function() {
  const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));

  if (!usuarioActivo) {
    window.location.href = "index.html";
    return;
  }

  if (usuarioActivo.rol !== "Administrador" && usuarioActivo.rol !== "Seguridad") {
    alert("No tienes permiso para ingresar a este módulo.");
    window.location.href = "dashboard.html";
    return;
  }

  const backBtn = document.getElementById("backBtn");
  const vehicleForm = document.getElementById("vehicleForm");
  const searchVehicle = document.getElementById("searchVehicle");
  const vehicleFormSection = document.getElementById("vehicleFormSection");
  const dniPropietario = document.getElementById("dniPropietario");

  if (backBtn) {
    backBtn.addEventListener("click", function() {
      window.location.href = "dashboard.html";
    });
  }

  // Seguridad solo consulta, no registra
  if (usuarioActivo.rol === "Seguridad" && vehicleFormSection) {
    vehicleFormSection.classList.add("hidden");
  }

  if (vehicleForm) {
    vehicleForm.addEventListener("submit", function(event) {
      event.preventDefault();
      registrarVehiculo();
    });
  }

  if (searchVehicle) {
    searchVehicle.addEventListener("input", function() {
      cargarVehiculos(searchVehicle.value);
    });
  }

  if (dniPropietario) {
    dniPropietario.addEventListener("blur", function() {
      autocompletarPropietario();
    });
  }

  cargarVehiculos();
});

function autocompletarPropietario() {
  const dni = document.getElementById("dniPropietario").value.trim();

  if (dni.length !== 8) {
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuario = usuarios.find(function(item) {
    return String(item.dni) === dni;
  });

  if (usuario) {
    document.getElementById("nombrePropietario").value = usuario.nombre || "";
    document.getElementById("areaPropietario").value = usuario.area || "";
  } else {
    mostrarMensajeVehiculo("No existe un usuario registrado con ese DNI.", "error");
  }
}

function registrarVehiculo() {
  const dniPropietario = document.getElementById("dniPropietario").value.trim();
  const nombrePropietario = document.getElementById("nombrePropietario").value.trim();
  const areaPropietario = document.getElementById("areaPropietario").value.trim();
  const placa = document.getElementById("placa").value.trim().toUpperCase();
  const marca = document.getElementById("marca").value.trim();
  const modelo = document.getElementById("modelo").value.trim();
  const color = document.getElementById("color").value.trim();
  const tipoVehiculo = document.getElementById("tipoVehiculo").value;
  const estadoVehiculo = document.getElementById("estadoVehiculo").value;
  const observacionesVehiculo = document.getElementById("observacionesVehiculo").value.trim();
  const fotoVehiculoInput = document.getElementById("fotoVehiculo");
  const fotoPlacaInput = document.getElementById("fotoPlaca");

  if (dniPropietario.length !== 8) {
    mostrarMensajeVehiculo("El DNI debe tener 8 dígitos.", "error");
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuarioExiste = usuarios.some(function(usuario) {
    return String(usuario.dni) === dniPropietario;
  });

  if (!usuarioExiste) {
    mostrarMensajeVehiculo("Primero debes registrar al propietario en Gestión de usuarios.", "error");
    return;
  }

  let vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];

  const placaExiste = vehiculos.some(function(vehiculo) {
    return String(vehiculo.placa).toUpperCase() === placa;
  });

  if (placaExiste) {
    mostrarMensajeVehiculo("Ya existe un vehículo registrado con esa placa.", "error");
    return;
  }

  const archivoVehiculo = fotoVehiculoInput.files[0];
  const archivoPlaca = fotoPlacaInput.files[0];

  convertirImagenes(archivoVehiculo, archivoPlaca, function(fotoVehiculo, fotoPlaca) {
    guardarVehiculo(
      dniPropietario,
      nombrePropietario,
      areaPropietario,
      placa,
      marca,
      modelo,
      color,
      tipoVehiculo,
      estadoVehiculo,
      observacionesVehiculo,
      fotoVehiculo,
      fotoPlaca
    );
  });
}

function convertirImagenes(archivoVehiculo, archivoPlaca, callback) {
  let fotoVehiculo = "";
  let fotoPlaca = "";

  if (!archivoVehiculo && !archivoPlaca) {
    callback(fotoVehiculo, fotoPlaca);
    return;
  }

  if (archivoVehiculo) {
    const readerVehiculo = new FileReader();

    readerVehiculo.onload = function(event) {
      fotoVehiculo = event.target.result;

      if (archivoPlaca) {
        leerFotoPlaca();
      } else {
        callback(fotoVehiculo, fotoPlaca);
      }
    };

    readerVehiculo.readAsDataURL(archivoVehiculo);
  } else {
    leerFotoPlaca();
  }

  function leerFotoPlaca() {
    const readerPlaca = new FileReader();

    readerPlaca.onload = function(event) {
      fotoPlaca = event.target.result;
      callback(fotoVehiculo, fotoPlaca);
    };

    readerPlaca.readAsDataURL(archivoPlaca);
  }
}

function guardarVehiculo(
  dniPropietario,
  nombrePropietario,
  areaPropietario,
  placa,
  marca,
  modelo,
  color,
  tipoVehiculo,
  estadoVehiculo,
  observacionesVehiculo,
  fotoVehiculo,
  fotoPlaca
) {
  let vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];

  const nuevoVehiculo = {
    id: Date.now(),
    dniPropietario: dniPropietario,
    nombrePropietario: nombrePropietario,
    areaPropietario: areaPropietario,
    placa: placa,
    marca: marca,
    modelo: modelo,
    color: color,
    tipoVehiculo: tipoVehiculo,
    estadoVehiculo: estadoVehiculo,
    observacionesVehiculo: observacionesVehiculo,
    fotoVehiculo: fotoVehiculo,
    fotoPlaca: fotoPlaca,
    fechaRegistro: new Date().toLocaleDateString()
  };

  vehiculos.push(nuevoVehiculo);

  localStorage.setItem("vehiculos", JSON.stringify(vehiculos));

  document.getElementById("vehicleForm").reset();

  mostrarMensajeVehiculo("Vehículo registrado correctamente.", "success");

  cargarVehiculos();
}

function cargarVehiculos(filtro = "") {
  const vehiclesTableBody = document.getElementById("vehiclesTableBody");

  if (!vehiclesTableBody) {
    return;
  }

  const vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];
  const textoFiltro = filtro.toLowerCase();

  const vehiculosFiltrados = vehiculos.filter(function(vehiculo) {
    return (
      String(vehiculo.nombrePropietario || "").toLowerCase().includes(textoFiltro) ||
      String(vehiculo.dniPropietario || "").toLowerCase().includes(textoFiltro) ||
      String(vehiculo.areaPropietario || "").toLowerCase().includes(textoFiltro) ||
      String(vehiculo.placa || "").toLowerCase().includes(textoFiltro) ||
      String(vehiculo.marca || "").toLowerCase().includes(textoFiltro) ||
      String(vehiculo.modelo || "").toLowerCase().includes(textoFiltro) ||
      String(vehiculo.color || "").toLowerCase().includes(textoFiltro) ||
      String(vehiculo.estadoVehiculo || "").toLowerCase().includes(textoFiltro)
    );
  });

  vehiclesTableBody.innerHTML = "";

  if (vehiculosFiltrados.length === 0) {
    vehiclesTableBody.innerHTML = `
      <tr>
        <td colspan="12">No se encontraron vehículos registrados.</td>
      </tr>
    `;
    return;
  }

  const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));

  vehiculosFiltrados.forEach(function(vehiculo) {
    const fila = document.createElement("tr");

    const fotoVehiculo = vehiculo.fotoVehiculo || generarImagenPlaceholder("V");
    const fotoPlaca = vehiculo.fotoPlaca || generarImagenPlaceholder("P");

    const claseEstado = obtenerClaseEstado(vehiculo.estadoVehiculo);

    let botonAccion = "Solo consulta";

    if (usuarioActivo && usuarioActivo.rol === "Administrador") {
      botonAccion = `
        <button class="delete-btn" onclick="eliminarVehiculo(${vehiculo.id})">
          Eliminar
        </button>
      `;
    }

    fila.innerHTML = `
      <td>
        <img src="${fotoVehiculo}" class="vehicle-photo" alt="Foto del vehículo">
      </td>
      <td><strong>${vehiculo.placa || "Sin placa"}</strong></td>
      <td>${vehiculo.nombrePropietario || "Sin propietario"}</td>
      <td>${vehiculo.dniPropietario || "Sin DNI"}</td>
      <td>${vehiculo.areaPropietario || "Sin área"}</td>
      <td>${vehiculo.marca || "Sin marca"}</td>
      <td>${vehiculo.modelo || "Sin modelo"}</td>
      <td>${vehiculo.color || "Sin color"}</td>
      <td>${vehiculo.tipoVehiculo || "Sin tipo"}</td>
      <td>
        <span class="status-badge ${claseEstado}">
          ${vehiculo.estadoVehiculo || "Sin estado"}
        </span>
      </td>
      <td>
        <img src="${fotoPlaca}" class="plate-photo" alt="Foto de placa">
      </td>
      <td>${botonAccion}</td>
    `;

    vehiclesTableBody.appendChild(fila);
  });
}

function eliminarVehiculo(id) {
  const confirmar = confirm("¿Seguro que deseas eliminar este vehículo?");

  if (!confirmar) {
    return;
  }

  let vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];

  vehiculos = vehiculos.filter(function(vehiculo) {
    return vehiculo.id !== id;
  });

  localStorage.setItem("vehiculos", JSON.stringify(vehiculos));

  cargarVehiculos();

  mostrarMensajeVehiculo("Vehículo eliminado correctamente.", "success");
}

function obtenerClaseEstado(estado) {
  if (estado === "Autorizado") {
    return "status-autorizado";
  }

  if (estado === "Pendiente") {
    return "status-pendiente";
  }

  if (estado === "Restringido") {
    return "status-restringido";
  }

  return "";
}

function generarImagenPlaceholder(texto) {
  return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='70' height='50'><rect width='70' height='50' fill='%23cbd5e1'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23334155'>" + texto + "</text></svg>";
}

function mostrarMensajeVehiculo(texto, tipo) {
  const vehicleMessage = document.getElementById("vehicleMessage");

  if (!vehicleMessage) {
    return;
  }

  vehicleMessage.textContent = texto;
  vehicleMessage.className = "message " + tipo;

  setTimeout(function() {
    vehicleMessage.textContent = "";
    vehicleMessage.className = "message";
  }, 3000);
}