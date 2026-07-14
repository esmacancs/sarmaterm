// Function to generate the error HTML string
function generateErrorHtml (port) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Connection Error</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          line-height: 1.6;
          background: #fff;
          color: #333;
        }
        h1 {
          color: #d32f2f;
        }
        .section {
          margin-bottom: 20px;
        }
        ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .chinese {
          font-family: 'Noto Sans SC', sans-serif;
        }
        img {
          max-width: 200px;
        }
      </style>
    </head>
    <body>
      <div class="section">
        <h1>Connection Issue Detected</h1>
        <p>Unable to connect to the local server at http://127.0.0.1:${port}. This is often caused by applications (such as proxy software, VPNs, or network tools) intercepting or blocking localhost (127.0.0.1) traffic.</p>
        <p><strong>Suggested fixes:</strong></p>
        <ul>
          <li>Check if proxy software (e.g., Proxifier) is running. Ensure it excludes localhost (127.0.0.1) or this app's executable from proxying.</li>
          <li>Verify that VPNs or other network tools are not redirecting localhost traffic.</li>
          <li>Check firewall rules or antivirus software that might block local ports.</li>
        </ul>
        <p>Restart the app after making changes. If the problem persists, contact author: zxdong@gmail.com.</p>
      </div>

      <div class="section chinese">
        <h1>æ£€æµ‹åˆ°è¿žæŽ¥é—®é¢˜</h1>
        <p>æ— æ³•è¿žæŽ¥åˆ°æœ¬åœ°æœåŠ¡å™¨ http://127.0.0.1:${port}ã€‚è¿™é€šå¸¸æ˜¯ç”±äºŽåº”ç”¨ç¨‹åºï¼ˆå¦‚ä»£ç†è½¯ä»¶ã€VPN æˆ–ç½‘ç»œå·¥å…·ï¼‰æ‹¦æˆªæˆ–é˜»æ­¢äº†æœ¬åœ° (127.0.0.1) æµé‡ã€‚</p>
        <p><strong>å»ºè®®çš„è§£å†³æ–¹æ³•ï¼š</strong></p>
        <ul>
          <li>æ£€æŸ¥æ˜¯å¦æ­£åœ¨è¿è¡Œä»£ç†è½¯ä»¶ï¼ˆå¦‚ Proxifierï¼‰ã€‚ç¡®ä¿å…¶è®¾ç½®æŽ’é™¤æœ¬åœ°è¿žæŽ¥ (127.0.0.1) æˆ–æ­¤åº”ç”¨ç¨‹åºçš„å¯æ‰§è¡Œæ–‡ä»¶ã€‚</li>
          <li>ç¡®è®¤ VPN æˆ–å…¶ä»–ç½‘ç»œå·¥å…·æœªé‡å®šå‘æœ¬åœ°æµé‡ã€‚</li>
          <li>æ£€æŸ¥é˜²ç«å¢™è§„åˆ™æˆ–é˜²ç—…æ¯’è½¯ä»¶æ˜¯å¦é˜»æ­¢äº†æœ¬åœ°ç«¯å£ã€‚</li>
        </ul>
        <p>æ›´æ”¹è®¾ç½®åŽé‡å¯åº”ç”¨ç¨‹åºã€‚å¦‚æžœé—®é¢˜ä»ç„¶å­˜åœ¨ï¼Œè¯·è”ç³»ä½œè€…ï¼šzxdong@gmail.comã€‚</p>
        <p>
          <img
            src='https://sarmaterm.org/sarmaterm-wechat-group-qr.jpg'
          />
        </p>
      </div>
    </body>
    </html>
  `
}

module.exports = generateErrorHtml
