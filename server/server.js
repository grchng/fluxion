import {WebSocketServer} from 'ws';

const server = new WebSocketServer({port:3001})

const connectedSockets = new Set();

server.on('connection', (socket) => {
    console.log('someone connected')
    connectedSockets.add(socket);

    socket.on('message', (rawMessage) => {
        const text = rawMessage.toString();

        for (const otherSocket of connectedSockets) {
            if (otherSocket !== socket) {
                otherSocket.send(text);
            }
        }
    })

    socket.on('close', () => {
        console.log('someone disconnected')
        connectedSockets.delete(socket);
    })
})

console.log('listening on: ws://localhost:3001')
