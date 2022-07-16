import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from "homebridge";

import { PLATFORM_NAME, PLUGIN_NAME } from "./settings";
import { beginFanAccessory } from "./fanAccessory";
import { beginCoveringAccesory } from "./coveringAccessory";
import { createConnection } from "net";

const port = 44100;
const host = "192.168.45.184";
export const socket = createConnection(port, host);

export class PergolaPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly accessories: PlatformAccessory[] = [];

  constructor(public readonly log: Logger, public readonly config: PlatformConfig, public readonly api: API) {
    this.log.debug("Finished initializing platform:", this.config.name);

    this.api.on("didFinishLaunching", () => {
      log.debug("Executed didFinishLaunching callback");
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info("Loading accessory from cache:", accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    const fanIPs = this.config.fanIPs;
    if (Array.isArray(fanIPs)) {
      for (const fanIP of fanIPs) {
        const fanAccessory = this.getAccessory(`Fan-${fanIP}`);

        beginFanAccessory(this, fanAccessory, fanIP);
      }
    }

    const coveringIDs = this.config.coveringIDs;
    if (Array.isArray(coveringIDs)) {
      for (const coveringID of coveringIDs) {
        const coveringAccessory = this.getAccessory(`Covering-${coveringID}`);

        beginCoveringAccesory(this, coveringAccessory, coveringID);
      }
    }
  }

  private getAccessory(displayName: string) {
    const uuid = this.api.hap.uuid.generate(displayName);
    const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);

    if (existingAccessory) {
      return existingAccessory;
    } else {
      const accessory = new this.api.platformAccessory(displayName, uuid);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      return accessory;
    }
  }
}

// TODO:
// slow to respond?
// error handling for network stuffs?
