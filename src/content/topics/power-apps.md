---
slug: power-apps
title: Power Apps
category: enterprise
aliases: PowerApps, canvas apps, model-driven apps, Power Fx, Power Platform, low-code
tagline: Microsoft's low-code tool for building business apps on top of your organisation's data.
level: beginner
minutes: 4
concepts: power-apps-delegation, dataverse
related: power-automate, dataverse
popular: true
---
::what
Power Apps is Microsoft's low-code platform for building business applications. You build screens with drag-and-drop controls and write logic in **Power Fx**, an Excel-like formula language. Apps connect to data in Dataverse, SharePoint, SQL Server, Excel and hundreds of other services through **connectors**. It's part of the Microsoft Power Platform.

::why
Every organisation has processes run on spreadsheets and email: leave requests, asset tracking, site inspections. Building a custom app for each one used to need developers and months. Power Apps lets people who know the process build a working app in days, inside the Microsoft 365 security and identity they already use.

::how
There are two main types:
- **Canvas apps:** you design every screen freely, like a slide deck, and wire controls to data with formulas. Good for task-focused and mobile apps.
- **Model-driven apps:** you model your data in Dataverse, and the app's forms, views and navigation are generated from it. Good for data-heavy back-office apps.
Formulas are reactive, like Excel: if a label shows `Gallery1.Selected.Name`, it updates automatically when the selection changes.

::where
- Internal business apps: approvals, inspections, inventory, HR requests
- Field-worker apps on phones and tablets, including offline scenarios
- Front ends over SharePoint lists or Dataverse tables
- Teams apps for departments

::know
- **Canvas vs model-driven** is the first decision.
- **Delegation:** for large data sources, filters must be "delegable" so the server does the work. Otherwise Power Apps only processes the first 500 (configurable up to 2,000) rows and silently misses the rest.
- **Licensing matters:** premium connectors and Dataverse need premium licences.
- **Power Fx** is declarative and reactive, like Excel formulas.
- **Environments and ALM:** use solutions and separate dev, test and production environments.

::analogy
Power Apps is like building with LEGO Technic instead of machining every part. You get standard pieces that fit together, which is much faster, as long as you design within what the pieces can do.

::talk10
Power Apps is Microsoft's low-code platform for business apps. You build screens with drag-and-drop and Excel-like formulas, connected to data like SharePoint or Dataverse.

::talk30
Power Apps lets you build internal business apps quickly, using drag-and-drop screens and Power Fx, a formula language that works a lot like Excel. Canvas apps give you full control over the layout, while model-driven apps are generated from your Dataverse data model. Apps connect to hundreds of data sources through connectors and run inside Microsoft 365 security. The main technical thing to understand is delegation: with large data sources, your filters need to run on the server, or the app silently works on only the first few hundred rows.

::comebacks
- Is low-code real development? || It's development with different trade-offs. You still need data modelling, performance thinking and deployment discipline, just less boilerplate.
- When shouldn't you use Power Apps? || Public, consumer-facing apps, very complex UIs, or heavy real-time processing are better built with traditional code.
- SharePoint or Dataverse? || SharePoint lists are fine for simple, small apps. Dataverse is better for relational data, security roles and scale.

::facts
- Power Fx was open-sourced by Microsoft in 2021.
- The default delegation limit is 500 rows and can be raised to 2,000.

::deeper
### Delegation, concretely
```text
Filter(Orders, Status = "Open")         // delegable to Dataverse: server filters
Filter(Orders, Len(Notes) > 100)        // may not be delegable: only first N rows checked
```
Power Apps shows a blue underline and a warning for non-delegable formulas. Ignoring it is the most common cause of "the app can't find records that definitely exist".

### ALM basics
- Build in a **solution**, not loose in an environment.
- Use **environment variables** and **connection references** so the same solution works in dev, test and production.
- Use pipelines to promote managed solutions to production.

### Performance tips
- Load only the columns and rows you need.
- Use `Concurrent()` for independent data loads at app start.
- Avoid heavy logic in `OnStart`; prefer named formulas and loading data per screen.

::sources
- [Microsoft Learn: What is Power Apps?](https://learn.microsoft.com/en-us/power-apps/powerapps-overview)
- [Microsoft Learn: Understand delegation in a canvas app](https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/delegation-overview)
- [Microsoft Learn: Power Fx overview](https://learn.microsoft.com/en-us/power-platform/power-fx/overview)

::check
A canvas app searching a 20,000-row SharePoint list can't find items users know exist. The formula shows a delegation warning. What's happening?
- [ ] SharePoint is down
- [x] The filter runs locally on only the first 500–2,000 rows
- [ ] The user lacks permission to every row
- [ ] Power Apps caches stale data
> Non-delegable formulas pull a limited number of rows and filter them on the device. Records beyond that limit are never checked. Rewrite the filter with delegable functions.

::interview
=== q: What's the difference between canvas and model-driven apps? | level: beginner | pro: false
#answer
1. Canvas: you design every screen freely; connect to many data sources.
2. Model-driven: UI is generated from the Dataverse data model; consistent, data-heavy.
3. Canvas suits task-based and mobile apps; model-driven suits complex back-office processes.
#short
With canvas apps I design every screen myself and can connect to almost any data source, which is great for focused or mobile apps. Model-driven apps are built on Dataverse, and the forms and views come from the data model, which suits larger back-office systems with lots of related data.
#detail
Mention that both can live in the same solution, and that you'd choose based on the users' task, the data complexity and licensing.
#followups
- Can a canvas app use Dataverse? || Yes. Canvas apps can use Dataverse as a data source too.
#mistakes
- Saying model-driven apps can't be customised at all

=== q: What is delegation in Power Apps? | level: intermediate | pro: false
#answer
1. Delegation means the data source does the filtering and sorting, not the app.
2. Non-delegable formulas only process the first 500 (up to 2,000) records locally.
3. This leads to silently incomplete results on large data.
4. Fix: use delegable functions and operators for the data source, or restructure the data.
#short
Delegation is whether Power Apps can push a query to the data source. If a formula isn't delegable, the app downloads only the first 500 to 2,000 records and filters those, so results on big lists are silently incomplete. I watch for the delegation warnings and rewrite filters to be delegable.
#detail
Give a real example: `StartsWith` is delegable to SharePoint for text columns, while `Search` and `in` often are not. Mention that delegation support differs by data source, so you check the documentation for the specific connector.
#followups
- How would you handle a search that isn't delegable? || Pre-filter with a delegable condition, add an indexed column, or move the query to Dataverse or a flow.
#mistakes
- Fixing it by just raising the limit to 2,000

=== q: How do you manage ALM for Power Apps? | level: advanced | pro: true
#answer
1. Build everything inside solutions.
2. Separate dev, test and production environments.
3. Use environment variables and connection references for environment-specific settings.
4. Deploy managed solutions to test and production with pipelines or Azure DevOps or GitHub Actions.
5. Source control the unpacked solution.
#short
I keep everything in solutions, develop in a dev environment and deploy managed solutions to test and production through pipelines. Environment variables and connection references let the same solution point at the right data in each environment.
#detail
Mention why managed solutions matter in production: they prevent unmanaged edits that drift from source control.
#followups
- Managed vs unmanaged solution? || Unmanaged is for development and editable. Managed is a locked, versioned package for deployment.
#mistakes
- Building directly in production
