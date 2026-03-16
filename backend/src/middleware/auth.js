import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  // Try custom JWT first (email/password login)
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    // not a custom token, try Supabase OAuth token
  }

  // Try Supabase OAuth token (Google login etc.)
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error('Invalid Supabase token');
    req.user = { id: user.id, email: user.email };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
