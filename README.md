# Promise.all() による非同期実行の性能

このテストプログラムでは、eslint が [no-await-in-loop](https://eslint.org/docs/latest/rules/no-await-in-loop) で指摘するコードについて、どのような問題かを調査するため、ファイルの読み込みを同期的に順次実行した場合（指摘の対象となるコード）とPromise.all() を使って非同期に並列実行した場合の性能の比較する。

## await を含むループで実行

以下に 2000 個のファイルを順次読み出すプログラムを示す。

```typescript　{.line-numbers}
async function testSync() {
    const logger = new BufferdLogger()
    const numbers = []
    for (const filename of filenameGenerator(size)) {
        logger.log(`start process for file ${filename}`)
        const data = await readData(filename, logger)
        logger.log(
            `end process for file ${filename} result = ${JSON.stringify(data)}`,
        )
        numbers.push(data.number)
    }
    logger.log(`numbers=${JSON.stringify(numbers)}`)
    // 実行順序・結果を確認する場合は以下を実行
    // logger.print()
}
```
上記を eslint にかけると、 [no-await-in-loop](https://eslint.org/docs/latest/rules/no-await-in-loop) の規則に引っかかってエラーになる。 await(非同期に実行可能な処理）を同期的に順次実行するので効率が悪いと言う指摘である。

## 並列処理版

上記と同等のプログラムを Promise.all() を使って書き直した。

```
async function testAsync() {
    const logger = new BufferdLogger()
    const numbers = await Promise.all<number>(Array.from(filenameGenerator(size)).map(async (filename) => {
        logger.log(`start process for file ${filename}`)
        const data = await readData(filename, logger)
        logger.log(
            `end process for file ${filename} result = ${JSON.stringify(data)}`,
        )
        return data.number as number
    }))
    logger.log(`numbers=${JSON.stringify(numbers)}`)
    // 実行順序を確認する場合は以下を実行
    // logger.print()
}
```

## 性能測定結果

以下により、Promise.all() を使用した方が3倍以上性能が良いことがわかった。

```
$ yarn start
yarn run v1.22.19
$ yarn build && node index.js
$ tsc -p tsconfig.json
elapstime for testSync() = 480ms
elapstime for testAsync() = 128ms
Done in 2.37s.
```

二度目の実行の場合やテストの順序により結果は変動するが総じて２倍以上の差があることは確認できている。また、ファイルの数が増えると差が開く傾向にある。