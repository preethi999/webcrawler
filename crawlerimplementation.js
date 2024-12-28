const axios = require('axios');
const cheerio = require('cheerio');
const pLimit = require('p-limit');

// Define the patterns for product URLs
const PRODUCT_PATTERNS = [
    /\/product\//,  // Common product pattern
    /\/item\//,     // Common item pattern
    /\/p\//,        // Short product pattern
    /product-/,     // Can match patterns like product-12345
    /item-/,        // Can match patterns like item-12345
];

// Limit the number of concurrent requests to avoid overloading the server
const limit = pLimit(5); // Limit to 5 concurrent requests

async function isProductUrl(url) {
    /**
     * Checks if a URL matches any of the common product patterns.
     * @param {string} url - The URL to check.
     * @returns {boolean} - Returns true if the URL matches a product pattern.
     */
    for (let pattern of PRODUCT_PATTERNS) {
        if (pattern.test(url)) {
            return true;
        }
    }
    return false;
}

async function fetchPage(url) {
    /**
     * Fetches the HTML content of a page.
     * @param {string} url - The URL of the page.
     * @returns {string} - The HTML content of the page.
     */
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching page: ${url}`, error.message);
        return null;
    }
}

async function discoverProductUrls(htmlContent, baseUrl) {
    /**
     * Extracts product URLs from a given HTML content.
     * @param {string} htmlContent - The HTML content of the page.
     * @param {string} baseUrl - The base URL of the website (used to form absolute URLs).
     * @returns {Array} - List of product URLs.
     */
    const productUrls = [];
    const $ = cheerio.load(htmlContent);

    // Find all <a> tags with href attributes
    $('a').each((index, element) => {
        const url = $(element).attr('href');
        if (url && isProductUrl(url)) {
            // Handle relative URLs (make them absolute using the base URL)
            const absoluteUrl = new URL(url, baseUrl).href;
            productUrls.push(absoluteUrl);
        }
    });

    return productUrls;
}

async function crawlPage(url, baseUrl, visitedUrls = new Set()) {
    /**
     * Crawls a page, extracts product URLs, and returns the list of unique URLs.
     * Handles parallel requests by recursively calling the function.
     * @param {string} url - The URL to crawl.
     * @param {string} baseUrl - The base URL to resolve relative URLs.
     * @param {Set} visitedUrls - Set to track visited URLs and avoid duplicates.
     * @returns {Array} - List of product URLs discovered on the page.
     */
    if (visitedUrls.has(url)) {
        return []; // Skip already visited URLs
    }

    visitedUrls.add(url);

    const htmlContent = await fetchPage(url);
    if (!htmlContent) return []; // If there's an error fetching the page, return an empty array.

    const productUrls = await discoverProductUrls(htmlContent, baseUrl);

    // Extract more internal links to crawl
    const $ = cheerio.load(htmlContent);
    const internalLinks = [];
    $('a').each((index, element) => {
        const link = $(element).attr('href');
        if (link && link.startsWith('/') && !visitedUrls.has(link)) {
            internalLinks.push(new URL(link, baseUrl).href); // Convert relative links to absolute URLs
        }
    });

    // Crawl the internal links in parallel (limit concurrent crawls)
    const nextUrls = await Promise.all(internalLinks.map(link => limit(() => crawlPage(link, baseUrl, visitedUrls))));

    // Combine results
    return [...productUrls, ...nextUrls.flat()];
}

// Example usage
(async () => {
    const baseUrl = 'https://example.com'; // Base URL of the website
    const startUrl = `${baseUrl}/products`; // The starting point for crawling
    
    // Set to track visited URLs
    const visitedUrls = new Set();
    
    // Start crawling from the base URL
    const productUrls = await crawlPage(startUrl, baseUrl, visitedUrls);
    
    console.log('Discovered product URLs:', productUrls);
})();
