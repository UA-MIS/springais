/**
 * Custom Joyride tooltip component (Story 2.1).
 *
 * Renders Cedric's avatar sprite + speech bubble as the walkthrough tooltip.
 * Architecture Section 4: tooltipComponent prop for react-joyride.
 */

import type { TooltipRenderProps } from 'react-joyride';
import { useTheme } from '../../context/ThemeContext';
import { useAdventureMode } from '../../context/AdventureModeContext';
import { AnimationState } from '../../context/CedricContext';
import { getCedricText, WALKTHROUGH_MESSAGES } from './cedricMessages';
import { TOTAL_STEPS } from './walkthroughSteps';
import type { WalkthroughStepData } from './walkthroughSteps';
import AvatarSprite from './AvatarSprite';
import SpeechBubble from './SpeechBubble';

export default function CedricTooltip({
  step,
  index,
  tooltipProps,
  skipProps,
}: TooltipRenderProps) {
  const { theme, isGame } = useTheme();
  const { state: adventureState } = useAdventureMode();

  const stepData = step.data as WalkthroughStepData | undefined;
  const avatarState = stepData?.avatarState ?? AnimationState.Pointing;
  const adventureEnabled = adventureState.enabled;
  const speechTheme = isGame ? 'game' : theme === 'dark' ? 'dark' : 'light';

  // Prefer message from cedricMessages catalogue; fall back to step.content
  const dialogueVariant = WALKTHROUGH_MESSAGES.steps[index];
  const messageText = dialogueVariant
    ? getCedricText(dialogueVariant, adventureEnabled)
    : (step.content as string);

  return (
    <div
      {...tooltipProps}
      data-testid="cedric-walkthrough-tooltip"
      style={{
        maxWidth: 340,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {/* Step progress indicator */}
      <div
        data-testid="step-progress"
        style={{
          fontSize: 12,
          color: '#d4a843',
          fontFamily: isGame ? "'Cinzel', serif" : 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <span>
          Step {index + 1}/{TOTAL_STEPS}
        </span>
        <button
          {...skipProps}
          data-testid="skip-tutorial-button"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            color: '#888',
            textDecoration: 'underline',
            padding: '2px 4px',
          }}
        >
          Skip Tutorial
        </button>
      </div>

      {/* Speech bubble with walkthrough text */}
      <SpeechBubble
        message={{
          id: `walkthrough-step-${index}`,
          text: messageText,
          priority: 'walkthrough',
          typing: true,
          duration: 0,
          dismissible: false,
          suppressible: false,
        }}
        theme={speechTheme}
        onDismiss={() => {}}
        position="above"
      />

      {/* Avatar sprite */}
      <AvatarSprite
        size={128}
        equippedItems={{}}  /* New user during walkthrough -- no equipment yet */
        animationState={avatarState}
        colorPalette={null}
        level={adventureState.level}
        showPedestal={true}
        showNameplate={false}
      />
    </div>
  );
}
