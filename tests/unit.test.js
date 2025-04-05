const { modifyHTML } = require('../app');
const { sampleHtmlWithYale } = require('./test-utils');
const cheerio = require('cheerio');

describe('Yale to Sammi replacement logic (unit tests)', () => {
  test('should replace Yale with Sammi in text content', () => {
    const modifiedHtml = modifyHTML(sampleHtmlWithYale);
    const $ = cheerio.load(modifiedHtml);
    
    // Verify that text replacements occurred.
    expect($('title').text()).toBe('Sammi University Test Page');
    expect($('h1').text()).toBe('Welcome to Sammi University');
    expect($('p').first().text()).toContain('Sammi University is a private');
    
    // Verify that URLs remain unchanged.
    expect(modifiedHtml).toContain('https://www.yale.edu/about');
    expect(modifiedHtml).toContain('https://www.yale.edu/admissions');
    expect(modifiedHtml).toMatch(/href="https:\/\/www\.yale\.edu\/about"/);
    expect(modifiedHtml).toMatch(/href="https:\/\/www\.yale\.edu\/admissions"/);
    
    // Verify that link text is replaced.
    expect(modifiedHtml).toContain('>About Sammi<');
    expect(modifiedHtml).toContain('>Sammi Admissions<');
    
    // Verify that alt attributes are unchanged.
    expect(modifiedHtml).toContain('alt="Yale Logo"');
  });
  
  test('should handle text that has no Yale references', () => {
    const htmlWithoutYale = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Page</title>
      </head>
      <body>
        <h1>Hello World</h1>
        <p>This is a test page with no Yale references.</p>
      </body>
      </html>
    `;
    const modifiedHtml = modifyHTML(htmlWithoutYale);
    
    // Since we replace "Yale" (case-insensitively) with "Sammi",
    // the phrase "no Yale references" becomes "no Sammi references".
    expect(modifiedHtml).toContain('<title>Test Page</title>');
    expect(modifiedHtml).toContain('<h1>Hello World</h1>');
    expect(modifiedHtml).toContain('<p>This is a test page with no Sammi references.</p>');
  });

  test('should handle case-insensitive replacements', () => {
    const mixedCaseHtml = `
      <p>YALE University, Yale College, and yale medical school are all part of the same institution.</p>
    `;
    const modifiedHtml = modifyHTML(mixedCaseHtml);
    // Using /Yale/gi, every occurrence (regardless of case) is replaced with "Sammi".
    // Thus, expected output:
    expect(modifiedHtml).toContain('Sammi University, Sammi College, and Sammi medical school');
  });
});