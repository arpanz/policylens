import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function checkPython() {
  const url = process.env.PYTHON_API_URL || 'http://localhost:8000';
  console.log(`Checking Python at ${url}...`);
  try {
    const r = await axios.get(url, { timeout: 3000 });
    console.log(`Success: ${r.status} ${JSON.stringify(r.data)}`);
  } catch (err) {
    console.error(`Localhost Failure: ${err.message}`);
    
    console.log(`Trying 127.0.0.1...`);
    try {
      const r2 = await axios.get('http://127.0.0.1:8000/', { timeout: 3000 });
      console.log(`127.0.0.1 Success: ${r2.status}`);
    } catch (err2) {
      console.error(`127.0.0.1 Failure: ${err2.message}`);
    }
  }
}

checkPython();
