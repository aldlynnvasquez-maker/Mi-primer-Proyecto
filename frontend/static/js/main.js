// --- CONFIGURACIÓN DE LA API ---
// Detecta si estás en localhost o en un servidor real
const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
// Si tu backend corre en el puerto 5000, ajusta aquí. En Vercel suele ser relativo '/'.
const API_BASE = isLocal ? "http://127.0.0.1:5000" : ""; 

console.log("Modo:", isLocal ? "Local" : "Producción");
console.log("Conectando a:", API_BASE);

// --- ESTADO GLOBAL ---
// Aquí guardamos por quién vota el usuario en cada categoría
let votos = { 
    "presidente": null, 
    "vicepresidente": null,
    "senador": null,
    "diputado": null,
    "parlamentario": null
};

let partidosData = [];
let dniSesion = null;
let nombreSesion = "";

// Definimos las categorías para pintar la tabla dinámicamente
const categorias = [
    { key: "presidente", label: "Presidente de la República", jsonKey: "presidente" },
    { key: "vicepresidente", label: "Vicepresidentes", jsonKey: "vice" },
    { key: "senador", label: "Senadores", jsonKey: "senadores" },
    { key: "diputado", label: "Diputados", jsonKey: "diputados" },
    { key: "parlamentario", label: "Parlamento Andino", jsonKey: "parlamento_andino" }
];

// --- 1. LÓGICA DE VALIDACIÓN (LOGIN) ---
async function validarDNI() {
    const input = document.getElementById('input-dni');
    const dni = input.value.trim();

    // Validación visual básica
    if (dni.length !== 8 || isNaN(dni)) {
        mostrarErrorDNI("El DNI debe tener 8 dígitos numéricos.");
        return;
    }

    try {
        console.log("Validando DNI:", dni);
        
        // Tu endpoint GET espera el DNI como parámetro en la URL
        const response = await fetch(`${API_BASE}/api/usuario?dni=${dni}`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            // ÉXITO: Usuario encontrado y no ha votado
            dniSesion = parseInt(dni); 
            nombreSesion = data.nombre || "Ciudadano"; 
            
            console.log("Bienvenido:", nombreSesion);
            alert(`Bienvenido, ${nombreSesion}`);
            
            // Pasar a la pantalla de votación (saltamos idioma por brevedad)
            showScreen('screen-ballot'); 
        } else {
            // ERROR: Usuario no existe o ya votó (404)
            mostrarErrorDNI(data.Error || "Error desconocido");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        mostrarErrorDNI("No se pudo conectar con el servidor.");
    }
}

function mostrarErrorDNI(msg) {
    const errorText = document.getElementById('dni-error-text');
    const errorCont = document.getElementById('dni-error');
    
    if(errorText) errorText.innerText = msg;
    if(errorCont) errorCont.classList.remove('hidden');
}

// --- 2. LÓGICA DE CARGA DE CANDIDATOS ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`${API_BASE}/api/candidatos`);
        if (!response.ok) throw new Error("Error obteniendo candidatos");
        
        const data = await response.json();
        partidosData = data.partidos;
        
        renderBallotGrid();
    } catch (e) { 
        console.error("Error cargando candidatos", e);
        const grid = document.getElementById('ballot-grid');
        if(grid) grid.innerHTML = "<p style='color:red; text-align:center'>Error de conexión cargando datos.</p>";
    }
});

function renderBallotGrid() {
    const grid = document.getElementById('ballot-grid');
    if(!grid) return;

    // Crear el encabezado de la tabla (Partidos)
    let html = `<div class="grid" style="grid-template-columns: 200px repeat(${partidosData.length}, 1fr);">`;
    
    // Esquina vacía
    html += `<div class="bg-gray-100 p-4 border-b border-r flex items-center justify-center font-bold text-gray-400">CATEGORÍA</div>`;
    
    // Columnas de partidos
    partidosData.forEach((p, idx) => {
        html += `<div class="p-4 text-white text-center border-b border-r relative" style="background-color: ${p.color}">
                    <div class="text-3xl font-bold opacity-50 absolute top-2 right-4">${idx + 1}</div>
                    <h3 class="font-bold text-sm mt-8">${p.nombre}</h3>
                 </div>`;
    });

    // Filas de Categorías
    categorias.forEach(cat => {
        // Columna izquierda (Nombre categoría)
        html += `<div class="bg-gray-50 p-6 border-b border-r flex items-center font-semibold text-gray-700">${cat.label}</div>`;
        
        // Celdas de votación
        partidosData.forEach(p => {
            // Lógica para sacar el nombre del candidato según tu JSON
            let candidatoNombre = "Candidato";
            if (p.candidatos && p.candidatos[cat.jsonKey]) {
                // Usar la clave correcta del JSON
                const val = p.candidatos[cat.jsonKey];
                candidatoNombre = (typeof val === 'object') ? val.presidente : val;
            }

            // Verificar si está seleccionado
            const isSelected = votos[cat.key] === p.id ? 'selected bg-blue-50' : 'bg-white';
            
            // HTML de la celda
            html += `<div id="cell-${cat.key}-${p.id}" 
                          class="p-4 border-b border-r cursor-pointer hover:bg-gray-50 transition ${isSelected}" 
                          onclick="selectVote('${cat.key}', '${p.id}')">
                        
                        <div class="flex justify-end mb-2">
                            <div class="check-box bg-white w-6 h-6 border rounded"></div>
                        </div>
                        
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                <img src="https://ui-avatars.com/api/?name=${candidatoNombre}&background=random" alt="img">
                            </div>
                            <div class="text-xs">
                                <span class="font-bold block">${candidatoNombre}</span>
                            </div>
                        </div>
                     </div>`;
        });
    });

    html += `</div>`; // Cerrar grid
    grid.innerHTML = html;
}

