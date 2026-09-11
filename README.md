# Fluxion
<pre>A place to watch yt and twitch vods together with friends.</pre>

## Project Directory
<pre>
fluxion/
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts
├── next-env.d.ts
├── eslint.config.mjs
├── postcss.config.mjs
├── node_modules/
├── .next/
│
├── public/
│
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── room/
│       └── [roomId]/
│           └── page.tsx
│
├── components/
│   ├── PlayerPanel.tsx
│   └── ChatPanel.tsx
│
├── lib/
│   ├── useSyncConnection.ts
│   ├── parseMediaUrl.ts
│   └── adapters/
│       ├── index.ts
│       ├── youtube.ts
│       └── twitch.ts
│
└── server/
    ├── package.json
    ├── package-lock.json
    ├── node_modules/
    └── server.js
</pre>

## Technologies
- TypeScript
- React
- Vitest
- Express
- SASS
- NextJS
- WebSocket

## Development Phases
### `Phase 0A` - testing the websocket connection

- creating an index.html file to send chat message and see whether or not the server receives it: needs `open`, `message`, `close`
    ```js
    <input id="messageBox" placeholder="type something" />
    <button id="sendButton">Send</button>
    <pre id="log"></pre>

    <script>
    const socket = new WebSocket('ws://localhost:3001');
    const log = document.getElementById('log');

    function writeLine(text) {
        log.textContent += text + '\n';
    }

    socket.addEventListener('open', () => writeLine('connected'));
    socket.addEventListener('message', (event) => writeLine(event.data));
    socket.addEventListener('close', () => writeLine('disconnected'));

    document.getElementById('sendButton').addEventListener('click', () => {
        const messageBox = document.getElementById('messageBox');
        socket.send(messageBox.value);
        messageBox.value = '';
    });
    </script>
  ```
- creating a server.js file for the websocket server: needs `connection`, `message` and `close`
  ```js
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
    ```


- run `node server.js` and open `index.html` in browser

### `Phase 0B` - connecting multiple connections

`server.js`
  ```js
  import {WebSocketServer} from 'ws';

  const server = new WebSocketServer({port:3001})

  const connectedSockets = new Set();

  server.on('connection', (socket) => {
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
          connectedSockets.delete(socket);
      })
  })

  console.log('listening on: ws://localhost:3001')
  ```

### `Phase 0C` - using Map of roomid to a set of, use JSON instead of string for messages

`server.js`
```js
const rooms = new Map();

server.on('connection', (socket) => {
  let joinedRoomId = null;

  socket.on('message', (rawMessage) => {
    const message = JSON.parse(rawMessage.toString());

    if (message.type === 'join') {
      joinedRoomId = message.roomId;
      if (!rooms.has(joinedRoomId)) {
        rooms.set(joinedRoomId, new Set());
      }
      rooms.get(joinedRoomId).add(socket);
      console.log(`someone joined ${joinedRoomId}`);
      return;
    }

    if (message.type === 'chat') {
      const room = rooms.get(joinedRoomId);
      if (!room) return;

      for (const otherSocket of room) {
        if (otherSocket !== socket) {
          otherSocket.send(JSON.stringify({ type: 'chat', text: message.text }));
        }
      }
    }
  });

  socket.on('close', () => {
    const room = rooms.get(joinedRoomId);
    if (!room) return;
    room.delete(socket);
    if (room.size === 0) rooms.delete(joinedRoomId);
  });
});
```

`index.html` ==> client sends JSON and parse it coming back
```js
// index.html
socket.addEventListener('open', () => {
  writeLine('connected');
  socket.send(JSON.stringify({ type: 'join', roomId: 'TEST' }));
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'chat') writeLine(message.text);
});

document.getElementById('sendButton').addEventListener('click', () => {
  const messageBox = document.getElementById('messageBox');
  socket.send(JSON.stringify({ type: 'chat', text: messageBox.value }));
  messageBox.value = '';
});
```

### `Phase 0D` - adding display names, make server track ppl, arrivals and departures

`index.html`
```diff
socket.addEventListener('open', () => {
  writeLine('connected');
- socket.send(JSON.stringify({ type: 'join', roomId: 'TEST'}));
+ socket.send(JSON.stringify({ type: 'join', roomId: 'TEST', displayName: 'Dummy1'}));
});
```

`server.js` Set becomes Map to store name with each socket
```diff
socket.on('message', (rawMessage) => {
  ...
   // room not created
    if (!rooms.has(joinedRoomId)) {
-       rooms.set(joinedRoomId, new Set())
+       rooms.set(joinedRoom, new Map())
    }
    ...
    // add socket connection to room
-   rooms.get(joinedRoomId).add(socket)
+   rooms.get(joinedRoomId).set(socket, displayName: message.displayName})
    console.log('someone joined ${joinedRoomId}');
    return;

```
### Notes
```
const room = Map {
    socketA : {displayName: 'bob'},
    socketB : {displayName: 'jeff'}
}

----------------------------

const rooms = Map {
  room1 : Map {
    socketA: {displayName: 'bob'}
    socketB: {displayName: 'jeff'}
  },

  room2: Map {
    socketC: {displayName: 'john'}
  }
}
```
--------------------------------


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Testing
First time using vitest
```bash
cd server
npm test
```
### Notes
- `createSyncServer({port: 0})` ==> calls createSyncServer function and passes port 0 meaning give me any free port to operating system
  - need this to run in parallel and coexist with dev server on 3001 without collisions

-----------------------
## References
- https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
- https://github.com/websockets/ws
- https://blog.stackademic.com/getting-started-with-websockets-in-typescript-c48c5519f7d4
- https://medium.com/@edhalliwell/chat-app-driven-by-websockets-using-socket-io-and-typescript-ed49611d6077


