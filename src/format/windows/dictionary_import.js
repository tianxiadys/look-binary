export default class {
    static async parseNormal(image, dictionary) {
        let resultList = []
        for (let index1 = 0; ; index1++) {
            let view = await image.pointerToView(dictionary.VritualAddress + index1 * 20, 20)
            let result = {}
            result.Index = index1
            result.OriginalFirstThunk = view.getUint32(0, true)
            result.TimeDateStamp = view.getUint32(4, true)
            result.ForwarderChain = view.getUint32(8, true)
            result.Name = view.getUint32(12, true)
            result.FirstThunk = view.getUint32(16, true)
            //空元素终止
            if (result.FirstThunk === 0) {
                break
            }
            //实际解释
            result.NameString = await image.pointerToString(result.Name, false)
            result.RESULT = await this.#importList(image, result)
            resultList.push(result)
        }
        return resultList
    }

    static async parseDelay(image, dictionary) {
        let resultList = []
        for (let index1 = 0; ; index1++) {
            let view = await image.pointerToView(dictionary.VritualAddress + index1 * 32, 32)
            let result = {}
            result.Index = index1
            result.Characteristics = view.getUint32(0, true)
            result.Name = view.getUint32(4, true)
            result.ModuleHandle = view.getUint32(8, true)
            result.FirstThunk = view.getUint32(12, true)
            result.OriginalFirstThunk = view.getUint32(16, true)
            result.BoundTable = view.getUint32(20, true)
            result.UnloadTable = view.getUint32(24, true)
            result.TimeDateStamp = view.getUint32(28, true)
            //空元素终止
            if (result.FirstThunk === 0) {
                break
            }
            //实际解释
            result.NameString = await image.pointerToString(result.Name, false)
            result.RESULT = await this.#importList(image, result)
            resultList.push(result)
        }
        return resultList
    }

    static async #importList(image, result) {
        //部分文件的OriginalFirstThunk字段为空
        let view = await image.pointerToView(result.OriginalFirstThunk || result.FirstThunk)
        if (image.BITS === 32) {
            return this.#importList32(image, view)
        } else {
            return this.#importList64(image, view)
        }
    }

    static async #importList32(image, view) {
        let itemList = []
        for (let index2 = 0; ; index2++) {
            let item = {}
            let thunkItem = view.getUint32(index2 * 4, true)
            if (thunkItem === 0) {
                break
            } else if (thunkItem > 0x80000000) {
                item.Index = index2
                item.Ordinal = thunkItem & 0xFFFF
            } else {
                item.Index = index2
                item.Name = await image.pointerToString(thunkItem + 2, false)
            }
            itemList.push(item)
        }
        return itemList
    }

    static async #importList64(image, view) {
        let itemList = []
        for (let index2 = 0; ; index2++) {
            let item = {}
            let thunkItem = view.getBigUint64(index2 * 8, true)
            if (thunkItem === 0n) {
                break
            } else if (thunkItem > 0x80000000n) {
                item.Index = index2
                item.Ordinal = Number(thunkItem & 0xFFFFn)
            } else {
                let pointer = Number(thunkItem + 2n)
                item.Index = index2
                item.Name = await image.pointerToString(pointer, false)
            }
            itemList.push(item)
        }
        return itemList
    }
}
