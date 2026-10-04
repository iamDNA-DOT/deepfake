import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock analysis function
const mockAnalysis = (filename: string, mimetype: string) => {
  const isSuspicious = Math.random() > 0.5;
  const score = isSuspicious ? (Math.random() * 0.4 + 0.6) : (Math.random() * 0.3 + 0.1);
  const prediction = isSuspicious ? (score > 0.85 ? 'DEEPFAKE' : 'AI-GENERATED') : 'REAL';
  
  let explanation = '';
  if (mimetype.startsWith('image/')) {
    explanation = isSuspicious 
      ? 'Detected inconsistent lighting on subject face, blending artifacts near hairline, and mismatched noise patterns in background regions.'
      : 'No spatial or frequency artifacts detected. Lighting physics are consistent across the scene.';
  } else if (mimetype.startsWith('video/')) {
    explanation = isSuspicious
      ? 'Temporal anomalies detected across frames. Unnatural eye blinking rate, micro-expression stuttering, and mismatched audio-visual sync by 15ms.'
      : 'Natural frame-to-frame coherence. No deepfake manipulation detected in keyframes.';
  } else if (mimetype.startsWith('audio/')) {
    explanation = isSuspicious
      ? 'Spectral analysis indicates unnatural phase discontinuities and synthetic vocal tract resonance in the 2kHz-4kHz range.'
      : 'Acoustic environment consistent. No vocoder or synthetic generation artifacts detected.';
  } else {
    explanation = 'Format not standard for deepfake analysis. Preliminary checks show no obvious manipulation.';
  }

  return {
    filename,
    mimetype,
    prediction,
    confidence: (score * 100).toFixed(1) + '%',
    explanation,
    suspiciousRegions: isSuspicious && mimetype.startsWith('image/') 
      ? ['Face (eyes, mouth)', 'Background edges'] 
      : [],
    analysisDetails: mimetype.startsWith('video/') 
      ? ['Frame rate: 30fps', 'Temporal Consistency: ' + (isSuspicious ? 'Low' : 'High'), 'Audio-Visual Sync: ' + (isSuspicious ? 'Anomalous' : 'Normal')]
      : mimetype.startsWith('audio/')
      ? ['Sample rate: 44.1kHz', 'Spectral Entropy: ' + (isSuspicious ? 'Abnormal' : 'Normal')]
      : [],
  };
};

async function createServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Multer config (memory storage for simple mocked backend)
  const upload = multer({ storage: multer.memoryStorage() });

  // API Route for analysis
  app.post('/api/analyze', upload.single('media'), (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      // Simulate processing time
      setTimeout(() => {
        const result = mockAnalysis(file.originalname, file.mimetype);
        // We do not save or serve the actual file in this mock, we just return the result
        res.json(result);
      }, 1500);

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error during analysis.' });
    }
  });

  // Setup Vite for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, '..', 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();
