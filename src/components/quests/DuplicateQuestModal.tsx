import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Icon } from '../common/Icon';
import type { Goal } from '../../types';

export function DuplicateQuestModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const duplicateQuest = useAppStore((s) => s.duplicateQuest);
  const questSteps = useAppStore((s) => s.questSteps);
  const [location, setLocation] = useState('');
  const [title, setTitle] = useState(goal.title);

  const stepCount = questSteps.filter((s) => s.goalId === goal.id).length;
  const canSubmit = location.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    await duplicateQuest(goal.id, location, title);
    onClose();
  }

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-4 sm:items-center"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        className="w-full max-w-md rounded-2xl border-2 border-border bg-white p-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Run this again somewhere new</h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text">
            <Icon name="x" />
          </button>
        </div>
        <p className="mb-4 text-sm text-text-secondary">
          Copies all {stepCount} steps, unchecked, as a fresh quest.
        </p>

        <label className="mb-1 block text-sm text-text-secondary">Country or place</label>
        <input
          autoFocus
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Portugal"
          className="mb-4 w-full rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold outline-none focus:border-[color:var(--empire)]"
        />

        <label className="mb-1 block text-sm text-text-secondary">Name</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-5 w-full rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold outline-none focus:border-[color:var(--empire)]"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full btn3d py-3 font-heading text-base"
        >
          Create quest
        </button>
      </motion.form>
    </motion.div>
  );
}
