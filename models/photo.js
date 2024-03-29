const imageSize = require('image-size');
let photos = [];
let lastPhotoId = 0;

exports.create = (username, description, path, publicPath) => {
    let dimensions = imageSize(path);
    let photo = {
        id: lastPhotoId,
        user: username,
        description: description,
        likes: [],
        date: Date.now(),
        path: publicPath,
        width: dimensions.width,
        height: dimensions.height
    };
    lastPhotoId ++;
    photos.push(photo);
    return photo;
};

exports.getAll = () => {
    return photos;
};

exports.get = id => {
    for (let photo of photos) {
        if (photo.id === id) {
            return photo;
        }
    }
    return null;
};

exports.delete = id => {
    for (let i=0; i<photos.length; i++) {
        if (photos[i].id === id) {
            photos.splice(i,1);
            return true;
        }
    }
    return false;
};

exports.getAllByUser = (username) => {
    let matches = photos.filter(
        photo => photo.user === username
    ).map((photo) => {
        let {user, ...rest} = photo;
        return rest;
    });
    return matches;
};

exports.getFeed = (usernames, dateFrom) => {
    let feed = [];
    for (let i = photos.length-1; i >= 0; i--) {
        if (usernames.indexOf(photos[i].user) !== -1 &&
            dateFrom <= photos[i].date) {
            feed.push(photos[i]);
        }
    }
    // Sort photos in reverse data order (latest first)
    feed.sort((a,b) => b.date - a.date);
    return feed;
};
