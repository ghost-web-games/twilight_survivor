import * as THREE from 'three'
import IEventController from "@Glibs/interface/ievent";
import { EventTypes } from "@Glibs/types/globaltypes";
import { MapEntryType } from "@Glibs/types/worldmaptypes";
import CustomGround from "@Glibs/world/ground/customground";
import { ObjectPlacer, PlacedUV, PlacementInfo } from "@Glibs/world/worldmap/autoobjectplacer";
import WorldMap from "@Glibs/world/worldmap/worldmap";
import { Char } from '@Glibs/types/assettypes';
import { CampfierPos } from './index';
import { Player } from '@Glibs/actors/player/player';
import { WindyInstancedVegetation } from '@Glibs/world/fluffynature/massfluffy';
import { SimpleCircleProgressBar } from '@Glibs/ux/progress/simplecirclebar';
import TapButton from '@Glibs/ux/buttons/tapbutton';

export default class MapFactory {
    placer = new ObjectPlacer()
    stableResource = new THREE.Group()
    darkResource = new THREE.Group()
    lightResource = new THREE.Group()

    flower?: THREE.Group
    darktrees?: THREE.Group
    tree?: THREE.Group
    grass?: THREE.Group
    defaultGrass?: THREE.Group
    edge?: THREE.Group
    groundMesh?: THREE.Mesh
    dataTexture?: THREE.DataTexture

    darkLoaded = false
    lightLoaded = false

