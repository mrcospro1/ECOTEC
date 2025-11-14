const hostUrl = window.ENV.HOST;
// Asegúrate de tener:
// emailjs.init('YOUR_PUBLIC_KEY');

// 🔑 CONFIGURACIÓN DE EMAILJS
const SERVICE_ID = 'service_rcforg8'; 
const TEMPLATE_ID = 'template_d1enr3h'; 

// ... (Tu código de validación de formulario y botón deshabilitado) ...

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

    try {
        // --- PASO 1: GUARDAR EN SUPABASE (Backend) ---
        const dataToSend = {
            nombre: document.getElementById("nombre").value.trim(),
            apellido: document.getElementById("apellido").value.trim(),
            mail: email,
            asunto: document.getElementById("asunto").value.trim(),
        };

        const res = await fetch(`${hostUrl}/consulta/registro`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSend),
        });

        if (!res.ok) {
            throw new Error("Error al guardar en la base de datos.");
        }
        
        const backendData = await res.json();
        const nuevaConsulta = backendData.consulta; // Aquí están id, fecha, etc.

        // --- PASO 2: ENVIAR CORREO (Frontend con EmailJS) ---
        
        // Creamos los parámetros para EmailJS usando los datos del backend
        const emailjsParams = {
            id: nuevaConsulta.id,
            fecha: new Date(nuevaConsulta.fecha).toLocaleString(), // Formateamos la fecha
            nombre: nuevaConsulta.nombre,
            apellido: nuevaConsulta.apellido,
            email: nuevaConsulta.mail, // Usamos 'email' como Reply-To o variable
            asunto: nuevaConsulta.asunto,
            // Si necesitas el email del cliente en el botón "Responder" del correo
            // ¡asegúrate de que tu plantilla de EmailJS use {{email}} o {{mail}}!
        };

        const emailRes = await emailjs.send(SERVICE_ID, TEMPLATE_ID, emailjsParams);

        if (emailRes.status === 200) {
            // Éxito total: Guardado en BD y envío de email
            formulario.reset();
            const toastEl = document.getElementById("toastConsulta");
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        } else {
            console.warn("Consulta guardada, pero falló el envío del email.");
            alert("Consulta guardada, pero hubo un problema con la notificación por correo.");
        }

    } catch (error) {
        console.error(error);
        alert("Hubo un problema. Revisa la consola.");
    } finally {
        boton.disabled = false;
        boton.innerText = "Enviar";
    }
});