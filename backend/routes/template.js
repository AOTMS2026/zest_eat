const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const Template = require('../models/Template');
const Contact  = require('../models/Contact');
const { getClient, initWhatsApp, getStatus } = require('../utils/whatsappService');
const { ConversationFlow } = require('../utils/conversationFlow');
const { createTemplateOnMeta, getTemplateStatusFromMeta, uploadMediaToMeta, fetchAllTemplatesFromMeta } = require('../utils/metaTemplateService');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/campaigns/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

const fs  = require('fs');
const dir = path.join(__dirname, '../uploads/campaigns/');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const sendDelay = (base = 4000) => {
  const jitter = Math.floor(Math.random() * 2000) - 1000;
  return sleep(Math.max(2500, base + jitter));
};
// ── Meta Broadcast runner ─────────────────────────────────────────────────────
const runMetaBroadcast = async (template, phoneList) => {
  let sent = 0, failed = 0;
  console.log(`🚀 Bulk Meta send to ${phoneList.length} contacts...`);

  // Meta Cloud API is stateless and doesn't need socket connection waiting!
  for (let i = 0; i < phoneList.length; i++) {
    const phone = phoneList[i];
    try {
      await ConversationFlow.startMetaTemplate(phone, template);
      await Contact.findOneAndUpdate({ phone: phone }, { $inc: { templatesSent: 1 }, lastStatus: 'sent' }, { upsert: true });
      sent++;
      console.log(`✅ [${i + 1}/${phoneList.length}] Sent Meta Template to ${phone}`);
    } catch (e) {
      failed++;
      console.error(`❌ [${i + 1}/${phoneList.length}] Failed ${phone}:`, e.message);
    }
    // Meta allows higher limits, so delay can be smaller than Baileys
    if (i < phoneList.length - 1) await sendDelay(500); 
  }

  template.totalSent   = (template.totalSent || 0) + sent;
  template.totalFailed = (template.totalFailed || 0) + failed;
  template.status      = sent > 0 ? 'completed' : 'failed';
  template.lastRunAt   = new Date();
  await template.save();
  console.log(`🏁 Meta Broadcast Done: ${sent} sent, ${failed} failed`);
};

// Legacy Baileys endpoint /api/template/send removed.

// POST /api/template/send-meta
// Send an approved Meta Template to users
router.post('/send-meta', async (req, res) => {
  const { templateId, phones } = req.body;
  if (!templateId) return res.status(400).json({ success: false, message: 'Template ID required' });

  const template = await Template.findById(templateId);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }
  
  if (!template.metaTemplateId) {
    return res.status(400).json({ success: false, message: 'This template does not have a valid Meta Template ID attached.' });
  }

  // Strict Validation: Fetch from Meta to ensure it's still approved right before sending
  try {
    const metaData = await getTemplateStatusFromMeta(template.metaTemplateId);
    if (!metaData || metaData.status !== 'APPROVED') {
       return res.status(400).json({ success: false, message: `Template is not APPROVED on Meta. Current status: ${metaData?.status || 'UNKNOWN'}` });
    }
    // Update local status just in case
    if (template.metaStatus !== 'APPROVED') {
      template.metaStatus = 'APPROVED';
      await template.save();
    }
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Invalid Meta Template ID or template is no longer accessible.' });
  }

  let phoneList = [];
  try { 
    const parsed = JSON.parse(phones || '[]'); 
    if (Array.isArray(parsed)) phoneList = parsed;
    else phoneList = String(phones || '').split(',').map(p => p.trim()).filter(Boolean);
  }
  catch { phoneList = String(phones || '').split(',').map(p => p.trim()).filter(Boolean); }

  if (!phoneList.length) {
    const contacts = await Contact.find({ optedOut: false });
    phoneList = contacts.map(c => c.phone);
  }
  if (!phoneList.length) return res.status(400).json({ success: false, message: 'No contacts to send to' });

  res.json({ success: true, total: phoneList.length, message: 'Meta Broadcast started!' });
  runMetaBroadcast(template, phoneList);
});

