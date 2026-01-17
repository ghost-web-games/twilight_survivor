import { Player } from "@Glibs/actors/player/player";
import { PlayerCtrl } from "@Glibs/actors/player/playerctrl";
import IEventController from "@Glibs/interface/ievent";
import { EventTypes } from "@Glibs/types/globaltypes";
import { Icons } from "@Glibs/types/icontypes";
import { AttackOption } from "@Glibs/types/playertypes";
import MenuGroup from "@Glibs/ux/menuicons/menugroup";
import StatusBar from "@Glibs/ux/menuicons/statusbar";
import DialogFactory from "src/gamefab/dialogfab";

export default class LocalStatusCtrl {
    constructor(
        private eventCtrl: IEventController,
        private playerCtrl: PlayerCtrl,
        private dialogFab: DialogFactory,
    ) {
        this.eventCtrl.RegisterEventListener(EventTypes.LevelUp, (lv: number) => {
            this.dialogFab.openCard()
        })
    }
}