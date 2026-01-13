import IEventController, { ILoop } from "@Glibs/interface/ievent";
import { IPhysicsObject } from "@Glibs/interface/iobject";
import { IGameMode } from "@Glibs/systems/gamecenter/gamecenter";
import { InputMode } from "@Glibs/systems/inputs/input";
import { IPostPro } from "@Glibs/systems/postprocess/postpro";
import { EventTypes } from "@Glibs/types/globaltypes";


export default abstract class AbstractState implements IGameMode {
    get Objects() { return this.objs }
    get TaskObj() { return this.taskObj }
    get Physics() { return this.phyObj }
    constructor(
        protected eventCtrl: IEventController,
        private objs: THREE.Object3D[] | THREE.Group[] | THREE.Mesh[] = [],
        private taskObj: ILoop[] = [],
        private phyObj: IPhysicsObject[] = [],
    ) { }
    abstract Init(): void
    abstract Uninit(): void
    abstract Renderer(r: IPostPro, delta: number): void

    playmode() {
        this.eventCtrl.SendEventMessage(EventTypes.InputButtonEnable, [
            { button: "Space", enabled: true },
            { button: "Action1", enabled: true },
            { button: "Action2", enabled: true },
            { button: "Action3", enabled: true },
        ])
        this.eventCtrl.SendEventMessage(EventTypes.JoypadOn, InputMode.Joystick)
    }
    storymode() {
        this.eventCtrl.SendEventMessage(EventTypes.JoypadOff, InputMode.Joystick)
        this.eventCtrl.SendEventMessage(EventTypes.JoypadOn, InputMode.Buttons)
        this.eventCtrl.SendEventMessage(EventTypes.InputButtonEnable, [
            { button: "Space", enabled: false },
            { button: "Action1", enabled: false },
            { button: "Action2", enabled: false },
            { button: "Action3", enabled: true },
        ])
    }
}