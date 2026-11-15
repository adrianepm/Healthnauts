// Ferramentas de apoio do tópico Mind (do protótipo, sem as barras mock de contato social).
import { ChevronRight, Headphones, Heart, MessageSquare, Mic, Wind } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtDuration } from '../lib/format';
import { Card, SourcesList } from './ui';

export function SupportTools() {
  const link = useStore((s) => s.overview?.link);
  const reply = link?.status === 'unavailable' ? 'No Earth link' : link?.estimatedResponseSeconds ? `Reply in ~${fmtDuration(link.estimatedResponseSeconds)}` : 'Async';
  const tools = [
    { icon: Wind, title: 'Guided breathing', sub: 'Relaxation exercise', tag: '4 min' },
    { icon: Mic, title: 'Private voice journal', sub: 'Only you can open it', tag: 'Anytime' },
    { icon: Heart, title: 'Recorded message to family', sub: 'Stay connected', tag: 'Async' },
    { icon: MessageSquare, title: 'Private message to the flight surgeon', sub: 'Confidential clinical support', tag: reply },
    { icon: Headphones, title: 'Music and mindfulness', sub: 'Focus and rest', tag: '15 min' },
  ];
  return (
    <Card title="Support tools" sub="Self-care actions from NASA's isolation guidance (C-O-N-N-E-C-T)" icon={<Heart size={18} />}>
      <ul className="space-y-2">
        {tools.map(({ icon: Icon, title, sub, tag }) => (
          <li key={title} className="w-full flex items-center gap-3 rounded-md border border-space-line bg-space-deep/60 p-3">
            <span className="w-9 h-9 rounded-lg bg-space-card grid place-items-center text-slate-300"><Icon size={16} /></span>
            <span className="flex-1"><span className="block text-sm text-slate-100">{title}</span><span className="block text-xs text-slate-400">{sub}</span></span>
            <span className="chip border-space-line text-slate-400 normal-case">{tag}</span>
            <ChevronRight size={16} className="text-slate-500" />
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mt-3">Flight surgeon reply time = 2 × one-way delay + about 15 min to review. Prototype: these tools are placeholders.</p>
      <SourcesList ids={['s33', 's15']} />
    </Card>
  );
}
