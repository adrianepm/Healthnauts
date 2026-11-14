import { AlertTriangle, CircleHelp, Clock, Info, ShieldAlert } from 'lucide-react';
import type { ApiAssessment } from '../services/api';

export function assessmentState(assessment?: ApiAssessment, hasMeasurement = false) {
  if (assessment?.status === 'stale') return { text: 'Older measurement', tone: 'neutral', icon: Clock };
  if (assessment?.level === 'risk') return { text: 'Demonstration risk', tone: 'risk', icon: ShieldAlert };
  if (assessment?.level === 'attention') return { text: 'Demonstration attention', tone: 'attention', icon: AlertTriangle };
  switch (assessment?.status) {
    case 'insufficient_data': return { text: 'Insufficient data', tone: 'neutral', icon: CircleHelp };
    case 'baseline_insufficient': return { text: 'Personal reference unavailable', tone: 'neutral', icon: CircleHelp };
    case 'awaiting_follow_up': return { text: 'Waiting for follow-up', tone: 'neutral', icon: Clock };
    case 'no_data': return { text: 'No records', tone: 'neutral', icon: CircleHelp };
    case 'baseline_collecting': return { text: 'Building personal reference', tone: 'neutral', icon: Clock };
    case 'not_applicable': return { text: 'Classification unavailable', tone: 'neutral', icon: Info };
    case 'no_demonstrative_signal': return { text: 'No demonstration signal', tone: 'neutral', icon: Info };
    case 'assessed': return { text: 'Assessment recorded', tone: 'neutral', icon: Info };
    default: return { text: hasMeasurement ? 'Classification unavailable' : 'No records', tone: 'neutral', icon: CircleHelp };
  }
}

export function DesignStatus({ assessment, hasMeasurement }: { assessment?: ApiAssessment; hasMeasurement?: boolean }) {
  const { icon: Icon, text, tone } = assessmentState(assessment, hasMeasurement);
  return <span className="design-status" data-tone={tone}><Icon size={15} aria-hidden="true" />{text}</span>;
}
