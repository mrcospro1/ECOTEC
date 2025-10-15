const chatlog = document.getElementById('chatlog');
const btn = document.getElementById("boton-respuesta");
const text = document.getElementById("inputText");

btn.addEventListener("click", sendMessage);

text.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

function appendMessage(sender, messageText) {
    const message = document.createElement('div');
    message.innerHTML = `${sender}: ${messageText}`;
    chatlog.appendChild(message);
    chatlog.scrollTop = chatlog.scrollHeight;
}

function sendMessage() {
    const textoUsuario = text.value.trim().toLowerCase();
    if (textoUsuario === '') return;

    appendMessage('Tú', text.value);
    text.value = '';

    setTimeout(() => {
        const respuestas = [
            { claves: ['hola', 'buenas', 'que tal'], respuesta: 'Hola! Un gusto, ¿qué necesitás?' },
            { claves: ['precio', 'costos'], respuesta: 'Puedes ver nuestra lista de precios actualizada aquí: <a href="https://drive.google.com/drive/folders/1onQ6MJFgyA1RBggWI7m835WnucVqfxKr?usp=drive_link">Haz click</a>.' },
            { claves: ['termotanques'], respuesta: 'Puedes ver toda la información que necesitas en la sección de servicios.' },
            { claves: ['paneles'], respuesta: 'Puedes ver detalles sobre paneles solares en la sección de energía fotovoltaica.' },
            { claves: ['sucursal', 'local', 'ubicacion'], respuesta: 'Nuestra sucursal está en Avenida Mitre N°1007, Berazategui 1888.' },
            { claves: ['proyectos'], respuesta: 'Puedes ver nuestros proyectos solares en la sección "Proyectos".' },
            { claves: ['productos', 'solares'], respuesta: 'Consulta los productos solares en la sección de servicios.' },
            { claves: ['horario', 'horarios', 'atencion'], respuesta: 'Atendemos de lunes a viernes de 10 a 18 hs y sábados de 10 a 13 hs.' },
            { claves: ['contacto', 'whatsapp'], respuesta: 'Podés contactarnos por WhatsApp al 1128549138.' }
        ];

        let response = 'No entiendo. ¿Puedes reformular?';

        for (const item of respuestas) {
            if (item.claves.some(palabra => textoUsuario.includes(palabra))) {
                response = item.respuesta;
                break;
            }
        }

        appendMessage('Bot', response);
    }, 1000);
}
