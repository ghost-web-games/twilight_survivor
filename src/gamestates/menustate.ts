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

export default class MenuState implements IGameMode {
    get Objects() { return this.objs }
    get TaskObj() { return this.taskObj }
    get Physics() { return this.phyObj }
    sysdlg = new SystemDialog()

    mdom: MenuGroup
    cdom: MenuGroup
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
        const icon = new MenuIcon({
            text: "Tranining", boxWidth: "100px", color: IconsColor.Yellow, 
            icon: Icons.Star, boxEnable: true, lolli: true, click:() => {
                this.eventCtrl.SendEventMessage(EventTypes.GameCenter, "training")
            }
        })
        iconDiv.style.position = "absolute"
        iconDiv.style.bottom = "15%"
        iconDiv.style.left = "50%"
        iconDiv.style.transform = "translate(-50%, -50%)"
        iconDiv.appendChild(icon.dom)
        this.startDom = iconDiv

        this.cdom = new MenuGroup(document.body, { top: "10%", left: "0px", opacity: "0.5", vertical: true })
        this.cdom.addMenu(new MenuIcon({ icon: Icons.Dog, color: IconsColor.Transperant, click: () => { this.changeDog() } }))
        this.cdom.addMenu(new MenuIcon({ icon: Icons.Cat, color: IconsColor.Transperant, click: () => { this.changeCat() } }))

        this.mdom = new MenuGroup(document.body, { bottom: "0px", opacity: "0" })
        this.mdom.addMenu(new MenuIcon({ icon: Icons.Setting, color: IconsColor.Yellow, boxEnable: true, click: () => { this.sysdlg.show() } }))
        this.mdom.addMenu(new MenuIcon({ icon: Icons.BlueBook, color: IconsColor.Yellow, boxEnable: true, click: () => {  } }))

        this.sdom = new MenuGroup(document.body, { height: "45px", top: "-10px", opacity: "0" })
        this.sdom.addMenu(new StatusBar({ icon: Icons.Coin }))
        this.sdom.addMenu(new StatusBar({ icon: Icons.Lightning }))
    }
    async changeDog() {
        this.scene.remove(this.player.Meshs)
        await this.player.Loader(this.loader.GetAssets(Char.CharAniDog), new THREE.Vector3(0, 1, 0), "dog")
        this.eventCtrl.SendEventMessage(EventTypes.SetNonGlow, this.player.Meshs)
        this.player.Visible = true
        this.scene.add(this.player.Meshs)
    }
    async changeCat() {
        this.scene.remove(this.player.Meshs)
        await this.player.Loader(this.loader.GetAssets(Char.CharAniCat), new THREE.Vector3(0, 1, 0), "cat")
        this.eventCtrl.SendEventMessage(EventTypes.SetNonGlow, this.player.Meshs)
        this.player.Visible = true
        this.scene.add(this.player.Meshs)
    }
    async Init() {
        //this.camera.controls.enabled = false
        this.camera.controls.enabled = true
        this.camera.lookTarget = false
        this.player.Pos.set(0, 0, 0)
        this.playerCtrl.reset()

        document.body.appendChild(this.startDom)
        this.cdom.Show()
        this.mdom.Show()
        this.sdom.Show()

        const start = this.player.Pos.clone()
        start.addScalar(4)
        const look = this.player.Pos.clone()
        look.y += .5
        gsap.to(this.camera.position, {
            x: start.x, y: start.y - 1.5, z: start.z, duration: 1, onUpdate: () => {
                this.camera.lookAt(look)
            }, onComplete: () => {
                console.log(look)
            }
        })
    }
    Uninit(): void {
        this.cdom.Hide()
        this.mdom.Hide()
        this.sdom.Hide()
        document.body.removeChild(this.startDom)

        this.camera.controls.enabled = true
        this.camera.lookTarget = true
    }
    Renderer(r: IPostPro, delta: number): void {
        r.render(delta)
    }
}