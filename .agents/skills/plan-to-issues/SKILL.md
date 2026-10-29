---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Ask the human what every issue here must carry (fields, labels, wording), unless it is
   already written down in this session or in the repo.
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## What every issue here carries

Decided by the human on 2026-10-29 (plan morning-digest, issues #1–#8). Step 4 is answered by this
section until a human changes it.

- First line: `Source: plan.md § <n>` (the plan's section, e.g. `§ 2a`). The reviewer sorts by it.
- Label: `plan:<plan name>` from the plan's frontmatter (e.g. `plan:morning-digest`).
- Sections: **Scope** · **Done when** (the plan's line, checkable) · **Blocked by** (real `#n`;
  "to start" vs "to be done" when they differ) · **Worker** (suggested `harness · model · effort`).
- An issue that ends with someone else's look (a review, a reply) is done only when they have
  looked. "Sent" is not done: leave it open and say what it waits on (AGENTS.md rule 5).
- `closes #n` in a pushed commit closes the issue at once: post the closing comment
  (`gh issue close <n> -c …`) before you push that commit.

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
