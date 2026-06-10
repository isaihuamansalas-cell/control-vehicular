// ===============================
// UNICONNECT - ASISTENCIA DIGITAL
// ===============================

let canvas;
let ctx;
let dibujando = false;
let firmaRealizada = false;

document.addEventListener("DOMContentLoaded", function() {
  const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));

  if (!usuarioActivo) {
    window.location.href = "index.html";
    return;
  }

  if (
    usuarioActivo.rol !== "Profesor" &&
    usuarioActivo.rol !== "Alumno" &&
    usuarioActivo.rol !== "Administrador"
  ) {
    alert("No tienes permiso para ingresar a este módulo.");
    window.location.href = "dashboard.html";
    return;
  }

  const backBtn = document.getElementById("backBtn");
  const attendanceForm = document.getElementById("attendanceForm");
  const attendanceFormSection = document.getElementById("attendanceFormSection");
  const dniAlumnoAsistencia = document.getElementById("dniAlumnoAsistencia");
  const clearSignatureBtn = document.getElementById("clearSignatureBtn");
  const searchAttendance = document.getElementById("searchAttendance");

  if (backBtn) {
    backBtn.addEventListener("click", function() {
      window.location.href = "dashboard.html";
    });
  }

  // El alumno solo visualiza sus asistencias.
  // El profesor y administrador pueden registrar.
  if (usuarioActivo.rol === "Alumno" && attendanceFormSection) {
    attendanceFormSection.classList.add("hidden");
  }

  configurarFechaActual();
  configurarCanvasFirma();

  if (attendanceForm) {
    attendanceForm.addEventListener("submit", function(event) {
      event.preventDefault();
      registrarAsistencia();
    });
  }

  if (dniAlumnoAsistencia) {
    dniAlumnoAsistencia.addEventListener("blur", function() {
      autocompletarAlumno();
    });
  }

  if (clearSignatureBtn) {
    clearSignatureBtn.addEventListener("click", function() {
      limpiarFirma();
    });
  }

  if (searchAttendance) {
    searchAttendance.addEventListener("input", function() {
      cargarAsistencias(searchAttendance.value);
    });
  }

  cargarAsistencias();
});

function configurarFechaActual() {
  const fechaInput = document.getElementById("fechaAsistencia");

  if (!fechaInput) {
    return;
  }

  const hoy = new Date();
  const fechaFormato = hoy.toISOString().split("T")[0];

  fechaInput.value = fechaFormato;
}

function configurarCanvasFirma() {
  canvas = document.getElementById("signatureCanvas");

  if (!canvas) {
    return;
  }

  ctx = canvas.getContext("2d");

  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#111827";

  canvas.addEventListener("mousedown", iniciarDibujo);
  canvas.addEventListener("mousemove", dibujar);
  canvas.addEventListener("mouseup", terminarDibujo);
  canvas.addEventListener("mouseleave", terminarDibujo);

  canvas.addEventListener("touchstart", iniciarDibujoTouch);
  canvas.addEventListener("touchmove", dibujarTouch);
  canvas.addEventListener("touchend", terminarDibujo);
}

function obtenerPosicionMouse(event) {
  const rect = canvas.getBoundingClientRect();

  const escalaX = canvas.width / rect.width;
  const escalaY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * escalaX,
    y: (event.clientY - rect.top) * escalaY
  };
}

function iniciarDibujo(event) {
  dibujando = true;
  firmaRealizada = true;

  const posicion = obtenerPosicionMouse(event);

  ctx.beginPath();
  ctx.moveTo(posicion.x, posicion.y);
}

function dibujar(event) {
  if (!dibujando) {
    return;
  }

  const posicion = obtenerPosicionMouse(event);

  ctx.lineTo(posicion.x, posicion.y);
  ctx.stroke();
}

function terminarDibujo() {
  dibujando = false;
}

