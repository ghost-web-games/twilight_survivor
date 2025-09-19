import IEventController from "@Glibs/interface/ievent";
import { QuestId } from "@Glibs/systems/quests/questdef";
import { EventTypes } from "@Glibs/types/globaltypes";

export class LocalQuestManager {
    constructor(
        private eventCtrl: IEventController
    ) {
        this.eventCtrl.RegisterEventListener(EventTypes.QuestStateChanged, (ret: { questId: QuestId, status: string }) => {
            if (ret.status === 'COMPLETABLE') {
                if (ret.questId === "Q004_OPENING_CAMPFIRE") {
                    this.eventCtrl.SendEventMessage(EventTypes.QuestComplete, ret.questId)
                }
            }
            if (ret.status === 'COMPLETED') {
                this.eventCtrl.SendEventMessage(EventTypes.Confetti, true)
            }
        })
    }
}