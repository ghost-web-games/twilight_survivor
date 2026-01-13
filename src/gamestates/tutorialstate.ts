import * as THREE from "three";
import IEventController, { ILoop } from '@Glibs/interface/ievent';
import { IPhysicsObject } from '@Glibs/interface/iobject';
import { IGameMode } from '@Glibs/systems/gamecenter/gamecenter'
import { IPostPro } from '@Glibs/systems/postprocess/postpro'
import { EventTypes } from '@Glibs/types/globaltypes';
import { Player } from "@Glibs/actors/player/player";
import { InputMode } from "@Glibs/systems/inputs/input";
import { Camera } from "@Glibs/systems/camera/camera";
import { KeyType } from "@Glibs/types/eventtypes";
import { DialogueManager } from "@Glibs/systems/alarm/dialoguemgr";
import { QuestManager } from "@Glibs/systems/quests/questmgr";
import { QuestId } from "@Glibs/systems/quests/questdef";
import { PlayerCtrl } from "@Glibs/actors/player/playerctrl";
import CampfireCtrl from "../gameobjects/campfirectrl";
import { QuestLocalId } from "../localquests/questdata";
import { RainStorm } from "@Glibs/world/rain/rainstorm";
import { RadialMenuUI } from "@Glibs/ux/radialmenus/radialmenus";
import MenuGroup from "@Glibs/ux/menuicons/menugroup";
import { Monsters } from "@Glibs/actors/monsters/monsters";
import { MonsterId } from "@Glibs/types/monstertypes";
import { clearAllPendingTimers, createManagedTimeout } from "./utils";
import CompleteDialog from "../dialogs/completedlg";
import LoadingDialog from "../dialogs/loadingdlg";
import DialogFactory from "../dialogs/dialogfab";
import AbstractState from "./abstractstate";

