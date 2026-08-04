window.onload = function() {
    configurarTabla('tabla-est', 'body-tabla-est');
    configurarTabla('tabla-elec', 'body-tabla-elec');
    configurarTabla('tabla-rec', 'body-tabla-rec');
    configurarTabla('tabla-adm', 'body-tabla-adm');
};

function showPage(pageId) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => card.classList.remove('active'));
    
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');
}

function validarIngreso() {
    const usuarioInput = document.getElementById('user-input').value.trim();
    const passInput = document.getElementById('pass-input').value.trim();

    if (usuarioInput === "" || passInput === "") {
        alert("⛔ ¡ACCESO PROHIBIDO!\n\nDebe ingresar obligatoriamente un usuario y una contraseña para acceder a la aplicación.");
        return;
    }

    showPage('menu-card');
}

function addRow(tableId) {
    const tbodyId = 'body-' + tableId;
    const tableBody = document.getElementById(tbodyId);
    const colCount = document.getElementById(tableId).rows[0].cells.length;

    const newRow = tableBody.insertRow();
    for (let i = 0; i < colCount; i++) {
        const cell = newRow.insertCell(i);
        cell.contentEditable = "true";
        cell.setAttribute('contenteditable', 'true');
        cell.innerText = "...";
        cell.addEventListener('input', () => guardarTabla(tableId, tbodyId));
    }

    guardarTabla(tableId, tbodyId);
}

function guardarTabla(tableId, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    localStorage.setItem('rdmi_table_' + tableId, tbody.innerHTML);
}

function configurarTabla(tableId, tbodyId) {
    const savedData = localStorage.getItem('rdmi_table_' + tableId);
    const tbody = document.getElementById(tbodyId);

    if (savedData) {
        tbody.innerHTML = savedData;
    }

    const rows = tbody.querySelectorAll('tr');
    const colCount = document.getElementById(tableId).rows[0].cells.length;

    rows.forEach(row => {
        while(row.cells.length < colCount) {
            const newCell = row.insertCell();
            newCell.innerText = "...";
        }
        
        for(let i = 0; i < row.cells.length; i++) {
            const cell = row.cells[i];
            cell.setAttribute('contenteditable', 'true');
            cell.addEventListener('input', () => guardarTabla(tableId, tbodyId));
        }
    });
}

function registrarUsuario() {
    const usuario = document.getElementById('reg-user-input').value.trim();
    const password = document.getElementById('reg-pass-input').value.trim();

    if (!usuario || !password) {
        alert("⚠️ Por favor, complete ambos campos para registrar el usuario.");
        return;
    }

    alert(`✅ ¡USUARIO REGISTRADO EXITOSAMENTE!\n\nUsuario: ${usuario}\nYa puede iniciar sesión con estas credenciales.`);
    
    document.getElementById('reg-user-input').value = "";
    document.getElementById('reg-pass-input').value = "";
    showPage('login-card');
}

function enviarOrden() {
    const asunto = document.getElementById('asunto').value.trim();
    const encargado = document.getElementById('encargado').value;
    
    if (!asunto) {
        alert("⚠️ Por favor, ingrese un asunto para el reporte.");
        return;
    }

    alert(
        `🚀 ¡ORDEN ENVIADA EXITOSAMENTE!\n\n` +
        `Para: ${encargado}\n` +
        `Asunto: ${asunto}\n\n` +
        `El personal a cargo ha sido notificado automáticamente.`
    );

    document.getElementById('asunto').value = "";
    document.getElementById('detalle-orden').value = "";
}
document.addEventListener("DOMContentLoaded", () => {
    cargarCalendario();
});

function showPage(pageId) {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function validarIngreso() {
    const user = document.getElementById('user-input').value.trim();
    const pass = document.getElementById('pass-input').value.trim();
    if (!user || !pass) {
        alert("⚠️ Ingrese usuario y contraseña.");
        return;
    }
    showPage('menu-card');
    cargarCalendario();
}

// 🔍 LEER (SELECT)
async function cargarCalendario(cat = '') {
    const url = cat ? `api/calendario_api.php?categoria=${cat}` : 'api/calendario_api.php';
    try {
        const res = await fetch(url);
        const json = await res.json();
        
        const tbody = document.getElementById('tabla-calendario-body');
        tbody.innerHTML = '';

        if (json.data && json.data.length > 0) {
            json.data.forEach(item => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${item.titulo}</strong><br><small>${item.descripcion}</small></td>
                        <td><span class="badge ${item.categoria}">${item.categoria.toUpperCase()}</span></td>
                        <td>${item.encargado}</td>
                        <td><span class="priority-${item.prioridad.toLowerCase()}">${item.prioridad}</span></td>
                        <td><small>${item.fecha_inicio}<br>a ${item.fecha_fin}</small></td>
                        <td>
                            <select onchange="cambiarEstado(${item.id}, this.value)">
                                <option value="Pendiente" ${item.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="En Proceso" ${item.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                                <option value="Solucionado" ${item.estado === 'Solucionado' ? 'selected' : ''}>Solucionado</option>
                            </select>
                        </td>
                        <td>
                            <button onclick="eliminarEvento(${item.id})" class="btn-delete">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7">No hay mantenimientos agendados.</td></tr>';
        }
    } catch (err) {
        console.error("Error al cargar datos:", err);
    }
}

function filtrarCategoria(cat) {
    cargarCalendario(cat);
}

// ➕ CREAR (INSERT)
async function guardarEventoCalendario(e) {
    e.preventDefault();

    const prioridad = document.querySelector('input[name="p"]:checked').value;
    const datos = {
        titulo: document.getElementById('cal-titulo').value,
        categoria: document.getElementById('cal-categoria').value,
        encargado: document.getElementById('cal-encargado').value,
        prioridad: prioridad,
        fecha_inicio: document.getElementById('cal-inicio').value,
        fecha_fin: document.getElementById('cal-fin').value,
        descripcion: document.getElementById('cal-desc').value
    };

    const res = await fetch('api/calendario_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });

    const json = await res.json();
    if (json.status === 'success') {
        alert("✅ Mantenimiento programado en el calendario.");
        document.getElementById('form-calendario').reset();
        cargarCalendario();
    }
}

// ✏️ ACTUALIZAR (UPDATE)
async function cambiarEstado(id, nuevoEstado) {
    await fetch('api/calendario_api.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, estado: nuevoEstado })
    });
    cargarCalendario();
}

// ❌ ELIMINAR (DELETE)
async function eliminarEvento(id) {
    if (confirm("¿Está seguro de eliminar este registro del calendario?")) {
        await fetch('api/calendario_api.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        cargarCalendario();
    }
}
class ApiService {
    static baseUrl = 'index.php?action=';

    static async request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.error(`Error en API (${endpoint}):`, error);
            throw error;
        }
    }

    // Métodos para RDMI
    static async getOrdenes() {
        return this.request('ordenes/listar');
    }

    static async crearOrden(ordenData) {
        return this.request('ordenes/crear', 'POST', ordenData);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const formOrden = document.getElementById('form-orden');
    
    if (formOrden) {
        formOrden.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const payload = {
                asunto: document.getElementById('asunto').value,
                encargado: document.getElementById('encargado').value,
                descripcion: document.getElementById('descripcion').value
            };

            try {
                const res = await ApiService.crearOrden(payload);
                if (res.success) {
                    alert(`✅ Orden creada exitosamente ID: ${res.id}`);
                    formOrden.reset();
                } else {
                    alert(`⚠️ ${res.mensaje}`);
                }
            } catch (err) {
                alert("Ocurrió un error al procesar la solicitud.");
            }
        });
    }
});