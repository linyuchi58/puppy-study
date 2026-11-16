# 英語單字闖關：字庫來源與授權

《汪汪小精靈》學習伙伴版的英語單字闖關（study_data/vocab_ceec.json）由下列開放原始碼資料整理而成。
三份資料都是 MIT 授權，可以免費使用、修改與散布，條件是保留下面的著作權聲明與授權條款。

| 內容 | 來源 | 授權 |
|---|---|---|
| 單字清單與 Level 1～6 分級（大學入學考試中心「高中英文參考詞彙表」111 學年度起適用，共 6004 筆；其中 3 筆在原始資料裡兩個字黏在一起，拆開後共 6007 字） | [fuuhakugetsurei/vocab-learning-system](https://github.com/fuuhakugetsurei/vocab-learning-system) 的 `src/data/ceec-vocab.json` | MIT，Copyright (c) 2026 fuuhakugetsurei |
| 中文釋義與音標（取前 1～3 個意思，依官方詞性排序，再用 OpenCC 轉成台灣用語） | [skywind3000/ECDICT](https://github.com/skywind3000/ECDICT)（經 fuuhakugetsurei 轉成繁體的 `local-dict.json`） | MIT，Copyright (c) 2025 Linwei |
| Level 3～5 約 2000 字的例句與翻譯（例句填空題） | [Clydinite/GSAT-7000-Anki](https://github.com/Clydinite/GSAT-7000-Anki) 的 `data/raw/level*.tsv` | MIT，Copyright (c) 2026 Clydinite |
| 同一級裡的出題順序（常用字先學） | [wordfreq](https://github.com/rspeer/wordfreq) 的英文字頻（只用來排序，沒有收錄它的資料） | — |

另外 72 個常用字（can、will、lot…）的中文釋義由 Claude 手動修正；30 個字典裡查不到或原始資料合併錯誤的字（accomplish、download、online…）由 Claude 補上釋義。

英檢對照僅供參考：Level 1～2 約等於全民英檢初級，Level 3～4 約中級，Level 5～6 約中高級（不是 LTTC 官方字表）。

---

## MIT License（三份資料相同的授權條款）

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 網頁版用到的程式庫

| 檔案 | 用途 | 來源 | 授權 |
|---|---|---|---|
| `qrcode.js` | 產生 QR Code（家長蓋章、打字測驗成績） | [kazuhikoarase/qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) | MIT，Copyright (c) 2009 Kazuhiko Arase |
| `jsqr.js` 1.4.0 | 教師頁用相機讀 QR Code（全部在老師自己的裝置上處理，不上傳） | [cozmo/jsQR](https://github.com/cozmo/jsQR) | Apache License 2.0，全文見 `jsqr_LICENSE.txt` |

注音鍵位採用標準大千式排列（微軟注音預設），練習題目由程式隨機產生，沒有使用外部字表。

中文打字的題目（`zh_texts.js`：詞語、短句、短文）全部是 Claude 為本專案新寫的原創文字，沒有取自任何書籍或網站。
