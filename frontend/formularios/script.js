document.getElementById("registroConsulta").addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        nombre: document.getElementById("nombre").value,
        apellido: document.getElementById("apellido").value,
        mail: document.getElementById("mail").value,
        asunto: document.getElementById("asunto").value,
      };
      const res = await fetch("https://ecotec.onrender.com/consulta/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      console.log(result);
      alert(result.mensaje || "Registro completado");
      
    });