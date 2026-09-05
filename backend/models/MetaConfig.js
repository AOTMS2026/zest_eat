const mongoose = require('mongoose');

const metaConfigSchema = new mongoose.Schema({
  wabaId: { type: String, required: true },
  phoneId: { type: String, required: true },
  accessToken: { type: String, required: true },
  verifyToken: { type: String, default: 'zest_eat_meta_verify_8f9q2a' },
  graphVersion: { type: String, default: 'v19.0' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MetaConfig', metaConfigSchema);
