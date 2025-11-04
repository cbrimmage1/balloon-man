let dislikeButton = document.getElementById('dislike-button');
let likeButton = document.getElementById('like-button');

// Connect to WebSocket server
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}`);

ws.onopen = () => {
    console.log('Connected to server');
};

ws.onclose = () => {
    console.log('Disconnected from server');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onmessage = (event) => {
    console.log('Message from server:', event.data);
    try {
        let data = JSON.parse(event.data);
        console.log(data);

        // initial state from server›
        if (data.type === 'initialState') {
            likeButton.value = data.state.inflateOn;
            dislikeButton.value = data.state.deflateOn;
        }

        // update like state from clients
        if (data.type === 'like' && data.value !== undefined) {
            likeButton.value = !likeButton.value
        }

        // update dislike state from clients
        if (data.type === 'dislike' && data.value !== undefined) {
            dislikeButton.value = !dislikeButton.value;
        }


    } catch (error) {
        console.error('Error parsing message:', error);
    }
};

// send like button values to server
likeButton.addEventListener('click', (data) => {
    console.log('like button was clicked');

    let value = data.target.value;
    console.log(value);

    if (ws.readyState === WebSocket.OPEN) {
        if (value === 'false') {
            value = true;
        } else {
            value = false;
        }

        console.log(value);
        
        ws.send({
            type: 'like',
            value: value
        });
    }

});

// send dislike button values to server
// dislikeButton.addEventListener('click', () => {
//     console.log('dislike button was clicked');

//     if (ws.readyState === WebSocket.OPEN) {
//         ws.send(JSON.stringify({
//             type: 'dislike',
//         }));
//     }

// });
