import Link from "next/link";

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label={label}>
      <div className="skeleton h-8 w-2/3" />
      <div className="skeleton h-28" />
      <div className="skeleton h-28" />
    </div>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="notice notice--error grid gap-3" role="alert">
      <p>We could not load your data: {message}</p>
      <button type="button" className="btn btn--card justify-self-start" onClick={onRetry}>Try again</button>
    </div>
  );
}

export function Empty({ title, text, href, action }: { title: string; text: string; href?: string; action?: string }) {
  return (
    <div className="stock grid gap-3 p-6">
      <h2>{title}</h2>
      <p className="text-ink-2">{text}</p>
      {href && action && <Link href={href} className="btn btn--ink justify-self-start">{action}</Link>}
    </div>
  );
}
