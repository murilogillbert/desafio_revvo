/**
 * Inclui o header em todas as páginas automaticamente
 */
document.addEventListener('DOMContentLoaded', function() {
    // Carrega o header
    fetch('/front/components/header.html')
        .then(response => response.text())
        .then(data => {
            // Insere o header no início do body
            document.body.insertAdjacentHTML('afterbegin', data);
            
            // Inicializa a autenticação após o header ser carregado
            if (typeof authManager !== 'undefined') {
                authManager.updateHeader();
            }
        })
        .catch(error => console.error('Erro ao carregar header:', error));
});