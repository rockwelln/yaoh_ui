# Bulks

Bulk page expose the processing of bulks on the server.

## New bulk

![new bulk](./images/new_bulk.png "new bulk")

* label: a **unique** name for the bulk run
* source: a data source to feed the run

> The source file has to contains the headers and the delimiter has to be a semicolon (;).

* action: indicates the processing to drive the run (actions are configuration in [Settings / Bulk actions](./bulk_actions.html).

To trigger the run, the source need to be validated first against the rules defined to check the input to prepare the run.
If the source is validated, the run is allowed and can be triggered.

Further information about the run are available in the history.

## History

![bulk history](./images/bulk_history.png "bulk history")

The last 20 runs are shown in this section.

Details are available per run to details and show what happened.

![bulk history details](./images/bulk_history_details.png "bulk history details")
![bulk history details orch](./images/bulk_history_details_orch.png "bulk history details orch")