    constructor(
        private eventCtrl: IEventController,
        private worldMap: WorldMap,
        private scene: THREE.Scene,
        private player: Player
    ) { 
    }
    NightLoad() {
        if (this.lightLoaded) {
            this.eventCtrl.SendEventMessage(EventTypes.RegLoadingCommonItems, async () => {
                this.scene.remove(this.lightResource)
                this.scene.add(this.darkResource)
            })
            return
        }
    }
    DayLoad() {
        if (this.lightLoaded) {
            this.eventCtrl.SendEventMessage(EventTypes.RegLoadingCommonItems, async () => {
                this.scene.remove(this.darkResource)
                this.scene.add(this.lightResource)
            })
            return
        }
        let occupied: PlacedUV[] = []
        this.eventCtrl.SendEventMessage(EventTypes.RegLoadingCommonItems, async () => {
            const treeResult = this.placer.generate(this.groundMesh!, this.dataTexture, {
                seed: 200,
                pattern: 'tree',
                density: 9.0,
                minRadius: 2.5,
                numKinds: 5,
                scaleMin: 3,
                scaleRange: 1,
                occupiedUVs: occupied, // 이전 단계의 점유 공간 전달
            });
            occupied.push(...treeResult.occupiedUVs); // 점유 공간 다시 업데이트
            // console.log(treeResult.placements)
            this.tree = this.autoMap(treeResult.placements, { countRange: [1, 1], far: 140 }, Char.QuaterniusNatureCommontree1)
            this.lightResource.add(this.tree)
        })
        this.eventCtrl.SendEventMessage(EventTypes.RegLoadingCommonItems, async () => {
            const pResult = this.placer.generate(this.groundMesh!, this.dataTexture, {
                seed: 301,
                pattern: 'flower',
                density: 1.0,
                minRadius: 0.5,
                numKinds: 4,
                scaleMin: 0.8,
                scaleRange: 0.6,
                occupiedUVs: occupied,
            });
            occupied.push(...pResult.occupiedUVs);
            // console.log(plantResult.placements)
            this.flower = this.autoMap(pResult.placements, { countRange: [1, 1] }, Char.QuaterniusNatureFlower3Group)
            this.lightResource.add(this.flower)
        })
        this.eventCtrl.SendEventMessage(EventTypes.RegLoadingCommonItems, async () => {
            this.lightLoaded = true
            this.scene.remove(this.darkResource)
            this.scene.add(this.lightResource)
        })
    }
    async MakeMap() {
        const map = await this.worldMap.MakeMapObject()
        this.scene.add(map)
        await this.worldMap.MakeMapObject(MapEntryType.Beach, map)

        const blendedMap = this.worldMap.GetMapObject() as CustomGround
        this.groundMesh = blendedMap.obj
        this.dataTexture = blendedMap.blendMap
        let occupied: PlacedUV[] = []
        this.scene.add(this.darkResource, this.stableResource)

        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            await this.makeInteractive(blendedMap)
        })

        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            // Pass 2: 나무 배치 (식생 지역, 군집)
            const treeResult = this.placer.generate(this.groundMesh!, this.dataTexture, {
                seed: 200,
                pattern: 'tree',
                density: 2.0,
                minRadius: 2.5,
                numKinds: 5,
                scaleMin: 0.9,
                scaleRange: 0.2,
                occupiedUVs: occupied, // 이전 단계의 점유 공간 전달
            });
            occupied.push(...treeResult.occupiedUVs); // 점유 공간 다시 업데이트
            // console.log(treeResult.placements)
            this.darktrees = this.autoMap(treeResult.placements, { countRange: [1, 1], far: 120 }, Char.QuaterniusNatureDeadtree1)
            this.darkResource.add(this.darktrees)
        })
        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            const pResult = this.placer.generate(this.groundMesh!, this.dataTexture, {
                seed: 300,
                pattern: 'flower',
                density: 8.8,
                minRadius: 0.5,
                numKinds: 5,
                scaleMin: 0.8,
                scaleRange: 0.6,
                occupiedUVs: occupied,
            });
            occupied.push(...pResult.occupiedUVs);
            // console.log(plantResult.placements)
            this.grass = this.autoMap(pResult.placements, { countRange: [1, 3] }, Char.QuaterniusNatureGrassCommonShort)
            this.stableResource.add(this.grass)
        })
        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            // pass Edge
            const pEdgeResult = this.placer.generate(this.groundMesh!, this.dataTexture, {
                seed: 500,
                pattern: 'edge',
                density: 5.8,
                minRadius: 0.5,
                numKinds: 3,
                scaleMin: 4,
                scaleRange: 8,
                occupiedUVs: occupied,
            });
            occupied.push(...pEdgeResult.occupiedUVs);
            // console.log(plantResult.placements)
            this.edge = this.autoMap(pEdgeResult.placements, { countRange: [1, 3], 
                lodEnabled: false, cullingEnable: false, windEnabled: false  }, Char.QuaterniusNatureRockMedium1)
            this.stableResource.add(this.edge)

        })
        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            // Pass 3: 식물 배치 (식생 지역, 군집)
            const plantResult = this.placer.generate(this.groundMesh!, this.dataTexture, {
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
            this.defaultGrass = this.autoMap(plantResult.placements, { countRange: [8, 16], far: 100 })
            this.stableResource.add(this.defaultGrass)
            this.darkLoaded = true
        })
    }
    async makeInteractive(map: CustomGround) {
        const groundMesh = map.obj
        const dataTexture = map.blendMap
        await this.worldMap.MakeMapObject(MapEntryType.Interactive, { type: Char.None, position: CampfierPos, boxType: "campfire" })
        const uv = this.getUvOnPlane(CampfierPos, map.obj)
        if (uv) map.Click(uv)

        const ret = this.placer.generate(groundMesh, dataTexture, {
            seed: 500,
            pattern: 'tree',
            density: 1,
            minRadius: 100,
            numKinds: 5,
            scaleMin: 1,
            scaleRange: 1.5,
        });
        const startCharId = Char.QuaterniusNatureCommontree1
        const f = ret.placements.reduce((acc, current) => {
            const key = current.kind
            if (!acc[key]) acc[key] = []
            acc[key].push(current)
            return acc
        }, {} as Record<number, PlacementInfo[]>)
        Object.values(f).forEach(async (objs) => {
            const charId = (startCharId) ? startCharId + objs[0].kind : undefined
            objs.forEach(async (obj) => {
                const uv = this.getUvOnPlane(obj.position, map.obj)
                if (uv) map.Click(uv)
                await this.worldMap.MakeMapObject(MapEntryType.Interactive, { 
                    type: charId, position: obj.position, rotation: obj.rotation, scale: obj.scale,
                    boxType: "tree" 
                })
            })
        })
        return ret.occupiedUVs
    }
    autoMap(objs: PlacementInfo[], {
        lodEnabled = true, near = 20, far = 50, minDensity = 0.0005, windEnabled = true ,
        cullingEnable = true, countRange = [1, 3], compactionEnabled = true, type = MapEntryType.WindyInstancedVegetation
    } = {}, startCharId?: Char, 
    ) {
        const res = new THREE.Group()
        const f = objs.reduce((acc, current) => {
            const key = current.kind
            if (!acc[key]) acc[key] = []
            acc[key].push(current)
            return acc
        }, {} as Record<number, PlacementInfo[]>)
        Object.values(f).forEach(async (objs) => {
            const charId = (startCharId) ? startCharId + objs[0].kind : undefined
            const mesh = await this.worldMap.MakeMapObject(type,
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
                        },
                        lod: {
                            enabled: lodEnabled, near, far, minDensity,
                        },
                        culling: {
                            enable: cullingEnable,
                        },
                        hardMode: {
                            compactionEnabled
                        },
                        windEnabled
                    }
                })
            res.add(mesh)
            if(type == MapEntryType.WindyInstancedVegetation) {
                const obj = this.worldMap.GetMapObject(type) as WindyInstancedVegetation
                obj.SetFocusTarget(this.player.Meshs)
            }
        })
        return res
    }
    /**
 * 월드 좌표에서 수직으로 레이를 발사하여 평면 메쉬와의 교차점 UV를 찾습니다.
 * @param {THREE.Vector3} worldPoint - 레이를 발사할 시작 월드 좌표
 * @param {THREE.Mesh} planeMesh - 교차를 확인할 대상 평면 메쉬 (수평으로 놓여있다고 가정)
 * @returns {THREE.Vector2 | null} 계산된 UV 좌표. 교차점이 없으면 null을 반환합니다.
 */
    getUvOnPlane(worldPoint: THREE.Vector3, planeMesh: THREE.Mesh) {
        const temp = worldPoint.clone()
        temp.y = 10
        // 1. Raycaster 설정
        const raycaster = new THREE.Raycaster();
        const rayDirection = new THREE.Vector3(0, -1, 0); // 수직 아래 방향
        raycaster.set(temp, rayDirection);

        // 2. 교차점 계산
        const intersects = raycaster.intersectObject(planeMesh);

        // 3. 교차점이 있는 경우 UV 좌표 계산
        if (intersects.length > 0) {
            // 가장 가까운 교차점 정보를 가져옵니다.
            const hitPoint = intersects[0].point; // 교차점의 월드 좌표
            return intersects[0].uv;
        }

        // 4. 교차점이 없는 경우 null 반환
        return null;
    }
}