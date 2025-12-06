// scripts/populate-reporters-in-alerts.js
const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const User = require('../models/User');

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/firstresponders'; // use your DB URI

async function run() {
  await mongoose.connect(MONGO, {});

  console.log('Connected to Mongo');

  // Find alerts missing reporterName or reporterPhone
  const cursor = Alert.find({
    $or: [
      { reporterName: { $exists: false } },
      { reporterName: null },
      { reporterPhone: { $exists: false } },
      { reporterPhone: null }
    ]
  }).cursor();

  let updated = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    try {
      const user = await User.findById(doc.reporterId).lean();
      const reporterName = user ? user.name : null;
      const reporterPhone = user ? user.phone : null;

      // only update if we have something to write (or write null to be explicit)
      doc.reporterName = reporterName;
      doc.reporterPhone = reporterPhone;
      await doc.save();
      updated++;
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
