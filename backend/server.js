const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '10mb' }));

const dbPath = path.join(__dirname, 'db.json');

// --- Configuração do CORS ---
// ATUALIZADO: Agora permite requisições do seu GitHub Pages.
const corsOptions = {
  origin: 'https://vitorgabrieldossantosg.github.io', 
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// -------------------------

const readDb = async () => {
    const dbRaw = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(dbRaw);
};

const writeDb = async (data) => {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};

app.post('/api/auth/login', async (req, res) => {
    const { email, password, type } = req.body;
    const db = await readDb();
    const user = db.users.find(u => u.email === email && u.password === password && u.type === type);
    if (user) {
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } else {
        res.status(401).json({ message: 'Credenciais inválidas' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, type, code } = req.body;
    const db = await readDb();

    if (db.users.some(u => u.email === email)) {
        return res.status(400).json({ message: 'O email já está em uso.' });
    }

    if (type === 'admin' && code !== 'admin123') {
        return res.status(403).json({ message: 'Código de acesso de Admin inválido.' });
    }
    if (type === 'authority' && code !== 'Aut123') {
        return res.status(403).json({ message: 'Código de acesso de Autoridade inválido.' });
    }

    const newUser = {
        id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
        name,
        email,
        password,
        type
    };
    db.users.push(newUser);
    await writeDb(db);
    res.status(201).json({ message: 'Utilizador registado com sucesso!' });
});

app.get('/api/users', async (req, res) => {
    const db = await readDb();
    const users = db.users.map(({ password, ...user }) => user);
    res.json(users);
});

app.get('/api/events/approved', async (req, res) => {
    const db = await readDb();
    const approvedEvents = db.events
        .filter(e => e.status === 'approved' || e.status === 'resolved')
        .map(event => {
            const creator = db.users.find(u => u.id === event.creatorId);
            const { password, ...creatorInfo } = creator || { name: 'Desconhecido' };
            const commentCount = db.comments.filter(c => c.eventId === event.id).length;
            return { ...event, creator: creatorInfo, commentCount };
        });
    res.json(approvedEvents);
});

app.get('/api/events/pending', async (req, res) => {
    const db = await readDb();
    res.json(db.events.filter(e => e.status === 'pending'));
});

app.get('/api/events/assigned', async (req, res) => {
    const db = await readDb();
     res.json(db.events.filter(e => e.status === 'approved' || e.status === 'resolved'));
});

app.post('/api/events', async (req, res) => {
    const db = await readDb();
    const newEvent = {
        id: db.events.length > 0 ? Math.max(...db.events.map(e => e.id)) + 1 : 1,
        ...req.body,
        complaints: 0,
        status: 'pending'
    };
    db.events.push(newEvent);
    await writeDb(db);
    res.status(201).json(newEvent);
});

app.put('/api/events/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = await readDb();
    const event = db.events.find(e => e.id === parseInt(id));
    if (event) {
        event.status = status;
        await writeDb(db);
        res.json(event);
    } else {
        res.status(404).json({ message: 'Evento não encontrado.' });
    }
});

app.post('/api/events/:id/complain', async (req, res) => {
    const { id } = req.params;
    const db = await readDb();
    const event = db.events.find(e => e.id === parseInt(id));
    if (event) {
        event.complaints++;
        await writeDb(db);
        res.json(event);
    } else {
        res.status(404).json({ message: 'Evento não encontrado.' });
    }
});

app.get('/api/events/:eventId/comments', async (req, res) => {
    const { eventId } = req.params;
    const db = await readDb();
    const comments = db.comments
        .filter(c => c.eventId === parseInt(eventId))
        .map(comment => {
            const author = db.users.find(u => u.id === comment.authorId);
            const { password, ...authorInfo } = author || { name: 'Desconhecido' };
            return { ...comment, author: authorInfo };
        });
    res.json(comments);
});

app.post('/api/events/:eventId/comments', async (req, res) => {
    const { eventId } = req.params;
    const { authorId, text } = req.body;
    const db = await readDb();

    if (!authorId || !text) {
        return res.status(400).json({ message: 'Autor e texto são obrigatórios.' });
    }

    const newComment = {
        id: db.comments.length > 0 ? Math.max(...db.comments.map(c => c.id)) + 1 : 1,
        eventId: parseInt(eventId),
        authorId,
        text
    };
    db.comments.push(newComment);
    await writeDb(db);
    
    const author = db.users.find(u => u.id === authorId);
    const { password, ...authorInfo } = author;
    res.status(201).json({ ...newComment, author: authorInfo });
});


const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor a rodar na porta ${PORT}`);
});

