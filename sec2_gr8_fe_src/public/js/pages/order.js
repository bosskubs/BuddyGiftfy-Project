// Render the customer order and its available payment or cancellation actions.
import { initPage } from "../common.js";
import { fillOrderPage } from "../shared/orders.js";
initPage(({ data, session }) => fillOrderPage(data, session));
