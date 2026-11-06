---
slug: git
title: Git
category: engineering
aliases: version control, GitHub, branches, merge, rebase, commits, pull request, PR
tagline: The version control system that tracks every change to your code and lets a team work on it at once.
level: beginner
minutes: 4
concepts: git-internals
related: system-design, docker
popular: true
---
::what
Git is a distributed version control system. It records snapshots of your project, called **commits**, so you can see what changed, who changed it and why, go back to any earlier version, and work on different features in parallel using **branches**. GitHub, GitLab and Azure DevOps host Git repositories and add collaboration features like pull requests.

::why
Without version control, teams email zip files, overwrite each other's work and can't tell which version is in production. Git gives every developer the full history locally, makes branching cheap, and provides a structured way to combine work.

::how
Each commit is a snapshot of the whole project, plus a pointer to its parent commit, an author and a message. A **branch** is just a movable label pointing at a commit. You make changes, **stage** them, and **commit**. To combine work you **merge** (create a commit joining two histories) or **rebase** (replay your commits on top of another branch). Because it's distributed, you `push` and `pull` to sync with a shared remote.

::where
- Essentially all modern software development
- Pull request workflows for code review on GitHub, GitLab and Azure DevOps
- CI/CD pipelines that build and deploy on every push
- Infrastructure as code and documentation repositories

::know
- **Commit often, with clear messages.** History is documentation.
- **Branches are cheap.** Use a branch per feature or fix.
- **Merge vs rebase:** merge preserves history as it happened; rebase creates a cleaner, linear history. Don't rebase commits others have already pulled.
- **Pull requests** are where code review happens.
- **`.gitignore`** keeps secrets, build output and dependencies out of the repository.

::analogy
Git is like save points in a video game, for a whole team. Anyone can create their own save branch, try something risky, and either bring it back into the main story or abandon it, without losing anyone else's progress.

::talk10
Git is a version control system. It tracks every change to the code as commits, and lets people work on separate branches and merge their work together.

::talk30
Git keeps the full history of a codebase as a series of commits, each a snapshot with an author and message, so you can see what changed and roll back if needed. Branches are lightweight, so each feature or fix gets its own branch, and work comes back together through merges, usually via pull requests where teammates review the changes. It's distributed, meaning every developer has the full history locally. GitHub and similar platforms host the shared copy and run CI on every push.

::comebacks
- Git vs GitHub? || Git is the version control tool. GitHub is a hosting service built around Git, with pull requests, issues and CI.
- Merge or rebase? || Rebase your own local branch to keep history clean; merge shared branches. Never rewrite history others depend on.
- Can you undo a commit? || Yes. `git revert` creates a new commit that undoes it safely; `git reset` moves the branch back and is for local changes.

::facts
- Linus Torvalds wrote Git in 2005 for Linux kernel development after the team lost access to their previous tool, BitKeeper.
- Git identifies every commit by a hash of its contents, so history can't be changed without changing the hashes.

::deeper
### What's actually stored
Git stores **blobs** (file contents), **trees** (directories) and **commits** (a tree plus parents and metadata), each addressed by a hash. A branch is a file containing a commit hash. That's why creating a branch is instant.

### Everyday commands
```bash
git switch -c feature/login   # new branch
git add -p                    # stage changes interactively
git commit -m "Add login form validation"
git pull --rebase origin main # update your branch
git push -u origin feature/login
```

### Fixing mistakes
- Wrong commit message (not pushed): `git commit --amend`
- Undo a pushed commit safely: `git revert <hash>`
- Committed a secret: rotate the secret immediately. Removing it from history is not enough, because it may already be copied.

::sources
- [Pro Git book](https://git-scm.com/book/en/v2)
- [Pro Git: Git internals](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)

::check
You accidentally pushed an API key to a public GitHub repository and then deleted it in a new commit. What should you do?
- [ ] Nothing, it's deleted now
- [ ] Force-push to remove the commit and you're safe
- [x] Revoke and rotate the key immediately, then clean the history
- [ ] Make the repository private
> Deleting it in a new commit leaves it in history, and bots scan public repositories within minutes. Treat the key as compromised and rotate it.

::interview
=== q: What's the difference between merge and rebase? | level: intermediate | pro: false
#answer
1. Merge combines branches with a merge commit, preserving the true history.
2. Rebase replays your commits on top of another branch, producing a linear history.
3. Rebase rewrites commit hashes, so don't rebase shared commits.
4. Teams often rebase locally and merge (or squash-merge) pull requests.
#short
Merge joins two branches with a merge commit and keeps history exactly as it happened. Rebase moves my commits to sit on top of the latest main, so history is a clean line. Because rebase rewrites commits, I only do it on branches nobody else is using.
#detail
Mention squash merging as a common PR strategy, and that conflicts are resolved in both cases, just at different moments: once for a merge, per commit for a rebase.
#followups
- What's a fast-forward merge? || When the target branch hasn't moved, Git just moves its pointer forward with no merge commit.
#mistakes
- Rebasing a shared branch and force-pushing over teammates' work

=== q: How do you resolve a merge conflict? | level: beginner | pro: false
#answer
1. A conflict happens when both branches changed the same lines.
2. Git marks the conflicting sections in the file.
3. Edit the file to the correct combined result and remove the markers.
4. Stage the file and complete the merge or rebase.
5. Run the tests before pushing.
#short
A conflict means two branches changed the same lines. Git marks both versions in the file, I decide what the correct result should be, often talking to whoever made the other change, then stage it, finish the merge and run the tests.
#detail
Showing that you'd talk to the other author when you're unsure is a good signal. Mention that frequent small merges reduce conflicts.
#followups
- How do you reduce conflicts? || Small, short-lived branches, pulling from main often, and splitting large files.
#mistakes
- Accepting one side blindly without understanding the other change

=== q: Describe a Git branching strategy for a team. | level: advanced | pro: true
#answer
1. Trunk-based: short-lived feature branches merged into main often, with CI and feature flags.
2. GitFlow: develop, release and hotfix branches; heavier and suited to versioned releases.
3. Protect main: required reviews and passing CI before merging.
4. Choose based on release cadence and team size.
#short
For most teams shipping continuously, I'd use trunk-based development: short-lived branches, pull requests with required reviews and CI, merged into main several times a week, with feature flags for unfinished work. GitFlow makes more sense for products with scheduled, versioned releases.
#detail
Mention branch protection rules and that long-lived branches drift and cause painful merges.
#followups
- What are feature flags? || Switches in code that let you merge and deploy unfinished features while keeping them turned off for users.
#mistakes
- Long-lived feature branches without regular syncing
