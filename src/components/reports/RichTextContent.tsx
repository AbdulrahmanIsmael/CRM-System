import { normalizeRichTextValue, sanitizeReportHtml } from "@/lib/report";

export function RichTextContent({
  value,
  className = "",
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const html = normalizeRichTextValue(value ?? "");
  return (
    <div
      className={`prose prose-sm max-w-none text-sm leading-7 text-foreground [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:list-decimal [&_ol]:ps-6 [&_li]:my-1 [&_p]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_blockquote]:border-s-2 [&_blockquote]:ps-4 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeReportHtml(html) }}
    />
  );
}
