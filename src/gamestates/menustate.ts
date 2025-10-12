import * as THREE from "three";
import IEventController, { ILoop } from '@Glibs/interface/ievent';
import { IGameMode } from '@Glibs/systems/gamecenter/gamecenter'
import { IPostPro } from '@Glibs/systems/postprocess/postpro'
import { Camera } from "@Glibs/systems/camera/camera";
import MenuGroup from "@Glibs/ux/menuicons/menugroup";
import MenuIcon from "@Glibs/ux/menuicons/menuicon";
import { Icons } from "@Glibs/types/icontypes";
import { IPhysicsObject } from "@Glibs/interface/iobject";
import { gsap } from "gsap";
import SystemDialog from "../dialogs/sysdlg";
import { IconsColor } from "@Glibs/ux/menuicons/icontypes";
import StatusBar from "@Glibs/ux/menuicons/statusbar";
import { Player } from "@Glibs/actors/player/player";
import { Loader } from "@Glibs/loader/loader";
import { EventTypes } from "@Glibs/types/globaltypes";
import { PlayerCtrl } from "@Glibs/actors/player/playerctrl";
import { Char } from "@Glibs/loader/assettypes";
import { Grid } from "@Glibs/ux/grid/grid";
import { SimpleGux } from "@Glibs/ux/gux";

export default class MenuState implements IGameMode {
    get Objects() { return this.objs }
    get TaskObj() { return this.taskObj }
    get Physics() { return this.phyObj }
    sysdlg = new SystemDialog()

    mdom: MenuGroup
    sdom: MenuGroup

    startDom: HTMLElement
    constructor(
        private eventCtrl: IEventController,
        private loader: Loader,
        private player: Player,
        private playerCtrl: PlayerCtrl,
        private scene: THREE.Scene,
        private camera: Camera,
        private objs: THREE.Object3D[] | THREE.Group[] | THREE.Mesh[] = [],
        private taskObj: ILoop[] = [],
        private phyObj: IPhysicsObject[] = [],
    ) {
        const iconDiv = document.createElement("div")
        const grid = new Grid()
        const icon = new MenuIcon({
            text: "New Game", boxWidth: "100px", color: IconsColor.Yellow, 
            icon: Icons.Star, boxEnable: true, lolli: true, click:() => {
                this.eventCtrl.SendEventMessage(EventTypes.GameCenter, "play")
            }
        })
        const openingIcon = new MenuIcon({
            text: "Tutorial", boxWidth: "100px", color: IconsColor.Yellow, 
            icon: Icons.Star, boxEnable: true, lolli: true, click:() => {
                this.eventCtrl.SendEventMessage(EventTypes.GameCenter, "tutorial")
            }
        })
        grid.AddChild(new SimpleGux({ dom: icon.dom, param: ["container", "w-100", "h-100", "rounded"] }))
        grid.AddChild(new SimpleGux({ dom: openingIcon.dom, param: ["container", "w-100", "h-100", "rounded"] }))
        grid.RenderHTML()

        iconDiv.style.position = "absolute"
        iconDiv.style.bottom = "15%"
        iconDiv.style.left = "50%"
        iconDiv.style.transform = "translate(-50%, -50%)"
        iconDiv.appendChild(grid.Dom)
        this.startDom = iconDiv
        
        this.mdom = new MenuGroup(document.body, { bottom: "0px", opacity: "0" })
        this.mdom.addMenu(new MenuIcon({ icon: Icons.Setting, color: IconsColor.Yellow, boxEnable: true, click: () => { this.sysdlg.show() } }))
        this.mdom.addMenu(new MenuIcon({ icon: Icons.BlueBook, color: IconsColor.Yellow, boxEnable: true, click: () => {  } }))

        this.sdom = new MenuGroup(document.body, { height: "45px", top: "-10px", opacity: "0" })
        this.sdom.addMenu(new StatusBar({ icon: Icons.Coin }))
        this.sdom.addMenu(new StatusBar({ icon: Icons.Lightning }))
    }
    tl: gsap.core.Timeline = gsap.timeline()
    async Init() {
        // this.eventCtrl.SendEventMessage(EventTypes.CtrlObj, this.player)
        this.camera.controls.enabled = false
        document.body.appendChild(this.startDom)
        this.sdom.Show()
        this.mdom.Show()

        const start = this.player.Pos.clone()
        start.addScalar(10)
        const look = this.player.Pos.clone()
        look.y += .5
        this.camera.lookAt(look)

        this.tl.to(this.camera.position, {
            x: start.x, y: start.y + 10, z: start.z, duration: 2, onUpdate: () => { this.camera.lookAt(this.player.Pos) }
        })
        .to(this.camera.position, {
            x: start.x + 20, y: start.y + 40, z: start.z - 30, duration: 10, onUpdate: () => { this.camera.lookAt(this.player.Pos) }
        })
        .to(this.camera.position, {
            x: start.x + 10, y: start.y + 10, z: start.z, duration: 10, onUpdate: () => { this.camera.lookAt(this.player.Pos) }
        })
    }
    Uninit(): void {
        this.tl.kill()
        this.mdom.Hide()
        this.sdom.Hide()
        document.body.removeChild(this.startDom)
    }
    Renderer(r: IPostPro, delta: number): void {
        r.render(delta)
    }
}