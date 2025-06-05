import { Command } from '@tauri-apps/plugin-shell';

export class SidecarService {
  private static instance: SidecarService;
  private sidecarProcess: any = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): SidecarService {
    if (!SidecarService.instance) {
      SidecarService.instance = new SidecarService();
    }
    return SidecarService.instance;
  }

  /**
   * 检查系统中是否已经存在 userbank_core_sse 进程
   */
  private async checkExistingProcess(): Promise<boolean> {
    try {
      // 检测操作系统类型
      const isWindows = navigator.userAgent.includes('Windows') || process.platform === 'win32';
      const isMacOS = navigator.userAgent.includes('Mac') || process.platform === 'darwin';
      
      let command: any;
      let processName: string;
      
      if (isWindows) {
        // Windows 系统使用 tasklist 命令
        processName = 'userbank_core_sse.exe';
        command = Command.create('tasklist', ['/FI', `IMAGENAME eq ${processName}`]);
      } else if (isMacOS) {
        // macOS 系统使用 ps 命令
        processName = 'userbank_core_sse';
        command = Command.create('ps', ['aux']);
      } else {
        // Linux 系统也使用 ps 命令
        processName = 'userbank_core_sse';
        command = Command.create('ps', ['aux']);
      }
      
      const output = await command.execute();
      
      if (output.stdout.includes(processName)) {
        console.log(`发现已存在的 ${processName} 进程`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('检查现有进程时出错:', error);
      // 如果检查失败，返回 false 继续启动流程
      return false;
    }
  }

  /**
   * 启动 userbank_core_sse sidecar
   */
  public async startSidecar(): Promise<void> {
    if (this.isRunning) {
      console.log('Sidecar 已经在运行中');
      return;
    }

    try {
      // 先检查系统中是否已经存在 userbank_core_sse 进程
      const processExists = await this.checkExistingProcess();
      if (processExists) {
        console.log('系统中已存在 userbank_core_sse 进程，跳过启动');
        this.isRunning = true; // 标记为运行状态，但不保存进程引用
        return;
      }

      console.log('正在启动 userbank_core_sse sidecar...');
      
      // 创建 sidecar 命令
      const command = Command.sidecar('binaries/userbank_core_sse');
      
      // 使用 spawn 方法启动进程，这样可以保持进程运行
      this.sidecarProcess = await command.spawn();
      this.isRunning = true;
      
      console.log('userbank_core_sse sidecar 启动成功');

      // 在 Tauri 2.0 中，我们可以简单地保持进程运行
      // 如果需要监听输出，可以使用 execute 方法或其他方式
      console.log('Sidecar 进程 PID:', this.sidecarProcess.pid);

    } catch (error) {
      console.error('启动 sidecar 失败:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * 停止 sidecar
   */
  public async stopSidecar(): Promise<void> {
    if (!this.isRunning) {
      console.log('Sidecar 未运行');
      return;
    }

    try {
      console.log('正在停止 sidecar...');
      
      if (this.sidecarProcess) {
        // 如果有进程引用，直接终止
        await this.sidecarProcess.kill();
      } else {
        // 如果没有进程引用（可能是检测到已存在的进程），使用系统命令终止
        const isWindows = navigator.userAgent.includes('Windows') || process.platform === 'win32';
        
        if (isWindows) {
          // Windows 系统使用 taskkill 命令
          const command = Command.create('taskkill', ['/F', '/IM', 'userbank_core_sse.exe']);
          await command.execute();
        } else {
          // macOS 和 Linux 系统使用 pkill 命令
          const command = Command.create('pkill', ['-f', 'userbank_core_sse']);
          await command.execute();
        }
      }
      
      this.isRunning = false;
      this.sidecarProcess = null;
      console.log('Sidecar 已停止');
    } catch (error) {
      console.error('停止 sidecar 失败:', error);
      throw error;
    }
  }

  /**
   * 检查 sidecar 是否正在运行
   */
  public getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 获取 sidecar 进程
   */
  public getProcess(): any {
    return this.sidecarProcess;
  }

  /**
   * 向 sidecar 发送数据
   */
  public async sendToSidecar(data: string): Promise<void> {
    if (!this.isRunning || !this.sidecarProcess) {
      throw new Error('Sidecar 未运行');
    }

    try {
      // 在 Tauri 2.0 中，如果需要与 sidecar 通信，
      // 通常使用其他方式如 HTTP、WebSocket 或文件系统
      console.log('发送数据到 sidecar:', data);
      // 这里可以根据你的 sidecar 实现来选择通信方式
    } catch (error) {
      console.error('向 sidecar 发送数据失败:', error);
      throw error;
    }
  }
}

export default SidecarService; 