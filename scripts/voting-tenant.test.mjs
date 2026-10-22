import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadModule(file, dependencies, globals) {
  const source = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, require: name => dependencies[name] ?? {}, ...globals });
  return exports;
}

function storage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key: index => [...values.keys()][index],
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

function pollHarness(tenant, { cloud = true, failure = false } = {}) {
  const localStorage = storage();
  localStorage.setItem("itss.polls.shared", JSON.stringify([{ id: "foreign", question: "Investec only" }]));
  const effects = [];
  const states = [];
  const queries = [];
  const flushes = [];
  let cloudValue = null;
  let cursor = 0;
  const supabase = cloud ? {
    from(table) {
      const filters = {};
      const query = {
        select() { return query; },
        eq(key, value) { filters[key] = value; return query; },
        async maybeSingle() {
          queries.push({ table, ...filters });
          return { data: cloudValue === null ? null : { value: cloudValue }, error: failure ? { message: "network unavailable" } : null };
        },
      };
      return query;
    },
  } : null;
  const module = loadModule("store.ts", {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
        return [states[index], value => { states[index] = value; }];
      },
      useEffect: effect => effects.push(effect),
      useCallback: callback => callback,
    },
    "./lib/tenant": { TENANT_ID: tenant, TENANT: { name: tenant } },
    "./data/course": { MODULES: [], POE_SECTIONS: [] },
    "./lib/supabase": { supabase },
    "./lib/sync": {
      writeFromCloud: (key, value) => localStorage.setItem(key, value),
      flushKey: async (...args) => {
        flushes.push(args);
        cloudValue = localStorage.getItem("itss.polls.shared");
      },
    },
  }, {
    localStorage, document: { visibilityState: "visible" },
    window: { addEventListener() {}, removeEventListener() {}, setInterval() {}, clearInterval() {} },
  });
  return {
    localStorage, queries, flushes,
    render() { cursor = 0; return module.usePolls(); },
    async refresh() {
      for (const effect of effects.splice(0)) effect();
      await new Promise(resolve => setImmediate(resolve));
    },
  };
}

for (const tenant of ["discovery", "investec"]) {
  test(`${tenant}: reads only its tenant and ignores unowned legacy polls`, async () => {
    const app = pollHarness(tenant);
    assert.equal(app.render().polls.length, 0);
    await app.refresh();
    assert.equal(app.render().polls.length, 0);
    assert.deepEqual(app.queries, [{ table: "shared_state", tenant_id: tenant, key: "itss.polls.shared" }]);
    assert.equal(app.localStorage.getItem(`itssDevice.polls.${tenant}`), "[]");
  });

  test(`${tenant}: creation uses the tenant cloud list, not foreign cached content`, async () => {
    const app = pollHarness(tenant);
    await app.render().create({ id: "author", name: "Staff", role: "Facilitator" }, "Local poll", ["Yes", "No"]);
    const polls = JSON.parse(app.localStorage.getItem(`itssDevice.polls.${tenant}`));
    assert.equal(polls.length, 1);
    assert.equal(polls[0].question, "Local poll");
    assert.equal(app.queries[0].tenant_id, tenant);
    assert.deepEqual(app.flushes, [["itss.polls.shared", true]]);
  });
}

test("a failed cloud read reports an error and cannot publish the old foreign cache", async () => {
  const app = pollHarness("discovery", { failure: true });
  app.render();
  await app.refresh();
  assert.match(app.render().error, /network unavailable/);
  await assert.rejects(app.render().create({ id: "author" }, "New", ["Yes", "No"]), /network unavailable/);
  assert.equal(app.flushes.length, 0);
  assert.equal(app.localStorage.getItem("itssDevice.polls.discovery"), null);
});

test("local-only tenants keep separate polls on the same browser origin", async () => {
  const app = pollHarness("discovery", { cloud: false });
  app.localStorage.setItem("itssDevice.polls.investec", JSON.stringify([{ id: "foreign" }]));
  assert.equal(app.render().polls.length, 0);
  await app.render().create({ id: "author", name: "Staff" }, "Discovery poll", ["Yes", "No"]);
  assert.equal(JSON.parse(app.localStorage.getItem("itssDevice.polls.discovery")).length, 1);
  assert.equal(JSON.parse(app.localStorage.getItem("itssDevice.polls.investec"))[0].id, "foreign");
});

test("voting, retracting, closing, clearing and deleting stay in the Discovery record", async () => {
  const app = pollHarness("discovery");
  const voter = { id: "learner", name: "Learner" };
  const poll = (await app.render().create({ id: "staff" }, "Choose", ["Yes", "No"]))[0];
  await app.render().vote(voter, poll.id, poll.options[0].id);
  assert.equal(app.render().polls[0].votes.learner.option, poll.options[0].id);
  await app.render().retract(voter.id, poll.id);
  assert.equal(Object.keys(app.render().polls[0].votes).length, 0);
  await app.render().vote(voter, poll.id, poll.options[1].id);
  await app.render().clearVotes(poll.id);
  assert.equal(Object.keys(app.render().polls[0].votes).length, 0);
  await app.render().setClosed(poll.id, true);
  assert.equal(app.render().polls[0].closed, true);
  await app.render().remove(poll.id);
  assert.equal(app.render().polls.length, 0);
  assert.ok(app.queries.every(query => query.tenant_id === "discovery"));
});

test("login hydration never seeds an absent tenant poll record from the legacy cache", async () => {
  const localStorage = storage();
  localStorage.setItem("itss.polls.shared", '[{"id":"foreign"}]');
  const tables = [];
  const module = loadModule("lib/sync.ts", {
    "./tenant": { TENANT_ID: "discovery" },
    "./supabase": {
      supabase: { from(table) {
        tables.push(table);
        const query = {
          select() { return query; }, eq() { return query; },
          then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve); },
        };
        return query;
      } },
    },
    "./syncPendingStorage": { loadPendingWrites: async () => {}, pendingWrites: () => [] },
    "./unitStorage": { storedUnitPacks: async () => [] },
    "./onboardingStorage": { storedOnboardingPacks: async () => null },
  }, { localStorage, console });
  await module.startSync("account");
  assert.deepEqual(tables, ["app_state", "shared_state"]);
});

for (const tenant of ["discovery", "investec"]) {
  test(`${tenant}: pending cloud writes use the tenant's own database`, async () => {
    const localStorage = storage();
    const foreign = '[{"userId":"account","key":"itss.polls.shared","value":"foreign","revision":"old"}]';
    if (tenant === "discovery") localStorage.setItem("itss.syncPending", foreign);
    const opened = [];
    const module = loadModule("lib/syncPendingStorage.ts", {
      "./tenant": { TENANT_ID: tenant },
    }, {
      localStorage,
      Storage: { prototype: { removeItem(key) { this.removeItem(key); } } },
      indexedDB: {
        open(name) {
          opened.push(name);
          const request = { result: {
            transaction: () => ({ objectStore: () => ({
              getAll() {
                const result = { result: [] };
                queueMicrotask(() => result.onsuccess());
                return result;
              },
            }) }),
          } };
          queueMicrotask(() => request.onsuccess());
          return request;
        },
      },
    });
    await module.loadPendingWrites();
    assert.deepEqual(opened, [tenant === "investec" ? "itss-sync-pending" : "itss-sync-pending-discovery"]);
    assert.equal(module.pendingWrites().length, 0);
    if (tenant === "discovery") assert.equal(localStorage.getItem("itss.syncPending"), foreign);
  });
}
