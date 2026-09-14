import {WebSocketServer} from 'ws';

export function createSyncServer({ port }) {
    const server = new WebSocketServer({ port })
    const environments = new Map();

    function alertEnv(env, message, senderSocket) {
        const jsonStrMessage = JSON.stringify(message);

        for (const otherSocket of env.keys()) {
            if (otherSocket !== senderSocket) {
            otherSocket.send(jsonStrMessage);
            }
        }
    }

    // connection
    server.on('connection', (socket) => {
        // joinedEnvId persists bc it is inside the connection handler (each handler get its own copy for whole session)
        // this is how server remembers without a db
        let joinedEnvId = null;

        // message listener
        // one open line to one person, one server can have many sockets
        socket.on('message', (rawMessage) => {
            let message;
            // error handling
            // JSON.parse explodes if not valid and env explodes with it - need try & catch
            try {
                // change raw message to JSON
                message = JSON.parse(rawMessage.toString())
            } catch (error){
                console.log(error)
                return
            }

            // add socket connections to env when someone new joins
            if (message.type === 'join') {
                joinedEnvId = message.envId;
                const displayName = message.displayName;

                // env not created
                if (!environments.has(joinedEnvId)) {
                    environments.set(joinedEnvId, new Map())
                }

                // get room to set current room display name and info
                const env = environments.get(joinedEnvId)
                env.set(socket, {displayName})
                console.log(`${displayName} joined ${joinedEnvId}`);
                alertEnv(env, {type: 'system', text: `${displayName} joined`}, socket)
            }

            if (message.type === 'chat') {
                const env = environments.get(joinedEnvId);
                if (!env) return;

                const member = env.get(socket);
                if (!member) return;

                alertEnv(env, {
                    type: 'chat',
                    displayName: member.displayName,
                    text: message.text,
                }, socket);
            }

            if (message.type === 'search') {
                console.log('search for:', message.envId, '→', environments.has(message.envId));
                socket.send(JSON.stringify({
                    type: 'search-results',
                    envId: message.envId,
                    exists: environments.has(message.envId),
                }))

                return;
            }
        }); // end of socket message

        // close connection
        socket.on('close', () => {
            const env = environments.get(joinedEnvId);
            if (!env) return;

            // get member info before deleting socket
            const member = env.get(socket);

            env.delete(socket);

            // empty env
            if (env.size === 0) {
                environments.delete(joinedEnvId);
                return;
            }

            if (member) {
                alertEnv(env, {type: 'system', text: `${member.displayName} left the env`})
            }
        });

        // socket error
        socket.on('error', () => {
            const env = environments.get(joinedEnvId);
            if (env) env.delete(socket);
        });
    }); // end of server.on

    return { server, environments };
}
