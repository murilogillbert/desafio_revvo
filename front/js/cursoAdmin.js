const API_URL = "http://localhost:8000/back/api/admin.php";

// Variável global para armazenar a lista de cursos
let listaCursosGlobal = [];

// -------------------- LISTAR CURSOS --------------------
async function listarCursos() {
    try {
        const resposta = await fetch(`${API_URL}?action=listarCurso`);
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const cursos = await resposta.json();
        
        // Armazena os cursos na variável global
        listaCursosGlobal = cursos;
        window.listaCursos = cursos; // Para compatibilidade
        
        preencherLista(cursos);
    } catch (error) {
        console.error('Erro ao listar cursos:', error);
        mostrarMensagem('Erro ao carregar cursos. Verifique sua conexão.', 'erro');
    }
}

// -------------------- CRIAR CURSO --------------------
async function criarCurso(dados) {
    try {
        // Validação básica
        if (!dados.name || dados.name.trim() === '') {
            mostrarMensagem('Por favor, insira um nome para o curso', 'erro');
            return;
        }
        
        const resposta = await fetch(`${API_URL}?action=criarCurso`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(dados)
        });
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const resultado = await resposta.json();
        
        if (resultado.success) {
            mostrarMensagem('Curso criado com sucesso!', 'sucesso');
            listarCursos();
        } else {
            mostrarMensagem(resultado.message || 'Erro ao criar curso', 'erro');
        }
    } catch (error) {
        console.error('Erro ao criar curso:', error);
        mostrarMensagem('Erro ao criar curso. Tente novamente.', 'erro');
    }
}

// -------------------- DELETAR CURSO --------------------
async function deletarCurso(id) {
    if (!confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const resposta = await fetch(`${API_URL}?action=deletarCurso&id=${id}`);
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const resultado = await resposta.json();
        
        if (resultado.success) {
            mostrarMensagem('Curso excluído com sucesso!', 'sucesso');
            listarCursos();
        } else {
            mostrarMensagem(resultado.message || 'Erro ao excluir curso', 'erro');
        }
    } catch (error) {
        console.error('Erro ao deletar curso:', error);
        mostrarMensagem('Erro ao excluir curso. Tente novamente.', 'erro');
    }
}

// -------------------- MODIFICAR CURSO --------------------
async function modificarCurso(dados) {
    try {
        // Validação básica
        if (!dados.name || dados.name.trim() === '') {
            mostrarMensagem('Por favor, insira um nome para o curso', 'erro');
            return;
        }
        
        const resposta = await fetch(`${API_URL}?action=modificarCurso`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(dados)
        });
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const resultado = await resposta.json();
        
        if (resultado.success) {
            mostrarMensagem('Curso atualizado com sucesso!', 'sucesso');
            listarCursos();
        } else {
            mostrarMensagem(resultado.message || 'Erro ao atualizar curso', 'erro');
        }
    } catch (error) {
        console.error('Erro ao modificar curso:', error);
        mostrarMensagem('Erro ao atualizar curso. Tente novamente.', 'erro');
    }
}

// -------------------- FUNÇÕES DO MODAL CRIAR --------------------
function abrirModalCriar() {
    document.getElementById("modalCriarCurso").classList.remove("oculto");
    document.getElementById("modalOverlay").classList.remove("oculto");
    
    // Foco no primeiro campo
    setTimeout(() => {
        document.getElementById("inputName").focus();
    }, 100);
}

function fecharModalCriar() {
    document.getElementById("modalCriarCurso").classList.add("oculto");
    document.getElementById("modalOverlay").classList.add("oculto");
    
    // Limpa os campos
    document.getElementById("inputName").value = '';
    document.getElementById("inputDescription").value = '';
    document.getElementById("inputUrlImage").value = '';
}

function submitCriarCurso() {
    const dados = {
        idCreator: 1, // ID do administrador (ajustar conforme sua lógica de autenticação)
        name: document.getElementById("inputName").value.trim(),
        description: document.getElementById("inputDescription").value.trim(),
        urlImage: document.getElementById("inputUrlImage").value.trim()
    };

    criarCurso(dados);
    fecharModalCriar();
}

// -------------------- FUNÇÕES DO MODAL EDITAR --------------------
function abrirModalEditar(id) {
    // Usa a variável global para encontrar o curso
    const curso = listaCursosGlobal.find(c => c.id == id);
    
    if (!curso) {
        mostrarMensagem('Erro: curso não encontrado.', 'erro');
        return;
    }
    
    // Preenche os campos do modal com os dados do curso
    document.getElementById("editId").value = curso.id;
    document.getElementById("editName").value = curso.name || '';
    document.getElementById("editDescription").value = curso.description || '';
    document.getElementById("editUrlImage").value = curso.urlImage || '';
    
    // Mostra o modal e o overlay
    document.getElementById("modalEditarCurso").classList.remove("oculto");
    document.getElementById("modalOverlay").classList.remove("oculto");
    
    // Foco no primeiro campo
    setTimeout(() => {
        document.getElementById("editName").focus();
    }, 100);
}

