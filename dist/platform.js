"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PergolaPlatform = exports.socket = void 0;
const settings_1 = require("./settings");
const fanAccessory_1 = require("./fanAccessory");
const coveringAccessory_1 = require("./coveringAccessory");
const net_1 = require("net");
const port = 44100;
const host = "192.168.45.184";
exports.socket = (0, net_1.createConnection)(port, host);
class PergolaPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.accessories = [];
        this.log.debug("Finished initializing platform:", this.config.name);
        this.api.on("didFinishLaunching", () => {
            log.debug("Executed didFinishLaunching callback");
            this.discoverDevices();
        });
    }
    configureAccessory(accessory) {
        this.log.info("Loading accessory from cache:", accessory.displayName);
        this.accessories.push(accessory);
    }
    discoverDevices() {
        const fanIPs = this.config.fanIPs;
        if (Array.isArray(fanIPs)) {
            for (const fanIP of fanIPs) {
                const fanAccessory = this.getAccessory(`Fan-${fanIP}`);
                (0, fanAccessory_1.beginFanAccessory)(this, fanAccessory, fanIP);
            }
        }
        const coveringIDs = this.config.coveringIDs;
        if (Array.isArray(coveringIDs)) {
            for (const coveringID of coveringIDs) {
                const coveringAccessory = this.getAccessory(`Covering-${coveringID}`);
                (0, coveringAccessory_1.beginCoveringAccesory)(this, coveringAccessory, coveringID);
            }
        }
    }
    getAccessory(displayName) {
        const uuid = this.api.hap.uuid.generate(displayName);
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            return existingAccessory;
        }
        else {
            const accessory = new this.api.platformAccessory(displayName, uuid);
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            return accessory;
        }
    }
}
exports.PergolaPlatform = PergolaPlatform;
// TODO:
// slow to respond?
// error handling for network stuffs?
//# sourceMappingURL=platform.js.map