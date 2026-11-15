// Render order details and the payment or fulfillment actions available to staff.
import { initPage } from "../common.js";
import { fillOrderPage } from "../shared/orders.js";
initPage(({ data, session }) => fillOrderPage(data, session, true));
