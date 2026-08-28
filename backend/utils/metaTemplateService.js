const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const getMetaConfig = () => {
  const token = process.env.META_WA_ACCESS_TOKEN;
  const wabaId = process.env.META_WA_BUSINESS_ACCOUNT_ID;
  const version = process.env.META_GRAPH_VERSION || 'v19.0';
  
  if (!token || !wabaId) {
    throw new Error('Missing Meta WABA ID or Access Token in .env');
  }
  
  return {
    url: `https://graph.facebook.com/${version}/${wabaId}/message_templates`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

const createTemplateOnMeta = async (name, language, category, components) => {
  const config = getMetaConfig();
  
  const payload = {
    name,
    language,
    category,
    components
  };

  try {
    const response = await axios.post(config.url, payload, { headers: config.headers });
    return response.data; 
  } catch (error) {
    console.error('❌ [WA] Meta Template Creation Error:', error.response?.data || error.message);
    throw error;
  }
};

const getTemplateStatusFromMeta = async (templateId) => {
    const config = getMetaConfig();
    const version = process.env.META_GRAPH_VERSION || 'v19.0';
    try {
        const response = await axios.get(`https://graph.facebook.com/${version}/${templateId}`, { headers: config.headers });
        return response.data;
    } catch (error) {
        console.error('❌ [WA] Meta Template Status Error:', error.response?.data || error.message);
        throw error;
    }
}

const uploadMediaToMeta = async (filePath, mimeType, size) => {
  const token = process.env.META_WA_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_VERSION || 'v19.0';
  
  if (!token) throw new Error('Missing Meta Access Token in .env');

  try {
    // 1. Create upload session
    const sessionRes = await axios.post(`https://graph.facebook.com/${version}/app/uploads`, null, {
      params: { file_length: size, file_type: mimeType },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const sessionId = sessionRes.data.id;
    if (!sessionId) throw new Error('Failed to create upload session');

    // 2. Upload file
    const fileStream = fs.createReadStream(filePath);
    const uploadRes = await axios.post(`https://graph.facebook.com/${version}/${sessionId}`, fileStream, {
      headers: {
        Authorization: `OAuth ${token}`,
        file_offset: 0
      }
    });

    return uploadRes.data.h; // The handle
  } catch (error) {
    console.error('❌ [WA] Meta Resumable Upload Error:', error.response?.data || error.message);
    throw error;
  }
};

const uploadMediaForSending = async (filePath, mimeType) => {
  const token = process.env.META_WA_ACCESS_TOKEN;
  const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
  const version = process.env.META_GRAPH_VERSION || 'v19.0';
  
  if (!token || !phoneId) throw new Error('Missing Meta Access Token or Phone ID in .env');

  try {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('file', fs.createReadStream(filePath), { contentType: mimeType });

    const url = `https://graph.facebook.com/${version}/${phoneId}/media`;
    
    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data.id;
  } catch (error) {
    console.error('❌ [WA] Meta Media Upload Error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  createTemplateOnMeta,
  getTemplateStatusFromMeta,
  uploadMediaToMeta,
  uploadMediaForSending
};
