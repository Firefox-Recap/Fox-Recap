/* global browser, ExtensionAPI, EventManager */

this.trial = this.trial || {};
this.trial.ml = class extends ExtensionAPI {
  getAPI(context) {
    return {
      trial: {
        ml: {
          createEngine: async ({ modelHub, taskName, modelId, dtype }) => {
            await browser.ml.createEngine({
              modelHub,
              taskName,
              modelId,
              dtype
            });
          },
          runEngine: async ({ args }) => {
            return await browser.ml.runEngine({ args });
          },
          onProgress: new EventManager({
            context,
            name: "trial.ml.onProgress",
            register: fire => {
              const listener = progress => fire.sync(progress);
              browser.ml.onProgress.addListener(listener);
              return () => {
                browser.ml.onProgress.removeListener(listener);
              };
            }
          }).api()
        }
      }
    };
  }
};
