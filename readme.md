# Desafio Revvo - Plataforma de Cursos

Plataforma web para gerenciamento e visualização de cursos online, desenvolvida com PHP puro e JavaScript.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Docker Desktop** - [Download aqui](https://www.docker.com/products/docker-desktop)
- **PHP 7.4 ou superior** (Foi utilizado o 8.5) - [Download aqui](https://www.php.net/downloads)

## 🚀 Como Usar

### Passo 1: Iniciar o Banco de Dados

Abra o terminal na pasta raiz do projeto e execute:

```bash
docker-compose up -d
```

Este comando irá:
- Criar e iniciar o container MySQL
- Criar o banco de dados `app_db`
- Executar o script `init.sql` automaticamente
- Configurar usuário e senha padrão

**Credenciais do banco:**
- Host: `localhost`
- Porta: `3333`
- Database: `app_db`
- Usuário: `dev_user`
- Senha: `devpassword`

### Passo 2: Iniciar o Servidor PHP

No mesmo terminal, execute:

```bash
php -S localhost:8000
```

O servidor estará rodando em: **http://localhost:8000**

### Passo 3: Acessar a Aplicação

Abra seu navegador e acesse:

```
http://localhost:8000/front/src/Home/Home.html
```

## 👤 Conta Padrão

Para acessar o painel administrativo, use:

- **Email:** `admin@admin.com`
- **Senha:** `admin`

## 📁 Estrutura do Projeto

```
desafio_revvo/
├── back/                    # Backend PHP
│   ├── api/                # Endpoints da API
│   │   ├── admin.php        # CRUD de cursos (admin)
│   │   ├── auth.php         # Autenticação (login/registro)
│   │   ├── course.php       # Detalhes de um curso
│   │   ├── courses.php      # Listagem de cursos
│   │   └── user-course.php  # Relação usuário-curso
│   └── connector.php       # Conexão com banco de dados
│
├── front/                   # Frontend
│   ├── assets/             # Imagens e recursos
│   ├── components/          # Componentes reutilizáveis
│   ├── js/                 # Scripts globais
│   └── src/                # Páginas da aplicação
│       ├── Admin/           # Painel administrativo
│       ├── Course/          # Página de detalhes
│       ├── Courses/         # Catálogo de cursos
│       ├── Home/            # Página inicial
│       ├── Login/           # Página de login
│       └── Register/        # Página de registro
│
├── docker-compose.yml       # Configuração Docker
├── init.sql                # Script de inicialização do banco
└── README.md               # Este arquivo
```

## 🎯 Funcionalidades

### Para Visitantes
- ✅ Visualizar catálogo de cursos
- ✅ Buscar cursos por nome/descrição
- ✅ Ver detalhes dos cursos
- ✅ Criar conta de usuário

### Para Usuários Logados
- ✅ Inscrever-se em cursos
- ✅ Ver seus cursos inscritos
- ✅ Acompanhar progresso
- ✅ Modal de boas-vindas no primeiro acesso

### Para Administradores
- ✅ Criar novos cursos
- ✅ Editar cursos existentes
- ✅ Excluir cursos
- ✅ Gerenciar conteúdo do slideshow

## 🛠️ Tecnologias Utilizadas

- **Backend:** PHP 7.4+ (sem frameworks)
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Banco de Dados:** MySQL 8.0
- **Containerização:** Docker & Docker Compose

## 📊 Diagrama de Dados

![Diagrama de Dados](image.png)

## 🔧 Comandos Úteis

### Parar o banco de dados
```bash
docker-compose down
```

### Ver logs do banco
```bash
docker-compose logs mysql
```

### Reiniciar o banco
```bash
docker-compose restart mysql
```

### Limpar tudo e recomeçar
```bash
docker-compose down -v
docker-compose up -d
```

## ⚠️ Observações Importantes

1. **Porta 8000:** Certifique-se de que a porta 8000 está livre
2. **Porta 3333:** Certifique-se de que a porta 3333 está livre (MySQL)
3. **Docker:** O Docker Desktop deve estar rodando antes de executar `docker-compose up -d`
4. **PHP:** O servidor PHP deve continuar rodando enquanto você usa a aplicação

## 🐛 Solução de Problemas

### Erro ao iniciar o Docker
- Verifique se o Docker Desktop está instalado e rodando
- Certifique-se de que as portas 3333 e 8000 não estão em uso

### Erro de conexão com o banco
- Verifique se o container MySQL está rodando: `docker ps`
- Aguarde alguns segundos após iniciar o Docker para o banco inicializar completamente

### Página não carrega
- Verifique se o servidor PHP está rodando na porta 8000
- Confirme que está acessando a URL correta

## 📝 Notas de Desenvolvimento

- O projeto foi desenvolvido seguindo os requisitos do desafio Revvo
- PHP puro sem uso de frameworks
- Front-end responsivo e acessível
- Modal de primeiro acesso implementado
- CRUD completo de cursos

## 📧 Contato

Para dúvidas ou suporte, entre em contato através do repositório.

---

**Desenvolvido para o Desafio Revvo**
