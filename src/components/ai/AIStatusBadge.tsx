/**
 * AIStatusBadge
 * Shows "cached" or "live" result age indicator next to AI panel headers.
 */
import React from 'react';
import { Clock, Zap } from 'lucide-react';

interface Props {
  cached: boolean;
  analyzedAt?: string;
}

export function AIStatusBadge({ cached, analyzedAt }: Props) {
  const age = analyzedAt
    ? formatAge(new Date(analyzedAt))
    : null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 border border-slate-700">
      {cached ? (
        <>
          <Clock className="w-2.5 h-2.5 text-slate-400" />
          <span className="text-slate-400">{age ?? 'cached'}</span>
        </>
      ) : (
        <>
          <Zap className="w-2.5 h-2.5 text-emerald-400" />
          <span className="text-emerald-400">live</span>
        </>
      )}
    </span>
  );
}

function formatAge(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
