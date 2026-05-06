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
  const venvDir = path.join(backendDir, '.venv')
  
  let pythonPath = ''

  if (isDev) {
    const isWindows = process.platform === 'win32'
    const venvPython = isWindows 
      ? path.join(venvDir, 'Scripts', 'python.exe')
      : path.join(venvDir, 'bin', 'python')

    // 가상환경이 없거나 파이썬 실행 파일이 없는 경우 생성 시도
    if (!fs.existsSync(venvPython)) {
      console.log('📦 Virtual environment not found. Setting up...')
      try {
        // 시스템 파이썬 찾기 (py -> python3 -> python 순서)
        let systemPython = 'python'
        try {
          execSync('py --version', { stdio: 'ignore' })
          systemPython = 'py'
        } catch {
          try {
            execSync('python3 --version', { stdio: 'ignore' })
            systemPython = 'python3'
          } catch {
            execSync('python --version', { stdio: 'ignore' })
            systemPython = 'python'
          }
        }

        console.log(`🔨 Creating venv using ${systemPython}...`)
        execSync(`${systemPython} -m venv .venv`, { cwd: backendDir })
        
        console.log('📥 Installing dependencies...')
        execSync(`${venvPython} -m pip install -r requirements.txt`, { cwd: backendDir })
      } catch (error) {
        console.error('❌ Failed to setup backend environment:', error)
      }
    }
    pythonPath = venvPython
  } else {
    // 빌드된 환경
    pythonPath = path.join(process.env.APP_ROOT, 'backend', 'dist', 'app.exe')
  }

  const scriptPath = path.join(backendDir, 'app.py')

  console.log('🚀 Starting Backend...', pythonPath)

  backendProcess = spawn(pythonPath, [scriptPath], {
    cwd: backendDir,
    shell: true
  })

  backendProcess.stdout?.on('data', (data) => {
    console.log(`[Backend]: ${data}`)
  })

  backendProcess.stderr?.on('data', (data) => {
    console.error(`[Backend Error]: ${data}`)
  })

  backendProcess.on('close', (code) => {
    console.log(`[Backend] process exited with code ${code}`)
  })
}

function createWindow() {
  win = new BrowserWindow({
    title: 'Pokemon OS Scheduler Simulator',
    icon: path.join(process.env.VITE_PUBLIC, 'images', '몬스터볼로고.png'),
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
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
