//for starting the database connection and the web server.

import app from './app.js'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'

connectDB();

const PORT = env.development.PORT;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${env.development.NODE_ENV} mode on port ${PORT}`)
})

process.on('unhandledRejection', (err, promise ) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

