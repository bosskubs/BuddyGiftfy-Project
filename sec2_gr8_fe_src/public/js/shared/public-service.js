// Public service examples: GET https://api.frankfurter.dev/v2/rate/thb/usd
// and GET https://api.frankfurter.dev/v2/rate/thb/eur. No credentials are sent.
// SERVICE-EXAMPLES-BEGIN public-rate
// Read a reference exchange rate for the gift budget; Access: Public
// Public API: no login, session cookie, or CSRF token is required.
// 1. method: GET; URL: https://api.frankfurter.dev/v2/rate/thb/usd
// 2. method: GET; URL: https://api.frankfurter.dev/v2/rate/thb/eur
// SERVICE-EXAMPLES-END public-rate
const form = document.querySelector("[data-budget-converter]");
if (form) {
  const output = document.querySelector("[data-budget-result]"),
    shop = document.querySelector("[data-budget-shop]"),
    cache = new Map();
  let requestNumber = 0;
  async function convert(event) {
    event?.preventDefault();
    if (!form.reportValidity()) return;
    const sequence = ++requestNumber,
      budget = Number(form.elements.budget.value),
      quote = form.elements.quote.value;
    if (
      !["usd", "eur", "jpy", "gbp"].includes(quote) ||
      !Number.isFinite(budget) ||
      budget < 1 ||
      budget > 1000000
    )
      return;
    shop.href = "/shop?max=" + encodeURIComponent(budget);
    output.textContent = "กำลังโหลดอัตราอ้างอิง…";
    output.setAttribute("aria-busy", "true");
    try {
      let rate = cache.get(quote);
      if (!rate) {
        const response = await fetch(
          "https://api.frankfurter.dev/v2/rate/thb/" + quote,
          { credentials: "omit", signal: AbortSignal.timeout(10000) },
        );
        if (!response.ok) throw Error("ไม่สามารถโหลดอัตราอ้างอิงได้");
        rate = await response.json();
        if (
          rate.base !== "THB" ||
          rate.quote !== quote.toUpperCase() ||
          !Number.isFinite(rate.rate) ||
          rate.rate <= 0 ||
          !/^\d{4}-\d{2}-\d{2}$/.test(rate.date)
        )
          throw Error("ข้อมูลอัตราอ้างอิงไม่ถูกต้อง");
        cache.set(quote, rate);
      }
      if (sequence !== requestNumber) return;
      output.textContent =
        new Intl.NumberFormat("th-TH", {
          style: "currency",
          currency: "THB",
        }).format(budget) +
        " ≈ " +
        new Intl.NumberFormat("th-TH", {
          style: "currency",
          currency: rate.quote,
        }).format(budget * rate.rate) +
        " · ข้อมูลวันที่ " +
        rate.date;
    } catch (error) {
      if (sequence === requestNumber)
        output.textContent =
          "โหลดอัตราอ้างอิงไม่สำเร็จ คุณยังเลือกสินค้าตามงบเงินบาทได้ กด “เทียบงบ” เพื่อลองใหม่";
    } finally {
      if (sequence === requestNumber) output.removeAttribute("aria-busy");
    }
  }
  form.addEventListener("submit", convert);
  void convert();
}
