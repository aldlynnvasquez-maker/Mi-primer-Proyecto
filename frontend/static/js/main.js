// Configuración de API
const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
const API_BASE = isLocal ? "http://127.0.0.1:5000/api" : "/api";

// Estado de la votación: { categoria: id_partido }
let votos = {
    "presidente": null,
    "vice": null,
    "senadores": null,
    "diputados": null,
    "parlamento_andino": null
};

// Datos globales descargados
let partidosData = [];

// Categorías oficiales (Las filas de la tabla)
const categorias = [
    { key: "presidente", label: "Presidente de la República" },
    { key: "vice", label: "Vicepresidentes" },
    { key: "senadores", label: "Senadores" },
    { key: "diputados", label: "Diputados" },
    { key: "parlamento_andino", label: "Parlamento Andino" }
];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`${API_BASE}/candidatos`);
        const data = await response.json();
        partidosData = data.partidos;
        renderBallotGrid(); // Dibujar la tabla
    } catch (error) {
        console.error("Error API:", error);
        document.getElementById('ballot-grid').innerHTML = "<p class='text-red-500 p-4'>Error conectando al sistema electoral.</p>";
    }
});

// --- FUNCIONES DE NAVEGACIÓN ---
function showScreen(id) {
    ['screen-language', 'screen-ballot', 'screen-confirm', 'screen-success'].forEach(s => {
        document.getElementById(s).classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0,0);
}

function setLanguage(lang) {
    showScreen('screen-ballot');
}

function goBack(targetScreen) {
    showScreen(targetScreen);
}

function goToConfirm() {
    // Validar si votó en todas (Opcional, por ahora dejamos pasar vacíos como blanco)
    renderConfirmation();
    showScreen('screen-confirm');
}

// --- LÓGICA CORE: DIBUJAR LA GRILLA ---
function renderBallotGrid() {
    const grid = document.getElementById('ballot-grid');
    
    // 1. HEADER (Los Partidos)
    let html = `<div class="grid" style="grid-template-columns: 200px repeat(${partidosData.length}, 1fr);">`;
    
    // Celda vacía esquina superior izq
    html += `<div class="bg-gray-100 p-4 border-b border-r flex items-center justify-center font-bold text-gray-400">CATEGORÍA</div>`;
    
    // Columnas de Partidos
    partidosData.forEach((p, index) => {
        html += `
            <div class="p-4 text-white text-center border-b border-r relative" style="background-color: ${p.color}">
                <div class="text-3xl font-bold opacity-50 absolute top-2 right-4">${index + 1}</div>
                <div class="h-10 w-10 bg-white/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span class="text-xl">🗳️</span>
                </div>
                <h3 class="font-bold text-sm leading-tight">${p.nombre}</h3>
                <p class="text-xs opacity-80 mt-1">Slogan del partido</p>
            </div>
        `;
    });

    // 2. FILAS (Las Categorías)
    categorias.forEach(cat => {
        // Columna Izquierda: Nombre de Categoría
        html += `<div class="bg-gray-50 p-6 border-b border-r flex items-center text-gray-600 font-semibold border-l">
                    ${cat.label}
                 </div>`;

        // Celdas de votación
        partidosData.forEach(p => {
            // Buscamos el candidato de este partido para esta categoría
            let candidatoNombre = "";
            
            if (p.candidatos && p.candidatos[cat.key]) {
                if (typeof p.candidatos[cat.key] === 'object') {
                    // Si es objeto (ej: presidente y vice)
                    candidatoNombre = p.candidatos[cat.key].presidente || JSON.stringify(p.candidatos[cat.key]);
                } else {
                    // Si es texto plano
                    candidatoNombre = p.candidatos[cat.key];
                }
            } else {
                candidatoNombre = "Lista cerrada";
            }

            const isSelected = votos[cat.key] === p.id ? 'selected' : '';
            const bgClass = isSelected ? 'bg-blue-50' : 'bg-white';
            
            html += `
                <div id="cell-${cat.key}-${p.id}" 
                     class="p-4 border-b border-r cursor-pointer transition hover:bg-gray-50 ${bgClass} ${isSelected}"
                     onclick="selectVote('${cat.key}', '${p.id}')">
                     
                     <div class="flex justify-end mb-2">
                        <div class="check-box bg-white"></div>
                     </div>
                     
                     <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                             <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(candidatoNombre)}&background=random" alt="candidato">
                        </div>
                        <div class="text-xs text-gray-700 leading-tight">
                            <span class="font-bold block text-gray-900 mb-0.5">1. ${candidatoNombre}</span>
                            <span>Lista Oficial</span>
                        </div>
                     </div>
                </div>
            `;
        });
    });

    html += `</div>`; // Cierre del grid container
    grid.innerHTML = html;
}

// --- LÓGICA DE SELECCIÓN ---
function selectVote(categoria, partidoId) {
    // 1. Actualizar estado
    votos[categoria] = partidoId;

    // 2. Actualizar visualmente (DOM)
    // Limpiar selección previa en esta fila
    partidosData.forEach(p => {
        const cell = document.getElementById(`cell-${categoria}-${p.id}`);
        if(cell) {
            cell.classList.remove('selected', 'bg-blue-50');
            cell.classList.add('bg-white');
        }
    });

    // Marcar nueva selección
    const activeCell = document.getElementById(`cell-${categoria}-${partidoId}`);
    if(activeCell) {
        activeCell.classList.add('selected', 'bg-blue-50');
        activeCell.classList.remove('bg-white');
    }
}

// --- RENDERIZAR CONFIRMACIÓN ---
function renderConfirmation() {
    const list = document.getElementById('confirmation-list');
    list.innerHTML = '';

    categorias.forEach(cat => {
        const partidoId = votos[cat.key];
        let contenido = "";

        if (!partidoId) {
            contenido = `<div class="text-red-500 font-bold">Voto en Blanco</div>`;
        } else {
            const partido = partidosData.find(p => p.id === partidoId);
            if (partido) {
                const candidato = (typeof partido.candidatos[cat.key] === 'object') 
                    ? partido.candidatos[cat.key].presidente 
                    : partido.candidatos[cat.key];

                contenido = `
                    <div class="flex items-center gap-4">
                         <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style="background-color: ${partido.color}">
                            ${partido.nombre.substring(0,2).toUpperCase()}
                         </div>
                         <div>
                            <div class="font-bold text-slate-900">${partido.nombre}</div>
                            <div class="text-sm text-gray-500">${candidato}</div>
                         </div>
                    </div>
                `;
            }
        }

        list.innerHTML += `
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">${cat.label}</div>
                    ${contenido}
                </div>
                <div class="h-8 w-8 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
            </div>
        `;
    });
}

// --- ENVÍO AL BACKEND ---
async function emitirVotoOficial() {
    try {
        const response = await fetch(`${API_BASE}/votar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(votos)
        });

        if (response.ok) {
            showScreen('screen-success');
        } else {
            alert("Error al guardar voto");
        }
    } catch (e) {
        alert("Error de conexión");
    }
}