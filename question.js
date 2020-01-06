const puppeteer = require('puppeteer');

(async () => {

    let questions = [];

    let code = 'B078WVS8QW';
    let existPageNext = false;
    let linkPage = `https://www.amazon.com/ask/questions/asin/${code}`;
    let defaultPage = linkPage;
    let number = 1;
    let linkQuestion = [];
    
    /*
    =================================================================
    @ Get list question LINK
    =================================================================
    */
    do {
        let arrayLinkAQ = [];
        let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        // let browser = await puppeteer.launch({ headless: false });
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
        if (await page.$('div.a-section.askTeaserQuestions') !== null) {

            // Wait element
            await page.waitForSelector('div.a-section.askTeaserQuestions');
            await page.waitFor(1000);

            // Get link question
            arrayLinkAQ = await page.evaluate(() => {
                array = [];
                strLink = '';
                document.querySelectorAll('div.a-section.askTeaserQuestions > div').forEach(element => {
                    strLink = 'https://www.amazon.com' + element.getElementsByClassName('a-link-normal')[0].getAttribute('href');
                    array.push(strLink);
                });
                return array;
            }).catch(error => console.log(error));

            // Add content arrayQuestion to Question
            if (arrayLinkAQ.length > 0) {
                arrayLinkAQ.forEach(item => {
                    linkQuestion.push(item);
                });
            }

            // Exist next page
            if (await page.$('#askPaginationBar > ul > li.a-disabled.a-last') !== null) {
                existPageNext = false;
            } else {
                existPageNext = true;
                number++;
                linkPage = defaultPage + '/' + number + '?isAnswered=true';
            }

            await page.close();
            await browser.close();
            
        } else {
            await page.close();
            await browser.close();
        }

    } while (existPageNext === true);


    /*
    =================================================================
    @ Get detail question
    =================================================================
    */
    for (let link of linkQuestion) {
        let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        let page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.resourceType() === 'image')
                request.abort();
            else
                request.continue();
        });

        await page.goto(link, {waitUntil: 'networkidle0', timeout: 60000});

        let linkAnwer = await page.url();
        let questionTitle = '';
        let arrayAnswers = [];

        // Get title question
        await page.waitForSelector('p.askAnswersAndComments span');
        questionTitle = await page.evaluate(async () => {
            let elementQuestion = await document.querySelector('p.askAnswersAndComments span');
            let title = await elementQuestion.innerText.trim();
            return title;
        }).catch(error => console.log(error));


        // Get answers
        if (await page.$('div.askAnswersAndComments') !== null) {
            let isNextPagi = true;

            await page.waitForSelector('div.askAnswersAndComments');
            await page.waitFor(1500);

            arrayAnswers = await page.evaluate(() => {
                let array = [];
                document.querySelectorAll('div.askAnswersAndComments > div').forEach(element => {
                    let id = element.getAttribute('id');
                    if (id) {
                        let ob = {};

                        let elAnwers = document.querySelector(`#${id} > span:nth-child(3)`);
                        let elName = document.querySelector(`#${id} div.a-profile-content > span.a-profile-name`);
                        let elDate = document.querySelector(`#${id} > span.a-color-tertiary.aok-align-center`);
                        let elAvatar = document.querySelector(`#${id} div.a-profile-avatar > img`) || null;
                        let elProfileURL = document.querySelector(`#${id} > a.a-profile`) || null;

                        if (elAnwers && elName && elDate) {
                            ob = {
                                anwers: elAnwers.innerText.trim(),
                                name: elName.innerText.trim(),
                                date: elDate.innerText.replace('·', '').trim(),
                                avatar: elAvatar ? 'https://www.amazon.com' + elAvatar.getAttribute('src') : null,
                                profileURL: elProfileURL ? 'https://www.amazon.com' + elProfileURL.getAttribute('href') : null
                            };
                        }
                        array.push(ob);
                    }
                });
                return array;
            }).catch(error => console.log(error));

            questions.push({
                question: questionTitle,
                linkAnwer: linkAnwer,
                anwers: arrayAnswers,
            });

            await page.close();
            await browser.close();
        } else {
            await page.close();
            await browser.close();
        }

    }

    console.log(questions);
    console.log('LENGTH = ',questions.length);

    return;
})();