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
import CampfireCtrl from "../gameobjects/campfirectrl";
import { QuestLocalId } from "../localquests/questdata";
import { RainStorm } from "@Glibs/world/rain/rainstorm";
import { RadialMenuUI } from "@Glibs/ux/radialmenus/radialmenus";
import MenuGroup from "@Glibs/ux/menuicons/menugroup";
import { Monsters } from "@Glibs/actors/monsters/monsters";
import { MonsterId } from "@Glibs/types/monstertypes";
import { itemDefs } from "@Glibs/inventory/items/itemdefs";
import { clearAllPendingTimers, createManagedTimeout } from "./utils";
import CompleteDialog from "../dialogs/completedlg";
import LoadingDialog from "../dialogs/loadingdlg";
import DialogFactory from "../gamefab/dialogfab";
import AbstractState from "./abstractstate";
import { TSEventTypes } from "../types/commontypes";

export default class PlayState extends AbstractState {
    compDlg = new CompleteDialog(this.eventCtrl)
    constructor(
        protected eventCtrl: IEventController,
        private camera: Camera,
        private dialogue: DialogueManager,
        private player: Player,
        private monsters: Monsters,
        private quest: QuestManager,
        private dialogFab: DialogFactory,
        private loadingDlg: LoadingDialog,
        private ringMenu: RadialMenuUI,
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
        this.stormRain.Hide()

        const survivorScript = [
            {
                type: 'action', func: () => {
                    this.storymode()
                    this.eventCtrl.SendEventMessage(EventTypes.DayNightCtrl, { v: 0.85, auto: false })
                    this.eventCtrl.SendEventMessage(TSEventTypes.HudCtrl, { visible: true })
                    this.eventCtrl.SendEventMessage(EventTypes.Reward, itemDefs.Hanhwasbat.id)
                }
            },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 이제 좀비가 몰려와. 100마리를 사냥하면 여기서 탈출할 수 있을거야." },
            {
                type: 'action', func: () => {
                    this.playmode()
                    this.monsters.Enable = true
                    this.respown()
                    this.quest.startQuest(QuestLocalId.Q008_LAST_MISSION)
                    this.eventCtrl.SendEventMessage(EventTypes.Equipment, itemDefs.Hanhwasbat.id)
                }
            },
        ]
        this.dialogue.runScript(survivorScript)
        const finalScript = [
            { type: 'action', func: () => { 
                this.storymode() 
                this.monsters.ReleaseMonster()
                clearAllPendingTimers()
            } },
            { type: 'dialogue', key: KeyType.Action3, text: "정신이 아늑해진다..." },
            { type: 'action', func: () => { 
                this.compDlg.Show()
            } },
            { type: 'dialogue', key: KeyType.Action3, text: "목소리: 다음에 봐" },
            { type: 'action', func: () => { 
                this.loadingDlg.DayShow()
                this.playmode()
                this.eventCtrl.SendEventMessage(EventTypes.JoypadOff, InputMode.Joystick)
                this.eventCtrl.SendEventMessage(EventTypes.JoypadOff, InputMode.Buttons)
            } },
        ]
        this.eventCtrl.RegisterEventListener(EventTypes.QuestStateChanged, (ret: { questId: QuestId, status: string }) => {
            if (ret.status !== "COMPLETED") return
            switch (ret.questId) {
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
        this.eventCtrl.SendEventMessage(TSEventTypes.HudCtrl, { visible: false })
        clearAllPendingTimers()
    }
    Renderer(r: IPostPro, delta: number): void {
        r.render(delta)
    }
}
