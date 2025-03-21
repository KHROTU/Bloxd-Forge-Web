const parse = buffer => {
    return pnbt.parseAs(buffer, "big", {
        noArraySizeCheck: true
    }).then(schem => pnbt.simplify(schem.data));
};
export const parseSchem = async function (buffer) {
    let schem = await parse(buffer);
    if(schem.Schematic) {
        schem = schem.Schematic;
    }
    const json = {
        size: [
            schem.Width,
            schem.Height,
            schem.Length
        ]
    };
    switch(schem.Version) {
        case 1:
        case 2:
            json.blocks = schem.BlockData;
            json.palette = schem.Palette;
            break;
        case 3:
            json.blocks = schem.Blocks.Data;
            json.palette = schem.Blocks.Palette;
            break;
        default: throw new Error("Unsupported schematic version.");
    }

    const decodedBlocks = [];
    let i = 0;
    while(i < json.blocks.length) {
        let shift = 0;
        let value = 0;
    
        while(true) {
            const byte = json.blocks[i++];
            value |= (byte & 127) << shift;
            shift += 7
            if((byte & 128) !== 128) {
                break;
            }
        }
        decodedBlocks.push(value);
    }
    json.blocks = decodedBlocks;

    return json;
};

export const parseLitematic = async function (buffer) {
    function posToIdx(pos, size) {
        return pos[1] * size[0] * size[2] + (size[2] - 1 - pos[2]) * size[0] + pos[0];
    }
    function arrToBigInt(arr) {
        return (BigInt(arr[0] >>> 0) << 32n) | BigInt(arr[1] >>> 0);
    }
    function getPaletteIdx(index, bits, blockStates) {
        let paletteIdx;

        const startOffset = index * bits;
        const startIdx = startOffset >>> 6;
        const endIdx = ((index + 1) * bits - 1) >>> 6;
        const startBitOffset = BigInt(startOffset & 63);
        const max = BigInt((1 << bits) - 1);

        const blockstate = blockStates[startIdx];
        const startLong = arrToBigInt(blockstate);

        paletteIdx = startLong >> startBitOffset;
        if (startIdx !== endIdx) {
            const endBitOffset = 64n - startBitOffset;

            const blockstate = blockStates[endIdx];
            const endLong = arrToBigInt(blockstate);

            paletteIdx |= endLong << endBitOffset;
        }

        return Number(paletteIdx & max);
    }

    const schem = await parse(buffer);
    const size = Object.values(schem.Metadata.EnclosingSize);
    const json = {
        blocks: new Array(size.reduce((acc, val) => acc * val)),
        palette: [],
        size: size
    };

    for (const region of Object.values(schem.Regions)) {
        const size = Object.values(region.Size);
        const absSize = size.map(Math.abs);
        const pos = Object.values(region.Position).map((coord, i) => {
            //set to lowest coordinate
            if(size[i] < 0) return coord % (size[i] + 1);
            return coord;
        });

        const palette = region.BlockStatePalette;
        const blockStates = region.BlockStates;

        //Palette
        //region palette idx to global palette idx
        const pIdxConversion = {};
        for(let i = 0; i < palette.length; i++) {
            const block = palette[i];

            let id = block.Name;
            if(block.Properties) {
                let attrStr = "[";
                for(const key in block.Properties) {
                    attrStr += `${key}=${block.Properties[key]},`;
                }
                id += (attrStr + "]").replace(/\,(?=\])|\[\]/g, "");
            }

            if(json.palette.includes(id)) {
                pIdxConversion[i] = json.palette.indexOf(id);
            } else {
                pIdxConversion[i] = json.palette.push(id) - 1;
            }
        }

        //Blocks
        const bits = Math.max(2, Math.ceil(Math.log2(palette.length)));
        for (let y = 0; y < absSize[1]; y++) {
            for (let z = 0; z < absSize[2]; z++) {
                for (let x = 0; x < absSize[0]; x++) {
                    const regionIdx = posToIdx([x,y,z], absSize);
                    const paletteIdx = getPaletteIdx(regionIdx, bits, blockStates);

                    const idx = posToIdx([pos[0] + x, pos[1] + y, pos[2] + z], json.size);
                    json.blocks[idx] = pIdxConversion[paletteIdx];
                }
            }
        }
    }

    return json;
}

export const writeMinecraft = function (json) {
    return pnbt.writeUncompressed(json);
};