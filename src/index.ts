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
import TutorialState from './gamestates/tutorialstate'
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
import { Npc } from '@Glibs/actors/npc/npc'
import { NpcCtrl } from '@Glibs/actors/npc/npcctrl'
import { DialogueManager } from '@Glibs/systems/alarm/dialoguemgr'
import { QuestManager } from '@Glibs/systems/quests/questmgr'
import { newQuestDefs } from './localquests/questdata'
import { LocalQuestManager } from './localquests/localquestmgr'
import MapFactory from './gamefab/mapfactory'
import ProgressBarHtml from '@Glibs/ux/progress/progressbarhtml'
import CampfireCtrl from './gameobjects/campfirectrl'
import DayNightRig from '@Glibs/world/sky/daynightrig'
import { GlobalEffector } from '@Glibs/magical/effects/globaleffector'
import PlayState from './gamestates/playstate'
import LoadingMgr from '@Glibs/ux/loading/loadingmgr'
import { SimpleCircleProgressBar } from '@Glibs/ux/progress/simplecirclebar'
import LoadingDialog from './dialogs/loadingdlg'
import DayState from './gamestates/daystate'
import DebugDialog from './dialogs/debugdlg'
import DialogFactory from './gamefab/dialogfab'
import HudFactory from './gamefab/hudfactory'
import LocalStatusCtrl from './gameobjects/statusctrl'

export const DefaultPosition = new THREE.Vector3(20, -0.6, -145)
export const CampfierPos = new THREE.Vector3(20 + 10, 0, -145 + 40)

export class TwilightSurvivor {
    scene = new THREE.Scene()
    renderer = new THREE.WebGLRenderer({ antialias: true, })
    eventCtrl = new EventController()
    gamecenter = new GameCenter(this.eventCtrl, this.scene)

    font = new FontLoader()

    loading = new WheelLoader(this.eventCtrl, { fullscreen: true, soundWarning: true, needToTap: true })
    spinner = new Spinning(this.eventCtrl)
    progrss = new ProgressBarHtml(this.eventCtrl)

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

    gEffect = new GlobalEffector(this.eventCtrl, this.scene, this.camera)
    monDb = new MonsterDb()
    invenFab = new InvenFactory(this.loader, this.eventCtrl)
    player = new Player(this.loader, this.loader.GetAssets(Char.CharHumanMale), this.eventCtrl, this.scene, this.invenFab.inven, this.audioListener)
    playerCtrl = new PlayerCtrl(this.player, this.invenFab.inven, this.physics, this.camera, this.eventCtrl)
    monsters = new Monsters(this.loader, this.eventCtrl, this.scene, this.player, this.physics, this.monDb, { nameView: false })
    projectile = new Projectile(this.eventCtrl, this.scene, this.playerCtrl.targets, this.monDb)
    drops = new Drops(this.loader, this.scene, this.eventCtrl, this.player)
    npc = new Npc(this.loader, this.loader.GetAssets(Char.UltimatePAPHeartHalf), this.eventCtrl, this.scene, this.invenFab)
    npcCtrl = new NpcCtrl(this.npc, this.invenFab.inven, this.physics, this.camera, this.eventCtrl, this.playerCtrl.IdleSt)

    light = new DefaultLights(this.scene, this.eventCtrl)
    worldMap = new WorldMap(this.loader, this.scene, this.eventCtrl, this.light, this.camera, this.renderer)
    mapFab = new MapFactory(this.eventCtrl, this.worldMap, this.scene, this.player)

    dialogue = new DialogueManager(this.eventCtrl)
    input = new Input(this.eventCtrl)
    quest = new QuestManager(this.eventCtrl, newQuestDefs)
    localQuest  = new LocalQuestManager(this.eventCtrl, this.quest)
    

    campctrl = new CampfireCtrl(this.eventCtrl, this.invenFab.inven, this.player, CampfierPos)

    fog = new THREE.FogExp2(0x87ceeb, 0.0025 * 5);

    loadMgr = new LoadingMgr(this.eventCtrl, new SimpleCircleProgressBar({ preset: 'Rainbow' }))
    loadDlg = new LoadingDialog(this.eventCtrl, this.loadMgr, this.mapFab)

