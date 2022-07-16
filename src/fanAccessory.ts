import { PlatformAccessory } from "homebridge";
import { PergolaPlatform } from "./platform";
import axios from "axios";

const NUMBER_OF_FAN_SPEEDS = 6;

interface FanResponsePayload {
  clientId: string;
  fanOn: boolean;
  fanSpeed: number;
  fanDirection: "forward" | "reverse";
  lightOn: boolean;
  lightBrightness: number;
}

export function beginFanAccessory(platform: PergolaPlatform, accessory: PlatformAccessory, fanIP: string) {
  const { Characteristic } = platform;
  const { CLOCKWISE, COUNTER_CLOCKWISE } = Characteristic.RotationDirection;

  const url = `http://${fanIP}/mf`;

  async function update(payload: Partial<FanResponsePayload>) {
    await axios.post(url, payload);
  }

  async function get() {
    const response = await axios.post<FanResponsePayload>(url, { queryDynamicShadowData: 1 });
    return response.data;
  }

  const fanService = accessory.getService(platform.Service.Fan) ?? accessory.addService(platform.Service.Fan);

  fanService
    .getCharacteristic(platform.Characteristic.On)
    .onGet(async () => {
      return (await get()).fanOn;
    })
    .onSet((on) => {
      update({ fanOn: on as boolean });
    });

  fanService
    .getCharacteristic(platform.Characteristic.RotationSpeed)
    .setProps({ minStep: 100 / NUMBER_OF_FAN_SPEEDS })
    .onGet(async () => {
      const { fanSpeed } = await get();
      return (fanSpeed * 100) / NUMBER_OF_FAN_SPEEDS;
    })
    .onSet((rotationSpeed) => {
      const fanSpeed = Math.round(((rotationSpeed as number) / 100) * NUMBER_OF_FAN_SPEEDS);
      update({ fanSpeed: fanSpeed as number });
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
