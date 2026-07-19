# Prompts

Implementation prompts for LaunchPad, run with an AI coding assistant.

- **`queued/`** — prompts ready to run (or mid-run). Run the whole prompt,
  following its working-style rules.
- **`completed/`** — prompts that were fully executed **and** signed off by
  Dev. Move a prompt here only after Dev confirms the result is good.

Prompts are the *build record* (what we asked for and why). The `docs/`
folder is the *product record* — technical documentation and end-user /
stakeholder guides for how the app works and operates. A prompt usually
instructs creating or updating a doc in `docs/` as part of its steps.
