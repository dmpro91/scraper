import { closePage, openNewPage } from "@scraper";
import { makeScrap } from "../iceteco";
import {uniq} from 'lodash';

export const pholodBaseUrl = 'https://pholod.com.ua';

// ScrapedLinks Array of {href - href to the category page, title - category title}
export const getScrapedLinks = (body, listItemSelector, childLinkSelector) =>
    Array.from(body.querySelectorAll(listItemSelector))
        .map((elem: HTMLElement) => elem.querySelector(childLinkSelector))
        .map((elem) => ({ href: elem.href, title: elem.href }));

// Array of {href - href to the category page, title - category title}
export const getCategoriesLinks = (body) => {
    const catalog = body.querySelector('.catalog_menu_main');
    return Array.from(catalog.querySelectorAll('a')).map((elem: HTMLLinkElement) => {
        const title = elem.href.split('/').at(-1);
        return {
            href: elem.href,
            title,
        }
    });
};

export const getProducts = (body) => {
    const productsList = body.querySelector('.products');
    return Array.from(productsList.querySelectorAll('a.productlink'))
        .map((elem: HTMLLinkElement) => {
            const productInfo = elem.querySelector('.product_info') as HTMLElement;
            const titleElem = productInfo.querySelector('.hide-sm') as HTMLElement;
            const href = elem.href;
            const title = titleElem?.innerHTML
            return {
                href, title,
            }
        })
}

export const getSubcategories = (body) => {
    const subCategories = body.querySelector('.widget-categor');
    return subCategories ? Array.from(subCategories?.querySelectorAll('.filter-widget'))
        .reduce((acc: [], elem: HTMLElement) => {
            const rowCategories = Array.from(elem.querySelectorAll('li'))?.map((item) => {
                const [, link] = Array.from(item.querySelectorAll('a'));
                return {
                    href: link.href,
                    title: link.innerHTML,
                }
            });
            return [...acc, ...rowCategories]
        }, []) : []
}

export const  getAllProducts = async (body, browser) => {
    const productsList = body.querySelector('.products');
    if (productsList) {
        return getProducts(body);
    } else {
        let products = [];
        const subMenuItems = getSubcategories(body) as {href: string}[];
        for await (const item of subMenuItems) {
            const newSubMenuPage = await openNewPage(browser);
            const subMenuProductsPage = await makeScrap(newSubMenuPage, item.href, (body) => body);
            await closePage(newSubMenuPage);
            const subMenuProducts = await getAllProducts(subMenuProductsPage, browser);
            products = [...products, ...subMenuProducts];
            
        }
        return products;
    }
}

export const  getProductData = async (body) => {
    const description = body.querySelector('label[itemprop="description"]')?.innerHTML;
    const price = body.querySelector('meta[itemprop="price"]')?.getAttribute('content');
    const textContent = body.querySelector('.tab-content[id="tab1"]')?.textContent;
    const catalogsWrapper = body.querySelector('.tab-content[id="tab6"]');
    const linksArray = Array.from(catalogsWrapper.querySelectorAll('a')).map((elm: HTMLLinkElement) => `${elm.href}\n`);
    return {
        description,
        price,
        textContent,
        pdfLinks: uniq(linksArray)?.toString()
    }
};

