const Contact      = require('../models/Contact');
const Template     = require('../models/Template');
const { sendMetaTemplate } = require('./whatsappService');
const { uploadMediaForSending } = require('./metaTemplateService');
const path = require('path');
const mime = require('mime-types');
const fs = require('fs');

const digits = (phone) => String(phone).replace(/\D/g, '');

const toSendPhone = (phone) => {
  const d = digits(phone);
  if (d.length === 10) return d;
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  return d.slice(-10);
};

const toDbPhone = (phone) => toSendPhone(phone);

// ── Meta Template start ───────────────────────────────────────────────────────
const startMetaTemplate = async (phone, template) => {
  const sp = toSendPhone(phone);

  const contact = await Contact.findOne({ phone: sp });
  if (contact?.optedOut) { console.log(`⛔ Skipping opted-out: ${sp}`); return; }

  const name  = contact?.name  || 'Customer';
  
  // Construct components for Meta API
  const components = [];

  // Check if template has an Image/Video/Document header
  const headerComponent = template.components?.find(c => c.type === 'HEADER' && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(c.format));
  
  if (headerComponent) {
    let mediaId = template.mediaId;
    
    // If it doesn't have a mediaId but has an imageUrl (from before we added this feature), upload it retroactively
    if (!mediaId && template.imageUrl) {
        let localPath = template.imageUrl;
        if (localPath.startsWith('/uploads/')) {
           localPath = localPath.replace('/uploads/', '/uploads/campaigns/');
           const absolutePath = path.join(__dirname, '..', localPath);
           if (fs.existsSync(absolutePath)) {
               try {
                   console.log(`Uploading local image to Meta to get Media ID...`);
                   mediaId = await uploadMediaForSending(absolutePath, mime.lookup(absolutePath) || 'image/jpeg');
                   // Save back to DB so we don't have to upload it again!
                   await Template.findByIdAndUpdate(template._id, { mediaId });
               } catch(e) {
                   console.error('Failed to fallback upload:', e.message);
               }
           }
        }
    }
    
    // If we STILL don't have a mediaId (e.g., completely old template without imageUrl)
    if (!mediaId) {
      console.log(`⚠️ Template '${template.name}' requires a media header but mediaId is missing.`);
    }

    if (mediaId) {
      components.push({
        type: 'header',
        parameters: [
          {
            type: headerComponent.format.toLowerCase(),
            [headerComponent.format.toLowerCase()]: {
              id: mediaId
            }
          }
        ]
      });
    }
  }

  // Check if template body has variables ({{1}})
  const bodyComponent = template.components?.find(c => c.type === 'BODY');
  if (bodyComponent && bodyComponent.text && bodyComponent.text.includes('{{1}}')) {
    components.push({
      type: 'body',
      parameters: [
        { type: 'text', text: name }
      ]
    });
  }

  try {
    await sendMetaTemplate(sp, template.name, template.language, components);
  } catch (e) {
    console.log(`❌ Failed to send Meta Template to ${sp}:`, e.message);
    throw e;
  }
};

module.exports = {
  ConversationFlow: { startMetaTemplate }
};