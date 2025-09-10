const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path'); // Importa o módulo 'path' do Node.js

const app = express();
const PORT = 3000;
const DB_FILE = './db.json';

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumenta o limite para aceitar imagens em base64

// --- NOVO: Servir os arquivos estáticos do frontend ---
// Isso diz ao Express para servir qualquer arquivo da pasta 'frontend'
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
// ----------------------------------------------------


// Função para ler o banco de dados
const readDB = () => {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
};

// Função para escrever no banco de dados
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// ===================================
// =========== ROTAS DE AUTENTICAÇÃO ===========
// ===================================
app.post('/api/auth/login', (req, res) => {
    const { email, password, type } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email === email && u.password === password && u.type === type);
    
    if (user) {
        res.status(200).json(user);
    } else {
        res.status(401).json({ message: 'Credenciais inválidas' });
    }
});

app.post('/api/auth/register', (req, res) => {
    const { name, email, password, type, code } = req.body;
    const db = readDB();

    if (db.users.some(u => u.email === email)) {
        return res.status(400).json({ message: 'Este email já está em uso.' });
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
    writeDB(db);
    res.status(201).json(newUser);
});


// ===================================
// =========== ROTAS DE EVENTOS ===========
// ===================================

// Listar todos os usuários
app.get('/api/users', (req, res) => {
    const db = readDB();
    res.status(200).json(db.users);
});


// Criar um novo evento
app.post('/api/events', (req, res) => {
    const { creatorId, title, description, address, imageUrls } = req.body;
    const db = readDB();

    const newEvent = {
        id: db.events.length > 0 ? Math.max(...db.events.map(e => e.id)) + 1 : 1,
        creatorId,
        title,
        description,
        address,
        imageUrls,
        complaints: 0,
        status: 'pending' // 'pending', 'approved', 'denied', 'resolved'
    };

    db.events.push(newEvent);
    writeDB(db);
    res.status(201).json(newEvent);
});

// Obter eventos aprovados (para o feed)
app.get('/api/events/approved', (req, res) => {
    const db = readDB();
    const approvedEvents = db.events
        .filter(e => e.status === 'approved' || e.status === 'resolved')
        .map(event => {
            const creator = db.users.find(u => u.id === event.creatorId);
            return { ...event, creator: { id: creator.id, name: creator.name } };
        })
        .reverse(); // Mostra os mais recentes primeiro
    res.status(200).json(approvedEvents);
});

// Obter eventos pendentes (para admin)
app.get('/api/events/pending', (req, res) => {
    const db = readDB();
    const pendingEvents = db.events.filter(e => e.status === 'pending');
    res.status(200).json(pendingEvents);
});

// Obter eventos para autoridade
app.get('/api/events/assigned', (req, res) => {
    const db = readDB();
    const assignedEvents = db.events.filter(e => e.status === 'approved' || e.status === 'resolved');
    res.status(200).json(assignedEvents);
});


// Atualizar status de um evento (aprovar/recusar/resolver)
app.put('/api/events/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = readDB();
    const eventIndex = db.events.findIndex(e => e.id == id);

    if (eventIndex !== -1) {
        db.events[eventIndex].status = status;
        writeDB(db);
        res.status(200).json(db.events[eventIndex]);
    } else {
        res.status(404).json({ message: 'Evento não encontrado' });
    }
});

// Adicionar uma reclamação
app.post('/api/events/:id/complain', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const eventIndex = db.events.findIndex(e => e.id == id);

    if (eventIndex !== -1) {
        db.events[eventIndex].complaints++;
        writeDB(db);
        res.status(200).json(db.events[eventIndex]);
    } else {
        res.status(404).json({ message: 'Evento não encontrado' });
    }
});

// --- ROTA DE FALLBACK ---
// Se nenhuma rota da API for correspondida, serve o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

