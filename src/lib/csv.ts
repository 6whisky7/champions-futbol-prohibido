export function competitionCsv(
  headers: string[],
  rows: (string | number | null)[][],
) {
  const cell = (v: string | number | null) => {
    if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
    let text = v ?? "";
    // User text must never become an Excel/Sheets formula, including whitespace prefixes.
    if (
      /^[\s\uFEFF]*[=+\-@]/.test(text) ||
      text.startsWith("\t") ||
      text.startsWith("\r")
    )
      text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return (
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") +
    "\r\n"
  );
}
