const hostUrl = window.ENV.HOST;
const formulario = document.getElementById("registroConsulta");
const boton = document.querySelector("#btnFormulario");

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();
  boton.disabled = true;
  boton.innerText = "Enviando...";

  const data = {
    nombre: document.getElementById("nombre").value.trim(),
    apellido: document.getElementById("apellido").value.trim(),
    mail: document.getElementById("mail").value.trim(),
    asunto: document.getElementById("asunto").value.trim(),
  };

  const ruta = "/consulta/registro";

  try {
    const res = await fetch(`${hostUrl}${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      formulario.reset();
      // Mostrar toast de éxito
      const toastEl = document.getElementById("toastConsulta");
      const toast = new bootstrap.Toast(toastEl);
      toast.show();

      // Restaurar botón
      boton.disabled = false;
      boton.innerText = "Enviar";

      // (Opcional) Si aún quieres redirigir después de mostrar el toast:
      // setTimeout(() => window.location.href = "check.html", 3000);

    } else {
      throw new Error("Error en la respuesta del servidor.");
    }
  } catch (error) {
    console.error(error);
    boton.disabled = false;
    boton.innerText = "Enviar";
    alert("Hubo un problema al enviar la consulta.");
  }
});
