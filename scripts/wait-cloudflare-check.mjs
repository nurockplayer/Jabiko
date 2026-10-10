// Keep validation behind the independently triggered Pages build for its source commit.
// This runs before dependency installation and uses only Node built-ins.
async function main() {
  const { GITHUB_REPOSITORY: repository, GITHUB_SHA: workflowSha, GH_TOKEN: token,
    GITHUB_EVENT_NAME: event, PR_HEAD_SHA: prHead } = process.env;
  const sha = event === "pull_request" ? prHead : workflowSha;
  if (!["push", "pull_request"].includes(event) || !/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(repository ?? "") ||
      !/^[a-f0-9]{40}$/.test(sha ?? "") || !token) {
    throw new Error("Missing or invalid repository, commit SHA, or job token");
  }
  const url = `https://api.github.com/repos/${repository}/commits/${sha}/check-runs?check_name=Cloudflare%20Pages&filter=latest&per_page=100`;
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28"
      },
      signal: AbortSignal.timeout(Math.min(10000, deadline - Date.now()))
    });
    if (!response.ok) throw new Error(`GitHub checks request failed: HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.check_runs) || !Number.isInteger(data.total_count) ||
        data.total_count !== data.check_runs.length) {
      throw new Error("Incomplete GitHub checks response");
    }
    for (const check of data.check_runs) {
      if (check === null || typeof check !== "object" || Array.isArray(check) ||
          typeof check.name !== "string" || check.name.trim() === "" ||
          typeof check.head_sha !== "string" || !/^[a-f0-9]{40}$/.test(check.head_sha) ||
          check.app === null || typeof check.app !== "object" || Array.isArray(check.app) ||
          !Number.isSafeInteger(check.app.id) || check.app.id <= 0 ||
          typeof check.app.slug !== "string" || check.app.slug.trim() === "") {
        throw new Error("Malformed check identity prevents a complete Cloudflare observation");
      }
    }
    const checks = data.check_runs.filter((check) =>
      check?.name === "Cloudflare Pages" && check.head_sha === sha &&
      check.app?.id === 85455 && check.app.slug === "cloudflare-workers-and-pages"
    );
    if (checks.length && checks.every((check) => check.status === "completed")) {
      if (checks.some((check) => check.conclusion !== "success")) {
        throw new Error("Cloudflare Pages completed but was not successful");
      }
      console.log(`Cloudflare Pages succeeded for ${sha}; validation may start`);
      return;
    }
    console.log(`Waiting for Cloudflare Pages on ${sha} (${checks.length} matching checks)`);
    await new Promise((resolve) => setTimeout(resolve, Math.min(5000, Math.max(0, deadline - Date.now()))));
  }
  throw new Error("Timed out waiting for the exact Cloudflare Pages check after 15 minutes");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
