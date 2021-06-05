import * as core from "@actions/core";
import * as gh from "@actions/github";
import * as io from "@actions/io";
import { $, cd } from "zx";

const println = (msg) => console.log(chalk.blue(msg));
const eprintln = (msg) => console.log(chalk.red(msg));
const $s = async (...ps) => {
  const prev = $.verbose;
  $.verbose = false;
  const p = await $(ps);
  $.verbose = prev;

  return p;
};

function precheck() {
  const exit = (msg) => {
    eprintln(msg);
    process.exit(-1);
  };

  const apiToken = core.getInput("api_token");
  if (!apiToken) {
    exit("GitHub API token must be defined");
  }

  const srcDir = core.getInput("src_dir");
  if (!srcDir) {
    exit("Source directory must be defined");
  }

  const repo = core.getInput("repo");
  if (!repo) {
    exit("Destination repo must be defined");
  }

  const owner = core.getInput("owner");
  if (!owner) {
    exit("Owner of the repo must be defined");
  }

  const destDir = core.getInput("dest_dir");
  if (!destDir) {
    exit("Destination directory must be defined");
  }

  const headBranch = core.getInput("head_branch");
  if (!headBranch) {
    exit("Head branch must be defined");
  }
  if (headBranch === "main" || headBranch === "master") {
    exit("Head branch cannot be 'main' or 'master'");
  }

  const baseBranch = core.getInput("base_branch");
  if (!baseBranch) {
    exit("Base branch must be defined");
  }

  const commiterEmail = core.getInput("commiter_email") || "noreply@github.com";

  const commiterName = core.getInput("commiter_name") || "GitHub";

  const commitMessage =
    core.getInput("commit_message") || `Update ${headBranch}`;

  return {
    apiToken,
    srcDir,
    owner,
    repo,
    destDir,
    headBranch,
    baseBranch,
    commiterEmail,
    commiterName,
    commitMessage,
  };
}

/**
 *
 * @param param0 {{email: string, userName: string}}
 */
async function configGit({ email, userName }) {
  await $`git config --global user.email ${email} && git config --global user.name ${userName}`;
}

/**
 *
 * @param param0 {{apiToken: string, owner: string, repo: string}}
 * @returns
 */
async function clone({ apiToken, owner, repo }) {
  const uri = `https://${apiToken}@github.com/${owner}/${repo}.git`;
  const cloneDir = (await $`mktemp -d`).stdout;
  await $`git clone ${uri} ${cloneDir}`;

  return cloneDir;
}

/**
 *
 * @param param0 {{cloneDir: string, srcDir: string, destDir: string, baseBranch: string}}
 */
async function copy({ cloneDir, srcDir, destDir, baseBranch }) {
  const workspace = process.env.GITHUB_WORKSPACE;
  // const workspace = (await $`pwd`).stdout;

  const fullDest = `${cloneDir}/${destDir}`;
  await io.mkdirP(fullDest);

  cd(cloneDir);

  await $`git checkout ${baseBranch}`;

  const fullSrc = `${workspace}/${srcDir}`;
  await $`cp -rf ${fullSrc} ${fullDest}`;
}

/**
 *
 * @param param0 {{headBranch: string}}
 */
async function checkout({ headBranch }) {
  await $`git checkout -b ${headBranch}`;
}

/**
 *
 * @param param0 {{commitMessage: string}}
 * @returns
 */
async function commit({ commitMessage }) {
  await $`git add .`;

  const status = await $s`git status`;
  const hasChanges = status.stdout.includes("Changes to be committed");
  if (hasChanges) {
    await $`git commit --message ${commitMessage}`;
  }

  return hasChanges;
}

/**
 *
 * @param param0 {{headBranch: string}}
 */
async function push({ headBranch }) {
  await $`git push -u origin HEAD:${headBranch}`;
}

/**
 *
 * @param param0 {{apiToken: string, headBranch: string, baseBranch: string, owner: string, repo: string}}
 */
async function createPr({ apiToken, headBranch, baseBranch, owner, repo }) {
  const octokit = gh.getOctokit(apiToken);
  await octokit.rest.pulls.create({
    owner: owner,
    repo: repo,
    title: `cd(build): ${headBranch}`,
    base: baseBranch,
    head: headBranch,
  });
}

async function main() {
  const {
    apiToken,
    commiterEmail,
    commiterName,
    srcDir,
    owner,
    repo,
    destDir,
    headBranch,
    baseBranch,
    commitMessage,
  } = precheck();

  await configGit({ email: commiterEmail, userName: commiterName });

  const cloneDir = await clone({ apiToken, owner, repo });

  await copy({ cloneDir, srcDir, destDir, baseBranch });

  await checkout({ headBranch });

  const hasChanges = await commit({ commitMessage });
  if (hasChanges) {
    await push({ headBranch });
    await createPr({ apiToken, headBranch, baseBranch, owner, repo });
  } else {
    println("No changes detected");
  }
}

await main();
