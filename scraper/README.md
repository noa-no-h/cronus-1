# Scraper

This package contains scripts for scraping data from various sources.

## GitHub Contributor Scraper

This script scrapes all contributors from a given GitHub repository.

### Usage

1.  Make sure you have `bun` installed.
2.  Navigate to the scraper directory `cd scraper`.
3.  Install dependencies: `bun install`
4.  You can set a `GITHUB_TOKEN` environment variable to use an authenticated session to avoid rate limiting. Create a personal access token with `repo` scope [here](https://github.com/settings/tokens).
5.  Run the script:

    ```bash
    GITHUB_TOKEN=your_token_here bun src/index.ts
    ```

6.  You can change the target repository by editing `src/index.ts`.
