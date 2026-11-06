---
slug: dataverse
title: Dataverse is more than a database
topic: lowcode
difficulty: intermediate
minutes: 6
pro: true
related: power-apps-delegation, supabase-rls, sql-indexes
---
::dek
Tables, relationships, security roles, business rules, audit and APIs in one managed service. What you're actually paying for when Power Platform says "premium".

::hook
To a developer, Dataverse looks like "a SQL database with a nicer UI". To a Power Platform architect, it's the reason an app can go from a team prototype to a company-wide system without a rewrite. The truth sits in between — and being able to explain that gap is exactly what makes you the person in the room who understands the platform.

::yap
Dataverse is Power Platform's managed data layer: relational tables plus security, business logic, auditing and APIs built in — so a low-code app can grow into an enterprise one.

::basics
**Dataverse** is where Power Platform apps can store their data. You create **tables** (like Customers or Orders), add **columns** (text, number, choice, lookup), and connect tables with **relationships**.

Compared to SharePoint lists or Excel, it gives you:

- **Real relationships**: an Order belongs to a Customer, and you can navigate between them.
- **Security roles**: who can read, create, edit or delete which records — down to "only records you own" or "your business unit".
- **Business rules**: "if Status is Closed, make Resolution required" — enforced everywhere, not just in one app.
- **Scale and delegation**: far more formulas delegate to Dataverse, so apps keep working with large tables.
- **Auditing**: who changed what, and when.

It also comes with standard tables like Account and Contact (the **Common Data Model**), which Dynamics 365 apps use. That's why Dynamics and Power Apps can share data natively.

The trade-off is licensing: apps using Dataverse generally need **premium** Power Apps licences.

::hood
### What's underneath

Dataverse runs on Azure: relational data in Azure SQL, files and images in blob storage, search via Azure AI Search (Dataverse search), and logs in separate storage. You don't manage any of it — you work through tables and APIs.

### Security model

Layers, from coarse to fine:

1. **Environment**: who can access this Dataverse instance at all (security groups).
2. **Business units**: hierarchical organisation boundaries.
3. **Security roles**: privileges per table (Create/Read/Write/Delete/Append/Assign/Share) at a depth — User, Business Unit, Parent-Child BU, Organization.
4. **Teams and record sharing**: grant access to specific records.
5. **Column-level security**: hide or protect sensitive columns like salary.

This is the same model Dynamics 365 uses — mature, but worth designing deliberately.

### Logic layers

- **Business rules**: declarative, run on forms and (for some scopes) on the server.
- **Power Automate flows**: triggered by row changes, asynchronous.
- **Plug-ins**: C# code that runs inside the transaction pipeline (pre-validation, pre-operation, post-operation). The pro-code escape hatch.
- **Calculated, rollup and formula columns**: derived data.

### APIs

Everything is exposed through the **Web API** (OData v4) and SDK. Pro developers, Azure Functions or external systems can read and write the same data with the same security applied.

::deep
### Solutions and ALM

Tables, apps, flows and plug-ins are packaged into **solutions** and moved between environments (dev → test → prod). **Unmanaged** solutions are for development; **managed** solutions are locked deployables. Pair this with Power Platform pipelines or Azure DevOps/GitHub Actions and you have real CI/CD for low-code. Skipping solutions in early prototypes is the most common reason ALM becomes painful later.

### Modelling trade-offs

- **Lookups vs choices**: a choice column is fast and simple but can't hold extra attributes; a lookup to a reference table can.
- **Many-to-many**: native N:N relationships are easy but hide the intersect table; a custom intersect table lets you add columns like "role on project".
- **Elastic tables** (backed by Azure Cosmos DB) handle very high-volume, loosely structured data such as IoT events, with different capabilities from standard tables.
- **Virtual tables** surface external data (SQL, SharePoint, OData) as if it lived in Dataverse — without copying it.

### Capacity and cost

Storage is licensed separately for database, file and log capacity, and database capacity is the expensive one. Storing large attachments as files (not in rows), archiving old data, and trimming audit retention are common cost controls.

### When not to use it

Simple, small, team-level apps with document-centric data may be better on SharePoint. High-throughput transactional systems with complex SQL needs may be better on Azure SQL with Power Apps connecting via the SQL connector. Dataverse shines in the middle: business apps with relational data, granular security and many makers.

::myths
- Dataverse is just SQL Server with a UI || It's a managed platform on Azure that adds security roles, business logic, auditing, search and APIs on top of storage.
- SharePoint lists and Dataverse are interchangeable || They differ in relationships, security granularity, delegation support and scale.
- Low-code means no ALM || Solutions, environments and pipelines give Dataverse projects proper dev/test/prod workflows.

::facts
- Dataverse was previously called Common Data Service (CDS) and was renamed in late 2020.
- Dynamics 365 apps like Sales and Customer Service run on Dataverse — it's the same data platform.

::realworld
- Company-wide request and approval apps with business-unit security.
- Model-driven apps for case management built directly on Dataverse tables.
- Integrating Power Apps data with Azure services through the Web API and Azure Synapse Link.

::check
A team needs an app where managers see their whole department's requests, but staff see only their own. Which Dataverse feature handles this most directly?
- [ ] Business rules
- [x] Security roles with User vs Business Unit access levels
- [ ] Calculated columns
- [ ] Virtual tables
> Security roles define privileges at a depth: staff get User-level read on requests, managers get Business Unit-level. Dataverse enforces this server-side for every app and API.
