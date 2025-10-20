import IEventController, { ILoop } from "@Glibs/interface/ievent";
import { IPhysicsObject } from "@Glibs/interface/iobject";
import { Inventory } from "@Glibs/inventory/inventory";
import { itemDefs } from "@Glibs/inventory/items/itemdefs";
import { EventTypes } from "@Glibs/types/globaltypes";
import StatusBar from "@Glibs/ux/menuicons/statusbar";


export default class CampfireCtrl {
    fireAmount = 0
    fireChangeAmount = 0.001
    btAmount = 0.9
    btChangeAmount = 0.001
    MAX_LOG = 10
    // 클래스 생성자나 초기화 함수 등에서 미리 상수를 정의해두면 좋습니다.
    MAX_FIRE_DISTANCE = 15.0; // 🔥 캠프파이어 효과가 적용되는 최대 거리 (예: 15미터)
    BASE_REDUCTION_AMOUNT = 0.5; // ✅ 캠프파이어가 최대로 발휘하는 저주 감소량 (초당)
    timer? : NodeJS.Timeout


    constructor(
        private eventCtrl: IEventController,
        private inven: Inventory,
        private player: IPhysicsObject,
        private campfire: THREE.Vector3,
        private status: StatusBar,
    ) {
        eventCtrl.RegisterEventListener(EventTypes.CampfireInteract, (actor: IPhysicsObject) => {
            const slot = this.inven.GetItemSlot(itemDefs.Logs.id)
            if (!slot) {
                this.eventCtrl.SendEventMessage(EventTypes.AlarmNormal, "You don't have any logs")
                return
            }
            this.fireAmount = Math.min(this.fireAmount + slot.count / this.MAX_LOG, 1)
            this.eventCtrl.SendEventMessage(EventTypes.CampfireCtrl, this.fireAmount)
            this.eventCtrl.SendEventMessage(EventTypes.UseItem, slot.item.Id, slot.count)
        })
    }
    init() {
        this.loop()
    }
    uninit() { 
        this.timer && clearTimeout(this.timer)
    }
    Enable(onoff: boolean) {
        if(onoff) {
            this.loop()
        } else {
            this.eventCtrl.SendEventMessage(EventTypes.DarkParticle, 0);
            clearTimeout(this.timer)
        }
    }

    loop() {
        this.timer = setTimeout(() => {
            // 저주의 기본 증가량
            let changeAmount = this.btChangeAmount;
            this.fireAmount = Math.max(this.fireAmount - this.fireChangeAmount, 0);

            if (this.fireAmount <= 0.2 && this.fireAmount >= 0.2 - this.fireChangeAmount) {
                this.eventCtrl.SendEventMessage(EventTypes.AlarmWarning, "Campfire is almost out of fire!");
            }
            this.eventCtrl.SendEventMessage(EventTypes.CampfireCtrl, this.fireAmount);

            // 캠프파이어의 불씨가 남아있고(fireAmount > 0), 효과 범위 내에 있을 경우
            if (this.fireAmount > 0) {
                const dist = this.player.Pos.distanceTo(this.campfire);

                // ↔️ 플레이어가 캠프파이어의 최대 유효 거리 안에 있는지 확인
                if (dist < this.MAX_FIRE_DISTANCE) {
                    // 1. 거리에 따른 효과 계수 계산 (0.0 ~ 1.0)
                    //    - 거리가 0에 가까울수록 1에 가까워지고, 최대 거리에 가까울수록 0에 가까워집니다.
                    const distanceFactor = 1 - (dist / this.MAX_FIRE_DISTANCE);

                    // 2. 최종 저주 감소량 계산
                    //    - 기본 감소량 * 거리 계수 * 불의 세기(남은 양)
                    const finalReduction = this.BASE_REDUCTION_AMOUNT * distanceFactor * this.fireAmount;

                    // 3. 기본 증가량에서 최종 감소량을 빼서 변화량을 조절
                    changeAmount -= finalReduction;
                }
            }

            // 최종 계산된 변화량을 btAmount에 적용
            this.btAmount += changeAmount;

            // btAmount가 항상 0과 1 사이의 값을 유지하도록 보정
            this.btAmount = Math.max(0, Math.min(1, this.btAmount));
            if(this.btAmount >= 0.9 && this.btAmount < 0.9 + this.btChangeAmount) {
                this.eventCtrl.SendEventMessage(EventTypes.AlarmWarning, "어둠에 곧 사로잡힙니다!!");
            }

            console.log(changeAmount, this.fireAmount, this.btAmount)
            this.status.UpdateStatus((1-this.btAmount) * 100)
            // 변경된 값을 이벤트로 전송
            this.eventCtrl.SendEventMessage(EventTypes.DarkParticle, this.btAmount);

            // 다음 루프 실행
            this.loop();
        }, 2000);
    }
}