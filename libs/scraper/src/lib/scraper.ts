/* @vite-ignore */
import puppeteer, { Browser, Page } from 'puppeteer';
import * as jsdom from 'jsdom';

export const launchBrowser = async () =>  {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env['CHROME_BIN'] || undefined,
        args: ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-sandbox', '--headless'],
    });

    return browser;
};

export const openNewPage = async(browser: Browser) => {
  const page = await browser.newPage();
  return page;
}

export const getFromPage = async (page: Page, url: string, bodyHandler: (body: HTMLElement) => any) => {
    await page.goto(url, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
    });

    const html = await page.content();

    const { JSDOM } = jsdom;
    const {
        window: {
            document: { body },
        },
    } = new JSDOM(html);
    const getData = bodyHandler(body);

    return getData;
};

export const closeBrowser = async(browser: Browser) => {
  await browser.close();
}
