import { Page } from "@playwright/test";
import chalk from "chalk";
import { GenerateCodeResponse } from "./llm_request";
import { clearElementHighlights } from "./page_helpers";
import { cleanStepFiles, generateStep, performStep } from "./step";

export type TracewrightOptions = {
  script: string;
  alternateDoneString?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beforeEach?: (page: Page) => Promise<any> | any;
};

export const tracewright = async (page: Page, options: TracewrightOptions) => {
  const { script, alternateDoneString, beforeEach } = options;
  const doneString = alternateDoneString || "done";

  let stepCounter = 1;
  const allExecutedStepCode: string[] = [];
  let currentStopCodeResponse: GenerateCodeResponse;
  let currentStepErroredCode: string[] = [];

  cleanStepFiles();

  while (true) {
    console.info(chalk.green("*** step"), stepCounter);
    console.info("waiting for page to settle...");

    if (beforeEach) {
      console.info("running beforeEach...");
      await beforeEach(page);
    } else {
      await page.waitForTimeout(5000);
    }

    if (allExecutedStepCode.length > 0) {
      console.info("successfully executed code:");
      console.info(chalk.gray(allExecutedStepCode.join("\n")));
    }

    if (currentStepErroredCode.length > 0) {
      console.info("current errors:");
      console.info(chalk.gray(currentStepErroredCode.join("\n")));
    }

    console.info("generating code...");
    currentStopCodeResponse = await generateStep(
      page,
      script,
      stepCounter,
      allExecutedStepCode.join("\n"),
      currentStepErroredCode.join("\n\n")
    );
    console.info(chalk.gray(currentStopCodeResponse.code));

    await clearElementHighlights(page);

    if (currentStopCodeResponse.code === doneString) {
      console.info(chalk.green("script completed"));
      break;
    }

    const stepErrorStack = await performStep(page, currentStopCodeResponse);
    if (stepErrorStack) {
      console.error(chalk.red("error executing step"), stepCounter);
      console.error(stepErrorStack);
      currentStepErroredCode.push(stepErrorStack);
      continue;
    }

    allExecutedStepCode.push(currentStopCodeResponse.code);
    currentStepErroredCode = [];

    console.info(chalk.green("*** end of step"), stepCounter);

    stepCounter++;
  }
};
