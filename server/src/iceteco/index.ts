import { tryCatch } from '@core';
import { getFromPage } from '@scraper';

export const itecoBaseUrl = 'https://iceteco.com.ua';
export const pageCountParam = 'product_items_per_page=48';

// TODO: Move this into scraper lib
export const makeScrap = async (page, url, callback): Promise<any> => await tryCatch(() => getFromPage(page, url, callback));
// ScrapedLinks Array of {href - href to the category page, title - category title}
export const getScrapedLinks = (body, listItemSelector, childLinkSelector) =>
    Array.from(body.querySelectorAll(listItemSelector))
        .map((elem: HTMLElement) => elem.querySelector(childLinkSelector))
        .map((elem) => ({ href: elem.href, title: elem.textContent }));

// Array of {href - href to the category page, title - category title}
export const getCategoriesLinks = (body) =>
    getScrapedLinks(body, '.cs-product-groups-gallery__item', '.cs-product-groups-gallery__title');

export const getProductFromPage = (body) => {
    const products = getScrapedLinks(body, '.cs-product-gallery__item', '.cs-goods-title');
    // Find Pagination
    const paginator = body.querySelector('[data-bazooka="Paginator"]');
    const nextPage = paginator?.querySelector('.b-pager__link.b-pager__link_pos_last')?.href;
    return [products, nextPage];
};

// Array of  {url - href to the category page, title - product title}
export const getAllProducts = async (page, categoryUrl) => {
    let allProducts = [];
    const [products, nextPage] = await makeScrap(page, categoryUrl, getProductFromPage);
    allProducts = [...allProducts, ...products];
    if (nextPage) {
        const fromTheNextPage = await getAllProducts(page, `${itecoBaseUrl}${nextPage}`);
        return [...allProducts, ...fromTheNextPage];
    }
    return allProducts;
};

/**
 * ProductInfo
 * {
 *  price: number;
 *  code: string;
 *  description: string;
 *  imageUrl: string;
 * }
 */

export interface ProductInfo {
    price: number;
    code: string;
    description: string;
    imageUrl: string;
}

export const getProductInfo = (body): ProductInfo => {
    const infoHolder = body.querySelector('.cs-product__info-holder');
    const price = infoHolder.querySelector('[data-qaid="product_price"]')?.textContent;
    const code = infoHolder.querySelector('[data-qaid="product_code"]')?.textContent;
    const tabs = body.querySelector('.cs-tab-list');
    const description = tabs.querySelector('[data-qaid="product_description"]')?.textContent;
    const imageUrl = body.querySelector('.cs-sticky-panel__image-box.js-product-gallery-overlay')?.href;
    return {
        price: Number(price?.match(/\d/g).join('')),
        code,
        description,
        imageUrl,
    };
};

// // // All the magic bellow
// const categoriesWithLinks = await makeScrap(`${baseUrl}/ua`, getCategoriesLinks); // 17 categories

// const [{ href }] = categoriesWithLinks;

// const productsWithLinks = await categoriesWithLinks.slice(0, 1).reduce(async (res, category) => ([...await res, ...await getAllProducts(`${baseUrl}${category.href}?${pageCountParam}`)]), []);
// // 552 products
// const [firstProduct] = productsWithLinks;
