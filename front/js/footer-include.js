/**
 * Carrega e insere o footer dinamicamente
 */
document.addEventListener('DOMContentLoaded', function () {

    // Evita duplicar o footer
    if (document.querySelector('footer.footer')) {
        return;
    }

    fetch('/front/components/footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {

            // Cria container temporário
            const temp = document.createElement('div');
            temp.innerHTML = html;

            // Procura pelo footer com classe
            let footerEl = temp.querySelector('footer.footer');

            // Se não encontrar, usa o primeiro footer simples
            if (!footerEl) {
                footerEl = temp.querySelector('footer');
            }

            // Se ainda assim não encontrar, força erro
            if (!footerEl) {
                throw new Error('Footer não encontrado no HTML carregado');
            }

            // Insere o footer no final da body
            document.body.appendChild(footerEl);

            console.log('Footer carregado com sucesso');
        })
        .catch(error => {
            console.error('Erro ao carregar footer:', error);

            // Fallback usando sua estrutura real
            const fallbackFooter = document.createElement('footer');
            fallbackFooter.className = 'footer';
            fallbackFooter.innerHTML = `
                <div class="general-info">
                    <div class="corp-info">
                        <h4>LEO</h4>
                        <p>Maecenas faucibus mollis interdum...</p>
                    </div>
                    <div class="general-info-right">
                        <div class="contact">
                            <h4>CONTATO</h4>
                            <p>(21) 98765-3434</p>
                            <p>contato@leolearning.com</p>
                        </div>
                        <div class="social-media">
                            <h4>REDES SOCIAIS</h4>
                            <div class="icons">
                                <img src="/front/assets/twitter.png" alt="twitter">
                                <img src="/front/assets/youtube.png" alt="youtube">
                                <img src="/front/assets/pinterest.png" alt="pinterest">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="copyrights">
                    Copyright 2017 – All rights reserved.
                </div>
            `;

            document.body.appendChild(fallbackFooter);
        });

});
