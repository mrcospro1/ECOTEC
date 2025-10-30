document.getElementById('calculateBtn').addEventListener('click', async () => {
  const address = document.getElementById('address').value;
  if (!address) return alert("Ingresa una dirección");

  const res = await fetch(`/api/solar/${encodeURIComponent(address)}`);
  const data = await res.json();

  document.getElementById('results').classList.remove('d-none');
  document.getElementById('production').textContent = `Producción anual: ${data.annualProductionKwh} kWh`;
  document.getElementById('savings').textContent = `Ahorro anual: $${data.annualSavings}`;
  document.getElementById('co2').textContent = `CO₂ evitado: ${data.annualCO2} kg`;
});
