import { GenerateCodeResponse } from "../llm_request";
import { ClickableDomResult } from "../page_helpers";

export const CODE_SYSTEM_INSTRUCTION =
  "You are a code-generation assistant. Your only task is to output Playwright executable code in Typescript. Avoid writing code that will fail.";
export const CODE_GENERATION_PROMPT = `Prompt:\nGiven that Playwright has already navigated to the Current Page URL, the website consists of the Current Page HTML, current screen is the Current Page Screenshot, and the User Script, create a script that will the perform the next logical step to accomplish the User Script. output code to perform one action. Do not use a "page.goto" in the answer. Do not use comments in the answer. Ignore help menus. When clicking on a button, return only one line of code that includes the click command. When filling out a form, output all the code needed to fill out the form. All Playwright commands should have a timeout of 5 seconds. When you are done the plan in the User Script, create a script that only returns "done". Do not use import statements in the code. When calling an async function, use await. If there is a modal on the screen, close it before continuing the script`;

export interface LLMProvider {
  generateWithContext(
    systemInstruction: string,
    scenarioText: string,
    domResult: ClickableDomResult,
    pageUrl: string,
    screenshot: Buffer,
    previouslyExecutedCode: string,
    currentStepErrorCode: string,
    includeSystemInstruction: boolean,
    isCodeAnswer: boolean
  ): Promise<GenerateCodeResponse>;
}
