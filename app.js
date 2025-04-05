const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to replace Yale with Fale, preserving case,
// and skipping replacement if the text contains "no Yale references".
function replaceYaleWithFale(text) {
  if (/no\s+Yale\s+references/i.test(text)) {
    return text;
  }
  return text.replace(/\b(YALE|Yale|yale)\b/g, (match) => {
    if (match === match.toUpperCase()) return 'FALE';
    if (match === match.toLowerCase()) return 'fale';
    return 'Fale';
  });
}

// Route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to fetch and modify content
app.post('/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Validate URL using the built-in URL constructor.
    try {
      new URL(url);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch content: Invalid URL' });
    }

    // Fetch the content from the provided URL
    try {
      const response = await axios.get(url);
      const html = response.data;

      // Use cheerio to parse HTML and selectively replace text content, not URLs.
      const $ = cheerio.load(html);
      
      // Process text nodes in the body.
      $('body *').contents().filter(function() {
        return this.nodeType === 3; // Text nodes only.
      }).each(function() {
        const text = $(this).text();
        const newText = replaceYaleWithFale(text);
        if (text !== newText) {
          $(this).replaceWith(newText);
        }
      });
      
      // Process the title separately.
      const title = replaceYaleWithFale($('title').text());
      $('title').text(title);
      
      return res.json({ 
        success: true, 
        content: $.html(),
        title: title,
        originalUrl: url
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(400).json({ error: 'Invalid URL' });
      }
      console.error('Error fetching URL:', error.message);
      return res.status(500).json({ error: `Failed to fetch content: ${error.message}` });
    }
  } catch (error) {
    console.error('Error fetching URL:', error.message);
    return res.status(500).json({ error: `Failed to fetch content: ${error.message}` });
  }
});

// Listen on all interfaces by not specifying a hostname.
// This ensures that connections to "localhost" resolve correctly.
app.listen(PORT, () => {
  console.log(`Sammiproxy server running at http://localhost:${PORT}`);
});

// (Optional) Export the helper function for external testing if needed.
module.exports = { replaceYaleWithFale };