import { useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const DURATION_MS = 30_000;

const getSupportedMimeType = (): string => {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
};

const uploadWithRetry = async (blob: Blob, fileName: string, retries = 3): Promise<void> => {
  const mimeType = blob.type || 'video/webm';
  for (let i = 0; i < retries; i++) {
    const { error } = await supabase.storage
      .from('videos')
      .upload(fileName, blob, { contentType: mimeType });
    if (!error) return;
    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
};

export const useVideoRecorder = () => {
  const recorderRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef   = useRef<(() => void) | null>(null);

  const startAutoRecording = useCallback((videoElement: HTMLVideoElement) => {
    if (sessionStorage.getItem('session_recorded')) return;
    if (recorderRef.current?.state === 'recording') return;
    if (typeof MediaRecorder === 'undefined') return;

    // Get the live camera stream from the video element MediaPipe is using
    const stream = videoElement.srcObject as MediaStream;
    if (!stream || !stream.active) return;

    const mimeType = getSupportedMimeType();
    if (!mimeType) return;

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 1_500_000,
    });

    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onerror = () => cleanup();

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      if (blob.size < 50_000) return;

      const fileName = `sessions/${Date.now()}.webm`;
      sessionStorage.setItem('session_recorded', 'true');
      uploadWithRetry(blob, fileName).catch(() => {});
    };

    const onVisibilityChange = () => {
      if (document.hidden) cleanup();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    recorder.start(5_000);
    recorderRef.current = recorder;

    timerRef.current = setTimeout(() => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }, DURATION_MS);

    const cleanup = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
      recorderRef.current = null;
    };

    cleanupRef.current = cleanup;
  }, []);

  const stopRecording = useCallback(() => {
    cleanupRef.current?.();
  }, []);

  return { startAutoRecording, stopRecording };
};
