import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/history', authMiddleware, async (req, res) => {
  const { policy_id } = req.query;

  let q = supabase.from('chat_history')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (policy_id) q = q.eq('policy_id', policy_id);

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/history/:id', authMiddleware, async (req, res) => {
  const { error } = await supabase.from('chat_history')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);   // user can only delete their own

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
