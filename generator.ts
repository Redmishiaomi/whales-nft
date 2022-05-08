import * as fs from 'fs'
import * as pathUtils from 'path'
import { parse } from 'yaml'
import Prando from 'prando'
import mergeImages from 'merge-images'
import { appendFile, writeFile, readdir } from 'fs/promises'
import canvas from 'canvas'
import ora from 'ora'

const { Image, Canvas } = canvas;

// @ts-ignore
import ImageDataURI from 'image-data-uri'

type Optional<T> = { [K in keyof T]?: T[K]  }

type LayerConfig = {
    rarity: number
    cannot_be_with?: string[]
}

type Layer = {
    path: string,
    overrides?: { [key: string]: number | Optional<LayerConfig> },
} & LayerConfig


type CustomConfig = {
    name: string
    count: number
    path: string
    uses?: string[]
    layers?: Layer[]
    special: boolean
}

type Config = {
    root: string,
    output: string,
    seed: string,
    count: number,
    layers: Layer[]
    custom: CustomConfig[]
}

const config: Config = parse(fs.readFileSync('./config.yaml', { encoding: 'utf-8' }))

const random = new Prando(config.seed);

function shuffle<T>(array: T[]) {
    let remaining = array.length - 1;
    while (remaining > 0) {
        let idx = Math.floor(random.next(0, remaining));

        if (array[remaining] == undefined) {
            console.log(remaining);
        }

        [array[remaining], array[idx]] = [array[idx], array[remaining]];
        remaining--;
    }
}

async function loadConstraints(layers: Layer[]) {
    let constraints = new Map<string, string[]>();

    let addConstraint = (name: string, cannotBeWith: string) => {
        let prevConstraints = constraints.get(name) || [];
        prevConstraints.push(cannotBeWith);
        constraints.set(name, prevConstraints);
    }

    for (let layer of layers) {
        if (layer.cannot_be_with) {
            for (let unsuitable of layer.cannot_be_with) {
                addConstraint(layer.path, unsuitable);
                addConstraint(unsuitable, layer.path);
            }
        }
        if (layer.overrides) {
            for (let [traitName, override] of Object.entries(layer.overrides)) {
                if (typeof override !== 'number' && override.cannot_be_with) {
                    for (let unsuitable of override.cannot_be_with) {
                        addConstraint(`${layer.path}/${traitName}`, unsuitable);
                        addConstraint(unsuitable, `${layer.path}/${traitName}`);
                    }
                }
            }
        }
    }

    return constraints;
}


type ImageTrait = {
    type: 'image',
    name: string,
    layer: string,
};
type EmptyTrait = { type: 'empty' };
type Trait = ImageTrait | EmptyTrait;

async function loadTraits(layer: Layer) {
    const traitsDir = pathUtils.resolve(config.root, layer.path);
    let traitsFiles = await readdir(traitsDir);

    let baseTraits: ImageTrait[] = [];
    for (let file of traitsFiles) {
        baseTraits.push({
            type: 'image',
            layer: layer.path,
            name: pathUtils.basename(file, '.png')
        })
    }
    let raritiesMap = new Map<string, number>();
    raritiesMap.set('default', layer.rarity);
    if (layer.overrides) {
        for (let [path, override] of Object.entries(layer.overrides)) {
            if (typeof override === 'number') {
                raritiesMap.set(path, layer.rarity * override);
            } else {
                if (override.rarity) {
                    raritiesMap.set(path, layer.rarity * override.rarity);
                }
            }
        }
    }

    let weightedTraits: Trait[] = [];
    for (let trait of baseTraits) {
        let count = (raritiesMap.get(trait.name) || raritiesMap.get('default')!) * 100;
        for (let i = 0; i < count; i++) {
            weightedTraits.push(trait);
        }
    }
    if (layer.rarity < 1) {
        let emptyCount = Math.round((1 - layer.rarity) / layer.rarity * weightedTraits.length);
        for (let i = 0; i < emptyCount; i++) {
            weightedTraits.push({ type: 'empty' });
        }
    }
    if (weightedTraits.length === 0) {
        weightedTraits.push({ type: 'empty' });
    }
    return { weightedTraits, count: traitsFiles.length };
}


