import { Mic, MicOff, Square, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';

export default function VoiceRecorder({
  isRecording,
  recordingDuration,
  isTranscribing,
  micError,
  onStart,
  onStop,
  onClear,
  hasContent,
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Record / Stop Button */}
          {isRecording ? (
            <button
              type="button"
              onClick={onStop}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/25 hover:bg-rose-400 active:scale-95 transition-all cursor-pointer animate-pulse"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Stop Recording ({formatTime(recordingDuration)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500/15 border border-sky-500/40 px-4 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500/25 hover:border-sky-500 active:scale-95 transition-all cursor-pointer"
            >
              <Mic className="h-3.5 w-3.5 text-sky-400" />
              <span>Start Recording</span>
            </button>
          )}

          {/* Transcribing Indicator */}
          {isTranscribing && (
            <span className="flex items-center gap-1.5 text-xs text-sky-400 font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Transcribing audio...</span>
            </span>
          )}
        </div>

        {/* Clear Button */}
        {hasContent && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear Answer</span>
          </button>
        )}
      </div>

      {/* Mic permission warning */}
      {micError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <p className="leading-relaxed">{micError}</p>
        </div>
      )}
    </div>
  );
}
