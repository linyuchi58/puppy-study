// 《汪汪小精靈 學習小伙伴》詞庫過濾（v3.9.4）
// 詞庫是大考中心「高中英文參考詞彙表」，有些字不適合國小學生（老師 11-24 提出：例如 gay）。
// 這個檔案在 vocab_data.js 之後載入：把下面的字從詞庫拿掉（英語闖關、單字挑戰、打字練習都不會再出現），
// 並把幾個一般字裡不雅的中文解釋改掉。要再加字，直接加進 BLOCK 就好（小寫）。
(function () {
  'use strict';
  const BLOCK = [
    // 性、身體
    'gay', 'lesbian', 'homosexual', 'heterosexual', 'sex', 'sexy', 'sexual', 'naked', 'nude', 'seduce',
    'breast', 'virgin', 'pregnant', 'pregnancy', 'abortion', 'mistress',
    // 毒品、自殺、賭場
    'cocaine', 'heroin', 'suicide', 'casino',
    // 常被拿來罵人
    'ass', 'idiot'
  ];
  // 一般字，但中文解釋裡有不適合的意思：改成只留適合的
  const GLOSS = {
    goose: '鵝；雌鵝',
    stale: '不新鮮的；陳腐的',
    drug: '藥；藥品',
    maiden: '未婚的；少女；第一次的',
    hell: '地獄',
    go: '去；走；進行',
    game: '比賽；遊戲；玩耍'
  };
  const V = window.VOCAB_CEEC;
  if (!V || !Array.isArray(V.words)) return;
  const bad = new Set(BLOCK);
  V.words = V.words.filter(w => !bad.has(String(w.s || w.w || '').toLowerCase()) && !bad.has(String(w.w || '').toLowerCase()));
  V.words.forEach(w => {
    const k = String(w.s || w.w || '').toLowerCase();
    if (GLOSS[k]) w.z = GLOSS[k];
  });
  window.PUPPY_VOCAB_BLOCK = BLOCK.slice();
})();
