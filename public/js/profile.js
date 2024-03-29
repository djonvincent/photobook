let profileUsername = document.getElementById('profileUsername');
let profileName = document.getElementById('profileName');
let profilePhotos = document.getElementById('profilePhotos');
let profileFollowButton = document.getElementById('profileFollowButton');

function profileHandler(params) {
    loadProfile();
    profileUsername.innerHTML = '';
    profileName.innerHTML = '';
    profilePhotos.innerHTML = '';
    profileFollowButton.style.display = 'none';

    function loadProfile() {
        let apiKey = localStorage.getItem('apiKey');
        let username = params.username;
        fetch('/people/me', {
            method: 'get',
            headers: new Headers({'Authorization': apiKey})
        })
        .then(res => {
            if (!res.ok) {
                throw Error(res.statusText);
            }
            return res.json();
        })
        .then(data => {
            if (data.username === username || username === 'me') {
                return;
            }
            profileFollowButton.style.display = '';
            if (data.follows.indexOf(username) === -1) {
                profileFollowButton.innerHTML = 'Follow';
                profileFollowButton.onclick = follow;
            } else {
                profileFollowButton.innerHTML = 'Unfollow';
                profileFollowButton.onclick = unfollow;
            }
            
        })
        .catch(err => {});

        fetch('/people/' + username + '?expand=photos', {
            method: 'get',
            headers: new Headers({'Authorization': apiKey})
        })
        .then(res => res.json())
        .then(data => {
            profileUsername.innerHTML = data.username;
            profileName.innerHTML = data.forename + ' ' + data.surname;
            profilePhotos.innerHTML = '';
            if (data.photos.length === 0) {
                console.log('no photos');
                profilePhotos.innerHTML = 'You have no photos yet, get uploading!';
            }
            // Initialise photo columns and heights
            let columns = [[],[]];
            let heights = [0,0];
            // Fill photos with empty spaces to make multiple of 3
            while (data.photos.length % 3 !== 0) {
                data.photos.push({height: 0, width: 1});
            }
            // Process photos in groups of 3
            for (let i=0; i<data.photos.length; i+=3) {
                let photos = data.photos.slice(i, i+3);
                photos = photos.map(p => {
                    p.relHeight = p.height/p.width;
                    return p;
                });
                let sorted = photos.slice().sort((a,b) => a.relHeight - b.relHeight);
                // Returns height of an array of photos
                function height (group) {
                    return group.reduce((a,b) => a + b.relHeight, 0);
                }
                let j = 0; // Index of shortest column
                if (heights[0] > heights[1]) {
                    j = 1;
                }
                let diff = Math.abs(heights[0] - heights[1]);
                // If gap is bigger than 2 biggest photos, put all 3 in the gap
                if (diff >= sorted[1].relHeight + sorted[2].relHeight) {
                    columns[j] = columns[j].concat(photos);
                    heights[j] += height(photos);
                // Else 2 photos in one column, 1 in the other
                } else {
                    // Treat gap as a photo, then arrange these 4 into a square
                    let space = {relHeight: diff};
                    sorted.push(space);
                    sorted.sort((a,b) => a.relHeight - b.relHeight);
                    // Biggest and smallest go into one column, middle 2 go in
                    // the other
                    let groups = [
                        [sorted[0], sorted[3]],
                        [sorted[1], sorted[2]]
                    ];
                    // Ensure first group is smallest
                    if ((sorted[0].relHeight + sorted[3].relHeight) > 
                        (sorted[1].relHeight + sorted[2].relHeight)) {
                        groups.reverse();
                    }
                    // Sort groups back into date order
                    groups[0].sort((a,b) => b.date - a.date);
                    groups[1].sort((a,b) => b.date - a.date);
                    // Add groups to columns
                    columns[j] = columns[j].concat(groups[1]);
                    heights[j] += height(groups[1]);
                    columns[1-j] = columns[1-j].concat(groups[0]);
                    heights[1-j] += height(groups[0]);
                    // Remove height of the gap from actual heights
                    if (groups[0].indexOf(space) === -1) {
                        heights[j] -= diff;
                    } else {
                        heights[1-j] -= diff;
                    }
                }
            }

            // Add columns to the DOM
            columns.forEach(col => {
                let div = document.createElement('div');
                col.forEach(photo => {
                    // Skip gaps
                    if (photo.path) {
                        div.appendChild(createPhotoEl(photo));
                    }
                });
                profilePhotos.appendChild(div);
            });
        });
    };

    function createPhotoEl (data) {
        let a = document.createElement('a');
        a.href = '/photo/' + data.id;
        a.className = 'route';
        let photo = document.createElement('div');
        photo.style.paddingTop = (100*data.height/data.width) + '%';
        photo.className = 'photo';
        let img = document.createElement('img');
        img.src = data.path;
        img.alt = '';
        photo.appendChild(img);
        a.appendChild(photo);
        //photo.innerHTML = data.id;
        return a;
    }

    function follow () {
        let apiKey = localStorage.getItem('apiKey');
        fetch('/follow/' + params.username, {
            method: 'post',
            headers: new Headers({'Authorization': apiKey})
        })
        .then(res => {
            if (!res.ok) {
                return;
            }
            profileFollowButton.innerHTML = 'Unfollow';
            profileFollowButton.onclick = unfollow;
        });
    }

    function unfollow () {
        let apiKey = localStorage.getItem('apiKey');
        fetch('/follow/' + params.username, {
            method: 'delete',
            headers: new Headers({'Authorization': apiKey})
        })
        .then(res => {
            if (!res.ok) {
                return;
            }
            profileFollowButton.innerHTML = 'Follow';
            profileFollowButton.onclick = follow;
        });
    }
}