type Tier = { layers: { traits: Trait[], layer: Layer }[], count: number };
async function loadTiers() {
    let result = new Map<string, Tier>(); 
    for (let custom of config.custom) {
        if (custom.special) {
            let specialPaths = await readdir(pathUtils.resolve(config.root, custom.path));
            let total = 0;
            for (let specialPath of specialPaths) {
                let name = pathUtils.basename(specialPath);
                let layers: { traits: Trait[], layer: Layer }[] = [];
                let variants = 1;
                for (let layer of config.layers) {
                    let newLayer = {
                        path: pathUtils.join(custom.path, name, layer.path),
                        rarity: layer.rarity
                    };
                    let traits = await loadTraits(newLayer);
                    layers.push({
                        layer: newLayer,
                        traits: traits.weightedTraits,
                    });
                    variants = variants * Math.max(traits.count, 1);
                }
                let count = Math.min(Math.floor(custom.count / specialPaths.length), variants);
                result.set(name, { 
                    layers,
                    count,
                });
                total += count;
            }
            if (total < custom.count) {
                while (total !== custom.count) {
                    let name = pathUtils.basename(random.nextArrayItem(specialPaths));
                    let tier = result.get(name)!;
                    if (tier.count < 55) {
                        continue;
                    }
                    tier.count++;
                    total++;
                }
            }
            continue;
        }
        let layers: { traits: Trait[], layer: Layer }[] = [];
        for (let layer of config.layers) {
            if (custom.uses?.includes(layer.path)) {
                layers.push({
                    layer,
                    traits: (await loadTraits(layer)).weightedTraits
                })
            } else {
                let newLayer = {
                    path: pathUtils.join(custom.path, layer.path),
                    rarity: layer.rarity
                };
                layers.push({
                    layer: newLayer,
                    traits: (await loadTraits(newLayer)).weightedTraits
                })
            }
        }
        if (custom.layers) {
            for (let layer of custom.layers) {
                let newLayer = {
                    path: pathUtils.join(custom.path, layer.path),
                    rarity: layer.rarity
                };
                layers.push({
                    layer: newLayer,
                    traits: (await loadTraits(newLayer)).weightedTraits
                })
            }
        }

        result.set(custom.name, { layers, count: custom.count });
    }
    return result;
} 

async function randomizeTiers(tiers: Map<string, Tier>) {
    let remaining = config.count;
    let result: string[] = [];
    for (let [name, tier] of tiers) {
        for (let i = 0; i < tier.count; i++) {
            remaining--;
            result.push(name);
        }
    }
    for (; remaining > 0; remaining--) result.push('common');

    shuffle(result);
    return result;
}

async function main() {
    let spinner = ora();
    spinner.start('Loading traits');

    const constraintsMap = await loadConstraints(config.layers);
    const commonLayers = await Promise.all(config.layers.map(async layer => ({ traits: (await loadTraits(layer)).weightedTraits, layer })));
    const tiers = await loadTiers();

    spinner.text = 'Building nfts';

    let used = new Set<string>();
    let nfts: string[][] = [];
    for (let tier of await randomizeTiers(tiers)) {
        let layers = commonLayers;
        if (tier !== 'common') {
            layers = tiers.get(tier)!.layers;
        }

        let combination: string[] = [];
        let attempts = 0;
        do {
            combination = [];
            let constraints: string[] = [];
            for (let layer of layers) {
                if (constraints.includes(layer.layer.path)) {
                    combination.push('empty');
                    continue;
                }
                let selected: Trait;
                while (true) {
                    selected = random.nextArrayItem(layer.traits);
                    if (selected.type === 'image' && constraints.includes(layer.layer.path + '/' + selected.name)) {
                        continue;
                    }
                    break;
                }
                combination.push(selected.type === 'image' ? (layer.layer.path + '/' + selected.name) : 'empty');
                if (selected.type == 'image') {
                    constraints.push(...(constraintsMap.get(layer.layer.path) || []))
                }
            }
            attempts++;
            if (attempts == 100) {
                console.log(combination);
                throw new Error('Cannot build unique combination');
            }            
        } while (used.has(combination.join('/')));
        used.add(combination.join('/'));
        nfts.push(combination);
    }
    spinner.succeed(`Built ${nfts.length} nfts`);


    spinner.start('Doing some magic');
    let i = 0;
    let total = 1000;
    const previewPath = pathUtils.resolve(config.output, 'preview.html');
    await writeFile(previewPath, '<head><style>img { width: 80px; height: 80px; margin: 8px }</style></head>');
    for (let nft of nfts.slice(0, total)) {
        let images: string[] = [];
        for (let i = 0; i < nft.length; i++) {
            if (nft[i] === 'empty') {
                continue;
            }
            images.push(pathUtils.resolve(config.root, nft[i] + '.png'));
        }
        try {
            let image = await mergeImages(images, { Canvas, Image });
            await ImageDataURI.outputFile(image, pathUtils.resolve(config.output, i + '.png'));
        
            await appendFile(previewPath, `<img alt="${nft.join(' ')}" src="${i + '.png'}"></img>`)
            i++;
            spinner.prefixText = `${i.toString()}/${total}`;
        } catch {
            console.log(images);
        }
    }
    spinner.succeed();
}
main().catch(e => console.error(e));