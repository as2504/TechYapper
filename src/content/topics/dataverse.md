---
slug: dataverse
title: Dataverse
category: enterprise
aliases: Microsoft Dataverse, Common Data Service, CDS, Dynamics 365 data, tables, security roles, Power Platform
tagline: The managed database behind the Power Platform, with business rules and security built in.
level: intermediate
minutes: 4
concepts: dataverse, power-apps-delegation
related: power-apps, power-automate, postgresql
popular: false
---
::what
Microsoft Dataverse is the data platform underneath Power Apps, Power Automate and Dynamics 365. It stores data in **tables** with typed **columns** and **relationships**, like a relational database, and adds business logic, security roles, auditing and APIs on top, without you managing a server.

::why
SharePoint lists and Excel files are fine for small, simple data. They struggle with relationships, large volumes, fine-grained security and business rules. A full SQL database needs developers and infrastructure. Dataverse is in between: real relational data with enterprise security, managed by Microsoft and usable from low-code tools.

::how
You define tables (standard ones like Account and Contact, or your own custom tables), columns with types, and relationships (one-to-many, many-to-many). Security is **role-based**: security roles grant create, read, write and delete rights at levels like user, business unit or organisation. Business rules, calculated columns, plug-ins and flows add logic. Everything is available through a **Web API** (OData REST).

::where
- Data layer for model-driven and canvas Power Apps
- Dynamics 365 apps (Sales, Customer Service) store their data in Dataverse
- Integration hub for enterprise data through its Web API and Azure services

::know
- **Tables, columns, relationships:** it's relational, even if the UI hides SQL.
- **Security roles** and business units control row-level access.
- **Delegation-friendly:** works well with Power Apps for large data.
- **Premium licensing** is required for Dataverse.
- **Solutions** carry tables and customisations between environments.

::analogy
If SharePoint lists are a shared spreadsheet, Dataverse is a proper filing system with locked cabinets, labelled folders that reference each other, and a log of who opened what.

::talk10
Dataverse is the managed relational database behind the Power Platform. It gives low-code apps proper tables, relationships and role-based security without running a server.

::talk30
Dataverse is Microsoft's data platform for Power Apps, Power Automate and Dynamics 365. It stores data in relational tables with typed columns and relationships, and adds things a plain database doesn't give you out of the box: role-based security down to the row, auditing, business rules and a REST API. It's the natural choice when an app outgrows SharePoint lists, especially if you need relational data, scale or real security. The trade-off is premium licensing.

::comebacks
- Isn't it just SQL Server? || It runs on Azure SQL and other storage underneath, but you interact with it as a managed platform with security and business logic, not as a raw database.
- Why not SharePoint? || SharePoint lists are fine for simple data. Dataverse handles relationships, large volumes and granular security much better.

::facts
- Dataverse was previously called the Common Data Service (CDS), renamed in 2020.
- Dataverse for Teams is a lighter version included with some Microsoft 365 licences.

::deeper
### Security model in brief
- **Security roles** grant privileges per table: create, read, write, delete, append, assign, share.
- **Access levels**: user, business unit, parent-child business unit, organisation.
- **Teams** and **column-level security** refine access further.

### Logic options, from low-code to pro-code
1. Business rules (simple form logic)
2. Calculated and rollup columns, and Power Fx formula columns
3. Power Automate flows triggered by row changes
4. Plug-ins written in C# for synchronous, transactional logic

::sources
- [Microsoft Learn: What is Dataverse?](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-intro)
- [Microsoft Learn: Security concepts in Dataverse](https://learn.microsoft.com/en-us/power-platform/admin/wp-security-cds)

::check
A manager should see their team's records but not other departments'. What Dataverse feature handles this best?
- [ ] Hiding the records with a filter in the app
- [x] Security roles with business-unit access levels
- [ ] A separate environment per department
- [ ] Column-level security
> Filters in the app only hide data; the API could still return it. Security roles enforce access on the server, and business-unit levels scope it to the manager's part of the organisation.

::interview
=== q: When would you choose Dataverse over SharePoint lists? | level: intermediate | pro: false
#answer
1. Relational data with many related tables.
2. Large volumes where delegation and performance matter.
3. Granular, role-based or row-level security.
4. Business logic, auditing and integration needs.
5. Trade-off: premium licensing cost.
#short
I'd pick Dataverse when the data is relational, large, or needs proper role-based security, like managers seeing only their team's records. For a small, simple list with basic permissions, SharePoint is cheaper and good enough.
#detail
Bringing up licensing shows practical experience. So does mentioning that security trimming in the UI isn't real security; Dataverse enforces it server-side.
#followups
- How does Dataverse security work? || Security roles assign table-level privileges with access levels like user, business unit or organisation, combined with teams and column security.
#mistakes
- Ignoring licensing in the decision

=== q: Business rules, flows or plug-ins: how do you choose? | level: advanced | pro: true
#answer
1. Business rules: simple field logic and validation on forms.
2. Power Automate: asynchronous processes, notifications and integrations.
3. Plug-ins: synchronous logic that must run inside the transaction, or complex validation.
4. Prefer the simplest option that meets the requirement.
#short
I'd use business rules for simple form logic, flows for asynchronous work like notifications or integrations, and C# plug-ins when the logic must run synchronously inside the transaction, like blocking an invalid save.
#detail
The key distinction is synchronous versus asynchronous. If the user must not be able to save invalid data, a flow is too late because it runs after the save.
#followups
- Why can't a flow block a save? || Automated flows run asynchronously after the row is saved.
#mistakes
- Using flows for validation that must block saves
