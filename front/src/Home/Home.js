// Aguarda o authManager ser carregado
document.addEventListener('DOMContentLoaded', function () {
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

    async function initHomePage() {
        await waitForAuthManager();

        // Controle de visibilidade baseado no login
        const courseAddSection = document.getElementById('courseAddSection');
        const loginPrompt = document.getElementById('loginPrompt');

        if (window.authManager.isAuthenticated()) {
            // Usuário logado
            if (courseAddSection) courseAddSection.style.display = 'block';
            if (loginPrompt) loginPrompt.style.display = 'none';

            // Carrega os cursos do usuário
            await loadUserCourses();

            // Se for admin, mostra botão especial
            if (window.authManager.isAdmin()) {
                console.log('Admin logado');
                // Pode adicionar funcionalidades específicas para admin
            }
        } else {
            // Usuário não logado
            if (courseAddSection) courseAddSection.style.display = 'none';
            if (loginPrompt) loginPrompt.style.display = 'none'; // Removemos o prompt antigo
            
            // Mostra seção especial para usuários não logados
            showGuestCourseSection();
            
            // Mostra cursos em destaque para visitantes
            loadFeaturedCourses();
        }

        // Configurar slider
        setupSlider();

        // Configurar botões dos cursos
        setupCourseButtons();
    }

    // Função para mostrar seção de cursos para visitantes
    function showGuestCourseSection() {
        const courseListSection = document.querySelector('.course-list');
        if (!courseListSection) return;

        // Verifica se já existe a mensagem para evitar duplicação
        const existingGuestMessage = courseListSection.querySelector('.guest-course-message');
        if (existingGuestMessage) return;

        const guestMessage = document.createElement('div');
        guestMessage.className = 'guest-course-message';
        guestMessage.innerHTML = `
            <div class="no-courses-guest" style="text-align: center; padding: 50px 20px; background: white; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <h3 style="color: #333; margin-bottom: 15px; font-size: 22px;">Faça login para ver seus cursos</h3>
                <p style="color: #666; margin-bottom: 25px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                    Você precisa estar logado para ver os cursos em que está inscrito. 
                    Entre na sua conta para acessar todo o conteúdo da plataforma.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <a href="http://localhost:8000/front/src/Login/Login.html" 
                       class="guest-login-btn" 
                       style="display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; transition: all 0.3s;">
                        Fazer Login
                    </a>
                    <a href="http://localhost:8000/front/src/Register/Register.html" 
                       class="guest-register-btn" 
                       style="display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; transition: all 0.3s;">
                        Criar Conta
                    </a>
                </div>
                <p style="margin-top: 25px; color: #888; font-size: 14px;">
                    Ou continue como visitante e <a href="http://localhost:8000/front/src/Courses/Courses.html" style="color: #239c1b; text-decoration: none;">explore todos os cursos disponíveis</a>
                </p>
            </div>
        `;

        // Adiciona efeitos hover
        setTimeout(() => {
            const loginBtn = guestMessage.querySelector('.guest-login-btn');
            const registerBtn = guestMessage.querySelector('.guest-register-btn');
            
            if (loginBtn) {
                loginBtn.onmouseover = () => loginBtn.style.transform = 'translateY(-2px)';
                loginBtn.onmouseout = () => loginBtn.style.transform = 'translateY(0)';
            }
            
            if (registerBtn) {
                registerBtn.onmouseover = () => registerBtn.style.transform = 'translateY(-2px)';
                registerBtn.onmouseout = () => registerBtn.style.transform = 'translateY(0)';
            }
        }, 100);

        // Substitui a grade de cursos pela mensagem
        const coursesGrid = courseListSection.querySelector('.courses-grid');
        if (coursesGrid) {
            coursesGrid.innerHTML = ''; // Limpa os cards de cursos
            courseListSection.insertBefore(guestMessage, coursesGrid);
        } else {
            courseListSection.appendChild(guestMessage);
        }

        // Atualiza o título da seção
        const sectionTitle = courseListSection.querySelector('h3');
        if (sectionTitle) {
            sectionTitle.textContent = 'ACESSE SEUS CURSOS';
        }
    }

    // Função para carregar cursos do usuário
    async function loadUserCourses() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user || !user.id) {
                console.error('Usuário não encontrado');
                return;
            }

            // Faz requisição para buscar os cursos do usuário
            const response = await fetch(`${window.authManager.API_BASE_URL}/user-course.php?action=getUserCourses&userId=${user.id}`);
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Erro ao carregar cursos:', data.error);
                showErrorMessage('Não foi possível carregar seus cursos.');
                return;
            }

            // Atualiza a lista de cursos na página
            updateCourseList(data.courses || []);

        } catch (error) {
            console.error('Erro ao carregar cursos do usuário:', error);
            showErrorMessage('Erro de conexão ao carregar cursos.');
        }
    }

    // Função para carregar cursos em destaque (para visitantes)
    async function loadFeaturedCourses() {
        try {
            const response = await fetch(`${window.authManager.API_BASE_URL}/user-course.php?action=getFeaturedCourses`);
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Erro ao carregar cursos em destaque:', data.error);
                return;
            }

            // Atualiza a lista de cursos em destaque
            updateFeaturedCourses(data.courses || []);

        } catch (error) {
            console.error('Erro ao carregar cursos em destaque:', error);
        }
    }

    // Função para atualizar a lista de cursos na página
    function updateCourseList(courses) {
        const coursesGrid = document.querySelector('.courses-grid');
        const courseListSection = document.querySelector('.course-list');
        
        if (!coursesGrid || !courseListSection) {
            console.error('Elementos da lista de cursos não encontrados');
            return;
        }

        // Remove mensagem de visitante se existir
        const guestMessage = courseListSection.querySelector('.guest-course-message');
        if (guestMessage) {
            guestMessage.remove();
        }

        // Remove apenas os cards de curso (mantém o card de adicionar)
        const existingCards = coursesGrid.querySelectorAll('.course-card:not(.course-add)');
        existingCards.forEach(card => card.remove());

        // Remove mensagem de "sem cursos" anterior
        const existingNoCourses = courseListSection.querySelector('.no-courses');
        if (existingNoCourses) {
            existingNoCourses.remove();
        }

        // Se não houver cursos, mostra mensagem personalizada
        if (courses.length === 0) {
            showNoCoursesMessage();
            return;
        }

        // Atualiza o título da seção
        const sectionTitle = courseListSection.querySelector('h3');
        if (sectionTitle) {
            sectionTitle.textContent = 'MEUS CURSOS';
        }

        // Adiciona os novos cards de curso
        courses.forEach((course, index) => {
            const courseCard = createCourseCard(course);
            
            // Insere antes do card de adicionar (se existir)
            const addCourseCard = coursesGrid.querySelector('.course-add');
            if (addCourseCard) {
                coursesGrid.insertBefore(courseCard, addCourseCard);
            } else {
                coursesGrid.appendChild(courseCard);
            }
        });

        // Atualiza os eventos dos botões
        setupCourseButtons();
    }

    // Função para mostrar mensagem quando usuário logado não tem cursos
    function showNoCoursesMessage() {
        const coursesGrid = document.querySelector('.courses-grid');
        const courseListSection = document.querySelector('.course-list');
        
        if (!coursesGrid || !courseListSection) return;

        // Cria mensagem de "sem cursos" para usuário logado
        const noCoursesDiv = document.createElement('div');
        noCoursesDiv.className = 'no-courses';
        noCoursesDiv.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; background: white; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <div style="font-size: 60px; margin-bottom: 20px; color: #ddd;">🎓</div>
                <h3 style="color: #333; margin-bottom: 15px; font-size: 22px;">Você ainda não está inscrito em nenhum curso</h3>
                <p style="color: #666; margin-bottom: 25px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                    Explore nossa biblioteca de cursos e comece sua jornada de aprendizado hoje mesmo!
                </p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <a href="http://localhost:8000/front/src/Courses/Courses.html" 
                       class="browse-courses-btn" 
                       style="display: inline-block; padding: 12px 30px; background: #239c1b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; transition: all 0.3s;">
                        Explorar Cursos
                    </a>
                    <a href="http://localhost:8000/front/src/Admin/Admin.html" 
                       class="admin-courses-btn" 
                       style="display: ${window.authManager.isAdmin() ? 'inline-block' : 'none'}; padding: 12px 30px; background: #ffcc00; color: #111; text-decoration: none; border-radius: 6px; font-weight: bold; transition: all 0.3s;">
                        Gerenciar Cursos
                    </a>
                </div>
                <p style="margin-top: 25px; color: #888; font-size: 14px;">
                    Precisa de ajuda? <a href="#" style="color: #007bff; text-decoration: none;">Veja nossos tutoriais</a>
                </p>
            </div>
        `;

        // Adiciona efeitos hover
        setTimeout(() => {
            const browseBtn = noCoursesDiv.querySelector('.browse-courses-btn');
            const adminBtn = noCoursesDiv.querySelector('.admin-courses-btn');
            
            if (browseBtn) {
                browseBtn.onmouseover = () => browseBtn.style.transform = 'translateY(-2px)';
                browseBtn.onmouseout = () => browseBtn.style.transform = 'translateY(0)';
            }
            
            if (adminBtn) {
                adminBtn.onmouseover = () => adminBtn.style.transform = 'translateY(-2px)';
                adminBtn.onmouseout = () => adminBtn.style.transform = 'translateY(0)';
            }
        }, 100);

        // Insere a mensagem antes da grade de cursos
        courseListSection.insertBefore(noCoursesDiv, coursesGrid);
    }

    // Função para atualizar cursos em destaque
    function updateFeaturedCourses(courses) {
        const featuredSection = document.querySelector('.featured-courses');
        
        if (!featuredSection || courses.length === 0) return;

        const featuredGrid = featuredSection.querySelector('.courses-grid');
        if (!featuredGrid) return;

        // Limpa cursos existentes
        featuredGrid.innerHTML = '';

        // Adiciona os novos cursos em destaque
        courses.forEach(course => {
            const featuredCard = createFeaturedCard(course);
            featuredGrid.appendChild(featuredCard);
        });
    }

    // Função para criar card de curso
    function createCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.dataset.courseId = course.id;
        
        // Usa imagem do curso ou padrão
        const imageUrl = course.urlImage || `https://picsum.photos/id/${100 + (course.id % 10)}/300/200`;
        const progress = course.progress || 0;
        const isCompleted = course.watched_at;
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${course.name}">
            ${isCompleted ? 
                '<div class="course-completed-badge" style="position: absolute; top: 10px; right: 10px; background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">✓ CONCLUÍDO</div>' : 
                ''
            }
            <div class="course-progress" style="height: 4px; background: #eee; margin: 0 15px; border-radius: 2px;">
                <div style="width: ${progress}%; height: 100%; background: #239c1b; border-radius: 2px;"></div>
            </div>
            <h4>${course.name}</h4>
            <p>${course.description ? (course.description.substring(0, 100) + '...') : 'Descrição não disponível'}</p>
            <div style="margin-top: auto; padding: 0 15px 15px;">
                <button class="course-button" data-course-id="${course.id}">
                    ${isCompleted ? 'REVISAR CURSO' : 'CONTINUAR CURSO'}
                </button>
            </div>
        `;
        
        return card;
    }

    // Função para criar card de curso em destaque
    function createFeaturedCard(course) {
        const card = document.createElement('div');
        card.className = 'featured-card';
        
        const imageUrl = course.urlImage || `https://picsum.photos/id/${100 + (course.id % 10)}/300/200`;
        const rating = course.rating || '4.5';
        const lessonCount = course.lesson_count || '12';
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${course.name}">
            <div class="featured-content">
                <h4>${course.name}</h4>
                <p>${course.description ? (course.description.substring(0, 80) + '...') : 'Descrição não disponível'}</p>
                <div class="featured-meta">
                    <span>📚 ${lessonCount} aulas</span>
                    <span>⭐ ${rating}</span>
                </div>
                <a href="#" class="featured-button" data-course-id="${course.id}">SAIBA MAIS</a>
            </div>
        `;
        
        return card;
    }

    // Função para mostrar mensagem de erro
    function showErrorMessage(message) {
        const courseListSection = document.querySelector('.course-list');
        if (!courseListSection) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            text-align: center;
            padding: 20px;
            background: #fff5f5;
            border: 1px solid #f8d7da;
            border-radius: 8px;
            color: #721c24;
            margin: 20px 0;
        `;
        errorDiv.innerHTML = `
            <p><strong>Erro:</strong> ${message}</p>
            <button onclick="location.reload()" style="
                margin-top: 10px;
                padding: 8px 16px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            ">
                Tentar novamente
            </button>
        `;
        
        courseListSection.appendChild(errorDiv);
    }

    function setupSlider() {
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.dot');
        const prevBtn = document.querySelector('.prev');
        const nextBtn = document.querySelector('.next');
        let currentSlide = 0;

        if (slides.length === 0) return;

        function showSlide(n) {
            // Remove active de todos os slides e dots
            slides.forEach(slide => slide.style.display = 'none');
            dots.forEach(dot => dot.classList.remove('active'));

            // Ajusta o índice se for além dos limites
            if (n >= slides.length) currentSlide = 0;
            if (n < 0) currentSlide = slides.length - 1;

            // Mostra o slide atual
            slides[currentSlide].style.display = 'block';
            dots[currentSlide].classList.add('active');
        }

        function nextSlide() {
            currentSlide++;
            showSlide(currentSlide);
        }

        function prevSlide() {
            currentSlide--;
            showSlide(currentSlide);
        }

        // Event Listeners
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);

        // Configurar dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
            });
        });

        // Auto-slide (opcional)
        setInterval(nextSlide, 5000);

        // Mostrar primeiro slide
        showSlide(0);
    }

    function setupCourseButtons() {
        // Configura botões dos cursos
        const courseButtons = document.querySelectorAll('.course-button');
        courseButtons.forEach(button => {
            button.addEventListener('click', function () {
                const courseId = this.dataset.courseId;
                if (courseId) {
                    if (window.authManager.isAuthenticated()) {
                        // Redireciona para a página do curso
                        window.location.href = `http://localhost:8000/front/src/Course/Course.html?id=${courseId}`;
                    } else {
                        // Sugere login
                        if (confirm('Você precisa fazer login para acessar este curso. Deseja fazer login agora?')) {
                            window.location.href = 'http://localhost:8000/front/src/Login/Login.html';
                        }
                    }
                }
            });
        });

        // Configura botões dos cursos em destaque
        const featuredButtons = document.querySelectorAll('.featured-button');
        featuredButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                const courseId = this.dataset.courseId;
                if (courseId) {
                    if (window.authManager.isAuthenticated()) {
                        // Redireciona para a página do curso
                        window.location.href = `http://localhost:8000/front/src/Course/Course.html?id=${courseId}`;
                    } else {
                        // Sugere login
                        if (confirm('Você precisa fazer login para ver detalhes do curso. Deseja fazer login agora?')) {
                            window.location.href = 'http://localhost:8000/front/src/Login/Login.html';
                        }
                    }
                }
            });
        });
    }

    // Inicializar página
    initHomePage();
});