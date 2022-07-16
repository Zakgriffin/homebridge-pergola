import { PlatformAccessory } from "homebridge";
import { PergolaPlatform } from "./platform";

import { socket } from "./platform";

export function beginCoveringAccesory(platform: PergolaPlatform, accessory: PlatformAccessory, coveringID: string) {
  const { Characteristic, Service } = platform;
  const { DECREASING, INCREASING, STOPPED } = Characteristic.PositionState;

  let currentPosition = 0;
  let targetPosition = 0;
  let positionState = STOPPED;

  const ESTIMATED_TIME_ACROSS = 31000;

  const coveringService = accessory.getService(Service.WindowCovering) ?? accessory.addService(Service.WindowCovering);

  coveringService.getCharacteristic(Characteristic.CurrentPosition).onGet(() => currentPosition);

  coveringService.getCharacteristic(Characteristic.PositionState).onGet(() => positionState);

  coveringService
    .getCharacteristic(Characteristic.TargetPosition)
    .onGet(() => targetPosition)
    .onSet((t) => {
      targetPosition = t as number;

      if ((currentPosition < targetPosition && positionState !== INCREASING) || targetPosition === 100) {
        doInQueue = up;
      } else if ((currentPosition > targetPosition && positionState !== DECREASING) || targetPosition === 0) {
        doInQueue = down;
      }
    });

  const INTERVAL = 10;

  const up = { dir: "up", dir2: INCREASING };
  const down = { dir: "down", dir2: DECREASING };
  const stop = { dir: "stop", dir2: STOPPED };

  let doInQueue;
  let lastDone;
  let ready = true;

  socket.on("data", (data) => {
    if (JSON.parse(data.toString()).id !== coveringID) return;

    lastDone = doInQueue;
    doInQueue = undefined;
    positionState = lastDone.dir2;
    platform.log.info("Doing: ", lastDone);
    ready = true;
  });

  setInterval(() => {
    if (
      (currentPosition > targetPosition && positionState === INCREASING) ||
      (currentPosition < targetPosition && positionState === DECREASING)
    ) {
      if (targetPosition !== 0 && targetPosition !== 100) {
        doInQueue = stop;
      }
    }

    if (doInQueue !== lastDone && doInQueue !== undefined && ready) {
      const request = {
        method: `mylink.move.${doInQueue.dir}`,
        id: coveringID,
        params: {
          auth: "pergola",
          targetID: coveringID,
        },
      };

      ready = false;
      socket.write(JSON.stringify(request));
    }

    const positionChangePerInterval = (INTERVAL / ESTIMATED_TIME_ACROSS) * 100;
    if (positionState === INCREASING) {
      currentPosition += positionChangePerInterval;
      if (currentPosition > 100) {
        currentPosition = 100;
        positionState = STOPPED;
      }
    } else if (positionState === DECREASING) {
      currentPosition -= positionChangePerInterval;
      if (currentPosition < 0) {
        currentPosition = 0;
        positionState = STOPPED;
      }
    }
  }, INTERVAL);

  // setInterval(() => {
  //   if (coveringID.endsWith("3")) {
  //     platform.log.info("currentPosition: ", currentPosition);
  //     platform.log.info("doInQueue: ", doInQueue);
  //     platform.log.info("positionState: ", positionState);
  //   }
  // }, 500);
}
