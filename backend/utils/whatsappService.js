const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Get Meta config from env
const getMetaConfig = () => {
  const token = process.env.META_WA_ACCESS_TOKEN;
  const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
  const version = process.env.META_GRAPH_VERSION || 'v19.0';
  
  if (!token || !phoneId) {
    console.warn('⚠️ [WA] Meta API credentials missing in .env');
  }
  
  return {
    url: `https://graph.facebook.com/${version}/${phoneId}/messages`,
    mediaUrl: `https://graph.facebook.com/${version}/${phoneId}/media`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

const getStatus = () => {
  const token = process.env.META_WA_ACCESS_TOKEN;
  const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
  if (token && phoneId) return 'CONNECTED';
  return 'DISCONNECTED';
};

// Format phone for Meta API (just the number without @s.whatsapp.net, must include country code)
const formatPhone = (phone) => {
  let c = String(phone).replace(/\D/g, '');
  if (c.startsWith('0')) c = '91' + c.slice(1);
  if (!c.startsWith('91') && c.length === 10) c = '91' + c;
  return c;
};

// No longer applicable but kept for compatibility
const isSelfSend = () => false;

const sendRequest = async (payload) => {
  const config = getMetaConfig();
  if (!config.url || !config.headers.Authorization.includes('Bearer ')) {
    throw new Error('Meta API credentials missing');
  }
  
  try {
    const response = await axios.post(config.url, payload, { headers: config.headers });
    return response.data;
  } catch (error) {
    console.error('❌ [WA] Meta API Error:', error.response?.data || error.message);
    throw error;
  }
};

const sendTextMessage = async (phone, text) => {
  const to = formatPhone(phone);
  console.log(`📤 [WA] Sending text to ${to}: "${text.replace(/\n/g, ' ').slice(0, 40)}..."`);
  
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text }
  };
  
  return await sendRequest(payload);
};

const sendImageMessage = async (phone, imagePath, caption = '') => {
  const to = formatPhone(phone);
  console.log(`📤 [WA] Sending image to ${to}: "${caption.slice(0, 30)}"`);
  
  let mediaObj = {};
  
  // If it's a URL, we can send it directly
  if (typeof imagePath === 'string' && imagePath.startsWith('http')) {
    mediaObj = { link: imagePath };
  } else {
    // If it's a local file, we need to upload it to Meta first to get a media ID
    // (This requires a separate upload step in Meta API)
    const config = getMetaConfig();
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    formData.append('messaging_product', 'whatsapp');
    
    try {
      const uploadRes = await axios.post(config.mediaUrl, formData, {
        headers: {
          ...config.headers,
          ...formData.getHeaders(),
        }
      });
      mediaObj = { id: uploadRes.data.id };
    } catch (err) {
      console.error('❌ [WA] Media upload failed:', err.response?.data || err.message);
      throw err;
    }
  }

  if (caption) {
    mediaObj.caption = caption;
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'image',
    image: mediaObj
  };
  
  return await sendRequest(payload);
};

// Note: Meta Cloud API Interactive Buttons require templates if outside 24h window
// This is for inside 24h window (Free-form interactive messages)
const sendButtons = async (phone, text, buttons, title = '', footer = '') => {
  const to = formatPhone(phone);
  
  const formattedButtons = buttons.slice(0, 3).map((btn, index) => ({
    type: 'reply',
    reply: {
      id: btn.buttonId || `btn_${index}`,
      title: (btn.buttonText?.displayText || btn.id || 'Button').slice(0, 20)
    }
  }));

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text },
      action: { buttons: formattedButtons }
    }
  };

  if (title) payload.interactive.header = { type: 'text', text: title };
  if (footer) payload.interactive.footer = { text: footer };

  return await sendRequest(payload);
};

const sendPoll = async (phone, name, choices) => {
  // Meta Cloud doesn't support interactive polls natively through the generic API in the same way.
  // Converting it to a list/button fallback or standard text.
  // We'll fall back to sending a text message with options.
  const to = formatPhone(phone);
  const optionsText = choices.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const fullText = `*${name}*\n\n${optionsText}\n\n_Please reply with the option number._`;
  
  return await sendTextMessage(phone, fullText);
};

const sendListMenu = async (phone, options) => {
  const to = formatPhone(phone);
  
  const sections = (options.sections || []).map(sec => ({
    title: sec.title || 'Options',
    rows: (sec.rows || []).slice(0, 10).map(r => ({
      id: r.rowId || r.title,
      title: r.title.slice(0, 24),
      description: r.description ? r.description.slice(0, 72) : ''
    }))
  }));

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: options.title || 'Menu' },
      body: { text: options.description || 'Please select an option' },
      footer: { text: options.footer || '' },
      action: {
        button: (options.buttonText || 'View Menu').slice(0, 20),
        sections
      }
    }
  };

  return await sendRequest(payload);
};

module.exports = {
  getStatus,
  sendTextMessage,
  sendImageMessage,
  sendButtons,
  sendPoll,
  sendListMenu,
  formatPhone,
  isSelfSend,
};