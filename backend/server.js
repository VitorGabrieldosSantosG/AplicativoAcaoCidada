const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const https = require('https');

const app = express();

// --- Configuração de Segurança (CORS) ---
// Esta configuração é crucial. Ela diz ao navegador que o seu frontend,
// localizado em 'https://vitorgabrieldossantosg.github.io', tem permissão
// para fazer pedidos a este servidor.
const corsOptions = {
  origin: 'https://vitorgabrieldossantosg.github.io',
  optionsSuccessStatus: 200 
};

// É importante que o app.use(cors(corsOptions)) venha ANTES das suas rotas.
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // Aumenta o limite para o upload de imagens

// --- Caminho para a base de dados ---
const dbPath = path.join(__dirname, 'db.json');

// --- Funções Auxiliares para ler/escrever na DB ---
const readDb = () => JSON.parse(fs.readFileSync(dbPath));
const writeDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// --- Rotas da API ---
const apiRouter = express.Router();

// [GET] /api/users
apiRouter.get('/users', (req, res) => {
  try {
    const db = readDb();
    res.json(db.users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao ler a base de dados." });
  }
});

// [GET] /api/events/approved
apiRouter.get('/events/approved', (req, res) => {
    try {
        const db = readDb();
        const approvedEvents = db.events
            .filter(event => event.status === 'approved' || event.status === 'resolved')
            .map(event => {
                const creator = db.users.find(u => u.id === event.creatorId);
                return { ...event, creator: { id: creator.id, name: creator.name } };
            });
        res.json(approvedEvents);
    } catch (error) {
        res.status(500).json({ message: "Erro ao ler a base de dados." });
    }
});

// [GET] /api/events/pending
apiRouter.get('/events/pending', (req, res) => {
    try {
        const db = readDb();
        const pendingEvents = db.events.filter(e => e.status === 'pending');
        res.json(pendingEvents);
    } catch (error) {
        res.status(500).json({ message: "Erro ao ler a base de dados." });
    }
});

// [GET] /api/events/assigned
apiRouter.get('/events/assigned', (req, res) => {
    try {
        const db = readDb();
        const assignedEvents = db.events.filter(e => e.status === 'approved' || e.status === 'resolved');
        res.json(assignedEvents);
    } catch (error) {
        res.status(500).json({ message: "Erro ao ler a base de dados." });
    }
});

// [POST] /api/events/:id/complain
apiRouter.post('/events/:id/complain', (req, res) => {
    try {
        const db = readDb();
        const event = db.events.find(e => e.id === parseInt(req.params.id));
        if (event) {
            event.complaints++;
            writeDb(db);
            res.status(200).json(event);
        } else {
            res.status(404).json({ message: "Evento não encontrado." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao processar a reclamação." });
    }
});

// [PUT] /api/events/:id/status
apiRouter.put('/events/:id/status', (req, res) => {
    const { status } = req.body;
    const validStatuses = ['approved', 'denied', 'resolved'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Estado inválido." });
    }

    try {
        const db = readDb();
        const eventIndex = db.events.findIndex(e => e.id === parseInt(req.params.id));
        if (eventIndex !== -1) {
            if (status === 'denied') {
                db.events.splice(eventIndex, 1);
            } else {
                db.events[eventIndex].status = status;
            }
            writeDb(db);
            res.status(200).json({ message: "Estado do evento atualizado." });
        } else {
            res.status(404).json({ message: "Evento não encontrado." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar o estado do evento." });
    }
});

// [POST] /api/events
apiRouter.post('/events', (req, res) => {
    const { creatorId, title, description, address, imageUrls } = req.body;
    if (!creatorId || !title || !description || !address) {
        return res.status(400).json({ message: "Dados incompletos." });
    }

    try {
        const db = readDb();
        const newEvent = {
            id: db.events.length > 0 ? Math.max(...db.events.map(e => e.id)) + 1 : 1,
            creatorId,
            title,
            description,
            address,
            imageUrls: imageUrls || [],
            complaints: 0,
            status: 'pending'
        };
        db.events.push(newEvent);
        writeDb(db);
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ message: "Erro ao criar o evento." });
    }
});

// [POST] /api/auth/login
apiRouter.post('/auth/login', (req, res) => {
    const { email, password, type } = req.body;
    try {
        const db = readDb();
        const user = db.users.find(u => u.email === email && u.password === password && u.type === type);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } else {
            res.status(401).json({ message: "Credenciais inválidas." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor durante o login." });
    }
});

// [POST] /api/auth/register
apiRouter.post('/auth/register', (req, res) => {
    const { name, email, password, type, code } = req.body;
    const accessCodes = { admin: 'admin123', authority: 'Aut123' };

    if ( (type === 'admin' || type === 'authority') && code !== accessCodes[type] ) {
        return res.status(403).json({ message: "Código de acesso inválido." });
    }

    try {
        const db = readDb();
        if (db.users.some(u => u.email === email)) {
            return res.status(409).json({ message: "Este email já está em uso." });
        }
        const newUser = {
            id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
            name, email, password, type
        };
        db.users.push(newUser);
        writeDb(db);
        res.status(201).json({ message: "Utilizador registado com sucesso." });
    } catch (error) {
        res.status(500).json({ message: "Erro ao registar o utilizador." });
    }
});


// [GET] /api/events/:eventId/comments
apiRouter.get('/events/:eventId/comments', (req, res) => {
    try {
        const db = readDb();
        const eventId = parseInt(req.params.eventId);
        const comments = db.comments
            .filter(c => c.eventId === eventId)
            .map(comment => {
                const author = db.users.find(u => u.id === comment.authorId);
                return { ...comment, authorName: author ? author.name : "Desconhecido" };
            });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao obter comentários.' });
    }
});

// [POST] /api/events/:eventId/comments
apiRouter.post('/events/:eventId/comments', (req, res) => {
    const { authorId, text } = req.body;
    const eventId = parseInt(req.params.eventId);

    if (!authorId || !text) {
        return res.status(400).json({ message: 'Dados do comentário incompletos.' });
    }

    try {
        const db = readDb();
        const newComment = {
            id: db.comments.length > 0 ? Math.max(...db.comments.map(c => c.id)) + 1 : 1,
            eventId,
            authorId,
            text,
            timestamp: new Date().toISOString()
        };
        db.comments.push(newComment);
        writeDb(db);

        const author = db.users.find(u => u.id === authorId);
        res.status(201).json({ ...newComment, authorName: author.name });

    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar comentário.' });
    }
});


// --- Usar o router da API ---
app.use('/api', apiRouter);

// --- Configuração do Servidor HTTPS ---
const httpsOptions = {
    key: fs.readFileSync(`/etc/letsencrypt/live/app-acao-cidada-vitor.duckdns.org/privkey.pem`),
    cert: fs.readFileSync(`/etc/letsencrypt/live/app-acao-cidada-vitor.duckdns.org/fullchain.pem`)
};

const PORT = 443;

https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Servidor HTTPS a rodar de forma segura na porta ${PORT}`);
});

