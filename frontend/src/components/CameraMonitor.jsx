import {
  Camera,
  CameraOff,
  Eye,
  Users,
  ShieldCheck,
  AlertTriangle,
  X,
  UserCheck,
} from 'lucide-react';

export default function CameraMonitor({
  isCameraActive,
  cameraError,
  postureAlert,
  personAlert,
  detectedFacesCount,
  postureStatus,
  videoRef,
  onStartCamera,
  onStopCamera,
  tabSwitchCount,
  showTabWarning,
  onDismissTabWarning,
}) {
  return (
    <div className="space-y-4">
      {/* Tab Switch Warning Banner */}
      {showTabWarning && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/15 p-4 text-xs text-amber-200 backdrop-blur-md shadow-lg animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-100">
                Warning: You switched away from the interview window.
              </p>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Tab switch count: <span className="font-mono font-bold text-white">{tabSwitchCount}</span>.
                Note: Browser visibility events detect when this window is hidden or loses focus, but cannot detect other application windows on separate monitors.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismissTabWarning}
            className="rounded-lg p-1 text-amber-400 hover:bg-amber-500/20 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Real-time Posture & Multi-Person Alerts */}
      {(postureAlert || personAlert) && isCameraActive && (
        <div className="space-y-2 animate-fadeIn">
          {personAlert && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-xs font-semibold text-rose-200">
              <Users className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{personAlert}</span>
            </div>
          )}

          {postureAlert && !personAlert && (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-xs font-semibold text-amber-200">
              <Eye className="h-4 w-4 text-amber-400 shrink-0" />
              <span>{postureAlert}</span>
            </div>
          )}
        </div>
      )}

      {/* Camera Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Optional Posture & Presence Monitor
            </span>
          </div>

          {/* Camera Toggle Button */}
          {isCameraActive ? (
            <button
              type="button"
              onClick={onStopCamera}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <CameraOff className="h-3.5 w-3.5" />
              <span>Turn Off Camera</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartCamera}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Enable Camera (Optional)</span>
            </button>
          )}
        </div>

        {/* Video Container (Always renders video element so videoRef is always attached) */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-slate-800">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover transform -scale-x-100 ${
              isCameraActive ? 'block' : 'hidden'
            }`}
          />

          {isCameraActive ? (
            /* In-Video Status Overlays */
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
              <span
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold backdrop-blur-md border ${
                  postureStatus === 'Good'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}
              >
                <UserCheck className="h-3 w-3" />
                <span>{postureStatus === 'Good' ? 'Upright Posture' : 'Adjust Posture'}</span>
              </span>

              <span
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold backdrop-blur-md border ${
                  detectedFacesCount === 1
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                    : detectedFacesCount > 1
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                <Users className="h-3 w-3" />
                <span>
                  {detectedFacesCount === 1
                    ? '1 Person in Frame'
                    : detectedFacesCount > 1
                    ? `${detectedFacesCount} People in Frame`
                    : 'Searching for Face...'}
                </span>
              </span>
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-slate-950/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-3">
                <CameraOff className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-slate-300">
                Camera is currently disabled
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                Enable the camera if you would like gentle real-time notifications on posture and presence during your answers.
              </p>
            </div>
          )}
        </div>

        {/* Camera Error Message */}
        {cameraError && (
          <p className="text-xs text-amber-400/90 leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            {cameraError}
          </p>
        )}

        {/* Strict Privacy Disclaimer */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>
            <strong>100% Private:</strong> Video is processed locally in your browser. Video frames are never recorded, saved, or uploaded.
          </span>
        </div>
      </div>
    </div>
  );
}
