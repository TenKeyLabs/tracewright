# Tracewright

An LLM-powered automation agent for Playwright

- Efficiently accomplishes executes natural language tasks for websites
- Provides Playwright locator hooks to help make LLM interactions be more efficient
- Outputs screenshots, functional Playwright code, and interactable DOM elements for each step

## Installation
Within any Playwright project.

```bash
npm install @withmantle/tracewright
```

## Usage

example.spec.ts
```typescript
import test from "@playwright/test"
import tracewright from 'tracewright';

test("Youtube", async ({ page }) => {
  await page.goto("https://youtube.com");

  await tracewright(page, {
    script: `- Search for "boston dynamics do you love me"
- Open the second video
- Expand the video description
- Done`,
  });
});
```

## Models
### Authentication
[VertexAI](https://cloud.google.com/docs/authentication/application-default-credentials#attached-sa)
```bash
gcloud auth application-default login
export GOOGLE_CLOUD_LOCATION=<location>
export GOOGLE_CLOUD_PROJECT=<name>
```
or
[Gemini Studio](https://aistudio.google.com/app/apikey)
```bash
export GEMINI_API_KEY=<api key>
```

### Model Selection
The default is but this can be overridden with the GEMINI_MODEL environment variable.

ex.
```
export GEMINI_MODEL=gemini-2.5-flash-preview-05-20
```

## Why build this tool?

**Workflow Empowerment** - There are a lot of computer-use tools out there but we wanted something to plug directly into our workflow when working with Playwright. Specifically, the ability to use this agent within the Playwright test runner and alongside vanilla Playwright code has improved productivity.

**Outputs for Agentic Flows** - The output artifacts have a number of useful downstream use cases. Use cases like autogenerating Help Desk articles or generating Marketing videos are being explores. Really excited to hear what the community is coming up with, please share to inspire others!

**Flexibility** - Having the tool written in Typescript and support for Playwright mechanisms into the flow allows you to customize the experience to adjust the different nuances of all the websites out there. If the HTML parser or page waiting logic isn't working for you, you can adjust in realtime and hopefully submit a PR!
