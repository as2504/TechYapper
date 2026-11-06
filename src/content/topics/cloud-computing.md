---
slug: cloud-computing
title: Cloud computing
category: data-cloud
aliases: cloud, AWS, Azure, GCP, IaaS, PaaS, SaaS, serverless, Lambda
tagline: Renting computing, storage and services over the internet instead of buying and running your own servers.
level: beginner
minutes: 4
concepts: caching-strategies
related: docker, kubernetes, system-design
popular: true
---
::what
Cloud computing means using computing resources, like servers, storage, databases and AI models, that a provider runs for you in their data centres, and paying for what you use. AWS, Microsoft Azure and Google Cloud are the biggest providers.

::why
Running your own servers means buying hardware up front, guessing how much you'll need, and paying people to keep it running. If you guess low, the site goes down under traffic. If you guess high, you've wasted money. The cloud turns that into an on-demand bill: scale up in minutes, scale down when it's quiet.

::how
Providers run huge fleets of servers and use **virtualisation** to split them into isolated pieces they rent out. You use them at different levels of abstraction:
- **IaaS** (Infrastructure as a Service): virtual machines and networks you manage. Example: AWS EC2.
- **PaaS** (Platform as a Service): you deploy code; they run the servers. Example: Azure App Service, Vercel.
- **SaaS** (Software as a Service): finished applications. Example: Gmail, Microsoft 365.
- **Serverless:** you upload functions that run on demand, billed per call. Example: AWS Lambda.

::where
- Hosting websites, APIs and mobile back ends
- Storing files and backups (Amazon S3, Azure Blob Storage)
- Managed databases, so nobody patches database servers at 2 a.m.
- Running AI models and data pipelines

::know
- **Shared responsibility:** the provider secures the infrastructure; you secure your configuration, data and access.
- **Regions and availability zones:** data centres in different places, for latency and resilience.
- **Elasticity:** scale resources up and down with demand.
- **Pay-as-you-go** can be cheaper or much more expensive. Cost monitoring is a real job.
- **Managed services** trade control for less operations work.

::analogy
The cloud is like electricity from the grid instead of running your own generator. You plug in, use as much as you need, and pay the bill. You still have to avoid leaving everything switched on.

::talk10
Cloud computing means renting servers, storage and services from providers like AWS or Azure, and paying for what you use instead of running your own hardware.

::talk30
With cloud computing, instead of buying and maintaining servers, you rent resources from providers like AWS, Azure or Google Cloud and scale them up or down on demand. You can work at different levels: raw virtual machines, platforms where you just deploy code, or serverless functions that run per request. The big benefits are speed and elasticity. The things to watch are costs, which can grow quietly, and security, because you're still responsible for configuring access correctly.

::comebacks
- Is the cloud always cheaper? || Not always. For steady, predictable workloads, owning hardware can be cheaper. The cloud wins on flexibility and speed.
- What's serverless? || You still use servers; you just don't manage them. You deploy functions and pay per execution.
- Is the cloud secure? || The infrastructure is usually very secure. Most breaches come from customer misconfiguration, like a public storage bucket.

::facts
- AWS launched S3 and EC2 in 2006, which is generally considered the start of modern public cloud.
- Many well-known data leaks came from storage buckets accidentally left public.

::deeper
### Choosing a level of abstraction
- Full control of the OS → virtual machines (IaaS)
- Just run my web app → PaaS (App Service, Vercel, Render)
- Spiky, event-driven work → serverless functions
- Many services, one platform → containers on Kubernetes or a managed container service

### Cost traps
- Data **egress** (data leaving the cloud) is often billed.
- Idle resources keep billing.
- Serverless is cheap at low volume and can get expensive at very high steady volume.

::sources
- [NIST definition of cloud computing (SP 800-145)](https://csrc.nist.gov/pubs/sp/800/145/final)
- [AWS: Shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/)

::check
A company's customer files leak because a storage bucket was set to public. Under the shared responsibility model, who was responsible?
- [ ] The cloud provider
- [x] The customer, because access configuration is their responsibility
- [ ] Nobody, it's a platform bug
- [ ] The internet service provider
> Providers secure the physical infrastructure and the service itself. Configuring who can access your data is the customer's job.

::interview
=== q: Explain IaaS, PaaS and SaaS. | level: beginner | pro: false
#answer
1. IaaS: rent virtual machines, storage and networks; you manage the OS and above.
2. PaaS: deploy your code; the provider manages servers and runtime.
3. SaaS: use a finished application.
4. Moving up the list means less control and less operations work.
#short
They're levels of how much the provider manages. With IaaS you get virtual machines and manage the rest. With PaaS you just deploy code. With SaaS you just use the software, like Gmail.
#detail
A pizza analogy is common: make it at home, take-and-bake, delivery, eat out. Better is a real example from your own work: "Our API runs on Azure App Service, which is PaaS, so we don't patch servers."
#followups
- Where does serverless fit? || Usually counted as a form of PaaS, or "functions as a service", billed per execution.
#mistakes
- Not mentioning the control vs management trade-off

=== q: How would you make an application highly available in the cloud? | level: intermediate | pro: true
#answer
1. Run multiple instances across availability zones behind a load balancer.
2. Use managed databases with replicas and automatic failover.
3. Make the app stateless so any instance can serve any request.
4. Health checks and auto-scaling.
5. Backups and a tested recovery plan.
#short
I'd run several stateless instances across availability zones behind a load balancer, use a managed database with a standby replica, and add health checks and auto-scaling. Then I'd test that failover actually works.
#detail
Mention the difference between high availability (survive a failure with little downtime) and disaster recovery (recover from losing a whole region). Mention RTO and RPO if the conversation goes deeper.
#followups
- What are RTO and RPO? || Recovery time objective: how quickly you must be back. Recovery point objective: how much data loss is acceptable.
#mistakes
- Storing sessions in memory on a single instance
