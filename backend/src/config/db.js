
//DB CONNECTION LOGIC

import mongoose from 'mongoose';
import { env } from './env.js';

const enableDbTiming = env.DB_TIMING === 'true' || env.NODE_ENV !== 'production';

if (enableDbTiming) {
  const timingPlugin = (schema) => {
    const startTimer = function () { this._timingStart = Date.now(); };
    const endTimer = function (op) {
      const ms = Date.now() - (this._timingStart || Date.now());
      const model = this?.model?.modelName || this?.constructor?.modelName || 'Unknown';
      console.log(`[DB] ${model}.${op} ${ms}ms`);
    };

    schema.pre('save', function (next) { startTimer.call(this); next(); });
    schema.post('save', function () { endTimer.call(this, 'save'); });

    const queryOps = [
      'find',
      'findOne',
      'findOneAndUpdate',
      'findOneAndDelete',
      'findOneAndReplace',
      'updateOne',
      'updateMany',
      'count',
      'countDocuments',
      'deleteOne',
      'deleteMany',
    ];

    queryOps.forEach((op) => {
      schema.pre(op, function (next) { startTimer.call(this); next(); });
      schema.post(op, function () { endTimer.call(this, op); });
    });

    schema.pre('aggregate', function (next) { startTimer.call(this); next(); });
    schema.post('aggregate', function () { endTimer.call(this, 'aggregate'); });
  };

  mongoose.plugin(timingPlugin);
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.DATABASE_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
