import fs from "fs";
const testDataDir = "/var/tmp/data";
const size = 2000;
function* dataGenerator(to) {
    let from = 1;
    while (from <= to)
        yield { number: from, filename: `data-${from++}.json` };
}
function* filenameGenerator(to) {
    let from = 1;
    while (from <= to)
        yield `${testDataDir}/data-${from++}.json`;
}
async function generateData() {
    await new Promise((resolve, reject) => {
        fs.stat(testDataDir, (err) => {
            if (err)
                reject();
            else
                resolve();
        });
    }).catch(() => {
        fs.mkdir(testDataDir, { recursive: true }, (err) => {
            if (err)
                throw Error(`Fail to create directory ${testDataDir}: ${err?.message}`);
        });
    });
    await Promise.all(Array.from(dataGenerator(size)).map((data) => new Promise((resolve, reject) => {
        fs.writeFile(`${testDataDir}/${data.filename}`, JSON.stringify(data), (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    })));
}
await generateData();
class BufferdLogger {
    buffer = "";
    log(m) {
        this.buffer += `${new Date().toString()}: ${m}\n`;
    }
    print() {
        console.log(this.buffer);
    }
}
async function readData(filename, logger) {
    return new Promise((resolve, reject) => {
        logger.log(`start read file ${filename}`);
        fs.readFile(filename, {}, (err, data) => {
            if (err) {
                reject(Error(`Fail to readfile ${filename}: ${err?.message}`));
                return;
            }
            logger.log(`end read file ${filename}`);
            resolve(JSON.parse(data.toString()));
        });
    });
}
async function testSync() {
    const logger = new BufferdLogger();
    const numbers = [];
    for (const filename of filenameGenerator(size)) {
        logger.log(`start process for file ${filename}`);
        const data = await readData(filename, logger);
        logger.log(`end process for file ${filename} result = ${JSON.stringify(data)}`);
        numbers.push(data.number);
    }
    logger.log(`numbers=${JSON.stringify(numbers)}`);
    // 実行順序・結果を確認する場合は以下を実行
    // logger.print()
}
async function testAsync() {
    const logger = new BufferdLogger();
    const numbers = await Promise.all(Array.from(filenameGenerator(size)).map(async (filename) => {
        logger.log(`start process for file ${filename}`);
        const data = await readData(filename, logger);
        logger.log(`end process for file ${filename} result = ${JSON.stringify(data)}`);
        return data.number;
    }));
    logger.log(`numbers=${JSON.stringify(numbers)}`);
    // 実行順序を確認する場合は以下を実行
    // logger.print()
}
async function main() {
    const startTime = new Date().getTime();
    await testSync();
    console.log(`elapstime for testSync() = ${new Date().getTime() - startTime}ms`);
    const startTimeA = new Date().getTime();
    await testAsync();
    console.log(`elapstime for testAsync() = ${new Date().getTime() - startTimeA}ms`);
}
await main();
