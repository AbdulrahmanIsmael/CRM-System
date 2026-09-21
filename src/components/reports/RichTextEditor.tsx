"use client";

import { Bold, Italic, List, ListOrdered, Pilcrow, RemoveFormatting } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Common");

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value;
  }, [value]);

  const exec = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const toolbar: Array<{
    command: string;
    value?: string;
    label: string;
    icon: typeof Bold;
  }> = [
    { command: "bold", label: t("bold"), icon: Bold },
    { command: "italic", label: t("italic"), icon: Italic },
    { command: "insertUnorderedList", label: t("bulletedList"), icon: List },
    { command: "insertOrderedList", label: t("numberedList"), icon: ListOrdered },
    { command: "formatBlock", value: "p", label: t("paragraph"), icon: Pilcrow },
    { command: "removeFormat", label: t("clearFormatting"), icon: RemoveFormatting },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-input bg-surface/60 shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2" dir="ltr">
        {toolbar.map(({ command, value: commandValue, label, icon: Icon }) => (
          <Button key={command + (commandValue ?? "")} type="button" variant="ghost" size="icon-sm" className="rounded-lg" onMouseDown={(event) => event.preventDefault()} onClick={() => exec(command, commandValue)} aria-label={label} title={label}>
            <Icon />
          </Button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        data-placeholder={placeholder}
        className={cn("min-h-48 px-4 py-4 text-sm leading-7 outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]", "[&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:list-decimal [&_ol]:ps-6 [&_li]:my-1 [&_p]:my-1 [&_h3]:text-lg [&_h3]:font-semibold")}
      />
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">{t("description")}</p>
    </div>
  );
}
