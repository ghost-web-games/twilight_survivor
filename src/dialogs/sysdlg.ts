import { GameButton } from "@Glibs/ux/buttons/gamebutton"
import TapButton from "@Glibs/ux/buttons/tapbutton"
import BootModal from "@Glibs/ux/dialog/bootmodal"
import WoodModal from "@Glibs/ux/dialog/woodmodal"

export enum SystemEvent {
    Save,
    Load,
    Down
}

export default class SystemDialog {
    tap: TapButton
    dialog = new BootModal()

    constructor(
    ) {
        const woodModal = new WoodModal()
        woodModal.RenderHtml("Settings", "시스템을 설정합니다.")


        const tap = new TapButton(document.body, {
            open: () => { woodModal.Show() },
            click: () => { woodModal.Hide() },
            close: async () => { await woodModal.Hide() }
        })
        tap.AddChildDom(woodModal.GetContentElement())

        const loadBtn = new GameButton()
        loadBtn.RenderHTML({
            title: "Load", click: async () => {
                this.dialog.RenderHtml("Load Ai Card", "")
                this.dialog.Show()
            }
        })
        woodModal.AddChild(loadBtn)

        const downBtn = new GameButton()
        downBtn.RenderHTML({
            title: "Upload", click: () => {
                this.dialog.RenderHtml("Upload Ai Card", "")
                this.dialog.Show()
            }
        })
        woodModal.AddChild(downBtn)
        this.tap = tap
    }
    show() {
        this.tap.Show()
    }
}