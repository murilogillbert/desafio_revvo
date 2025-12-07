// Script específico da página de curso
document.addEventListener('DOMContentLoaded', function () {
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

    async function initCoursePage() {
        await waitForAuthManager();
        
        // Obtém o ID do curso da URL
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('id');
        
        if (!courseId) {
            showError('ID do curso não especificado na URL');
            return;
        }
        
        // Carrega os dados do curso
        await loadCourseData(courseId);
        
        // Configura eventos
        setupEventListeners();
    }

    // Função para carregar dados do curso
    async function loadCourseData(courseId) {
        try {
            // Carrega informações do curso
            const courseResponse = await fetch(`${window.authManager.API_BASE_URL}/course.php?action=getCourse&id=${courseId}`);
            
            if (!courseResponse.ok) {
                throw new Error(`Erro na requisição: ${courseResponse.status}`);
            }
            
            const courseData = await courseResponse.json();
            
            if (courseData.error) {
                throw new Error(courseData.error);
            }
            
            // Atualiza a interface com os dados do curso
            updateCourseUI(courseData.course);
            
            // Se usuário está logado, verifica inscrição e carrega progresso
            if (window.authManager.isAuthenticated()) {
                const user = window.authManager.getCurrentUser();
                await checkUserEnrollment(courseId, user.id);
                await loadCourseProgress(courseId, user.id);
            } else {
                // Para usuários não logados, mostra apenas botão de inscrição
                showEnrollmentButtons(false, false);
            }
            
        } catch (error) {
            console.error('Erro ao carregar curso:', error);
            showError('Não foi possível carregar o curso. Tente novamente.');
        }
    }

    // Função para atualizar a interface com dados do curso
    function updateCourseUI(course) {
        // Título e breadcrumb
        document.getElementById('courseTitle').textContent = course.name;
        document.getElementById('courseTitleBreadcrumb').textContent = course.name;
        
        // Descrição
        const description = course.description || 'Este curso ainda não possui uma descrição.';
        document.getElementById('courseDescription').textContent = description;
        document.getElementById('courseFullDescription').innerHTML = `
            <p>${description}</p>
        `;
        
        // Datas
        if (course.created_at) {
            const createdDate = new Date(course.created_at).toLocaleDateString('pt-BR');
            document.getElementById('courseCreatedAt').textContent = createdDate;
            document.getElementById('courseCreatedAtSide').textContent = createdDate;
        }
        
        if (course.modified_at) {
            const updatedDate = new Date(course.modified_at).toLocaleDateString('pt-BR');
            document.getElementById('courseUpdatedAtSide').textContent = updatedDate;
        }
        
        // Imagem
        if (course.urlImage) {
            document.getElementById('courseImage').src = course.urlImage;
        }
        
        // Criador
        if (course.creator_name) {
            document.getElementById('courseCreator').textContent = course.creator_name;
        }
    }

    // Função para verificar inscrição do usuário
    async function checkUserEnrollment(courseId, userId) {
        try {
            const response = await fetch(`${window.authManager.API_BASE_URL}/user-course.php?action=checkEnrollment&userId=${userId}&courseId=${courseId}`);
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error && data.error !== 'Usuário não inscrito') {
                console.error('Erro ao verificar inscrição:', data.error);
                return;
            }
            
            // Mostra botões apropriados baseado no status
            const isEnrolled = data.enrolled || false;
            const isCompleted = data.watched_at ? true : false;
            
            showEnrollmentButtons(isEnrolled, isCompleted);
            
            // Atualiza status na interface
            if (isEnrolled) {
                document.getElementById('enrollmentStatus').style.display = 'flex';
                const statusText = isCompleted ? 'Concluído' : 'Em andamento';
                document.getElementById('courseStatus').textContent = statusText;
            }
            
        } catch (error) {
            console.error('Erro ao verificar inscrição:', error);
        }
    }

    // Função para mostrar botões apropriados
    function showEnrollmentButtons(isEnrolled, isCompleted) {
        const enrollBtn = document.getElementById('enrollBtn');
        const continueBtn = document.getElementById('continueBtn');
        const reviewBtn = document.getElementById('reviewBtn');
        const adminBtn = document.getElementById('adminBtn');
        
        // Reset todos os botões
        enrollBtn.style.display = 'none';
        continueBtn.style.display = 'none';
        reviewBtn.style.display = 'none';
        adminBtn.style.display = 'none';
        
        if (window.authManager.isAuthenticated()) {
            if (window.authManager.isAdmin()) {
                // Admin vê botão de edição
                adminBtn.style.display = 'block';
                adminBtn.onclick = () => {
                    window.location.href = `http://localhost:8000/front/src/Admin/Admin.html?edit=${courseIdFromUrl()}`;
                };
            } else if (!isEnrolled) {
                // Usuário não inscrito
                enrollBtn.style.display = 'block';
                enrollBtn.onclick = enrollInCourse;
            } else if (isCompleted) {
                // Usuário completou o curso
                reviewBtn.style.display = 'block';
                reviewBtn.onclick = continueCourse;
            } else {
                // Usuário inscrito mas não completou
                continueBtn.style.display = 'block';
                continueBtn.onclick = continueCourse;
            }
        } else {
            // Visitante vê apenas botão de inscrição (que pedirá login)
            enrollBtn.style.display = 'block';
            enrollBtn.textContent = 'FAÇA LOGIN PARA SE INSCREVER';
            enrollBtn.onclick = () => {
                if (confirm('Você precisa fazer login para se inscrever neste curso. Deseja fazer login agora?')) {
                    window.location.href = 'http://localhost:8000/front/src/Login/Login.html';
                }
            };
        }
    }

    // Função para inscrever usuário no curso
    async function enrollInCourse() {
        try {
            const courseId = courseIdFromUrl();
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
            location.reload(); // Recarrega para atualizar status
            
        } catch (error) {
            console.error('Erro ao se inscrever:', error);
            alert('Erro ao se inscrever no curso.');
        }
    }

    // Função para continuar/revisar curso
    function continueCourse() {
        const courseId = courseIdFromUrl();
        // Em implementação real, isso redirecionaria para o conteúdo
        alert('Redirecionando para o conteúdo do curso...');
        // window.location.href = `lesson.html?course=${courseId}`;
    }

    // Função para carregar progresso do usuário no curso
    async function loadCourseProgress(courseId, userId) {
        try {
            const response = await fetch(`${window.authManager.API_BASE_URL}/user-course.php?action=getCourseProgress&userId=${userId}&courseId=${courseId}`);
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                // Usuário não inscrito ou erro
                document.getElementById('progressCard').style.display = 'none';
                return;
            }
            
            // Mostra card de progresso
            document.getElementById('progressCard').style.display = 'block';
            
            // Atualiza porcentagem
            const progressPercent = data.progress || 0;
            document.getElementById('progressPercent').textContent = `${progressPercent}%`;
            
            // Atualiza círculo de progresso
            const circle = document.getElementById('progressCircle');
            const circumference = 2 * Math.PI * 54;
            const offset = circumference - (progressPercent / 100) * circumference;
            circle.style.strokeDashoffset = offset;
            
            // Atualiza estatísticas
            document.getElementById('completedLessons').textContent = data.completed_lessons || 0;
            document.getElementById('totalLessons').textContent = data.total_lessons || 0;
            
        } catch (error) {
            console.error('Erro ao carregar progresso:', error);
        }
    }

    // Função para obter courseId da URL
    function courseIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // Função para mostrar erro
    function showError(message) {
        const main = document.querySelector('.course-main');
        main.innerHTML = `
            <div class="error-container" style="text-align: center; padding: 50px 20px;">
                <div style="font-size: 60px; margin-bottom: 20px;">😞</div>
                <h2 style="color: #333; margin-bottom: 15px;">Erro ao carregar curso</h2>
                <p style="color: #666; margin-bottom: 25px; max-width: 500px; margin: 0 auto 25px;">${message}</p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <a href="http://localhost:8000/front/src/Home/Home.html" 
                       style="display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Voltar para Home
                    </a>
                    <a href="http://localhost:8000/front/src/Courses/Courses.html" 
                       style="display: inline-block; padding: 12px 30px; background: #239c1b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Ver todos os cursos
                    </a>
                </div>
            </div>
        `;
    }

    // Função para configurar eventos
    function setupEventListeners() {
        // Compartilhar
        document.getElementById('quickShare').addEventListener('click', () => {
            const courseUrl = window.location.href;
            const courseTitle = document.getElementById('courseTitle').textContent;
            
            if (navigator.share) {
                navigator.share({
                    title: courseTitle,
                    text: 'Confira este curso incrível!',
                    url: courseUrl
                });
            } else {
                navigator.clipboard.writeText(courseUrl).then(() => {
                    alert('Link copiado para a área de transferência!');
                });
            }
        });
    }

    // Inicializar página
    initCoursePage();
});