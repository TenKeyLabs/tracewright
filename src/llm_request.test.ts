import { beforeEach, describe, expect, it, vi } from "vitest";
import { LLMProvider } from "./llm_providers/base_provider";
import { GenerateCodeResponse, LLMRequestHandler } from "./llm_request";
import { ClickableDomResult } from "./page_helpers";

// Mock the LLMProvider
const mockGenerateWithContext = vi.fn();
vi.mock("./llm_providers/base_provider", () => {
  return {
    LLMProvider: vi.fn().mockImplementation(() => {
      return {
        generateWithContext: mockGenerateWithContext,
      };
    }),
  };
});

export class TestProvider implements LLMProvider {
  constructor() {}

  async generateWithContext(
    systemInstruction: string,
    scenarioText: string,
    domResult: ClickableDomResult,
    pageUrl: string,
    screenshot: Buffer,
    previouslyExecutedCode: string,
    currentStepErrorCode: string
  ): Promise<GenerateCodeResponse> {
    return mockGenerateWithContext(
      systemInstruction,
      scenarioText,
      domResult,
      pageUrl,
      screenshot,
      previouslyExecutedCode,
      currentStepErrorCode
    );
  }
}

describe("LLMRequestHandler", () => {
  let mockProvider: LLMProvider;
  let handler: LLMRequestHandler;

  let systemInstruction: string;
  let scenarioText: string;
  let domResult: ClickableDomResult;
  let pageUrl: string;
  let screenshot: Buffer;
  let previouslyExecutedCode: string;
  let currentStepErrorCode: string;
  let includeSystemInstruction: boolean;
  let isCodeAnswer: boolean;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProvider = new TestProvider();
    handler = new LLMRequestHandler(mockProvider);

    systemInstruction = "Test System Instruction";
    scenarioText = "Test Scenario";
    domResult = { visibleElements: "<button>Click Me</button>", hiddenElements: "" };
    pageUrl = "http://example.com";
    screenshot = Buffer.from("test-screenshot");
    previouslyExecutedCode = "console.log('previous');";
    currentStepErrorCode = "Error: something went wrong";
    includeSystemInstruction = true;
    isCodeAnswer = true;
  });

  describe("constructor", () => {
    it("should correctly assign the provider", () => {
      expect(handler["provider"]).toBe(mockProvider);
    });
  });

  describe("generateWithContext", () => {
    it("should call the provider's generateWithContext method with all arguments", async () => {
      const expectedResponse: GenerateCodeResponse = { code: "console.log('test');" };
      mockGenerateWithContext.mockResolvedValue(expectedResponse);

      const result = await handler.generateWithContext(
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

      expect(mockGenerateWithContext).toHaveBeenCalledTimes(1);
      expect(mockGenerateWithContext).toHaveBeenCalledWith(
        systemInstruction,
        scenarioText,
        domResult,
        pageUrl,
        screenshot,
        previouslyExecutedCode,
        currentStepErrorCode
      );
      expect(result).toEqual(expectedResponse);
    });

    it("should return the response from the provider's method", async () => {
      const expectedResponse: GenerateCodeResponse = { code: "await click('#id');" };
      mockGenerateWithContext.mockResolvedValue(expectedResponse);

      const result = await handler.generateWithContext(
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

      expect(result).toBe(expectedResponse);
    });

    it("should handle errors from the provider's method", async () => {
      const expectedError = new Error("Provider error");
      mockGenerateWithContext.mockRejectedValue(expectedError);

      await expect(
        handler.generateWithContext(
          systemInstruction,
          scenarioText,
          domResult,
          pageUrl,
          screenshot,
          previouslyExecutedCode,
          currentStepErrorCode,
          includeSystemInstruction,
          isCodeAnswer
        )
      ).rejects.toThrow(expectedError);
    });
  });
});
