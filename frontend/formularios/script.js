document.getElementById("registroConsulta").addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const data = {
        asunto: document.getElementById("asunto").value,
        mail: document.getElementById("mail").value,
      };
      const res = await fetch("http://localhost:3000/consulta/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      console.log(result);
      alert(result.mensaje || "Registro completado");
    });