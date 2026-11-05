export class LinkedWorktreeNotSupportedError extends Error {
  constructor() {
    super(
      "Linked git worktrees aren't supported by the default JS git backend.\n" +
        'Enable the system git backend (it uses your installed git):\n' +
        '    clever features enable system-git',
    );
    this.name = 'LinkedWorktreeNotSupportedError';
  }
}
