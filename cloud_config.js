// 《汪汪小精靈 學習小伙伴》雲端同步設定（v3.9.0 起）
// scriptUrl 填好，學生在「搬家碼／備份」那一頁才會看到雲端同步（同步碼、信箱註冊）；clientId 有填才多一顆 Google 登入。
//   clientId ：Google Cloud「OAuth 用戶端 ID」（網頁應用程式），像 123-abc.apps.googleusercontent.com
//   scriptUrl：試算表裡 Apps Script 部署成「網頁應用程式」後的網址，像 https://script.google.com/macros/s/…/exec
// 設定方法請看《雲端同步/雲端同步設定說明.md》
window.PUPPY_CLOUD = {
  clientId: '1042888099911-qa77hmok51ks43gcm4rl2qc40l2on817.apps.googleusercontent.com',
  scriptUrl: ''   // v3.9.1：等老師用專用 Gmail（taiwan77@gmail.com）部署新版 Code.gs 後填入
};
