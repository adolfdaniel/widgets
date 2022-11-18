const defaultActionVerb = 'inc';
const defaultTemplate = {
  type: 'AdaptiveCard',
  body: [
    { type: 'TextBlock', text: 'Total widget update count: ${total}' },
    { type: 'TextBlock', text: 'Widget Activate count: ${activate}' },
    { type: 'TextBlock', text: 'Service worker activate ${swActivate} times' },
    { type: 'TextBlock', text: 'You have clicked the button ${click} times' },
  ],
  actions: [
    {
      type: 'Action.Execute',
      title: 'Increment',
      verb: `${defaultActionVerb}`,
      style: 'positive',
    },
  ],
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  version: '1.5',
};

const WIDGET_TAGS = {
  MAX_AC: 'max_ac',
  MAX_AC_MULTIPLE: 'max_ac_multiple',
};

importScripts('counter.js');

const defaultData = async (tag, type) => {
  // get the stored count
  const counts = {};
  for (const countType of Object.values(COUNT_TYPE)) {
    counts[countType] = await getCount(tag, countType);
  }

  counts[type] = counts[type] + 1;
  await putCounts(tag, counts);


  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { total, ...counts };
};

const defaultPayload = async (tag, type) => {
  return {
    template: JSON.stringify(defaultTemplate),
    data: JSON.stringify(await defaultData(tag, type)),
  };
};

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());

  // Update all widgets when the service worker is activated.
  event.waitUntil(updateAppWidgets());
});

const updateAppWidgets = async () => {
  for (const tag of Object.values(WIDGET_TAGS)) {
    const widget = await self.widgets.getByTag(tag);
    if (widget.instances.length > 0) {
      await updateWidget(widget.definition.tag, COUNT_TYPE.SW_ACTIVATE);
      // Update count only once for a widget tag.
      break;
    }
  }
};

self.addEventListener('install', (event) => {
  // cach counter script for offline use
  event.waitUntil(caches.open("v1").then((cache) => cache.add("/counter.js")));
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("Oh, no! Where's the internet?");
    })
  );
});

const incrementWidgetclick = async () => {
  const allClients = await clients.matchAll({});
  allClients.forEach(client => {
    client.postMessage({ type: "widgetclick" });
  });
};

self.addEventListener('widgetclick', (event) => {
  if (event.action === 'widget-install') {
    event.waitUntil(updateWidget(event.tag, COUNT_TYPE.INSTALL));
  } else if (event.action === 'widget-resume') {
    event.waitUntil(updateWidget(event.tag, COUNT_TYPE.ACTIVATE));
  } else if (event.action === defaultActionVerb) {
    event.waitUntil(updateWidget(event.tag, COUNT_TYPE.CLICK));
  }

  event.waitUntil(console.log(event));
  incrementWidgetclick();
});

const showResult = async (action, additionalText) => {
  const allClients = await clients.matchAll({});
  allClients.forEach(client => {
    client.postMessage({
      type: "showResult",
      action,
      additionalText,
    });
  });
};

const getByTag = async (tag) => {
  const action = `getByTag(${tag})`;
  try {
    const widget = await self.widgets.getByTag(tag);
    console.log(`${action} returned:`);
    console.log(widget);
    if (widget)
      showResult(action, `found a widget named "${widget.definition.name}"`);
    else
      showResult(action, `returned undefined`);
  } catch (error) {
    console.log(error);
    showResult(action, `failed.`);
  }
};

const getByInstanceId = async (instanceId) => {
  const action = `getByInstanceId(${instanceId})`;
  try {
    const widget = await self.widgets.getByInstanceId(instanceId);
    console.log(`${action} returned:`);
    console.log(widget);
    if (widget)
      showResult(action, `found a widget named ${widget.definition.name}`);
    else
      showResult(action, `returned undefined`);
  } catch (error) {
    console.log(error);
    showResult(action, `failed.`);
  }
};

const getByHostId = async (hostId) => {
  const action = `getByHostId(${hostId})`;
  try {
    const widgets = await self.widgets.getByHostId(hostId);
    console.log(`${action} returned:`);
    console.log(widgets);
    if (widgets)
      showResult(action, `found ${widgets.length} widgets`);
    else
      showResult(action, `returned undefined`);
  } catch (error) {
    console.log(error);
    showResult(action, `failed.`);
  }
};

const matchAll = async (options) => {
  if (!options)
    options = {};

  const action = `matchAll(${JSON.stringify(options)})`;
  try {
    const widgets = await self.widgets.matchAll(options);
    console.log(`${action} returned:`);
    console.log(widgets);
    if (widgets)
      showResult(action, `found ${widgets.length} widgets`);
    else
      showResult(action, `returned undefined`);
  } catch (error) {
    console.log(error);
    showResult(action, `failed.`);
  }
};

const updateByTag = async (tag, payload) => {
  if (!payload)
    payload = { data: "content" };
  const action = `updateByTag(${tag}, ${JSON.stringify(payload)})`;
  try {
    await self.widgets.updateByTag(tag, payload);
    console.log(`${action} completed`);
    showResult(action, `completed`);
  } catch (error) {
    console.log(error);
    showResult(action, `failed.`);
  }
};

const updateByInstanceId = async (instanceId, payload) => {
  if (!payload)
    payload = { data: "content" };
  const action = `updateByInstanceId(${instanceId}, ${JSON.stringify(payload)})`;
  try {
    await self.widgets.updateByInstanceId(instanceId, payload);
    console.log(`${action} completed`);
    showResult(action, `completed`);
  } catch (error) {
    console.log(error);
    showResult(action, `failed.`);
  }
};

const updateWidget = async (tag, type) => {
  await updateByTag(tag, await defaultPayload(tag, type));
};

self.onmessage = (event) => {
  const action = event.data.action;
  const inputData = event.data.input;
  const payload = event.data.payload;
  switch (action) {
    case 'getByTag':
      getByTag(inputData);
      break;
    case 'getByInstanceId':
      getByInstanceId(inputData);
      break;
    case 'getByHostId':
      getByHostId(inputData);
      break;
    case 'matchAll':
      matchAll(inputData);
      break;
    case 'updateByTag':
      updateByTag(inputData, payload);
      break;
    case 'updateByInstanceId':
      updateByInstanceId(inputData, payload);
      break;
    default:
      console.log('Not sure what to do with that...');
  }
};
