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
import QuestDialog from "src/localquests/questdlg";
import { RadialMenuUI } from "@Glibs/ux/radialmenus/radialmenus";
import InvenDialog from "src/dialogs/invendlg";
import MenuGroup from "@Glibs/ux/menuicons/menugroup";
import { Monsters } from "@Glibs/actors/monsters/monsters";
import { MonsterId } from "@Glibs/types/monstertypes";
import { itemDefs } from "@Glibs/inventory/items/itemdefs";
import { clearAllPendingTimers, createManagedTimeout } from "./utils";

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
        private monsters: Monsters,
        private quest: QuestManager,
        private questDlg: QuestDialog,
        private invenDlg: InvenDialog,
        private ringMenu: RadialMenuUI,
        private sdom: MenuGroup,
        private campCtrl: CampfireCtrl,
        private stormRain: RainStorm,
        private objs: THREE.Object3D[] | THREE.Group[] | THREE.Mesh[] = [],
        private taskObj: ILoop[] = [],
        private phyObj: IPhysicsObject[] = [],
    ) {
    }
    async Init() {
        this.ringMenu.setItems([
            // { type: 'img', value: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f392.svg' },
            { icon: { type: 'webfontMS', value: 'personal_bag' }, onSelect: () => { this.invenDlg.show() } },
            { icon: { type: 'webfontMS', value: 'exclamation' }, onSelect: () => { this.questDlg.show() } },
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
                    this.sdom.Show()
                    this.eventCtrl.SendEventMessage(EventTypes.Pickup, itemDefs.Hanhwasbat.id)
                }
            },
            { type: 'dialogue', key: KeyType.Action1, text: "목소리: 이제 좀비가 몰려와. 100마리를 사냥하면 여기서 탈출할 수 있을거야." },
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
        this.eventCtrl.RegisterEventListener(EventTypes.QuestStateChanged, (ret: { questId: QuestId, status: string }) => {
            if (ret.status !== "COMPLETED") return
            switch (ret.questId) {
                case QuestLocalId.Q007_HUNTING_ZOMBIE: {
                    this.dialogue.runScript(survivorScript)
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
