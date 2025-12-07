// Script específico da página Home
document.addEventListener('DOMContentLoaded', function () {
    // Variáveis para o slider
    let currentSlide = 0;
    let slides = [];
    let slideInterval;

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

    async function initHomePage() {
        await waitForAuthManager();
        
        // Carrega os últimos 3 cursos para o slider
        await loadLatestCourses();
        
        // Configura o slider
        setupSlider();
        
        // Controle de visibilidade baseado no login
        const courseAddSection = document.getElementById('courseAddSection');
        const loginPrompt = document.getElementById('loginPrompt');
        const noCoursesPrompt = document.getElementById('noCoursesPrompt');
        
        if (window.authManager.isAuthenticated()) {
            // Usuário logado
            if (courseAddSection) courseAddSection.style.display = 'flex';
            if (loginPrompt) loginPrompt.style.display = 'none';
            
            // Carrega os cursos do usuário
            await loadUserCourses();
            
            // Se for admin, pode adicionar funcionalidades específicas
            if (window.authManager.isAdmin()) {
                console.log('Admin logado');
            }
        } else {
            // Usuário não logado
            if (courseAddSection) courseAddSection.style.display = 'none';
            if (loginPrompt) loginPrompt.style.display = 'block';
            if (noCoursesPrompt) noCoursesPrompt.style.display = 'none';
            
            // Remove os cards de loading
            removeLoadingCards();
        }
        
        // Configurar botões dos cursos
        setupCourseButtons();
    }

    // Função para carregar os últimos 3 cursos para o slider
    async function loadLatestCourses() {
        try {
            const response = await fetch(`${window.authManager.API_BASE_URL}/courses.php?action=getLatestCourses&limit=3`);
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Erro ao carregar cursos em destaque:', data.error);
                showDefaultSlider();
                return;
            }
            
            // Renderiza os cursos no slider
            renderSliderCourses(data.courses || []);
            
        } catch (error) {
            console.error('Erro ao carregar cursos em destaque:', error);
            showDefaultSlider();
        }
    }

    // Função para renderizar cursos no slider
    function renderSliderCourses(courses) {
        const slidesContainer = document.getElementById('slidesContainer');
        const sliderDots = document.getElementById('sliderDots');
        
        if (courses.length === 0) {
            showDefaultSlider();
            return;
        }
        
        // Limpa o container
        slidesContainer.innerHTML = '';
        sliderDots.innerHTML = '';
        slides = [];
        
        // Adiciona cada curso como um slide
        courses.forEach((course, index) => {
            const slide = document.createElement('div');
            slide.className = `slide ${index === 0 ? 'active' : ''}`;
            slide.dataset.index = index;
            
            slide.innerHTML = `
                <img src="${course.urlImage || `https://picsum.photos/id/${100 + (course.id % 10)}/1600/500`}" 
                     alt="${course.name}">
                <div class="slide-content">
                    <h2>${course.name}</h2>
                    <p>${course.description ? (course.description.substring(0, 100) + '...') : 'Descrição não disponível'}</p>
                    <a href="http://localhost:8000/front/src/Course/Course.html?id=${course.id}" class="slide-button">
                        VER CURSO
                    </a>
                </div>
            `;
            
            slidesContainer.appendChild(slide);
            slides.push(slide);
            
            // Adiciona dot para este slide
            const dot = document.createElement('span');
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            dot.dataset.index = index;
            dot.addEventListener('click', () => goToSlide(index));
            sliderDots.appendChild(dot);
        });
        
        // Mostra os controles do slider
        sliderDots.style.display = 'flex';
    }

    // Função para mostrar slider padrão (fallback)
    function showDefaultSlider() {
        const slidesContainer = document.getElementById('slidesContainer');
        const sliderDots = document.getElementById('sliderDots');
        
        slidesContainer.innerHTML = `
            <div class="slide active">
                <img src="https://picsum.photos/id/1011/1600/500" alt="Banner 1">
                <div class="slide-content">
                    <h2>Bem-vindo à Plataforma de Cursos</h2>
                    <p>Aprenda novas habilidades e desenvolva seu potencial com nossos cursos especializados.</p>
                    <a href="http://localhost:8000/front/src/Courses/Courses.html" class="slide-button">EXPLORAR CURSOS</a>
                </div>
            </div>
            <div class="slide">
                <img src="https://picsum.photos/id/1002/1600/500" alt="Banner 2">
                <div class="slide-content">
                    <h2>Aprenda no Seu Ritmo</h2>
                    <p>Cursos disponíveis 24/7 para você estudar quando e onde quiser.</p>
                    <a href="http://localhost:8000/front/src/Courses/Courses.html" class="slide-button">VER CATÁLOGO</a>
                </div>
            </div>
            <div class="slide">
                <img src="https://picsum.photos/id/1003/1600/500" alt="Banner 3">
                <div class="slide-content">
                    <h2>Conteúdo de Qualidade</h2>
                    <p>Professores especializados e materiais atualizados para o melhor aprendizado.</p>
                    <a href="http://localhost:8000/front/src/Register/Register.html" class="slide-button">COMEÇAR AGORA</a>
                </div>
            </div>
        `;
        
        // Atualiza a lista de slides
        slides = Array.from(slidesContainer.querySelectorAll('.slide'));
        
        // Adiciona dots
        sliderDots.innerHTML = `
            <span class="dot active" data-index="0"></span>
            <span class="dot" data-index="1"></span>
            <span class="dot" data-index="2"></span>
        `;
        
        sliderDots.style.display = 'flex';
        
        // Configura eventos dos dots
        Array.from(sliderDots.querySelectorAll('.dot')).forEach((dot, index) => {
            dot.addEventListener('click', () => goToSlide(index));
        });
    }

    // Função para configurar o slider
    function setupSlider() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        
        // Inicia auto-slide
        startAutoSlide();
        
        // Pausa auto-slide quando o mouse está sobre o slider
        const slider = document.getElementById('sliderBanner');
        if (slider) {
            slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
            slider.addEventListener('mouseleave', startAutoSlide);
        }
    }

    // Função para ir para um slide específico
    function goToSlide(index) {
        if (index < 0 || index >= slides.length) return;
        
        // Remove active de todos os slides e dots
        slides.forEach(slide => slide.classList.remove('active'));
        document.querySelectorAll('.dot').forEach(dot => dot.classList.remove('active'));
        
        // Adiciona active ao slide e dot selecionados
        slides[index].classList.add('active');
        document.querySelector(`.dot[data-index="${index}"]`).classList.add('active');
        
        currentSlide = index;
        
        // Reinicia o auto-slide
        startAutoSlide();
    }

    // Função para próximo slide
    function nextSlide() {
        let nextIndex = currentSlide + 1;
        if (nextIndex >= slides.length) nextIndex = 0;
        goToSlide(nextIndex);
    }

    // Função para slide anterior
    function prevSlide() {
        let prevIndex = currentSlide - 1;
        if (prevIndex < 0) prevIndex = slides.length - 1;
        goToSlide(prevIndex);
    }

    // Função para iniciar auto-slide
    function startAutoSlide() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    }

    // Função para carregar cursos do usuário
    async function loadUserCourses() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user || !user.id) {
                console.error('Usuário não encontrado');
                return;
            }

            const response = await fetch(`${window.authManager.API_BASE_URL}/user-course.php?action=getUserCourses&userId=${user.id}`);
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Erro ao carregar cursos:', data.error);
                showNoCoursesMessage();
                return;
            }

            // Atualiza a lista de cursos na página
            updateUserCourses(data.courses || []);

        } catch (error) {
            console.error('Erro ao carregar cursos do usuário:', error);
            showNoCoursesMessage();
        }
    }

    // Função para atualizar a lista de cursos do usuário
    function updateUserCourses(courses) {
        const coursesGrid = document.getElementById('coursesGrid');
        const noCoursesPrompt = document.getElementById('noCoursesPrompt');
        
        if (!coursesGrid) return;
        
        // Remove cards de loading
        removeLoadingCards();
        
        // Se não houver cursos, mostra mensagem
        if (courses.length === 0) {
            if (noCoursesPrompt) noCoursesPrompt.style.display = 'block';
            return;
        }
        
        // Esconde a mensagem de "sem cursos"
        if (noCoursesPrompt) noCoursesPrompt.style.display = 'none';
        
        // Limpa apenas os cards de curso (mantém o card de adicionar)
        const existingCards = coursesGrid.querySelectorAll('.course-card:not(.course-add)');
        existingCards.forEach(card => card.remove());
        
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

    // Função para criar card de curso
    function createCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.dataset.courseId = course.id;
        
        const imageUrl = course.urlImage || `https://picsum.photos/id/${100 + (course.id % 10)}/300/200`;
        const isCompleted = course.watched_at;
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${course.name}">
            <h4>${course.name}</h4>
            <p>${course.description ? (course.description.substring(0, 100) + '...') : 'Descrição não disponível'}</p>
            <button class="course-button" data-course-id="${course.id}">
                ${isCompleted ? 'REVISAR CURSO' : 'CONTINUAR CURSO'}
            </button>
        `;
        
        return card;
    }

    // Função para remover cards de loading
    function removeLoadingCards() {
        const loadingCards = document.querySelectorAll('.loading-card');
        loadingCards.forEach(card => card.remove());
    }

    // Função para mostrar mensagem quando não há cursos
    function showNoCoursesMessage() {
        const noCoursesPrompt = document.getElementById('noCoursesPrompt');
        const coursesGrid = document.getElementById('coursesGrid');
        
        if (noCoursesPrompt) noCoursesPrompt.style.display = 'block';
        if (coursesGrid) {
            removeLoadingCards();
        }
    }

    // Função para configurar eventos dos botões dos cursos
    function setupCourseButtons() {
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
    }

    // Inicializar página
    initHomePage();
});