import { Logger } from '../logger.js';
import { execSync, spawn } from 'child_process';

/**
 * Represents a tmux session manager.
 * This class provides methods to interact with and manage tmux sessions.
 */
export class Tmux {
  #session;
  #tmuxBin;

  /**
   * Creates a new tmux manager instance.
   * @param {string} sessionToManage - The name of the tmux session to manage.
   */
  constructor(sessionToManage) {
    this.#tmuxBin = 'tmux';
    this.#session = sessionToManage;
    /** @type {string|undefined} The version of tmux installed on the system. */
    this.version = this.#getVersion();
    /** @type {string} The name of the managed tmux session. */
    this.managedSession = this.#session;
    /** @type {boolean} Indicates whether tmux is installed on the system. */
    this.isInstalled = this.version !== undefined;

    Logger.debug("tmux manager initialized");
    Logger.debug(JSON.stringify(this));
  }

  /**
   * Gets the version of tmux installed on the system.
   * @returns {string|undefined} The tmux version or undefined if not installed.
   * @private
   */
  #getVersion() {
    try {
      return execSync(`${this.#tmuxBin} -V`).toString().trim();
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Executes a tmux command.
   * @param {string} command - The command to execute.
   * @returns {boolean} True if the command was executed successfully, false otherwise.
   * @private
   */
  #executeCommand(command) {
    try {
      execSync(command, { stdio: 'pipe' });
      return true;
    } catch (error) {
      Logger.error(`Error executing command: ${command}`);
      return false;
    }
  }

  /**
   * Attaches to the managed tmux session.
   * @returns {Promise<number>} A promise that resolves with the exit code of the tmux process.
   */
  attachSession() {
    return new Promise((resolve, reject) => {
      const tmuxProcess = spawn(this.#tmuxBin, ['attach', '-t', this.#session], {
        stdio: 'inherit',
      });

      tmuxProcess.on('close', (code) => {
        console.log(`${this.#tmuxBin} exited with code ${code}`);
        resolve(code);
      });

      tmuxProcess.on('error', (error) => {
        console.error(`${this.#tmuxBin} exited with error ${error}`);
        reject(error);
      });
    });
  }

  /**
   * Creates a new pane in the managed session.
   * @returns {boolean} True if the pane was created successfully, false otherwise.
   */
  createPane() {
    return this.#executeCommand(`${this.#tmuxBin} split-window -t ${this.#session}:0`);
  }

  /**
   * Creates a new tmux session with the managed session name.
   * @returns {boolean} True if the session was created successfully, false otherwise.
   */
  createSession() {
    return this.#executeCommand(`${this.#tmuxBin} new-session -d -s ${this.#session}`);
  }

  /**
   * Detaches from the managed tmux session.
   * @returns {boolean} True if detached successfully, false otherwise.
   */
  detachSession() {
    return this.#executeCommand(`${this.#tmuxBin} detach -t ${this.#session}`);
  }

  /**
   * Kills the managed tmux session.
   * @returns {boolean} True if the session was killed successfully, false otherwise.
   */
  killSession() {
    return this.#executeCommand(`${this.#tmuxBin} kill-session -t ${this.#session}`);
  }

  /**
   * Lists all tmux sessions.
   * @returns {string[]} An array of session names.
   */
  listSessions() {
    try {
      return execSync(`${this.#tmuxBin} list-sessions -F "#{session_name}"`, { stdio: 'pipe' }).toString().trim().split('\n');
    } catch (error) {
      Logger.debug("Error listing tmux sessions, maybe there are none");
      return [];
    }
  }

  /**
   * Sends a command to a specific pane in the managed session.
   * @param {number} index - The index of the pane.
   * @param {string} command - The command to send.
   * @returns {boolean} True if the command was sent successfully, false otherwise.
   */
  sendCommandToPane(index, command) {
    return this.#executeCommand(`${this.#tmuxBin} send-keys -t ${this.#session}:0.${index} '${command}' C-m`);
  }

  /**
   * Checks if a session exists.
   * @param {string} [name] - The name of the session to check. If not provided, checks the managed session.
   * @returns {boolean} True if the session exists, false otherwise.
   */
  sessionExists(name) {
    return this.listSessions().includes(name);
  }

  /**
   * Sets the layout of the managed session.
   * @param {string} layout - The layout to set.
   * @returns {boolean} True if the layout was set successfully, false otherwise.
   */
  setLayout(layout) {
    return this.#executeCommand(`${this.#tmuxBin} select-layout -t ${this.#session} ${layout}`);
  }
}
