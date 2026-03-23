//for starting the database connection and the web server.

import app from './app.js'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'
import { initFirebaseAdmin } from './config/firebase.js'
import http from 'http'
import { createSocketServer } from './middlewares/index.js'
import { autoAcceptPendingOrders, autoAssignConfirmedOrders } from './services/order.service.js'
import { startTaskWorker } from './utils/taskQueue.js'
import { confirmOrder, assignRider, dispatchOrder, riderStartDelivery, riderPickup } from './services/order.service.js';
import { markInactiveRiders } from './services/rider.service.js';
import { RIDER_HEARTBEAT_TTL_MS, RIDER_HEARTBEAT_SWEEP_MS } from './constants/rider.constants.js';
import { runChatArchiveMaintenance } from './services/chat.service.js';

connectDB();
initFirebaseAdmin();

const PORT = env.PORT;
const httpServer = http.createServer(app)
const io = createSocketServer(httpServer)

app.set('io', io);

const AUTO_ACCEPT_INTERVAL_MS = 2 * 60 * 1000;
let autoAcceptRunning = false;
const AUTO_ASSIGN_INTERVAL_MS = 3 * 60 * 1000;
let autoAssignRunning = false;
const CHAT_ARCHIVE_MAINTENANCE_INTERVAL_MS = 60 * 60 * 1000;
let chatArchiveMaintenanceRunning = false;
let riderPresenceSweepRunning = false;

//AUTO ACCEPT ORDER
const runAutoAcceptTick = async () => {
  if (autoAcceptRunning) return;
  autoAcceptRunning = true;
  try {
    const stats = await autoAcceptPendingOrders({ maxAgeSeconds: 60, batchSize: 100 });
    if (stats.updated > 0 || stats.failed > 0) {
      console.log(
        `[AUTO_ACCEPT] scanned=${stats.scanned} updated=${stats.updated} failed=${stats.failed}`
      );
    }
  } catch (err) {
    console.error(`[AUTO_ACCEPT] Tick failed: ${err.message}`);
  } finally {
    autoAcceptRunning = false;
  }
};

const runChatArchiveMaintenanceTick = async () => {
  if (chatArchiveMaintenanceRunning) return;
  chatArchiveMaintenanceRunning = true;
  try {
    await runChatArchiveMaintenance();
  } catch (err) {
    console.error(`[CHAT_ARCHIVE] Tick failed: ${err.message}`);
  } finally {
    chatArchiveMaintenanceRunning = false;
  }
};

const runAutoAssignTick = async () => {
  if (autoAssignRunning) return;
  autoAssignRunning = true;
  try {
    const stats = await autoAssignConfirmedOrders({ batchSize: 100 });
    if (stats.assigned > 0 || stats.failed > 0) {
      console.log(
        `[AUTO_ASSIGN] scanned=${stats.scanned} assigned=${stats.assigned} no_capacity=${stats.skippedNoCapacity} failed=${stats.failed}`
      );
    }
  } catch (err) {
    console.error(`[AUTO_ASSIGN] Tick failed: ${err.message}`);
  } finally {
    autoAssignRunning = false;
  }
};

const runRiderPresenceSweep = async () => {
  if (riderPresenceSweepRunning) return;
  riderPresenceSweepRunning = true;
  try {
    const cutoff = new Date(Date.now() - RIDER_HEARTBEAT_TTL_MS);
    const stats = await markInactiveRiders({ cutoff });
    if (stats.updated > 0) {
      console.log(`[RIDER_PRESENCE] inactive=${stats.updated}`);
    }
  } catch (err) {
    console.error(`[RIDER_PRESENCE] Sweep failed: ${err.message}`);
  } finally {
    riderPresenceSweepRunning = false;
  }
};

httpServer.listen(PORT,() => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`)
  //IT RUN ONCE IMMEDIATELY: THEN KEEP SCANNING PENDING ORDERS EVERY 15S
  runAutoAcceptTick();
  setInterval(runAutoAcceptTick, AUTO_ACCEPT_INTERVAL_MS);
  runAutoAssignTick();
  setInterval(runAutoAssignTick, AUTO_ASSIGN_INTERVAL_MS);
  runChatArchiveMaintenanceTick();
  setInterval(runChatArchiveMaintenanceTick, CHAT_ARCHIVE_MAINTENANCE_INTERVAL_MS);
  runRiderPresenceSweep();
  setInterval(runRiderPresenceSweep, RIDER_HEARTBEAT_SWEEP_MS);

  //APPLY TASK WORKER
  startTaskWorker( {
    confirmOrder: async (job) => confirmOrder(job.payload),
    assignRider : async (job) => assignRider(job.payload),
    dispatchOrder : async(job) => dispatchOrder(job.payload),
    riderStartDelivery : async (job) => riderStartDelivery(job.payload),
    riderPickup: async (job) => riderPickup(job.payload),
  })
})

process.on('unhandledRejection', (err ) => {
  console.log(`Error: ${err.message}`);
  httpServer.close(() => process.exit(1));
});
