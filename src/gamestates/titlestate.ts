import * as THREE from "three";
import IEventController, { ILoop } from '@Glibs/interface/ievent';
import { IGameMode } from '@Glibs/systems/gamecenter/gamecenter'
import { IPostPro } from '@Glibs/systems/postprocess/postpro'
import { EventTypes } from '@Glibs/types/globaltypes';
import TapButton from "@Glibs/ux/buttons/tapbutton";
import { IPhysicsObject } from "@Glibs/interface/iobject";
import { ChromeEffect, DreamsOverlayEffect } from "@Glibs/ux/titlescreen/titleex";
import RetroTitleScreen from "@Glibs/ux/titlescreen/retrotitlescreen";

export default class TitleState implements IGameMode {
    get Objects() { return this.objs }
    get TaskObj() { return this.taskObj }
    get Physics() { return this.phyObj }
    titleScreen: RetroTitleScreen
    tap: TapButton
    constructor(
        private eventCtrl: IEventController,
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
    }
    Uninit(): void {
        this.tap.Hide()
    }
    Renderer(r: IPostPro, delta: number): void {
        r.render(delta)
    }
}