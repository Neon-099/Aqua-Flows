//for starting the database connection and the web server.

import app from './app.js'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'
import { initFirebaseAdmin } from './config/firebase.js'
import http from 'http'
import { createSocketServer } from './middlewares/index.js'

connectDB();
initFirebaseAdmin();

const PORT = env.PORT;
const httpServer = http.createServer(app)
const io = createSocketServer(httpServer)

app.set('io', io);

  httpServer.listen(PORT,() => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`)
  })

process.on('unhandledRejection', (err ) => {
  console.log(`Error: ${err.message}`);
  httpServer.close(() => process.exit(1));
});