function iniciarDibujoTouch(event) {
  event.preventDefault();

  const touch = event.touches[0];
  const rect = canvas.getBoundingClientRect();

  const escalaX = canvas.width / rect.width;
  const escalaY = canvas.height / rect.height;

  dibujando = true;
  firmaRealizada = true;

  ctx.beginPath();
  ctx.moveTo(
    (touch.clientX - rect.left) * escalaX,
    (touch.clientY - rect.top) * escalaY
  );
}

function dibujarTouch(event) {
  event.preventDefault();

  if (!dibujando) {
    return;
  }

  const touch = event.touches[0];
  const rect = canvas.getBoundingClientRect();

  const escalaX = canvas.width / rect.width;
  const escalaY = canvas.height / rect.height;

  ctx.lineTo(
    (touch.clientX - rect.left) * escalaX,
    (touch.clientY - rect.top) * escalaY
  );

  ctx.stroke();
}

function limpiarFirma() {
  if (!ctx || !canvas) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  firmaRealizada = false;
}

function autocompletarAlumno() {
  const dni = document.getElementById("dniAlumnoAsistencia").value.trim();

  if (dni.length !== 8) {
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const alumno = usuarios.find(function(usuario) {
    return String(usuario.dni) === dni && usuario.rol === "Alumno";
  });

  if (alumno) {
    document.getElementById("nombreAlumnoAsistencia").value = alumno.nombre || "";
    document.getElementById("areaAlumnoAsistencia").value = alumno.area || "";
  } else {
    mostrarMensajeAsistencia("No existe un alumno registrado con ese DNI.", "error");
  }
}

function registrarAsistencia() {
  const fecha = document.getElementById("fechaAsistencia").value;
  const curso = document.getElementById("cursoAsistencia").value.trim();
  const dniAlumno = document.getElementById("dniAlumnoAsistencia").value.trim();
  const nombreAlumno = document.getElementById("nombreAlumnoAsistencia").value.trim();
  const areaAlumno = document.getElementById("areaAlumnoAsistencia").value.trim();
  const estado = document.getElementById("estadoAsistencia").value;
  const observacion = document.getElementById("observacionAsistencia").value.trim();

  if (dniAlumno.length !== 8) {
    mostrarMensajeAsistencia("El DNI debe tener 8 dígitos.", "error");
    return;
  }

  if (estado !== "Falta" && !firmaRealizada) {
    mostrarMensajeAsistencia("El alumno debe firmar antes de guardar la asistencia.", "error");
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const alumnoExiste = usuarios.some(function(usuario) {
    return String(usuario.dni) === dniAlumno && usuario.rol === "Alumno";
  });

  if (!alumnoExiste) {
    mostrarMensajeAsistencia("Primero debes registrar al alumno en Gestión de usuarios.", "error");
    return;
  }

  let firmaDigital = "";

  if (firmaRealizada) {
    firmaDigital = canvas.toDataURL("image/png");
  }

  guardarAsistencia(fecha, curso, dniAlumno, nombreAlumno, areaAlumno, estado, observacion, firmaDigital);
}

function guardarAsistencia(fecha, curso, dniAlumno, nombreAlumno, areaAlumno, estado, observacion, firmaDigital) {
  const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
  let asistencias = JSON.parse(localStorage.getItem("asistencias")) || [];

  const nuevaAsistencia = {
    id: Date.now(),
    fecha: fecha,
    curso: curso,
    dniAlumno: dniAlumno,
    nombreAlumno: nombreAlumno,
    areaAlumno: areaAlumno,
    estado: estado,
    observacion: observacion,
    firmaDigital: firmaDigital,
    profesor: usuarioActivo.nombre,
    fechaRegistro: new Date().toLocaleString()
  };

  asistencias.push(nuevaAsistencia);

  localStorage.setItem("asistencias", JSON.stringify(asistencias));

  document.getElementById("attendanceForm").reset();

  configurarFechaActual();
  limpiarFirma();

  mostrarMensajeAsistencia("Asistencia registrada correctamente.", "success");

  cargarAsistencias();
}

function cargarAsistencias(filtro = "") {
  const attendanceTableBody = document.getElementById("attendanceTableBody");

  if (!attendanceTableBody) {
    return;
  }

  const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
  const asistencias = JSON.parse(localStorage.getItem("asistencias")) || [];
  const textoFiltro = filtro.toLowerCase();

  let asistenciasVisibles = asistencias;

  if (usuarioActivo && usuarioActivo.rol === "Alumno") {
    asistenciasVisibles = asistencias.filter(function(asistencia) {
      return String(asistencia.dniAlumno) === String(usuarioActivo.dni);
    });
  }

  const asistenciasFiltradas = asistenciasVisibles.filter(function(asistencia) {
    return (
      String(asistencia.fecha || "").toLowerCase().includes(textoFiltro) ||
      String(asistencia.curso || "").toLowerCase().includes(textoFiltro) ||
      String(asistencia.nombreAlumno || "").toLowerCase().includes(textoFiltro) ||
      String(asistencia.dniAlumno || "").toLowerCase().includes(textoFiltro) ||
      String(asistencia.areaAlumno || "").toLowerCase().includes(textoFiltro) ||
      String(asistencia.estado || "").toLowerCase().includes(textoFiltro)
    );
  });

  attendanceTableBody.innerHTML = "";

  if (asistenciasFiltradas.length === 0) {
    attendanceTableBody.innerHTML = `
      <tr>
        <td colspan="9">No se encontraron asistencias registradas.</td>
      </tr>
    `;
    return;
  }

  asistenciasFiltradas.forEach(function(asistencia) {
    const fila = document.createElement("tr");

    const claseEstado = obtenerClaseAsistencia(asistencia.estado);

    let firmaHTML = "Sin firma";

    if (asistencia.firmaDigital) {
      firmaHTML = `
        <img src="${asistencia.firmaDigital}" class="signature-preview" alt="Firma digital">
      `;
    }

    let accionHTML = "Solo lectura";

    if (
      usuarioActivo &&
      (usuarioActivo.rol === "Profesor" || usuarioActivo.rol === "Administrador")
    ) {
      accionHTML = `
        <button class="delete-btn" onclick="eliminarAsistencia(${asistencia.id})">
          Eliminar
        </button>
      `;
    }

    fila.innerHTML = `
      <td>${asistencia.fecha || "Sin fecha"}</td>
      <td>${asistencia.curso || "Sin curso"}</td>
      <td>${asistencia.nombreAlumno || "Sin alumno"}</td>
      <td>${asistencia.dniAlumno || "Sin DNI"}</td>
      <td>${asistencia.areaAlumno || "Sin área"}</td>
      <td>
        <span class="attendance-badge ${claseEstado}">
          ${asistencia.estado || "Sin estado"}
        </span>
      </td>
      <td>${firmaHTML}</td>
      <td>${asistencia.observacion || "Sin observación"}</td>
      <td>${accionHTML}</td>
    `;

    attendanceTableBody.appendChild(fila);
  });
}

function eliminarAsistencia(id) {
  const confirmar = confirm("¿Seguro que deseas eliminar este registro de asistencia?");

  if (!confirmar) {
    return;
  }

  let asistencias = JSON.parse(localStorage.getItem("asistencias")) || [];

  asistencias = asistencias.filter(function(asistencia) {
    return asistencia.id !== id;
  });

  localStorage.setItem("asistencias", JSON.stringify(asistencias));

  cargarAsistencias();

  mostrarMensajeAsistencia("Asistencia eliminada correctamente.", "success");
}

function obtenerClaseAsistencia(estado) {
  if (estado === "Presente") {
    return "attendance-presente";
  }

  if (estado === "Tardanza") {
    return "attendance-tardanza";
  }

  if (estado === "Falta") {
    return "attendance-falta";
  }

  return "";
}

function mostrarMensajeAsistencia(texto, tipo) {
  const attendanceMessage = document.getElementById("attendanceMessage");

  if (!attendanceMessage) {
    alert(texto);
    return;
  }

  attendanceMessage.textContent = texto;
  attendanceMessage.className = "message " + tipo;

  setTimeout(function() {
    attendanceMessage.textContent = "";
    attendanceMessage.className = "message";
  }, 3000);
}