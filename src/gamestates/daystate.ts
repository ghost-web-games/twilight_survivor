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
import MapFactory from "src/mapfactory";
import { DialogueManager } from "@Glibs/systems/alarm/dialoguemgr";
import { Monsters } from "@Glibs/actors/monsters/monsters";
import { QuestManager } from "@Glibs/systems/quests/questmgr";
import QuestDialog from "../localquests/questdlg";
import LoadingDialog from "../dialogs/loadingdlg";
import InvenDialog from "../dialogs/invendlg";
import { RadialMenuUI } from "@Glibs/ux/radialmenus/radialmenus";
import MenuGroup from "@Glibs/ux/menuicons/menugroup";
import CampfireCtrl from "../gameobjects/campfirectrl";
import { PlayerCtrl } from "@Glibs/actors/player/playerctrl";
import { Bind } from "@Glibs/types/assettypes";
import AbstractState from "./abstractstate";
import DialogFactory from "src/dialogs/dialogfab";

export default class DayState extends AbstractState {
    constructor(
        protected eventCtrl: IEventController,
        private camera: Camera,
        private dialogue: DialogueManager,
        private player: Player,
        private playerCtrl: PlayerCtrl,
        private monsters: Monsters,
        private fog: THREE.FogExp2,
        private quest: QuestManager,
        private dialogFab: DialogFactory,
        private loadingDlg: LoadingDialog,
        private ringMenu: RadialMenuUI,
        private sdom: MenuGroup,
        private campCtrl: CampfireCtrl,
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

        this.monsters.ReleaseMonster()
        this.campCtrl.Enable(false)
        this.eventCtrl.SendEventMessage(EventTypes.JoypadOn, InputMode.Joystick)
        this.eventCtrl.SendEventMessage(EventTypes.JoypadOn, InputMode.Buttons)
        this.eventCtrl.SendEventMessage(EventTypes.Unequipment, Bind.Hands_R)
        this.eventCtrl.SendEventMessage(EventTypes.Unequipment, Bind.Hands_L)
        this.fog.density = 0.0025 * 2

        this.player.Pos.copy(DefaultPosition)
        this.playerCtrl.reset()
        this.playerCtrl.init()
        this.playerCtrl.changeState(this.playerCtrl.SleepingIdleSt)
        this.eventCtrl.SendEventMessage(EventTypes.DayNightCtrl, { v: 0, auto: false })
    }
    Uninit(): void {
    }
    Renderer(r: IPostPro, delta: number): void {
       r.render(delta)
    }
}