// Render featured products and category links from the home data endpoint.
import { initPage } from "../common.js";
import { $, bind, clone, replaceList, text, wireForms } from "../shared/dom.js";
import { productList, photo } from "../shared/products.js";
initPage(({ data, session }) => {
  productList('[data-list="products"]', data.products, session);
  replaceList(
    '[data-list="home-categories"]',
    data.categories,
    (category, index) => {
      const node = clone("home-categories");
      bind(node, {
        category: { ...category, name: category.category },
        session,
      });
      node.className = "category-tile category-" + (index % 4);
      text("small", category.amount + " ชิ้นให้เลือก", node);
      return node;
    },
  );
  const hero = data.products.find((p) => p.is_featured) || data.products[0];
  const spotlight = $(".spotlight");
  spotlight.hidden = !hero;
  if (hero) {
    bind(spotlight, { product: hero, session });
    photo($(".spotlight-photo img"), hero);
  }
});
