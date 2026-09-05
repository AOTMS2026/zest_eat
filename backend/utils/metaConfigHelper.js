const axios = require('axios');
const MetaConfig = require('../models/MetaConfig');

let cachedConfig = null;

const getMetaCredentials = async () => {
  if (cachedConfig) return cachedConfig;

  try {
    const dbConfig = await MetaConfig.findOne().sort({ updatedAt: -1 });
    if (dbConfig && dbConfig.accessToken && dbConfig.wabaId && dbConfig.phoneId) {
      cachedConfig = {
        token: dbConfig.accessToken,
        wabaId: dbConfig.wabaId,
        phoneId: dbConfig.phoneId,
        verifyToken: dbConfig.verifyToken || process.env.META_WA_VERIFY_TOKEN || 'zest_eat_meta_verify_8f9q2a',
        version: dbConfig.graphVersion || process.env.META_GRAPH_VERSION || 'v19.0'
      };
      return cachedConfig;
    }
  } catch (err) {
    console.error('⚠️ Failed to load MetaConfig from MongoDB:', err.message);
  }

  // Fallback to process.env
  cachedConfig = {
    token: process.env.META_WA_ACCESS_TOKEN || '',
    wabaId: process.env.META_WA_BUSINESS_ACCOUNT_ID || '',
    phoneId: process.env.META_WA_PHONE_NUMBER_ID || '',
    verifyToken: process.env.META_WA_VERIFY_TOKEN || 'zest_eat_meta_verify_8f9q2a',
    version: process.env.META_GRAPH_VERSION || 'v19.0'
  };

  return cachedConfig;
};

const updateMetaCredentials = async ({ wabaId, phoneId, accessToken, verifyToken, graphVersion }) => {
  const version = graphVersion || 'v19.0';
  const token = accessToken;
  
  // Verify with Meta Graph API before saving
  const testRes = await verifyMetaConnection({ wabaId, phoneId, token, version });
  if (!testRes.reachable) {
    throw new Error(`Meta validation failed: ${testRes.error}`);
  }

  const updated = await MetaConfig.findOneAndUpdate(
    {},
    {
      $set: {
        wabaId: wabaId.trim(),
        phoneId: phoneId.trim(),
        accessToken: token.trim(),
        verifyToken: (verifyToken || 'zest_eat_meta_verify_8f9q2a').trim(),
        graphVersion: version.trim(),
        updatedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );

  cachedConfig = {
    token: updated.accessToken,
    wabaId: updated.wabaId,
    phoneId: updated.phoneId,
    verifyToken: updated.verifyToken,
    version: updated.graphVersion
  };

  return { success: true, config: cachedConfig, metaInfo: testRes };
};

const verifyMetaConnection = async (credentials) => {
  const token = credentials?.token || process.env.META_WA_ACCESS_TOKEN;
  const wabaId = credentials?.wabaId || process.env.META_WA_BUSINESS_ACCOUNT_ID;
  const version = credentials?.version || process.env.META_GRAPH_VERSION || 'v19.0';

  if (!token || !wabaId) {
    return { reachable: false, error: 'Missing Meta Access Token or WABA Account ID' };
  }

  try {
    const res = await axios.get(`https://graph.facebook.com/${version}/${wabaId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { fields: 'id,name,currency,timezone_id' },
      timeout: 10000
    });

    return {
      reachable: true,
      wabaId: res.data?.id || wabaId,
      name: res.data?.name || 'Meta Business Account',
      data: res.data
    };
  } catch (err) {
    const metaErr = err.response?.data?.error;
    const msg = metaErr?.message || err.message || 'Unable to connect to Meta Graph API';
    return { reachable: false, error: msg, code: metaErr?.code };
  }
};

const clearConfigCache = () => {
  cachedConfig = null;
};

module.exports = {
  getMetaCredentials,
  updateMetaCredentials,
  verifyMetaConnection,
  clearConfigCache
};
