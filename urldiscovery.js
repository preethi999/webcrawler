const axios = require('axios');
const cheerio = require('cheerio');

// Define the patterns for product URLs
const PRODUCT_PATTERNS = [
    /\/product\//,  // Common product pattern
    /\/item\//,     // Common item pattern
    /\/p\//,        // Short product pattern
    /product-/,     // Can match patterns like product-12345
    /item-/,        // Can match patterns like item-12345
];

function isProductUrl(url) {
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

async function discoverProductUrls(url) {
    /**
     * Extracts product URLs from a given page.
     * @param {string} url - The URL of the page to scrape.
     * @returns {Array} - An array of product URLs.
     */
    try {
        // Fetch the HTML content of the page
        const { data } = await axios.get(url);
        
        // Load the HTML into cheerio
        const $ = cheerio.load(data);
        
        // Array to store the product URLs
        const productUrls = [];

        // Loop through all <a> tags to find links
        $('a').each((index, element) => {
            const link = $(element).attr('href');
            if (link && isProductUrl(link)) {
                // Handle relative URLs (assuming the base URL is the current URL's domain)
                const absoluteUrl = new URL(link, url).href;
                productUrls.push(absoluteUrl);
            }
        });

        return productUrls;

    } catch (error) {
        console.error('Error scraping the page:', error);
        return [];
    }
}

// Example usage
(async () => {
    const baseUrl = 'https://example.com'; // Example base URL
    const productUrls = await discoverProductUrls(baseUrl);

    console.log('Product URLs found:', productUrls);
})();
