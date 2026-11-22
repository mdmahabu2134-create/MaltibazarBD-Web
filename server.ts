import express from 'express';
import path from 'path';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

const app = express();

// Serve the zero-build static Netlify site from /public on port 3000 for local preview
app.use(express.static(PUBLIC_DIR));

app.get('*', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Maltibazar BD static preview (public/) running at http://localhost:${PORT}`);
});
