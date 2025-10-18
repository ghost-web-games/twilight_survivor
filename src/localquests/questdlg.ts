import TapButton from "@Glibs/ux/buttons/tapbutton";
import IEventController from "@Glibs/interface/ievent";
import WoodModal from "@Glibs/ux/dialog/woodmodal";
import ListView from "@Glibs/ux/listviews/listview";
import ListItem from "@Glibs/ux/listviews/listitem";
import { EventTypes } from "@Glibs/types/globaltypes";
import { GameButton } from "@Glibs/ux/buttons/gamebutton";
import { QuestManager } from '@Glibs/systems/quests/questmgr';
import Slot from "@Glibs/ux/listviews/slot";
import { SimpleGux } from "@Glibs/ux/gux";
import { Grid } from "@Glibs/ux/grid/grid";
import { StatPreset } from "@Glibs/actors/battle/stats";
import { StatKey } from "@Glibs/types/stattypes";
import { StatNamesKr } from "@Glibs/actors/battle/charstatus";
import { InvenFactory } from "@Glibs/inventory/invenfactory";
import { ItemProperty, itemDefs } from "@Glibs/inventory/items/itemdefs";
import { ActiveQuest, Quest } from "@Glibs/systems/quests/questdef";

export default class QuestDialog {
    tap: TapButton
    list: ListView
    descDom = document.createElement("div")
    rewardDom = document.createElement("div")
    desc = new SimpleGux({
        dom: this.descDom,
        param: ["container", "w-100", "h-100", "rounded"],
    })
    reward = new SimpleGux({
        dom: this.rewardDom,
        param: ["container", "w-100", "h-100", "rounded"],
    })
    vrGrid = new Grid({ vertical: true })
    constructor(
        private eventCtrl: IEventController,
        private quest: QuestManager,
        private invenFab: InvenFactory
    ) {
        this.rewardDom.innerText = "Reward"

        const woodModal = new WoodModal({
            show: () => { this.eventCtrl.SendEventMessage(EventTypes.TimeCtrl, 0) },
            hide: () => { this.eventCtrl.SendEventMessage(EventTypes.TimeCtrl, 1) }
        })
        woodModal.RenderHtml("Quest")

        const tap = new TapButton(document.body, {
            open: () => { woodModal.Show() },
            click: () => { woodModal.Hide() },
            close: async () => { await woodModal.Hide() },
        })
        tap.AddChildDom(woodModal.GetContentElement())
        this.tap = tap

        this.list = new ListView({ padding: "p-1", height: "100px" })
        woodModal.addChildUi(this.list)
        woodModal.addChildUi(this.vrGrid)

    }
    async show() {
        this.eventCtrl.SendEventMessage(EventTypes.Spinner, true)
        this.list.RemoveChild()

        const questList = this.quest.getActiveQuests()
        if(!questList.size) {
            this.list.AddChild(new ListItem({ text: "No Active Quest", }))
        } else {
            questList.forEach((q) => {
                const info = this.quest.getQuestInfo(q.questId)
                if (!info) return
                this.list.AddChild(new ListItem({
                    text: info.title,
                    click: async () => {
                        this.showDesc(info)
                    }
                }))
            })
            const aq = questList.values().next().value as ActiveQuest
            const info = this.quest.getQuestInfo(aq.questId)
            this.showDesc(info!)
        }
        this.tap.Show()
        this.eventCtrl.SendEventMessage(EventTypes.Spinner, false)
    }
    showDesc(q: Quest) {
        this.vrGrid.dispose()
        this.descDom.innerText = `"${q.description}"`

        this.vrGrid.AddChild(this.desc)
        this.vrGrid.AddChild(this.reward)

        Object.entries(q.rewards).forEach(([rewardType, rewardValue]) => {
            switch (rewardType) {
                case 'experience': {
                    const dom = document.createElement("div")
                    dom.innerText = `Exp: +${rewardValue}`
                    this.vrGrid.AddChild(new SimpleGux({ dom, param: ["container"] }))
                    break;
                }
                case 'items' : {
                    (rewardValue as {itemId: string, amount: number}[]).forEach((item) => {
                        const id = item.itemId as keyof typeof itemDefs
                        const prop = itemDefs[id]
                        this.vrGrid.AddChild(this.itemGux(prop))
                    })
                    break;
                }
            }
            
        })
        this.vrGrid.RenderHTML()
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
        itemSpecDom.classList.add("container", "game-text")

        const itemInfo = new SimpleGux({ dom: itemInfoDom, param: ["container", "w-100", "h-100", "rounded"], backgroundColor: "#e0e0e0" })
        const itemSpec = new SimpleGux({ dom: itemSpecDom, param: ["container", "w-100", "h-100", "rounded"], backgroundColor: "#e0e0e0" })

        const grid = new Grid({ margin: "m-0" })
        grid.AddChild(itemInfoSlot, { colClassList: ["col-auto", "p-0"] })
        grid.AddChild(itemInfo, { colClassList: ["p-0"] })

        const vGrid = new Grid({ vertical: true })
        vGrid.AddChild(grid)
        vGrid.AddChild(itemSpec, { colClassList: ["p-0"], rowClassList: ["m-0", "p-0"] })

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