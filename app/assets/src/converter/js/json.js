import { bloxdToMcId, mcToBloxdId } from "./block-conversion.js";

function posToIdxBloxd(pos, size) {
    return pos[0] * size[1] * size[2] + pos[1] * size[2] + pos[2];
}
function posToIdxMc(pos, size) {
    return (pos[1] * size[2] + pos[2]) * size[0] + pos[0];
}

export const bloxdJSONtoMc = function(bloxdJson) {
    function encodeLEB128(value) {
        const bytes = new Array();
        while((value & -128) != 0) {
            let schemId = value & 127 | 128;
            if (schemId >= 128) {
                schemId -= 256;
            }
            bytes.push(schemId);
            value >>>= 7;
        }
        bytes.push(value);
        return bytes;
    }

    const { chunks } = bloxdJson;
    const startPos = chunks[0].pos;
    const endPos = chunks[chunks.length - 1].pos;
    const size = endPos.map((endCoord, i) => (endCoord + 1 - startPos[i]) * 32);
    bloxdJson.size = size;

    const paletteArr = [];
    const palette = {};
    let blocks = new Array(size[0] * size[1] * size[2]);

    for(const chunk of chunks) {
        let blockI = posToIdxMc(chunk.pos.map(coord => coord * 32), size);
        let chunkI = 0;

        const zBlockIInc = size[0] - 32;
        const yBlockIInc = size[0] * (size[2] - 32);

        for(let y = 0; y < 32; y++) {
            for(let z = 0; z < 32; z++) {
                for(let x = 0; x < 32; x++) {
                    const block = bloxdToMcId(chunk.blocks[chunkI]);
                    if(!paletteArr.includes(block)) {
                        paletteArr.push(block);
                    }
                    let paletteI = paletteArr.indexOf(block);
                    if((paletteI & -128) != 0) {
                        const encoded = encodeLEB128(paletteI);
                        blocks.splice(blockI, 1, ...encoded);
                        blockI += encoded.length;
                    } else {
                        blocks[blockI] = paletteI;

                        blockI += 1;
                    }
                    chunkI += 1024;
                }
                blockI += zBlockIInc;
                chunkI -= 32767;
            }
            blockI += yBlockIInc;
        }
    }
    paletteArr.forEach((id, i) => palette[id] = pnbt.int(i));

    const minecraftJson = pnbt.comp({
        BlockData: pnbt.byteArray(blocks),
        BlockEntities: pnbt.list(pnbt.comp([])),
        Width: pnbt.short(bloxdJson.size[0]),
        Height: pnbt.short(bloxdJson.size[1]),
        Length: pnbt.short(bloxdJson.size[2]),
        Palette: pnbt.comp(palette),
        PaletteMax: pnbt.int(Object.keys(paletteArr).length),
        Version: pnbt.int(2),
        DataVersion: pnbt.int(3463)
    }, "Schematic");

    return minecraftJson;
};


export const mcJSONToBloxd = function (mcJson, name = "New Schematic") {
    function idxToPos(idx, size) {
        const x = idx % size[0];
        const y = Math.floor(idx / (size[0] * size[2]));
        const z = (size[2] - 1 - Math.floor(idx / size[0]) % size[2]);

        return [x, y, z];
    }

    const bloxdJson = {
        name: name,
        pos: [0, 0, 0],
        size: [0, 0, 0],
        chunks: []
    };

    if(Array.isArray(mcJson.palette)) {
        mcJson.palette = mcJson.palette.map(mcToBloxdId);
    } else {
        const paletteArr = [];
        for(const mcId in mcJson.palette) {
            const idx = mcJson.palette[mcId];
            paletteArr[idx] = mcToBloxdId(mcId);
        }
        mcJson.palette = paletteArr
    }

    const { size } = mcJson;
    bloxdJson.size = size;
    const chunksSize = size.map(axis => Math.ceil(axis / 32));

    for(let chunkX = 0; chunkX < chunksSize[0]; chunkX++) {
        for(let chunkY = 0; chunkY < chunksSize[1]; chunkY++) {
            for(let chunkZ = 0; chunkZ < chunksSize[2]; chunkZ++) {
                bloxdJson.chunks.push({
                    pos: [
                        chunkX,
                        chunkY,
                        chunkZ
                    ],
                    blocks: new Array(32768).fill(0)
                });
            }
        }
    }

    let blockI = 0;
    while(blockI < mcJson.blocks.length) {
        const pos = idxToPos(blockI, size);
        const chunkLocalPos = pos.map(axis => axis % 32);
        const chunkLocalI = posToIdxBloxd(chunkLocalPos, [32, 32, 32]);
        const chunkPos = pos.map(axis => Math.floor(axis / 32));
        const chunkI = posToIdxBloxd(chunkPos, chunksSize);
        const chunk = bloxdJson.chunks[chunkI];

        const maxI = blockI % size[0] + 32 > size[0] ? size[0] % 32 : 32;
        for(let i = 0; i < maxI; i++) {
            chunk.blocks[chunkLocalI + i * 1024] = mcJson.palette[mcJson.blocks[blockI++]];
        }
    }

    console.log(bloxdJson);
    return bloxdJson;
};