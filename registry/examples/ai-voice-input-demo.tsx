"use client";

import { useState } from "react";

import { AiVoiceInput } from "@rhs-ui/application/ai-voice-input";

export default function Demo(): React.JSX.Element {
  const [size, setSize] = useState<number | null>(null);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-10">
      <AiVoiceInput onRecorded={(audio) => new Promise<void>((resolve) => setTimeout(() => { setSize(audio.size); resolve(); }, 500))} />
      <p className="text-xs text-muted-foreground">{size === null ? "Your browser asks for the microphone first." : `Recorded ${Math.round(size / 1024)} KB, ready to transcribe.`}</p>
    </div>
  );
}
