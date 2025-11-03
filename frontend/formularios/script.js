const hostUrl = window.ENV.HOST;
const formulario = document.getElementById("registroConsulta");
const boton = document.querySelector("#btnFormulario");
const emailInput = document.getElementById("mail");
const error = document.getElementById("error"); 

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();
  boton.disabled = true;
  boton.innerText = "Enviando...";

  const email = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    error.textContent = "Por favor ingresa un correo válido.";
    emailInput.style.borderColor = "red";
    boton.disabled = false;
    boton.innerText = "Enviar";
    return;
  } 

  error.textContent = "";
  emailInput.style.borderColor = "green";
  grecaptcha.ready(async function() {
    try {
      const token = await grecaptcha.execute('6Lep0vMrAAAAAC1sCKjcCCzs-rZ_wF4-F1_LlB-8', { action: 'submit' });

      const data = {
        nombre: document.getElementById("nombre").value.trim(),
        apellido: document.getElementById("apellido").value.trim(),
        mail: email,
        asunto: document.getElementById("asunto").value.trim(),
        "g-recaptcha-response": token
      };

      const ruta = "/consulta/registro";
      const res = await fetch(`${hostUrl}${ruta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        formulario.reset();
        const toastEl = document.getElementById("toastConsulta");
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
      } else {
        throw new Error("Error en la respuesta del servidor.");
      }
    } catch (error) {
      console.error(error);
      alert("Hubo un problema al enviar la consulta.");
    } finally {
      boton.disabled = false;
      boton.innerText = "Enviar";
    }
  });
});

