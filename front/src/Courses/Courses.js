// Script específico da página de catálogo de cursos
document.addEventListener('DOMContentLoaded', function () {
    // Variáveis globais
    let currentPage = 1;
    let itemsPerPage = 20;
    let totalItems = 0;
    let totalPages = 1;
    let currentFilters = {
        search: '',
        sort: 'newest'
    };
    let isLoading = false;

    // Aguarda o authManager ser carregado
    function waitForAuthManager() {
        return new Promise((resolve) => {
            if (window.authManager) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.authManager) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    async function initCoursesPage() {
        await waitForAuthManager();
        
        // Configura eventos
        setupEventListeners();
        
        // Carrega cursos iniciais
        loadCourses();
    }

    // Função para carregar cursos
    async function loadCourses() {
        if (isLoading) return;
        
        isLoading = true;
        showLoading(true);
        hideError();
        hideNoResults();
        
        try {
            // Constrói URL com parâmetros
            const params = new URLSearchParams({
                action: 'getCourses',
                page: currentPage,
                limit: itemsPerPage,
                search: currentFilters.search,
                sort: currentFilters.sort
            });
            
            // Se usuário está logado, adiciona ID para verificar inscrições
            if (window.authManager.isAuthenticated()) {
                const user = window.authManager.getCurrentUser();
                params.append('userId', user.id);
            }
            
            const response = await fetch(`${window.authManager.API_BASE_URL}/courses.php?${params}`);
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Atualiza estatísticas
            totalItems = data.total || 0;
            totalPages = Math.ceil(totalItems / itemsPerPage);
            updateStatistics();
            
            // Renderiza cursos
            renderCourses(data.courses || []);
            
            // Atualiza paginação
            updatePagination();
            
            // Mostra/oculta mensagens
            if (data.courses.length === 0) {
                showNoResults();
            } else {
                hideNoResults();
            }
            
        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
            showError('Não foi possível carregar os cursos. Tente novamente.');
        } finally {
            isLoading = false;
            showLoading(false);
        }
    }

    // Função para renderizar cursos
    function renderCourses(courses) {
        const coursesGrid = document.getElementById('coursesGrid');
        const user = window.authManager.getCurrentUser();
        const isLoggedIn = window.authManager.isAuthenticated();
        
        if (courses.length === 0) {
            coursesGrid.innerHTML = '';
            return;
        }
        
        coursesGrid.innerHTML = courses.map(course => {
            // Determina se usuário está inscrito
            const isEnrolled = course.user_enrolled || false;
            const isCompleted = course.watched_at || false;
            
            return `
                <div class="course-card" data-course-id="${course.id}">
                    <div class="course-image">
                        <img src="${course.urlImage || `https://picsum.photos/id/${100 + (course.id % 10)}/400/250`}" 
                             alt="${course.name}">
                    </div>
                    
                    <div class="course-content">
                        <h3 class="course-title">${course.name}</h3>
                        
                        <p class="course-description">
                            ${course.description ? (course.description.substring(0, 150) + '...') : 'Descrição não disponível'}
                        </p>
                        
                        <div class="course-actions">
                            <a href="http://localhost:8000/front/src/Course/Course.html?id=${course.id}" 
                               class="btn-view">
                                Ver Curso
                            </a>
                            
                            ${!isLoggedIn ? `
                                <button class="btn-enroll-side" onclick="showLoginPrompt(${course.id})">
                                    Inscrever-se
                                </button>
                            ` : isEnrolled ? `
                                <button class="btn-enroll-side" style="background: #007bff;" 
                                        onclick="continueCourse(${course.id})">
                                    ${isCompleted ? 'Revisar' : 'Continuar'}
                                </button>
                            ` : `
                                <button class="btn-enroll-side" onclick="enrollInCourse(${course.id})">
                                    Inscrever-se
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Adiciona eventos aos botões de inscrição
        setupCourseButtons();
    }

    // Funções de UI
    function showLoading(show) {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.style.display = show ? 'flex' : 'none';
        }
    }

    function showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorMessage && errorText) {
            errorText.textContent = message;
            errorMessage.style.display = 'block';
        }
    }

    function hideError() {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

    function showNoResults() {
        const noResults = document.getElementById('noResultsMessage');
        if (noResults) {
            noResults.style.display = 'block';
        }
        document.getElementById('coursesGrid').innerHTML = '';
        document.getElementById('paginationContainer').style.display = 'none';
    }

    function hideNoResults() {
        const noResults = document.getElementById('noResultsMessage');
        if (noResults) {
            noResults.style.display = 'none';
        }
    }

    function updateStatistics() {
        document.getElementById('totalCourses').textContent = totalItems.toLocaleString();
        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        
        const startItem = ((currentPage - 1) * itemsPerPage) + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        
        document.getElementById('startItem').textContent = startItem;
        document.getElementById('endItem').textContent = endItem;
        document.getElementById('totalItems').textContent = totalItems;
    }

    function updatePagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        const pageNumbers = document.getElementById('pageNumbers');
        
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'block';
        
        // Atualiza estado dos botões de navegação
        document.getElementById('firstPage').disabled = currentPage === 1;
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
        document.getElementById('lastPage').disabled = currentPage === totalPages;
        
        // Gera números das páginas
        let pagesHtml = '';
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        // Botão para primeira página se necessário
        if (startPage > 1) {
            pagesHtml += `<button class="page-number" data-page="1">1</button>`;
            if (startPage > 2) {
                pagesHtml += `<span style="padding: 8px 12px;">...</span>`;
            }
        }
        
        // Números das páginas
        for (let i = startPage; i <= endPage; i++) {
            pagesHtml += `
                <button class="page-number ${i === currentPage ? 'active' : ''}" 
                        data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        // Botão para última página se necessário
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pagesHtml += `<span style="padding: 8px 12px;">...</span>`;
            }
            pagesHtml += `<button class="page-number" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        pageNumbers.innerHTML = pagesHtml;
        
        // Adiciona eventos aos números das páginas
        document.querySelectorAll('.page-number').forEach(button => {
            button.addEventListener('click', function() {
                if (this.classList.contains('active')) return;
                const page = parseInt(this.dataset.page);
                if (page && page !== currentPage) {
                    currentPage = page;
                    loadCourses();
                }
            });
        });
    }

    function setupCourseButtons() {
        // Configura eventos dos botões de inscrição
        document.querySelectorAll('.btn-enroll-side').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
    }

    // Função para configurar eventos
    function setupEventListeners() {
        // Busca
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        searchBtn.addEventListener('click', () => {
            currentFilters.search = searchInput.value.trim();
            currentPage = 1;
            loadCourses();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentFilters.search = searchInput.value.trim();
                currentPage = 1;
                loadCourses();
            }
        });
        
        // Ordenação
        document.getElementById('sortSelect').addEventListener('change', function() {
            currentFilters.sort = this.value;
            currentPage = 1;
            loadCourses();
        });
        
        // Limpar filtros
        document.getElementById('clearFilters').addEventListener('click', () => {
            resetFilters();
            loadCourses();
        });
        
        // Paginação
        document.getElementById('firstPage').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage = 1;
                loadCourses();
            }
        });
        
        document.getElementById('prevPage').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadCourses();
            }
        });
        
        document.getElementById('nextPage').addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadCourses();
            }
        });
        
        document.getElementById('lastPage').addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage = totalPages;
                loadCourses();
            }
        });
        
        // Itens por página
        document.getElementById('itemsPerPage').addEventListener('change', function() {
            itemsPerPage = parseInt(this.value);
            currentPage = 1;
            loadCourses();
        });
        
        // Botão de resetar busca
        document.getElementById('resetSearch').addEventListener('click', () => {
            resetFilters();
            loadCourses();
        });
        
        // Botão de tentar novamente
        document.getElementById('retryBtn').addEventListener('click', () => {
            loadCourses();
        });
    }

    function resetFilters() {
        currentFilters = {
            search: '',
            sort: 'newest'
        };
        
        // Reseta controles de UI
        document.getElementById('searchInput').value = '';
        document.getElementById('sortSelect').value = 'newest';
    }

    // Inicializar página
    initCoursesPage();
});

// Funções globais para serem chamadas dos botões de inscrição
function showLoginPrompt(courseId) {
    if (confirm('Você precisa fazer login para se inscrever neste curso. Deseja fazer login agora?')) {
        window.location.href = `http://localhost:8000/front/src/Login/Login.html?redirect=course&id=${courseId}`;
    }
}

async function enrollInCourse(courseId) {
    try {
        const user = window.authManager.getCurrentUser();
        
        const response = await fetch(`${window.authManager.API_BASE_URL}/user-course.php?action=enrollCourse`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: user.id,
                courseId: courseId
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert('Erro ao se inscrever: ' + data.error);
            return;
        }
        
        alert('Inscrição realizada com sucesso!');
        location.reload();
        
    } catch (error) {
        console.error('Erro ao se inscrever:', error);
        alert('Erro ao se inscrever no curso.');
    }
}

function continueCourse(courseId) {
    window.location.href = `http://localhost:8000/front/src/Course/Course.html?id=${courseId}`;
}