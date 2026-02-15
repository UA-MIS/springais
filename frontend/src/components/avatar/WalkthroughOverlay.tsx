/**
 * WalkthroughOverlay -- React Joyride wrapper (Story 2.1).
 *
 * Wraps react-joyride in controlled mode. CedricContext owns `stepIndex`
 * and `run` state. The custom tooltip renders CedricTooltip.
 *
 * Architecture Section 4: React Joyride Integration.
 * D-CA-006: React Joyride for walkthrough engine.
 */

import Joyride, { type CallbackData, STATUS, ACTIONS } from 'react-joyride';
import { WALKTHROUGH_STEPS } from './walkthroughSteps';
import CedricTooltip from './CedricTooltip';

export interface WalkthroughOverlayProps {
  isActive: boolean;
  currentStep: number;
  onStepComplete: (stepIndex: number) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export default function WalkthroughOverlay({
  isActive,
  currentStep,
  onStepComplete,
  onComplete,
  onSkip,
}: WalkthroughOverlayProps) {
  function handleCallback(data: CallbackData) {
    const { action, status, index, type } = data;

    if (type === 'step:after') {
      // B2 fix: Only notify parent. Reward dispatch + backend persistence
      // is handled by CedricContext.completeCurrentStep (single source of truth).
      onStepComplete(index);
    }

    if (status === STATUS.FINISHED) {
      onComplete();
    }

    if (action === ACTIONS.SKIP) {
      onSkip();
    }
  }

  if (!isActive) return null;

  return (
    <Joyride
      steps={WALKTHROUGH_STEPS}
      run={isActive}
      stepIndex={currentStep}
      continuous={false}
      scrollToFirstStep={true}
      showSkipButton={true}
      disableOverlayClose={true}
      disableCloseOnEsc={true}
      tooltipComponent={CedricTooltip}
      spotlightClicks={true}
      callback={handleCallback}
      styles={{
        options: {
          zIndex: 45,
          arrowColor: 'transparent',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
        },
      }}
    />
  );
}
