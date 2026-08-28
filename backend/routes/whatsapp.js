const express = require('express');
const router  = express.Router();
const { getStatus } = require('../utils/whatsappService');
const { ConversationFlow } = require('../utils/conversationFlow');

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
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
        let msg = body.entry[0].changes[0].value.messages[0];
        
        let from = msg.from; // Sender's phone number
        
        let msgBody = '';
        let type = 'chat';
        
        if (msg.type === 'text') {
          msgBody = msg.text.body;
        } else if (msg.type === 'interactive') {
          type = msg.interactive.type;
          if (type === 'button_reply') {
            type = 'buttons_response';
            msgBody = msg.interactive.button_reply.id;
          } else if (type === 'list_reply') {
            type = 'list_response';
            msgBody = msg.interactive.list_reply.id;
          }
        } else {
          msgBody = ''; // Unsupported message type
        }

        const normalized = {
          from,
          body: msgBody,
          type,
          isGroupMsg: false // Meta Cloud API doesn't support groups yet
        };

        if (normalized.body) {
          await ConversationFlow.handleMessage(normalized, null);
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