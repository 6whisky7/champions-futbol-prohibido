import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link
      className="brand"
      href={href}
      aria-label="Champions Fútbol Prohibido, inicio"
      translate="no"
    >
      <span className="brand-mark" aria-hidden="true">
        CFP
      </span>
      <span className="brand-name">
        Champions<span>Fútbol Prohibido</span>
      </span>
    </Link>
  );
}
