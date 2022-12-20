const express = require('express');
const { join } = require('path');
const { config } = require('dotenv');

const app = express();
const PORT = process.env.PORT || 5000;

// Load environment variables
config();

app.disable('x-powered-by');

// Serve static files
app.use(express.static(join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.append('Origin-Trial', process.env.ORIGIN_TRIAL_TOKEN);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  },
}));

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});