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
   * 启动 userbank_core_sse sidecar
   */
  public async startSidecar(): Promise<void> {
    if (this.isRunning) {
      console.log('Sidecar 已经在运行中');
      return;
    }

    try {
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
    if (!this.isRunning || !this.sidecarProcess) {
      console.log('Sidecar 未运行');
      return;
    }

    try {
      console.log('正在停止 sidecar...');
      await this.sidecarProcess.kill();
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