export function sanitizeReportHtml(html: string) {
  if (typeof window === "undefined") return html;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const allowed = new Set(["P", "BR", "STRONG", "EM", "UL", "OL", "LI", "H3", "BLOCKQUOTE"]);
  const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_ELEMENT);
  const nodes: Element[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Element);
  nodes.forEach((node) => {
    if (!allowed.has(node.tagName)) node.replaceWith(document.createTextNode(node.textContent ?? ""));
    else Array.from(node.attributes).forEach((attribute) => node.removeAttribute(attribute.name));
  });
  return wrapper.innerHTML;
}
