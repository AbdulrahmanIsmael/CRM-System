"use client";

import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  RemoveFormatting,
} from "lucide-react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";

import { Button } from "@/components/ui/button";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const t = useTranslations("Common");

  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        heading: {
          levels: [3],
        },
      }),

      Placeholder.configure({
        placeholder,
      }),
    ],

    content: value || "<p></p>",

    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor?.isActive("bold") ?? false,
      isItalic: editor?.isActive("italic") ?? false,
      isBulletList: editor?.isActive("bulletList") ?? false,
      isOrderedList: editor?.isActive("orderedList") ?? false,
    }),
  });

  useEffect(() => {
    if (!editor) return;

    const nextValue = value || "<p></p>";

    if (editor.getHTML() !== nextValue) {
      editor.commands.setContent(nextValue, {
        emitUpdate: false,
      });
    }
  }, [editor, value]);

  const runCommand = (command: string) => {
    if (!editor) return;

    switch (command) {
      case "bold":
        editor.chain().focus().toggleBold().run();
        break;

      case "italic":
        editor.chain().focus().toggleItalic().run();
        break;

      case "insertUnorderedList":
        editor.chain().focus().toggleBulletList().run();
        break;

      case "insertOrderedList":
        editor.chain().focus().toggleOrderedList().run();
        break;

      case "paragraph":
        editor.chain().focus().setParagraph().run();
        break;

      case "removeFormat":
        editor.chain().focus().clearNodes().unsetAllMarks().run();
        break;
    }
  };

  const toolbar = [
    {
      command: "bold",
      label: t("bold"),
      icon: Bold,
    },
    {
      command: "italic",
      label: t("italic"),
      icon: Italic,
    },
    {
      command: "insertUnorderedList",
      label: t("bulletedList"),
      icon: List,
    },
    {
      command: "insertOrderedList",
      label: t("numberedList"),
      icon: ListOrdered,
    },
    {
      command: "paragraph",
      label: t("paragraph"),
      icon: Pilcrow,
    },
    {
      command: "removeFormat",
      label: t("clearFormatting"),
      icon: RemoveFormatting,
    },
  ];

  if (!editor) {
    return (
      <div className="overflow-hidden rounded-2xl border border-input bg-surface/60 shadow-sm">
        <div className="h-12 border-b border-border bg-muted/40" />
        <div className="min-h-48 px-4 py-4" />
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          {t("description")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-input bg-surface/60 shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
      <div
        className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2"
        dir="ltr"
      >
        {toolbar.map(({ command, label, icon: Icon }) => {
          const active =
            command === "bold"
              ? editorState?.isBold
              : command === "italic"
                ? editorState?.isItalic
                : command === "insertUnorderedList"
                  ? editorState?.isBulletList
                  : command === "insertOrderedList"
                    ? editorState?.isOrderedList
                    : false;

          return (
            <Button
              key={command}
              type="button"
              variant={active ? "secondary" : "ghost"}
              size="icon-sm"
              className="rounded-lg"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => runCommand(command)}
              aria-label={label}
              title={label}
              aria-pressed={active}
            >
              <Icon />
            </Button>
          );
        })}
      </div>

      <div
        className={cn(
          "min-h-48 cursor-text px-4 py-4 text-sm leading-7 outline-none",
          "[&_.tiptap]:min-h-48",
          "[&_.tiptap]:outline-none",
          "[&_.tiptap_p]:my-1",
          "[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:ps-6",
          "[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:ps-6",
          "[&_.tiptap_li]:my-1",
          "[&_.tiptap_strong]:font-bold",
          "[&_.tiptap_em]:italic",
          "[&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-semibold",
        )}
      >
        <EditorContent editor={editor} />
      </div>

      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        {t("description")}
      </p>
    </div>
  );
}
