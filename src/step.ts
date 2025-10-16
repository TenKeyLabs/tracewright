import { Page } from "@playwright/test";
import fs from "fs";
import { CODE_GENERATION_PROMPT, CODE_SYSTEM_INSTRUCTION } from "./llm_providers/base_provider";
import { GenerateCodeResponse, LLMRequestHandler } from "./llm_request";
import { executeCode, getInteractiveHTML } from "./page_helpers";

export const generateStep = async (
  llmHandler: LLMRequestHandler,
  page: Page,
  scenarioText: string,
  stepCount: number,
  previouslyExecutedCode: string,
  currentStepErrorCode: string
): Promise<GenerateCodeResponse> => {
  await page.screenshot({
    fullPage: true,
    path: `./steps/${stepCount}-screenshot.png`,
  });

  const domResult = await getInteractiveHTML(page);
  fs.writeFileSync(`./steps/${stepCount}-source.html`, domResult.visibleElements);

  const screenshot = await page.screenshot({
    fullPage: true,
    path: `./steps/${stepCount}-screenshot-mocked.jpeg`,
    type: "jpeg",
    quality: 100,
  });

  const codeResponse = await llmHandler.generateWithContext(
    CODE_SYSTEM_INSTRUCTION,
    scenarioText + "\n\n" + CODE_GENERATION_PROMPT,
    domResult,
    page.url(),
    screenshot,
    previouslyExecutedCode,
    currentStepErrorCode,
    true,
    true
  );

  fs.writeFileSync(`./steps/${stepCount}-code.ts`, codeResponse.code);

  return codeResponse;
};

export const performStep = async (page: Page, codeResponse: GenerateCodeResponse): Promise<string | undefined> => {
  try {
    await executeCode(page, codeResponse);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return error.stack;
  }

  return undefined;
};

export const cleanStepFiles = () => {
  if (!fs.existsSync("./steps")) {
    fs.mkdirSync("./steps");
  }

  fs.rmSync("./steps/*", { recursive: true, force: true });
};
