import { Monsters } from '@Glibs/actors/monsters/monsters'
import { Player } from '@Glibs/actors/player/player'
import { PlayerCtrl } from '@Glibs/actors/player/playerctrl'
import { Projectile } from '@Glibs/actors/projectile/projectile'
import { Helper } from '@Glibs/helper/helper'
import { Drops } from '@Glibs/inventory/drops'
import { InvenFactory } from '@Glibs/inventory/invenfactory'
import { Loader } from '@Glibs/loader/loader'
import Sounds from '@Glibs/magical/sounds/sounds'
import { Alarm } from '@Glibs/systems/alarm/alarm'
import { Camera } from '@Glibs/systems/camera/camera'
import { Canvas } from '@Glibs/systems/event/canvas'
import { EventController } from '@Glibs/systems/event/eventctrl'
import GameCenter from '@Glibs/systems/gamecenter/gamecenter'
import { Char } from '@Glibs/types/assettypes'
import { MonsterDb } from '@Glibs/types/monsterdb'
import WheelLoader from '@Glibs/ux/loading/loading'
import Spinning from '@Glibs/ux/loading/spinning'
import FontLoader from '@Glibs/ux/text/fontloader'
import Toast from '@Glibs/ux/toast/toast'
import OptPhysics from '@Glibs/world/physics/optphysic'
import * as THREE from 'three'
import PlayState from './gamestates/playstate'
import TitleState from './gamestates/titlestate'
import MenuState from './gamestates/menustate'
import { EventTypes } from '@Glibs/types/globaltypes'
import { Postpro } from '@Glibs/systems/postprocess/postpro'
import DefaultLights from '@Glibs/systems/lights/defaultlights'
import WorldMap from '@Glibs/world/worldmap/worldmap'
import { InitActionRegistry } from '@Glibs/actions/actionregisterinit'
import { FontType } from '@Glibs/types/fonttypes'
import { DebugDiv } from '@Glibs/systems/debugger/debugdiv'
import { Postpro2 } from '@Glibs/systems/postprocess/postpro2'
import { MapEntryType } from '@Glibs/types/worldmaptypes'
import { AudioManagerMulti } from '@Glibs/systems/sounds/audiomanager'
import Input from '@Glibs/systems/inputs/input'
import { ObjectPlacer, PlacedUV, PlacementInfo } from '@Glibs/world/worldmap/autoobjectplacer'
import CustomGround from '@Glibs/world/ground/customground'
import { Npc } from '@Glibs/actors/npc/npc'
import OpeningState from './gamestates/openingstate'
import { NpcCtrl } from '@Glibs/actors/npc/npcctrl'

export const DefaultPosition = new THREE.Vector3(20, -0.6, -145)

export class TwilightSurvivor {
    scene = new THREE.Scene()
    renderer = new THREE.WebGLRenderer({ antialias: true, })
    eventCtrl = new EventController()
    gamecenter = new GameCenter(this.eventCtrl, this.scene)

    font = new FontLoader()

    loading = new WheelLoader(this.eventCtrl)
    spinner = new Spinning(this.eventCtrl)

    helper = new Helper(this.scene, this.eventCtrl)
    loader = new Loader()
    canvas = new Canvas(this.eventCtrl)
    audioListener = new THREE.AudioListener()
    camera = new Camera(this.canvas, this.eventCtrl, this.renderer.domElement, undefined)
    sounds = new Sounds(this.audioListener, this.eventCtrl)
    audioMgr = new AudioManagerMulti(this.eventCtrl, this.camera)
    physics = new OptPhysics(this.scene, this.eventCtrl)
    alarm = new Alarm(this.eventCtrl)
    toast = new Toast(this.eventCtrl)
    debug = new DebugDiv(this.eventCtrl)
    pp = new Postpro2(this.scene, this.camera, this.renderer, this.eventCtrl)

    monDb = new MonsterDb()
    invenFab = new InvenFactory(this.loader, this.eventCtrl)
    player = new Player(this.loader, this.loader.GetAssets(Char.CharHumanMale), this.eventCtrl, this.scene, this.invenFab.inven, this.audioListener)
    playerCtrl = new PlayerCtrl(this.player, this.invenFab.inven, this.physics, this.camera, this.eventCtrl)
    monsters = new Monsters(this.loader, this.eventCtrl, this.scene, this.player, this.physics, this.monDb)
    projectile = new Projectile(this.eventCtrl, this.scene, this.playerCtrl.targets, this.monDb)
    drops = new Drops(this.loader, this.scene, this.eventCtrl, this.player)
    npc = new Npc(this.loader, this.loader.GetAssets(Char.UltimatePAPHeartHalf), this.eventCtrl, this.scene, this.invenFab)
    npcCtrl = new NpcCtrl(this.npc, this.invenFab.inven, this.physics, this.camera, this.eventCtrl, this.playerCtrl.IdleSt)

