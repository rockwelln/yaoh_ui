---
sidebar_position: 3
---

# Versions

It can be useful to keep track of the different versions of a workflow. For example, you might want to keep a version of a workflow that is currently in production or which you are certain it is working, and a version that is being tested.

A version is a snapshot of a workflow and it cannot be modified. It can be used to create a new workflow, or to restore a previous version of a workflow.

A workflow has always one and only version that is active. This is the version that is used when the workflow is triggered.

The active version of the working version (the only version that can be modified) are not necessarily the same. For example, you might want to work on a new version of a workflow while the previous version is still active.

## Create a version

In the workflow editor, on the current working version, click on the button `Commit`, choose a name and a description.

### Naming a version

Despite there is no restriction on the name of a version, it is recommended to use a naming convention that allows you to easily identify the version.

For example, you might want to use the following convention:

```
<product-API-name>-<semver-version-number>
```

## Activate a version

In the workflow editor, on the version you want to activate, click on the button `Activate`.

The next instance of the workflow will use this version.

## Rename or delete a version

In the workflow editor, on the bottom of the page, you can see a list of all the versions of the workflow.

You can rename or delete a version by clicking on the corresponding button on the right.
