const puppeteer = require('puppeteer');

(async () => {
    let codeSeller = 'A28BL6M1Q1A6RV';

    let linkPage = `https://www.amazon.com/s?me=${codeSeller}`;
    let totalProductSeller;

    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    let page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.resourceType() === 'image')
            request.abort();
        else
            request.continue();
    });

    // Goto Page
    await page.goto(linkPage, {waitUntil: 'networkidle0', timeout: 60000});

    if(await page.$('h1.s-desktop-toolbar') !== null) {
        totalProductSeller = await page.evaluate(() => {
            let number = 1;
            let elNumber = document.querySelector('h1.s-desktop-toolbar .s-breadcrumb > .sg-col-inner > div.a-section > span:first-child');
            if (elNumber) {
                let index = elNumber.innerText.indexOf('of');
                number = Number(elNumber.innerText.substr(index).replace(/[,a-zA-Z]/g, '').trim());
            }
            return number;
        }).catch(error => console.log(error));

        await page.close();
        await browser.close();
    } else {
        await page.close();
        await browser.close();
    }

    console.log('TotalProductSeller: ', totalProductSeller);

    return;
})();