function selectVote(cat, partidoId) {
    // 1. Guardar voto en el estado global
    votos[cat] = partidoId;
    
    console.log(`Voto registrado en ${cat} para el partido ${partidoId}`);

    // 2. Actualizar visualmente (Quitar selección anterior, poner nueva)
    // Limpiar toda la fila visualmente
    partidosData.forEach(p => {
        const cell = document.getElementById(`cell-${cat}-${p.id}`);
        if(cell) { 
            cell.classList.remove('selected', 'bg-blue-50'); 
            cell.classList.add('bg-white'); 
        }
    });

    // Marcar la celda seleccionada
    const activeCell = document.getElementById(`cell-${cat}-${partidoId}`);
    if(activeCell) { 
        activeCell.classList.add('selected', 'bg-blue-50'); 
        activeCell.classList.remove('bg-white'); 
    }
}

// --- 3. CONFIRMACIÓN Y ENVÍO ---

// Función para ir a la pantalla de confirmación (Paso intermedio)
function goToConfirm() {
    // Validar que haya votado en todo (como pide tu python)
    for (let key in votos) {
        if (votos[key] === null) {
            alert("Debe seleccionar un candidato en todas las categorías.");
            return;
        }
    }
    
    // Renderizar lista de confirmación
    const list = document.getElementById('confirmation-list');
    if(list) {
        list.innerHTML = '';
        categorias.forEach(cat => {
            const partidoId = votos[cat.key];
            const partido = partidosData.find(p => p.id === partidoId);
            
            list.innerHTML += `
                <div class="bg-white p-4 rounded border mb-2 flex justify-between items-center">
                    <span class="font-bold text-gray-500 text-sm uppercase">${cat.label}</span>
                    <span class="font-bold text-blue-900">${partido ? partido.nombre : 'Error'}</span>
                </div>`;
        });
    }

    showScreen('screen-confirm');
}

async function emitirVotoOficial() {
    if (!dniSesion) { 
        alert("Sesión expirada. Ingrese DNI nuevamente."); 
        showScreen('screen-login'); 
        return; 
    }
    
    // Generamos un ID de voto simple basado en la fecha (timestamp) 
    const idVotoGenerado = Date.now(); 

    // Construimos el objeto EXACTAMENTE como lo pide tu index.py en votar()
    const payload = {
        "id_voto": idVotoGenerado,
        "dni": dniSesion,
        "presidente": votos.presidente,
        "vicepresidente": votos.vicepresidente,
        "diputado": votos.diputado,
        "parlamentario": votos.parlamentario,
        "senador": votos.senador
    };

    console.log("Enviando voto al backend:", JSON.stringify(payload));

    try {
        const res = await fetch(`${API_BASE}/api/votar`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (res.ok) {
            console.log("Éxito:", result.message);
            showScreen('screen-success');
        } else {
            console.error("Error del servidor:", result);
            alert("Error: " + (result.error || "No se pudo registrar el voto"));
        }
    } catch (e) { 
        console.error("Error de red:", e);
        alert("Error de conexión al enviar voto."); 
    }
}

// --- NAVEGACIÓN ENTRE PANTALLAS ---
function showScreen(id) {
    // Ocultar todas
    const screens = ['screen-login', 'screen-language', 'screen-ballot', 'screen-confirm', 'screen-success'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
    
    // Mostrar la deseada
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
    
    window.scrollTo(0,0);
}

// Función auxiliar para idioma (si la usas)
function setLanguage(l) { 
    // Por ahora redirige directo a la boleta
    showScreen('screen-ballot'); 
}