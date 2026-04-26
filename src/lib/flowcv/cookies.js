export function cookieHeaderFromSetCookie(setCookie) {
  if (!setCookie) return "";
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  return list
    .map((c) => String(c).split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}
