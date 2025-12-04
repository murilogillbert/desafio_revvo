const API_URL = "http://localhost:8000/back/api/admin.php";

// -------------------- LISTAR CURSOS --------------------
async function listarCursos() {
    const resposta = await fetch(`${API_URL}?action=listarCurso`);
    const cursos = await resposta.json();

    preencherLista(cursos);
}

// -------------------- CRIAR CURSO --------------------
async function criarCurso(dados) {
    await fetch(`${API_URL}?action=criarCurso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });

    listarCursos();
}

// -------------------- DELETAR CURSO --------------------
async function deletarCurso(id) {
    await fetch(`${API_URL}?action=deletarCurso&id=${id}`);
    listarCursos();
}

// -------------------- MODIFICAR CURSO --------------------
async function modificarCurso(dados) {
    await fetch(`${API_URL}?action=modificarCurso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });

    listarCursos();
}


// ABRIR MODAL DE CRIAR
function abrirModalCriar() {
    document.getElementById("modalCriarCurso").classList.remove("oculto");
}

// FECHAR MODAL DE CRIAR
function fecharModalCriar() {
    document.getElementById("modalCriarCurso").classList.add("oculto");
}

// ENVIAR FORMULÁRIO DO MODAL
function submitCriarCurso() {

    const dados = {
        idCreator: 1,
        name: document.getElementById("inputName").value,
        description: document.getElementById("inputDescription").value,
        urlImage: document.getElementById("inputUrlImage").value
    };

    criarCurso(dados);
    fecharModalCriar();
}

function editarCurso(id) {
    const curso = window.listaCursos.find(c => c.id == id);

    if (!curso) {
        alert("Erro: curso não encontrado.");
        return;
    }

    document.getElementById("editId").value = curso.id;
    document.getElementById("editName").value = curso.name;
    document.getElementById("editDescription").value = curso.description;
    document.getElementById("editUrlImage").value = curso.urlImage;

    document.getElementById("modalEditarCurso").classList.remove("oculto");
}

function fecharModalEditar() {
    document.getElementById("modalEditarCurso").classList.add("oculto");
}


function submitEditarCurso() {

    const dados = {
        id: document.getElementById("editId").value,
        name: document.getElementById("editName").value,
        description: document.getElementById("editDescription").value,
        urlImage: document.getElementById("editUrlImage").value,
        idCreator: 1
    };

    modificarCurso(dados);
    fecharModalEditar();
}



// -------------------- MONTAR LISTA NO HTML --------------------
function preencherLista(lista) {
    const container = document.getElementById("listaDeCursos");
    container.innerHTML = ""; // limpa

    if (lista.length === 0) {
        container.innerHTML = "<p>Nenhum curso encontrado.</p>";
        return;
    }

    lista.forEach(curso => {
        const card = document.createElement("div");
        card.classList.add("curso-card");

        card.innerHTML = `
            <img src="${curso.urlImage}" class="curso-img">

            <h3>${curso.name}</h3>

            <p>${curso.description}</p>


            <div class="curso-actions">
                <button class="btn-editar" onclick="editarCurso(${curso.id})">Editar</button>
                <button class="btn-deletar" onclick="deletarCurso(${curso.id})">Excluir</button>
            </div>
        `;

        container.appendChild(card);
    });
}

// Exibe ao carregar a página
window.onload = listarCursos;
