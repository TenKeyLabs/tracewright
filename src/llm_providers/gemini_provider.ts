import {
  GenerateContentRequest,
  HarmBlockThreshold,
  HarmCategory,
  InlineDataPart,
  Part,
  TextPart,
  VertexAI,
} from "@google-cloud/vertexai";
import { GenerateCodeResponse } from "../llm_request";
import { ClickableDomResult } from "../page_helpers";
import { LLMProvider } from "./base_provider";

export class GeminiProvider implements LLMProvider {
  private vertexAI: VertexAI;

  constructor() {
    this.vertexAI = new VertexAI({
      project: "",
      location: "",
    });
  }

  async generateWithContext(
    systemInstruction: string,
    scenarioText: string,
    domResult: ClickableDomResult,
    pageUrl: string,
    screenshot: Buffer,
    previouslyExecutedCode: string,
    currentStepErrorCode: string
  ): Promise<GenerateCodeResponse> {
    const request = this.buildRequest(
      scenarioText,
      domResult,
      pageUrl,
      screenshot,
      previouslyExecutedCode,
      currentStepErrorCode
    );

    const generativeVisionModel = this.vertexAI.getGenerativeModel({
      model: "gemini-2.5-pro-preview-05-06",
      systemInstruction,
    });

    const response = await generativeVisionModel.generateContent(request);
    const answer = response.response.candidates?.[0].content.parts[0].text;

    if (!answer) {
      return {
        code: "done",
      };
    }

    return this.parseResponse(answer);
  }

  private buildRequest(
    scenarioText: string,
    domResult: ClickableDomResult,
    pageUrl: string,
    screenshot: Buffer,
    previouslyExecutedCode: string,
    currentStepErrorCode: string
  ): GenerateContentRequest {
    const parts: Part[] = [];

    parts.push({ text: `Current Page URL: ${pageUrl}` } as TextPart);

    parts.push({ text: "Current Page Screenshot:" } as TextPart);
    parts.push({
      inlineData: { data: screenshot.toString("base64"), mimeType: "image/png" },
    } as InlineDataPart);

    parts.push({ text: `Current Page Visible HTML: ${domResult.visibleElements}` } as TextPart);

    if (previouslyExecutedCode !== "") {
      parts.push({ text: `Already Executed Code:\n${previouslyExecutedCode}` } as TextPart);
    }

    if (currentStepErrorCode !== "") {
      parts.push({
        text: `Failed Code:\n${currentStepErrorCode}`,
      } as TextPart);
    }

    parts.push({ text: scenarioText } as TextPart);

    return {
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    };
  }

  private parseResponse(answer: string): GenerateCodeResponse {
    let generatedCode: string;
    if (answer.includes("```")) {
      const regex = /```.*?\n(.*)\n```/gs;
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
