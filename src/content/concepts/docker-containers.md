---
slug: docker-containers
title: Containers are just processes with blinkers on
topic: devops
difficulty: beginner
minutes: 6
pro: false
related: nodejs-event-loop, git-internals, caching-strategies
---
::dek
Not tiny virtual machines. Ordinary Linux processes, given their own view of the filesystem, network and process list — plus a strict budget.

::hook
"It works on my machine" was one of software's oldest jokes until Docker made "then we'll ship your machine" practical. But the mental model most people carry — a container is a lightweight VM — leads to wrong decisions about security, performance and data. The real model is simpler and more useful.

::yap
A container isn't a mini-VM. It's a normal process the kernel lies to — about which files, processes and network it can see — with limits on how much it can use.

::basics
A **container** packages an application with everything it needs — runtime, libraries, config — so it runs the same on your laptop, a CI server and production.

Two terms:

- **Image**: a read-only template. Built from a `Dockerfile`, versioned, pushed to a registry.
- **Container**: a running instance of an image. You can run many containers from one image.

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t techyapper-api .
docker run -p 3000:3000 techyapper-api
```

Why not just use virtual machines? A VM boots a whole operating system with its own kernel — gigabytes, seconds to minutes. Containers **share the host's kernel**, so they start in milliseconds and weigh megabytes. You can run dozens on a laptop.

::hood
### The two kernel features that make it work

Containers are built from Linux kernel primitives:

- **Namespaces** control what a process can *see*. A PID namespace gives it its own process list (it thinks it's PID 1). Mount namespaces give it its own filesystem view. Network namespaces give it its own interfaces and ports. There are also UTS (hostname), IPC and user namespaces.
- **cgroups** (control groups) control what a process can *use*: CPU shares, memory limits, I/O bandwidth, number of processes.

Run `ps` on the host and you'll see your container's processes right there. They're real processes, just isolated.

### Layers and the union filesystem

Each Dockerfile instruction creates a **layer** — a set of filesystem changes. Layers are content-addressed and shared between images, so ten images based on `node:22-alpine` store that base once. A running container adds a thin **writable layer** on top (copy-on-write via OverlayFS). Delete the container and that layer disappears — which is why persistent data goes in **volumes**.

### Build cache

Docker reuses a layer if its instruction and inputs haven't changed. That's why you copy `package.json` and install dependencies *before* copying source code: editing code then doesn't trigger a full reinstall.

### On macOS and Windows

Containers need a Linux kernel, so Docker Desktop runs a lightweight Linux VM behind the scenes (WSL 2 on Windows). File-sharing between host and that VM is why bind mounts can feel slow on these platforms.

::deep
### Security boundaries

Because containers share the host kernel, a kernel vulnerability can allow escape. The isolation is weaker than a VM's hardware virtualisation. Hardening includes:

- Running as a **non-root user** (`USER node`), and rootless Docker/Podman.
- Dropping Linux **capabilities**, using **seccomp** and AppArmor/SELinux profiles.
- Read-only root filesystems where possible.
- Minimal base images (distroless, Alpine, or `scratch` for static binaries) to reduce attack surface.

For hostile multi-tenant workloads, platforms use sandboxed runtimes such as gVisor or microVMs like Firecracker (used by AWS Lambda and Fargate) to get VM-grade isolation with container ergonomics.

### Multi-stage builds

```dockerfile
FROM node:22 AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node
CMD ["node", "dist/server.js"]
```

Compilers and dev dependencies stay in the build stage; the final image ships only what runs.

### PID 1 and signals

The first process in a container is PID 1, which has special signal semantics in Linux: it doesn't get default handlers, so `SIGTERM` may be ignored and zombie processes may not be reaped. Use the exec form of `CMD` (`["node", "server.js"]`, not a shell string), handle `SIGTERM` for graceful shutdown, or run with `--init` (tini).

### The standards underneath

Docker images follow the **OCI** (Open Container Initiative) image and runtime specs. Kubernetes doesn't need Docker at all; it talks to runtimes like **containerd** or **CRI-O** that run the same OCI images.

::myths
- Containers are lightweight virtual machines || They're isolated processes sharing the host kernel. VMs virtualise hardware and run their own kernel.
- `EXPOSE` publishes a port || It's documentation. You publish with `-p host:container`.
- Data written inside a container is safe || It lives in the container's writable layer and is lost when the container is removed. Use volumes.

::facts
- Linux namespaces and cgroups existed years before Docker; Docker's 2013 breakthrough was the developer experience — images, layers and a simple CLI.
- Kubernetes removed its built-in Docker shim in v1.24 (2022), yet Docker-built images still run unchanged on it.

::realworld
- Reproducible dev environments and CI pipelines.
- Deploying services to Kubernetes, ECS, Cloud Run or Fly.io.
- Running throwaway databases for integration tests (Testcontainers).

::check
Two containers from the same image are running on one host. What do they share?
- [ ] Nothing — each has its own kernel and OS
- [x] The host kernel and the image's read-only layers; each has its own writable layer
- [ ] The same writable filesystem, so changes in one appear in the other
- [ ] The same process ID space
> Containers share the host kernel and the immutable image layers (stored once). Each gets its own copy-on-write layer and its own namespaces, so files and processes are isolated.