function fecharModalEditar() {
    document.getElementById("modalEditarCurso").classList.add("oculto");
    document.getElementById("modalOverlay").classList.add("oculto");
    
    // Limpa os campos
    document.getElementById("editId").value = '';
    document.getElementById("editName").value = '';
    document.getElementById("editDescription").value = '';
    document.getElementById("editUrlImage").value = '';
}

function submitEditarCurso() {
    const id = document.getElementById("editId").value;
    
    if (!id) {
        mostrarMensagem('ID do curso não encontrado!', 'erro');
        return;
    }
    
    const dados = {
        id: parseInt(id),
        name: document.getElementById("editName").value.trim(),
        description: document.getElementById("editDescription").value.trim(),
        urlImage: document.getElementById("editUrlImage").value.trim(),
        idCreator: 1 // Mantém o mesmo criador
    };
    
    modificarCurso(dados);
    fecharModalEditar();
}

// -------------------- FUNÇÃO AUXILIAR PARA FECHAR TODOS OS MODAIS --------------------
function fecharModais() {
    fecharModalCriar();
    fecharModalEditar();
}

// -------------------- MONTAR LISTA NO HTML --------------------
function preencherLista(lista) {
    const container = document.getElementById("listaDeCursos");
    container.innerHTML = ""; // limpa

    if (!lista || lista.length === 0) {
        container.innerHTML = `
            <div class="sem-cursos">
                <p>Nenhum curso encontrado.</p>
                <p>Clique em "Adicionar novo curso" para começar.</p>
            </div>
        `;
        return;
    }

    lista.forEach(curso => {
        const card = document.createElement("div");
        card.classList.add("curso-card");

        // Usa uma imagem padrão se não houver URL
        const imagemUrl = curso.urlImage && curso.urlImage.trim() !== '' 
            ? curso.urlImage 
            : '/front/assets/default-course.jpg';

        card.innerHTML = `
            <img src="${imagemUrl}" 
                 class="curso-img" 
                 alt="${curso.name}"
                 onerror="this.src='/front/assets/default-course.jpg'">
            
            <h3>${curso.name || 'Curso sem nome'}</h3>
            
            <p class="curso-descricao">${curso.description || 'Sem descrição'}</p>
            
            <div class="curso-actions">
                <button class="btn-editar" onclick="abrirModalEditar(${curso.id})">Editar</button>
                <button class="btn-deletar" onclick="deletarCurso(${curso.id})">Excluir</button>
            </div>
        `;

        container.appendChild(card);
    });
}

// -------------------- FUNÇÃO PARA MOSTRAR MENSAGENS --------------------
function mostrarMensagem(mensagem, tipo = 'info') {
    // Remove mensagens anteriores
    const mensagemAnterior = document.querySelector('.mensagem-flutuante');
    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }
    
    // Cria nova mensagem
    const divMensagem = document.createElement('div');
    divMensagem.className = `mensagem-flutuante mensagem-${tipo}`;
    divMensagem.textContent = mensagem;
    
    // Estilos inline para a mensagem
    divMensagem.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        animation: fadeInOut 3s ease-in-out;
    `;
    
    // Cores baseadas no tipo
    if (tipo === 'sucesso') {
        divMensagem.style.backgroundColor = '#28a745';
    } else if (tipo === 'erro') {
        divMensagem.style.backgroundColor = '#dc3545';
    } else {
        divMensagem.style.backgroundColor = '#007bff';
    }
    
    document.body.appendChild(divMensagem);
    
    // Remove automaticamente após 3 segundos
    setTimeout(() => {
        if (divMensagem.parentNode) {
            divMensagem.style.opacity = '0';
            divMensagem.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (divMensagem.parentNode) {
                    divMensagem.remove();
                }
            }, 500);
        }
    }, 3000);
}

// -------------------- INICIALIZAÇÃO --------------------
// Exibe ao carregar a página
window.onload = function() {
    listarCursos();
    
    // Adiciona estilos CSS para a animação da mensagem
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            15% { opacity: 1; transform: translateY(0); }
            85% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
        }
        
        .sem-cursos {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .sem-cursos p:first-child {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .curso-descricao {
            max-height: 60px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
        }
    `;
    document.head.appendChild(style);
};