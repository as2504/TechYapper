---
slug: git-internals
title: Git is a content-addressed filesystem
topic: fundamentals
difficulty: intermediate
minutes: 6
pro: false
related: docker-containers, rest-idempotency
---
::dek
Branches are 41-byte files. Commits are snapshots, not diffs. Once you see Git's four object types, the scary commands stop being scary.

::hook
Most developers use Git through a dozen memorised commands and a quiet fear of `rebase`. But Git's core is tiny: a key–value store where the key is a hash of the content. Everything else — branches, merges, stashes, even "lost" commits — is built on top of it. Spend ten minutes with the internals and you'll never fear a detached HEAD again.

::yap
Git doesn't store changes, it stores snapshots — and a branch is just a sticky note pointing at one commit.

::basics
### Snapshots, not diffs

Every commit records a **snapshot** of your whole project at that moment, plus a pointer to its parent commit. When you run `git diff`, Git compares two snapshots on the fly.

It sounds wasteful, but files that didn't change aren't stored again — the new snapshot just points to the same stored content.

### Three places your changes live

- **Working directory**: the files you edit.
- **Staging area** (the index): what will go into the next commit — `git add` puts it here.
- **Repository**: committed history, in the `.git` folder.

### Branches are cheap

A branch is just a name pointing to a commit. Creating one doesn't copy anything:

```bash
git switch -c feature/streaks
cat .git/refs/heads/feature/streaks
# 3f9c2a1e… (one commit hash)
```

When you commit, the branch name moves forward to the new commit. **HEAD** tells Git which branch you're on.

::hood
### The four object types

Everything in `.git/objects` is one of:

- **Blob**: file contents (no filename).
- **Tree**: a directory listing — names, permissions, and the hashes of blobs or sub-trees.
- **Commit**: a pointer to one root tree, parent commit(s), author, committer, timestamp and message.
- **Tag** (annotated): a named, signed-or-not pointer to an object.

Each object is stored under the **hash of its content**. Same content → same hash → stored once. Change one byte in one file and you get a new blob, a new tree for each directory up to the root, and a new commit — but every untouched file and folder is reused.

```bash
git cat-file -p HEAD          # show the commit object
git cat-file -p HEAD^{tree}   # show its root tree
```

### Why hashes make history tamper-evident

A commit's hash covers its tree and its parent's hash. Change anything in history and every descendant hash changes. That's why rewriting pushed history (rebase, amend) causes trouble for collaborators: their commits point at hashes that no longer exist on your branch.

### Merge vs rebase

- **Merge** creates a new commit with two parents, preserving both histories as they happened.
- **Rebase** replays your commits on top of another branch, creating **new** commits (new parents → new hashes) for a linear history.

Neither is "correct". Rebase local work; don't rebase commits others have pulled.

::deep
### Packfiles and delta compression

Loose objects are zlib-compressed files. Periodically (and during push/fetch) Git packs them into **packfiles**, where similar objects are stored as **deltas** against each other. So Git's *model* is snapshots, but its *storage* uses deltas — chosen by similarity, not by commit order. That's how a repository with thousands of commits stays small.

### The reflog is your safety net

Git records every movement of HEAD and branch tips in the **reflog**:

```bash
git reflog
# a1b2c3d HEAD@{0}: rebase (finish)
# 9f8e7d6 HEAD@{3}: commit: add streak heatmap
git reset --hard 9f8e7d6   # back to before the rebase
```

Commits aren't really "lost" after a bad reset or rebase until garbage collection removes unreachable objects — by default after the reflog entries expire (typically 30–90 days).

### SHA-1 to SHA-256

Git has historically used SHA-1. After practical SHA-1 collisions were demonstrated (SHAttered, 2017), Git added collision detection and later support for SHA-256 repositories. Interoperability between the two formats is still maturing, so SHA-1 remains the default for most repositories.

### Plumbing vs porcelain

Commands like `commit`, `merge` and `log` are **porcelain** built on **plumbing** commands like `hash-object`, `write-tree` and `commit-tree`. You can literally build a commit by hand with plumbing — a classic exercise that makes the model click.

### Partial and shallow clones

Huge monorepos use `--depth` (shallow: limited history), `--filter=blob:none` (partial: fetch file contents lazily) and sparse checkout (only some directories in the working tree). These work precisely because objects are addressed by hash and can be fetched on demand.

::myths
- Git stores diffs between commits || Git's model stores full snapshots; packfiles compress similar objects as deltas for storage.
- Deleting a branch deletes its commits || It deletes a pointer. The commits stay reachable via the reflog until garbage collection.
- Rebase and merge produce the same commits || Rebase creates new commits with new hashes; merge keeps the originals and adds a merge commit.

::facts
- Linus Torvalds wrote the first version of Git in about two weeks in April 2005, after the Linux kernel lost free access to BitKeeper.
- An empty Git tree always has the same hash: `4b825dc642cb6eb9a060e54bf8d69288fbee4904`.

::realworld
- Recovering from a botched rebase with `git reflog`.
- `git bisect` binary-searching history to find which commit introduced a bug.
- Monorepos using partial clone and sparse checkout to stay fast.

::check
You change one file in a project with 500 files and commit. Roughly what new objects does Git create?
- [ ] 500 new blobs — a full copy of the project
- [ ] Only a diff object for the changed lines
- [x] One new blob, new trees for each directory on that file's path up to the root, and one commit
- [ ] Just a new commit; blobs are only created on push
> Unchanged files keep their existing blob hashes. The changed file gets a new blob, which changes its parent tree's hash, and so on up to the root tree, which the new commit points to.
