import type { SkillScope, SkillSource } from '@/stores/useSkillsStore';

export type SkillLocationValue = 'user-kronoscode' | 'project-kronoscode' | 'user-agents' | 'project-agents';

export const SKILL_LOCATION_OPTIONS: Array<{
  value: SkillLocationValue;
  scope: SkillScope;
  source: SkillSource;
  label: string;
  description: string;
}> = [
  {
    value: 'user-kronoscode',
    scope: 'user',
    source: 'kronoscode',
    label: 'User / KronosCode',
    description: 'Global KronosCode config location',
  },
  {
    value: 'project-kronoscode',
    scope: 'project',
    source: 'kronoscode',
    label: 'Project / KronosCode',
    description: 'Current project .kronoscode location',
  },
  {
    value: 'user-agents',
    scope: 'user',
    source: 'agents',
    label: 'User / Agents',
    description: 'Global .agents compatibility location',
  },
  {
    value: 'project-agents',
    scope: 'project',
    source: 'agents',
    label: 'Project / Agents',
    description: 'Current project .agents compatibility location',
  },
];

export function locationValueFrom(scope: SkillScope, source: SkillSource): SkillLocationValue {
  if (scope === 'project' && source === 'agents') return 'project-agents';
  if (scope === 'project') return 'project-kronoscode';
  if (source === 'agents') return 'user-agents';
  return 'user-kronoscode';
}

export function locationPartsFrom(value: SkillLocationValue): { scope: SkillScope; source: SkillSource } {
  const match = SKILL_LOCATION_OPTIONS.find((option) => option.value === value);
  if (!match) {
    return { scope: 'user', source: 'kronoscode' };
  }
  return { scope: match.scope, source: match.source };
}

export function locationLabel(scope: SkillScope, source: SkillSource): string {
  const match = SKILL_LOCATION_OPTIONS.find((option) => option.scope === scope && option.source === source);
  return match?.label || `${scope} / ${source}`;
}
