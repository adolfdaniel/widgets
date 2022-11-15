const express = require('express');
const { join } = require('path');
const { config } = require('dotenv');

const app = express();
const PORT = process.env.PORT || 5000;

// Load environment variables
config();

// Serve static files
app.use(express.static(join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.append('Origin-Trial', process.env.ORIGIN_TRIAL_TOKEN);
  },
}));

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});