export default class TutorialState extends AbstractState {
    compDlg = new CompleteDialog(this.eventCtrl)
    constructor(
        protected eventCtrl: IEventController,
        private camera: Camera,
        private dialogue: DialogueManager,
        private player: Player,
        private playerCtrl: PlayerCtrl,
        private monsters: Monsters,
        private quest: QuestManager,
        private dialogFab: DialogFactory,
        private loadingDlg: LoadingDialog,
        private ringMenu: RadialMenuUI,
        private sdom: MenuGroup,
        private campCtrl: CampfireCtrl,
        private stormRain: RainStorm,
        objs: THREE.Object3D[] | THREE.Group[] | THREE.Mesh[] = [],
        taskObj: ILoop[] = [],
        phyObj: IPhysicsObject[] = [],
    ) {
        super(eventCtrl, objs, taskObj, phyObj)
    }
    async Init() {
        this.ringMenu.setItems([
            // { type: 'img', value: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f392.svg' },
            { icon: { type: 'webfontMS', value: 'personal_bag' }, onSelect: () => { this.dialogFab.openInventory() } },
            { icon: { type: 'webfontMS', value: 'exclamation' }, onSelect: () => { this.dialogFab.openQuestLog() } },
        ]);
        this.ringMenu.mount(document.body)
        this.camera.controls.enabled = true
        this.eventCtrl.SendEventMessage(EventTypes.Spinner, true)
        this.eventCtrl.SendEventMessage(EventTypes.OrbitControlsOnOff, true)
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
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 아직 살아있는 사람이 있어!" },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 이대로 있으면 어둠에 삼켜질꺼야" },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 일어나!" },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 생명의 불을 찾아야해!" },
            {
                type: 'action', func: () => {
                    this.quest.startQuest(QuestLocalId.Q004_OPENING_CAMPFIRE)
                    this.playmode()
                    this.eventCtrl.SendEventMessage(EventTypes.AlarmNormal, "캐릭터를 클릭하면 메뉴를 볼 수 있습니다.")
                }
            },
        ];
        this.dialogue.runScript(introScript)
        const logScript = [
            { type: 'action', func: () => { this.storymode() } },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 이런 불이 꺼져있어!" },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 이대로 있으면 어둠에 삼켜질꺼야" },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 나무를 찾아야돼!" },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 살아있는 나무를 찾아!!" },
            {
                type: 'action', func: () => {
                    this.quest.startQuest(QuestLocalId.Q003_OPENING_GET_LOGS)
                    this.playmode()
                }
            },
        ];
        const fireScript = [
            { type: 'action', func: () => { this.storymode() } },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 이제 불을 켤수 있어!!" },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 모닥불로 다시 돌아가!" },
            {
                type: 'action', func: () => {
                    this.quest.startQuest(QuestLocalId.Q005_FIRE_CAMPFIRE)
                    this.playmode()
                }
            },
        ];
        const darkScript = [
            { type: 'action', func: () => { this.storymode() } },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 모닥불에 가까이 있어" },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 이제 기다리면 어둠이 사라질꺼야" },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 모닥불에 멀어질 수록" },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 어둠에 다시 삼켜질꺼야 " },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 그 때마다 모닥불을 찾아가야해" },
            {
                type: 'action', func: () => {
                    this.sdom.Show()
                    this.quest.startQuest(QuestLocalId.Q006_ESCAPE_DARKSIDE)
                    this.playmode()
                    this.eventCtrl.SendEventMessage(EventTypes.DeregisterLoop, this.stormRain)
                    this.stormRain.Hide()
                }
            },
        ]
        const nightScript = [
            {
                type: 'action', func: () => {
                    this.storymode()
                    this.eventCtrl.SendEventMessage(EventTypes.DayNightCtrl, { v: 0.85, auto: false })
                }
            },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 드디어 밤이 시작되었어" },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 길잃은 자들이 몰려올꺼야" },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 인벤토리를 열고 모닥불에서 얻은 불타는 나무를 꺼내" },
            {
                type: 'action', func: () => {
                    this.monsters.Enable = true
                    this.monsters.CreateMonster(MonsterId.Zombie, { respawn: false, timer: 5000 })
                    this.quest.startQuest(QuestLocalId.Q007_HUNTING_ZOMBIE)
                    this.playmode()
                }
            },
        ]
        const survivorScript = [
            {
                type: 'action', func: () => {
                    this.storymode()
                }
            },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 이제 좀비가 몰려와. 100마리를 사냥하면 여기서 탈출할 수 있을거야." },
            {
                type: 'action', func: () => {
                    this.playmode()
                    this.monsters.CreateMonster(MonsterId.Zombie, { respawn: true, timer: 1000 })
                    this.quest.startQuest(QuestLocalId.Q008_LAST_MISSION)
                    this.respown()
                }
            },
        ]
        const finalScript = [
            {
                type: 'action', func: () => {
                    this.storymode()
                    this.monsters.ReleaseMonster()
                    clearAllPendingTimers()
                }
            },
            { type: 'dialogue', key: KeyType.Action3, text: "정신이 아늑해진다..." },
            {
                type: 'action', func: () => {
                    this.compDlg.Show()
                }
            },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 다음에 봐" },
            {
                type: 'action', func: () => {
                    this.loadingDlg.DayShow()
                    this.playmode()
                    this.eventCtrl.SendEventMessage(EventTypes.JoypadOff, InputMode.Joystick)
                    this.eventCtrl.SendEventMessage(EventTypes.JoypadOff, InputMode.Buttons)
                }
            },
        ]
        this.eventCtrl.RegisterEventListener(EventTypes.QuestStateChanged, (ret: { questId: QuestId, status: string }) => {
            if (ret.status !== "COMPLETED") return
            switch (ret.questId) {
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
                case QuestLocalId.Q007_HUNTING_ZOMBIE: {
                    this.dialogue.runScript(survivorScript)
                    break;
                }
                case QuestLocalId.Q008_LAST_MISSION: {
                    this.dialogue.runScript(finalScript)
                    break;
                }
            }
        })
    }
    respown() {
        createManagedTimeout(() => {
            this.monsters.CreateMonster(MonsterId.Zombie, { respawn: true, timer: 1000 })
            this.respown()
        }, 5000)
    }
    Uninit(): void {
        this.campCtrl.uninit()
        this.ringMenu.unmount()
        this.sdom.Hide()
        clearAllPendingTimers()
    }
    Renderer(r: IPostPro, delta: number): void {
        r.render(delta)
    }
}
