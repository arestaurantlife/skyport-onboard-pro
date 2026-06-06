import { Fragment } from "react";

// Tiny markdown renderer: # / ## / ### headings, **bold**, > quote, - list, paragraphs.
export function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const out: React.ReactNode[] = [];
  let listBuf: string[] = [];
  const flushList = () => {
    if (listBuf.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="my-3 ml-6 list-disc space-y-1 text-foreground">
          {listBuf.map((l, i) => (
            <li key={i}>{renderInline(l)}</li>
          ))}
        </ul>,
      );
      listBuf = [];
    }
  };
  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (line.startsWith("- ")) {
      listBuf.push(line.slice(2));
      return;
    }
    flushList();
    if (!line.trim()) return;
    if (line.startsWith("### ")) out.push(<h3 key={idx} className="mt-5 mb-2 text-lg font-semibold">{renderInline(line.slice(4))}</h3>);
    else if (line.startsWith("## ")) out.push(<h2 key={idx} className="mt-6 mb-2 text-xl font-bold">{renderInline(line.slice(3))}</h2>);
    else if (line.startsWith("# ")) out.push(<h1 key={idx} className="mt-6 mb-3 text-2xl font-bold">{renderInline(line.slice(2))}</h1>);
    else if (line.startsWith("> ")) out.push(<blockquote key={idx} className="my-3 border-l-4 border-primary/40 pl-4 italic text-muted-foreground">{renderInline(line.slice(2))}</blockquote>);
    else out.push(<p key={idx} className="my-2 leading-relaxed text-foreground">{renderInline(line)}</p>);
  });
  flushList();
  return <div className="text-[15px]">{out}</div>;
}

function renderInline(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}