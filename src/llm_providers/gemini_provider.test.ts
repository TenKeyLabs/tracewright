import { Content, GenerateContentParameters, GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClickableDomResult } from "../page_helpers";
import { GeminiProvider } from "./gemini_provider";


const mockGenerateContent = vi.fn();
vi.mock("@google/genai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@google/genai")>();

  return {
    ...actual,
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      }
    })),
    // Keep actual enum values for type safety if they are used in comparisons,
    // but for the purpose of being passed to the API, string mocks are fine if the code uses them as strings.
    // The code uses these as enum values, so we should mock them as such if possible, or ensure the mock matches usage.
    // Given the code passes these directly, we'll mock their string representations as used in the safetySettings.
    HarmCategory: {
        HARM_CATEGORY_DANGEROUS_CONTENT: "HARM_CATEGORY_DANGEROUS_CONTENT",
        HARM_CATEGORY_HARASSMENT: "HARM_CATEGORY_HARASSMENT",
        HARM_CATEGORY_HATE_SPEECH: "HARM_CATEGORY_HATE_SPEECH",
        HARM_CATEGORY_SEXUALLY_EXPLICIT: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    } as unknown as typeof HarmCategory, // Cast to satisfy type, actual values are strings for test
    HarmBlockThreshold: {
        BLOCK_ONLY_HIGH: "BLOCK_ONLY_HIGH",
    } as unknown as typeof HarmBlockThreshold, // Cast to satisfy type
  };
});

