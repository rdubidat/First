import Leon from './Leon'
import { Bone, Pin, Minus, Collapse, Close, Sun, Moon, SoundOn, SoundOff } from './icons'
import { isElectron } from '../state/storage'

function Ctrl({ label, active, onClick, children, danger }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={[
        'no-drag grid h-7 w-7 place-items-center rounded-lg transition',
        'text-bark-500 dark:text-bark-300',
        'hover:scale-110 active:scale-95',
        danger
          ? 'hover:bg-red-500/15 hover:text-red-500'
          : 'hover:bg-leon-500/15 hover:text-leon-600 dark:hover:text-leon-300',
        active ? 'bg-leon-500/20 text-leon-600 dark:text-leon-300' : '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export default function TitleBar({
  streak,
  pinned,
  onTogglePin,
  isDark,
  onToggleTheme,
  soundOn,
  onToggleSound,
  onCompact,
}) {
  return (
    <header className="drag flex items-center gap-2 px-3 pt-3 pb-2">
      <div className="flex min-w-0 items-center gap-2">
        <Leon mood="happy" size={30} className="shrink-0 drop-shadow-sm" />
        <div className="min-w-0 leading-tight">
          <h1 className="truncate font-display text-[15px] font-extrabold text-bark-800 dark:text-leon-50">
            Growth Network Tasks
          </h1>
          {streak > 0 && (
            <p className="flex items-center gap-1 text-[11px] font-bold text-leon-600 dark:text-leon-300">
              <Bone size={12} />
              {streak} done today
            </p>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <Ctrl label={soundOn ? 'Mute sounds' : 'Unmute sounds'} onClick={onToggleSound}>
          {soundOn ? <SoundOn size={15} /> : <SoundOff size={15} />}
        </Ctrl>
        <Ctrl
          label={isDark ? 'Light theme' : 'Dark theme'}
          onClick={onToggleTheme}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </Ctrl>
        {isElectron && (
          <>
            <Ctrl
              label={pinned ? 'Unpin from top' : 'Pin on top'}
              active={pinned}
              onClick={onTogglePin}
            >
              <Pin size={15} />
            </Ctrl>
            <Ctrl label="Compact bubble" onClick={onCompact}>
              <Collapse size={15} />
            </Ctrl>
            <Ctrl label="Minimize" onClick={() => window.gnt.minimize()}>
              <Minus size={15} />
            </Ctrl>
            <Ctrl label="Hide to tray" danger onClick={() => window.gnt.hide()}>
              <Close size={15} />
            </Ctrl>
          </>
        )}
      </div>
    </header>
  )
}
