const API_URL = '/api/candidatos'; // Ruta relativa para Vercel
const VOTE_URL = '/api/votar';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('candidatos-container');

    try {
        // CONSUMO DE API (GET)
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.partidos) {
            container.innerHTML = ''; // Limpiar loader
            data.partidos.forEach(p => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.borderTop = 5px solid ${p.color};
                card.innerHTML = `
                    <h2>${p.nombre}</h2>
                    <p><strong>Pres:</strong> ${p.candidatos.presidente}</p>
                    <p><strong>Vice:</strong> ${p.candidatos.vice}</p>
                    <button class="btn-votar" onclick="votar('${p.id}', '${p.nombre}')">Votar</button>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        container.innerHTML = <p style="color:red">Error cargando API: ${error.message}</p>;
        // Fallback para desarrollo local si no se corre con flask run
        console.error("Si estás en local, asegúrate de correr 'flask --app api/index run'");
    }
});

// CONSUMO DE API (POST)
async function votar(id, nombre) {
    if(!confirm("¿Confirmas tu voto por:" +nombre+"?")) return;

    try {
        const response = await fetch(VOTE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partido_id: id, timestamp: new Date() })
        });
        const result = await response.json();
        alert(result.message);
    } catch (error) {
        alert("Error al enviar el voto");
    }
}