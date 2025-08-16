document.querySelectorAll('.lente').forEach(boton => {
  boton.addEventListener('click', () => {
    const color = boton.dataset.color;
    document.getElementById('textoPropuesta').value = `Propuesta bajo el lente ${color.toUpperCase()}: `;
  });
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(() => console.log("Service Worker registrado"))
    .catch(err => console.error("Error SW:", err));
}