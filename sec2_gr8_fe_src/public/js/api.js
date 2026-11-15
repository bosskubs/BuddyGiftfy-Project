// The HTML controller supplies the API endpoint and method explicitly.
export const API_ORIGIN = window.BUDDY_API_ORIGIN || location.origin;
export async function request(endpoint, { method = "GET", data } = {}) {
  const url = new URL(endpoint, API_ORIGIN);
  if (
    url.origin !== new URL(API_ORIGIN).origin ||
    !url.pathname.startsWith("/api/")
  )
    throw Error("ที่อยู่บริการไม่ถูกต้อง");
  const response = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok || result.ok === false) {
    const error = Error(result.message || "ไม่สามารถเรียกข้อมูลได้");
    error.status = response.status;
    error.result = result;
    throw error;
  }
  return result;
}
export const sendAction = (endpoint, data, { method = "POST" } = {}) => {
  const url = new URL(endpoint, location.origin);
  if (![location.origin, new URL(API_ORIGIN).origin].includes(url.origin))
    throw Error("ที่อยู่บริการไม่ถูกต้อง");
  return request(url.pathname + url.search, { method, data });
};
