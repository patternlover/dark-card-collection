import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`text-sm font-medium uppercase tracking-wider ${className || ''}`}>
      <ol className="flex flex-wrap items-center gap-x-2 text-zinc-500">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-x-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-[var(--accent)]">
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--accent)] underline decoration-[var(--accent)] decoration-2 underline-offset-8">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
