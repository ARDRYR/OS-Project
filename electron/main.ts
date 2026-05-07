import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, ChildProcess } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Vite 환경 변수 설정
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let backendProcess: ChildProcess | null = null

import { execSync } from 'node:child_process'
import fs from 'node:fs'

function startBackend() {
  const isDev = !!VITE_DEV_SERVER_URL
  const backendDir = path.join(process.env.APP_ROOT, 'backend')
  
  let executablePath = ''
  let args: string[] = []

  if (isDev) {
    // [개발 환경]: 가상환경의 파이썬으로 app.py 실행
    const venvDir = path.join(backendDir, '.venv')
    const isWindows = process.platform === 'win32'
    const venvPython = isWindows 
      ? path.join(venvDir, 'Scripts', 'python.exe')
      : path.join(venvDir, 'bin', 'python')

    // 가상환경 자동 생성 로직 (기존 코드 유지)
    if (!fs.existsSync(venvPython)) {
      console.log('📦 Virtual environment not found. Setting up...')
      try {
        let systemPython = 'python'
        try { execSync('py --version', { stdio: 'ignore' }); systemPython = 'py' } catch {
          try { execSync('python3 --version', { stdio: 'ignore' }); systemPython = 'python3' } catch { systemPython = 'python' }
        }
        execSync(`${systemPython} -m venv .venv`, { cwd: backendDir })
        execSync(`${venvPython} -m pip install -r requirements.txt`, { cwd: backendDir })
      } catch (error) {
        console.error('❌ Failed to setup backend environment:', error)
      }
    }
    executablePath = venvPython
    args = [path.join(backendDir, 'app.py')]
  } else {
    // [빌드된 환경]: 파이썬 없이 app.exe만 직접 실행 (가장 중요한 수정 포인트!)
    // package.json의 extraResources 설정에 의해 이 위치에 저장됩니다.
    executablePath = path.join(process.resourcesPath, 'app.exe')
    args = [] // exe 파일은 인자가 필요 없습니다.
  }

  console.log('🚀 Starting Backend...', executablePath)

  // cwd는 빌드 시 resources 폴더로 설정해야 에러가 나지 않습니다.
  backendProcess = spawn(executablePath, args, {
    cwd: isDev ? backendDir : process.resourcesPath
  })

  backendProcess.stdout?.on('data', (data) => console.log(`[Backend]: ${data}`))
  backendProcess.stderr?.on('data', (data) => console.error(`[Backend Error]: ${data}`))
  backendProcess.on('close', (code) => console.log(`[Backend] process exited with code ${code}`))
}

function createWindow() {
  win = new BrowserWindow({
    title: 'Pokemon OS Scheduler Simulator',
    icon: path.join(process.env.VITE_PUBLIC, 'images', 'pokeball-logo.png'),
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
    autoHideMenuBar: true,
  })

  if (VITE_DEV_SERVER_URL) {
    // 개발 모드: Vite 서버에서 불러옴
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // 빌드 모드: 파일 시스템에서 직접 불러옴
    // path.join을 사용해 RENDERER_DIST 안의 index.html을 절대 경로로 로드합니다.
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  startBackend()
  createWindow()
})

