const URL_PATTERNS = [
    /\/product\//,   // Match /product/
    /\/item\//,      // Match /item/
    /\/p\//,         // Match /p/
    /product-id-/,   // Match product-id-123
];

function isProductUrl(url) {
    for (let pattern of URL_PATTERNS) {
        if (pattern.test(url)) {
            return true;
        }
    }
    return false;
}

function discoverProductUrlsFromPage(pageContent) {
    // Extract URLs based on patterns
    const productUrls = [];
    const links = pageContent.match(/href="([^"]+)"/g); // Regex to find href attributes
    if (links) {
        links.forEach(link => {
            const url = link.replace(/href="|"/g, '');  // Clean the link
            if (isProductUrl(url)) {
                productUrls.push(url);
            }
        });
    }
    return productUrls;
}
