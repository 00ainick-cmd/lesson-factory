import assert from "node:assert/strict";
import test from "node:test";
import { appPathFromIncoming, relativeRootFor } from "./preview-paths.mjs";

const prefix = "/port/5000";

test("normalizes direct and nested-proxy paths", () => {
  assert.equal(appPathFromIncoming("/w/workspace/members", prefix), "/w/workspace/members");
  assert.equal(appPathFromIncoming("/port/5000/w/workspace/members", prefix), "/w/workspace/members");
  assert.equal(
    appPathFromIncoming("/sites/proxy/token/app/port/5000/w/workspace/members", prefix),
    "/w/workspace/members",
  );
});

test("computes a mount-relative root for every route depth", () => {
  assert.equal(relativeRootFor("/port/5000/login", prefix), "./");
  assert.equal(relativeRootFor("/port/5000/w/workspace", prefix), "../");
  assert.equal(relativeRootFor("/port/5000/w/workspace/members", prefix), "../../");
  assert.equal(
    relativeRootFor("/sites/proxy/token/app/port/5000/w/workspace/projects/project/editor", prefix),
    "../../../../",
  );
});
