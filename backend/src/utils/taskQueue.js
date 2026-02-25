
//CORE STATE
const queue = [];  //WORKS LIKE FIFO
const taskStore = new Map();
let running = false;  //ENSURES ONLY ONE INTERVAL LOOP RUN

export const enqueueTask = (task) => {
    const taskId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    taskStore.set(taskId, {
        id: taskId,
        type: task?.type || 'unknown',
        status: 'queued',
        createdAt: new Date().toISOString(),
        startedAt: null,
        finishedAt: null,
        error: null,
    });
    queue.push({ id: taskId, ...task})
    return taskId;
}

export const getTaskStatus = (taskId) => taskStore.get(taskId) || null;

export const startTaskWorker = async (handlers, intervalMs = 500) => {
    if(running) return;
    running = true;
    let inTick = false;

    const tick = async () => {
        if (inTick) return;
        inTick = true;
        const job = queue.shift();
        if(!job) {
            inTick = false;
            return;
        }

        const handler = handlers[job.type];
        if(!handler){ 
            console.error(`[TASK] Unknown type: ${job.type}`);
            const record = taskStore.get(job.id);
            if (record) {
                record.status = 'failed';
                record.error = `Unknown type: ${job.type}`;
                record.finishedAt = new Date().toISOString();
                taskStore.set(job.id, record);
            }
            inTick = false;
            return;
        }

        try{
            const record = taskStore.get(job.id);
            if (record) {
                record.status = 'running';
                record.startedAt = new Date().toISOString();
                taskStore.set(job.id, record);
            }
            await handler(job)
            console.log(`[TASK] done ${job.type} (${job.id})`)
            const updated = taskStore.get(job.id);
            if (updated) {
                updated.status = 'done';
                updated.finishedAt = new Date().toISOString();
                taskStore.set(job.id, updated);
            }
        }
        catch (err){
            console.error(`[TASK] failed ${job.type} (${job.id}): ${err.message}`);
            const updated = taskStore.get(job.id);
            if (updated) {
                updated.status = 'failed';
                updated.error = err?.message || 'Task failed';
                updated.finishedAt = new Date().toISOString();
                taskStore.set(job.id, updated);
            }
        }
        finally {
            inTick = false;
        }
    }

    // Run immediately, then keep polling
    tick();
    setInterval(tick, intervalMs);
}
