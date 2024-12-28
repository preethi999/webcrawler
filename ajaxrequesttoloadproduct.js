const puppeteer = require('puppeteer');

async function scrapeAJAXProducts(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setRequestInterception(true);

    // Intercept AJAX requests and capture relevant data
    page.on('request', (request) => {
        if (request.url().includes('ajax-endpoint') && request.method() === 'GET') {
            console.log('Intercepted AJAX request:', request.url());
            request.continue();
        } else {
            request.continue();
        }
    });

    await page.goto(url, { waitUntil: 'networkidle0' });

    // Extract product URLs after AJAX content is loaded
    const productUrls = await page.evaluate(() => {
        const links = [];
        const elements = document.querySelectorAll('a');
        elements.forEach(element => {
            const href = element.getAttribute('href');
            if (href && (href.includes('/product/') || href.includes('/item/') || href.includes('/p/'))) {
                links.push(href);
            }
        });
        return links;
    });

    await browser.close();

    return productUrls;
}

// Example usage
(async () => {
    const baseUrl = 'https://example.com';  // The page using AJAX to load products
    const productUrls = await scrapeAJAXProducts(baseUrl);
    
    console.log('Product URLs found:', productUrls);
})();
