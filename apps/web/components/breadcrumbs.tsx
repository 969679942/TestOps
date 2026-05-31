import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = Readonly<{
  items: BreadcrumbItem[];
}>;

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="面包屑">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="breadcrumb-item">
            {item.href && !isLast ? (
              <Link href={item.href} className="breadcrumb-link" title={item.label}>
                <span className="breadcrumb-label">{item.label}</span>
              </Link>
            ) : (
              <span
                className="breadcrumb-label"
                title={item.label}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
            {!isLast ? <span className="breadcrumb-sep">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
