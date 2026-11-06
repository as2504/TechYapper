---
slug: docker
title: Docker
category: backend-infra
aliases: containers, container, Dockerfile, image, docker compose, containerisation, containerization
tagline: Package an app with everything it needs to run, so it behaves the same on every machine.
level: beginner
minutes: 4
concepts: docker-containers
related: kubernetes, cloud-computing
popular: true
---
::what
Docker is a tool for building and running **containers**. A container packages your application together with its runtime, libraries and configuration, and runs it in an isolated environment on a shared operating system kernel. The package is called an **image**; a running instance of an image is a **container**.

::why
"It works on my machine" used to be a daily problem. Your laptop has Node 20, the server has Node 18, and a library behaves differently. Virtual machines solved isolation but were heavy and slow to start. Containers give you most of the isolation with a fraction of the overhead, and the same image runs on a laptop, in CI and in production.

::how
You write a **Dockerfile**: step-by-step instructions to build an image (start from a base image, copy code, install dependencies, set the start command). Each step creates a cached **layer**, so rebuilds are fast when only your code changes. At runtime, Linux features called **namespaces** (isolation) and **cgroups** (resource limits) make the process think it has its own machine. Containers are not virtual machines: they share the host's kernel.

::where
- Consistent development environments, often with Docker Compose for app plus database
- CI pipelines that build and test in clean, reproducible containers
- Deploying services to the cloud, Kubernetes, or platforms like Cloud Run and Azure Container Apps

::know
- **Image vs container:** an image is the blueprint, a container is a running instance.
- **Containers are ephemeral.** Anything written inside is lost when the container is removed, unless you use volumes.
- **Layers are cached.** Order your Dockerfile so rarely-changing steps come first.
- **One process per container** is the usual convention.
- **Containers share the host kernel**, so they're lighter than VMs but isolate less.

::analogy
Shipping containers standardised freight: a crane doesn't care if the box holds bananas or TVs. Docker containers do the same for software: any machine with a container runtime can run any image.

::talk10
Docker packages an app with everything it needs into a container, so it runs the same way on my laptop, in CI and in production.

::talk30
Docker lets you package an application and its dependencies into an image, defined by a Dockerfile, and run it as an isolated container. Unlike a virtual machine, a container shares the host's operating system kernel, so it starts in seconds and uses little overhead. The main benefit is consistency: the exact same image moves from development to testing to production, which removes a lot of "works on my machine" bugs. For running many containers across many servers, you typically add an orchestrator like Kubernetes.

::comebacks
- Is a container a lightweight VM? || It's a common shorthand, but technically no. A VM virtualises hardware and runs its own OS; a container is an isolated process sharing the host kernel.
- Docker vs Kubernetes? || Docker builds and runs containers. Kubernetes runs and manages lots of containers across many machines.

::facts
- Docker was released in 2013 by a company called dotCloud, which renamed itself Docker, Inc.
- Container images follow the OCI (Open Container Initiative) standard, so other tools like Podman can run them.

::deeper
### A good Dockerfile for Node
```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
CMD ["node", "server.js"]
```
Dependencies are copied and installed before the source code, so editing code doesn't re-run `npm ci`. Running as a non-root user reduces risk.

### Volumes and networking
- **Volumes** persist data outside the container's lifecycle, for example a database's data directory.
- Containers on the same Docker network can reach each other by service name.

### Trade-offs
- Weaker isolation than VMs for untrusted code.
- Images can get large and carry vulnerable packages; use slim base images and scan them.

::sources
- [Docker docs: What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)
- [Docker docs: Dockerfile best practices](https://docs.docker.com/build/building/best-practices/)

::check
You restart a database container without a volume, and all the data is gone. Why?
- [ ] Docker deletes data on every restart
- [x] The data lived in the container's writable layer, which was removed with the container
- [ ] Databases can't run in containers
- [ ] The image was corrupted
> A container's filesystem changes are lost when the container is removed. Mount a volume for anything that must persist.

::interview
=== q: What is Docker and how is a container different from a VM? | level: beginner | pro: false
#answer
1. Docker builds images and runs them as containers.
2. A container packages an app with its dependencies.
3. A VM runs a full guest OS on virtualised hardware; a container shares the host kernel.
4. Containers start faster and use fewer resources; VMs give stronger isolation.
#short
Docker packages an app and its dependencies into a container, so it runs the same everywhere. The difference from a VM is that a VM runs its own whole operating system, while containers share the host's kernel, so they're much lighter and start in seconds.
#detail
Mention namespaces and cgroups if they push for depth. Give a real use: "We run the API and Postgres with Docker Compose locally, and the same API image is deployed to production."
#followups
- What's the difference between an image and a container? || The image is the read-only template; the container is a running instance with its own writable layer.
#mistakes
- Saying containers each run their own OS

=== q: How do you make Docker images smaller and faster to build? | level: intermediate | pro: true
#answer
1. Use slim or distroless base images.
2. Order layers so dependencies install before code is copied.
3. Use multi-stage builds: build in one stage, copy only the output into a small runtime stage.
4. Use .dockerignore to exclude node_modules, .git and local files.
#short
I'd use a slim base image, copy the dependency files and install them before copying the source so that layer stays cached, use a multi-stage build so build tools don't end up in the final image, and add a .dockerignore.
#detail
Mention security as a bonus: smaller images have fewer packages and fewer vulnerabilities, and running as a non-root user.
#followups
- What is a multi-stage build? || A Dockerfile with several FROM stages. You compile in one and copy only the artifacts into a minimal final image.
#mistakes
- Copying the whole project before installing dependencies
