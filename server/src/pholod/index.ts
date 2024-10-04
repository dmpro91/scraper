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

export const getAllProducts = (body) => {
    const productsList = body.querySelector('.products');
    return Array.from(productsList.querySelectorAll('a.productlink'))
        .map((elem: HTMLLinkElement) => {
            const productInfo = elem.querySelector('.product_info') as HTMLElement;
            const href = elem.href;
            const title = productInfo?.innerText
            return {
                href, title,
            }
        })
}

export const getSubcategories = (body) => {
    const subCategories = body.querySelector('.widget-categor');
    return Array.from(subCategories.querySelectorAll('.filter-widget'))
        .reduce((acc: [], elem: HTMLElement) => {
            const rowCategories = Array.from(elem.querySelectorAll('li'))?.map((item) => {
                const [, link] = Array.from(item.querySelectorAll('a'));
                return {
                    href: link.href,
                    title: link.innerHTML,
                }
            });
            return [...acc, ...rowCategories]
        }, [])
}
