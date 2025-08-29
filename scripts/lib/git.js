import { simpleGit } from 'simple-git';
import { highlight } from './terminal.js';
import { getPackageAuthor } from './utils.js';

/**
 * Gets the name of the current Git branch.
 * @returns {Promise<string>}
 * @throws {Error} When Git operations fail or no repository is found
 */
export async function getCurrentBranch() {
  const git = simpleGit();
  const branchSummary = await git.branch();
  return branchSummary.current;
}

/**
 * Gets the SHA hash of the current Git commit (HEAD).
 * @returns {Promise<string>}
 * @throws {Error} When Git operations fail or no repository is found
 */
export async function getCurrentCommit() {
  const git = simpleGit();
  const commit = await git.revparse(['HEAD']);
  return commit;
}

/**
 * Gets the author name of the most recent commit.
 * @returns {Promise<string>}
 * @throws {Error} When Git operations fail or no repository is found
 */
export async function getCurrentAuthor() {
  const git = simpleGit();
  const log = await git.log({ n: 1 });
  return log.latest ? log.latest.author_name : 'Unknown author';
}

/**
 * Add changes, commit and push changes to a git repository.
 * @param {string} gitPath - The path to the git repository
 * @param {string} gitUrl - The URL of the git repository
 * @param {string} author - The author of the commit in the format "Name <email>"
 * @param {string} version - The version to commit
 * @param {string} [message] - Optional commit message, defaults to "Update to {version}"
 * @return {Promise<void>}
 */
export async function commitAndPush(gitPath, gitUrl, author, version, message) {
  const git = simpleGit(gitPath);

  const gitUser = getPackageAuthor();
  await git.addConfig('user.name', gitUser.name);
  await git.addConfig('user.email', gitUser.email);

  console.log(highlight`=> Commiting changes`);
  await git.add('.');
  const commitDetails = await git.commit(message ?? `Update to ${version}`);

  console.log(highlight`=> Pushing ${commitDetails.commit} to ${gitUrl}`);
  await git.push('origin');
}

/**
 * Tags the current commit and pushes the tag to the remote repository.
 * @param {string} gitPath
 * @param {string} gitUrl
 * @param {string} tagName
 * @return {Promise<void>}
 */
export async function tagAndPush(gitPath, gitUrl, tagName) {
  const git = simpleGit(gitPath);
  console.log(highlight`=> Pushing tag ${tagName} to ${gitUrl}`);
  await git.addTag(tagName);
  await git.pushTags('origin');
}
