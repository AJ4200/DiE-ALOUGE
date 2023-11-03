import { Message } from "@/types";
import { FC } from "react";

interface Props {
  message: Message;
}

export const ChatMessage: FC<Props> = ({ message }) => {
  return (
    <div
      className={`flex flex-col ${
        message.role === "assistant" ? "items-start" : "items-end"
      }`}
      style={{ fontFamily: "Die" }}
    >
      <div
        className={`flex items-center drop-shadow-md jankyborder text-lg  ${
          message.role === "assistant"
            ? "bg-gray-950/20 border-red-600 border-[2px] text-red-600 backdrop-blur-md"
            : "bg-red-500 text-white"
        } rounded-2xl p-4 max-w-[70%] whitespace-pre-wrap`}
        style={{
          overflowWrap: "anywhere",
        }}
      >
        {message.content}
      </div>
    </div>
  );
};
