import { IncidentPostmortem } from "@rhs-ui/marketing/incident-postmortem";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <IncidentPostmortem
        headingLevel={2}
        locale="en-GB"
        incident={{
          id: "INC-2417",
          title: "Elevated error rates on the Halcyon API",
          severity: "major",
          severityCode: "SEV 2",
          start: "2026-10-14T09:12:00Z",
          end: "2026-10-14T11:26:00Z",
          affected: ["Public API", "Webhooks", "Dashboard exports"],
          summary: (
            <>
              <p>
                Between 09:12 and 11:26 UTC on 14 October, <strong>3.1% of all API requests failed</strong> with a 502 or 503 error, and 8.7% at the worst of it. Writes were affected most, because every one of them passed through a database that had just failed over.
              </p>
              <p>
                Writes recovered at 10:41, after we restarted the API servers region by region. Webhooks that had queued during the incident were delivered, in order, by 11:26. No data was lost.
              </p>
            </>
          ),
        }}
        impact={{
          figures: [
            { label: "Customers affected", value: 12480, note: "Out of 41,200 active accounts." },
            { label: "Requests failed", value: 4218906, note: "3.1% of all requests in the window." },
            { label: "Webhooks delayed", value: 1904330, note: "All delivered by 11:26. None were lost." },
          ],
          body: <p>Customers in the EU region saw the most failures. Reads were served from cache and mostly kept working, so dashboards loaded, but creating or changing anything failed until 10:41.</p>,
        }}
        timeline={[
          { time: "2026-10-14T09:12:00Z", event: "A planned failover of the primary database in eu-west starts, as part of a minor version upgrade." },
          { time: "2026-10-14T09:14:00Z", event: "The error rate on the API passes 2%. Connection pools on the API servers keep pointing at the old primary." },
          { time: "2026-10-14T09:19:00Z", milestone: "Detected", event: "The alert on 5xx responses fires and pages the engineer on call, who acknowledges it within two minutes." },
          { time: "2026-10-14T09:31:00Z", event: "The incident is declared as SEV 2 and the status page is updated." },
          { time: "2026-10-14T09:58:00Z", event: "The upgrade is ruled out. The team finds that the API servers still hold connections to the old primary." },
          { time: "2026-10-14T10:22:00Z", event: "Restarting the API servers begins, one region at a time, starting with eu-west." },
          { time: "2026-10-14T10:41:00Z", milestone: "Mitigated", event: "The error rate falls below 0.1% and writes succeed again." },
          { time: "2026-10-14T11:26:00Z", milestone: "Resolved", event: "The webhook backlog is fully delivered and the incident is closed." },
        ]}
        rootCause={{
          summary: "The API servers kept sending writes to a database that had stopped being the primary, and nothing told them to let go of it.",
          body: (
            <>
              <p>
                Each API server keeps a pool of database connections open. After a failover, a connection to the old primary does not fail: it hangs, and the pool treats a hanging connection as busy rather than broken. New writes queued behind it until they timed out.
              </p>
              <p>
                Our failover runbook assumed that pools reconnect by themselves. They do in staging, where the cluster is shaped differently, so the rehearsal that should have caught this never could.
              </p>
            </>
          ),
          factors: [
            "The pool had no limit on how old a connection may get, so none were replaced after the failover.",
            "The alert fired on the error rate and not on the failover, so the first half hour went into the wrong theory.",
            "The request dashboard does not show which database a request used.",
          ],
        }}
        lessons={{
          wentWell: [
            "The alert fired within seven minutes and the engineer on call answered in two.",
            "The status page was updated before most customers had written to us.",
            "Webhooks were queued and replayed in order, so no event was lost or sent twice.",
          ],
          wentPoorly: [
            "The failover runbook had never been tried on a cluster shaped like production.",
            "It took 46 minutes to find the cause, because nothing showed where requests were going.",
            "Customers in the EU region heard from us 19 minutes after their first failed request.",
          ],
        }}
        actions={[
          { title: "Set a maximum age on database connections in every API pool", owner: "Platform", due: "2026-11-06", status: "in-progress", ticket: "PLAT-482", href: "#plat-482" },
          { title: "Alert on a database failover, not only on the errors it causes", owner: "Reliability", due: "2026-10-30", status: "done", ticket: "REL-217", href: "#rel-217" },
          { title: "Show the target database on the request dashboard", owner: "Observability", due: "2026-11-20", status: "planned", ticket: "OBS-93", href: "#obs-93" },
          { title: "Rehearse a failover on a production-shaped cluster every quarter", owner: "Reliability", person: "Priya Nair", due: "2026-12-04", status: "planned", ticket: "REL-224", href: "#rel-224" },
          { title: "Add the API restart to the failover runbook", owner: "Platform", due: "2026-10-21", status: "done", ticket: "PLAT-479", href: "#plat-479" },
          { title: "Post the first status message within ten minutes of declaring an incident", owner: "Support", due: "2026-11-13", status: "in-progress", ticket: "SUP-311", href: "#sup-311" },
        ]}
      />

      <div className="mt-20 border-t border-border pt-12">
        <p className="mb-10 max-w-2xl text-xs text-muted-foreground">
          The other states, in a smaller report. A critical incident that is still going on: the badge carries an icon as well as the word, there is no end time so the duration reads Ongoing, and the change that caused it, made before the start, shows a minus.
        </p>
        <IncidentPostmortem
          headingLevel={2}
          locale="en-GB"
          idPrefix="inc-2431"
          note={null}
          incident={{
            id: "INC-2431",
            title: "Card payments are being declined at checkout",
            severity: "critical",
            severityCode: "SEV 1",
            start: "2026-10-21T16:20:00Z",
            affected: ["Checkout", "Card payments"],
            summary: (
              <p>
                Since 16:20 UTC, <strong>38% of card payments have been declined</strong> at checkout. Other payment methods are working. The cause is not confirmed yet, and this report will be completed once the incident is closed.
              </p>
            ),
          }}
          impact={{
            figures: [
              { label: "Payments declined", value: 18240, note: "Since 16:20 UTC, and still counting." },
              { label: "Checkouts affected", value: "38%", note: "At the worst of it." },
            ],
          }}
          timeline={[
            { time: "2026-10-21T16:08:00Z", event: "A change to the retry settings of the payment service is deployed to every region." },
            { time: "2026-10-21T16:20:00Z", event: "The first card payments are declined with a timeout." },
            { time: "2026-10-21T16:27:00Z", milestone: "Detected", event: "The alert on the payment success rate fires and pages the engineer on call." },
            { time: "2026-10-21T16:49:00Z", event: "The retry change is rolled back. Payments are recovering, but the success rate is still below normal." },
          ]}
          rootCause={{ summary: "Not confirmed yet. The retry change is the leading cause and has been rolled back, but the success rate has not fully recovered." }}
        />
      </div>

      <div className="mt-20 border-t border-border pt-12">
        <p className="mb-10 max-w-2xl text-xs text-muted-foreground">A minor incident: the outline badge, and a report that stops after the root cause when there is nothing to add about lessons or actions.</p>
        <IncidentPostmortem
          headingLevel={2}
          locale="en-GB"
          idPrefix="inc-2398"
          note={null}
          incident={{
            id: "INC-2398",
            title: "Dashboard exports waited in a queue for up to 19 minutes",
            severity: "minor",
            severityCode: "SEV 3",
            start: "2026-10-19T13:05:00Z",
            end: "2026-10-19T14:10:00Z",
            affected: ["Dashboard exports"],
            summary: <p>Exports started from the dashboard waited in a queue instead of finishing in under a minute. Every export completed, and nothing else was affected.</p>,
          }}
          impact={{
            figures: [
              { label: "Exports delayed", value: 312, note: "All completed. None failed." },
              { label: "Longest wait", value: "19 min", note: "The usual wait is under a minute." },
            ],
          }}
          timeline={[
            { time: "2026-10-19T13:05:00Z", event: "The export queue starts to grow after every scheduled report is queued at once, at the top of the hour." },
            { time: "2026-10-19T13:31:00Z", milestone: "Detected", event: "A support ticket about a slow export is matched with the queue depth, which had no alert on it." },
            { time: "2026-10-19T14:10:00Z", milestone: "Resolved", event: "The queue is empty and the export workers are scaled back." },
          ]}
          rootCause={{ summary: "Every scheduled report was queued at the top of the hour, and the export workers could not scale fast enough to take them." }}
        />
      </div>
    </div>
  );
}
