"use client";

import { ArrowDown, ArrowUp, ImagePlus, Save, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getInitials } from "@/lib/crm";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { ReportPrintDocument } from "@/components/reports/ReportPrintDocument";
import { RichTextEditor } from "@/components/reports/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import { sanitizeReportHtml } from "@/lib/report";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";

export type ReportEditorSection = {
  id: string;
  title: string;
  content_html: string;
  position: number;
  images: {
    id: string;
    storage_path: string;
    url: string;
    alt_text: string | null;
    position: number;
  }[];
};

type Props = {
  reportId: string;
  project: {
    id: string;
    name: string;
    clientName: string;
    start_date: string | null;
    deadline: string | null;
    budget: number;
    description: string | null;
  };
  business: {
    name: string;
    email: string;
    phone: string;
    address: string;
    logo: string;
  };
  initialTitle: string;
  initialSections: ReportEditorSection[];
};

export function ReportEditor({
  reportId,
  project,
  business,
  initialTitle,
  initialSections,
}: Props) {
  const locale = useLocale() as "en" | "ar";
  const t = useTranslations("Reports");
  const tc = useTranslations("Common");
  const supabase = useMemo(() => createClient(), []);

  const [title, setTitle] = useState(initialTitle);
  const [sections, setSections] = useState(initialSections);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const printRef = useRef<HTMLDivElement>(null);

  const print = useReactToPrint({
    contentRef: printRef,
    documentTitle: title || `${t("defaultTitle")} - ${project.name}`,
  });

  const persist = async (showToast = true) => {
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("UNAUTHORIZED");

      const nextTitle =
        title.trim() || `${t("defaultTitle")} - ${project.name}`;
      const { error: reportError } = await supabase
        .from("project_reports")
        .update({ title: nextTitle })
        .eq("id", reportId);

      if (reportError) throw reportError;

      const { data: existing, error: existingError } = await supabase
        .from("report_sections")
        .select("id")
        .eq("report_id", reportId);

      if (existingError) throw existingError;

      const keepIds = new Set(sections.map((section) => section.id));
      const deletedIds = (existing ?? [])
        .map((row) => row.id)
        .filter((id) => !keepIds.has(id));

      if (deletedIds.length) {
        const { data: oldImages, error: imageLookupError } = await supabase
          .from("report_section_images")
          .select("storage_path")
          .in("report_section_id", deletedIds);

        if (imageLookupError) throw imageLookupError;

        if (oldImages?.length) {
          const { error: storageError } = await supabase.storage
            .from("report-assets")
            .remove(oldImages.map((image) => image.storage_path));
          if (storageError) throw storageError;
        }

        const { error: deleteError } = await supabase
          .from("report_sections")
          .delete()
          .in("id", deletedIds);

        if (deleteError) throw deleteError;
      }

      if (sections.length) {
        const { error: upsertError } = await supabase
          .from("report_sections")
          .upsert(
            sections.map((section, index) => ({
              id: section.id,
              report_id: reportId,
              user_id: auth.user.id,
              title: section.title.trim() || t("sectionTitle"),
              content_html: sanitizeReportHtml(section.content_html),
              position: index,
            })),
          );

        if (upsertError) throw upsertError;
      }

      if (title !== nextTitle) setTitle(nextTitle);
      if (showToast) toast.success(t("saved"));
    } catch (error) {
      console.error(error);
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    setSections((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: t("sectionTitle"),
        content_html: "",
        position: current.length,
        images: [],
      },
    ]);
  };

  const updateSection = (id: string, patch: Partial<ReportEditorSection>) => {
    setSections((current) =>
      current.map((section) =>
        section.id === id ? { ...section, ...patch } : section,
      ),
    );
  };

  const removeSection = (id: string) => {
    setSections((current) => current.filter((section) => section.id !== id));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setSections((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const uploadImage = async (section: ReportEditorSection, file: File) => {
    if (!section.id) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      toast.error(t("imageTypes"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("imageTypes"));
      return;
    }

    setUploading(section.id);

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("UNAUTHORIZED");

      const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
      const path = `${auth.user.id}/${reportId}/${section.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("report-assets")
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const nextPosition = section.images.length;
      const { data: row, error: rowError } = await supabase
        .from("report_section_images")
        .insert({
          report_section_id: section.id,
          user_id: auth.user.id,
          storage_path: path,
          alt_text: null,
          position: nextPosition,
        })
        .select("id,storage_path,alt_text,position")
        .single();

      if (rowError) {
        await supabase.storage.from("report-assets").remove([path]);
        throw rowError;
      }

      const { data: signed, error: signError } = await supabase.storage
        .from("report-assets")
        .createSignedUrl(path, 86400);

      if (signError) throw signError;
      if (!signed?.signedUrl) throw new Error("SIGNED_URL_MISSING");

      updateSection(section.id, {
        images: [
          ...section.images,
          {
            id: row.id,
            storage_path: row.storage_path,
            url: signed.signedUrl,
            alt_text: row.alt_text,
            position: row.position,
          },
        ],
      });
    } catch (error) {
      console.error(error);
      toast.error(t("saveError"));
    } finally {
      setUploading(null);
    }
  };

  const removeImage = async (
    sectionId: string,
    image: ReportEditorSection["images"][number],
  ) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("report-assets")
        .remove([image.storage_path]);
      if (storageError) throw storageError;

      const { error } = await supabase
        .from("report_section_images")
        .delete()
        .eq("id", image.id);
      if (error) throw error;

      updateSection(sectionId, {
        images:
          sections
            .find((section) => section.id === sectionId)
            ?.images.filter((item) => item.id !== image.id) ?? [],
      });
    } catch (error) {
      console.error(error);
      toast.error(t("saveError"));
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
      <div className="space-y-5">
        <Card className="relative rounded-3xl border-border/80 bg-card/95 shadow-sm">
          <LoadingOverlay
            show={saving || Boolean(uploading)}
            label={saving ? tc("saving") : tc("upload")}
          />
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-lg">{t("reportSections")}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {project.name} · {project.clientName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void persist()} disabled={saving}>
                <Save data-icon="inline-start" />
                {saving ? tc("saving") : t("saveReport")}
              </Button>
              <Button variant="outline" onClick={() => print()}>
                <Save data-icon="inline-start" />
                {t("printPdf")}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <label className="space-y-2.5 text-sm">
              <span>{t("reportTitle")}</span>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-12 rounded-xl text-base"
              />
            </label>

            {sections.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
                {t("noSections")}
              </div>
            ) : null}

            {sections.map((section, index) => (
              <Card
                key={section.id}
                className="rounded-2xl border-border bg-muted/10 shadow-none"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Input
                      value={section.title}
                      onChange={(event) =>
                        updateSection(section.id, { title: event.target.value })
                      }
                      className="h-12 flex-1 bg-card"
                    />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveSection(index, -1)}
                        disabled={index === 0}
                        aria-label={tc("moveUp")}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveSection(index, 1)}
                        disabled={index === sections.length - 1}
                        aria-label={tc("moveDown")}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-danger hover:text-danger"
                        onClick={() => removeSection(section.id)}
                        aria-label={t("deleteSection")}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    {t("sectionHint")}
                  </p>
                  <RichTextEditor
                    value={section.content_html}
                    onChange={(value) =>
                      updateSection(section.id, { content_html: value })
                    }
                    placeholder={t("sectionPlaceholder")}
                  />

                  <div className="rounded-2xl border border-border bg-card/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          {t("uploadImage")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("imageTypes")}
                        </p>
                      </div>
                      <div>
                        <input
                          ref={(node) => {
                            fileInputs.current[section.id] = node;
                          }}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadImage(section, file);
                            event.currentTarget.value = "";
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading === section.id}
                          onClick={() =>
                            fileInputs.current[section.id]?.click()
                          }
                        >
                          <ImagePlus data-icon="inline-start" />
                          {uploading === section.id
                            ? tc("saving")
                            : t("uploadImage")}
                        </Button>
                      </div>
                    </div>

                    {section.images.length ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {section.images.map((image) => (
                          <div
                            key={image.id}
                            className="group relative overflow-hidden rounded-xl border border-border bg-background"
                          >
                            <Image
                              src={image.url}
                              alt={
                                image.alt_text ||
                                `${section.title} - ${t("imageAlt")}`
                              }
                              width={900}
                              height={560}
                              className="aspect-video w-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon-sm"
                              className="absolute inset-e-2 top-2 shadow-md row-actions"
                              onClick={() =>
                                void removeImage(section.id, image)
                              }
                              aria-label={tc("remove")}
                            >
                              <X />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={addSection}
            >
              <ImagePlus data-icon="inline-start" />
              {t("addSection")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <Card className="overflow-hidden rounded-3xl border-border bg-card/95 shadow-sm">
          <CardContent className="p-5">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-primary/10 text-xl font-semibold text-primary-light shadow-xl">
              {getInitials(project.clientName)}
            </div>
            <h2 className="mt-4 text-xl font-semibold">
              {title || t("defaultTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {project.clientName}
            </p>
            <div className="mt-5 space-y-3 rounded-2xl border border-border bg-muted/20 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("client")}</span>
                <span className="text-end font-medium">
                  {project.clientName}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t("projectPeriod")}
                </span>
                <span className="text-end">
                  {project.start_date
                    ? formatDate(project.start_date, locale)
                    : "-"}{" "}
                  -{" "}
                  {project.deadline
                    ? formatDate(project.deadline, locale)
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("business")}</span>
                <span className="text-end font-medium">{business.name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("budget")}</span>
                <span className="font-semibold">
                  {formatCurrency(project.budget, "USD", locale)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>

      <div className="pointer-events-none fixed left-[-10000px] top-0 w-198.5 bg-white text-black print:static print:left-auto print:w-full">
        <div ref={printRef}>
          <ReportPrintDocument
            title={title}
            project={project}
            business={business}
            sections={sections}
          />
        </div>
      </div>
    </div>
  );
}
