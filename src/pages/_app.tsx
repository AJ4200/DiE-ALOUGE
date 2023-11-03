import "@/styles/globals.css";
import "@/styles/glitch.css";
import "@/styles/titlecard.scss"
import "@/styles/matrix.css"

import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps<{}>) {
  return (
    <main>
      <Component {...pageProps} />
    </main>
  );
}
