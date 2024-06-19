const express = require('express');
const multer = require('multer');
// const path = require('path');
const cors = require('cors');  
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const fs = require('fs').promises;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'tempapi-2bd63.appspot.com'
});

const bucket = admin.storage().bucket();

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const users = [];

const upload = multer({ storage: multer.memoryStorage() }); 

app.get('/api', (req, res) => {
    res.send('Hello World!');
});

app.get('/temp', (req, res) => {
    res.send('This is temp path');
});


app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const username = req.body.username;
    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: req.file.mimetype
        }
    });

    blobStream.on('error', (err) => {
        console.error(err);
        res.status(500).json({ message: 'Upload to Firebase failed.' });
    });

    blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        res.status(200).json({ message: 'File uploaded successfully', url: publicUrl, uploadedBy: username });
    });

    blobStream.end(req.file.buffer);
});

app.get('/listFiles', async (req, res) => {
    try {
        const [files] = await bucket.getFiles();

        const fileList = files.map(file => {
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/tempapi-2bd63.appspot.com/o/${file.name}?alt=media&token=ee4bab8d-dbcb-4fbd-8b1e-6fbaa52b1ff8`;
            return {
                name: file.name,
                updated: file.metadata.updated,
                size: file.metadata.size,
                url: publicUrl,
                uploadedBy: users.find(u => u.uploadedFiles && u.uploadedFiles.includes(file.name))?.username || 'Unknown'
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
        res.status(200).send('Login successful');
    } catch (error) {
        res.status(500).send('Error logging in');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
