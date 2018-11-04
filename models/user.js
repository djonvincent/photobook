const bcrypt = require('bcrypt');
const apiKeyChars = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890";
const apiKeyLength = 32;
const users = [];

function generateAPIKey() {
    let key = "";
    for (let i=0; i < apiKeyLength; i ++) {
        key += apiKeyChars[Math.floor(Math.random()*apiKeyChars.length)];
    }
    return key;
}

exports.create = (username, password) => {
    if (exports.get(username)) {
        throw "User already exists";
    }
    const hash = bcrypt.hashSync(password, 10);
    const user = {
        username: username,
        passwordHash: hash,
        apiKey: generateAPIKey(),
        follows: []
    };
    users.push(user);
    const {passwordHash, ...rest} = user;
    return rest;
}

exports.get = username => {
    for (let user of users) {
        if (user.username === username) {
            const {passwordHash, ...rest} = user;
            return rest;
        }
    }
    return null;
};

exports.signIn = (username, password) => {
    const hash = bcrypt.hashSync(password, 10);
    for (let user of users) {
        if (user.username === username &&
            bcrypt.compareSync(password, user.passwordHash)) {
            return user.apiKey;
        }
    }
    return null;
};
