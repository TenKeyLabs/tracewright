import { LLMProvider } from "./llm_providers/base_provider";
import { ClickableDomResult } from "./page_helpers";

export type GenerateCodeResponse = {
  code: string;
  inputTokenCount: number;
  outputTokenCount: number;
};

export class LLMRequestHandler {
  private provider: LLMProvider;

  constructor(provider: LLMProvider) {
    this.provider = provider;
  }

  async generateWithContext(
    systemInstruction: string,
    scenarioText: string,
    domResult: ClickableDomResult,
    pageUrl: string,
    screenshot: Buffer,
    previouslyExecutedCode: string,
    currentStepErrorCode: string,
    includeSystemInstruction: boolean,
    isCodeAnswer: boolean
  ): Promise<GenerateCodeResponse> {
    return this.provider.generateWithContext(
      systemInstruction,
      scenarioText,
      domResult,
      pageUrl,
      screenshot,
      previouslyExecutedCode,
      currentStepErrorCode,
      includeSystemInstruction,
      isCodeAnswer
    );
  }
}
