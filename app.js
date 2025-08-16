function abrirSeccion(color) {
  document.querySelectorAll('.seccion').forEach(sec => sec.classList.add('oculto'));
  document.getElementById('seccion-' + color).classList.remove('oculto');
}

function guardarPropuesta(color) {
  const input = document.getElementById('input-' + color).value;
  if (input.trim() === "") return alert("Escribe algo antes de guardar.");
  localStorage.setItem('propuesta-' + color, input);
  alert("Propuesta guardada en " + color);
}

function exportarMarkdown() {
  let contenido = "# Propuestas Proyecto Escolar\n\n";
  ['rojo', 'verde', 'azul', 'amarillo'].forEach(color => {
    let data = localStorage.getItem('propuesta-' + color) || "";
    contenido += "## " + color.toUpperCase() + "\n" + data + "\n\n";
  });
  const blob = new Blob([contenido], { type: "text/markdown" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = "proyecto.md";
  enlace.click();
}

function exportarTXT() {
  let contenido = "Propuestas Proyecto Escolar\n\n";
  ['rojo', 'verde', 'azul', 'amarillo'].forEach(color => {
    let data = localStorage.getItem('propuesta-' + color) || "";
    contenido += color.toUpperCase() + "\n" + data + "\n\n";
  });
  const blob = new Blob([contenido], { type: "text/plain" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = "proyecto.txt";
  enlace.click();
}

// PWA soporte
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}
