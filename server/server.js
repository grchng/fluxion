import {WebSocketServer} from 'ws';

const server = new WebSocketServer({port:3001})

server.on('connection', (socket) => {
    console.log('someone connected')

    socket.on('message', (rawMessage) => {
        const text = rawMessage.toString();
        console.log('recieved:', text);
        socket.send('server got: ' + text)
    })

    socket.on('close', () => {
        console.log('someone disconnected')
    })
})

console.log('listening on: ws://localhost:3001')
