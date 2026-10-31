import type { Metadata } from "next";
import "../styles/globals.css";
import "../styles/glitch.css";

export const metadata: Metadata = {
  title: "DiE-ALOUGE | Speak. Survive. Die.",
  description: "A conversation with death where every answer has a cost.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
