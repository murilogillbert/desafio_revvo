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
            
            // Carrega módulos/aulas do curso
            await loadCourseModules(courseId);
            
            // Carrega informações do instrutor
            if (courseData.course.idCreator) {
                await loadInstructorInfo(courseData.course.idCreator);
            }
            
            // Carrega estatísticas do curso
            await loadCourseStats(courseId);
            
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
        document.getElementById('courseDescription').textContent = course.description || 'Descrição não disponível';
        document.getElementById('courseFullDescription').innerHTML = `
            <p>${course.description || 'Este curso ainda não possui uma descrição detalhada.'}</p>
            ${course.full_description ? `<p>${course.full_description}</p>` : ''}
        `;
        
        // Datas
        if (course.created_at) {
            const createdDate = new Date(course.created_at).toLocaleDateString('pt-BR');
            document.getElementById('courseCreatedAt').textContent = createdDate;
        }
        
        if (course.modified_at) {
            const updatedDate = new Date(course.modified_at).toLocaleDateString('pt-BR');
            document.getElementById('courseUpdatedAt').textContent = updatedDate;
        }
        
        // Imagem
        if (course.urlImage) {
            document.getElementById('courseImage').src = course.urlImage;
        }
        
        // Requisitos (exemplo estático - em produção viria do banco)
        const requirementsList = document.getElementById('courseRequirements');
        requirementsList.innerHTML = `
            <li>Dominar os conceitos básicos apresentados no curso</li>
            <li>Completar todas as atividades práticas</li>
            <li>Participar das discussões e fóruns</li>
            <li>Realizar o projeto final para certificação</li>
        `;
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
        // Em implementação real, isso redirecionaria para a primeira aula não assistida
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

    // Função para carregar módulos/aulas do curso
    async function loadCourseModules(courseId) {
        try {
            const modulesLoading = document.getElementById('modulesLoading');
            const modulesList = document.getElementById('modulesList');
            
            // Simulação de carregamento de módulos
            // Em produção, isso viria de uma API
            setTimeout(() => {
                modulesLoading.style.display = 'none';
                modulesList.style.display = 'block';
                
                // Dados de exemplo
                const modules = [
                    {
                        id: 1,
                        title: 'Módulo 1: Introdução',
                        lessons: [
                            { id: 1, title: 'Bem-vindo ao curso', duration: '5min', watched: true },
                            { id: 2, title: 'Configuração do ambiente', duration: '15min', watched: true },
                            { id: 3, title: 'Primeiros passos', duration: '20min', watched: false }
                        ]
                    },
                    {
                        id: 2,
                        title: 'Módulo 2: Conceitos Fundamentais',
                        lessons: [
                            { id: 4, title: 'Princípios básicos', duration: '25min', watched: false },
                            { id: 5, title: 'Exercícios práticos', duration: '30min', watched: false }
                        ]
                    },
                    {
                        id: 3,
                        title: 'Módulo 3: Projeto Final',
                        lessons: [
                            { id: 6, title: 'Desenvolvimento do projeto', duration: '45min', watched: false },
                            { id: 7, title: 'Apresentação final', duration: '10min', watched: false }
                        ]
                    }
                ];
                
                // Renderiza os módulos
                modulesList.innerHTML = modules.map(module => `
                    <div class="module-item" data-module-id="${module.id}">
                        <div class="module-header">
                            <h3><span>📁</span> ${module.title}</h3>
                            <span class="module-toggle">▼</span>
                        </div>
                        <div class="lessons-list">
                            ${module.lessons.map(lesson => `
                                <div class="lesson-item ${lesson.watched ? 'lesson-watched' : ''}" data-lesson-id="${lesson.id}">
                                    <span class="lesson-icon">${lesson.watched ? '✓' : '▶'}</span>
                                    <div class="lesson-content">
                                        <div class="lesson-title">${lesson.title}</div>
                                        <div class="lesson-duration">${lesson.duration}</div>
                                    </div>
                                    <button class="lesson-watch-btn">
                                        ${lesson.watched ? 'ASSISTIR NOVAMENTE' : 'ASSISTIR'}
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
                
                // Configura eventos dos módulos
                setupModuleEvents();
                
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao carregar módulos:', error);
            document.getElementById('modulesLoading').innerHTML = `
                <p style="color: #dc3545;">Erro ao carregar conteúdo do curso.</p>
            `;
        }
    }

    // Função para configurar eventos dos módulos
    function setupModuleEvents() {
        const moduleHeaders = document.querySelectorAll('.module-header');
        
        moduleHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const moduleItem = this.parentElement;
                moduleItem.classList.toggle('active');
            });
        });
        
        const lessonButtons = document.querySelectorAll('.lesson-watch-btn');
        lessonButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const lessonItem = this.closest('.lesson-item');
                const lessonId = lessonItem.dataset.lessonId;
                watchLesson(lessonId, lessonItem);
            });
        });
    }

    // Função para assistir aula
    async function watchLesson(lessonId, lessonItem) {
        if (!window.authManager.isAuthenticated()) {
            if (confirm('Você precisa fazer login para assistir esta aula. Deseja fazer login agora?')) {
                window.location.href = 'http://localhost:8000/front/src/Login/Login.html';
            }
            return;
        }
        
        try {
            // Marca aula como assistida
            const user = window.authManager.getCurrentUser();
            const courseId = courseIdFromUrl();
            
            // Em produção, isso seria uma chamada à API
            console.log(`Marcando aula ${lessonId} como assistida para usuário ${user.id} no curso ${courseId}`);
            
            // Atualiza interface
            lessonItem.classList.add('lesson-watched');
            lessonItem.querySelector('.lesson-icon').textContent = '✓';
            lessonItem.querySelector('.lesson-watch-btn').textContent = 'ASSISTIR NOVAMENTE';
            
            // Atualiza progresso
            await loadCourseProgress(courseId, user.id);
            
        } catch (error) {
            console.error('Erro ao marcar aula como assistida:', error);
        }
    }

    // Função para carregar informações do instrutor
    async function loadInstructorInfo(instructorId) {
        try {
            // Em produção, isso buscaria do banco de dados
            // Aqui usamos dados de exemplo
            const instructor = {
                name: 'Professor Exemplo',
                bio: 'Especialista com 10 anos de experiência na área. Já ministrou cursos para mais de 1000 alunos.',
                avatar: 'https://i.pravatar.cc/100'
            };
            
            document.getElementById('instructorName').textContent = instructor.name;
            document.getElementById('instructorBio').textContent = instructor.bio;
            document.getElementById('instructorAvatar').src = instructor.avatar;
            
        } catch (error) {
            console.error('Erro ao carregar informações do instrutor:', error);
        }
    }

    // Função para carregar estatísticas do curso
    async function loadCourseStats(courseId) {
        try {
            // Dados de exemplo
            const stats = {
                duration: '8 horas',
                level: 'Intermediário',
                students: Math.floor(Math.random() * 1000) + 100,
                rating: (Math.random() * 1 + 4).toFixed(1)
            };
            
            document.getElementById('courseDuration').textContent = stats.duration;
            document.getElementById('courseLevel').textContent = stats.level;
            document.getElementById('courseStudents').textContent = stats.students.toLocaleString();
            document.getElementById('courseRating').textContent = stats.rating;
            
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
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
        // Modal de notas
        const notesModal = document.getElementById('notesModal');
        const quickNotesBtn = document.getElementById('quickNotes');
        const modalClose = document.querySelector('.modal-close');
        const cancelNotes = document.getElementById('cancelNotes');
        const saveNotes = document.getElementById('saveNotes');
        
        if (quickNotesBtn) {
            quickNotesBtn.addEventListener('click', () => {
                if (!window.authManager.isAuthenticated()) {
                    alert('Faça login para usar as anotações.');
                    return;
                }
                notesModal.classList.add('active');
            });
        }
        
        if (modalClose) modalClose.addEventListener('click', () => notesModal.classList.remove('active'));
        if (cancelNotes) cancelNotes.addEventListener('click', () => notesModal.classList.remove('active'));
        
        if (saveNotes) {
            saveNotes.addEventListener('click', () => {
                const notes = document.getElementById('notesTextarea').value;
                // Salvar notas (em produção seria uma chamada à API)
                localStorage.setItem(`course_notes_${courseIdFromUrl()}`, notes);
                alert('Anotações salvas!');
                notesModal.classList.remove('active');
            });
        }
        
        // Fechar modal ao clicar fora
        notesModal.addEventListener('click', (e) => {
            if (e.target === notesModal) {
                notesModal.classList.remove('active');
            }
        });
        
        // Carregar notas salvas
        const savedNotes = localStorage.getItem(`course_notes_${courseIdFromUrl()}`);
        if (savedNotes) {
            document.getElementById('notesTextarea').value = savedNotes;
        }
        
        // Outras ações rápidas
        document.getElementById('quickResources').addEventListener('click', () => {
            alert('Recursos serão disponibilizados em breve!');
        });
        
        document.getElementById('quickCertificate').addEventListener('click', () => {
            if (!window.authManager.isAuthenticated()) {
                alert('Faça login para verificar certificado.');
                return;
            }
            alert('Certificado disponível após conclusão do curso!');
        });
        
        document.getElementById('quickShare').addEventListener('click', () => {
            const courseUrl = window.location.href;
            if (navigator.share) {
                navigator.share({
                    title: document.getElementById('courseTitle').textContent,
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