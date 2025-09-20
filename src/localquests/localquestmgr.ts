import IEventController from "@Glibs/interface/ievent";
import { QuestId } from "@Glibs/systems/quests/questdef";
import { QuestManager } from "@Glibs/systems/quests/questmgr";
import { EventTypes } from "@Glibs/types/globaltypes";
import QuestDialog from "./questdlg";

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
    }
}