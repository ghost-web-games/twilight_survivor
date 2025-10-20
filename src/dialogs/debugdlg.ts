import IEventController from "@Glibs/interface/ievent"
import { EventTypes } from "@Glibs/types/globaltypes"
import { GameButton } from "@Glibs/ux/buttons/gamebutton"
import TapButton from "@Glibs/ux/buttons/tapbutton"
import BootModal from "@Glibs/ux/dialog/bootmodal"
import WoodModal from "@Glibs/ux/dialog/woodmodal"

export default class DebugDialog {
    tap: TapButton
    dialog = new BootModal()

    constructor(
        private eventCtrl: IEventController
    ) {
        const woodModal = new WoodModal()
        woodModal.RenderHtml("Debug", "개발자 화면")


        const tap = new TapButton(document.body, {
            open: () => { woodModal.Show() },
            click: () => { woodModal.Hide() },
            close: async () => { await woodModal.Hide() }
        })
        tap.AddChildDom(woodModal.GetContentElement())

        const dayBtn = new GameButton({
            title: "day", click: async () => {
                this.eventCtrl.SendEventMessage(EventTypes.GameCenter, "dayplay")
            }
        })
        woodModal.AddChild(dayBtn)

        const testBtn = new GameButton({
            title: "test", click: () => {
            }
        })
        woodModal.AddChild(testBtn)
        this.tap = tap
    }
    show() {
        this.tap.Show()
    }
}