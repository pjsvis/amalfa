/**
 * THE REFINED SWITCH
 * Uses native <button> to satisfy Biome and inherit focus.
 */
export const ToggleSwitch = ({ id, label, persist = false }: any) => {
  const compId = `switch_${id}`;
  return (
    <button
      type="button"
      id={compId}
      data-component="switch"
      data-state="off"
      data-persist={persist ? "true" : "false"}
      role="switch"
      aria-checked="false"
      class="flex items-center gap-2ch cursor-pointer select-none mb-1lh p-0 bg-transparent border-none text-fg font-mono focus:outline-p-yellow"
      onclick="
        const s = this.dataset.state === 'on' ? 'off' : 'on';
        this.dataset.state = s;
        this.setAttribute('aria-checked', s === 'on' ? 'true' : 'false');
      "
    >
      <style>{`
        #${compId} .track {
          width: 6ch;
          height: 1lh;
          border: 1px solid var(--color-border);
          position: relative;
          background: rgba(0,0,0,0.2);
        }
        #${compId}[data-state="on"] .thumb {
          left: 3ch;
          background: var(--color-p-green);
        }
        #${compId} .thumb {
          width: 3ch;
          height: calc(1lh - 2px);
          background: var(--color-border);
          position: absolute;
          left: 0;
          transition: all 0.1s steps(4);
        }
      `}</style>
      <span class="w-15ch font-bold uppercase text-xs text-left">{label}</span>
      <div
        class="track"
        aria-hidden="true"
      >
        <div class="thumb"></div>
      </div>
    </button>
  );
};

/**
 * THE REFINED DIAL
 * Buttons for steppers to ensure full keyboard/linter compliance.
 */
export const NumericDial = ({
  id,
  label,
  min = 0,
  max = 100,
  step = 5,
}: any) => {
  const compId = `dial_${id}`;
  return (
    <div
      id={compId}
      data-component="dial"
      data-value={min}
      class="flex items-center gap-2ch mb-1lh"
    >
      <style>{`
        #${compId} .val-display {
          width: 6ch;
          text-align: center;
          border: 1px solid var(--color-p-blue);
          color: var(--color-p-blue);
          font-weight: bold;
        }
        #${compId} button {
          cursor: pointer;
          background: var(--color-border);
          color: var(--color-bg);
          padding: 0 1ch;
          border: none;
          font-family: inherit;
        }
        #${compId} button:active { opacity: 0.7; }
        #${compId} button:focus { outline: 1px solid var(--color-p-yellow); }
      `}</style>
      <span class="w-15ch font-bold uppercase text-xs">{label}</span>
      <button
        type="button"
        onclick={`
          const p = this.parentElement;
          const v = Math.max(${min}, parseInt(p.dataset.value) - ${step});
          p.dataset.value = v;
          p.querySelector('.val-display').innerText = v;
        `}
      >
        -
      </button>
      <div
        class="val-display"
        aria-live="polite"
      >
        {min}
      </div>
      <button
        type="button"
        onclick={`
          const p = this.parentElement;
          const v = Math.min(${max}, parseInt(p.dataset.value) + ${step});
          p.dataset.value = v;
          p.querySelector('.val-display').innerText = v;
        `}
      >
        +
      </button>
    </div>
  );
};