    light = new DefaultLights(this.scene)
    worldMap = new WorldMap(this.loader, this.scene, this.eventCtrl, this.light, this.camera, this.renderer)

    input = new Input(this.eventCtrl)

    constructor() {
        console.log('Twilight Survivor')
        InitActionRegistry(this.eventCtrl, this.scene)

        THREE.ColorManagement.enabled = true
        this.renderer.outputColorSpace = THREE.SRGBColorSpace
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = .8
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        const pixel = (window.devicePixelRatio >= 2) ? window.devicePixelRatio / 2 : window.devicePixelRatio
        const minPixel = Math.min(pixel, 1.5)
        this.renderer.setPixelRatio(minPixel);


        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            document.body.appendChild(this.renderer.domElement)

            const sky = this.worldMap.MakeSky(this.light)
            this.scene.add(sky)

            const fogColor = 0x87ceeb
            this.scene.fog = new THREE.FogExp2(fogColor, 0.0025);
            this.font.fontCss(FontType.Fredoka)
        })

        window.addEventListener('resize', this.resize.bind(this), false)
        // 전체 화면 진입/해제 이벤트 대응
        document.addEventListener("fullscreenchange", this.resize.bind(this));
        document.addEventListener("webkitfullscreenchange", this.resize.bind(this)); // iOS 대응

        this.resize()
    }
    async init() {
        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            const map = await this.worldMap.MakeMapObject()
            this.scene.add(map)
            const beach = await this.worldMap.MakeMapObject(MapEntryType.Beach, map)
            const blendedMap = this.worldMap.GetMapObject() as CustomGround
            const placer = new ObjectPlacer()
            const groundMesh = blendedMap.obj
            const dataTexture = blendedMap.blendMap
            let occupied: PlacedUV[] = []

            // Pass 1: 바위 배치 (흙 지역에만)
            const rockResult = placer.generate(groundMesh, dataTexture, {
                seed: 100,
                pattern: 'rock',
                density: 1.0,
                minRadius: 2.8,
                numKinds: 5,
                scaleMin: 0.7,
                scaleRange: 0.8,
                occupiedUVs: occupied, // 처음에는 빈 배열
            });
            occupied = rockResult.occupiedUVs; // 점유 공간 업데이트
            // console.log(rockResult.placements)
            this.autoMap(rockResult.placements, [1, 1], false, Char.QuaterniusNatureRockpathRoundSmall1, MapEntryType.InstancedVegetation)

            // Pass 2: 나무 배치 (식생 지역, 군집)
            const treeResult = placer.generate(groundMesh, dataTexture, {
                seed: 200,
                pattern: 'tree',
                density: 2.0,
                minRadius: 2.5,
                numKinds: 5,
                scaleMin: 0.9,
                scaleRange: 0.6,
                occupiedUVs: occupied, // 이전 단계의 점유 공간 전달
            });
            occupied = treeResult.occupiedUVs; // 점유 공간 다시 업데이트
            // console.log(treeResult.placements)
            const trees = this.autoMap(treeResult.placements, [1, 1], true, Char.QuaterniusNatureDeadtree1)
            this.eventCtrl.SendEventMessage(EventTypes.RegisterPhysic, trees, true)
            const pResult = placer.generate(groundMesh, dataTexture, {
                seed: 300,
                pattern: 'flower',
                density: 8.8,
                minRadius: 0.5,
                numKinds: 5,
                scaleMin: 0.8,
                scaleRange: 0.6,
                occupiedUVs: occupied,
            });
            occupied = pResult.occupiedUVs;
            // console.log(plantResult.placements)
            this.autoMap(pResult.placements, [1, 3], true, Char.QuaterniusNatureGrassCommonShort)

            // pass Edge
            const pEdgeResult = placer.generate(groundMesh, dataTexture, {
                seed: 500,
                pattern: 'edge',
                density: 5.8,
                minRadius: 0.5,
                numKinds: 3,
                scaleMin: 4,
                scaleRange: 8,
                occupiedUVs: occupied,
            });
            occupied = pEdgeResult.occupiedUVs;
            // console.log(plantResult.placements)
            const treesEdge = this.autoMap(pEdgeResult.placements, [1, 3], true, Char.QuaterniusNatureRockMedium1)

            // Pass 3: 식물 배치 (식생 지역, 군집)
            const plantResult = placer.generate(groundMesh, dataTexture, {
                seed: 300,
                pattern: 'flower',
                density: 8.8,
                minRadius: 0.5,
                numKinds: 5,
                scaleMin: 0.8,
                scaleRange: 0.6,
                occupiedUVs: occupied,
            });
            occupied = plantResult.occupiedUVs;
            // console.log(plantResult.placements)
            this.autoMap(plantResult.placements, [8, 16], true)
        })

        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            await this.GltfLoad()
        })

        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            await this.InitScene()
        })
        // DOM이 완전히 로드된 후 스크립트 실행
        window.addEventListener('DOMContentLoaded', () => {
            // 실제 애플리케이션에서는 이 부분에 수행해야 할 함수들을 등록합니다.
            this.loading.startProcessing(1); // 각 작업 사이에 300ms 지연
        });
    }
    autoMap(objs: PlacementInfo[], countRange?: number[], wind: boolean = true, startCharId?: Char, maptype = MapEntryType.WindyInstancedVegetation) {
        const res = new THREE.Group()
        const f = objs.reduce((acc, current) => {
            const key = current.kind
            if (!acc[key]) acc[key] = []
            acc[key].push(current)
            return acc
        }, {} as Record<number, PlacementInfo[]>)
        Object.values(f).forEach(async (objs) => {
            const charId = (startCharId) ? startCharId + objs[0].kind : undefined
            const mesh = await this.worldMap.MakeMapObject(maptype,
                {
                    transforms: objs, id: charId, config: {
                        cluster: {
                            enabled: true,
                            countRange: countRange,
                            radius: 1.0,
                            distribution: "uniform",
                            posJitterY: [0, 0.03],
                            rotJitterYDeg: 20,
                            scaleJitter: [0.9, 1.18],
                        }
                    }
                })
            res.add(mesh)
        })
        this.scene.add(res)
        return res
    }
    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.resize(window.innerWidth, window.innerHeight)
        this.camera.updateProjectionMatrix()
        this.pp.resize()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        const pixel = (window.devicePixelRatio >= 2) ? window.devicePixelRatio / 2 : window.devicePixelRatio
        const minPixel = Math.min(pixel, 1.5)
        this.renderer.setPixelRatio(minPixel);
        this.render()
    }
    async GltfLoad() {
        const ret = await Promise.all([
            await this.player.Loader(this.loader.GetAssets(Char.CharHumanFemale), new THREE.Vector3(0, 0, 0), "dog"),
            await this.npc.Loader(this.loader.GetAssets(Char.UltimatePAPHeartHalf), new THREE.Vector3(0, 0, 0), "baby"),
        ]).then(() => {
            this.player.Visible = true
            this.physics.addPlayer(this.player)
        })
        return ret
    }
    async InitScene() {
        const stormRain = await this.worldMap.MakeMapObject(MapEntryType.Rain, {})
        stormRain.Mesh.position.set(0, 0, -100)
        const defaultPos = DefaultPosition.clone()
        defaultPos.x += 10
        defaultPos.y = 0
        defaultPos.z += 10

        const campfire = await this.worldMap.MakeMapObject(MapEntryType.Interactive, { type: Char.None, position: defaultPos, boxType: "campfire" })

        this.gamecenter.RegisterGameMode("titlemode",
            new TitleState(this.eventCtrl, this.camera, this.player, this.playerCtrl,
                [], [stormRain], [this.player,]))
        this.gamecenter.RegisterGameMode("menumode",
            new MenuState(this.eventCtrl, this.loader, this.player, this.playerCtrl,
                this.scene, this.camera, [], [stormRain, campfire], [this.player,]))
        this.gamecenter.RegisterGameMode("opening",
            new OpeningState(this.eventCtrl, this.camera, this.player, this.npc, [], 
                [stormRain, campfire], [this.player, this.npc]))
        this.gamecenter.RegisterGameMode("play",
            new PlayState(this.eventCtrl, this.camera, this.player, this.npc, [], 
                [stormRain, campfire], [this.player, this.npc]))

        this.eventCtrl.SendEventMessage(EventTypes.GameCenter, "titlemode")
    }

    clock = new THREE.Clock()
    animate() {
        window.requestAnimationFrame(() => {
            this.render()
            this.animate()
        })
    }
    accTime = 0
    render() {
        const time = this.clock.getDelta()
        const delta = (time > 1) ? 1 : time
        this.accTime += delta

        this.gamecenter.Renderer(this.pp, delta)
        this.physics.update()
        this.canvas.update()
    }
}

const app = new TwilightSurvivor()
app.init()
app.animate()