const axios = require('axios');
const cheerio = require('cheerio');
const { createApp, modifyHTML } = require('../app');
const { sampleHtmlWithYale } = require('./test-utils');
const nock = require('nock');

// Set a different port for testing to avoid conflict with the main app
const TEST_PORT = 5000;
let server;

beforeAll((done) => {
  // Allow connections only to 127.0.0.1 for tests.
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
  const app = createApp();
  server = app.listen(TEST_PORT, '127.0.0.1', done);
});

afterAll((done) => {
  server.close(done);
  nock.cleanAll();
  nock.enableNetConnect();
});

describe('Integration Tests', () => {
  test('Should replace Yale with Sammi in fetched content', async () => {
    // Setup mock for example.com
    nock('https://example.com')
      .get('/')
      .reply(200, sampleHtmlWithYale);
    
    // Use 127.0.0.1 for the API call
    const response = await axios.post(`http://127.0.0.1:${TEST_PORT}/fetch`, {
      url: 'https://example.com/'
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    const $ = cheerio.load(response.data.content);
    expect($('title').text()).toBe('Sammi University Test Page');
    expect($('h1').text()).toBe('Welcome to Sammi University');
    expect($('p').first().text()).toContain('Sammi University is a private');
    
    // Verify that URLs remain unchanged.
    const links = $('a');
    let hasYaleUrl = false;
    links.each((i, link) => {
      const href = $(link).attr('href');
      if (href && href.includes('yale.edu')) {
        hasYaleUrl = true;
      }
    });
    expect(hasYaleUrl).toBe(true);
    
    // Verify that link text is replaced.
    expect($('a').first().text()).toBe('About Sammi');
  }, 10000);

  test('Should handle invalid URLs', async () => {
    try {
      await axios.post(`http://127.0.0.1:${TEST_PORT}/fetch`, {
        url: 'not-a-valid-url'
      });
      // Should not reach here.
      expect(true).toBe(false);
    } catch (error) {
      if (error.response) {
        expect(error.response.status).toBe(500);
      } else {
        expect(error.message).toMatch(/Failed to fetch content/i);
      }
    }
  });

  test('Should handle missing URL parameter', async () => {
    try {
      await axios.post(`http://127.0.0.1:${TEST_PORT}/fetch`, {});
      expect(true).toBe(false);
    } catch (error) {
      if (error.response) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBe('URL is required');
      } else {
        throw error;
      }
    }
  });
});