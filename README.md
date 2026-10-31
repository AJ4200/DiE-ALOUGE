# DiE-ALOUGE

DiE-ALOUGE is a Halloween conversation game built around one bad idea: you have agreed to speak with death.

The Silent Harbinger answers every message, each exchange costs part of your remaining thread, and the corridor does not care whether you are brave, clever, or lying. The only way out is through the dialogue.

## Features

- A Groq-powered Harbinger that remembers the current scene.
- A survival meter and a proper death/restart loop.
- Original local fonts, local ambience, heartbeat escalation, and a full-screen glitch intro.
- A rare `THEY ARE WATCHING YOU` interruption, enabled after your first message and appearing at randomized intervals of roughly two minutes.
- On-device voice input using quantized Whisper Tiny English, with no speech-recognition service.
- A breathy, whisper-like three-layer Harbinger chorus from the open-source Kokoro model: one line, three differently pitched and staggered soul-like voices, with crypt reverb and a replay button on each Harbinger message.
- A post-splash choice between separate text-chat and live-conversation modes. In text mode the voice model installs in the background so you can chat immediately; pressing a speaker button before it finishes plays a low grunt and shows how much of the voice is installed.
- A skull-led live conversation: final speech-recognition transcripts are sent automatically, and the Harbinger replies aloud before listening again. A central flame and the skull intensify as your thread dwindles, framed by two steady pillar flames.
- Angled, animated message-card borders that keep the full text readable.
- A universal readable-font toggle for the splash screen, menus, chat, and dialogs.
- An always-visible creator/copyright footer and a user-data notice explaining what chat and voice services handle.
- No player API-key prompt: the Groq key stays on the server.

## Getting started

This project uses Yarn and Node.js 20.9 or newer.

```bash
yarn install
```

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=gsk_your_key_here
# Optional. This is the default model if omitted.
GROQ_MODEL=openai/gpt-oss-20b
```

Then start the game:

```bash
yarn dev
```

Visit `http://localhost:3000`. The opening screen can be allowed to play through, or skipped with **Enter the Dialogue**. Use **Readable Type** on the splash screen or in the header to replace the game's decorative fonts with a clear system sans-serif throughout the interface; the setting lasts for the current page session. Some browsers block audible autoplay; entering the game grants audio permission. Open the header's angular sound mixer to independently adjust master volume, ambience, heartbeat, and Harbinger voice. Live mode shows a setup overlay while the quantized local voice and transcription models load. Model files are downloaded from Hugging Face on first use and reused from the browser Cache API on later visits when available; browser storage can be cleared or evicted. Together, the models require roughly 130 MB. Select **Privacy & Data** in the persistent footer for details about local audio processing, browser caching, and Groq requests.

After the splash, choose **Text Chat** to type messages or **Live Conversation** to make the animated Harbinger skull the focus of a hands-free call. The browser will ask for microphone permission; Whisper transcribes speech on your device and each recognized utterance is submitted automatically. Kokoro generates Harbinger speech locally. Audio is not sent to the voice models; recognized text is still sent to Groq to generate replies. The first voice-model download needs an internet connection, and the models run in the browser using WebAssembly. The skull is an animated in-page illustration, not a 3D model. Use **End Call** to pause listening and **Change Mode** to return to the mode picker.

## Scripts

| Command | Description |
| --- | --- |
| `yarn dev` | Start the local development server |
| `yarn build` | Create a production build |
| `yarn start` | Run the production server |
| `yarn lint` | Run ESLint |

## Project map

- `src/app/api/chat/route.ts` — Groq request and Harbinger rules.
- `src/components/game/death-dialogue.tsx` — game state, splash, audio, speech input, and chat UI.
- `public/assets/backgrounds/harbinger-crypt.svg` — local crypt backdrop; no remote image dependency.
- `public/assets/sounds/` — included ambience and heartbeat tracks.

## Notes

DiE-ALOUGE is fictional horror. Keep `GROQ_API_KEY` private: do not add `NEXT_PUBLIC_` to it and do not commit your local environment file.
