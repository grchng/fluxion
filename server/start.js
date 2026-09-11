import {createSyncServer} from './server.js';

const PORT = Number(process.env.PORT) || 3001;
createSyncServer({ port: PORT })
console.log(`listening on ws://localhost:${PORT}`)
