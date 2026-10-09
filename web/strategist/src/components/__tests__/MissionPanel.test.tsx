import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import MissionPanel from '../MissionPanel';

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('MissionPanel', () => {
  it('starts with all five phases closed', () => {
    render(<MissionPanel />);
    expect(screen.getAllByRole('button', { name: /fase|phase/i })).toHaveLength(5);
    expect(document.querySelector('.gate-card strong')).toBeNull();
  });

  it('keeps only one phase open at a time', () => {
    render(<MissionPanel />);
    const phases = screen.getAllByRole('button', { name: /fase|phase/i });
    fireEvent.click(phases[0]);
    expect(screen.getByText('Prompt Intake')).toBeTruthy();
    fireEvent.click(phases[1]);
    expect(screen.getByText('Dossier Builder')).toBeTruthy();
    expect(screen.queryByText('Prompt Intake')).toBeNull();
  });

  it('renders Approval Gate details when its phase opens', () => {
    render(<MissionPanel />);
    fireEvent.click(screen.getAllByRole('button', { name: /fase|phase/i })[2]);
    expect(document.querySelector('.gate-panel-visual')).toBeTruthy();
    expect(screen.getByText(/REQUER/)).toBeTruthy();
  });

  it('supports English initialization and language events', async () => {
    localStorage.setItem('strategist_console_lang', 'en');
    render(<MissionPanel />);
    expect(screen.getByText('Mission flow')).toBeTruthy();

    await act(async () => {
      window.dispatchEvent(new CustomEvent('strategist:lang', { detail: 'en' }));
    });
    expect(screen.getAllByRole('button', { name: /phase/i })).toHaveLength(5);
  });

  it('falls back to Portuguese for a non-English language event', async () => {
    render(<MissionPanel />);
    await act(async () => {
      window.dispatchEvent(new CustomEvent('strategist:lang', { detail: 'fr' }));
    });
    expect(screen.getByText(/Fluxo da miss/)).toBeTruthy();
  });

  it('closes an open phase when its trigger is clicked again', () => {
    render(<MissionPanel />);
    const discovery = screen.getAllByRole('button', { name: /fase|phase/i })[0];
    fireEvent.click(discovery);
    expect(screen.getByText('Prompt Intake')).toBeTruthy();
    fireEvent.click(discovery);
    expect(screen.queryByText('Prompt Intake')).toBeNull();
  });

  it('opens a linked feature and dispatches the features tab event', () => {
    const events: string[] = [];
    window.addEventListener('strategist:tab', (event) => {
      events.push((event as CustomEvent).detail);
    });
    render(<MissionPanel />);
    fireEvent.click(screen.getAllByRole('button', { name: /fase|phase/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /tesouro/i }));
    expect(localStorage.getItem('strategist_console_feature')).toBe('treasure');
    expect(events).toContain('features');
  });

  it('renders empty detail groups for phases without tools or features', () => {
    render(<MissionPanel />);
    fireEvent.click(screen.getAllByRole('button', { name: /fase|phase/i })[4]);
    expect(document.querySelectorAll('.empty-note').length).toBeGreaterThanOrEqual(2);
  });
});
