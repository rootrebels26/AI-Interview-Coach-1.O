import { useState, useRef, useEffect, useCallback } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

export default function useCameraMonitor() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [postureAlert, setPostureAlert] = useState('');
  const [personAlert, setPersonAlert] = useState('');
  const [detectedFacesCount, setDetectedFacesCount] = useState(0);
  const [postureStatus, setPostureStatus] = useState('Off'); // 'Good' | 'Adjust' | 'Off'

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const animFrameRef = useRef(null);

  // Grace period tracking refs
  const downwardTiltStartRef = useRef(null);
  const offCenterStartRef = useRef(null);
  const lastDetectionTimeRef = useRef(0);

  // Initialize MediaPipe FaceDetector
  useEffect(() => {
    let isMounted = true;

    const initDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm'
        );
        if (!isMounted) return;

        // Try GPU delegate first, fallback gracefully to CPU if unsupported
        let detector;
        try {
          detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
          });
        } catch (gpuErr) {
          console.warn('GPU delegate failed, initializing MediaPipe with CPU:', gpuErr);
          detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
          });
        }

        if (isMounted) {
          detectorRef.current = detector;
        }
      } catch (err) {
        console.warn('MediaPipe FaceDetector initialization note:', err);
      }
    };

    initDetector();

    return () => {
      isMounted = false;
      try {
        detectorRef.current?.close();
      } catch (_) {}
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setPostureStatus('Off');
    setPostureAlert('');
    setPersonAlert('');
    setDetectedFacesCount(0);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    setPostureAlert('');
    setPersonAlert('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setIsCameraActive(true);
      setPostureStatus('Good');
    } catch (err) {
      console.error('Camera access denied or failed:', err);
      setCameraError('Camera access was denied or is unavailable. Camera analysis is entirely optional.');
      stopCamera();
    }
  }, [stopCamera]);

  // Ensure stream is attached to video element once mounted in DOM
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isCameraActive]);

  // Video frame evaluation loop
  useEffect(() => {
    if (!isCameraActive) return;

    let isRunning = true;

    const processFrame = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const detector = detectorRef.current;
      const now = performance.now();

      // Run detector ~5 times per second to save CPU/battery
      if (video && detector && video.readyState >= 2 && now - lastDetectionTimeRef.current > 200) {
        lastDetectionTimeRef.current = now;

        try {
          const detections = detector.detectForVideo(video, Math.round(now)).detections || [];
          const count = detections.length;
          setDetectedFacesCount(count);

          // 1. Multiple-Person Detection
          if (count > 1) {
            setPersonAlert('Another person is visible in your camera frame.');
          } else {
            setPersonAlert('');
          }

          // 2. Posture & Head Orientation Monitoring
          if (count === 1) {
            const face = detections[0];
            const box = face.boundingBox;

            // Normalized coordinates (0 to 1)
            const videoWidth = video.videoWidth || 640;
            const videoHeight = video.videoHeight || 480;

            const centerY = (box.originY + box.height / 2) / videoHeight;
            const centerX = (box.originX + box.width / 2) / videoWidth;

            // Check downward head tilt (face center shifted significantly down in frame)
            const isDownward = centerY > 0.65;
            // Check whether candidate is facing away/off-center
            const isOffCenter = centerX < 0.2 || centerX > 0.8;

            // Grace period: require prolonged posture deviation (>= 4 seconds)
            if (isDownward) {
              if (!downwardTiltStartRef.current) {
                downwardTiltStartRef.current = Date.now();
              } else if (Date.now() - downwardTiltStartRef.current > 4000) {
                setPostureAlert('Your head has been tilted down for a while.');
                setPostureStatus('Adjust Posture');
              }
            } else {
              downwardTiltStartRef.current = null;
            }

            if (isOffCenter) {
              if (!offCenterStartRef.current) {
                offCenterStartRef.current = Date.now();
              } else if (Date.now() - offCenterStartRef.current > 4000) {
                setPostureAlert('Please look towards the camera.');
                setPostureStatus('Adjust Posture');
              }
            } else {
              offCenterStartRef.current = null;
            }

            if (!isDownward && !isOffCenter) {
              setPostureAlert('');
              setPostureStatus('Good');
            }
          } else if (count === 0) {
            setPostureAlert('Try to maintain an upright posture facing the camera.');
            setPostureStatus('Adjust Posture');
          }
        } catch (_) {}
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isCameraActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    isCameraActive,
    cameraError,
    postureAlert,
    personAlert,
    detectedFacesCount,
    postureStatus,
    videoRef,
    startCamera,
    stopCamera,
  };
}
