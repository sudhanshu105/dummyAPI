const express = require('express');
const multer = require('multer');
const cors = require('cors');  
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const serviceAccount = require('./serviceAccountKey.json');

const SECRET_KEY = 'secretKey123'; 

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    
    storageBucket:'Enter your storage bucket here'
});

const bucket = admin.storage().bucket();

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const users = []; 

const upload = multer({ storage: multer.memoryStorage() }); 

function authenticateToken(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.get('/api', (req, res) => {
    res.send('Hello World!');
});

app.get('/temp', (req, res) => {
    res.send('This is temp path');
});

app.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const username = req.user.username;
    const blob = bucket.file(`${username}_${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: req.file.mimetype
        }
    });

    blobStream.on('error', (err) => {
        console.error(err);
        res.status(500).json({ message: 'Upload to Firebase failed.' });
    });

    blobStream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        try {
            const filesMetadata = JSON.parse(await fs.readFile('filesMetadata.json', 'utf8'));
            filesMetadata.push({ name: blob.name, uploadedBy: username });
            await fs.writeFile('filesMetadata.json', JSON.stringify(filesMetadata, null, 2));
        } catch (err) {
            console.error('Error updating file metadata:', err);
        }
        res.status(200).json({ message: 'File uploaded successfully', url: publicUrl, uploadedBy: username });
    });

    blobStream.end(req.file.buffer);
});

app.get('/listFiles', authenticateToken, async (req, res) => {
    try {
        const filesMetadata = JSON.parse(await fs.readFile('filesMetadata.json', 'utf8'));
        const [files] = await bucket.getFiles();

        const fileList = files.map(file => {
            const metadata = filesMetadata.find(meta => meta.name === file.name);
            return {
                name: file.name,
                updated: file.metadata.updated,
                size: file.metadata.size,
                url:  `https://firebasestorage.googleapis.com/v0/b/tempapi-2bd63.appspot.com/o/${file.name}?alt=media&token=ee4bab8d-dbcb-4fbd-8b1e-6fbaa52b1ff8`,
                uploadedBy: metadata ? metadata.uploadedBy : 'Unknown'
            };
        });

        res.status(200).json(fileList);
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ message: 'Error listing files' });
    }
});

app.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        users.push({ username, password });
        await fs.writeFile('users.json', JSON.stringify(users, null, 2));
        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(500).send('Error registering user');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            return res.status(401).send('Invalid credentials');
        }

        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).send('Error logging in');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
