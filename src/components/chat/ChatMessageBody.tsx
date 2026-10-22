'use client';

// Renders assistant prose without showing its lightweight markup.
//
// Two things matter here. Bold markers become real emphasis instead of literal
// `**`, and every NCT number becomes a badge. A line that is a bullet with an
// NCT at the start is laid out as "badge + the information beside it"; an NCT
// inside a sentence stays inline.

import React from 'react';

import { TrialBadge } from '@/components/chat/TrialBadge';

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/^\s*(?:[-*•]|\d+\.)\s*/, '')
    .replace(/^[\s—–:,-]+/, '')
    .trim();
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Bold and NCT are the only markup the assistant emits; split on both at once
  // so a bolded NCT still becomes a badge.
  const parts = text.split(/(\*\*[^*]+\*\*|NCT\d{8,})/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (/^NCT\d{8,}$/.test(part)) {
      return (
        <span
          key={`${keyPrefix}-${i}`}
          className="mx-0.5 inline-block align-middle"
        >
          <TrialBadge nct={part} />
        </span>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold">
          {renderInline(part.slice(2, -2), `${keyPrefix}-${i}`)}
        </strong>
      );
    }
    return (
      <React.Fragment key={`${keyPrefix}-${i}`}>
        {part.replace(/\*\*/g, '')}
      </React.Fragment>
    );
  });
}

function ChatLine({ line, index }: { line: string; index: number }) {
  if (!line.trim()) return <div className="h-2" />;

  // Remove bold around an NCT before locating it, so `- **NCT…** — city` reads
  // as a list row rather than a sentence with markup in it.
  const normalized = line.replace(/\*\*(NCT\d{8,})\*\*/g, '$1');
  const match = normalized.match(/NCT\d{8,}/);

  if (match) {
    const idx = normalized.indexOf(match[0]);
    const before = stripMarkdown(normalized.slice(0, idx));
    const after = stripMarkdown(normalized.slice(idx + match[0].length));
    const bullet = /^\s*(?:[-*•]|\d+\.)\s+/.test(normalized);

    if (bullet || !before) {
      return (
        <div className="flex items-start gap-2">
          <span className="shrink-0">
            <TrialBadge nct={match[0]} context={after || undefined} />
          </span>
          {after && (
            <span className="min-w-0 text-[14px] leading-6">
              {renderInline(after, `line-${index}`)}
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <p className="text-[14px] leading-6">
      {renderInline(line, `line-${index}`)}
    </p>
  );
}

export function ChatMessageBody({ content }: { content: string }) {
  return (
    <div className="space-y-1">
      {content.split('\n').map((line, i) => (
        <ChatLine key={i} line={line} index={i} />
      ))}
    </div>
  );
}
