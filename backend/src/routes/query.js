import express from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/query', async (req, res) => {
  const { question, policy_id, k = 8 } = req.body;
  console.log(`[query] Received question for policy ${policy_id}: ${question}`);

  try {
    const { data } = await axios.post(`${process.env.PYTHON_API_URL}/query/`, {
      question, policy_id, k
    });

    await supabase.from('chat_history').insert({
      user_id: req.user?.id || 'anonymous',
      policy_id,
      question,
      answer: data.answer,
      sources: data.sources,
      source_count: data.source_count
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// export default router (moved to bottom)

router.post('/query/stream', async (req, res) => {
  const { question, policy_id, k = 8 } = req.body;
  console.log(`[query/stream] Received question for policy ${policy_id}: ${question}`);

  try {
    const response = await axios.post(`${process.env.PYTHON_API_URL}/query/stream`, {
      question, policy_id, k
    }, { responseType: 'stream' });

    res.setHeader('Content-Type', 'text/plain');
    
    let fullAnswer = "";
    response.data.on('data', (chunk) => {
      fullAnswer += chunk.toString();
      res.write(chunk);
    });

    response.data.on('end', async () => {
      // Save to chat_history at the end
      try {
        await supabase.from('chat_history').insert({
          user_id: req.user?.id || 'anonymous',
          policy_id,
          question,
          answer: fullAnswer
        });
      } catch (dbErr) {
        console.error('[query/stream] DB Save Error:', dbErr.message);
      }
      res.end();
    });

  } catch (err) {
    console.error('[query/stream] Proxy Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
export default router;
