import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import { groupBy} from 'lodash';

import { makeScrap, getCategoriesLinks, itecoBaseUrl, getProductInfo, ProductInfo, getAllProducts, pageCountParam } from './iceteco';
import * as pholod from './pholod';
import { WSEventsEnum, WSProgress } from '@core';
import { closeBrowser, closePage, launchBrowser, openNewPage } from '@scraper';


const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const makeProgress = (progress: WSProgress) => progress;
const getCalculatedProgress = (index, count) => (((index + 1) / count) * 100) - 1 || 1;

interface ProductBase {
    category: string; title: string;
}
const zipByCategories = (products: (ProductInfo & ProductBase)[]) => {
    return groupBy(products, 'category')
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:4200',
    },
});

app.use(cors());

app.get('/', (req, res) => {
    res.send({ message: 'Server working well' });
});

io.on('connection', (socket) => {
    console.log('WS user connected');

    setTimeout(() => {
        socket.emit(WSEventsEnum.service, true);
    }, 2000);

    socket.on(WSEventsEnum.pholod, async () => {
        console.log(WSEventsEnum.pholod, 'start');
        const browser = await launchBrowser();
        const page = await openNewPage(browser);
        // Categories
        socket.emit(WSEventsEnum.progress, makeProgress({ count: 1, label: 'Get all Categories...', type: 'query' }));
        const categoriesWithLinks = await makeScrap(page,`${pholod.pholodBaseUrl}`, pholod.getCategoriesLinks); // 94 categories

        const categoriesCount = categoriesWithLinks.length;
        socket.emit(
            WSEventsEnum.progress,
            makeProgress({ count: 100, label: `Categories done. Found ${categoriesCount} categories` })
        );

        // Subcategories
        const subcategoriesWithMenu = await categoriesWithLinks.reduce(async (res, cat, index) => {
            const asyncSubcategories = async () => {
                await socket.emit(
                    WSEventsEnum.progress,
                    makeProgress({
                        count: getCalculatedProgress(index, categoriesCount),
                        label: `Get Subcategories from ${cat.title}...${index + 1}/${categoriesCount}`,
                    })
                );
                const subcategoryPage = await openNewPage(browser);
                const subcategories = await makeScrap(subcategoryPage,`${cat.href}`, pholod.getSubcategories);
                await closePage(subcategoryPage);
                return {category: cat.title, subcategories };
            }
            return [...(await res), await asyncSubcategories()]
        }, []);

        const productsWithLinks = await subcategoriesWithMenu.reduce(async (res, cat) => {
            const asyncSubcategories = async () => {
                let products = [];
                let count = 0;
                for await (const sub of cat.subcategories) {
                    await socket.emit(
                        WSEventsEnum.progress,
                        makeProgress({
                            count: getCalculatedProgress(count, cat.subcategories.length),
                            label: `Get products from ${sub.title} of ${cat.category}...${count + 1}/${cat.subcategories.length}`,
                        })
                    );
                    const subcategoryPage = await openNewPage(browser);
                    const productsPage = await makeScrap(subcategoryPage, sub.href, (body) => body);
                    await closePage(subcategoryPage);
                    const allProducts = await pholod.getAllProducts(productsPage, browser);
                    products = [...products, ...allProducts.map((item) => ({...item, subCategory: sub.title}))];
                    count = count + 1;
                }

                return {category: cat.category, products}
            }
            return [...(await res), await asyncSubcategories()]
        }, []);

        // Product Data
        const productData = await productsWithLinks.reduce(async (acc, cat) => {
            const asyncProducts = async () => {
                let products = [];
                let count = 0;
                for await (const sub of cat.products) {
                    await socket.emit(
                        WSEventsEnum.progress,
                        makeProgress({
                            count: getCalculatedProgress(count, cat.products.length),
                            label: `Get product data from ${sub.title} of ${cat.category}...${count + 1}/${cat.products.length}`,
                        })
                    );
                    const productPage = await openNewPage(browser);
                    const productData = await makeScrap(productPage, sub.href, pholod.getProductData);
                    await closePage(productPage);
                    products = [...products, {...sub, ...productData}];
                    count = count + 1;
                }

                return products;
            }
            return {...(await acc), [cat.category]: await asyncProducts()}
        }, {})

        await closeBrowser(browser);
        socket.emit(WSEventsEnum.pholod, productData);
        socket.emit(
            WSEventsEnum.progress,
            makeProgress({ count: 100, label: `All for ${WSEventsEnum.pholod} are done. Enjoy:)` })
        );
    });

    socket.on(WSEventsEnum.iceteco, async () => {
        console.log(WSEventsEnum.iceteco, 'start');
        const browser = await launchBrowser();
        const page = await openNewPage(browser);
        socket.emit(WSEventsEnum.progress, makeProgress({ count: 1, label: 'Get all Categories...', type: 'query' }));

        // Categories
        const categoriesWithLinks = await makeScrap(page,`${itecoBaseUrl}/ua`, getCategoriesLinks); // 16 categories

        const categoriesCount = categoriesWithLinks.length;
        socket.emit(
            WSEventsEnum.progress,
            makeProgress({ count: 100, label: `Categories done. Found ${categoriesCount} categories` })
        );
        // Products
        const productsWithLinks = await categoriesWithLinks.reduce(async (res, category, index) => {
            const makeWithProgress = async () => {
                await socket.emit(
                    WSEventsEnum.progress,
                    makeProgress({
                        count: getCalculatedProgress(index, categoriesCount),
                        label: `Get Products from ${category.title}...${index + 1}/${categoriesCount}`,
                    })
                );
                const categoryProducts = await getAllProducts(page,`${itecoBaseUrl}${category.href}?${pageCountParam}`);
                return categoryProducts.map((product) => ({ ...product, category: category.title }));
            };

            return [...(await res), ...(await makeWithProgress())];
        }, []);

        socket.emit(
            WSEventsEnum.progress,
            makeProgress({ count: 100, label: `Products done. Found ${productsWithLinks.length} products` })
        );
        // Products data
        const productsData = await productsWithLinks.reduce(async (res, product, index) => {
            const makeWithProgress = async () => {
                await socket.emit(
                    WSEventsEnum.progress,
                    makeProgress({
                        count: getCalculatedProgress(index, productsWithLinks.length),
                        label: `Get data from ${product.title}...${index + 1}/${productsWithLinks.length}`,
                    })
                );
                const categoryProduct = await makeScrap(page,`${itecoBaseUrl}${product.href}`, getProductInfo);
                return { ...categoryProduct, title: product.title, category: product.category };
            };
            const acc = await res;
            const next = await makeWithProgress();
            return [...acc, next];
        }, []);
        await closeBrowser(browser);
        socket.emit(WSEventsEnum.iceteco, zipByCategories(productsData)); // 866 products
        socket.emit(
            WSEventsEnum.progress,
            makeProgress({ count: 100, label: `All for ${WSEventsEnum.iceteco} are done. Enjoy:)` })
        );
    });
});

io.on('connect_error', (err) => {
    // the reason of the error, for example "xhr poll error"
    console.log(err.message);

    // some additional description, for example the status code of the initial HTTP response
    console.log(err.description);

    // some additional context, for example the XMLHttpRequest object
    console.log(err.context);
});

server.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
});