describe("GeminiProvider", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...process.env }; // Save original environment variables
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original environment variables
  });

  describe("constructor", () => {
    it("should initialize with GEMINI_API_KEY", () => {
      process.env.GEMINI_API_KEY = "test-api-key";
      delete process.env.GOOGLE_CLOUD_PROJECT;
      delete process.env.GOOGLE_CLOUD_LOCATION;

      const provider = new GeminiProvider();
      expect(GoogleGenAI).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        project: undefined,
        location: undefined,
        vertexai: false,
        apiVersion: undefined,
      });
    });

    it("should initialize with GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION for Vertex AI", () => {
      delete process.env.GEMINI_API_KEY;
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";
      process.env.GOOGLE_CLOUD_LOCATION = "test-location";

      new GeminiProvider();
      expect(GoogleGenAI).toHaveBeenCalledWith({
        apiKey: undefined,
        project: "test-project",
        location: "test-location",
        vertexai: true,
        apiVersion: "v1",
      });
    });

    it("should throw error if no API key or project/location is provided", () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_CLOUD_PROJECT;
      delete process.env.GOOGLE_CLOUD_LOCATION;

      expect(() => new GeminiProvider()).toThrowError(
        "Either GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be set."
      );
    });
  });

  describe("generateWithContext", () => {
    let provider: GeminiProvider;
    const systemInstruction = "system instruction";
    const scenarioText = "scenario text";
    const domResult: ClickableDomResult = {
      visibleElements: "<button>Click Me</button>",
      hiddenElements: "",
    };
    const pageUrl = "http://example.com";
    const screenshot = Buffer.from("screenshot data");
    const previouslyExecutedCode = "console.log('previous');";
    const currentStepErrorCode = "Error: previous step failed";

    beforeEach(() => {
      process.env.GEMINI_API_KEY = "test-api-key"; // Ensure constructor doesn't throw
      provider = new GeminiProvider();
    });

    it("should call generateContent with all request parts and parse the response with code block", async () => {
      process.env.GEMINI_MODEL = "test-specific-model";
      const mockApiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: "```javascript\nconsole.log('hello');\n```" }],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
        },
      };
      mockGenerateContent.mockResolvedValue(mockApiResponse);

      const response = await provider.generateWithContext(
        systemInstruction,
        scenarioText,
        domResult,
        pageUrl,
        screenshot,
        previouslyExecutedCode,
        currentStepErrorCode
      );

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      const calledWith = mockGenerateContent.mock.calls[0][0] as GenerateContentParameters;

      expect(calledWith.model).toBe("test-specific-model");
      expect(calledWith.contents).toEqual([
        { text: `Current Page URL: ${pageUrl}` } as Content,
        { text: "Current Page Screenshot:" } as Content,
        { inlineData: { data: screenshot.toString("base64"), mimeType: "image/png" } } as Content,
        { text: `Current Page Visible HTML: ${domResult.visibleElements}` } as Content,
        { text: `Already Executed Code:\n${previouslyExecutedCode}` } as Content,
        { text: `Failed Code:\n${currentStepErrorCode}` } as Content,
        { text: scenarioText } as Content,
      ]);
      expect(calledWith.config?.systemInstruction).toBe(systemInstruction);
      expect(calledWith.config?.temperature).toBe(0);
      expect(calledWith.config?.safetySettings).toEqual([
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      ]);

      expect(response).toEqual({
        code: "console.log('hello');",
        inputTokenCount: 10,
        outputTokenCount: 5,
      });
    });

    it("should handle response with no code block", async () => {
        const mockApiResponse = {
          candidates: [
            {
              content: {
                parts: [{ text: "just some text, no code block" }],
              },
            },
          ],
          usageMetadata: {
            promptTokenCount: 8,
            candidatesTokenCount: 3,
          },
        };
        mockGenerateContent.mockResolvedValue(mockApiResponse);

        const response = await provider.generateWithContext(
          systemInstruction,
          scenarioText,
          domResult,
          pageUrl,
          screenshot,
          "",
          ""
        );

        expect(response).toEqual({
          code: "just some text, no code block",
          inputTokenCount: 8,
          outputTokenCount: 3,
        });
      });

    it("should return 'done' if the API response has no answer text", async () => {
      const mockApiResponse = {
        candidates: [{ content: { parts: [{ text: undefined as any }] } }], // No text
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 0 },
      };
      mockGenerateContent.mockResolvedValue(mockApiResponse);

      const response = await provider.generateWithContext(
        systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode
      );
      expect(response).toEqual({ code: "done", inputTokenCount: 10, outputTokenCount: 0 });
    });

    it.each([
        { case: "no parts", apiResponse: { candidates: [{ content: { parts: [] } }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 } } },
        { case: "no content", apiResponse: { candidates: [{ content: undefined }], usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 0 } } },
        { case: "no candidates", apiResponse: { candidates: [], usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 0 } } },
        { case: "null candidates", apiResponse: { candidates: null, usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 0 } } },
        { case: "null usageMetadata", apiResponse: { candidates: [], usageMetadata: null } },

    ])("should return 'done' and token counts (or 0 if unavailable) when API response has $case", async ({ apiResponse }) => {
        mockGenerateContent.mockResolvedValue(apiResponse);
        const response = await provider.generateWithContext(
            systemInstruction, scenarioText, domResult, pageUrl, screenshot, "", ""
        );
        expect(response.code).toBe("done");
        expect(response.inputTokenCount).toBe(apiResponse.usageMetadata?.promptTokenCount || 0);
        expect(response.outputTokenCount).toBe(apiResponse.usageMetadata?.candidatesTokenCount || 0);
    });


    it("should correctly build request parts without previously executed code and error code", async () => {
        const mockApiResponse = {
            candidates: [{ content: { parts: [{ text: "code" }] } }],
            usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
        };
        mockGenerateContent.mockResolvedValue(mockApiResponse);
        process.env.GEMINI_MODEL = "test-model-no-extras";

        await provider.generateWithContext(
            systemInstruction, scenarioText, domResult, pageUrl, screenshot, "", ""
        );

        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        const calledWith = mockGenerateContent.mock.calls[0][0] as GenerateContentParameters;

        expect(calledWith.model).toBe("test-model-no-extras");
        const expectedContents: Content[] = [
            { text: `Current Page URL: ${pageUrl}` } as Content,
            { text: "Current Page Screenshot:" } as Content,
            { inlineData: { data: screenshot.toString("base64"), mimeType: "image/png" } } as Content,
            { text: `Current Page Visible HTML: ${domResult.visibleElements}` } as Content,
            { text: scenarioText } as Content,
        ];
        // Check if all expected contents are present and no unexpected ones
        expect(calledWith.contents).toEqual(expect.arrayContaining(expectedContents));
        expect(calledWith.contents).toHaveLength(expectedContents.length);

        expect(calledWith.config?.systemInstruction).toBe(systemInstruction);
    });

    it("should use default GEMINI_MODEL if environment variable is not set", async () => {
        const mockApiResponse = {
            candidates: [{ content: { parts: [{ text: "code" }] } }],
            usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
        };
        mockGenerateContent.mockResolvedValue(mockApiResponse);
        delete process.env.GEMINI_MODEL;

        await provider.generateWithContext(
            systemInstruction, scenarioText, domResult, pageUrl, screenshot, "", ""
        );
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        const calledWith = mockGenerateContent.mock.calls[0][0] as GenerateContentParameters;
        expect(calledWith.model).toBe("gemini-2.5-flash");
    });

    it("should throw error if parseCodeResponse finds no matches in a malformed code block", async () => {
        const mockApiResponse = {
          candidates: [ { content: { parts: [{ text: "```\n```" }] } } ], // Malformed/empty code block
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        };
        mockGenerateContent.mockResolvedValue(mockApiResponse);

        await expect(provider.generateWithContext(
          systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode
        )).rejects.toThrowError("No code matches found");
      });
  });
});
