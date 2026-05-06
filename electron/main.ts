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

function startBackend() {
  const isDev = !!VITE_DEV_SERVER_URL
  
  // 개발 환경에서는 .venv 내의 python.exe를 사용
  // 빌드 후 배포 환경에서는 별도의 처리가 필요할 수 있음
  const pythonPath = isDev 
    ? path.join(process.env.APP_ROOT, 'backend', '.venv', 'Scripts', 'python.exe')
    : path.join(process.env.APP_ROOT, 'backend', 'dist', 'app.exe') // 예시
    
  const scriptPath = path.join(process.env.APP_ROOT, 'backend', 'app.py')

  console.log('🚀 Starting Backend...', pythonPath, scriptPath)

  backendProcess = spawn(pythonPath, [scriptPath], {
    cwd: path.join(process.env.APP_ROOT, 'backend'),
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
