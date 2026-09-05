const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  // New Meta specific fields
  name:            { type: String, required: true }, // lowercase and underscores only
  category:        { type: String, required: true, enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'] },
  language:        { type: String, required: true, default: 'en' },
  components:      { type: Array, default: [] }, // Stores the raw Meta components array
  metaTemplateId:  { type: String }, // Returned from Meta after creation
  metaStatus:      { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'DRAFT'], default: 'DRAFT' },
  wabaId:          { type: String }, // Meta WhatsApp Business Account ID

  // Original fields (kept for legacy/fallback)
  title:           { type: String }, 
  message:         { type: String }, 
  footer:          { type: String, default: '' },
  imageUrl:        { type: String, default: '' },
  mediaId:         { type: String, default: '' }, // Meta Media ID for sending
  
  // Stats & Scheduling (unchanged)
  contacts:        [{ type: String }],
  totalSent:       { type: Number, default: 0 },
  totalFailed:     { type: Number, default: 0 },
  interested:      { type: Number, default: 0 },
  notInterested:   { type: Number, default: 0 },
  ordersGenerated: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'sending', 'completed', 'failed', 'scheduled'],
    default: 'draft',
  },
  sentAt:       Date,
  isScheduled:  { type: Boolean, default: false },
  scheduleTime: { type: String, default: '' },     // "HH:MM"
  repeatDaily:  { type: Boolean, default: false },
  scheduleDays: [{ type: String }],                // ['mon','tue',...] empty = every day
  lastRunAt:    { type: Date },
  nextRunAt:    { type: Date },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);