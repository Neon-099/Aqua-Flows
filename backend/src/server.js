//for starting the database connection and the web server.

import app from './app.js'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'
import { initFirebaseAdmin } from './config/firebase.js'
import http from 'http'
import { createSocketServer } from './middlewares/index.js'
import { autoAcceptPendingOrders } from './services/order.service.js'
import { startTaskWorker } from './utils/taskQueue.js'
import { confirmOrder, assignRider, queueDispatch, dispatchOrder, riderStartDelivery, riderPickup } from './services/order.service.js';

connectDB();
initFirebaseAdmin();

const PORT = env.PORT;
const httpServer = http.createServer(app)
const io = createSocketServer(httpServer)

app.set('io', io);

const AUTO_ACCEPT_INTERVAL_MS = 15000;
let autoAcceptRunning = false;

//AUTO ACCEPT ORDER
const runAutoAcceptTick = async () => {
  if (autoAcceptRunning) return;
  autoAcceptRunning = true;
  try {
    const stats = await autoAcceptPendingOrders({ maxAgeSeconds: 60, batchSize: 100 });
    if (stats.updated > 0 || stats.failed > 0) {
      console.log(
        `[AUTO_ACCEPT] scanned=${stats.scanned} updated=${stats.updated} no_capacity=${stats.skippedNoCapacity} failed=${stats.failed}`
      );
    }
  } catch (err) {
    console.error(`[AUTO_ACCEPT] Tick failed: ${err.message}`);
  } finally {
    autoAcceptRunning = false;
  }
};

httpServer.listen(PORT,() => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`)
  //IT RUN ONCE IMMEDIATELY: THEN KEEP SCANNING PENDING ORDERS EVERY 15S
  runAutoAcceptTick();
  setInterval(runAutoAcceptTick, AUTO_ACCEPT_INTERVAL_MS);

  //APPLY TASK WORKER
  startTaskWorker( {
    confirmOrder: async (job) => confirmOrder(job.payload),
    assignRider : async (job) => assignRider(job.payload),
    queueDispatch: async(job) => queueDispatch(job.payload),
    dispatchOrder : async(job) => dispatchOrder(job.payload),
    riderStartDelivery : async (job) => riderStartDelivery(job.payload),
    riderPickup: async (job) => riderPickup(job.payload),
  })
})

process.on('unhandledRejection', (err ) => {
  console.log(`Error: ${err.message}`);
  httpServer.close(() => process.exit(1));
});
