---
slug: power-apps-delegation
title: Delegation in Power Apps
topic: lowcode
difficulty: beginner
minutes: 6
pro: false
related: dataverse, sql-indexes, supabase-rls
---
::dek
The blue underline that quietly turns "show me all open orders" into "show me the open ones among the first 500". What it means and how to design around it.

::hook
A Power Apps gallery works perfectly in testing with 200 rows. Six months later the list has 30,000 rows and users swear records are "missing". Nothing crashed. Nothing errored. The app has simply been filtering a small slice of the data the whole time — and the warning was there from day one.

::yap
Delegation is Power Apps asking the data source to do the filtering. When it can't, it downloads the first 500 rows and filters those — no error, just quietly wrong results.

::basics
When you write a formula like:

```powerfx
Filter(Orders, Status = "Open")
```

Power Apps has two ways to run it:

- **Delegate it**: translate the formula into a query the data source understands (SharePoint, Dataverse, SQL Server) and let the *server* return only the matching rows. Fast, and correct for any table size.
- **Run it locally**: download rows to the device and filter them in the app. But Power Apps won't download everything — only the first **500 rows** by default (you can raise it to **2,000** in settings).

If part of your formula can't be translated for that data source, Power Apps falls back to local mode and shows a **delegation warning** (blue underline / yellow triangle).

The danger: with a 10,000-row list, a non-delegable filter only looks at the first 500 rows. Records 501–10,000 are invisible. No error message.

The fix is to rewrite the formula using functions and operators that **are** delegable for your data source.

::hood
### What's delegable depends on the source

Each connector declares what it can translate. Broadly:

- **Dataverse** and **SQL Server** support the widest range: `Filter`, `Sort`, `Search` (Dataverse), `LookUp`, comparison operators, `StartsWith`, `And/Or/Not`, many aggregate functions.
- **SharePoint** supports fewer: `Filter` and `LookUp` with `=`, `<`, `>`, `StartsWith` on text, and some column types only. `Search` and `in` (substring) are not delegable.
- **Excel** (as a data source): effectively not delegable at all.

Always check the connector's delegation documentation, not a general list.

### Common delegation breakers

```powerfx
// ❌ Not delegable to SharePoint: 'in' substring search
Filter(Tickets, txtSearch.Text in Title)

// ✅ Delegable: prefix search
Filter(Tickets, StartsWith(Title, txtSearch.Text))
```

Other usual suspects: `Len`, `Left/Right/Mid`, `Upper/Lower` on columns, `CountRows` on large sources, filtering on calculated or lookup columns, and functions applied to the column side of a comparison.

### The row limit setting

**Settings → General → Data row limit** goes from 500 up to 2,000. Raising it hides the problem a little longer; it doesn't solve it. Setting it to 1 temporarily is a great trick to *test* which screens depend on non-delegable formulas.

::deep
### Designing for scale from day one

1. **Choose the data source deliberately.** For anything that will grow beyond a few thousand rows or needs relationships, Dataverse or SQL beats SharePoint lists.
2. **Filter first, decorate later.** Apply delegable filters to shrink the server result, then run non-delegable logic on that smaller set: `AddColumns(Filter(Orders, Region = varRegion), "Label", …)`.
3. **Index the columns you filter on.** In SharePoint, lists beyond the 5,000-item list view threshold need indexed columns for filtered queries to work at all.
4. **Push heavy logic server-side.** Dataverse views, SQL views or stored procedures, or Power Automate flows can return pre-filtered data.

### Collections are not a fix

`ClearCollect(colAll, Orders)` is subject to the same row limit. Loops that page through data with `ForAll` work but are slow, fragile and hammer the connector. If you need all rows locally, the design is usually wrong.

### Explaining it to stakeholders

Delegation is a *data architecture* conversation, not a formula trick. The question to ask early: "How many rows will this table have in two years, and how will users search it?" That answer decides between SharePoint and Dataverse, which decides licensing — which is often why projects start on SharePoint and hit the wall later.

### The SQL mental model

Delegation is essentially "can this formula become a `WHERE` clause?". If a SQL database could answer it with a query, it's usually delegable to SQL Server. If you'd need to pull every row into application memory to evaluate it, it isn't.

::myths
- Delegation warnings are cosmetic || They mean your results may be silently incomplete once the data grows past the row limit.
- Raising the row limit to 2,000 solves it || It postpones the problem. Any source that grows past 2,000 rows breaks the same way.
- Collecting data into a collection avoids delegation || `Collect` and `ClearCollect` are bound by the same row limit.

::facts
- The default data row limit is 500 and the maximum is 2,000.
- Setting the row limit to 1 is a widely used debugging trick for finding non-delegable formulas.

::realworld
- Search boxes over large SharePoint lists rewritten from `in` to `StartsWith`.
- Migrating growing apps from SharePoint lists to Dataverse for delegation and security roles.
- Power Platform consultants auditing apps for delegation warnings before go-live.

::check
A SharePoint list has 12,000 rows and the data row limit is 2,000. A gallery uses a non-delegable filter. What do users see?
- [ ] An error message telling them to narrow the search
- [x] Matches found only among the first 2,000 rows, with no error
- [ ] All matching rows, just more slowly
- [ ] An empty gallery
> Non-delegable formulas run locally on at most the data row limit. Matches beyond row 2,000 are silently missing.
