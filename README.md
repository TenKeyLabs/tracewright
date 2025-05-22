# Tracewright

## Description

An LLM-powered automation agent for Playwright

## Example

```
test("Go to a page and let it loose", async ({ page }) => {
  await page.goto("https://app.website.com/");

  await tracewright(page, {
    script: `- Login with the username of ${username}, hit next, password of ${password}
- Click on the task called "Tracewright Task"
- Delete the task
- Once it's not in the list, you're done`,
  });
})
```

<!-- ## Features

[Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuring-dependabot-version-updates#enabling-github-dependabot-version-updates), [Changesets](https://github.com/changesets/changesets) ([cli](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md), [actions](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md))

## Configuration

These are some configurations considerations when settings up the repo and applying our workflow. See the links above for docs on the tools themselves.

### Changeset Config

The changelog generator uses a repo path. Update the path and check other settings overall in `.changeset/config.json`.

### Github Action workflow

There are a few commented lines that aren't application to this template but might be for OSS packages in `.github/workflows/release.yml`.

### Github Actions Permissions

For automatic gtihub releases via actions, double-check that the "Allow GitHub Actions to create and approve pull requests" option is enabled in the repo's [settings page](https://github.com/TenKeyLabs/oss-template/settings/actions).

### NPM Publishing Token

For automatica NPM publishing via actions...

1. Add a new package in the [tenkeylabs npm org](https://www.npmjs.com/settings/tenkeylabs/packages)
1. Generate a new [NPM token](https://docs.npmjs.com/about-access-tokens#about-granular-access-tokens) that has read/write access scoped to specific package.
1. Add the token to 1Password with the expiry date.
1. Add the token to the [repo's secrets](https://github.com/TenKeyLabs/oss-template/settings/secrets/actions) with the name that matches the one used in the workflow (default is NPM_TOKEN).

## Evoluationary Options

### Multi-package Monorepo

TBD - Current thoughts are slot in PNPM instead of YARN. Changeset works well with any package manager though. -->

```

```
