import * as THREE from 'three'
import IEventController from "@Glibs/interface/ievent";
import { EventTypes } from "@Glibs/types/globaltypes";
import { MapEntryType } from "@Glibs/types/worldmaptypes";
import CustomGround from "@Glibs/world/ground/customground";
import { ObjectPlacer, PlacedUV, PlacementInfo } from "@Glibs/world/worldmap/autoobjectplacer";
import WorldMap from "@Glibs/world/worldmap/worldmap";
import { Char } from '@Glibs/types/assettypes';
import { CampfierPos, DefaultPosition } from './index';

export default class MapFactory {
    placer = new ObjectPlacer()
    constructor(
        private eventCtrl: IEventController,
        private worldMap: WorldMap,
        private scene: THREE.Scene,
    ) { }
    async MakeMap() {
        const map = await this.worldMap.MakeMapObject()
        this.scene.add(map)
        await this.worldMap.MakeMapObject(MapEntryType.Beach, map)

        const blendedMap = this.worldMap.GetMapObject() as CustomGround
        const groundMesh = blendedMap.obj
        const dataTexture = blendedMap.blendMap
        let occupied: PlacedUV[] = []

        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            await this.makeInteractive(blendedMap)
        })

        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            // Pass 1: 바위 배치 (흙 지역에만)
            const rockResult = this.placer.generate(groundMesh, dataTexture, {
                seed: 100,
                pattern: 'rock',
                density: 1.0,
                minRadius: 2.8,
                numKinds: 5,
                scaleMin: 0.7,
                scaleRange: 0.8,
                occupiedUVs: occupied, // 처음에는 빈 배열
            });
            occupied.push(...rockResult.occupiedUVs); // 점유 공간 업데이트
            // console.log(rockResult.placements)
            this.autoMap(rockResult.placements, { countRange: [1, 1], windEnabled: false, type: MapEntryType.InstancedVegetation }, 
                Char.QuaterniusNatureRockpathRoundSmall1)
        })
        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {

            // Pass 2: 나무 배치 (식생 지역, 군집)
            const treeResult = this.placer.generate(groundMesh, dataTexture, {
                seed: 200,
                pattern: 'tree',
                density: 2.0,
                minRadius: 2.5,
                numKinds: 5,
                scaleMin: 0.9,
                scaleRange: 0.6,
                occupiedUVs: occupied, // 이전 단계의 점유 공간 전달
            });
            occupied.push(...treeResult.occupiedUVs); // 점유 공간 다시 업데이트
            // console.log(treeResult.placements)
            const trees = this.autoMap(treeResult.placements, { countRange: [1, 1], far: 120 }, Char.QuaterniusNatureDeadtree1)
            this.eventCtrl.SendEventMessage(EventTypes.RegisterPhysic, trees, true)
        })
        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            const pResult = this.placer.generate(groundMesh, dataTexture, {
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
            this.autoMap(pResult.placements, { countRange: [1, 3] }, Char.QuaterniusNatureGrassCommonShort)
        })
        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            // pass Edge
            const pEdgeResult = this.placer.generate(groundMesh, dataTexture, {
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
            const treesEdge = this.autoMap(pEdgeResult.placements, { countRange: [1, 3], 
                lodEnabled: false, cullingEnable: false, windEnabled: false  }, Char.QuaterniusNatureRockMedium1)

        })
        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoadingItems, async () => {
            // Pass 3: 식물 배치 (식생 지역, 군집)
            const plantResult = this.placer.generate(groundMesh, dataTexture, {
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
            this.autoMap(plantResult.placements, { countRange: [8, 16], far: 100 })
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
        })
        this.scene.add(res)
        return res
    }
    /**
 * 월드 좌표에서 수직으로 레이를 발사하여 평면 메쉬와의 교차점 UV를 찾습니다.
 * @param {THREE.Vector3} worldPoint - 레이를 발사할 시작 월드 좌표
 * @param {THREE.Mesh} planeMesh - 교차를 확인할 대상 평면 메쉬 (수평으로 놓여있다고 가정)
 * @returns {THREE.Vector2 | null} 계산된 UV 좌표. 교차점이 없으면 null을 반환합니다.
 */
    getUvOnPlane(worldPoint: THREE.Vector3, planeMesh: THREE.Mesh) {
        // 1. Raycaster 설정
        const raycaster = new THREE.Raycaster();
        const rayDirection = new THREE.Vector3(0, -1, 0); // 수직 아래 방향
        raycaster.set(worldPoint, rayDirection);

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