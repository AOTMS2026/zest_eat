const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
  wamid:        { type: String, required: true, unique: true },
  phone:        { type: String, required: true },
  status:       { type: String, required: true },
  timestamp:    { type: Date, required: true },
  errorCode:    { type: Number, default: null },
  errorMessage: { type: String, default: null },
  pricing:      { type: Object, default: null }
}, { timestamps: true });

module.exports = mongoose.model('MessageLog', messageLogSchema);
