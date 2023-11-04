import { Message } from "@/types";
import { IconArrowUp } from "@tabler/icons-react";
import classnames from "classnames";
import { FC, KeyboardEvent, useEffect, useRef, useState } from "react";
import ChatModal from "./ChatModal";

interface Props {
  onSend: (message: Message) => void;
}

export const ChatInput: FC<Props> = ({ onSend }) => {
  const [content, setContent] = useState<string>();
  const [isModalOpen, setModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > 4000) {
      alert("Message limit is 4000 characters");
      return;
    }

    setContent(value);
  };

  const handleSend = () => {
    if (!content) {
      alert("Please enter a message");
      return;
    }

    // Check if the API key is set before sending a message
    if (!apiKey) {
      setModalOpen(true);
      return;
    }

    onSend({ role: "user", content });
    setContent("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleApiKeySubmit = (enteredApiKey: string) => {
    // Save the API key in session storage
    sessionStorage.setItem("openaiApiKey", enteredApiKey);
    setApiKey(enteredApiKey);
    handleModalClose();
  };

  useEffect(() => {
    // Retrieve the API key from session storage on component mount
    const storedApiKey = sessionStorage.getItem("openaiApiKey");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }

    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
    }
  }, [content]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className={classnames(
          "jankyborderchat bg-inherit backdrop-blur-lg text-red-700",
          "min-h-[44px] pl-4 pr-12 py-2 w-full focus:outline-none focus:ring-1 focus:ring-red-800 border-2 border-red-900"
        )}
        style={{ resize: "none" }}
        placeholder="Speak to it..."
        value={content}
        rows={1}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      <button onClick={() => handleSend()}>
        <IconArrowUp className="absolute right-2 bottom-3 h-8 w-8 hover:cursor-pointer rounded-full p-1 bg-red-500/20 rotate-45 text-red-700 hover:opacity-80" />
      </button>

      <ChatModal isOpen={isModalOpen} onClose={handleModalClose}>
        <h2>Enter OpenAI API Key</h2>
        <input
          type="text"
          placeholder="Enter your OpenAI API Key"
          value={apiKey || ""}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button onClick={() => handleApiKeySubmit(apiKey || "")}>Submit</button>
      </ChatModal>
    </div>
  );
};