// POST /api/template/schedule
router.post('/schedule', upload.single('image'), async (req, res) => {
  const { title, message, footer, phones, scheduleTime, repeatDaily, scheduleDays } = req.body;
  if (!scheduleTime) return res.status(400).json({ success: false, message: 'scheduleTime required (HH:MM)' });

  let phoneList = [];
  try { 
    const parsed = JSON.parse(phones || '[]'); 
    if (Array.isArray(parsed)) phoneList = parsed;
    else phoneList = String(phones || '').split(',').map(p => p.trim()).filter(Boolean);
  }
  catch { phoneList = String(phones || '').split(',').map(p => p.trim()).filter(Boolean); }

  if (!phoneList.length) {
    const contacts = await Contact.find({ optedOut: false });
    phoneList = contacts.map(c => c.phone);
  }

  const [hh, mm] = scheduleTime.split(':').map(Number);
  const next = new Date();
  next.setHours(hh, mm, 0, 0);
  if (next <= new Date()) next.setDate(next.getDate() + 1);

  const template = new Template({
    title: title || 'Fresh Stock Available!', message, footer: footer || '',
    imageUrl: req.file ? `/uploads/campaigns/${req.file.filename}` : '',
    contacts: phoneList, status: 'scheduled',
    isScheduled: true, scheduleTime,
    repeatDaily: repeatDaily === 'true' || repeatDaily === true,
    scheduleDays: scheduleDays ? JSON.parse(scheduleDays) : [],
    nextRunAt: next, isActive: true,
  });
  await template.save();
  res.json({ success: true, template, message: `Scheduled for ${scheduleTime}` });
});

router.get('/schedules', async (req, res) => {
  const schedules = await Template.find({ isScheduled: true }).sort('-createdAt');
  res.json({ success: true, schedules });
});

router.put('/schedule/:id/toggle', async (req, res) => {
  const t = await Template.findById(req.params.id);
  if (!t) return res.status(404).json({ success: false, message: 'Not found' });
  t.isActive = !t.isActive;
  await t.save();
  res.json({ success: true, template: t });
});

