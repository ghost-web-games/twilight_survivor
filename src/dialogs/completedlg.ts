import IEventController from "@Glibs/interface/ievent"
import { EventTypes } from "@Glibs/types/globaltypes"
import { GameButton } from "@Glibs/ux/buttons/gamebutton"
import TapButton from "@Glibs/ux/buttons/tapbutton"
import Focusing from "@Glibs/ux/confetti/focusing"
import RotateLight from "@Glibs/ux/confetti/rotatlight"
import WoodModal from "@Glibs/ux/dialog/woodmodal"

export default class CompleteDialog {
    tap: RotateLight
    focusing: Focusing

    constructor(private eventCtrl: IEventController) {
        const woodModal = new WoodModal({
            show: () => { this.eventCtrl.SendEventMessage(EventTypes.TimeCtrl, 0) },
            hide: () => { this.eventCtrl.SendEventMessage(EventTypes.TimeCtrl, 1) }
        })
        woodModal.RenderHtml("Mission Complete", "축하합니다!!")


        const tap = new RotateLight(document.body, {
            open: () => { woodModal.Show() },
            click: () => { woodModal.Hide() },
            close: async () => { await woodModal.Hide() }
        })
        tap.AddChildDom(woodModal.GetContentElement())

        const focusing = new Focusing(tap.Dom)

        const saveBtn = new GameButton({ title:"Close", click: () => { tap.Hide(); } })
        woodModal.AddChild(saveBtn)

        this.tap = tap
        this.focusing = focusing
    }
    Show() {
        this.tap.Show()
        this.focusing.Show()
    }
}