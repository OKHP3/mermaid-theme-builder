import type { ReactNode } from "react";

export function formatImportError(msg: string): ReactNode {
  const match = /(Field ')([^']+)(' must be a string, got [^.]+\.)/.exec(msg);
  if (!match || match.index === undefined) return msg;
  const before = msg.slice(0, match.index);
  const after = msg.slice(match.index + match[0].length);
  return (
    <>
      {before}
      {match[1]}
      <code className="font-mono font-semibold">{match[2]}</code>
      {match[3]}
      {after}
    </>
  );
}
