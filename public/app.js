let dislikeButton = document.getElementById('dislike-button');
let likeButton = document.getElementById('like-button');
let chatBox = document.getElementById('chat-box-msgs');
let sendButton = document.getElementById('send-button');
let nameInput = document.getElementById('name-input')
let msgInput = document.getElementById('msg-input');

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

        // handle chat messages from clients
        if (data.type === 'msg' && data.value !== undefined) {
            console.log("Message arrived!");
            console.log(data);

            //Create a message string and page element
            let receivedMsg = data.name + ": " + data.msg;
            let msgEl = document.createElement('p');
            msgEl.innerHTML = receivedMsg;

            //Add the element with the message to the page
            chatBox.appendChild(msgEl);

            //Add a bit of auto scroll for the chat box
            chatBox.scrollTop = chatBox.scrollHeight;
        }


    } catch (error) {
        console.error('Error parsing message:', error);
    }
};



// send like button values to server
likeButton.addEventListener('click', () => {
    console.log('like button was clicked');


    if (ws.readyState === WebSocket.OPEN) {

        ws.send(JSON.stringify({
            type: 'like',
        }));
    }

});

// send dislike button values to server
dislikeButton.addEventListener('click', () => {
    console.log('dislike button was clicked');

    if (ws.readyState === WebSocket.OPEN) {

        ws.send(JSON.stringify({
            type: 'like',
        }));
    }

});

// send message 

sendButton.addEventListener('click', function () {
    let curName = nameInput.value;
    let curMsg = msgInput.value;
    let msgObj = { "name": curName, "msg": curMsg };

    if (ws.readyState === WebSocket.OPEN) {

        //send the message object to the server
        ws.send(JSON.stringify({
            type: 'msg',
            msgObj
        }));
    }

});
