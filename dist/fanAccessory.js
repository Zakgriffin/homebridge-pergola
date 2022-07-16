"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.beginFanAccessory = void 0;
const axios_1 = __importDefault(require("axios"));
const NUMBER_OF_FAN_SPEEDS = 6;
function beginFanAccessory(platform, accessory, fanIP) {
    var _a;
    const { Characteristic } = platform;
    const { CLOCKWISE, COUNTER_CLOCKWISE } = Characteristic.RotationDirection;
    const url = `http://${fanIP}/mf`;
    async function update(payload) {
        await axios_1.default.post(url, payload);
    }
    async function get() {
        const response = await axios_1.default.post(url, { queryDynamicShadowData: 1 });
        return response.data;
    }
    const fanService = (_a = accessory.getService(platform.Service.Fan)) !== null && _a !== void 0 ? _a : accessory.addService(platform.Service.Fan);
    fanService
        .getCharacteristic(platform.Characteristic.On)
        .onGet(async () => {
        return (await get()).fanOn;
    })
        .onSet((on) => {
        update({ fanOn: on });
    });
    fanService
        .getCharacteristic(platform.Characteristic.RotationSpeed)
        .setProps({ minStep: 100 / NUMBER_OF_FAN_SPEEDS })
        .onGet(async () => {
        const { fanSpeed } = await get();
        return (fanSpeed * 100) / NUMBER_OF_FAN_SPEEDS;
    })
        .onSet((rotationSpeed) => {
        const fanSpeed = Math.round((rotationSpeed / 100) * NUMBER_OF_FAN_SPEEDS);
        update({ fanSpeed: fanSpeed });
    });
    fanService
        .getCharacteristic(platform.Characteristic.RotationDirection)
        .onGet(async () => {
        const { fanDirection } = await get();
        return fanDirection === "forward" ? CLOCKWISE : COUNTER_CLOCKWISE;
    })
        .onSet(async (rotationDirection) => {
        update({ fanDirection: rotationDirection === CLOCKWISE ? "forward" : "reverse" });
    });
}
exports.beginFanAccessory = beginFanAccessory;
//# sourceMappingURL=fanAccessory.js.map