router.delete('/schedule/:id', async (req, res) => {
  await Template.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  try {
    await Template.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  const currentWaba = process.env.META_WA_BUSINESS_ACCOUNT_ID;
  const filter = { isScheduled: { $ne: true } };
  if (currentWaba) {
    filter.$or = [
      { wabaId: currentWaba },
      { wabaId: { $exists: false } },
      { wabaId: null },
      { wabaId: '' }
    ];
  }
  const templates = await Template.find(filter).sort('-createdAt');
  res.json({ success: true, templates, currentWabaId: currentWaba });
});

// POST /api/template/meta
// Create a new template directly on Meta WhatsApp Cloud API
router.post('/meta', upload.single('media'), async (req, res) => {
  let { name, language, category, components } = req.body;
  
  if (typeof components === 'string') {
    components = JSON.parse(components);
  }
  
  if (!name || !language || !category || !components) {
    return res.status(400).json({ success: false, message: 'Missing required Meta template fields' });
  }

  try {
    // 1. Upload media if provided
    if (req.file) {
      const handle = await uploadMediaToMeta(req.file.path, req.file.mimetype, req.file.size);
      
      // Inject handle into HEADER component
      const headerIndex = components.findIndex(c => c.type === 'HEADER');
      if (headerIndex !== -1) {
        components[headerIndex].example = { header_handle: [handle] };
      }
    }

    const metaResponse = await createTemplateOnMeta(name, language, category, components);
    
    // 2b. Upload media again but specifically for sending (to get a media_id instead of a handle)
    let mediaId = null;
    if (req.file) {
      const { uploadMediaForSending } = require('../utils/metaTemplateService');
      try {
        mediaId = await uploadMediaForSending(req.file.path, req.file.mimetype);
      } catch (err) {
        console.error('Failed to upload media for sending:', err.message);
      }
    }
    
    // 3. Save in database
    const template = new Template({
      name,
      language,
      category,
      components,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '', // Save the local path
      mediaId, // Save the Meta media ID for sending
      metaTemplateId: metaResponse.id,
      metaStatus: metaResponse.status || 'PENDING',
      wabaId: process.env.META_WA_BUSINESS_ACCOUNT_ID || '',
      title: name, // fallback display
      message: 'Meta Template', // fallback
      status: 'draft'
    });
    
    await template.save();
    
    res.json({ success: true, template, message: 'Template submitted to Meta successfully!' });
  } catch (error) {
    console.error('Meta Template API Error:', error.response?.data || error.message);
    try {
      const template = new Template({
        name,
        language: language || 'en_US',
        category: category || 'MARKETING',
        components,
        imageUrl: req.file ? `/uploads/campaigns/${req.file.filename}` : '',
        metaTemplateId: 'local_' + Date.now(),
        metaStatus: 'PENDING',
        title: name,
        message: Array.isArray(components) ? (components.find(c => c.type === 'BODY')?.text || 'Template') : 'Template',
        status: 'draft'
      });
      await template.save();
      return res.json({ 
        success: true, 
        template, 
        message: 'Template created successfully in Zest Eat! (Meta sync: ' + (error.response?.data?.error?.message || error.message) + ')' 
      });
    } catch (saveErr) {
      return res.status(500).json({ success: false, message: error.message || 'Failed to create template' });
    }
  }
});

// POST /api/template/import-meta
// Import a template from Meta by its ID
router.post('/import-meta', async (req, res) => {
  const { metaTemplateId, imageUrl } = req.body;
  
  if (!metaTemplateId) {
    return res.status(400).json({ success: false, message: 'Meta Template ID is required' });
  }

  try {
    const metaData = await getTemplateStatusFromMeta(metaTemplateId);
    if (!metaData || !metaData.name) {
      return res.status(404).json({ success: false, message: 'Template not found on Meta' });
    }

    // Check if it already exists
    let template = await Template.findOne({ metaTemplateId });
    if (template) {
      return res.status(400).json({ success: false, message: 'Template already exists in database' });
    }

    template = new Template({
      name: metaData.name,
      language: metaData.language,
      category: metaData.category,
      components: metaData.components || [],
      metaTemplateId: metaData.id,
      metaStatus: metaData.status || 'PENDING',
      imageUrl: imageUrl || '', // Save user provided imageUrl if applicable
      title: metaData.name,
      message: 'Imported Meta Template',
      status: 'draft'
    });

    await template.save();

    res.json({ success: true, template, message: 'Template imported successfully' });
  } catch (error) {
    console.error('Import Meta Template Error:', error);
    res.status(500).json({ success: false, message: error.response?.data?.error?.message || error.message || 'Failed to import template' });
  }
});

// POST /api/template/sync-meta
// Synchronize all templates directly from Meta Cloud API into the database
router.post('/sync-meta', async (req, res) => {
  try {
    const currentWaba = process.env.META_WA_BUSINESS_ACCOUNT_ID;
    const metaTemplates = await fetchAllTemplatesFromMeta();
    let syncedCount = 0;

    for (const mt of metaTemplates) {
      const existing = await Template.findOne({
        $or: [{ metaTemplateId: mt.id }, { name: mt.name }]
      });

      const bodyComp = mt.components?.find(c => c.type === 'BODY');
      const footerComp = mt.components?.find(c => c.type === 'FOOTER');
      const headerComp = mt.components?.find(c => c.type === 'HEADER');

      if (existing) {
        existing.metaTemplateId = mt.id;
        existing.metaStatus = mt.status || existing.metaStatus;
        existing.components = mt.components || existing.components;
        existing.language = mt.language || existing.language;
        existing.category = mt.category || existing.category;
        existing.wabaId = currentWaba;
        if (bodyComp?.text) existing.message = bodyComp.text;
        if (footerComp?.text) existing.footer = footerComp.text;
        await existing.save();
        syncedCount++;
      } else {
        await Template.create({
          name: mt.name,
          language: mt.language,
          category: mt.category,
          components: mt.components || [],
          metaTemplateId: mt.id,
          metaStatus: mt.status || 'APPROVED',
          wabaId: currentWaba,
          title: mt.name,
          message: bodyComp?.text || mt.name,
          footer: footerComp?.text || '',
          imageUrl: headerComp?.example?.header_handle?.[0] || '',
          status: 'draft'
        });
        syncedCount++;
      }
    }

    const filter = { isScheduled: { $ne: true } };
    if (currentWaba) {
      filter.$or = [{ wabaId: currentWaba }, { wabaId: { $exists: false } }, { wabaId: null }, { wabaId: '' }];
    }
    const all = await Template.find(filter).sort('-createdAt');
    res.json({ 
      success: true, 
      count: syncedCount, 
      templates: all, 
      currentWabaId: currentWaba, 
      message: `Successfully synced ${syncedCount} templates from Meta Account (${currentWaba})!` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.response?.data?.error?.message || error.message });
  }
});

// GET /api/template/meta/:id/status
// Check the approval status of a Meta template
router.get('/meta/:id/status', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template || !template.metaTemplateId) {
      return res.status(404).json({ success: false, message: 'Meta template not found' });
    }

    if (template.metaTemplateId.startsWith('local_')) {
      return res.status(400).json({ 
        success: false, 
        message: 'This template was saved as a local draft because initial Meta sync failed. Please recreate or edit it.' 
      });
    }
    
    const metaData = await getTemplateStatusFromMeta(template.metaTemplateId);
    
    if (metaData && metaData.status) {
      template.metaStatus = metaData.status;
      await template.save();
    }
    
    res.json({ success: true, status: template.metaStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.response?.data?.error?.message || error.message });
  }
});

