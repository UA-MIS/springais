import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import WalkthroughOverlay from './WalkthroughOverlay';
import { WALKTHROUGH_STEPS, TOTAL_STEPS } from './walkthroughSteps';
import type { WalkthroughStepData } from './walkthroughSteps';

// Capture the Joyride props to validate configuration
let capturedJoyrideProps: Record<string, unknown> | null = null;

vi.mock('react-joyride', () => ({
  default: (props: Record<string, unknown>) => {
    capturedJoyrideProps = props;
    return <div data-testid="mock-joyride" />;
  },
  STATUS: { FINISHED: 'finished', RUNNING: 'running', PAUSED: 'paused', SKIPPED: 'skipped' },
  ACTIONS: { SKIP: 'skip', NEXT: 'next', PREV: 'prev', CLOSE: 'close' },
}));

function renderOverlay(ui: React.ReactElement) {
  return render(ui);
}

describe('WalkthroughOverlay (Story 2.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedJoyrideProps = null;
  });

  it('renders nothing when not active', () => {
    const { container } = renderOverlay(
      <WalkthroughOverlay
        isActive={false}
        currentStep={0}
        onStepComplete={vi.fn()}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders Joyride when active', () => {
    renderOverlay(
      <WalkthroughOverlay
        isActive={true}
        currentStep={0}
        onStepComplete={vi.fn()}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    expect(capturedJoyrideProps).not.toBeNull();
  });

  it('passes correct Joyride configuration', () => {
    renderOverlay(
      <WalkthroughOverlay
        isActive={true}
        currentStep={2}
        onStepComplete={vi.fn()}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    expect(capturedJoyrideProps).not.toBeNull();
    expect(capturedJoyrideProps!.run).toBe(true);
    expect(capturedJoyrideProps!.stepIndex).toBe(2);
    expect(capturedJoyrideProps!.continuous).toBe(false);
    expect(capturedJoyrideProps!.disableOverlayClose).toBe(true);
    expect(capturedJoyrideProps!.disableCloseOnEsc).toBe(true);
    expect(capturedJoyrideProps!.spotlightClicks).toBe(true);
    expect(capturedJoyrideProps!.scrollToFirstStep).toBe(true);
    expect(capturedJoyrideProps!.showSkipButton).toBe(true);
  });

  it('sets zIndex to 45 (above HUD, below modals)', () => {
    renderOverlay(
      <WalkthroughOverlay
        isActive={true}
        currentStep={0}
        onStepComplete={vi.fn()}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    const styles = capturedJoyrideProps!.styles as Record<string, Record<string, unknown>>;
    expect(styles.options.zIndex).toBe(45);
  });

  it('sets overlay background to semi-transparent black', () => {
    renderOverlay(
      <WalkthroughOverlay
        isActive={true}
        currentStep={0}
        onStepComplete={vi.fn()}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    const styles = capturedJoyrideProps!.styles as Record<string, Record<string, unknown>>;
    expect(styles.overlay.backgroundColor).toBe('rgba(0, 0, 0, 0.6)');
  });

  it('passes WALKTHROUGH_STEPS as steps', () => {
    renderOverlay(
      <WalkthroughOverlay
        isActive={true}
        currentStep={0}
        onStepComplete={vi.fn()}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    expect(capturedJoyrideProps!.steps).toBe(WALKTHROUGH_STEPS);
  });

  it('has custom tooltipComponent', () => {
    renderOverlay(
      <WalkthroughOverlay
        isActive={true}
        currentStep={0}
        onStepComplete={vi.fn()}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    expect(capturedJoyrideProps!.tooltipComponent).toBeDefined();
    expect(typeof capturedJoyrideProps!.tooltipComponent).toBe('function');
  });

  describe('handleCallback', () => {
    it('calls only onStepComplete on step:after (B2 fix: no reward dispatch)', () => {
      const onStepComplete = vi.fn();
      const onComplete = vi.fn();
      const onSkip = vi.fn();
      renderOverlay(
        <WalkthroughOverlay
          isActive={true}
          currentStep={0}
          onStepComplete={onStepComplete}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      );

      const callback = capturedJoyrideProps!.callback as (data: Record<string, unknown>) => void;
      callback({ action: 'next', status: 'running', index: 0, type: 'step:after' });

      // B2: Only onStepComplete is called. Rewards are dispatched by
      // CedricContext.completeCurrentStep, not WalkthroughOverlay.
      expect(onStepComplete).toHaveBeenCalledWith(0);
      expect(onComplete).not.toHaveBeenCalled();
      expect(onSkip).not.toHaveBeenCalled();
    });

    it('calls onComplete when status is finished', () => {
      const onComplete = vi.fn();
      renderOverlay(
        <WalkthroughOverlay
          isActive={true}
          currentStep={6}
          onStepComplete={vi.fn()}
          onComplete={onComplete}
          onSkip={vi.fn()}
        />
      );

      const callback = capturedJoyrideProps!.callback as (data: Record<string, unknown>) => void;
      callback({ action: 'next', status: 'finished', index: 6, type: 'tour:end' });

      expect(onComplete).toHaveBeenCalled();
    });

    it('calls onSkip when action is skip', () => {
      const onSkip = vi.fn();
      renderOverlay(
        <WalkthroughOverlay
          isActive={true}
          currentStep={2}
          onStepComplete={vi.fn()}
          onComplete={vi.fn()}
          onSkip={onSkip}
        />
      );

      const callback = capturedJoyrideProps!.callback as (data: Record<string, unknown>) => void;
      callback({ action: 'skip', status: 'skipped', index: 2, type: 'tour:end' });

      expect(onSkip).toHaveBeenCalled();
    });
  });
});

describe('WALKTHROUGH_STEPS', () => {
  it('has exactly 7 steps', () => {
    expect(WALKTHROUGH_STEPS).toHaveLength(TOTAL_STEPS);
    expect(TOTAL_STEPS).toBe(7);
  });

  it('all steps have valid WalkthroughStepData', () => {
    for (const step of WALKTHROUGH_STEPS) {
      const data = step.data as WalkthroughStepData;
      expect(data.avatarState).toBeDefined();
      expect(data.completionDetection).toBeDefined();
      expect(typeof data.rewardXP).toBe('number');
      expect(typeof data.rewardGold).toBe('number');
    }
  });
});
