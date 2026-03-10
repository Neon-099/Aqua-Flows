import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import '../config/env.js';
import User from '../models/User.model.js';
import { seedDefaultConversationsForUser } from '../services/chat.service.js';

const BATCH_SIZE = 100;
const TARGET_ROLES = ['customer', 'user', 'rider', 'staff'];

const run = async () => {
  await connectDB();

  let processed = 0;
  let seeded = 0;
  let skipped = 0;
  let failed = 0;
  let afterId = '';

  while (true) {
    const filter = {
      role: { $in: TARGET_ROLES },
      isArchived: { $ne: true },
    };
    if (afterId) filter._id = { $gt: afterId };

    const users = await User.find(filter)
      .select('_id role')
      .sort({ _id: 1 })
      .limit(BATCH_SIZE);

    if (!users.length) break;

    afterId = users[users.length - 1]._id;

    for (const user of users) {
      processed += 1;
      try {
        const result = await seedDefaultConversationsForUser(user);
        if (result?.skipped) {
          skipped += 1;
        } else {
          seeded += 1;
        }
      } catch (error) {
        failed += 1;
        console.error('[chat-seed][backfill] failed', {
          userId: user?._id,
          role: user?.role,
          error: error?.message || String(error),
        });
      }
    }
  }

  console.log('[chat-seed][backfill] complete', {
    processed,
    seeded,
    skipped,
    failed,
  });

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('[chat-seed][backfill] fatal', error?.message || String(error));
  process.exit(1);
});
