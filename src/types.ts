import { Page } from "@playwright/test";

export type TracewrightOptions = {
  script: string;
  alternateDoneString?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beforeEach?: (page: Page) => Promise<any> | any;
};
