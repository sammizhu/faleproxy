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

// Helper function that performs the Yale-to-Sammi replacement on HTML.
// It uses a case-insensitive regex (/Yale/gi) so that all occurrences (regardless of case)
// are replaced with "Sammi".
function modifyHTML(html) {
  const $ = cheerio.load(html);
  
  // Process text nodes in the body
  $('body *').contents().filter(function() {
    return this.nodeType === 3; // Text nodes only
  }).each(function() {
    const text = $(this).text();
    const newText = text.replace(/Yale/gi, 'Sammi');
    if (text !== newText) {
      $(this).replaceWith(newText);
    }
  });
  
  // Process title separately
  const title = $('title').text().replace(/Yale/gi, 'Sammi');
  $('title').text(title);
  
  return $.html();
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

    // Fetch the content from the provided URL
    const response = await axios.get(url);
    const html = response.data;
    
    // Modify the HTML using our helper function.
    const modified = modifyHTML(html);
    const $ = cheerio.load(modified);
    const title = $('title').text();
    
    return res.json({ 
      success: true, 
      content: modified,
      title: title,
      originalUrl: url
    });
  } catch (error) {
    console.error('Error fetching URL:', error.message);
    return res.status(500).json({ 
      error: `Failed to fetch content: ${error.message}` 
    });
  }
});

// Only start the server if this file is run directly.
if (require.main === module) {
  app.listen(PORT, () => {
    // Suppress console logging when running under Jest to avoid circular structure issues.
    if (!process.env.JEST_WORKER_ID) {
      console.log(`Sammiproxy server running at http://localhost:${PORT}`);
    }
  });
}

// Export the helper function and the app for testing purposes.
module.exports = { app, modifyHTML };