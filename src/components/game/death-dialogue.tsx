"use client";

import { Accessibility, Eye, Flame, HeartCrack, Mic, Phone, PhoneCall, PhoneOff, RotateCcw, SendHorizontal, Skull, SlidersHorizontal, Volume2 } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { getLocalTtsState, loadLocalRecognizer, loadLocalTts, subscribeLocalTts, transcribeLocalAudio, type LocalTtsState, type VoiceModel, type VoiceModelProgress } from "@/utils/local-voice";

type Message = { role: "assistant" | "user"; content: string };
type ChatMode = "text" | "live";
type MicStatus = "unknown" | "requesting" | "granted" | "denied" | "unavailable" | "insecure";
type ModelSetupState = Omit<VoiceModelProgress, "status"> & { status: VoiceModelProgress["status"] | "waiting" | "ready" };
type VoiceSetupState = { open: boolean; loading: boolean; error: string; voice: ModelSetupState; transcription: ModelSetupState };
type AudioVolumes = { master: number; ambience: number; heartbeat: number; voice: number };
const defaultAudioVolumes: AudioVolumes = { master: 1, ambience: .48, heartbeat: .12, voice: .88 };
const waitingForModel: ModelSetupState = { status: "waiting" };
const volumeChannels: Array<{ key: keyof AudioVolumes; label: string }> = [
  { key: "master", label: "MASTER" },
  { key: "ambience", label: "AMBIENCE" },
  { key: "heartbeat", label: "HEARTBEAT" },
  { key: "voice", label: "HARBINGER VOICE" },
];
type VoiceCapture = {
  stream: MediaStream;
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  recorder: MediaRecorder;
  chunks: Blob[];
  frame: number;
  startedAt: number;
  lastSpeechAt: number;
  recording: boolean;
  live: boolean;
  onTranscript: (text: string) => void;
};
const opening: Message = { role: "assistant", content: "Greetings Visitor,I am The SilentHarbinger of DiE-alouge. Whether to live or whether to die, it shall be decided by the dialouge of you and I, what is thy alias?" };
const titleWords = ["Thread", "Survive", "Escape", "Death", "In", "DiE-alogue!"];
const dangerFor = (reply: string, turn: number) => Math.min(24, 7 + (turn % 3) * 3 + (/run|fight|refuse|weapon|fire|door|hide|lie|trick/i.test(reply) ? 5 : 0));
function GlitchWord({ children }: { children: string }) { return <h1 className="glitch"><span aria-hidden="true">{children}</span>{children}<span aria-hidden="true">{children}</span></h1>; }

function waitForAudioData(audio: HTMLAudioElement | null, label: string) {
  if (!audio) return Promise.reject(new Error(`${label} audio is unavailable.`));
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
    };
    const onCanPlay = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`${label} audio failed to load.`));
    };
    audio.addEventListener("canplay", onCanPlay, { once: true });
    audio.addEventListener("error", onError, { once: true });
    audio.load();
  });
}

function ReadableFontToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      className="accessibility-toggle"
      type="button"
      onClick={onToggle}
      aria-label={enabled ? "Use original display fonts" : "Switch to readable fonts"}
      aria-pressed={enabled}
      title={enabled ? "Use original display fonts" : "Switch to readable fonts"}
    >
      <Accessibility size={19} aria-hidden="true" />
      <span>READABLE</span>
    </button>
  );
}

function HarbingerSkull({ speaking, listening }: { speaking: boolean; listening: boolean }) {
  return (
    <div className={`harbinger-skull ${speaking ? "is-speaking" : ""} ${listening ? "is-listening" : ""}`} role="img" aria-label={speaking ? "The Harbinger is speaking" : listening ? "The Harbinger is listening" : "The Harbinger is waiting"}>
      <div className="skull-aura" />
      <span className="skull-soulfire skull-soulfire-left" aria-hidden="true" />
      <span className="skull-soulfire skull-soulfire-right" aria-hidden="true" />
      <svg viewBox="0 0 240 250" aria-hidden="true">
        <defs>
          <radialGradient id="skull-bone" cx="36%" cy="24%" r="78%">
            <stop offset="0" stopColor="#d8c7ac" />
            <stop offset=".35" stopColor="#9d8871" />
            <stop offset=".72" stopColor="#56443e" />
            <stop offset="1" stopColor="#171015" />
          </radialGradient>
          <linearGradient id="skull-jaw" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#b7a188" />
            <stop offset=".52" stopColor="#5c4640" />
            <stop offset="1" stopColor="#21151d" />
          </linearGradient>
          <radialGradient id="skull-eye">
            <stop stopColor="#fff0de" stopOpacity=".98" />
            <stop offset=".16" stopColor="#ff314c" />
            <stop offset=".5" stopColor="#950b31" />
            <stop offset="1" stopColor="#10070b" />
          </radialGradient>
          <filter id="skull-shadow" x="-35%" y="-30%" width="170%" height="180%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
            <feOffset dy="7" />
            <feComponentTransfer><feFuncA type="linear" slope=".75" /></feComponentTransfer>
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <ellipse cx="120" cy="226" rx="72" ry="13" fill="#050204" opacity=".82" />
        <g id="harbinger-skull-face" className="skull-turn" filter="url(#skull-shadow)">
          <path d="M35 104C35 45 72 17 120 17s85 28 85 87c0 34-12 52-29 68l-4 30H68l-4-30c-17-16-29-34-29-68Z" fill="url(#skull-bone)" stroke="#efd4b1" strokeOpacity=".44" strokeWidth="3" />
          <path d="M47 89c7-35 30-56 58-63-29 20-39 43-40 76-1 24 6 47 18 69-26-16-42-43-36-82Z" fill="#fff0d0" opacity=".23" />
          <path d="M47 109c10-22 31-31 53-21 8 4 13 12 15 22-12 24-29 38-49 36-16-2-23-17-19-37Z" fill="#140b10" />
          <path d="M193 109c-10-22-31-31-53-21-8 4-13 12-15 22 12 24 29 38 49 36 16-2 23-17 19-37Z" fill="#140b10" />
          <ellipse className="skull-eye-light skull-eye-left" cx="81" cy="119" rx="19" ry="14" fill="url(#skull-eye)" />
          <ellipse className="skull-eye-light skull-eye-right" cx="159" cy="121" rx="17" ry="12" fill="url(#skull-eye)" />
          <path d="m120 123-17 34 16 11 17-11-11-34c-1-4-4-4-5 0Z" fill="#211319" stroke="#6d493f" strokeWidth="2" />
          <path d="M62 164c18 11 38 14 58 13 20 1 40-2 58-13l-5 29c-17 15-34 22-53 22s-36-7-53-22l-5-29Z" fill="url(#skull-jaw)" stroke="#e1c09c" strokeOpacity=".54" strokeWidth="2" />
          <g className="skull-teeth" fill="#f0dbb9" stroke="#49302b" strokeWidth="2">
            <path d="M81 173h18v19c-6 5-12 5-18 0zM101 176h17v23c-6 4-11 4-17 0zM122 176h17v23c-6 4-11 4-17 0zM142 173h18v19c-6 5-12 5-18 0z" />
          </g>
          <g className="skull-lower-jaw">
            <path d="M72 194c16 9 31 13 48 13s32-4 48-13l-5 28c-11 11-26 16-43 16s-32-5-43-16l-5-28Z" fill="url(#skull-jaw)" stroke="#d5b492" strokeWidth="3" />
            <path d="M90 203v14m15-12v19m15-19v20m15-20v19m15-21v14" stroke="#39252a" strokeWidth="3" />
          </g>
          <path d="M67 71c13-13 26-19 39-20m67 20c-13-13-26-19-39-20" fill="none" stroke="#e9d4b6" strokeOpacity=".34" strokeWidth="4" strokeLinecap="round" />
          <path className="skull-fracture" d="m59 77 12 8-4 9 11 5m89-29-8 12 9 8-6 12m-95 50 13-7 5 9m64-16 9-8 9 5" fill="none" stroke="#23151c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <svg className="skull-wraith skull-wraith-left" viewBox="0 0 240 250" aria-hidden="true"><use href="#harbinger-skull-face" /></svg>
      <svg className="skull-wraith skull-wraith-right" viewBox="0 0 240 250" aria-hidden="true"><use href="#harbinger-skull-face" /></svg>
    </div>
  );
}

