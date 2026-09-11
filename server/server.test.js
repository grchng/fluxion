import {describe, test, expect, afterEach} from 'vitest';
import WebSocket from 'ws';
import {createSyncServer} from './server.js'

describe('room messages', () => {
    // SERVER SETUP ---------------------------------------------------------
    let activeServers = [];

    afterEach(() => {
        activeServers.forEach((server) => server.close());
        activeServers = [];
    })

    function startTestServerOnRandomPort() {
        // create any port
        const {server, rooms} = createSyncServer({port: 0});
        activeServers.push(server);
        return { port: server.address().port, rooms };
    }

    function connectClient(port) {
        const socket = new WebSocket(`ws://localhost:${port}`);
        return new Promise((resolve) => socket.on('open', () => resolve(socket)));
    }

    // HELPER FUNCTIONS ---------------------------------------------------------
    function waitForMessage(socket) {
        return new Promise((resolve) => {
            // socket.once() listens once then removes itself - don't need socket.on() that fires everytime for this test
            socket.once('message', (rawMessage) => resolve(JSON.parse(rawMessage.toString())))
        })
    }

    function send(socket, message) {
        socket.send(JSON.stringify(message))
    }

    function wait(durationMs) {
        return new Promise((resolve) => setTimeout(resolve, durationMs))
    }

    // TESTS ---------------------------------------------------------
    test('are sent to others in the same room', async () => {
        // create port
        const { port } = startTestServerOnRandomPort();

        // connect
        const socket1 = await connectClient(port);
        const socket2 = await connectClient(port);

        // send join msg for users
        send(socket1, { type: 'join', roomId: 'test', displayName: 'Person 1'});
        send(socket2, { type: 'join', roomId: 'test', displayName: 'Person 2'});

        // {socket1 : { type: 'system', text: 'Person 2 joined' }}
        await waitForMessage(socket1); // read it, return value - now socket 1 queue is empty

        const socket2Receives = waitForMessage(socket2); // listening starts (trap set) --> socket 2 waiting to recieve message promise
        send(socket1, { type: 'chat', text: 'hello' }); // send (trap triggered)
        const message = await socket2Receives;  // collect messages

        expect(message.type).toBe('chat');
        expect(message.displayName).toBe("Person 1");
        expect(message.text).toBe('hello');

        socket1.close();
        socket2.close();
    });


    test('are not sent to others in different rooms', async () => {
        // create only one port per websocket server
        const { port } = startTestServerOnRandomPort();

        // connect
        const socket1 = await connectClient(port);
        const socket2 = await connectClient(port);

        // send join msg for users
        send(socket1, { type: 'join', roomId: 'testA', displayName: 'Person 1'});
        send(socket2, { type: 'join', roomId: 'testB', displayName: 'Person 2'});

        let socket2Receives = false;
        // socket2 should never receive msg, so if it is true then it means something is wrong
        socket2.on('message', () => { socket2Receives = true; })

        send(socket1, { type: 'chat', text: 'hello' });
        await wait(100);

        expect(socket2Receives).toBe(false);

        socket1.close();
        socket2.close();
    })

    test('alerts everyone when someone joins the same room', async () => {
        // create only one port per websocket server
        const { port } = startTestServerOnRandomPort();

        // connect
        const socket1 = await connectClient(port);
        // send join msg
        send(socket1, { type: 'join', roomId: 'test', displayName: 'Person 1'});
        const socket1Receives = waitForMessage(socket1); // trap set

        const socket2 = await connectClient(port);
        let socket2Receives = false;
        socket2.on('message', () => { socket2Receives = true; }) // socket2.on() fires on every msg
        send(socket2, { type: 'join', roomId: 'test', displayName: 'Person 2'});

        const message1 = await socket1Receives;
        await wait(100);

        expect(message1.type).toBe('system');
        expect(message1.text).toContain('Person 2');
        expect(message1.text).toContain('joined');
        expect(socket2Receives).toBe(false)

        socket1.close();
        socket2.close();
    });

    test('alerts everyone when someone leaves the same room', async () => {
        // create only one port per websocket server
        const { port } = startTestServerOnRandomPort();

        // connect
        const socket1 = await connectClient(port);
        const socket2 = await connectClient(port);

        send(socket1, { type: 'join', roomId: 'testA', displayName: 'Person 1' });
        send(socket2, { type: 'join', roomId: 'testA', displayName: 'Person 2' });

        await waitForMessage(socket1); // drain "Person 2 joined"

        const socket1Receives = waitForMessage(socket1); // trap set
        // close socket2
        socket2.close();
        const message = await socket1Receives;

        expect(message.type).toBe('system');
        expect(message.text).toContain('Person 2 left')

        socket1.close();
    });

    test('deletes all empty rooms from memory', async () => {
        // create only one port per websocket server
        const { port, rooms } = startTestServerOnRandomPort();

        const socket1 = await connectClient(port)
        const socket2 = await connectClient(port)
        // send is what creates the room 'testA'
        send(socket1, { type: 'join', roomId: 'testA', displayName: 'Person 1' });
        send(socket2, { type: 'join', roomId: 'testB', displayName: 'Person 2' });
        await wait(50);

        expect(rooms.size).toBe(2)

        socket1.close();
        socket2.close()
        await wait(100);

        expect(rooms.size).toBe(0)
    });

    // rooms.get('testA').size
    test('deletes a single empty room from memory', async () => {
        // create only one port per websocket server
        const { port, rooms } = startTestServerOnRandomPort();

        const socket1 = await connectClient(port)
        const socket2 = await connectClient(port)
        // send is what creates the room 'testA'
        send(socket1, { type: 'join', roomId: 'testA', displayName: 'Person 1' });
        send(socket2, { type: 'join', roomId: 'testB', displayName: 'Person 2' });
        await wait(50);

        expect(rooms.size).toBe(2)

        socket1.close();

        await wait(100);

        expect(rooms.size).toBe(1)
        expect(rooms.get('testA')).toBeUndefined();
     });

     test('survives malformed input', async () => {
        const { port } = startTestServerOnRandomPort();

        const socket1 = await connectClient(port);
        const socket2 = await connectClient(port);

        send(socket1, { type: 'join', roomId: 'testA', displayName: 'Person 1' });
        send(socket2, { type: 'join', roomId: 'testA', displayName: 'Person 2' });

        await waitForMessage(socket1); // drain "Person 2 joined"

        socket1.send('this is a string, and not JSON {type, roomId, displayName}')
        await(wait(50))

        const socket2Receives = waitForMessage(socket2); // socket 2 listening for msgs
        send(socket1, { type: 'chat', text: 'still alive' }); // socket 1 sends msg
        const message = await socket2Receives;

        expect(message.text).toBe('still alive');
        expect(message.text).not.toContain('this is a string');
     })

     test('survives malformed/malicious input', async () => {
        const { port } = startTestServerOnRandomPort();

        const socket1 = await connectClient(port);
        const socket2 = await connectClient(port);

        send(socket1, { type: 'join', roomId: 'testA', displayName: 'Person 1' });
        send(socket2, { type: 'join', roomId: 'testA', displayName: 'Person 2' });

        await waitForMessage(socket1); // drain "Person 2 joined"

        socket1.send('this is a string, and not JSON {type, roomId, displayName}')
        await(wait(50))

        const socket2Receives = waitForMessage(socket2); // socket 2 listening for msgs
        send(socket1, { type: 'chat', text: 'still alive' }); // socket 1 sends msg
        const message = await socket2Receives;

        expect(message.text).toBe('still alive');
        expect(message.text).not.toContain('this is a string');
     });

    test('ignores chat sent before joining', async () => {
        const { port } = startTestServerOnRandomPort();

        const socket1 = await connectClient(port);
        const socket2 = await connectClient(port);

        send(socket2, {type: 'join', roomId: 'testA', displayName: 'Person 2'})

        let socket2Receives = false;
        socket2.on('message', () => { socket2Receives = true; });

        send(socket1, { type: 'chat', text: 'nope' });
        await wait(100);

        expect(socket2Receives).toBe(false);

        socket1.close();
        socket2.close();
    })
});
