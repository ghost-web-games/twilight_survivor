import { Player } from "@Glibs/actors/player/player";
import IEventController from "@Glibs/interface/ievent";
import { InvenFactory } from "@Glibs/inventory/invenfactory";
import { Loader } from "@Glibs/loader/loader";
import { QuestManager } from "@Glibs/systems/quests/questmgr";
import Confetti from "@Glibs/ux/confetti/confetti";
import { RadialMenuUI } from "@Glibs/ux/radialmenus/radialmenus";
import InvenDialog from "../dialogs/invendlg";
import QuestDialog from "../localquests/questdlg";

export default class MenuFactory {
    questDlg = new QuestDialog(this.eventCtrl, this.quest, this.invenFab)
    invenDlg = new InvenDialog(this.loader, this.eventCtrl, this.invenFab, this.player)
    confetti = new Confetti(this.eventCtrl, document.body)
    ringMenu = new RadialMenuUI(this.eventCtrl, {
        // overlay 부모(생략시 document.body)
        parent: this.parent,
        onlyWhenTargetWithin: this.targetDom,

        // GUI에서 쓰던 옵션들
        radius: ((window.innerWidth > window.innerHeight) ? window.innerHeight : window.innerWidth) * 0.5 / 2,
        itemSize: 76,
        startAngleDeg: -90,
        animateMs: 520,
        spinOnOpen: 1.2,
        easing: 'outBack',
        ringStyle: 'none',     // 'none' | 'solid' | 'line'
        shape: 'circle',       // 'circle' | 'rounded' | 'square' | 'hex'
        theme: 'SF Neon',       // 또는 'custom' + themeVars
        fontScale: 0.52,
        autoCloseOnMiss: true,
        openAt: 'center',       // 또는 'pointer' (클릭 지점 팝업)
        enableGlobalCenterClick: true, // 전역 중앙 클릭 열기
    });
    constructor(
        private loader: Loader,
        private eventCtrl: IEventController,
        private quest: QuestManager,
        private invenFab: InvenFactory,
        private player: Player,
        private targetDom :HTMLElement,
        private parent :HTMLElement,

    ) {
    }
    Mount() {
        this.ringMenu.mount(document.body)
    }
    Unmount() {
        this.ringMenu.unmount()
    }
}