function ModelDownloadRow({ label, model }: { label: string; model: ModelSetupState }) {
  const detail = model.status === "ready"
    ? "READY"
    : model.status === "download"
      ? `${model.file ?? "MODEL FILE"} · ${Math.round(model.progress ?? 0)}%`
      : model.status === "waiting"
        ? "WAITING TO LOAD"
        : model.file
          ? `LOADING ${model.file}`
          : "CHECKING CACHE / LOADING";

  return (
    <div className={`voice-model-row is-${model.status}`}>
      <div className="voice-model-row-label"><strong>{label}</strong><span>{detail}</span></div>
      <progress
        className="voice-model-progress"
        max={100}
        value={model.status === "ready" ? 100 : model.status === "download" ? model.progress : undefined}
        aria-label={`${label} model download progress`}
      />
    </div>
  );
}

export function DeathDialogue() {
  const [splash, setSplash] = useState(true); const [messages, setMessages] = useState<Message[]>([opening]);
  const [assetsReady, setAssetsReady] = useState(false); const [assetLoadError, setAssetLoadError] = useState(""); const [assetLoadAttempt, setAssetLoadAttempt] = useState(0);
  const [selectedMode, setSelectedMode] = useState<ChatMode | null>(null);
  const [micStatus, setMicStatus] = useState<MicStatus>("unknown");
  const [readableFont, setReadableFont] = useState(false);
  const [input, setInput] = useState(""); const [vitality, setVitality] = useState(100); const [turn, setTurn] = useState(0);
  const [pending, setPending] = useState(false); const [volumes, setVolumes] = useState<AudioVolumes>(defaultAudioVolumes); const [volumeMenuOpen, setVolumeMenuOpen] = useState(false); const [audioError, setAudioError] = useState(""); const [ended, setEnded] = useState(false); const [watching, setWatching] = useState(false); const [conversationStarted, setConversationStarted] = useState(false); const [privacyOpen, setPrivacyOpen] = useState(false); const [error, setError] = useState("");
  const [liveMode, setLiveMode] = useState(false); const [listening, setListening] = useState(false); const [voiceSpeaking, setVoiceSpeaking] = useState(false); const [transcribing, setTranscribing] = useState(false); const [voiceStatus, setVoiceStatus] = useState("");
  const [voiceModel, setVoiceModel] = useState<LocalTtsState>(getLocalTtsState); const [voiceNoticeOpen, setVoiceNoticeOpen] = useState(false);
  const [voiceSetup, setVoiceSetup] = useState<VoiceSetupState>({ open: false, loading: false, error: "", voice: waitingForModel, transcription: waitingForModel });
  const endRef = useRef<HTMLDivElement>(null); const ambience = useRef<HTMLAudioElement>(null); const heartbeat = useRef<HTMLAudioElement>(null);
  const volumeControlRef = useRef<HTMLDivElement>(null); const volumeButtonRef = useRef<HTMLButtonElement>(null);
  const volumesRef = useRef(volumes); const audioContextRef = useRef<AudioContext | null>(null); const speechSourceRefs = useRef<AudioBufferSourceNode[]>([]); const speechGainRef = useRef<GainNode | null>(null);
  const speechTokenRef = useRef(0); const speakingRef = useRef(false); const captureRef = useRef<VoiceCapture | null>(null);
  const captureRequestRef = useRef(0); const captureStartingRef = useRef(false);
  const selectedModeRef = useRef<ChatMode | null>(null);
  const [voiceSetupMinimized, setVoiceSetupMinimized] = useState(false);
  const voiceSetupAttemptRef = useRef(0);
  const liveModeRef = useRef(false);
  const pendingRef = useRef(false);
  const endedRef = useRef(false);
  function stopSpeechSources() {
    speechSourceRefs.current.forEach((source) => {
      source.onended = null;
      try {
        source.stop();
      } catch (cause) {
        if (!(cause instanceof DOMException && cause.name === "InvalidStateError")) throw cause;
      }
    });
    speechSourceRefs.current = [];
  }
  const playGrunt = useCallback(() => {
    try {
      const context = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = context;
      void context.resume();
      const now = context.currentTime;
      const level = volumesRef.current.master * volumesRef.current.voice;
      const output = context.createGain();
      output.gain.setValueAtTime(0.0001, now);
      output.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.5 * level), now + 0.06);
      output.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
      const body = context.createBiquadFilter();
      body.type = "lowpass";
      body.frequency.setValueAtTime(520, now);
      body.frequency.exponentialRampToValueAtTime(140, now + 0.6);
      body.connect(output);
      output.connect(context.destination);
      const growl = context.createOscillator();
      growl.type = "sawtooth";
      growl.frequency.setValueAtTime(92, now);
      growl.frequency.exponentialRampToValueAtTime(41, now + 0.6);
      const tremor = context.createOscillator();
      const tremorDepth = context.createGain();
      tremor.frequency.value = 31;
      tremorDepth.gain.value = 16;
      tremor.connect(tremorDepth);
      tremorDepth.connect(growl.frequency);
      growl.connect(body);
      const rasp = context.createBuffer(1, Math.ceil(context.sampleRate * 0.62), context.sampleRate);
      const raspSamples = rasp.getChannelData(0);
      for (let sample = 0; sample < raspSamples.length; sample += 1) {
        raspSamples[sample] = (Math.random() * 2 - 1) * (1 - sample / raspSamples.length);
      }
      const breath = context.createBufferSource();
      breath.buffer = rasp;
      breath.connect(body);
      [growl, tremor, breath].forEach((node) => node.start(now));
      [growl, tremor].forEach((node) => node.stop(now + 0.65));
    } catch {
      // A blocked or unavailable audio context only loses the grunt; the notice still explains the wait.
    }
  }, []);
  const speakHarbinger = useCallback((text: string, onComplete?: () => void, notifyIfUnready = false) => {
    if (typeof window === "undefined" || !text.trim()) {
      onComplete?.();
      return;
    }
    if (getLocalTtsState().status !== "ready") {
      if (notifyIfUnready) {
        playGrunt();
        setVoiceNoticeOpen(true);
      }
      if (getLocalTtsState().status !== "loading") void loadLocalTts().catch(() => undefined);
      onComplete?.();
      return;
    }

    const token = speechTokenRef.current + 1;
    speechTokenRef.current = token;
    stopSpeechSources();
    speechGainRef.current = null;
    setVoiceSpeaking(true);
    speakingRef.current = true;
    setVoiceStatus("");
    const finishSpeech = (message?: string) => {
      if (speechTokenRef.current !== token) return;
      if (message) {
        stopSpeechSources();
        setError(message);
      }
      setVoiceSpeaking(false);
      speakingRef.current = false;
      setVoiceStatus("");
      onComplete?.();
    };

    const speakChunks = async () => {
      try {
        const context = audioContextRef.current ?? new AudioContext();
        audioContextRef.current = context;
        await context.resume();
        const tts = await loadLocalTts();
        const chunks = text
          .replace(/\s+/g, " ")
          .match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
        let pendingText = "";
        const speechChunks: string[] = [];
        chunks.forEach((chunk) => {
          const next = `${pendingText}${pendingText ? " " : ""}${chunk.trim()}`;
          if (next.length > 280 && pendingText) {
            speechChunks.push(pendingText);
            pendingText = chunk.trim();
          } else {
            pendingText = next;
          }
        });
        if (pendingText) speechChunks.push(pendingText);
        let index = 0;
        const playNext = async () => {
          if (speechTokenRef.current !== token) return;
          if (index >= speechChunks.length) {
            finishSpeech();
            return;
          }
          const audio = await tts.generate(speechChunks[index++], { voice: "af_nicole", speed: 0.8 });
          if (speechTokenRef.current !== token) return;
          const buffer = context.createBuffer(1, audio.audio.length, audio.sampling_rate);
          buffer.getChannelData(0).set(audio.audio);
          const breathBuffer = context.createBuffer(1, audio.audio.length, audio.sampling_rate);
          const breathSamples = breathBuffer.getChannelData(0);
          const envelopeWindow = Math.max(1, Math.round(audio.sampling_rate / 120));
          let previousLevel = 0;
          for (let start = 0; start < audio.audio.length; start += envelopeWindow) {
            const end = Math.min(start + envelopeWindow, audio.audio.length);
            let energy = 0;
            let edge = 0;
            for (let sample = start; sample < end; sample += 1) {
              energy += audio.audio[sample] ** 2;
              if (sample > 0) edge += Math.abs(audio.audio[sample] - audio.audio[sample - 1]);
            }
            const level = Math.sqrt(energy / (end - start)) * 1.7 + (edge / (end - start)) * 1.2;
            for (let sample = start; sample < end; sample += 1) {
              const blend = (sample - start) / (end - start);
              breathSamples[sample] = (Math.random() * 2 - 1) * (previousLevel + (level - previousLevel) * blend);
            }
            previousLevel = level;
          }
          const masterGain = context.createGain();
          masterGain.gain.value = volumesRef.current.master * volumesRef.current.voice;
          masterGain.connect(context.destination);
          const reverb = context.createConvolver();
          const reverbSeconds = 0.68;
          const reverbBuffer = context.createBuffer(2, Math.ceil(context.sampleRate * reverbSeconds), context.sampleRate);
          for (let channel = 0; channel < reverbBuffer.numberOfChannels; channel += 1) {
            const impulse = reverbBuffer.getChannelData(channel);
            for (let sample = 0; sample < impulse.length; sample += 1) {
              impulse[sample] = (Math.random() * 2 - 1) * (1 - sample / impulse.length) ** 3;
            }
          }
          reverb.buffer = reverbBuffer;
          const reverbGain = context.createGain();
          reverbGain.gain.value = 0.2;
          masterGain.connect(reverb);
          reverb.connect(reverbGain);
          reverbGain.connect(context.destination);
          speechGainRef.current = masterGain;
          const voices = [
            { detune: -420, rate: 0.93, delay: 0.03, gain: 0.2, pan: 0, lowpass: 1500 },
            { detune: -760, rate: 0.9, delay: 0.19, gain: 0.1, pan: -0.6, lowpass: 1200 },
            { detune: 380, rate: 1.03, delay: 0.33, gain: 0.07, pan: 0.6, lowpass: 2200 },
            { detune: 0, rate: 1, delay: 0, gain: 1, pan: 0, filterType: "bandpass" as const, frequency: 2100, q: 0.45, breath: true },
            { detune: 0, rate: 0.98, delay: 0.11, gain: 0.45, pan: -0.45, filterType: "highpass" as const, frequency: 4200, q: 0.7, breath: true },
            { detune: 0, rate: 1.02, delay: 0.24, gain: 0.35, pan: 0.45, filterType: "bandpass" as const, frequency: 1300, q: 0.6, breath: true },
          ];
          let voicesLeft = voices.length;
          const sources = voices.map(({ detune, rate, delay, gain, pan, lowpass, filterType, frequency, q, breath }) => {
            const source = context.createBufferSource();
            const filter = context.createBiquadFilter();
            const layerGain = context.createGain();
            const stereo = context.createStereoPanner();
            source.buffer = breath ? breathBuffer : buffer;
            source.playbackRate.value = rate;
            source.detune.value = detune;
            filter.type = filterType ?? "lowpass";
            filter.frequency.value = frequency ?? lowpass ?? 2000;
            filter.Q.value = q ?? 0.55;
            layerGain.gain.value = gain;
            stereo.pan.value = pan;
            source.connect(filter);
            filter.connect(layerGain);
            layerGain.connect(stereo);
            stereo.connect(masterGain);
            source.onended = () => {
              if (speechTokenRef.current !== token) return;
              speechSourceRefs.current = speechSourceRefs.current.filter((activeSource) => activeSource !== source);
              voicesLeft -= 1;
              if (voicesLeft === 0) {
                speechGainRef.current = null;
                void playNext().catch((cause: unknown) => {
                  finishSpeech(cause instanceof Error ? `Local voice failed: ${cause.message}` : "Local voice could not be generated.");
                });
              }
            };
            return { source, delay };
          });
          speechSourceRefs.current = sources.map(({ source }) => source);
          const startAt = context.currentTime + 0.015;
          sources.forEach(({ source, delay }) => source.start(startAt + delay));
          setVoiceStatus("");
        };
        await playNext();
      } catch (cause) {
        finishSpeech(cause instanceof Error ? `Local voice failed: ${cause.message}` : "Local voice could not be loaded.");
      }
    };
    void speakChunks();
  }, []);
  const syncAudio = (isSplash: boolean, levels: AudioVolumes, enabled: boolean) => {
    const tracks = [
      { element: heartbeat.current, active: isSplash, volume: levels.heartbeat },
      { element: ambience.current, active: !isSplash, volume: levels.ambience },
    ];

    tracks.forEach(({ element, active, volume }) => {
      if (!element) return;
      const gain = levels.master * volume;
      if (!enabled || !active || gain <= 0) {
        element.pause();
        element.muted = true;
        return;
      }

      element.muted = false;
      element.volume = gain;
      if (element.ended) element.currentTime = 0;
      element.play().catch(() => setAudioError("Audio playback was blocked by the browser. Interact with the page to enable sound."));
    });
  };
  const updateVolume = (channel: keyof AudioVolumes, value: number) => {
    const next = { ...volumesRef.current, [channel]: value };
    volumesRef.current = next;
    setVolumes(next);
    setAudioError("");
    if (channel === "master" || channel === "voice") {
      if (speechGainRef.current) speechGainRef.current.gain.value = next.master * next.voice;
    }
  };
  useEffect(() => {
    syncAudio(splash, volumes, assetsReady);
  }, [assetsReady, splash, volumes]);
  useEffect(() => {
    let cancelled = false;
    const loadAssets = async () => {
      try {
        const [dieFont, curseFont] = await Promise.all([
          document.fonts.load('16px "Die"'),
          document.fonts.load('16px "Curse"'),
        ]);
        if (!dieFont.length || !curseFont.length) throw new Error("Display fonts failed to load.");

        const background = new Image();
        background.src = "/assets/backgrounds/harbinger-crypt.svg";
        await Promise.all([
          background.decode(),
          waitForAudioData(heartbeat.current, "Heartbeat"),
          waitForAudioData(ambience.current, "Ambience"),
        ]);
        if (!cancelled) {
          setAssetLoadError("");
          setAssetsReady(true);
        }
      } catch (cause) {
        if (!cancelled) {
          setAssetLoadError(cause instanceof Error ? cause.message : "The opening assets could not be loaded.");
        }
      }
    };
    void loadAssets();
    return () => {
      cancelled = true;
    };
  }, [assetLoadAttempt]);
  useEffect(() => {
    if (!volumeMenuOpen) return;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!volumeControlRef.current?.contains(event.target as Node)) setVolumeMenuOpen(false);
    };
    const closeOnKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setVolumeMenuOpen(false);
        volumeButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnKeyDown);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnKeyDown);
    };
  }, [volumeMenuOpen]);
  useEffect(() => {
    if (!privacyOpen) return;
    const closeOnKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPrivacyOpen(false);
    };
    document.addEventListener("keydown", closeOnKeyDown);
    return () => document.removeEventListener("keydown", closeOnKeyDown);
  }, [privacyOpen]);
  useEffect(() => {
    if (!splash || !assetsReady) return;
    const timer = window.setTimeout(() => {
      setSplash(false);
    }, 25000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [assetsReady, splash]);
  useEffect(() => {
    if (splash || !selectedMode || !conversationStarted || ended) return;

    let revealTimer: number;
    let hideTimer: number;
    const reveal = () => {
      revealTimer = window.setTimeout(() => {
        setWatching(true);
        hideTimer = window.setTimeout(() => {
          setWatching(false);
          reveal();
        }, 2600);
      }, 100000 + Math.random() * 40000);
    };

    reveal();
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(hideTimer);
    };
  }, [splash, selectedMode, conversationStarted, ended]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);
  useEffect(() => subscribeLocalTts(() => setVoiceModel(getLocalTtsState())), []);
  useEffect(() => {
    if (!voiceNoticeOpen) return;
    const timer = window.setTimeout(() => setVoiceNoticeOpen(false), voiceModel.status === "ready" ? 2500 : 9000);
    return () => window.clearTimeout(timer);
  }, [voiceNoticeOpen, voiceModel.status]);
  useEffect(() => () => {
    liveModeRef.current = false;
    voiceSetupAttemptRef.current += 1;
    stopListening();
    speechTokenRef.current += 1;
    stopSpeechSources();
    void audioContextRef.current?.close();
  }, []);
  const selectMode = (mode: ChatMode) => {
    selectedModeRef.current = mode;
    setSelectedMode(mode);
    if (endedRef.current) {
      endedRef.current = false;
      pendingRef.current = false;
      setMessages([opening]);
      setVitality(100);
      setTurn(0);
      setConversationStarted(false);
      setEnded(false);
      setError("");
      setInput("");
      setPending(false);
    }
    if (mode === "text") {
      void loadLocalTts().catch(() => undefined);
      speakHarbinger(opening.content);
      return;
    }

    liveModeRef.current = true;
    setLiveMode(true);
    setError("");
    try {
      const context = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = context;
      void context.resume().catch((cause: unknown) => {
        setError(cause instanceof Error ? `Audio playback could not start: ${cause.message}` : "Audio playback could not start.");
      });
    } catch (cause) {
      setError(cause instanceof Error ? `Audio playback is unavailable: ${cause.message}` : "Audio playback is unavailable.");
    }
    updateVolume("ambience", 0.3);
    void startLiveConversation();
  };
  async function startLiveConversation() {
    // Ask for the microphone first so the browser prompt is not delayed by model loading.
    if (await requestMicrophone()) void prepareLiveConversation();
  }
  async function requestMicrophone() {
    if (!window.isSecureContext) {
      setMicStatus("insecure");
      return false;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicStatus("unavailable");
      return false;
    }
    setMicStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus("granted");
      return true;
    } catch (cause) {
      const denied = cause instanceof DOMException && (cause.name === "NotAllowedError" || cause.name === "SecurityError");
      setMicStatus(denied ? "denied" : "unavailable");
      return false;
    }
  }
  async function allowMicrophone() {
    if (!(await requestMicrophone()) || selectedModeRef.current !== "live") return;
    setError("");
    liveModeRef.current = true;
    setLiveMode(true);
    void prepareLiveConversation();
  }
  async function prepareLiveConversation() {
    const attempt = voiceSetupAttemptRef.current + 1;
    voiceSetupAttemptRef.current = attempt;
    const isCurrentAttempt = () => attempt === voiceSetupAttemptRef.current
      && liveModeRef.current && selectedModeRef.current === "live";
    setVoiceSetupMinimized(false);
    setVoiceSetup({
      open: true,
      loading: true,
      error: "",
      voice: { status: "loading" },
      transcription: { status: "loading" },
    });
    const reportProgress = (model: VoiceModel, progress: VoiceModelProgress) => {
      if (!isCurrentAttempt()) return;
      setVoiceSetup((current) => ({
        ...current,
        [model]: progress,
      }));
    };
    try {
      await Promise.all([
        loadLocalTts(reportProgress),
        loadLocalRecognizer(reportProgress),
      ]);
      if (!isCurrentAttempt()) return;
      setVoiceSetup((current) => ({
        ...current,
        loading: false,
        voice: { status: "ready" },
        transcription: { status: "ready" },
      }));
      setVoiceSetup((current) => ({ ...current, open: false }));
      speakHarbinger(opening.content, () => {
        if (liveModeRef.current) startListening();
      });
    } catch (cause) {
      if (!isCurrentAttempt()) return;
      liveModeRef.current = false;
      setLiveMode(false);
      setVoiceSetup((current) => ({
        ...current,
        loading: false,
        error: cause instanceof Error
          ? cause.message
          : "The local voice models could not be loaded.",
      }));
    }
  }
  const dismissVoiceSetup = () => {
    voiceSetupAttemptRef.current += 1;
    liveModeRef.current = false;
    setLiveMode(false);
    setVoiceSetup((current) => ({ ...current, open: false }));
    returnToModePicker();
  };
  function stopListening() {
    captureRequestRef.current += 1;
    captureStartingRef.current = false;
    const capture = captureRef.current;
    if (!capture) return;
    captureRef.current = null;
    window.cancelAnimationFrame(capture.frame);
    capture.recorder.ondataavailable = null;
    capture.recorder.onstop = null;
    capture.recorder.onerror = null;
    if (capture.recorder.state !== "inactive") capture.recorder.stop();
    capture.stream.getTracks().forEach((track) => track.stop());
    capture.source.disconnect();
    setListening(false);
  }
  function stopSpeaking() {
    speechTokenRef.current += 1;
    stopSpeechSources();
    speechGainRef.current = null;
    speakingRef.current = false;
    setVoiceSpeaking(false);
    setVoiceStatus("");
  }
  const returnToModePicker = () => {
    liveModeRef.current = false;
    selectedModeRef.current = null;
    stopListening();
    stopSpeaking();
    setLiveMode(false);
    setSelectedMode(null);
  };
  const restart = () => {
    endedRef.current = false;
    pendingRef.current = false;
    setMessages([opening]); setVitality(100); setTurn(0); setConversationStarted(false); setEnded(false); setError(""); setInput("");
    if (selectedMode === "live") {
      liveModeRef.current = true;
      setLiveMode(true);
      speakHarbinger(opening.content, () => {
        if (liveModeRef.current) startListening();
      });
    } else {
      speakHarbinger(opening.content);
    }
  };
  function startListening() {
    if (captureRef.current || captureStartingRef.current || !liveModeRef.current || pendingRef.current || endedRef.current) return;
    void captureSpeech((transcript) => {
      void submitMessage(transcript);
    }, true);
  }
  async function captureSpeech(onTranscript: (text: string) => void, live: boolean) {
    if (captureRef.current || captureStartingRef.current || (live && !liveModeRef.current)) return;
    captureStartingRef.current = true;
    const requestId = captureRequestRef.current + 1;
    captureRequestRef.current = requestId;
    let captureStarted = false;
    setError("");
    setVoiceStatus("PREPARING LOCAL SPEECH RECOGNITION…");
    const isCurrentRequest = () => requestId === captureRequestRef.current
      && (live ? liveModeRef.current : selectedModeRef.current === "text");
    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("This browser does not support local microphone recording.");
      }
      const context = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = context;
      await context.resume();
      if (!isCurrentRequest()) return;
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setMicStatus("granted");
      if (!isCurrentRequest()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      await loadLocalRecognizer((message) => {
        if (isCurrentRequest()) setVoiceStatus(message);
      });
      if (!isCurrentRequest()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const capture: VoiceCapture = {
        stream,
        context,
        source,
        analyser,
        recorder,
        chunks: [],
        frame: 0,
        startedAt: 0,
        lastSpeechAt: 0,
        recording: false,
        live,
        onTranscript,
      };
      captureRef.current = capture;
      captureStarted = true;
      captureStartingRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) capture.chunks.push(event.data);
      };
      recorder.onstop = () => {
        const audio = new Blob(capture.chunks, { type: recorder.mimeType || "audio/webm" });
        stopListening();
        setTranscribing(true);
        setVoiceStatus("TRANSCRIBING ON THIS DEVICE…");
        void transcribeLocalAudio(audio)
          .then((transcript) => {
            if (!transcript) {
              if (liveModeRef.current) setError("I did not catch that. Speak again when ready.");
              return;
            }
            if (live ? liveModeRef.current : selectedModeRef.current === "text") capture.onTranscript(transcript);
          })
          .catch((cause: unknown) => {
            setError(cause instanceof Error ? `Local transcription failed: ${cause.message}` : "Local transcription failed.");
          })
          .finally(() => {
            setTranscribing(false);
            setVoiceStatus("");
            if (capture.live && liveModeRef.current && !pendingRef.current && !endedRef.current) {
              window.setTimeout(() => {
                if (liveModeRef.current) startListening();
              }, 450);
            }
          });
      };
      recorder.onerror = () => {
        stopListening();
        setError("Local microphone recording stopped unexpectedly. Try speaking again.");
        if (live) {
          liveModeRef.current = false;
          setLiveMode(false);
        }
      };
      setVoiceStatus("");
      setListening(true);
      setError("");
      const samples = new Float32Array(analyser.fftSize);
      const detectSpeech = () => {
        if (captureRef.current !== capture) return;
        analyser.getFloatTimeDomainData(samples);
        let energy = 0;
        for (const sample of samples) energy += sample * sample;
        const level = Math.sqrt(energy / samples.length);
        const now = performance.now();
        if (level > 0.018) {
          if (!capture.recording) {
            capture.recording = true;
            capture.startedAt = now;
            capture.chunks = [];
            recorder.start(250);
          }
          capture.lastSpeechAt = now;
        }
        if (capture.recording && (now - capture.lastSpeechAt > 1100 || now - capture.startedAt > 15_000)) {
          capture.recording = false;
          recorder.stop();
          return;
        }
        capture.frame = window.requestAnimationFrame(detectSpeech);
      };
      capture.frame = window.requestAnimationFrame(detectSpeech);
    } catch (cause) {
      stream?.getTracks().forEach((track) => track.stop());
      if (requestId === captureRequestRef.current) {
        stopListening();
        setVoiceStatus("");
        if (cause instanceof DOMException && cause.name === "NotAllowedError") setMicStatus("denied");
        const message = cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "Microphone access was denied. Allow microphone access to use local voice."
          : cause instanceof Error
            ? cause.message
            : "Local voice could not start.";
        setError(message);
        if (live) {
          liveModeRef.current = false;
          setLiveMode(false);
        }
      }
    } finally {
      if (!captureStarted && requestId === captureRequestRef.current) captureStartingRef.current = false;
    }
  }
  const toggleLiveMode = () => {
    if (liveModeRef.current) {
      liveModeRef.current = false;
      stopListening();
      stopSpeaking();
      setLiveMode(false);
      return;
    }
    liveModeRef.current = true;
    setLiveMode(true);
    setError("");
    stopSpeaking();
    startListening();
  };
  const dictate = () => {
    stopSpeaking();
    void captureSpeech((transcript) => {
      setInput((current) => `${current}${current ? " " : ""}${transcript}`);
    }, false);
  };
  async function submitMessage(text: string) {
    const cleanedText = text.trim();
    if (!cleanedText || pendingRef.current || endedRef.current) return;
    setConversationStarted(true);
    pendingRef.current = true;
    stopListening();
    const nextTurn = turn + 1; const cost = dangerFor(cleanedText, nextTurn); const nextVitality = Math.max(0, vitality - cost); const nextMessages = [...messages, { role: "user" as const, content: cleanedText }];
    setInput(""); setError(""); setMessages(nextMessages); setTurn(nextTurn); setVitality(nextVitality); setPending(true);
    if (nextVitality === 0) {
      const finalReply = "The ledger closes with a sound like a snapped bone. Your last words become a stain beneath my thumb.\n\nYou have reached your demise.";
      endedRef.current = true;
      liveModeRef.current = false;
      setLiveMode(false);
      setWatching(false);
      stopListening();
      setTimeout(() => {
        setMessages((current) => [...current, { role: "assistant", content: finalReply }]);
        speakHarbinger(finalReply);
        pendingRef.current = false;
        setPending(false);
        setEnded(true);
      }, 650);
      return;
    }
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: nextMessages }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No answer returned");
      setMessages((current) => [...current, { role: "assistant", content: data.content }]);
      speakHarbinger(data.content, () => {
        if (liveModeRef.current && !endedRef.current) startListening();
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The Harbinger cannot be reached.");
      setVitality((current) => Math.min(100, current + cost));
    } finally {
      pendingRef.current = false;
      setPending(false);
      if (liveModeRef.current && !speakingRef.current) {
        window.setTimeout(() => {
          if (liveModeRef.current) startListening();
        }, 350);
      }
    }
  }
  function send(event: FormEvent) {
    event.preventDefault();
    void submitMessage(input);
  }
  return <main className={`game-shell ${!assetsReady ? "is-preloading" : splash ? "is-splash" : "is-entering"} ${assetsReady && !splash && !selectedMode ? "is-mode-picker" : ""} ${selectedMode === "live" ? "is-live-mode" : ""} ${selectedMode === "text" ? "is-text-mode" : ""} ${readableFont ? "accessible-font" : ""}`}>
    <audio ref={ambience} muted loop preload="auto" src="/assets/sounds/bgm.mp3" /><audio ref={heartbeat} muted loop preload="auto" src="/assets/sounds/heartbeat.mp3" />
    {!assetsReady && <section className="asset-preloader" aria-live="polite">
      {assetLoadError
        ? <><p role="alert">{assetLoadError}</p><button type="button" onClick={() => { setAssetsReady(false); setAssetLoadError(""); setAssetLoadAttempt((attempt) => attempt + 1); }}>RETRY</button></>
        : <><span className="asset-preloader-spinner" aria-hidden="true" /><p>PREPARING THE OTHER SIDE...</p></>}
    </section>}
    {assetsReady && splash && <section className="splash-screen"><div className="splash-image" /><div className="morphing">{titleWords.map((word) => <div className="word" key={word}>{word === "DiE-alogue!" && <span className="splash-season">SEASON 3</span>}<GlitchWord>{word}</GlitchWord></div>)}</div><div className="splash-loader"><Skull size={26} /><span>CONNECTING TO THE OTHER SIDE...</span></div><div className="splash-accessibility"><ReadableFontToggle enabled={readableFont} onToggle={() => setReadableFont((enabled) => !enabled)} /></div></section>}
    {assetsReady && !splash && <><div className="grave-image" /><div className="grain" aria-hidden="true" />
      {watching && <div className="watcher" aria-hidden="true"><div className="watch-words"><GlitchWord>They</GlitchWord><GlitchWord>Are</GlitchWord><GlitchWord>Watching</GlitchWord><GlitchWord>You</GlitchWord><GlitchWord>RUN!!!</GlitchWord></div></div>}
      <header className="game-header">
        <div className="brand"><Skull size={26} /><span>DiE-ALOUGE</span><small>VERSION 2.0.0 · THE LAST CONVERSATION</small></div>
        <div className="header-actions">
          <ReadableFontToggle enabled={readableFont} onToggle={() => setReadableFont((enabled) => !enabled)} />
          <div className="volume-control" ref={volumeControlRef}>
            <button className="icon-button" ref={volumeButtonRef} type="button" onClick={() => setVolumeMenuOpen((open) => !open)} aria-label="Open audio volume controls" aria-expanded={volumeMenuOpen} aria-controls="audio-volume-controls" title="Audio volume controls"><SlidersHorizontal size={19} /></button>
            {volumeMenuOpen && <div className="volume-popover" id="audio-volume-controls" role="dialog" aria-label="Audio volume controls">
              <div className="volume-popover-heading"><strong>SOUND MIXER</strong><span>CONTROL EACH LAYER</span></div>
              {volumeChannels.map(({ key, label }) => <label className="volume-slider" key={key}>
                <span>{label}<output>{Math.round(volumes[key] * 100)}%</output></span>
                <input type="range" min="0" max="1" step="0.01" value={volumes[key]} style={{ background: `linear-gradient(90deg, #e34a4d 0 ${volumes[key] * 100}%, #3a1217 ${volumes[key] * 100}% 100%)` }} onChange={(event) => updateVolume(key, Number(event.target.value))} />
              </label>)}
              {audioError && <p className="volume-error" role="status">{audioError}</p>}
            </div>}
          </div>
        </div>
      </header>
      {!selectedMode ? <section className="mode-picker" aria-labelledby="mode-picker-title">
        <span className="eyebrow">THE CHOICE IS YOURS</span>
        <h1 id="mode-picker-title">HOW WILL YOU FACE THE HARBINGER?</h1>
        <p className="mode-picker-intro">Choose how this conversation begins. You can return here and change modes at any time.</p>
        <div className="mode-options">
          <button className="mode-card text-mode-card" type="button" onClick={() => selectMode("text")}>
            <span className="mode-card-icon"><SendHorizontal size={28} /></span>
            <span className="mode-card-title">TEXT CHAT</span>
            <span className="mode-card-copy">Write your replies. Read the Harbinger's words, with optional voice playback.</span>
            <span className="mode-card-cta">ENTER TEXT MODE <span aria-hidden="true">→</span></span>
          </button>
          <button className="mode-card live-mode-card" type="button" onClick={() => selectMode("live")}>
            <span className="mode-card-icon live-mode-icon"><PhoneCall size={28} /></span>
            <span className="mode-card-title">LIVE CONVERSATION</span>
            <span className="mode-card-copy">Speak naturally. The Harbinger listens, answers aloud, and keeps the conversation flowing.</span>
            <span className="mode-card-cta"><Phone size={15} /> ENTER LIVE MODE</span>
            <span className="mode-card-note mode-card-mic-note"><Mic size={13} aria-hidden="true" /> YOU MUST ALLOW MICROPHONE ACCESS OR THE HARBINGER CANNOT HEAR YOU</span>
            <span className="mode-card-note">LOCAL MODEL DOWNLOAD REQUIRED</span>
          </button>
        </div>
      </section> : <>
      <section className="survival-panel" aria-label="Survival status">
        <div className="thread-meter">
          <span className="eyebrow">YOUR REMAINING THREAD</span>
          <div
            className="meter"
            role="progressbar"
            aria-label="Thread remaining"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={vitality}
            data-state={vitality <= 35 ? "critical" : "steady"}
          >
            <i style={{ width: `${vitality}%` }} />
          </div>
          <span className="meter-scale" aria-hidden="true"><span>FRAIL</span><span>STEADY</span><span>SAFE</span></span>
        </div>
        <strong className={vitality <= 35 ? "critical" : ""} aria-label={`${vitality}% thread remaining`}>{vitality}<small>%</small></strong>
        <span className="turn-count">EXCHANGE {turn.toString().padStart(2, "0")}</span>
      </section>
      {selectedMode === "text" && <div className="mode-toolbar">
        <span>{selectedMode === "text" ? "TEXT CHAT" : "LIVE CONVERSATION"}</span>
        <button type="button" onClick={returnToModePicker}>CHANGE MODE</button>
      </div>}
      {selectedMode === "live" ? <section className="live-mode-view" aria-label="Live conversation">
        <div className={`live-stage ${voiceSpeaking ? "is-speaking" : ""} ${listening ? "is-listening" : ""}`} data-threat={vitality <= 33 ? "high" : vitality <= 66 ? "rising" : "low"}>
          <div className="live-stage-glow" />
          <div className="pillar-flame pillar-flame-left" aria-hidden="true"><i /><i /><i /></div>
          <div className="pillar-flame pillar-flame-right" aria-hidden="true"><i /><i /><i /></div>
          <div className="central-flame" aria-hidden="true" style={{ transform: `translate(-50%, -50%) scale(${1 + ((100 - vitality) / 100) * 0.9})`, opacity: 0.58 + ((100 - vitality) / 100) * 0.4 }}>
            <i /><i /><i /><i /><i />
          </div>
          <HarbingerSkull speaking={voiceSpeaking} listening={listening} />
          <span className="live-stage-title">THE SILENT HARBINGER</span>
          <span className="live-stage-status" role="status">{voiceStatus || (micStatus === "requesting" ? "WAITING FOR MICROPHONE PERMISSION" : micStatus === "denied" || micStatus === "unavailable" ? "THE HARBINGER CANNOT HEAR YOU" : liveMode ? voiceSpeaking ? "THREE SOULS SPEAK AS ONE" : pending ? "WEIGHING YOUR WORDS" : transcribing ? "DECIPHERING YOUR WORDS LOCALLY" : listening ? "I AM LISTENING" : "LIVE CHANNEL OPEN" : "THE CHANNEL IS PAUSED")}</span>
          {micStatus !== "granted" && micStatus !== "unknown" && <div className={`mic-required ${micStatus === "requesting" ? "is-requesting" : "is-blocked"}`} role="alert">
            <Mic size={22} aria-hidden="true" />
            <div>
              <strong>{micStatus === "requesting" ? "ALLOW MICROPHONE ACCESS" : micStatus === "insecure" ? "SECURE CONNECTION REQUIRED" : micStatus === "denied" ? "MICROPHONE ACCESS BLOCKED" : "NO MICROPHONE FOUND"}</strong>
              <p>{micStatus === "requesting"
                ? "Your browser is asking for microphone permission. Choose Allow, otherwise the Harbinger cannot hear you in a live conversation."
                : micStatus === "insecure"
                  ? "Browsers only allow microphone access on HTTPS (or localhost). Open this site over https:// to talk to the Harbinger, or use text chat."
                : micStatus === "denied"
                  ? "The Harbinger cannot hear you. Click the lock or microphone icon in your browser's address bar, set Microphone to Allow, then press the button below."
                  : "A working microphone is needed for a live conversation. Connect one, then try again, or switch to text chat."}</p>
            </div>
            {micStatus !== "requesting" && micStatus !== "insecure" && <button type="button" onClick={() => void allowMicrophone()}><Mic size={15} aria-hidden="true" /> ALLOW MICROPHONE</button>}
          </div>}
          <p className="live-caption" aria-live="polite"><strong>{messages[messages.length - 1]?.role === "assistant" ? "HARBINGER" : "YOU"}</strong>{messages[messages.length - 1]?.content}</p>
          {pending && <div className="thinking"><span /><span /><span /> Death considers your words.</div>}
          {error && <p className="error">{error}</p>}
          <div className="live-controls">
            <button className={`live-call-button ${liveMode ? "is-active" : ""}`} type="button" onClick={toggleLiveMode} disabled={ended} aria-pressed={liveMode}>
              {liveMode ? <PhoneOff size={17} /> : <Phone size={17} />}
              <span>{liveMode ? "END CALL" : "RESUME CALL"}</span>
            </button>
            <button className="change-mode-button" type="button" onClick={returnToModePicker}>CHANGE MODE</button>
          </div>
        </div>
      </section> : <>
        <section className="dialogue" aria-live="polite"><div className="omen"><Eye size={13} /> the harbinger is listening <Eye size={13} /></div>{messages.map((message, index) => <article key={`${message.role}-${index}`} className={`message ${message.role}`}><div className="speaker-row"><span className="speaker">{message.role === "assistant" ? "THE HARBINGER" : "YOU"}</span>{message.role === "assistant" && <button className="speak-button" type="button" onClick={() => speakHarbinger(message.content, undefined, true)} aria-label="Hear this Harbinger message" title="Hear this message"><Volume2 size={16} /></button>}</div><p>{message.content}</p></article>)}{pending && <div className="thinking"><span /><span /><span /> Death considers your words.</div>}{(voiceStatus || (listening ? "LISTENING FOR SPEECH…" : transcribing ? "TRANSCRIBING ON THIS DEVICE…" : "")) && <p className="voice-status" role="status">{voiceStatus || (listening ? "LISTENING FOR SPEECH…" : "TRANSCRIBING ON THIS DEVICE…")}</p>}{error && <p className="error">{error}</p>}<div ref={endRef} /></section>
        <form className="composer" onSubmit={send}><div className="composer-skull"><Skull size={23} /></div><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={ended ? "The dead have nothing left to say." : "Whisper your answer into the dark..."} disabled={pending || ended} maxLength={900} rows={1} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><button className={`mic-button ${listening ? "is-listening" : ""}`} type="button" onClick={dictate} disabled={pending || ended || listening} aria-pressed={listening} aria-label={listening ? "Listening for your answer" : "Speak your answer"}><Mic size={20} /></button><button type="submit" disabled={pending || ended || !input.trim()} aria-label="Send your answer"><SendHorizontal size={23} /><span>OFFER IT</span></button></form>
      </>}
      {ended && <div className="death-overlay"><Skull size={64} /><p>THE THREAD IS CUT</p><button onClick={restart}><RotateCcw size={16} /> Enter again</button></div>}
      </>}
    </>}
    <footer className="game-footer">
      <button className="footer-privacy-link" type="button" onClick={() => setPrivacyOpen(true)}>PRIVACY &amp; DATA</button>
      <span className="footer-credit">MADE WITH <HeartCrack size={13} aria-label="a broken heart" /> BY <span>AJ4200</span><a href="https://github.com/aj4200" target="_blank" rel="noreferrer" aria-label="AJ4200 on GitHub" title="AJ4200 on GitHub"><FaGithub size={14} /></a></span>
      <span className="footer-copyright">© 2026 DiE-ALOUGE. All rights reserved.</span>
    </footer>
    {voiceNoticeOpen && <div className={`voice-notice ${voiceModel.status === "error" ? "is-error" : ""}`} role="status" aria-live="polite">
      <div className="voice-notice-heading"><strong>{voiceModel.status === "ready" ? "THE VOICE HAS RISEN" : voiceModel.status === "error" ? "THE VOICE FAILED TO INSTALL" : "THE VOICE IS STILL INSTALLING"}</strong><button type="button" onClick={() => setVoiceNoticeOpen(false)} aria-label="Dismiss voice installation notice">×</button></div>
      <p>{voiceModel.status === "ready" ? "Press the speaker again to hear the Harbinger." : voiceModel.status === "error" ? "Check your connection, then press the speaker to try again." : `Harbinger voice model: ${Math.round(voiceModel.percent)}% installed. We must wait.`}</p>
      {voiceModel.status === "loading" && <progress className="voice-model-progress" max={100} value={voiceModel.percent} aria-label="Harbinger voice installation progress" />}
    </div>}
    {voiceSetup.open && voiceSetupMinimized && selectedMode === "live" && <div className="voice-notice voice-setup-mini" role="status" aria-live="polite">
      <div className="voice-notice-heading"><strong>{voiceSetup.loading ? "AWAKENING THE HARBINGER" : "THE VOICE COULD NOT LOAD"}</strong><button className="voice-setup-expand" type="button" onClick={() => setVoiceSetupMinimized(false)} aria-label="Expand voice setup">▢ EXPAND</button></div>
      <div className="voice-model-list">
        <ModelDownloadRow label="HARBINGER VOICE · KOKORO" model={voiceSetup.voice} />
        <ModelDownloadRow label="LOCAL LISTENING · WHISPER" model={voiceSetup.transcription} />
      </div>
    </div>}
    {voiceSetup.open && !voiceSetupMinimized && selectedMode === "live" && <div className="voice-setup-overlay" role="dialog" aria-modal="true" aria-labelledby="voice-setup-title" aria-describedby="voice-setup-description" aria-busy={voiceSetup.loading}>
      <section className="voice-setup-card">
        <button className="voice-setup-minimize" type="button" onClick={() => setVoiceSetupMinimized(true)} aria-label="Minimize voice setup to the corner">– MINIMIZE</button>
        <span className="eyebrow">{voiceSetup.loading ? "PREPARING THE VOICE" : "VOICE SETUP INTERRUPTED"}</span>
        <h2 id="voice-setup-title">{voiceSetup.loading ? "AWAKENING THE HARBINGER" : "THE VOICE COULD NOT LOAD"}</h2>
        <p id="voice-setup-description">{voiceSetup.loading
          ? "Preparing the local voice and listening models. On your first visit, model files download once; your browser can reuse its cached copies on return visits."
          : "The local voice models could not be prepared. Check your connection and browser storage, then try again."}</p>
        <div className="voice-model-list">
          <ModelDownloadRow label="HARBINGER VOICE · KOKORO" model={voiceSetup.voice} />
          <ModelDownloadRow label="LOCAL LISTENING · WHISPER" model={voiceSetup.transcription} />
        </div>
        {voiceSetup.error && <p className="voice-setup-error" role="alert">{voiceSetup.error}</p>}
        {voiceSetup.loading
          ? <button className="voice-setup-secondary" type="button" onClick={dismissVoiceSetup}>BACK TO MODES</button>
          : <div className="voice-setup-actions">
            <button className="voice-setup-primary" type="button" onClick={() => void prepareLiveConversation()}><RotateCcw size={15} /> TRY AGAIN</button>
            <button className="voice-setup-secondary" type="button" onClick={dismissVoiceSetup}>CHANGE MODE</button>
          </div>}
      </section>
    </div>}
    {privacyOpen && <div className="privacy-overlay" role="dialog" aria-modal="true" aria-labelledby="privacy-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setPrivacyOpen(false); }}>
      <section className="privacy-card">
        <span className="eyebrow">BEFORE YOU SPEAK</span>
        <h2 id="privacy-title">YOUR WORDS CROSS THE VEIL</h2>
        <p><strong>Chat storage:</strong> There are no accounts, and this app does not write chat history or mixer settings to cookies, local storage, or session storage. The active conversation and volume choices live in page memory; they are cleared when you restart or leave. The app does not intentionally save or cache chat conversations.</p>
        <p><strong>What is sent:</strong> When you send a message, this app forwards recent conversation context to Groq to generate a reply (up to 12 messages, with each message limited to 900 characters). Messages and replies remain visible in this page while it is open. Groq processes the request under its own privacy, logging, and retention policies; this app cannot control those policies.</p>
        <p><strong>Voice:</strong> Live speech recognition and dictation run on this device using open-source Whisper Tiny English. Harbinger speech is generated on this device using Kokoro. Microphone audio is not uploaded to either model; recognized text submitted as a reply is sent to this app and Groq as described above. Model files download from Hugging Face the first time and, when your browser supports its Cache API, are stored in that browser profile so later visits can reuse them.</p>
        <p><strong>Browser cache:</strong> Static files and local voice-model files may be cached by your browser for normal performance. Cached model files contain no conversation or microphone recording. Browser storage is controlled by your browser and may be cleared or evicted; in that case, models need to be downloaded again. This app does not use a service worker or an app-managed conversation cache. Avoid sharing sensitive personal information.</p>
        <button type="button" className="privacy-close" onClick={() => setPrivacyOpen(false)}>UNDERSTOOD</button>
      </section>
    </div>}
  </main>;
}
