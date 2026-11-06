---
slug: power-automate
title: Power Automate
category: enterprise
aliases: Microsoft Flow, flows, cloud flows, desktop flows, RPA, workflow automation, Power Platform
tagline: Microsoft's tool for automating workflows between apps and services, triggered by events, schedules or buttons.
level: beginner
minutes: 4
concepts: dataverse
related: power-apps, dataverse, rest-apis
popular: true
---
::what
Power Automate, formerly Microsoft Flow, is Microsoft's workflow automation tool. A **flow** starts with a **trigger** (an email arrives, a file is created, a form is submitted, a schedule fires) and then runs a series of **actions** (send an email, create a folder, update a record, post to Teams, call an API). It connects to hundreds of services through connectors.

::why
A lot of office work is copying information from one place to another: download the attachment, save it to SharePoint, notify the manager, update the tracker. It's repetitive and easy to get wrong. Power Automate turns those steps into a flow that runs every time, the same way.

::how
- **Cloud flows** run in Microsoft's cloud. They can be **automated** (event triggers), **instant** (button or Power Apps triggers) or **scheduled**.
- **Desktop flows** do RPA (robotic process automation): they click through desktop apps and old systems that have no API.
Flows use **expressions** for logic (for example `formatDateTime()` or `concat()`), conditions, loops (`Apply to each`) and approvals.

::where
- Approvals: leave, purchase orders, document sign-off
- Notifications: alert a Teams channel when a ticket is created
- Data sync: copy form responses into SharePoint or Dataverse
- File handling: save email attachments, create folders by project or status
- Calling REST APIs from line-of-business systems

::know
- **Trigger plus actions** is the whole mental model.
- **Run history** shows each run's inputs and outputs, which is the main debugging tool.
- **Error handling:** use "Configure run after" and Scope actions to build try-catch patterns.
- **Throttling and limits:** connectors have request limits; loops over thousands of items get slow.
- **Ownership:** flows owned by one person break when they leave. Use service accounts or solutions.

::analogy
Power Automate is a rule-following assistant: "whenever this happens, do these things, in this order." They never forget a step, and they do exactly what you wrote, even when you wrote it wrong.

::talk10
Power Automate is Microsoft's workflow automation tool. You set a trigger, like a new email or form submission, and it runs actions across apps automatically.

::talk30
Power Automate lets you automate workflows across Microsoft 365 and hundreds of other services. Every flow has a trigger, like a new item in a SharePoint list, a form submission or a schedule, followed by actions like sending emails, creating files, updating records or starting an approval. Cloud flows work through APIs and connectors, and desktop flows can automate old desktop apps through RPA. In real projects, the important parts are error handling, staying within connector limits, and making sure flows don't depend on one person's account.

::comebacks
- Is it the same as Zapier? || Similar idea. Power Automate is deeply integrated with Microsoft 365, Dataverse and Azure AD identity, which is why enterprises on Microsoft use it.
- What's RPA? || Robotic process automation: software that clicks and types through a user interface, for systems without an API.
- Can it call any API? || Yes, using the HTTP action (premium) or a custom connector.

::facts
- Microsoft Flow was renamed Power Automate in November 2019.
- The HTTP action and many connectors like SQL Server are premium, which affects licensing.

::deeper
### Error handling pattern
1. Put the main steps in a **Scope** called Try.
2. Add a second Scope called Catch, set to "run after" Try **has failed** or **has timed out**.
3. In Catch, log the error (`result('Try')`) and notify someone.

### Performance
- Filter at the source with OData filter queries instead of getting all items and filtering in a loop.
- Turn on **concurrency** for `Apply to each` when order doesn't matter.
- Avoid nested loops over large lists.

### Working with expressions
```text
formatDateTime(utcNow(), 'yyyy-MM-dd')
concat('Projects/', triggerBody()?['Status'], '/', triggerBody()?['Title'])
```

::sources
- [Microsoft Learn: Power Automate documentation](https://learn.microsoft.com/en-us/power-automate/)
- [Microsoft Learn: Limits and configuration](https://learn.microsoft.com/en-us/power-automate/limits-and-config)
- [Microsoft Learn: Error handling in flows](https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/error-handling)

::check
A flow loops over 5,000 SharePoint items to find 20 with Status = "Overdue". It's slow. What's the best fix?
- [ ] Add a delay inside the loop
- [x] Use a filter query in Get items so SharePoint returns only the 20
- [ ] Split the flow into five flows
- [ ] Switch to a desktop flow
> Filtering at the source means only the needed items come back. Looping over everything wastes time and API calls.

::interview
=== q: What is Power Automate and what types of flows are there? | level: beginner | pro: false
#answer
1. Microsoft's workflow automation service in the Power Platform.
2. Cloud flows: automated (event), instant (manual or from Power Apps), scheduled.
3. Desktop flows: RPA for UI-based automation.
4. Business process flows guide users through stages in model-driven apps.
#short
Power Automate automates workflows between services. Cloud flows run on triggers, buttons or schedules, and desktop flows use RPA to automate apps without APIs. I've used it for things like approvals and notifications.
#detail
If you have built one, describe it concretely: the trigger, the main actions and how you handled failures. That's much stronger than listing flow types.
#followups
- How do you debug a failed flow? || Open the run history, check each action's inputs and outputs, and find the first failed step.
#mistakes
- Not mentioning error handling at all

=== q: How do you make flows reliable in production? | level: intermediate | pro: true
#answer
1. Try-catch with Scopes and "Configure run after".
2. Notifications or logging on failure.
3. Build in solutions with connection references; use service accounts, not personal accounts.
4. Respect limits: filter at source, use pagination, concurrency where safe.
5. Make actions safe to re-run where possible.
#short
I wrap the main logic in a Try scope with a Catch scope that runs on failure and alerts someone. Flows live in solutions with connection references and run under a service account, so they don't break when someone leaves. And I filter data at the source to stay within limits.
#detail
Mention that triggers can fire more than once in some situations, so actions like creating records should check for duplicates.
#followups
- Why avoid personal connections? || If that person leaves or changes their password, every flow using their connection stops.
#mistakes
- Owning critical flows with a personal account
