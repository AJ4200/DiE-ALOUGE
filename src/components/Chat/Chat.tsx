import { Message } from "@/types";
import { FC } from "react";
import { ChatInput } from "./ChatInput";
import { ChatLoader } from "./ChatLoader";
import { ChatMessage } from "./ChatMessage";

interface Props {
  messages: Message[];
  loading: boolean;
  onSend: (message: Message) => void;
}

export const Chat: FC<Props> = ({ messages, loading, onSend }) => {
  return (
    <div
      className="jankyborderchat flex flex-col rounded-lg px-2 sm:p-4 border-neutral-300 fixed left-0 right-0"
      style={{
        backgroundImage:
          "url('https://th.bing.com/th/id/OIG.CW9oSsrUB8jYBUJC0jKV?pid=ImgGn')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {messages.map((message, index) => (
        <div key={index} className="my-1 sm:my-1.5">
          <ChatMessage message={message} />
        </div>
      ))}

      {loading && (
        <div className="my-1 sm:my-1.5">
          <ChatLoader />
        </div>
      )}

      <div className="mt-4 sm:mt-8 bottom-[56px] left-0 w-full">
        <ChatInput onSend={onSend} />
      </div>
    </div>
  );
};
