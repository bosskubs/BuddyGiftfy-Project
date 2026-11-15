// Render favorite products with the shared product card renderer.
import { initPage } from "../common.js";
import { productList } from "../shared/products.js";
initPage(({ data, session }) =>
  productList('[data-list="products"]', data.products, session),
);
