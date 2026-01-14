import IEventController from "@Glibs/interface/ievent"
import { EventTypes } from "@Glibs/types/globaltypes"
import { GameButton } from "@Glibs/ux/buttons/gamebutton"
import TapButton from "@Glibs/ux/buttons/tapbutton"
import WoodModal from "@Glibs/ux/dialog/woodmodal"
import LoadingMgr from "@Glibs/ux/loading/loadingmgr"
import { SimpleCircleProgressBar } from "@Glibs/ux/progress/simplecirclebar"
import MapFactory from "../gamefab/mapfactory"

export default class LoadingDialog {
    tap: TapButton
    progressbar: SimpleCircleProgressBar

    constructor(
        private eventCtrl: IEventController,
        private loadMgr: LoadingMgr,
        private mapFab: MapFactory,
    ) {
        this.tap = new TapButton(document.body, {
            opacity: "1", tapEnable: false, close: () => {
                this.progressbar.SetProgress(0)
            }
        })
        this.progressbar = new SimpleCircleProgressBar({ preset: 'Rainbow' })
        this.progressbar.Create()
        this.tap.AddChild(this.progressbar)
    }
    DayShow() {
        this.tap.Show()
        this.mapFab.DayLoad()

        this.eventCtrl.SendEventMessage(EventTypes.RegLoadingCompleteCommonItem, async () => {
            this.tap.EnableTap()
            this.eventCtrl.SendEventMessage(EventTypes.GameCenter, "dayplay")
        })
        this.loadMgr.startProcessing(1)
    }
    NightShow() {
        this.tap.Show()
        this.mapFab.NightLoad()

        this.eventCtrl.SendEventMessage(EventTypes.RegLoadingCompleteCommonItem, async () => {
            this.tap.EnableTap()
            this.eventCtrl.SendEventMessage(EventTypes.GameCenter, "nightplay")
        })
        this.loadMgr.startProcessing(1)
    }
}