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
import { QuestId } from "@Glibs/systems/quests/questdef";
import { PlayerCtrl } from "@Glibs/actors/player/playerctrl";
import CampfireCtrl from "src/gameobjects/campfirectrl";

export default class PlayState implements IGameMode {
    get Objects() { return this.objs }
    get TaskObj() { return this.taskObj }
    get Physics() { return this.phyObj }
    constructor(
        private eventCtrl: IEventController,
        private camera: Camera,
        private dialogue: DialogueManager,
        private player: Player,
        private playerCtrl: PlayerCtrl,
        private quest: QuestManager,
        private campCtrl: CampfireCtrl,
        private objs: THREE.Object3D[] | THREE.Group[] | THREE.Mesh[] = [],
        private taskObj: ILoop[] = [],
        private phyObj: IPhysicsObject[] = [],
    ) { 

    }
    async Init() {

        this.camera.controls.enabled = true
        this.eventCtrl.SendEventMessage(EventTypes.Spinner, true)
        this.eventCtrl.SendEventMessage(EventTypes.CtrlObj, this.player)

        this.eventCtrl.SendEventMessage(EventTypes.Spinner, false)
        this.campCtrl.init()

        const introScript = [
            {
                type: 'action', func: () => {
                    this.storymode()
                    this.playerCtrl.changeState(this.playerCtrl.SleepingIdleSt)
                }
            },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 아직 살아있는 사람이 있어!" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 이대로 있으면 어둠에 삼켜질꺼야" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 일어나!" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 생명의 불을 찾아야해!" },
            { type: 'action', func: () => {
                this.quest.startQuest("Q004_OPENING_CAMPFIRE")
                this.playmode()
            }},
        ];
        this.dialogue.runScript(introScript)
        const logScript = [
            { type: 'action', func: () => { this.storymode() }},
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 이런 불이 꺼져있어!" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 이대로 있으면 어둠에 삼켜질꺼야" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 나무를 찾아야돼!" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 살아있는 나무를 찾아!!" },
            { type: 'action', func: () => {
                this.quest.startQuest("Q003_OPENING_GET_LOGS")
                this.playmode()
            }},
        ];
        const fireScript = [
            { type: 'action', func: () => { this.storymode() }},
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 이제 불을 켤수 있어!!" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 모닥불로 다시 돌아가!" },
            { type: 'action', func: () => { this.playmode() }},
        ];
        this.eventCtrl.RegisterEventListener(EventTypes.QuestStateChanged, (ret: { questId: QuestId, status: string }) => {
            if(ret.status !== "COMPLETED") return
            switch(ret.questId) {
                case "Q004_OPENING_CAMPFIRE": {
                    this.dialogue.runScript(logScript)
                    break;
                }
                case "Q003_OPENING_GET_LOGS": {
                    this.dialogue.runScript(fireScript)
                    break;
                }
            }
        })
    }
    Uninit(): void {
        this.campCtrl.uninit()
    }
    Renderer(r: IPostPro, delta: number): void {
       r.render(delta)
    }
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
            { button: "Action1", enabled: true },
            { button: "Action2", enabled: false },
            { button: "Action3", enabled: false },
        ])
    }
}