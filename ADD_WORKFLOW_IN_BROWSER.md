# Add GitHub Actions deploy (no terminal — 2 minutes)

Cursor cannot push files under `.github/workflows/` for you (GitHub blocks it). Do this **once** in your browser:

## Steps

1. **Open this link** (same repo, new file on `main`):  
   **[Create new file on GitHub](https://github.com/adithyameroju/endorsements-v2/new/main)**

2. In **“Name your file”**, type **exactly** (including the dots):  
   `.github/workflows/deploy-github-pages.yml`  
   GitHub will create the folders for you.

3. **Copy the workflow YAML:** open **[raw file on GitHub](https://raw.githubusercontent.com/adithyameroju/endorsements-v2/main/docs/deploy-github-pages.yml)** (Cmd+A, Cmd+C), then **paste** into the GitHub editor.  
   Or open [`docs/deploy-github-pages.yml`](docs/deploy-github-pages.yml) locally and copy the whole file.

4. Click **Commit changes** (green button), leave default message, confirm **Commit directly to `main`**.

5. Go to **Actions** — you should see **“Deploy to GitHub Pages”** run. When it’s green, the site updates at  
   **https://adithyameroju.github.io/endorsements-v2/#/**

After this, every normal `git push` to `main` can update the live site (from your Mac or any tool that can push).
