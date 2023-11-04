import { Message } from "@/types";
import { FC } from "react";
import { ChatInput } from "./ChatInput";
import { ChatLoader } from "./ChatLoader";
import { ChatMessage } from "./ChatMessage";
import classnames from "classnames";

interface Props {
  messages: Message[];
  loading: boolean;
  onSend: (message: Message) => void;
}

export const Chat: FC<Props> = ({ messages, loading, onSend }) => {
  return (
    <div
      className={classnames(
        "border-[1rem]",
        "jankyborderchat flex flex-col rounded-lg px-2 sm:p-4 border-neutral-300 fixed left-0 right-0 bottom-14 max-h-[82%] overflow-y-auto"
      )}
      style={{
        backgroundImage:
          "url('https://th.bing.com/th/id/OIG.CW9oSsrUB8jYBUJC0jKV?pid=ImgGn')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        borderImage:
          "url('https://th.bing.com/th/id/OIG.3jCC7osYT8HaQ_S8OGFl?pid=ImgGn')",
          borderImageRepeat: "round"
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

      <div className="mt-8 sm:mt-8 left-0 w-full sticky bottom-0">
        <ChatInput onSend={onSend} />
      </div>
    </div>
  );
};
