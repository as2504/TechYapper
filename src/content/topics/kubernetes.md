---
slug: kubernetes
title: Kubernetes
category: backend-infra
aliases: K8s, kube, kubectl, pods, container orchestration, AKS, EKS, GKE, Helm
tagline: A system that runs your containers across many machines and keeps them in the state you asked for.
level: intermediate
minutes: 5
concepts: docker-containers
related: docker, cloud-computing, system-design
popular: true
---
::what
Kubernetes, often written K8s, is an open-source **container orchestrator**. You tell it what you want running, for example "three copies of this API image, reachable at this address", and it schedules those containers across a cluster of machines, restarts them when they crash and replaces them when you deploy a new version. It came out of Google in 2014.

::why
Running one container is easy. Running 200 containers across 30 servers, with rolling updates, health checks, scaling and networking, is not. Without an orchestrator you end up with scripts and manual work. Kubernetes standardises all of that.

::how
Kubernetes is **declarative**. You write YAML describing the **desired state**, and controllers constantly compare it with the **actual state** and fix any difference. That's called **reconciliation**. Key objects:
- **Pod:** the smallest unit, one or more containers that run together.
- **Deployment:** keeps N replicas of a pod running and handles rolling updates.
- **Service:** a stable network address that load-balances across pods.
- **Ingress:** routes external HTTP traffic to services.
- **ConfigMap and Secret:** configuration and credentials.

::where
- Microservice platforms at medium and large companies
- Managed offerings: Azure AKS, Amazon EKS, Google GKE
- Running data and ML workloads alongside regular services

::know
- **Declarative desired state** is the core idea. You describe the end state, not the steps.
- **Pods are disposable.** They get replaced, rescheduled and get new IPs. Services give stability.
- **Self-healing:** crashed containers restart, failed nodes' pods get rescheduled.
- **Horizontal scaling** by changing replicas, manually or with an autoscaler.
- **It's complex.** Many small teams are better off with a simpler managed container service.

::analogy
Kubernetes is like a thermostat for software. You set "three copies of the API", and it keeps checking. If one dies, it starts another. You don't tell it how; you tell it what.

::talk10
Kubernetes runs containers across a cluster of machines. You declare what you want running, and it keeps it that way: restarting crashed containers, scaling and rolling out updates.

::talk30
Kubernetes is a container orchestrator. Docker packages an app into containers; Kubernetes runs lots of them across many machines. You describe the desired state in YAML, like "three replicas of this image behind a service", and Kubernetes continuously reconciles the actual state to match, restarting failed containers, rescheduling them if a machine dies, and doing rolling updates when you deploy. It's powerful but complex, so smaller teams often use simpler managed platforms unless they really need that control.

::comebacks
- Do I need Kubernetes? || Only if you're running many services and need fine control. For one or two apps, a managed platform is usually simpler and cheaper.
- Is Kubernetes a replacement for Docker? || No. Kubernetes runs containers; images are still built with Docker or similar tools.

::facts
- "K8s" is a numeronym: K, then 8 letters, then s.
- Kubernetes is Greek for helmsman, which is why the logo is a ship's wheel.
- It was inspired by Borg, Google's internal cluster manager.

::deeper
### A minimal Deployment and Service
```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: api }
spec:
  replicas: 3
  selector: { matchLabels: { app: api } }
  template:
    metadata: { labels: { app: api } }
    spec:
      containers:
        - name: api
          image: myrepo/api:1.4.0
          ports: [{ containerPort: 8080 }]
          readinessProbe: { httpGet: { path: /health, port: 8080 } }
---
apiVersion: v1
kind: Service
metadata: { name: api }
spec:
  selector: { app: api }
  ports: [{ port: 80, targetPort: 8080 }]
```

### Probes
- **Readiness probe:** "can this pod receive traffic?" Failing removes it from the Service.
- **Liveness probe:** "is it stuck?" Failing restarts the container.

### Trade-offs
- Big operational learning curve: networking, storage, security policies, upgrades.
- Managed Kubernetes reduces the control-plane work, not the application-level complexity.

::sources
- [Kubernetes docs: Overview](https://kubernetes.io/docs/concepts/overview/)
- [Kubernetes docs: Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)

::check
A pod in a Deployment with 3 replicas crashes and won't come back. What does Kubernetes do?
- [ ] Nothing until an admin intervenes
- [x] Creates a new pod to get back to 3 replicas
- [ ] Shuts down the other 2 pods
- [ ] Rolls back to the previous image version
> The Deployment's controller sees actual (2) differs from desired (3) and creates a replacement. That's reconciliation.

::interview
=== q: What is Kubernetes and why use it? | level: beginner | pro: false
#answer
1. An open-source container orchestrator.
2. Schedules containers across a cluster, self-heals and scales.
3. Declarative: you describe desired state; controllers reconcile actual state.
4. Handles service discovery, load balancing and rolling updates.
#short
Kubernetes manages containers across many machines. I describe what I want, like three replicas of a service, and it keeps that true: restarting failures, scaling and rolling out new versions without downtime.
#detail
Mention when you wouldn't use it. Saying "for a small app I'd pick a managed container service" shows judgment, which interviewers value more than buzzwords.
#followups
- What is a pod? || The smallest deployable unit: one or more containers sharing a network and storage, scheduled together.
- What's a Service? || A stable address that load-balances traffic to a changing set of pods selected by labels.
#mistakes
- Confusing pods and containers

=== q: How does a rolling update work in Kubernetes? | level: intermediate | pro: true
#answer
1. You change the Deployment's image.
2. Kubernetes creates new pods with the new version, a few at a time.
3. New pods receive traffic only after passing readiness probes.
4. Old pods are terminated gradually; maxSurge and maxUnavailable control the pace.
5. `kubectl rollout undo` rolls back.
#short
When I update the image, the Deployment brings up new pods gradually and only sends them traffic once their readiness probe passes, then removes old pods. If something goes wrong, I can roll back to the previous version.
#detail
Without readiness probes, traffic can hit pods that haven't finished starting, which causes errors during deploys. Mention that database migrations need to be backward compatible because old and new versions run at the same time.
#followups
- Why must migrations be backward compatible? || During a rolling update, old and new versions of the app run simultaneously against the same database.
#mistakes
- Forgetting readiness probes
