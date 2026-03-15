import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // keep file in memory

// --------------------------------------------------------
// POST /api/ingest/upload
// Frontend sends: file (PDF), policy_name (optional label)
// --------------------------------------------------------
router.post('/ingest/upload', authMiddleware, upload.single('file'), async (req, res) => {
  const user_id = req.user.id;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  if (!file.originalname.endsWith('.pdf')) return res.status(400).json({ error: 'Only PDFs accepted' });

  // 1. Generate a unique policy_id scoped to the user
  const policy_id = `${user_id}_${uuidv4()}`;
  const storage_path = `${user_id}/${policy_id}.pdf`;

  try {
    // 2. Upload PDF to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('policy-pdfs')
      .upload(storage_path, file.buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (storageError) return res.status(500).json({ error: storageError.message });

    // 3. Get a signed URL (valid 1 year) for the stored PDF
    const { data: signedData } = await supabase.storage
      .from('policy-pdfs')
      .createSignedUrl(storage_path, 60 * 60 * 24 * 365);

    const storage_url = signedData.signedUrl;

    // 4. Save policy metadata to policies table
    await supabase.from('policies').insert({
      user_id,
      policy_id,
      filename: file.originalname,
      storage_path,
      storage_url,
      status: 'processing',
    });

    // 5. Forward PDF to Python as multipart
    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: 'application/pdf',
    });
    form.append('policy_id', policy_id);
    form.append('overwrite', 'false');

    // fire and forget — Python runs ingestion in background
    axios.post(`${process.env.PYTHON_API_URL}/ingest/upload`, form, {
      headers: form.getHeaders(),
    }).catch(err => console.error('Python ingest error:', err.message));

    // 6. Return immediately
    res.json({
      status: 'processing',
      policy_id,
      filename: file.originalname,
      storage_url,
      message: `Poll /api/ingest/status/${policy_id} to check when ready`,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------
// GET /api/ingest/status/:policy_id
// Polls Python, updates policies table when ready
// --------------------------------------------------------
router.get('/ingest/status/:policy_id', authMiddleware, async (req, res) => {
  const { policy_id } = req.params;

  try {
    // Ask Python for status
    const { data } = await axios.get(
      `${process.env.PYTHON_API_URL}/ingest/status/${policy_id}`
    );

    // If ready, update the policies table
    if (data.status === 'ready') {
      await supabase.from('policies')
        .update({ status: 'ready', chunk_count: data.chunk_count })
        .eq('policy_id', policy_id)
        .eq('user_id', req.user.id);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------
// GET /api/policies
// List all policies uploaded by the logged-in user
// --------------------------------------------------------
router.get('/policies', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('policies')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --------------------------------------------------------
// DELETE /api/policies/:policy_id
// Delete PDF from storage + policies table
// --------------------------------------------------------
router.delete('/policies/:policy_id', authMiddleware, async (req, res) => {
  const { policy_id } = req.params;
  const user_id = req.user.id;

  // Get storage path first
  const { data: policy } = await supabase
    .from('policies')
    .select('storage_path')
    .eq('policy_id', policy_id)
    .eq('user_id', user_id)
    .single();

  if (!policy) return res.status(404).json({ error: 'Policy not found' });

  // Delete from Supabase Storage
  await supabase.storage.from('policy-pdfs').remove([policy.storage_path]);

  // Delete from policies table
  await supabase.from('policies').delete()
    .eq('policy_id', policy_id)
    .eq('user_id', user_id);

  res.json({ success: true });
});

// GET /api/policies/:policy_id/summary
// Fetch the AI-generated summary for a policy
router.get('/policies/:policy_id/summary', authMiddleware, async (req, res) => {
  const { policy_id } = req.params;

  // verify this policy belongs to the requesting user
  const { data: policy } = await supabase
    .from('policies')
    .select('policy_id')
    .eq('policy_id', policy_id)
    .eq('user_id', req.user.id)
    .single();

  if (!policy) return res.status(404).json({ error: 'Policy not found' });

  // fetch summary from policy_summaries table
  const { data, error } = await supabase
    .from('policy_summaries')
    .select('policy_id, summary, created_at')
    .eq('policy_id', policy_id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Summary not yet generated' });
  res.json(data);
});


export default router;
