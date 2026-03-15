import express from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/query', authMiddleware, async (req, res) => {
  const { question, policy_id, k = 8 } = req.body;

  try {
    const { data } = await axios.post(`${process.env.PYTHON_API_URL}/query/`, {
      question, policy_id, k
    });

    await supabase.from('chat_history').insert({
      user_id: req.user.id,
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

export default router;
