# Ação Cidadã - Web App

## Descrição

Ação Cidadã é uma aplicação web que conecta cidadãos à gestão pública, permitindo que os usuários reportem problemas urbanos (como buracos nas ruas, postes queimados, lixo acumulado, etc.) e que as autoridades competentes aprovem, resolvam ou rejeitem essas ocorrências. O sistema inclui autenticação de usuários, comentários em eventos e um painel administrativo.

## Funcionalidades

- **Autenticação de Usuários**: Login e registro para cidadãos, autoridades e administradores.
- **Relatório de Eventos**: Cidadãos podem criar eventos com título, descrição, endereço e imagens.
- **Aprovação de Eventos**: Autoridades podem aprovar, rejeitar ou resolver eventos pendentes.
- **Comentários**: Usuários podem comentar em eventos para discutir ou fornecer mais informações.
- **Painel Administrativo**: Administradores podem gerenciar usuários e eventos.
- **Interface Responsiva**: Desenvolvida com Tailwind CSS para uma experiência mobile-friendly.

## Tecnologias Utilizadas

### Backend
- **Node.js** com **Express.js**: Servidor HTTP e API REST.
- **CORS**: Para permitir requisições cross-origin.
- **JSON File**: Base de dados simples em arquivo JSON (db.json).

### Frontend
- **HTML5**, **CSS3** e **JavaScript**: Estrutura da aplicação.
- **Tailwind CSS**: Framework CSS para estilização.
- **Font Awesome**: Ícones.
- **Google Fonts (Inter)**: Tipografia.

## Estrutura do Projeto

```
AplicativoAcaoCidada/
├── backend/
│   ├── db.json          # Base de dados JSON
│   ├── nodemon.json     # Configuração do Nodemon
│   ├── package.json     # Dependências e scripts do backend
│   └── server.js        # Servidor Express e rotas da API
└── frontend/
    └── index.html       # Aplicação frontend single-page
```

## Instalação e Configuração

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Backend
1. Navegue até a pasta `backend`:
   ```
   cd backend
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Inicie o servidor:
   ```
   npm start
   ```
   O servidor estará rodando na porta 3000.

### Frontend
O frontend é um arquivo HTML estático. Abra `frontend/index.html` em um navegador web. Para desenvolvimento local, você pode usar um servidor HTTP simples como o Live Server do VS Code.

## Uso

1. **Registro/Login**: Crie uma conta como cidadão, autoridade ou admin.
2. **Criar Evento**: Cidadãos podem reportar problemas urbanos.
3. **Gerenciar Eventos**: Autoridades aprovam ou rejeitam eventos pendentes.
4. **Comentários**: Discuta eventos através de comentários.

## API Endpoints

### Autenticação
- `POST /api/auth/login`: Login de usuário.
- `POST /api/auth/register`: Registro de novo usuário.

### Usuários
- `GET /api/users`: Lista todos os usuários.

### Eventos
- `GET /api/events/approved`: Eventos aprovados ou resolvidos.
- `GET /api/events/pending`: Eventos pendentes.
- `GET /api/events/assigned`: Eventos atribuídos (aprovados/resolvidos).
- `POST /api/events`: Criar novo evento.
- `PUT /api/events/:id/status`: Atualizar status do evento (approved/denied/resolved).
- `POST /api/events/:id/complain`: Adicionar reclamação a um evento.

### Comentários
- `GET /api/events/:eventId/comments`: Obter comentários de um evento.
- `POST /api/events/:eventId/comments`: Adicionar comentário a um evento.

