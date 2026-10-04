"use client";

import { useEffect, useRef, useState } from "react";

import { IconMic, IconStop } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface AiVoiceInputProps {
  /** Called with the recording when the person stops. Transcribe it on your side. */
  onRecorded: (audio: Blob) => Promise<void> | void;
  /** Longest recording in seconds; it stops itself there. */
  maxSeconds?: number;
  label?: string;
  className?: string;
}

/**
 * Talk instead of type: one round button that records from the microphone,
 * a live level meter drawn from the real input, the elapsed time, and stop.
 * The browser asks for permission first; a refusal is explained in words
 * and the button stays usable to try again.
 */
export function AiVoiceInput({ onRecorded, maxSeconds = 120, label = "Record a voice message", className }: AiVoiceInputProps) {
  const [state, setState] = useState<"idle" | "recording" | "sending" | "denied">("idle");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: 24 }, () => 0.08));
  const recorder = useRef<MediaRecorder | null>(null);
  const stopAll = useRef<() => void>(() => undefined);
  useEffect(() => () => stopAll.current(), []);
  useEffect(() => {
    if (state !== "recording") return;
    const timer = setInterval(() => setSeconds((value) => {
      if (value + 1 >= maxSeconds) recorder.current?.stop();
      return value + 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [state, maxSeconds]);
  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 64;
      context.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let frame = 0;
      const draw = () => {
        analyser.getByteFrequencyData(data);
        setLevels(Array.from({ length: 24 }, (_, i) => Math.max(0.08, (data[i] ?? 0) / 255)));
        frame = requestAnimationFrame(draw);
      };
      draw();
      const chunks: Blob[] = [];
      const media = new MediaRecorder(stream);
      media.ondataavailable = (event) => chunks.push(event.data);
      media.onstop = async () => {
        stopAll.current();
        setState("sending");
        try {
          await onRecorded(new Blob(chunks, { type: media.mimeType }));
        } finally {
          setState("idle");
          setSeconds(0);
        }
      };
      stopAll.current = () => {
        cancelAnimationFrame(frame);
        stream.getTracks().forEach((track) => track.stop());
        void context.close();
        setLevels(Array.from({ length: 24 }, () => 0.08));
      };
      recorder.current = media;
      media.start();
      setState("recording");
    } catch {
      setState("denied");
    }
  }
  const recording = state === "recording";
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <div data-slot="ai-voice-input" className={cn("inline-flex items-center gap-4 rounded-full border border-border bg-background p-2 pr-5", className)}>
      <button
        type="button"
        onClick={() => (recording ? recorder.current?.stop() : void start())}
        disabled={state === "sending"}
        aria-label={recording ? "Stop recording" : label}
        aria-pressed={recording}
        className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 [&_svg]:size-5", recording ? "bg-destructive text-destructive-foreground" : "bg-foreground text-background")}
      >
        {recording ? <IconStop /> : <IconMic />}
      </button>
      <span aria-hidden="true" className="flex h-8 items-center gap-[3px]">
        {levels.map((level, index) => <span key={index} className="w-[3px] rounded-full bg-foreground/70 transition-[height] duration-75" style={{ height: `${level * 100}%` }} />)}
      </span>
      <span role="status" className="min-w-16 text-sm text-muted-foreground tabular-nums">
        {state === "recording" ? time : state === "sending" ? "Sending…" : state === "denied" ? "Microphone blocked" : "Tap to talk"}
      </span>
    </div>
  );
}
