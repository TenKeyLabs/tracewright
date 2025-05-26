import test from "@playwright/test";
import tracewright from "@withmantle/tracewright";

test("Youtube", async ({ page }) => {
  await page.goto("https://youtube.com");

  await tracewright(page, {
    script: `- Search for "boston dynamics do you love me"
- Open the second video
- Expand the video description
- Done`,
  });
});
