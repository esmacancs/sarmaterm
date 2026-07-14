import { osResolve } from './resolve'

export default function () {
  return window.et.sessionLogPath || osResolve(window.store.appPath, 'sarmaterm', 'session_logs')
}
