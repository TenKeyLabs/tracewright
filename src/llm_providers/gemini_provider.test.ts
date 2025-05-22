import type { GenerateContentRequest, InlineDataPart, Part, TextPart } from "@google-cloud/vertexai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClickableDomResult } from "../page_helpers";
import { GeminiProvider } from "./gemini_provider";

const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}));

vi.mock("@google-cloud/vertexai", async () => {
  return {
    VertexAI: vi.fn(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
    HarmCategory: {
      HARM_CATEGORY_DANGEROUS_CONTENT: "HARM_CATEGORY_DANGEROUS_CONTENT_MOCK",
      HARM_CATEGORY_HARASSMENT: "HARM_CATEGORY_HARASSMENT_MOCK",
      HARM_CATEGORY_HATE_SPEECH: "HARM_CATEGORY_HATE_SPEECH_MOCK",
      HARM_CATEGORY_SEXUALLY_EXPLICIT: "HARM_CATEGORY_SEXUALLY_EXPLICIT_MOCK",
    },
    HarmBlockThreshold: {
      BLOCK_ONLY_HIGH: "BLOCK_ONLY_HIGH_MOCK",
    },
  };
});

describe("GeminiProvider", () => {
  let geminiProvider: GeminiProvider;
  let systemInstruction: string;
  let scenarioText: string;
  let domResult: ClickableDomResult;
  let pageUrl: string;
  let screenshot: Buffer;
  let previouslyExecutedCode: string;
  let currentStepErrorCode: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    geminiProvider = new GeminiProvider();

    systemInstruction = "Test System Instruction";
    scenarioText = "Test Scenario: Click the button.";
    domResult = {
      visibleElements: '<button id="btn-1">Submit</button>',
      hiddenElements: "",
    };
    pageUrl = "https://example.com/test";
    screenshot = Buffer.from("fake-screenshot-data");
    previouslyExecutedCode = "";
    currentStepErrorCode = "";
  });

  describe("constructor", () => {
    it("should initialize VertexAI with correct project and location", async () => {
      const { VertexAI: VertexAIMock } = await import("@google-cloud/vertexai");

      expect(VertexAIMock).toHaveBeenCalledTimes(1); // Ensures it's called once per beforeEach
      expect(VertexAIMock).toHaveBeenCalledWith({
        project: "tenkeylabs-poc",
        location: "us-central1",
      });
    });
  });

  describe("generateWithContext", () => {
    it("should call getGenerativeModel with correct parameters", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { candidates: [{ content: { parts: [{ text: "some code" }] } }] },
      });

      await geminiProvider.generateWithContext(
        systemInstruction,
        scenarioText,
        domResult,
        pageUrl,
        screenshot,
        previouslyExecutedCode,
        currentStepErrorCode
      );

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: "gemini-2.5-pro-preview-05-06",
        systemInstruction: systemInstruction,
      });
    });

    it("should parse response with a code block", async () => {
      const codeInBlock = 'console.log("Hello from code block");';
      mockGenerateContent.mockResolvedValueOnce({
        response: { candidates: [{ content: { parts: [{ text: `\`\`\`javascript\n${codeInBlock}\n\`\`\`` }] } }] },
      });

      const result = await geminiProvider.generateWithContext(
        systemInstruction,
        scenarioText,
        domResult,
        pageUrl,
        screenshot,
        previouslyExecutedCode,
        currentStepErrorCode
      );
      expect(result).toEqual({ code: codeInBlock });
    });

    it("should parse response with plain text code", async () => {
      const plainCode = 'await click("#element");';
      mockGenerateContent.mockResolvedValueOnce({
        response: { candidates: [{ content: { parts: [{ text: plainCode }] } }] },
      });

      const result = await geminiProvider.generateWithContext(
        systemInstruction,
        scenarioText,
        domResult,
        pageUrl,
        screenshot,
        previouslyExecutedCode,
        currentStepErrorCode
      );
      expect(result).toEqual({ code: plainCode });
    });

    it('should return { code: "done" } if LLM response has no text in part', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { candidates: [{ content: { parts: [{ text: undefined }] } }] },
      });
      const result = await geminiProvider.generateWithContext(
        systemInstruction,
        scenarioText,
        domResult,
        pageUrl,
        screenshot,
        previouslyExecutedCode,
        currentStepErrorCode
      );
      expect(result).toEqual({ code: "done" });
    });

    it('should return { code: "done" } if LLM response.response is empty (no candidates path)', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {},
      });
      const result = await geminiProvider.generateWithContext(
        systemInstruction,
        scenarioText,
        domResult,
        pageUrl,
        screenshot,
        previouslyExecutedCode,
        currentStepErrorCode
      );
      expect(result).toEqual({ code: "done" });
    });

    it("should throw error for malformed code block in response", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { candidates: [{ content: { parts: [{ text: "```javascript\nmalformed" }] } }] },
      });

      await expect(
        geminiProvider.generateWithContext(
          systemInstruction,
          scenarioText,
          domResult,
          pageUrl,
          screenshot,
          previouslyExecutedCode,
          currentStepErrorCode
        )
      ).rejects.toThrow("No code matches found");
    });

    describe("request building", () => {
      it("should build request with all context parts when all inputs are provided", async () => {
        mockGenerateContent.mockResolvedValueOnce({
          response: { candidates: [{ content: { parts: [{ text: "some code" }] } }] },
        });
        previouslyExecutedCode = "console.log('old code');";
        currentStepErrorCode = "Error: previous step failed";

        await geminiProvider.generateWithContext(
          systemInstruction,
          scenarioText,
          domResult,
          pageUrl,
          screenshot,
          previouslyExecutedCode,
          currentStepErrorCode
        );

        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        const request = mockGenerateContent.mock.calls[0][0] as GenerateContentRequest;

        expect(request.contents[0].role).toBe("user");
        const parts = request.contents[0].parts as Part[];

        expect(parts.length).toBe(7);
        expect((parts[0] as TextPart).text).toBe(`Current Page URL: ${pageUrl}`);
        expect((parts[1] as TextPart).text).toBe("Current Page Screenshot:");
        expect((parts[2] as InlineDataPart).inlineData).toEqual({
          data: screenshot.toString("base64"),
          mimeType: "image/png",
        });
        expect((parts[3] as TextPart).text).toBe(`Current Page Visible HTML: ${domResult.visibleElements}`);
        expect((parts[4] as TextPart).text).toBe(`Already Executed Code:\n${previouslyExecutedCode}`);
        expect((parts[5] as TextPart).text).toBe(`Failed Code:\n${currentStepErrorCode}`);
        expect((parts[6] as TextPart).text).toBe(scenarioText);

        expect(request.generationConfig).toEqual({ temperature: 0 });
        expect(request.safetySettings).toEqual([
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT_MOCK", threshold: "BLOCK_ONLY_HIGH_MOCK" },
          { category: "HARM_CATEGORY_HARASSMENT_MOCK", threshold: "BLOCK_ONLY_HIGH_MOCK" },
          { category: "HARM_CATEGORY_HATE_SPEECH_MOCK", threshold: "BLOCK_ONLY_HIGH_MOCK" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT_MOCK", threshold: "BLOCK_ONLY_HIGH_MOCK" },
        ]);
      });

      it("should build request excluding optional parts when they are empty", async () => {
        mockGenerateContent.mockResolvedValueOnce({
          response: { candidates: [{ content: { parts: [{ text: "some code" }] } }] },
        });
        // previouslyExecutedCode and currentStepErrorCode are empty (set in beforeEach)

        await geminiProvider.generateWithContext(
          systemInstruction,
          scenarioText,
          domResult,
          pageUrl,
          screenshot,
          "",
          ""
        );

        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        const request = mockGenerateContent.mock.calls[0][0] as GenerateContentRequest;
        const parts = request.contents[0].parts as Part[];

        expect(parts.length).toBe(5);
        expect((parts[0] as TextPart).text).toBe(`Current Page URL: ${pageUrl}`);
        expect((parts[1] as TextPart).text).toBe("Current Page Screenshot:");
        expect((parts[2] as InlineDataPart).inlineData).toEqual({
          data: screenshot.toString("base64"),
          mimeType: "image/png",
        });
        expect((parts[3] as TextPart).text).toBe(`Current Page Visible HTML: ${domResult.visibleElements}`);
        expect((parts[4] as TextPart).text).toBe(scenarioText);

        expect(parts.find((part) => (part as TextPart).text?.includes("Already Executed Code:"))).toBeUndefined();
        expect(parts.find((part) => (part as TextPart).text?.includes("Failed Code:"))).toBeUndefined();
      });
    });
  });
});
