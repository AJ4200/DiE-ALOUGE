import { Message, OpenAIModel } from "@/types";
import { createParser, type EventSourceMessage } from "eventsource-parser";

export const OpenAIStream = async (messages: Message[]) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    method: "POST",
    body: JSON.stringify({
      model: OpenAIModel.DAVINCI_TURBO,
      messages: [
        {
          role: "system",
          content: `You are a helpful, friendly, assistant.`
        },
        ...messages
      ],
      max_tokens: 800,
      temperature: 0.0,
      stream: true
    })
  });

  if (res.status !== 200) {
    throw new Error("OpenAI API returned an error");
  }

  const stream = new ReadableStream({
    async start(controller) {
      const parser = createParser({
        onEvent(event: EventSourceMessage) {
          const data = event.data;

          if (data === "[DONE]") {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const text = json.choices?.[0]?.delta?.content ?? "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          } catch (error) {
            controller.error(error);
          }
        },
        onError(error) {
          controller.error(error);
        },
      });

      const body = res.body;
      if (!body) {
        controller.close();
        return;
      }

      for await (const chunk of body) {
        parser.feed(decoder.decode(chunk, { stream: true }));
      }

      parser.feed(decoder.decode());
    },
  });

  return stream;
};
