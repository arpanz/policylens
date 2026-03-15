import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;

  const { data: existing } = await supabase
    .from('users').select('id').eq('email', email).single();
  if (existing) return res.status(400).json({ error: 'Email already exists' });

  const password_hash = await bcrypt.hash(password, 10);
  const { data: user, error } = await supabase
    .from('users').insert({ email, password_hash, name }).select().single();
  if (error) return res.status(500).json({ error: error.message });

  const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email, name } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data: user } = await supabase
    .from('users').select('*').eq('email', email).single();
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email, name: user.name } });
});

export default router;
