// Simulate Vercel's runtime environment
const app = require('./app');

// Set VERCEL environment variable to simulate Vercel
process.env.VERCEL = 'true';

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});