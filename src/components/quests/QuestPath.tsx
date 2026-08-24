import { motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { playCompleteChime } from '../../lib/sound';
import { Icon } from '../common/Icon';
import { statFill, statInk } from '../../types';
import type { Goal, QuestStep, Stat } from '../../types';

/**
 * A quest drawn as a journey rather than a checklist. Steps sit as nodes on a
 * winding track: done behind you, the next one raised and pulsing, the rest
 * dimmed ahead. It makes a fifteen-step build feel like ground being covered.
 */
export function QuestPath({
  goal,
  steps,
  stat,
}: {
  goal: Goal;
  steps: QuestStep[];
  stat: Stat | undefined;
}) {
  const toggleQuestStep = useAppStore((s) => s.toggleQuestStep);
  // CSS alone cannot stop a JS-driven loop, so the preference is read here too.
  const reduceMotion = useReducedMotion();
  const fill = stat ? statFill(stat.name) : 'var(--accent)';
  const ink = stat ? statInk(stat.name) : 'var(--accent-ink)';
  const nextIndex = steps.findIndex((s) => !s.done);

  function handle(step: QuestStep) {
    if (!step.done) playCompleteChime();
    toggleQuestStep(step.id);
  }

  return (
    <ol className="relative mx-auto max-w-md list-none px-2 py-2">
      {steps.map((step, i) => {
        // Gentle serpentine so the eye travels rather than scanning a column.
        // The node moves inside a fixed lane; the label lives in the remaining
        // space, so the wander can never push text past the card edge.
        const offset = Math.sin(i * 0.85) * 26;
        const isNext = i === nextIndex;
        const locked = nextIndex !== -1 && i > nextIndex;

        return (
          <li key={step.id} className="relative flex items-center gap-3 py-2.5">
            <div
              className="flex w-[92px] shrink-0 justify-center"
              style={{ transform: `translateX(${offset}px)` }}
            >
              <motion.button
                onClick={() => handle(step)}
                className="press relative grid place-items-center rounded-full"
                aria-label={`${step.title}${step.done ? ' — done' : ''}`}
                style={{
                  width: isNext ? 68 : 56,
                  height: isNext ? 68 : 56,
                  background: step.done ? 'var(--success)' : locked ? '#E5E5E5' : fill,
                  borderBottom: `5px solid ${
                    step.done ? 'var(--success-ink)' : locked ? '#D4D4D4' : ink
                  }`,
                  opacity: locked ? 0.75 : 1,
                }}
                animate={isNext && !reduceMotion ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={{ duration: 1.6, repeat: isNext && !reduceMotion ? Infinity : 0, ease: 'easeInOut' }}
              >
                {step.done ? (
                  <Icon name="check" width={30} height={30} strokeWidth={4} className="text-white" />
                ) : (
                  <span
                    className="font-heading text-xl font-extrabold"
                    style={{ color: locked ? '#AFAFAF' : '#fff' }}
                  >
                    {i + 1}
                  </span>
                )}

                {isNext && !reduceMotion && (
                  <motion.span
                    className="pointer-events-none absolute -inset-1.5 rounded-full border-4"
                    style={{ borderColor: fill }}
                    animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.25, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </motion.button>
            </div>

            <span
              className={`min-w-0 flex-1 text-sm font-bold leading-snug ${
                step.done ? 'text-text-tertiary line-through' : 'text-text'
              }`}
            >
              {step.title}
              {isNext && (
                <span
                  className="ml-1.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-extrabold text-white"
                  style={{ background: fill }}
                >
                  NEXT
                </span>
              )}
            </span>
          </li>
        );
      })}

      <li className="flex justify-center pt-3">
        <div
          className="flex items-center gap-2 rounded-2xl border-2 border-b-4 px-4 py-2.5"
          style={{ borderColor: 'var(--border)', background: '#fff' }}
        >
          <Icon name="star" width={20} height={20} style={{ color: 'var(--content)' }} />
          <span className="text-sm font-extrabold text-text">
            {goal.title} complete — +{goal.xpValue} XP
          </span>
        </div>
      </li>
    </ol>
  );
}
