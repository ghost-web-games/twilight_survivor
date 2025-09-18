import * as THREE from "three";
import IEventController, { ILoop } from '@Glibs/interface/ievent';
import { IPhysicsObject } from '@Glibs/interface/iobject';
import { IGameMode } from '@Glibs/systems/gamecenter/gamecenter'
import { IPostPro } from '@Glibs/systems/postprocess/postpro'
import { EventTypes } from '@Glibs/types/globaltypes';
import { Player } from "@Glibs/actors/player/player";
import { InputMode } from "@Glibs/systems/inputs/input";
import { Camera } from "@Glibs/systems/camera/camera";
import { Npc } from "@Glibs/actors/npc/npc";
import { DefaultPosition } from "../index";
import { KeyType } from "@Glibs/types/eventtypes";
import { DialogueManager } from "@Glibs/systems/alarm/dialoguemgr";
import { QuestManager } from "@Glibs/systems/quests/questmgr";

export default class PlayState implements IGameMode {
    get Objects() { return this.objs }
    get TaskObj() { return this.taskObj }
    get Physics() { return this.phyObj }
    constructor(
        private eventCtrl: IEventController,
        private camera: Camera,
        private dialogue: DialogueManager,
        private player: Player,
        private quest: QuestManager,
        private objs: THREE.Object3D[] | THREE.Group[] | THREE.Mesh[] = [],
        private taskObj: ILoop[] = [],
        private phyObj: IPhysicsObject[] = [],
    ) { 

    }
    async Init() {

        this.camera.controls.enabled = true
        this.eventCtrl.SendEventMessage(EventTypes.Spinner, true)

        this.eventCtrl.SendEventMessage(EventTypes.JoypadOn, InputMode.Buttons)
        this.eventCtrl.SendEventMessage(EventTypes.InputButtonEnable, [
            { button: "Space", enabled: false },
            { button: "Action1", enabled: true },
            { button: "Action2", enabled: false },
            { button: "Action3", enabled: false },
        ])
        this.eventCtrl.SendEventMessage(EventTypes.CtrlObj, this.player)

        this.eventCtrl.SendEventMessage(EventTypes.Spinner, false)

        const introScript = [
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 아직 살아있는 사람이 있어!" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 이대로 있으면 어둠에 삼켜질꺼야" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 일어나!" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 생명의 불을 찾아야해!" },
            { type: 'action', func: () => {
                this.quest.startQuest("Q004_OPENING_CAMPFIRE")
                this.eventCtrl.SendEventMessage(EventTypes.InputButtonEnable, [
                    { button: "Space", enabled: true },
                    { button: "Action1", enabled: true },
                    { button: "Action2", enabled: true },
                    { button: "Action3", enabled: true },
                ])
                this.eventCtrl.SendEventMessage(EventTypes.JoypadOn, InputMode.Joystick)
            }
            },
        ];
        this.dialogue.runScript(introScript)
    }
    Uninit(): void {
    }
    Renderer(r: IPostPro, delta: number): void {
       r.render(delta)
    }
}