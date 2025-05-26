import { Content, GenerateContentParameters, GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { GenerateCodeResponse } from "../llm_request";
import { ClickableDomResult } from "../page_helpers";
import { LLMProvider } from "./base_provider";

export class GeminiProvider implements LLMProvider {
  private gemini: GoogleGenAI;

  constructor() {
    const vertexai = process.env.GEMINI_API_KEY ? false : true;
    const apiVersion = vertexai ? "v1" : undefined

    // Gemini
    const apiKey = process.env.GEMINI_API_KEY || undefined

    // Vertex AI
    const location = process.env.GOOGLE_CLOUD_LOCATION || undefined
    const project = process.env.GOOGLE_CLOUD_PROJECT || undefined

    if (!apiKey && (!project || !location)) {
      throw new Error(
        "Either GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be set. https://googleapis.github.io/js-genai/release_docs/index.html#initialization"
      );
    }

    this.gemini = new GoogleGenAI({
      apiKey,
      project,
      location,
      vertexai,
      apiVersion,
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
      systemInstruction,
      scenarioText,
      domResult,
      pageUrl,
      screenshot,
      previouslyExecutedCode,
      currentStepErrorCode
    );

    const response = await this.gemini.models.generateContent(request);
    const answer = response.candidates?.[0]?.content?.parts?.[0]?.text;
    const inputTokenCount = response.usageMetadata?.promptTokenCount || 0;
    const outputTokenCount = response.usageMetadata?.candidatesTokenCount || 0;

    if (!answer) {
      return {
        code: "done",
        inputTokenCount: inputTokenCount,
        outputTokenCount: outputTokenCount,
      };
    }


    return {
      code: this.parseCodeResponse(answer),
      inputTokenCount,
      outputTokenCount,
    }
  }

  private buildRequest(
    systemInstruction: string,
    scenarioText: string,
    domResult: ClickableDomResult,
    pageUrl: string,
    screenshot: Buffer,
    previouslyExecutedCode: string,
    currentStepErrorCode: string
  ): GenerateContentParameters {
    const parts: Content[] = [];

    parts.push({ text: `Current Page URL: ${pageUrl}` } as Content);

    parts.push({ text: "Current Page Screenshot:" } as Content);
    parts.push({
      inlineData: { data: screenshot.toString("base64"), mimeType: "image/png" },
    } as Content);

    parts.push({ text: `Current Page Visible HTML: ${domResult.visibleElements}` } as Content);

    if (previouslyExecutedCode !== "") {
      parts.push({ text: `Already Executed Code:\n${previouslyExecutedCode}` } as Content);
    }

    if (currentStepErrorCode !== "") {
      parts.push({
        text: `Failed Code:\n${currentStepErrorCode}`,
      } as Content);
    }

    parts.push({ text: scenarioText } as Content);

    return {
      model: process.env.GEMINI_MODEL || "gemini-2.5-pro-preview-05-06",
      contents: parts,
      config: {
        systemInstruction,
        temperature: 0,
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
      },
    };
  }

  private parseCodeResponse(answer: string): string{
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

    return generatedCode.trim();
  }
}
