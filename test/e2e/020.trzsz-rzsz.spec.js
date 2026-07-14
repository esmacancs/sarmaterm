/**
 * trzsz / rzsz file-transfer test
 *
 * Tests all four transfer commands in a single SSH session:
 *   â€¢ trz  â€“ trzsz upload   (local â†’ remote)
 *   â€¢ tsz  â€“ trzsz download (remote â†’ local)
 *   â€¢ rz   â€“ rzsz upload    (local â†’ remote)
 *   â€¢ sz   â€“ rzsz download  (remote â†’ local)
 *
 * Prerequisites on the remote host:
 *   â€¢ trzsz package installed  (provides trz / tsz)
 *   â€¢ lrzsz package installed  (provides rz  / sz )
 *
 * Uses window._apiControlSelectFile  to bypass the native file-picker dialog.
 * Uses window._apiControlSelectFolder to bypass the native folder-picker dialog.
 */

const { _electron: electron } = require('@playwright/test')
const { test: it } = require('@playwright/test')
const { describe } = it
it.setTimeout(10000000)

const os = require('os')
const fs = require('fs')
const path = require('path')

const delay = require('./common/wait')
const log = require('./common/log')
const appOptions = require('./common/app-options')
const extendClient = require('./common/client-extend')
const { expect } = require('./common/expect')
const { setupSshConnection, closeApp } = require('./common/common')

// â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Read the last `lines` lines of the active terminal via the store API. */
async function getTerminalText (client, lines = 200) {
  const result = await client.evaluate((n) => {
    return window.store.mcpGetTerminalOutput({ lines: n })
  }, lines)
  return result ? result.output : ''
}

/**
 * Count occurrences of `marker` in current terminal output.
 * Used as a baseline before issuing a transfer command so we can detect
 * when a *new* occurrence appears.
 */
async function countMarkerInTerminal (client, marker, lines = 200) {
  const content = await getTerminalText(client, lines)
  return (content.match(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
}

/**
 * Poll terminal output until the count of `marker` exceeds `baseline`.
 * This lets us distinguish a *new* transfer completion from text left over
 * by a previous transfer.
 */
async function waitForNewMarker (client, marker, baseline, timeout = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const count = await countMarkerInTerminal(client, marker)
    if (count > baseline) return true
    await delay(1500)
  }
  const lastContent = await getTerminalText(client)
  throw new Error(
    `Timeout (${timeout}ms) waiting for new "${marker}" (baseline ${baseline})\nLast terminal content:\n${lastContent}`
  )
}

/** Type a shell command and press Enter in the active terminal. */
async function runInTerminal (client, cmd) {
  await client.click('.session-current .term-wrap')
  await delay(400)
  await client.keyboard.type(cmd)
  await client.keyboard.press('Enter')
  await delay(500)
}

// â”€â”€â”€ transfer helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function testTrz (client, localFile) {
  log('020: testing trz (trzsz upload) â€¦')
  const baseline = await countMarkerInTerminal(client, '[DONE]')
  await client.evaluate((file) => {
    window._apiControlSelectFile = [file]
  }, localFile)
  await runInTerminal(client, 'trz')
  await waitForNewMarker(client, '[DONE]', baseline, 60000)
  log('020: trz done')
}

async function testTsz (client, remoteFile, saveDir) {
  log('020: testing tsz (trzsz download) â€¦')
  const baseline = await countMarkerInTerminal(client, '[DONE]')
  await client.evaluate((dir) => {
    window._apiControlSelectFolder = dir
  }, saveDir)
  await runInTerminal(client, `tsz ${remoteFile}`)
  await waitForNewMarker(client, '[DONE]', baseline, 60000)
  // Verify at least one file arrived in the save dir
  const files = fs.readdirSync(saveDir)
  expect(files.length).greaterThan(0)
  log('020: tsz done')
}

async function testRz (client, localFile) {
  log('020: testing rz (rzsz upload) â€¦')
  const baseline = await countMarkerInTerminal(client, '[DONE]')
  await client.evaluate((file) => {
    window._apiControlSelectFile = [file]
  }, localFile)
  await runInTerminal(client, 'rz')
  await waitForNewMarker(client, '[DONE]', baseline, 60000)
  log('020: rz done')
}

async function testSz (client, remoteFile, saveDir) {
  log('020: testing sz (rzsz download) â€¦')
  const baseline = await countMarkerInTerminal(client, '[DONE]')
  await client.evaluate((dir) => {
    window._apiControlSelectFolder = dir
  }, saveDir)
  await runInTerminal(client, `sz ${remoteFile}`)
  await waitForNewMarker(client, '[DONE]', baseline, 60000)
  // Verify at least one file arrived in the save dir
  const files = fs.readdirSync(saveDir)
  expect(files.length).greaterThan(0)
  log('020: sz done')
}

// â”€â”€â”€ test â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('trzsz-rzsz-transfer', function () {
  it('should transfer files using trz / tsz / rz / sz', async function () {
    const electronApp = await electron.launch(appOptions)
    const client = await electronApp.firstWindow()
    extendClient(client, electronApp)
    await delay(3500)
    log('020: app launched')

    await setupSshConnection(client)
    await delay(5000)
    log('020: SSH connected')

    const timestamp = Date.now()
    const trzszTestFileName = `trzsz-upload-${timestamp}.txt`
    const rzszUploadFileName = `rzsz-upload-${timestamp}.txt`

    const trzszLocalFile = path.join(os.tmpdir(), trzszTestFileName)
    const rzszLocalFile = path.join(os.tmpdir(), rzszUploadFileName)

    const trzszSaveDir = path.join(os.tmpdir(), `trzsz-save-${timestamp}`)
    const rzszSaveDir = path.join(os.tmpdir(), `rzsz-save-${timestamp}`)

    // Create local files used for uploads
    fs.writeFileSync(trzszLocalFile, `sarmaterm trzsz test ${timestamp}`)
    fs.writeFileSync(rzszLocalFile, `sarmaterm rzsz test ${timestamp}`)
    fs.mkdirSync(trzszSaveDir, { recursive: true })
    fs.mkdirSync(rzszSaveDir, { recursive: true })
    log(`020: local test files created: ${trzszLocalFile}, ${rzszLocalFile}`)

    // â”€â”€ trz â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await testTrz(client, trzszLocalFile)
    await delay(2000)

    // â”€â”€ tsz â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Download the file that was just uploaded via trz
    const trzszRemoteFile = `~/${trzszTestFileName}`
    await testTsz(client, trzszRemoteFile, trzszSaveDir)
    await delay(2000)

    // Create a remote-only file for sz to download (distinct from any upload)
    const rzszRemoteName = `rzsz-download-${timestamp}.txt`
    const rzszRemoteFile = `~/${rzszRemoteName}`
    await runInTerminal(client, `echo "rzsz download test ${timestamp}" > ${rzszRemoteFile}`)
    await delay(1500)

    // â”€â”€ rz â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Upload a *different* file from a fresh local path so the remote does not
    // already have it (lrzsz crashes when it tries to skip an existing file).
    await testRz(client, rzszLocalFile)
    await delay(2000)

    // â”€â”€ sz â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await testSz(client, rzszRemoteFile, rzszSaveDir)
    await delay(2000)

    // Cleanup local temp files
    try { fs.unlinkSync(trzszLocalFile) } catch (_) {}
    try { fs.unlinkSync(rzszLocalFile) } catch (_) {}

    await closeApp(electronApp, __filename)
    log('020: all transfer tests passed')
  })
})
