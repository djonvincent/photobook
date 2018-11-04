const express = require('express');
const fs = require('fs');
const Joi = require('joi');
const multer = require('multer');
const User = require('./models/user');
const Photo = require('./models/photo');
const app = express();
const port = 3000;
const uploadPath = 'photos';
const upload = multer({dest: uploadPath + '/'});
app.use(express.json());

const schema = {
    user: {
        username: Joi.string().alphanum().min(3).max(30).required(),
        password: Joi.string().min(6).max(30).required()
    },
    photo: {
        username: Joi.string().required(),
        title: Joi.string().max(50),
        description: Joi.string().max(200)
    }
};

app.get('/api/user/:username', (req, res) => {
    const user = User.get(req.params.username);
    if (!user) {
        return res.status(400).send({'error':'User not found'});
    }
    let photos = Photo.getAllByUser(req.params.username);
    let expand;
    if (req.query.expand) {
        expand = req.query.expand.split(',');
    }
    if (!expand || expand.indexOf('photos') === -1) {
        photos = photos.map(photo => photo.id);
    }
    res.send({
        ...user,
        photos: photos
    });
});

app.post('/api/user/', (req, res) => {
    const result = Joi.validate(req.body, schema.user);
    if (result.error) {
        return res.status(400).send({'error': result.error.details[0].message});
    }
    try {
        const user = User.create(req.body.username, req.body.password);
        res.send(user);
    } catch (err) {
        res.status(400).send({'error': 'That username has been taken'});
    }
});

app.post('/api/photo/', upload.single('photo'), (req, res) => {
    const result = Joi.validate(req.body, schema.photo);
    if (result.error) {
        return res.status(400).send({'error': result.error.details[0].message});
    }
    if (!User.get(req.body.username)) {
        fs.unlink(req.file.path, (err) => {
            if (!err) {
                console.log(req.file.path + ' was deleted');
            }
        });
        return res.status(400).send({'error': 'Invalid username'});
    }
    const photo = Photo.create(req.body.username, req.body.description, req.file.path);
    res.send(photo);
});

app.get('/api/photo/:id', (req, res) => {
    const photo = Photo.get(Number(req.params.id));
    if (!photo) {
        return res.status(400).send({'error': 'Photo not found'});
    }
    res.send(photo);
});

app.get('/api/login/', (req, res) => {
    if (!req.headers.authorization) {
        return res.status(401).send();
    }
    if (req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).send();
    }
    const token = req.headers.authorization.substring(6);
    const plainToken = Buffer.from(token, 'base64').toString();
    const colonIndex = plainToken.indexOf(':');
    const username = plainToken.substring(0, colonIndex);
    const password = plainToken.substring(colonIndex+1);
    const apiKey = User.signIn(username, password);

    res.send({'key': apiKey});
});

app.listen(port);