// GET /api/template/stats/summary
// Fetches high level metrics and chart data based on MessageLog tracking
router.get('/stats/summary', async (req, res) => {
  try {
    const MessageLog = require('../models/MessageLog');
    
    // Global counts based on latest webhook states
    const logs = await MessageLog.find({});
    
    let sent = 0;
    let delivered = 0;
    let read = 0;
    let failed = 0;
    
    logs.forEach(log => {
      // If it reached delivered or read, it was also sent
      if (['sent', 'delivered', 'read'].includes(log.status)) sent++;
      if (['delivered', 'read'].includes(log.status)) delivered++;
      if (log.status === 'read') read++;
      if (log.status === 'failed') failed++;
    });

    const currentWaba = process.env.META_WA_BUSINESS_ACCOUNT_ID;
    const templateFilter = { metaStatus: 'APPROVED', isActive: true };
    if (currentWaba) {
      templateFilter.$or = [{ wabaId: currentWaba }, { wabaId: { $exists: false } }, { wabaId: null }, { wabaId: '' }];
    }

    const activeTemplates = await Template.countDocuments(templateFilter);
    const totalContacts = await Contact.countDocuments({ optedOut: false });
    const totalCampaigns = await Template.countDocuments({ contacts: { $not: { $size: 0 } } });

    res.json({
      success: true,
      stats: {
        sent,
        delivered,
        read,
        failed,
        activeTemplates,
        totalContacts,
        totalCampaigns,
        wabaId: currentWaba,
        phoneId: process.env.META_WA_PHONE_NUMBER_ID
      },
      chartData: logs
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

const runScheduledTemplates = async () => {
  const now = new Date();
  const due = await Template.find({ isScheduled: true, isActive: true, nextRunAt: { $lte: now }, status: { $ne: 'sending' } });

  for (const t of due) {
    console.log(`⏰ Running scheduled broadcast: ${t.title}`);
    t.status = 'sending';
    await t.save();
        runMetaBroadcast(t, t.contacts).then(async () => {
      if (t.repeatDaily) {
        const next = new Date(t.nextRunAt);
        next.setDate(next.getDate() + 1);
        await Template.findByIdAndUpdate(t._id, { nextRunAt: next, status: 'scheduled' });
      }
    });
  }
};

module.exports = router;
module.exports.runScheduledTemplates = runScheduledTemplates;