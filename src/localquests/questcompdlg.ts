import TapButton from "@Glibs/ux/buttons/tapbutton";
import { InvenFactory } from "@Glibs/inventory/invenfactory";
import IEventController from "@Glibs/interface/ievent";
import WoodModal from "@Glibs/ux/dialog/woodmodal";
import { EventTypes } from "@Glibs/types/globaltypes";
import { GameButton } from "@Glibs/ux/buttons/gamebutton";
import Slot from '@Glibs/ux/listviews/slot';
import { Grid } from '@Glibs/ux/grid/grid';
import { QuestId } from '@Glibs/systems/quests/questdef';
import { QuestManager } from '@Glibs/systems/quests/questmgr';
import { SimpleGux } from '@Glibs/ux/gux';
import { ItemProperty, itemDefs } from '@Glibs/inventory/items/itemdefs';
import { StatPreset } from '@Glibs/actors/battle/stats';
import { StatKey } from '@Glibs/types/stattypes';
import { StatNamesKr } from '@Glibs/actors/battle/charstatus';
import Confetti from '@Glibs/ux/confetti/confetti';

export default class QuestCompleteDialog {
    tap: TapButton
    woodModal: WoodModal
    confetti: Confetti
    awardSlot = new Slot({ width: "100px" })
    constructor(
        private eventCtrl: IEventController,
        private quest: QuestManager,
        private invenFab: InvenFactory
    ) {
        this.woodModal = new WoodModal()
        this.woodModal.RenderHtml("Quest Complete")

        const tap = new TapButton(document.body, {
            open: () => {
                this.woodModal.Show()
                this.eventCtrl.SendEventMessage(EventTypes.Confetti, true)
            },
            click: () => { this.woodModal.Hide() },
            close: async () => {
                await this.woodModal.Hide()
                this.eventCtrl.SendEventMessage(EventTypes.Confetti, false)
            },
        })

        tap.AddChildDom(this.woodModal.GetContentElement())
        this.tap = tap
        this.confetti = new Confetti(this.eventCtrl, tap.Dom)

    }
    Reward(id: QuestId) {
        this.woodModal.Clear()

        const q = this.quest.getQuestInfo(id)
        if (!q) return
        const titleDom = document.createElement("div")
        titleDom.innerText = "Quest: " + q.title
        const vrGrid = new Grid({ vertical: true })
        const title = new SimpleGux({
            dom: titleDom,
            param: ["container", "w-100", "h-100", "rounded"],
        })
        vrGrid.AddChild(title)


        const rewardDom = document.createElement("div")
        rewardDom.innerText = "Reward"
        const reward = new SimpleGux({
            dom: rewardDom,
            param: ["container", "w-100", "h-100", "rounded"],
        })
        vrGrid.AddChild(reward)

        Object.entries(q.rewards).forEach(([rewardType, rewardValue]) => {
            switch (rewardType) {
                case 'experience': {
                    const dom = document.createElement("div")
                    dom.innerText = `Exp: +${rewardValue}`
                    vrGrid.AddChild(new SimpleGux({ dom, param: ["container"] }))
                    break;
                }
                case 'items' : {
                    (rewardValue as {itemId: string, amount: number}[]).forEach((item) => {
                        const id = item.itemId as keyof typeof itemDefs
                        const prop = itemDefs[id]
                        vrGrid.AddChild(this.itemGux(prop))
                    })
                    break;
                }
            }
            
        })

        vrGrid.RenderHTML()
        this.woodModal.AddChild(vrGrid)

        if (!("items" in q.rewards)) {
            const okBtn = new GameButton({ title: "Close", click: () => { this.tap.Hide(); } })
            okBtn.RenderHTML()
            this.woodModal.AddChild(okBtn)
        }
    }
    async show() {
        this.tap.Show()
    }
    itemGux(item: ItemProperty) {
        const prop = this.invenFab.inven.GetItemInfo(item.id)
        const itemInfoSlot = new Slot({ width: "100px" })
        const itemInfoDom = document.createElement("div")
        const itemSpecDom = document.createElement("div")
        itemInfoSlot.ChangeIcon(prop.icon)
        itemInfoDom.innerText = prop.name + "\n"// + prop.description
        itemSpecDom.innerText = ("stats" in prop) ? this.getStatsDescription(prop.stats).join("\n") : ""
        itemInfoDom.classList.add("container")
        itemSpecDom.classList.add("container")

        const itemInfo = new SimpleGux({ dom: itemInfoDom, param: ["container", "w-100", "h-100", "rounded"], backgroundColor: "#e0e0e0" })
        const itemSpec = new SimpleGux({ dom: itemSpecDom, param: ["container", "w-100", "h-100", "rounded"], backgroundColor: "#e0e0e0" })

        const grid = new Grid({ margin: "m-0" })
        grid.AddChild(itemInfoSlot, { colClassList: ["col-auto", "p-0"] })
        grid.AddChild(itemInfo, { colClassList: ["p-0"] })

        const vGrid = new Grid({ vertical: true })
        vGrid.AddChild(grid)
        vGrid.AddChild(itemSpec, { colClassList: ["p-0"], rowClassList: ["m-0", "p-0"] })

        const okBtn = new GameButton({
            title: "Select", click: () => {
                this.eventCtrl.SendEventMessage(EventTypes.Pickup, item.id)
                this.tap.Hide()
            }
        })
        vGrid.AddChild(okBtn)
        vGrid.RenderHTML()

        return vGrid
    }
    getStatsDescription(stats: StatPreset): string[] {
        const descriptions: string[] = [];
        // stats 객체의 나머지 속성을 순회합니다.
        for (const key in stats) {
            const typedKey = key as StatKey
            const value = stats[typedKey];
            if (value !== undefined) {
                // statNames 맵에 해당 속성의 한글 이름이 있으면 사용하고, 없으면 key를 그대로 사용합니다.
                const name = StatNamesKr[typedKey] || typedKey;
                descriptions.push(`${name}: ${value}`);
            }
        }
        return descriptions;
    }
}