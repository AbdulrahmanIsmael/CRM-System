const ALLOWED_TAGS = ["P", "BR", "STRONG", "EM", "UL", "OL", "LI", "H3", "BLOCKQUOTE"];

export function sanitizeReportHtml(html: string) {
  if (typeof window === "undefined") {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<!--([\s\S]*?)-->/g, "")
      .replace(/<\/?([a-z0-9-]+)(\s[^>]*)?>/gi, (full, tag) =>
        ALLOWED_TAGS.includes(String(tag).toUpperCase()) ? full.replace(/\s+[a-z-]+\s*=\s*(["']).*?\1/gi, "") : "",
      );
  }

  const template = document.createElement("template");
  template.innerHTML = html;
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
  const elements: Element[] = [];
  while (walker.nextNode()) elements.push(walker.currentNode as Element);
  for (const element of elements) {
    if (!ALLOWED_TAGS.includes(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }
    for (const attr of Array.from(element.attributes)) element.removeAttribute(attr.name);
  }
  return template.innerHTML;
}

export function normalizeRichTextValue(value: string) {
  if (!value.trim()) return "";
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value);
  if (!looksLikeHtml) {
    const escaped = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped.split(/\r?\n/).map((line) => `<p>${line || "<br>"}</p>`).join("");
  }
  return sanitizeReportHtml(value);
}
