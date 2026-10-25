import { Fragment } from "react";

// Small dependency-free renderer for lesson headings, lists, tables and inline emphasis.
export function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const out: React.ReactNode[] = [];
  let listBuf: Array<{ text: string; number?: number }> = [];
  let listKind: "bullet" | "numbered" | undefined;
  const flushList = () => {
    if (listBuf.length) {
      const items = listBuf.map((item, i) => (
        <li key={i} value={item.number}>{renderInline(item.text)}</li>
      ));
      out.push(listKind === "numbered" ? (
        <ol key={`list-${out.length}`} start={listBuf[0]?.number} className="my-3 ml-6 list-decimal space-y-1 text-foreground">{items}</ol>
      ) : (
        <ul key={`list-${out.length}`} className="my-3 ml-6 list-disc space-y-1 text-foreground">{items}</ul>
      ));
      listBuf = [];
    }
    listKind = undefined;
  };
  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx].trimEnd();
    const numbered = line.match(/^(\d+)\. (.*)$/);
    const kind = line.startsWith("- ") ? "bullet" : numbered ? "numbered" : undefined;
    if (kind) {
      if (listKind !== kind) flushList();
      listKind = kind;
      listBuf.push(numbered ? { text: numbered[2], number: Number(numbered[1]) } : { text: line.slice(2) });
      continue;
    }
    flushList();
    if (!line.trim()) continue;
    const header = tableCells(line);
    const separator = tableCells(lines[idx + 1] ?? "");
    if (header && separator && header.length === separator.length && separator.every((cell) => /^:?-{3,}:?$/.test(cell))) {
      const rows: string[][] = [];
      idx += 1;
      while (idx + 1 < lines.length) {
        const cells = tableCells(lines[idx + 1]);
        if (!cells || cells.length !== header.length) break;
        rows.push(cells);
        idx += 1;
      }
      out.push(
        <div key={`table-${idx}`} className="my-3 w-full min-w-0 max-w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-foreground">
            <thead className="bg-muted">
              <tr>{header.map((cell, i) => <th key={i} scope="col" className="border border-border px-3 py-2 font-semibold">{renderInline(cell)}</th>)}</tr>
            </thead>
            <tbody>{rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j} className="border border-border px-3 py-2">{renderInline(cell)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (line.startsWith("### ")) out.push(<h3 key={idx} className="mt-5 mb-2 text-lg font-semibold">{renderInline(line.slice(4))}</h3>);
    else if (line.startsWith("## ")) out.push(<h2 key={idx} className="mt-6 mb-2 text-xl font-bold">{renderInline(line.slice(3))}</h2>);
    else if (line.startsWith("# ")) out.push(<h1 key={idx} className="mt-6 mb-3 text-2xl font-bold">{renderInline(line.slice(2))}</h1>);
    else if (line.startsWith("> ")) out.push(<blockquote key={idx} className="my-3 border-l-4 border-primary/40 pl-4 italic text-muted-foreground">{renderInline(line.slice(2))}</blockquote>);
    else out.push(<p key={idx} className="my-2 leading-relaxed text-foreground">{renderInline(line)}</p>);
  }
  flushList();
  return <div className="w-full min-w-0 max-w-full overflow-x-hidden text-[15px] [overflow-wrap:anywhere]">{out}</div>;
}

function tableCells(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
}

function renderInline(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*))/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
        ) : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? (
          <em key={i}>{p.slice(1, -1)}</em>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}