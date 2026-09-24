import { APP_NAME } from "@/constants";

interface PageHeaderProps {
  /** Page title (h1) */
  title: string;
  /** Optional subtitle/description below the title */
  subtitle?: string;
  /** Optional slot rendered to the right (e.g. a CTA button) */
  action?: React.ReactNode;
  /** Extra className on the wrapper */
  className?: string;
}

/**
 * Shared page header used by all dashboard list pages.
 * Renders the brand breadcrumb, h1, optional subtitle, and an optional
 * action slot in a flex row that collapses to a column on mobile.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between${className ? ` ${className}` : ""}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">
          {APP_NAME}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
