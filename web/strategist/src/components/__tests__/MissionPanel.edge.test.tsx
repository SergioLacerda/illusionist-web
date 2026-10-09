import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../data/architecture', () => ({
  MISSION_PHASES: [
    {
      id: 'empty',
      glyph: '?',
      number: '99',
      title: { pt: 'Vazio', en: 'Empty' },
      who: { pt: 'Mystery', en: 'Mystery' },
      description: { pt: 'Sem detalhes', en: 'No details' },
      roles: [],
      tools: [],
      features: [],
      artifacts: [],
      rules: [],
      gate: true,
    },
  ],
}));

import MissionPanel from '../MissionPanel';

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('MissionPanel edge states', () => {
  it('renders empty roles, tools, features, artifacts and rules', async () => {
    render(<MissionPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Vazio/ }));
    expect(document.querySelectorAll('.empty-note')).toHaveLength(5);
    expect(screen.queryByText('Humano')).toBeNull();

    await act(async () => {
      window.dispatchEvent(new CustomEvent('strategist:lang', { detail: 'en' }));
    });
    expect(screen.getByText('REQUIRES ::')).toBeTruthy();
  });
});
