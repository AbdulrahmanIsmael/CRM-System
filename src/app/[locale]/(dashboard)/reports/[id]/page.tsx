import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getContactDisplayName } from "@/lib/crm";
import {
  ReportEditor,
  type ReportEditorSection,
} from "@/components/reports/ReportEditor";
import { DeleteReportButton } from "@/components/reports/DeleteReportButton";

export default async function ReportDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Reports");
  const supabase = await createClient();
  const [{ data: report }, { data: profile }] = await Promise.all([
    supabase
      .from("project_reports")
      .select(
        "id,title,project_id,projects(id,name,description,status,start_date,deadline,budget,contact_id,contacts(type,first_name,last_name,company_name))",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select(
        "full_name,business_name,business_email,business_phone,business_address,business_logo_url",
      )
      .maybeSingle(),
  ]);
  if (!report) notFound();
  const project = Array.isArray(report.projects)
    ? report.projects[0]
    : report.projects;
  if (!project) notFound();
  const contact = Array.isArray(project.contacts)
    ? project.contacts[0]
    : project.contacts;
  const [{ data: sections }, { data: images }] = await Promise.all([
    supabase
      .from("report_sections")
      .select("id,title,content_html,position")
      .eq("report_id", id)
      .order("position"),
    supabase
      .from("report_section_images")
      .select("id,report_section_id,storage_path,alt_text,position")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .order("position"),
  ]);
  const sectionRows: ReportEditorSection[] = await Promise.all(
    (sections ?? []).map(async (section) => {
      const sectionImages = (images ?? [])
        .filter((image) => image.report_section_id === section.id)
        .sort((a, b) => a.position - b.position);
      const signed = await Promise.all(
        sectionImages.map(async (image) => {
          const { data } = await supabase.storage
            .from("report-assets")
            .createSignedUrl(image.storage_path, 86400);
          return { ...image, url: data?.signedUrl ?? "" };
        }),
      );
      return {
        id: section.id,
        title: section.title,
        content_html: section.content_html,
        position: section.position,
        images: signed
          .filter((image) => image.url)
          .map((image) => ({
            id: image.id,
            storage_path: image.storage_path,
            url: image.url,
            alt_text: image.alt_text,
            position: image.position,
          })),
      };
    }),
  );
  const businessName =
    profile?.business_name?.trim() ||
    profile?.full_name?.trim() ||
    t("businessFallback");
  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link
          href="/reports"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft />
        </Link>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">
            {t("title")}
          </p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">
            {report.title}
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {project.name} · {getContactDisplayName(contact || {})}
          </p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <DeleteReportButton reportId={report.id} />
        </div>
      </div>
      <ReportEditor
        reportId={report.id}
        project={{
          id: project.id,
          name: project.name,
          clientName: getContactDisplayName(contact || {}) || "-",
          start_date: project.start_date,
          deadline: project.deadline,
          budget: Number(project.budget || 0),
          description: project.description,
        }}
        business={{
          name: businessName,
          email: profile?.business_email || "",
          phone: profile?.business_phone || "",
          address: profile?.business_address || "",
          logo: profile?.business_logo_url || "",
        }}
        initialTitle={report.title}
        initialSections={sectionRows}
      />
    </div>
  );
}
