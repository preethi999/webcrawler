const puppeteer = require('puppeteer');

async function scrapeInfiniteScrollPage(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Function to emulate scrolling to the bottom of the page
    async function scrollToBottom() {
        await page.evaluate(async () => {
            const distance = 100;  // Distance to scroll each time
            const delay = 300;  // Delay between scrolls (ms)
            let scrollHeight = document.body.scrollHeight;

            while (document.body.scrollHeight === scrollHeight) {
                window.scrollBy(0, distance);
                await new Promise(resolve => setTimeout(resolve, delay));
                scrollHeight = document.body.scrollHeight;
            }
        });
    }

    // Scroll the page and load dynamic content
    await scrollToBottom();

    // Extract product URLs after scrolling
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
    const baseUrl = 'https://example.com';  // The page with infinite scroll
    const productUrls = await scrapeInfiniteScrollPage(baseUrl);
    
    console.log('Product URLs found:', productUrls);
})();
