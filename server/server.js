import {WebSocketServer} from 'ws';

export function createSyncServer({ port }) {
    const server = new WebSocketServer({ port })
    const rooms = new Map();

    function alertRoom(room, message, senderSocket) {
        const jsonStrMessage = JSON.stringify(message);

        for (const otherSocket of room.keys()) {
            if (otherSocket !== senderSocket) {
            otherSocket.send(jsonStrMessage);
            }
        }
    }

    // connection
    server.on('connection', (socket) => {
        // joinedRoomId persists bc it is inside the connection handler (each handler get its own copy for whole session)
        // this is how server remembers without a db
        let joinedRoomId = null;

        // message listener
        // one open line to one person, one server can have many sockets
        socket.on('message', (rawMessage) => {
            let message;
            // error handling
            // JSON.parse explodes if not valid and room explodes with it - need try & catch
            try {
                // change raw message to JSON
                message = JSON.parse(rawMessage.toString())
            } catch (error){
                console.log(error)
                return
            }

            // add socket connections to room when someone new joins
            if (message.type === 'join') {
                joinedRoomId = message.roomId;
                const displayName = message.displayName || 'StrangerDanger';

                // room not created
                if (!rooms.has(joinedRoomId)) {
                    rooms.set(joinedRoomId, new Map())
                }

                // get room to set current room display name and info
                const room = rooms.get(joinedRoomId)
                room.set(socket, {displayName})
                console.log(`${displayName} joined ${joinedRoomId}`);
                alertRoom(room, {type: 'system', text: `${displayName} joined`}, socket)
            }

            if (message.type === 'chat') {
                const room = rooms.get(joinedRoomId);
                if (!room) return;

                const member = room.get(socket);
                if (!member) return;

                alertRoom(room, {
                    type: 'chat',
                    displayName: member.displayName,
                    text: message.text,
                }, socket);
            }
        }); // end of socket message

        // close connection
        socket.on('close', () => {
            const room = rooms.get(joinedRoomId);
            if (!room) return;

            // get member info before deleting socket
            const member = room.get(socket);
            room.delete(socket);

            if (member) {
                alertRoom(room, {type: 'system', text: `${member.displayName} left the room`})
            }

            // empty room
            if (room.size === 0) {
                rooms.delete(joinedRoomId);
                return;
            }
        });

        // socket error
        socket.on('error', () => {
            const room = rooms.get(joinedRoomId);
            if (room) room.delete(socket);
        });
    }); // end of server.on

    return { server, rooms };
}
