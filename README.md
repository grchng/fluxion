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

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).


## Development Phases
`Phase -1` - testing the websocket connection

- creating an index.html file to send chat message and see whether or not the server receives it: needs `open`, `message`, `close`
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

- creating a server.js file for the websocket server: needs `connection`, `message` and `close`
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

- run `node server.js` and open `index.html` in browser

`Phase 0`



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




-----------------------
## References
- https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
- https://github.com/websockets/ws
- https://blog.stackademic.com/getting-started-with-websockets-in-typescript-c48c5519f7d4
- https://medium.com/@edhalliwell/chat-app-driven-by-websockets-using-socket-io-and-typescript-ed49611d6077


