/**
 * read themes from https://github.com/mbadolato/iTerm2-Color-Schemes/tree/master/sarmaterm
 */

exports.listItermThemes = async () => {
  const all = require('@electerm/electerm-themes/dist/index.js')
  return Promise.all(all).catch(e => {
    console.log(e)
    return []
  })
}
