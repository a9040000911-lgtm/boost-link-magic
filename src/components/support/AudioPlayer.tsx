import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  name?: string;
}

export function AudioPlayer({ src, name }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [gainLevel, setGainLevel] = useState(1);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Web Audio API for amplification beyond 100%
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (!audioCtxRef.current) {
        const ctx = new AudioContext();
        const source = ctx.createMediaElementSource(audio);
        const gainNode = ctx.createGain();
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        audioCtxRef.current = ctx;
        gainNodeRef.current = gainNode;
        sourceRef.current = source;
      }
    } catch (e) {
      // Audio context already created
    }
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = gainLevel;
    }
  }, [gainLevel]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioCtxRef.current?.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    if (playing) {
      audio.pause();
    } else {
      await audio.play();
    }
    setPlaying(!playing);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2, 3, 4];
    const idx = speeds.indexOf(speed);
    const next = speeds[(idx + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const amplifyLabels = ["1x", "1.5x", "2x", "3x", "4x"];
  const amplifyValues = [1, 1.5, 2, 3, 4];

  const cycleAmplify = () => {
    const idx = amplifyValues.indexOf(gainLevel);
    const next = amplifyValues[(idx + 1) % amplifyValues.length];
    setGainLevel(next);
  };

  return (
    <div className="bg-muted/50 rounded-lg p-2 max-w-[280px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />
      {name && <p className="text-[10px] text-muted-foreground truncate mb-1">🎤 {name}</p>}
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={togglePlay}>
          {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </Button>

        <div className="flex-1 min-w-0">
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={0.1}
            onValueChange={([v]) => {
              if (audioRef.current) audioRef.current.currentTime = v;
              setCurrentTime(v);
            }}
            className="h-1"
          />
        </div>

        <span className="text-[9px] font-mono text-muted-foreground shrink-0">
          {formatTime(currentTime)}/{formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-5 text-[9px] px-1.5" onClick={cycleSpeed}>
            ×{speed}
          </Button>
          <Button
            variant={gainLevel > 1 ? "default" : "outline"}
            size="sm"
            className="h-5 text-[9px] px-1.5"
            onClick={cycleAmplify}
            title="Усиление громкости"
          >
            🔊{gainLevel > 1 ? ` ${gainLevel}x` : ""}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={() => setMuted(!muted)}
        >
          {muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        </Button>
      </div>

      {/* Hidden volume control */}
      {muted && audioRef.current && (audioRef.current.muted = true)}
      {!muted && audioRef.current && (audioRef.current.muted = false)}
    </div>
  );
}
