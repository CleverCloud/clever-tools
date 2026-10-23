# Make the commands.md read mandatory before the first command edit

Behavior targeted: on tickets that add or change a command, agents go straight to the neighbouring code and edit without opening `docs/contributing/commands.md`. 11 of 22 train case/rep pairs (baseline 0.50), all with the same cause; 9 are changes to an existing command, 2 are new commands built by copying a sibling.

Cause found by the analyzer (train traces only): the "Copy the closest neighbour" rule is the only process rule agents apply, and the Load-on-demand sentence "For a small change to an existing command, the neighbouring code is usually enough" licenses skipping the doc. Reading the doc costs one call and passing runs make it right after the first listing call.

Change (`AGENTS.md`):
1. "Always do this": the neighbour bullet becomes two bullets. First, read `commands.md` before the first edit of any task that adds or changes a command, subcommand, option, argument, accepted value or command behaviour, whatever its size; read `api-client.md` too when an endpoint is called; read-only questions are exempt. Second, then copy the closest neighbour.
2. "Load on demand": the sentence that says the neighbouring code is usually enough is replaced by "The first row is mandatory before editing a command".

Adjustment made by the outer session to the analyzer's diff: the trigger "before your first edit under `src/commands/`" became a task-based trigger, because some tickets (new accepted value, new drain target) are first edited in `src/models/` or `src/parsers.js`, and the grade counts the first edit anywhere.

Expected: existing-command tickets recover (up to +0.41 on train). Expected not to improve: runs that stop to ask a question before editing (e13 rep1), and the `api-client.md` requirement on the two API tickets (conditional clause). Watch: the three control questions must still read no `docs/contributing` file; cost may rise by about one cached Read on the cases that skipped the doc.

Process note: the analyzer ran a `grep -o` over `baseline/traces/` that printed `docs/contributing` match counts for some held-out trace filenames (e02, e10, n01, n02, n03, n07, n08). It states it did not read their content and that the proposal does not rely on it; the proposal is built from train evidence only. Kept on record here.
