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
import CampfireCtrl from "../gameobjects/campfirectrl";
import { QuestLocalId } from "../localquests/questdata";
import { RainStorm } from "@Glibs/world/rain/rainstorm";

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
        private stormRain: RainStorm,
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
        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoop, this.stormRain)

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
                this.quest.startQuest(QuestLocalId.Q004_OPENING_CAMPFIRE)
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
                this.quest.startQuest(QuestLocalId.Q003_OPENING_GET_LOGS)
                this.playmode()
            }},
        ];
        const fireScript = [
            { type: 'action', func: () => { this.storymode() }},
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 이제 불을 켤수 있어!!" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 모닥불로 다시 돌아가!" },
            { type: 'action', func: () => { 
                this.quest.startQuest(QuestLocalId.Q005_FIRE_CAMPFIRE)
                this.playmode() 
            }},
        ];
        const darkScript = [
            { type: 'action', func: () => { this.storymode() }},
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 모닥불에 가까이 있어" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 이제 기다리면 어둠이 사라질꺼야" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 모닥불에 멀어질 수록" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 어둠에 다시 삼켜질꺼야 " },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 그 때마다 모닥불을 찾아가야해" },
            { type: 'action', func: () => { 
                this.quest.startQuest(QuestLocalId.Q006_ESCAPE_DARKSIDE)
                this.playmode() 
                this.eventCtrl.SendEventMessage(EventTypes.DeregisterLoop, this.stormRain)
                this.stormRain.Hide()
            }},
        ]
        const nightScript = [
            { type: 'action', func: () => { 
                this.storymode() 
                this.eventCtrl.SendEventMessage(EventTypes.DayNightCtrl, { v: 0.85, auto: false })
            }},
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 드디어 밤이 시작되었어" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 길잃은 자들이 몰려올꺼야" },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 모닥불에서 얻은 불타는 나무를 꺼내" },
            { type: 'action', func: () => { 
                this.quest.startQuest(QuestLocalId.Q007_HUNTING_ZOMBIE)
                this.playmode() 
            }},
        ]
        this.eventCtrl.RegisterEventListener(EventTypes.QuestStateChanged, (ret: { questId: QuestId, status: string }) => {
            if(ret.status !== "COMPLETED") return
            switch(ret.questId) {
                case QuestLocalId.Q004_OPENING_CAMPFIRE: {
                    this.dialogue.runScript(logScript)
                    break;
                }
                case QuestLocalId.Q003_OPENING_GET_LOGS: {
                    this.dialogue.runScript(fireScript)
                    break;
                }
                case QuestLocalId.Q005_FIRE_CAMPFIRE: {
                    this.dialogue.runScript(darkScript)
                    break;
                }
                case QuestLocalId.Q006_ESCAPE_DARKSIDE: {
                    this.dialogue.runScript(nightScript)
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