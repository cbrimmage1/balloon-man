// import express + websockets
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// serve static pages
app.use(express.static('public'));

// a js storage object, similiar to array, but prevents duplicate data
const clients = new Set();

const serverState = {
    // pump motor off
    inflateOn: false,

    // deflate motor off
    deflateOn: false,

};

// helper function for brodcasting data to clients
function broadcast(data) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        // if there's a client, return the current state
        if (client.readyState === 1) {
            client.send(message);
        }
    });
}

// ws = connected client
wss.on('connection', (ws, req) => {
    console.log('New client connected');
    // add connected client to the clients set
    clients.add(ws);

    // send current state to newly connected client
    ws.send(JSON.stringify({
        type: 'initialState',
        state: serverState
    }));

    //listen for chat messages from the client
    // ws.on('msg', function(data) {
    //     //Data can be numbers, strings, objects
    //     console.log("Received a 'msg':", data);

    //     //send a response to all clients, including this one
    //     broadcast({ type: 'chatMessage', value: data }) //
    // });

    // listen for data from the client pressing buttons to send to arduino
    ws.on('message', (incomingData) => {
        try {
            // incomingData string as json
            const data = JSON.parse(incomingData);
            // log incoming data
            console.log('Received:', data);

            // like/inflate button toggle
            if (data.type === 'like') {
                // toggle the inflate motor state
                serverState.inflateOn = !serverState.inflateOn;
                console.log('Like Button toggled to:', serverState.inflateOn);
                broadcast({ type: 'inflateState', value: serverState.inflateOn });
            }

            // dislike/deflate button toggle
            if (data.type === 'dislike') {
                // toggle the deflate motor state
                serverState.deflateOn = !serverState.deflateOn;
                console.log('Dislike Button toggled to:', serverState.deflateOn);
                broadcast({ type: 'deflateState', value: serverState.deflateOn });
            }

        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    // client disconnected
    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });


    // server error
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

//set up localhost port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});