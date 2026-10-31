import Image from "next/image";
import Link from "next/link";
import { getCrest } from "@/lib/crests";
export function TeamIdentity({
  name,
  crest,
  href,
  winner = false,
}: {
  name: string;
  crest?: string | null;
  href?: string;
  winner?: boolean;
}) {
  return (
    <span className={winner ? "team-identity is-winner" : "team-identity"}>
      {crest && (
        <Image src={getCrest(crest).src} width={40} height={40} alt="" />
      )}
      {href ? <Link href={href}>{name}</Link> : <span>{name}</span>}
    </span>
  );
}
