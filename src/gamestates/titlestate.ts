import * as THREE from "three";
import IEventController, { ILoop } from '@Glibs/interface/ievent';
import { IGameMode } from '@Glibs/systems/gamecenter/gamecenter'
import { IPostPro } from '@Glibs/systems/postprocess/postpro'
import { EventTypes } from '@Glibs/types/globaltypes';
import TapButton from "@Glibs/ux/buttons/tapbutton";
import { IPhysicsObject } from "@Glibs/interface/iobject";
import { ChromeEffect, DreamsOverlayEffect } from "@Glibs/ux/titlescreen/titleex";
import RetroTitleScreen from "@Glibs/ux/titlescreen/retrotitlescreen";
import { Player } from "@Glibs/actors/player/player";
import { PlayerCtrl } from "@Glibs/actors/player/playerctrl";
import gsap from "gsap";
import { buffDefs } from "@Glibs/magical/buff/buffdefs";
import { Buff } from "@Glibs/magical/buff/buff";
import { SoundType } from "@Glibs/types/soundtypes";

export default class TitleState implements IGameMode {
    get Objects() { return this.objs }
    get TaskObj() { return this.taskObj }
    get Physics() { return this.phyObj }
    titleScreen: RetroTitleScreen
    tap: TapButton
    constructor(
        private eventCtrl: IEventController,
        private camera: THREE.Camera,
        private player: Player,
        private playerCtrl: PlayerCtrl,
        private objs: THREE.Object3D[] | THREE.Group[] | THREE.Mesh[] = [],
        private taskObj: ILoop[] = [],
        private phyObj: IPhysicsObject[] = [],
    ) {

        this.titleScreen = new RetroTitleScreen({
            title: "Survivor",
            googleFont: "Titillium+Web:900",
            widthPercent: 50,           // 화면 가로 60%에 맞춤
            heightPercent: 100,          // 화면 세로 60%에 맞춤
            widthPercentBasis: "parent",     // 기준: 뷰포트
            heightPercentBasis: "parent",   
            effects: [
                new ChromeEffect(),
                new DreamsOverlayEffect("Twilight", { left: 0, top: -1.8 }, 0.3),
            ],
            appearOnFirstFit: { enable: false }, // 원하면 off
            appearOnEnterViewport: {
                enable: true, threshold: 0.1, rootMargin: "0px",
                durationMs: 400, target: "container"
            }
        });
        this.titleScreen.RenderHTML()
        // 교체 예시
        // title.setTitle("PRESS START");
        // title.setEffects([new VictoryEffect(180)]);

        this.tap = new TapButton(document.body, {
            opacity: "0",
            click: () => {
                this.titleScreen.Dispose()
                this.eventCtrl.SendEventMessage(EventTypes.GameCenter, "menumode")
            }
        })
        this.tap.AddChild(this.titleScreen)
    }
    async Init() {
        this.tap.Show()
        this.titleScreen.activate();

        this.player.Pos.set(0, 0, 0)
        this.playerCtrl.reset()
        this.playerCtrl.init()
        this.playerCtrl.changeState(this.playerCtrl.SleepingIdleSt)

        const start = this.player.Pos.clone()
        start.addScalar(10)
        const look = this.player.Pos.clone()
        look.y += .5
        gsap.to(this.camera.position, {
            x: start.x, y: start.y + 5, z: start.z, duration: 2, onUpdate: () => {
                this.camera.lookAt(look)
        /**
         * Complete callback for camera animation. Logs the final look-at position.
         */
            }, onComplete: () => {
                console.log(look)
            }
        })
        this.eventCtrl.SendEventMessage(EventTypes.UpdateBuff, new Buff(buffDefs.DarkSide))
        this.eventCtrl.SendEventMessage(EventTypes.PlayBGM, "whisper", SoundType.WhispersOfEldertree, { loop: true })
    }
    Uninit(): void {
        this.tap.Hide()
    }
    Renderer(r: IPostPro, delta: number): void {
        r.render(delta)
    }
}