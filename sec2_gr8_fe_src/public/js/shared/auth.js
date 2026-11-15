// Share authentication form setup between customer and administrator pages.
import { initPage } from "../common.js";
import { $, fields } from "./dom.js";
export function authPage(admin = false) {
  initPage(({ session, query }) => {
    const next =
      query.get("next") || (admin ? "/admin" : "/account");
    // Keep the post-login destination local to this site.
    fields($("[data-auth-form]"), {
      ...(session.authDraft || {}),
      next: next.startsWith("/") && !next.startsWith("//") ? next : "/",
    });
    const link = $(".auth-switch a");
    if (link) {
      const url = new URL(link.href);
      url.searchParams.set("next", next);
      link.href = url.pathname + url.search;
    }
  });
}
