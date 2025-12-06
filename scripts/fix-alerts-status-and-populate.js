// scripts/fix-alerts-status-and-populate.js
const mongoose = require('mongoose');
const Alert = require('../models/Alert'); // model used only for collection name; we will use collection ops
const User = require('../models/User');

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/first-responders';

const VALID = new Set(['PENDING', 'ACCEPTED', 'COMPLETED']);

function normalizeStatus(s) {
  if (!s && s !== '') return 'PENDING';
  const up = String(s).toUpperCase();
  if (VALID.has(up)) return up;
  // try common equivalences
  if (up === 'DONE' || up === 'RESOLVED' || up === 'COMPLETE') return 'COMPLETED';
  return 'PENDING';
}

async function run() {
  await mongoose.connect(MONGO);
  console.log('Connected to Mongo');

  const coll = mongoose.connection.collection('alerts'); // raw collection

  // Find alerts that either lack reporterName/Phone OR have non-uppercase statuses
  const cursor = coll.find({
    $or: [
      { reporterName: { $exists: false } },
      { reporterName: null },
      { reporterPhone: { $exists: false } },
      { reporterPhone: null },
      { status: { $exists: true, $type: 'string', $nin: Array.from(VALID) } } // status not in valid set
    ]
  });

  let updated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    try {
      const reporter = await User.findById(doc.reporterId).lean();
      const reporterName = reporter ? reporter.name : null;
      const reporterPhone = reporter ? reporter.phone : null;

      const newStatus = normalizeStatus(doc.status);

      await coll.updateOne(
        { _id: doc._id },
        { $set: { reporterName, reporterPhone, status: newStatus } }
      );
      updated++;
      if (updated % 50 === 0) console.log(`Updated ${updated}...`);
    } catch (e) {
      console.error('Error updating alert', doc._id, e.message);
    }
  }

  console.log(`Migration finished. Updated ${updated} alerts.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
