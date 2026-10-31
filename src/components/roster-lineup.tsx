export function RosterLineup({
  members,
}: {
  members: {
    roblox: string;
    role: string;
    captain: boolean;
    tiktok?: string;
  }[];
}) {
  const card = (m: (typeof members)[number], i: number) => (
    <li key={i}>
      <span className="roster-initial" aria-hidden="true">
        {m.roblox.slice(0, 1).toUpperCase()}
      </span>
      <strong>{m.roblox}</strong>
      <span>
        {m.role}
        {m.captain && <span className="captain-mark">C · Capitán</span>}
      </span>
      {m.tiktok && <small>TikTok privado: {m.tiktok}</small>}
    </li>
  );
  return (
    <div className="roster-lineup">
      <div className="roster-starters" role="group" aria-label="Titulares">
        <p className="roster-role">Tres titulares · sin posiciones asignadas</p>
        <ul>{members.filter((m) => m.role !== "Suplente").map(card)}</ul>
      </div>
      <div className="roster-substitute" role="group" aria-label="Suplente">
        <p className="roster-role">Suplente</p>
        {members.some((m) => m.role === "Suplente") ? (
          <ul>{members.filter((m) => m.role === "Suplente").map(card)}</ul>
        ) : (
          <p className="admin-note">Sin suplente inscrito.</p>
        )}
      </div>
    </div>
  );
}
