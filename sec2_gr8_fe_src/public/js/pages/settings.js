// Populate the store settings form with the current API values.
import { initPage } from "../common.js";
import { $, fields } from "../shared/dom.js";
initPage(({ data }) => fields($(".settings-form"), data.settings));
