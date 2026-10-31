import type { KokoroTTS } from "kokoro-js";

type SpeechRecognizer = Awaited<ReturnType<typeof createRecognizer>>;
export type VoiceModel = "voice" | "transcription";
export type VoiceModelProgress = {
  file?: string;
  progress?: number;
  status: "loading" | "download";
};
type ModelProgressCallback = (model: VoiceModel, progress: VoiceModelProgress) => void;

const ttsModelId = "onnx-community/Kokoro-82M-v1.0-ONNX";
const asrModelId = "onnx-community/whisper-tiny.en";
const sampleRate = 16_000;
let ttsPromise: Promise<KokoroTTS> | null = null;
let recognizerPromise: Promise<SpeechRecognizer> | null = null;

export type LocalTtsState = { status: "idle" | "loading" | "ready" | "error"; percent: number };
let ttsState: LocalTtsState = { status: "idle", percent: 0 };
const ttsListeners = new Set<() => void>();
const ttsCallbacks = new Set<ModelProgressCallback>();
const ttsFiles = new Map<string, { loaded: number; total: number }>();

function setTtsState(next: LocalTtsState) {
  ttsState = next;
  ttsListeners.forEach((listener) => listener());
}

export function getLocalTtsState(): LocalTtsState {
  return ttsState;
}

export function subscribeLocalTts(listener: () => void): () => void {
  ttsListeners.add(listener);
  return () => {
    ttsListeners.delete(listener);
  };
}

export function loadLocalTts(onProgress?: ModelProgressCallback): Promise<KokoroTTS> {
  if (onProgress) ttsCallbacks.add(onProgress);
  if (!ttsPromise) {
    ttsFiles.clear();
    setTtsState({ status: "loading", percent: 0 });
    ttsPromise = import("@huggingface/transformers")
      .then(({ env }) => {
        env.useBrowserCache = typeof caches !== "undefined";
        return import("kokoro-js");
      })
      .then(({ KokoroTTS: Model }) =>
        Model.from_pretrained(ttsModelId, {
          dtype: "q8",
          device: "wasm",
          progress_callback: (progress) => {
            const report = (update: VoiceModelProgress) => ttsCallbacks.forEach((callback) => callback("voice", update));
            if (progress.status === "progress") {
              ttsFiles.set(progress.file, { loaded: progress.loaded, total: progress.total });
              let loaded = 0;
              let total = 0;
              ttsFiles.forEach((file) => {
                loaded += file.loaded;
                total += file.total;
              });
              const percent = total > 0 ? Math.min(99, (loaded / total) * 100) : 0;
              setTtsState({ status: "loading", percent: Math.max(ttsState.percent, percent) });
              report({ status: "download", file: progress.file, progress: progress.progress });
            } else if (progress.status !== "ready") {
              report({ status: "loading", file: progress.file });
            } else {
              report({ status: "loading" });
            }
          },
        }),
      )
      .then((tts) => {
        setTtsState({ status: "ready", percent: 100 });
        return tts;
      })
      .catch((error: unknown) => {
        ttsPromise = null;
        setTtsState({ status: "error", percent: 0 });
        throw error;
      });
  }
  const promise = ttsPromise;
  if (onProgress) {
    void promise.then(
      () => ttsCallbacks.delete(onProgress),
      () => ttsCallbacks.delete(onProgress),
    );
  }
  return promise;
}

async function createRecognizer(onProgress?: ModelProgressCallback) {
  const { env, pipeline } = await import("@huggingface/transformers");
  env.useBrowserCache = typeof caches !== "undefined";
  return pipeline("automatic-speech-recognition", asrModelId, {
    dtype: "q8",
    progress_callback: (progress) => {
      if (progress.status === "progress") {
        onProgress?.("transcription", { status: "download", file: progress.file, progress: progress.progress });
      } else if (progress.status !== "ready") {
        onProgress?.("transcription", { status: "loading", file: progress.file });
      } else {
        onProgress?.("transcription", { status: "loading" });
      }
    },
  });
}

export function loadLocalRecognizer(onProgress?: ModelProgressCallback): Promise<SpeechRecognizer> {
  if (!recognizerPromise) {
    recognizerPromise = createRecognizer(onProgress).catch((error: unknown) => {
      recognizerPromise = null;
      throw error;
    });
    onProgress?.("transcription", { status: "loading" });
  }
  return recognizerPromise;
}

export async function transcribeLocalAudio(blob: Blob): Promise<string> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const frameCount = Math.ceil(decoded.duration * sampleRate);
    if (frameCount === 0) return "";

    const offlineContext = new OfflineAudioContext(1, frameCount, sampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineContext.destination);
    const resampled = await offlineContext.startRendering();
    const recognizer = await loadLocalRecognizer();
    const result = await recognizer(resampled.getChannelData(0));
    const transcript = Array.isArray(result) ? result[0]?.text ?? "" : result.text;
    return transcript.trim().slice(0, 900);
  } finally {
    await context.close();
  }
}
