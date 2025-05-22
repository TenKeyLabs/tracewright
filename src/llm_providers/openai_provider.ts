import OpenAI from "openai";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat";
import { GenerateCodeResponse } from "../llm_request";
import { CODE_SYSTEM_INSTRUCTION, LLMProvider } from "./base_provider";

export class OpenAIProvider implements LLMProvider {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateWithContext(
    scenarioText: string,
    htmlBody: string,
    pageUrl: string,
    screenshot: Buffer,
    previouslyExecutedCode: string,
    currentStepErrorCode: string
  ): Promise<GenerateCodeResponse> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: CODE_SYSTEM_INSTRUCTION,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Current Page URL: ${pageUrl}` },
            { type: "text", text: `Current Page Screenshot:` },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${screenshot.toString("base64")}`,
              },
            },
            { type: "text", text: `Current Page HTML:\n${htmlBody}` },
            { type: "text", text: `Already Executed Code:\n${previouslyExecutedCode}` },
            ...(currentStepErrorCode
              ? [
                  {
                    type: "text",
                    text: `The current step failed and encountered these errors:\n${currentStepErrorCode}`,
                  },
                ]
              : []),
            { type: "text", text: `User Script:\n${scenarioText}` },
          ],
        },
      ],
      max_completion_tokens: 4096,
      temperature: 0,
    } as ChatCompletionCreateParamsNonStreaming);

    const answer = response.choices[0]?.message?.content;
    if (!answer) {
      return {
        code: "done",
      };
    }

    let generatedCode: string;
    if (answer.includes("```")) {
      const regex = /```typescript\n(.*)\n```/gs;
      const matches = regex.exec(answer);
      if (!matches) {
        throw new Error("No code matches found");
      }
      generatedCode = matches[1];
    } else {
      generatedCode = answer;
    }

    return { code: generatedCode.trim() };
  }
}
