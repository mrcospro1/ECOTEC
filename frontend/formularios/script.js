const hostUrl = window.ENV.HOST;
const formulario = document.getElementById("registroConsulta");
const boton = document.querySelector("#btnFormulario");

formulario.addEventListener("submit", async (e) => {
  boton.disabled = true;
  boton.innerText = "Enviando...";
  e.preventDefault();

  const data = {
    nombre: document.getElementById("nombre").value,
    apellido: document.getElementById("apellido").value,
    mail: document.getElementById("mail").value,
    asunto: document.getElementById("asunto").value,
  };

  const ruta = "/consulta/registro";

  const res = await fetch(`${hostUrl}${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    window.location.href = "/exito.html";  // ✅ Redirección correcta
  } else {
    boton.disabled = false;
    boton.innerText = "Enviar";
    alert("Hubo un problema al enviar la consulta.");
  }
});
