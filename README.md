# Tracewright

An LLM-powered automation agent for Playwright

- Efficiently accomplishes executes natural language tasks for websites
- Provides Playwright locator hooks to help make LLM interactions be more efficient
- Outputs screenshots, functional Playwright code, and interactable DOM elements for each step

## Example Usage

```bash
gcloud auth login
```

```typescript
test("Go to a page and let it loose", async ({ page }) => {
  await page.goto("https://app.website.com/");

  await tracewright(page, {
    script: `- Login with the username of ${username}, hit next, password of ${password}
- Click on the task called "Tracewright Task"
- Delete the task
- Once it's not in the list, you're done`,
  });
});
```

## Why build this tool?

**Workflow Empowerment** - There are a lot of computer-use tools out there but we wanted something to plug directly into our workflow when working with Playwright. Specifically, the ability to use this agent within the Playwright test runner and alongside vanilla Playwright code has improved productivity.

**Outputs for Agentic Flows** - The output artifacts have a number of useful downstream use cases. Use cases like autogenerating Help Desk articles or generating Marketing videos are being explores. Really excited to hear what the community is coming up with, please share to inspire others!

**Flexibility** - Having the tool written in Typescript and support for Playwright mechanisms into the flow allows you to customize the experience to adjust the different nuances of all the websites out there. If the HTML parser or page waiting logic isn't working for you, you can adjust in realtime and hopefully submit a PR!
