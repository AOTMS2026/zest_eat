const express = require('express');
const router  = express.Router();
const { getStatus } = require('../utils/whatsappService');
const MessageLog = require('../models/MessageLog');

// ── GET current status ────────────────────────────────────────────────────────
router.get('/status', (req, res) => {
  res.json({ status: getStatus(), qr: null });
});

// ── Connect / Disconnect (No-ops for Meta API) ────────────────────────────────
router.post('/connect', (req, res) => {
  res.json({ success: true, message: 'Meta API uses static tokens. No connection required.' });
});

router.post('/disconnect', (req, res) => {
  res.json({ success: true, message: 'Meta API uses static tokens. No disconnection possible.' });
});

router.get('/host-info', (req, res) => {
  res.json({ success: true, phone: process.env.META_WA_PHONE_NUMBER_ID, name: 'Meta WhatsApp App', id: process.env.META_WA_PHONE_NUMBER_ID });
});

router.get('/config', (req, res) => {
  const phoneId = process.env.META_WA_PHONE_NUMBER_ID || '';
  const maskedPhone = phoneId.length > 4 ? `**********${phoneId.slice(-4)}` : phoneId;
  res.json({
    success: true,
    wabaId: process.env.META_WA_BUSINESS_ACCOUNT_ID || 'Not configured',
    phoneId: maskedPhone || 'Not configured',
    version: process.env.META_GRAPH_VERSION || 'v19.0'
  });
});

// ── Webhooks ──────────────────────────────────────────────────────────────────

// Webhook Verification (Required by Meta)
router.get('/webhook', (req, res) => {
  const verify_token = process.env.META_WA_VERIFY_TOKEN;

  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verify_token) {
      console.log('✅ WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Receive incoming messages
router.post('/webhook', async (req, res) => {
  try {
    let body = req.body;

    if (body.object) {
      // 1. Acknowledge incoming messages silently so Meta doesn't retry
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        // We only acknowledge the payload, we do not auto-reply or process chat messages
        // console.log("Received incoming message (Ignored as per one-way broadcasting logic)");
      }
      
      // 2. Process delivery statuses (sent/delivered/read/failed)
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.statuses &&
        body.entry[0].changes[0].value.statuses[0]
      ) {
        let statusObj = body.entry[0].changes[0].value.statuses[0];
        
        let wamid = statusObj.id;
        let phone = statusObj.recipient_id;
        let status = statusObj.status;
        let timestamp = new Date(parseInt(statusObj.timestamp) * 1000);
        let errorCode = null;
        let errorMessage = null;
        let pricing = statusObj.pricing || null;
        
        if (status === 'failed' && statusObj.errors && statusObj.errors.length > 0) {
          errorCode = statusObj.errors[0].code;
          errorMessage = statusObj.errors[0].title || statusObj.errors[0].message || 'Unknown error';
        }
        
        console.log(`\n📊 [WEBHOOK STATUS] ${phone} | ${status.toUpperCase()} | wamid: ${wamid}`);
        if (errorCode) console.error(`❌ Meta Error: [${errorCode}] ${errorMessage}`);
        
        const incomingPhoneId = body.entry[0].changes[0].value.metadata?.phone_number_id || process.env.META_WA_PHONE_NUMBER_ID;
        const incomingWabaId = body.entry[0].id || process.env.META_WA_BUSINESS_ACCOUNT_ID;

        try {
          await MessageLog.findOneAndUpdate(
            { wamid },
            { 
              $set: {
                wamid,
                phone,
                status,
                timestamp,
                errorCode,
                errorMessage,
                pricing,
                phoneId: incomingPhoneId,
                wabaId: incomingWabaId
              }
            },
            { upsert: true, new: true }
          );
        } catch (dbErr) {
          console.error('Failed to save status to MessageLog:', dbErr);
        }
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.sendStatus(500);
  }
});

module.exports = router;