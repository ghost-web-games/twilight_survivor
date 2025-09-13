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

export default class OpeningState implements IGameMode {
    get Objects() { return this.objs }
    get TaskObj() { return this.taskObj }
    get Physics() { return this.phyObj }
    constructor(
        private eventCtrl: IEventController,
        private camera: Camera,
        private player: Player,
        private npc: Npc,
        private objs: THREE.Object3D[] | THREE.Group[] | THREE.Mesh[] = [],
        private taskObj: ILoop[] = [],
        private phyObj: IPhysicsObject[] = [],
    ) { 

    }
    async Init() {
        this.npc.Visible = true
        this.npc.Pos.copy(DefaultPosition)
        this.npc.Pos.x += 10
    }
    Uninit(): void {
    }
    Renderer(r: IPostPro, delta: number): void {
       r.render(delta)
    }
}