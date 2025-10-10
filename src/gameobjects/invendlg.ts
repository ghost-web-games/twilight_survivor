import TapButton from "@Glibs/ux/buttons/tapbutton";
import MiniRenderer from "@Glibs/systems/renderer/minrenderer";
import { Loader } from "@Glibs/loader/loader";
import IEventController from "@Glibs/interface/ievent";
import { Bind, Char } from "@Glibs/types/assettypes";
import WoodModal from "@Glibs/ux/dialog/woodmodal";
import ListView from "@Glibs/ux/listviews/listview";
import { EventTypes } from "@Glibs/types/globaltypes";
import { GameButton } from "@Glibs/ux/buttons/gamebutton";
import { InvenFactory } from '@Glibs/inventory/invenfactory';
import { Player } from '@Glibs/actors/player/player';
import CharMiniRenderer from '@Glibs/systems/renderer/charrenderer';
import { ItemId } from '@Glibs/inventory/items/itemdefs';
import Slot from "@Glibs/ux/listviews/slot";
import { Grid } from "@Glibs/ux/grid/grid";
import { SimpleGux } from "@Glibs/ux/gux";
import { GStack } from "@Glibs/ux/grid/stack";
import { StatPreset } from "@Glibs/actors/battle/stats";
import { StatKey } from "@Glibs/types/stattypes";
import { StatNamesKr } from "@Glibs/actors/battle/charstatus";

export default class InvenDialog {
    tap: TapButton
    charmini: CharMiniRenderer
    private miniInvenFab = new InvenFactory(this.loader, this.eventCtrl)
    currItem: ItemId = "Hanhwasbat"
    invenListView = new ListView({ padding: "p-0", height: "150px" })
    itemInfoTab: TapButton
    itemInfo = document.createElement("div")
    itemSpec = document.createElement("div")
    itemInfoSlot = new Slot({ width: "100px" })
    itembindSlot = new Map<Bind, Slot>()

    constructor(
        private loader: Loader,
        private eventCtrl: IEventController,
        private invenFab: InvenFactory,
        private player: Player
    ) {
        const woodModal = new WoodModal()
        woodModal.RenderHtml("Inventory")

        const tap = new TapButton(document.body, {
            open: () => { woodModal.Show() },
            click: () => { woodModal.Hide() },
            close: async () => {
                await woodModal.Hide()
                this.charmini.hide()
            },
        })
        tap.AddChildDom(woodModal.GetContentElement())
        this.tap = tap

        const vlGrid = new Grid({ vertical: true })
        for(const bind of [Bind.Head, Bind.Hands_L, Bind.Hands_R]) {
            const slot = new Slot()
            vlGrid.AddChild(slot)
            this.itembindSlot.set(bind, slot)
        }

        const vrGrid = new Grid({ vertical: true })
        for(const bind of [Bind.Body, Bind.Legs, Bind.Feet]) {
            const slot = new Slot()
            vrGrid.AddChild(slot)
            this.itembindSlot.set(bind, slot)
        }

        const grid = new Grid()
        grid.AddChild(vlGrid, { colClassList: ["col-auto"] })
        grid.AddChild(new SimpleGux(), { colClassList: ["p-0"] })
        grid.AddChild(vrGrid, { colClassList: ["col-auto"] })

        const charRenderDom = document.createElement("div")
        charRenderDom.style.width = "100%"
        charRenderDom.style.height = "200px"
        charRenderDom.classList.add("rounded")
        const stack = new GStack()
        stack.AddChild(new SimpleGux({ dom: charRenderDom, param: ["container", "p-0", "m-0"] }))
        stack.AddChild(grid)
        stack.RenderHTML()

        woodModal.AddChild(stack)
        woodModal.addChildUi(this.invenListView)

        // Item Modal
        const itemModal = this.makeItemViewDlg()
        this.itemInfoTab = new TapButton(document.body, {
            open: () => { itemModal.Show() },
            click: () => { itemModal.Hide() },
            close: async () => {
                await itemModal.Hide()
            },
        })
        this.itemInfoTab.AddChildDom(itemModal.GetContentElement())

        this.charmini = new CharMiniRenderer(this.loader, eventCtrl, charRenderDom, this.invenFab)
    }
    async LoadChar() {
        this.eventCtrl.SendEventMessage(EventTypes.Equipment, this.currItem)
        this.updateInventoryView()
    }
    UnloadChar() {
    }
    async show() {
        this.eventCtrl.SendEventMessage(EventTypes.Spinner, true)
        await this.charmini.Init(this.player.Asset)
        this.tap.Show()
        this.charmini.resize()
        this.updateInventoryView()
        this.eventCtrl.SendEventMessage(EventTypes.Spinner, false)
    }
    updateInventoryView() {
        this.invenListView.RemoveChild()
        this.invenFab.inven.GetInventories().forEach((item) => {
            this.invenListView.AddChild(new Slot({
                iconPath: item.item.IconPath,
                click: () => {
                    this.currItem = item.item.Id as ItemId
                    this.itemInfoUpdate(this.currItem)
                    this.itemInfoTab.Show()
                }
            }))
        })
        for (const [key, value] of Object.entries(Bind)) {
            // isNaN(Number(key))를 사용하여 숫자 키를 가진 항목을 제외합니다.
            if (isNaN(Number(key))) {
                const item = this.invenFab.inven.GetBindingItem(value as Bind)
                if (item) {
                    const prop = this.invenFab.inven.GetItemInfo(item.Id as ItemId)
                    this.itembindSlot.get(value)!.ChangeIcon(prop.icon)
                }
            }
        }
    }
    itemInfoUpdate(id: ItemId) {
        const prop = this.invenFab.inven.GetItemInfo(id)
        this.itemInfoSlot.ChangeIcon(prop.icon)
        this.itemInfo.innerText = prop.name + "\n"// + prop.description
        this.itemSpec.innerText = ("stats" in prop) ? this.getStatsDescription(prop.stats).join("\n") : ""
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
    makeItemViewDlg() {
        const itemInfo = new SimpleGux({ dom: this.itemInfo, param: ["container", "w-100", "h-100", "rounded"], backgroundColor: "#e0e0e0" })
        const itemSpec = new SimpleGux({ dom: this.itemSpec, param: ["container", "w-100", "h-100", "rounded"], backgroundColor: "#00ff00" })
        this.itemInfo.classList.add("container")
        this.itemSpec.classList.add("container")

        const grid = new Grid({ margin: "m-0" })
        grid.AddChild(this.itemInfoSlot, { colClassList: ["col-auto", "p-0"] })
        grid.AddChild(itemInfo, { colClassList: ["p-0"] })

        const vGrid = new Grid({ vertical: true })
        vGrid.AddChild(grid)
        vGrid.AddChild(itemSpec, { colClassList: ["p-0"], rowClassList: ["m-0", "p-0"] })

        const okBtn = new GameButton({
            title: "Equip", click: () => {
                this.LoadChar();
                this.itemInfoTab.Hide()
            }
        })
        vGrid.AddChild(okBtn)
        vGrid.RenderHTML()

        okBtn.RenderHTML()

        const itemModal = new WoodModal()
        itemModal.RenderHtml("Item Info")
        itemModal.AddChild(vGrid)
        return itemModal
    }
}