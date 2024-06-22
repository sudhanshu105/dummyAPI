require('dotenv').config();
const express = require('express');
const formidable = require('formidable');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { Transform } = require('stream');

const app = express();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;

if (!accessKeyId || !secretAccessKey || !region || !Bucket) {
    console.error('Missing required environment variables');
    process.exit(1);
}

const s3Client = new S3Client({
    credentials: {
        accessKeyId,
        secretAccessKey
    },
    region
});

app.post('/upload', (req, res) => {
    const form = formidable({
        maxFileSize: 100 * 1024 * 1024, // 100 MB
        allowEmptyFiles: false
    });

    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
    });

    form.on('fileBegin', (formName, file) => {
        file.open = async function () {
            this._writeStream = new Transform({
                transform(chunk, encoding, callback) {
                    callback(null, chunk);
                }
            });

            this._writeStream.on('error', e => {
                form.emit('error', e);
            });

            const upload = new Upload({
                client: s3Client,
                params: {
                    ACL: 'public-read',
                    Bucket,
                    Key: `${Date.now().toString()}-${this.originalFilename}`,
                    Body: this._writeStream
                },
                tags: [],
                queueSize: 4,
                partSize: 1024 * 1024 * 5,
                leavePartsOnError: false,
            });

            upload.done()
                .then(data => {
                    form.emit('data', { name: 'complete', value: data });
                })
                .catch((err) => {
                    form.emit('error', err);
                });
        };

        file.end = function (cb) {
            this._writeStream.on('finish', () => {
                this.emit('end');
                cb();
            });
            this._writeStream.end();
        };
    });

    form.on('data', data => {
        if (data.name === 'complete') {
            res.status(200).json({ message: 'File uploaded successfully', data: data.value });
        }
    });

    form.on('error', error => {
        res.status(500).json({ error: error.message });
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
