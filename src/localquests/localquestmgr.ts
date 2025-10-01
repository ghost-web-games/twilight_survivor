import IEventController from "@Glibs/interface/ievent";
import { QuestId } from "@Glibs/systems/quests/questdef";
import { QuestManager } from "@Glibs/systems/quests/questmgr";
import { EventTypes } from "@Glibs/types/globaltypes";
import QuestDialog from "./questdlg";
import { QuestLocalId } from "./questdata";

export class LocalQuestManager {
    constructor(
        private eventCtrl: IEventController,
        private quest: QuestManager,
        private questDlg: QuestDialog,
    ) {
        this.eventCtrl.RegisterEventListener(EventTypes.QuestStateChanged, (ret: { questId: QuestId, status: string }) => {
            const q = this.quest.getQuestInfo(ret.questId)
            if (!q) return
            if (ret.status === 'COMPLETABLE') {
                if(q.endNpc.length == 0) {
                    this.eventCtrl.SendEventMessage(EventTypes.QuestComplete, ret.questId)
                }
            }
            if (ret.status === 'COMPLETED') {
                this.eventCtrl.SendEventMessage(EventTypes.Confetti, true)
                this.questDlg.Reward(ret.questId)
                this.questDlg.show()
            }
        })
        // Local Quest Complete
        this.eventCtrl.RegisterEventListener(EventTypes.CampfireCtrl, (fireAmount: number) => {
            if (this.quest.getQuestStatus(QuestLocalId.Q005_FIRE_CAMPFIRE) != "ACTIVE") return
            if (fireAmount > 0) this.quest.handleGameEvent({ type: "activate", targetId: "campfire" })
        })
        this.eventCtrl.RegisterEventListener(EventTypes.DarkParticle, (btAmount: number) => {
            if (this.quest.getQuestStatus(QuestLocalId.Q006_ESCAPE_DARKSIDE) != "ACTIVE") return
            if (btAmount == 0) this.quest.handleGameEvent({ type: "deactivate", targetId: "darkparticle" })
        })
    }
}