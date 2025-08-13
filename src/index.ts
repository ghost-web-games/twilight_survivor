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
import { SkyBoxAllTime } from '@Glibs/world/sky/skyboxalltime'
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
    physics = new OptPhysics(this.scene, this.eventCtrl)
    alarm = new Alarm(this.eventCtrl)
    toast = new Toast(this.eventCtrl)
    debug = new DebugDiv(this.eventCtrl)
    pp = new Postpro(this.scene, this.camera, this.renderer, this.eventCtrl)

    monDb = new MonsterDb()
    invenFab = new InvenFactory(this.loader, this.eventCtrl)
    player = new Player(this.loader, this.loader.GetAssets(Char.CharHumanMale), this.eventCtrl, this.scene, this.invenFab.inven, this.audioListener)
    playerCtrl = new PlayerCtrl(this.player, this.invenFab.inven, this.physics, this.camera, this.eventCtrl)
    monsters = new Monsters(this.loader, this.eventCtrl, this.scene, this.player, this.physics, this.monDb)
    projectile = new Projectile(this.eventCtrl, this.scene, this.playerCtrl.targets, this.monDb)
    drops = new Drops(this.loader, this.scene, this.eventCtrl, this.player)

    light = new DefaultLights(this.scene)
    worldMap = new WorldMap(this.loader, this.scene, this.eventCtrl, this.light)

    sky: SkyBoxAllTime
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
        document.body.appendChild(this.renderer.domElement)

        this.eventCtrl.SendEventMessage(EventTypes.LoadingProgress, 10)

        this.sky = this.worldMap.MakeSky(this.light)
        this.scene.add(this.sky)

        this.worldMap.MakeMapObject().then((map) => {
            this.scene.add(map)
        })
        this.InitScene()
        this.eventCtrl.SendEventMessage(EventTypes.LoadingProgress, 70)
        const fogColor = 0x87ceeb
        this.scene.fog = new THREE.FogExp2(fogColor, 0.0025);

        this.font.fontCss(FontType.Fredoka)

        window.addEventListener('resize', this.resize.bind(this), false)
        // 전체 화면 진입/해제 이벤트 대응
        document.addEventListener("fullscreenchange", this.resize.bind(this));
        document.addEventListener("webkitfullscreenchange", this.resize.bind(this)); // iOS 대응

        this.eventCtrl.SendEventMessage(EventTypes.LoadingProgress, 100)
        this.resize()
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
    async InitScene() {
        this.gamecenter.RegisterGameMode("play",
            new PlayState(this.eventCtrl, [], [], [this.player,]))
        this.gamecenter.RegisterGameMode("titlemode",
            new TitleState(this.eventCtrl, [], [], [this.player,]))
        this.gamecenter.RegisterGameMode("menumode",
            new MenuState(this.eventCtrl, this.loader, this.player, this.playerCtrl,
                this.scene, this.camera, [], [], [this.player,

            ]))
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
app.animate()