    debugDlg = new DebugDialog(this.eventCtrl, this.loadDlg)
    dialogFab = new DialogFactory(this.eventCtrl, this.loader, this.invenFab, this.player, this.quest, this.renderer.domElement, this.renderer.domElement.parentElement || document.body)
    hudFab = new HudFactory(this.eventCtrl, this.playerCtrl)

    localStatus = new LocalStatusCtrl(this.eventCtrl, this.playerCtrl, this.dialogFab)

    constructor() {
        console.log('Twilight Survivor')
        InitActionRegistry(this.eventCtrl, this.scene, this.camera)

        THREE.ColorManagement.enabled = true;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ReinhardToneMapping; // Exposure가 실제로 적용됨
        this.renderer.toneMappingExposure = 2.5;              // 1.7~2.2 사이에서 취향 미세조정

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const pixel = (window.devicePixelRatio >= 2) ? window.devicePixelRatio / 2 : window.devicePixelRatio;
        this.renderer.setPixelRatio(Math.min(pixel, 1.0));

        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            document.body.appendChild(this.renderer.domElement)

            const sky = this.worldMap.MakeSky(this.light)
            this.scene.add(sky)
            new DayNightRig(this.eventCtrl, sky, this.light, this.renderer, { auto: false })

            this.scene.fog = this.fog
            this.font.fontCss(FontType.Fredoka)
        })

        window.addEventListener('resize', this.resize.bind(this), false)
        // 전체 화면 진입/해제 이벤트 대응
        document.addEventListener("fullscreenchange", this.resize.bind(this));
        document.addEventListener("webkitfullscreenchange", this.resize.bind(this)); // iOS 대응

        this.resize()
    }
    async init() {
        await this.mapFab.MakeMap()

        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            await this.GltfLoad()
        })

        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            await this.InitScene()
        })
        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingCompleteItem, async () => {
            this.eventCtrl.SendEventMessage(EventTypes.GameCenter, "titlemode")
        })
        // DOM이 완전히 로드된 후 스크립트 실행
        window.addEventListener('DOMContentLoaded', () => {
            // 실제 애플리케이션에서는 이 부분에 수행해야 할 함수들을 등록합니다.
            this.loading.startProcessing(1); // 각 작업 사이에 300ms 지연
        });
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

        this.gamecenter.RegisterGameMode("titlemode",
            new TitleState(this.eventCtrl, this.camera, this.player, this.playerCtrl,
                [], [stormRain], [this.player,]))
        this.gamecenter.RegisterGameMode("menumode",
            new MenuState(this.eventCtrl, this.loader, this.player, this.playerCtrl,
                this.debugDlg, this.scene, this.camera, [], [stormRain], [this.player,]))
        this.gamecenter.RegisterGameMode("play",
            new PlayState(this.eventCtrl, this.camera, this.dialogue, this.player,this.monsters,
                this.quest, this.dialogFab, this.loadDlg,
                this.campctrl, stormRain, [], [], [this.player, this.npc]))
        this.gamecenter.RegisterGameMode("dayplay",
            new DayState(this.eventCtrl, this.camera, this.dialogue, this.player, this.playerCtrl, this.monsters,
                this.fog, this.quest, this.dialogFab, this.loadDlg,
                this.campctrl, [], [], [this.player, this.npc]))
        this.gamecenter.RegisterGameMode("tutorial",
            new TutorialState(this.eventCtrl, this.camera, this.dialogue, this.player, 
                this.playerCtrl, this.monsters,
                this.quest, this.dialogFab, this.loadDlg,
                this.campctrl, stormRain, [], [], [this.player, this.npc]))
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
        this.debug.defaultFps()
        const time = this.clock.getDelta()
        const delta = Math.min(1, time)
        this.accTime += delta

        this.gamecenter.Renderer(this.pp, delta)
        this.physics.update()
        this.canvas.update()
    }
}

const app = new TwilightSurvivor()
app.init()
app.animate()

function dbgPath(e: PointerEvent) {
  const path = (e.composedPath?.() ?? []) as EventTarget[];
  const els = path.filter((t): t is Element => t instanceof Element);
  console.group('pointer path');
  for (const el of els) {
    const cs = getComputedStyle(el);
    console.log(el.tagName.toLowerCase(), el.id ? `#${el.id}` : '',
                [...el.classList].map(c => '.'+c).join(''),
                { cursor: cs.cursor, pointerEvents: cs.pointerEvents });
  }
  console.groupEnd();
}
window.addEventListener('pointerdown', dbgPath);
