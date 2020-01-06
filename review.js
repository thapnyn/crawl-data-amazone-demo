const puppeteer = require('puppeteer');

(async () => {
    // const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    
    let code = 'B07L8NRH91';

    let existPageNext = false;
    let linkPage = `https://www.amazon.com/product-reviews/${code}`;
    let defaultPage = linkPage;
    let number = 1;
    let review = [];

    do {
        let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
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

        // Check content
        if (await page.$('#cm_cr-review_list') !== null) {
            await page.waitForSelector('#cm_cr-review_list div.a-section.review');

            // Wait load content
            if (await page.$('#cm_cr-pagination_bar > ul > li.a-last > a'))
                await page.waitForSelector('#cm_cr-pagination_bar > ul > li.a-last > a');
            
            // await page.waitFor(1000);

            // Get content
            let arrayReview = [];
            arrayReview = await page.evaluate(() => {
                let array = [];
                if (document.querySelectorAll('#cm_cr-review_list div.a-section.review') !== null) {
                    document.querySelectorAll('#cm_cr-review_list div.a-section.review').forEach(element => {
                        let id = element.getAttribute('id');
                        let elementName = document.querySelector(`#${id} span.a-profile-name`);
                        let elementAvatar = document.querySelector(`#${id} div.a-profile-avatar > img`);
                        let elementProfile = document.querySelector(`#${id} a.a-profile`);
                        let elementStart = document.querySelector(`#${id} i.review-rating span.a-icon-alt`);
                        let elementTitle = document.querySelector(`#${id} a[data-hook="review-title"]`);
                        let elementPostedDate = document.querySelector(`#${id} span.review-date`);
                        let elementContent = document.querySelector(`#${id} span[data-hook="review-body"]`);

                        if (elementName && elementTitle && elementPostedDate && elementContent) {
                            array.push({
                                name: elementName.innerText.trim(),
                                avatar: elementAvatar ? elementAvatar.getAttribute('data-src') : null,
                                profileUrl: 'https://www.amazon.com' + elementProfile.getAttribute('href'),
                                stars: elementStart ? Number(elementStart.innerText.substr(0, 1)) : null,
                                title: elementTitle.innerText.trim(),
                                postedDate: elementPostedDate.innerText.trim(),
                                content: elementContent.innerText.trim()
                            });
                        }
                    });
                }
                return array;
            }).catch(error => console.log(error));


            // Add content arrayReview to REVIEW
            if (arrayReview.length > 0) {
                arrayReview.forEach(item => {
                    review.push(item);
                });
            }

            // Check exist next page
            if (await page.$('#cm_cr-pagination_bar > ul > li.a-disabled.a-last') !== null)
                existPageNext = false;
            else {
                existPageNext = true;
                number++;
                linkPage = defaultPage + '?pageNumber=' + number;
            }

            await page.close();
            await browser.close();
        }
        else {
            await page.close();
            await browser.close();
        }

    } while (existPageNext === true);

    console.log('Review:\n', review);

    return;
})();