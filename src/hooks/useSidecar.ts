import { useEffect, useState } from 'react';
import SidecarService from '../services/SidecarService';

export const useSidecar = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sidecarService = SidecarService.getInstance();

  useEffect(() => {
    // 应用启动时自动启动 sidecar
    const startSidecar = async () => {
      try {
        await sidecarService.startSidecar();
        setIsRunning(true);
        setError(null);
      } catch (err) {
        console.error('启动 sidecar 失败:', err);
        setError(err instanceof Error ? err.message : '启动 sidecar 失败');
        setIsRunning(false);
      }
    };

    startSidecar();

    // 清理函数：应用关闭时停止 sidecar
    return () => {
      if (sidecarService.getIsRunning()) {
        sidecarService.stopSidecar().catch(console.error);
      }
    };
  }, []);

  const startSidecar = async () => {
    try {
      await sidecarService.startSidecar();
      setIsRunning(true);
      setError(null);
    } catch (err) {
      console.error('启动 sidecar 失败:', err);
      setError(err instanceof Error ? err.message : '启动 sidecar 失败');
      setIsRunning(false);
    }
  };

  const stopSidecar = async () => {
    try {
      await sidecarService.stopSidecar();
      setIsRunning(false);
      setError(null);
    } catch (err) {
      console.error('停止 sidecar 失败:', err);
      setError(err instanceof Error ? err.message : '停止 sidecar 失败');
    }
  };

  const sendToSidecar = async (data: string) => {
    try {
      await sidecarService.sendToSidecar(data);
      setError(null);
    } catch (err) {
      console.error('发送数据到 sidecar 失败:', err);
      setError(err instanceof Error ? err.message : '发送数据失败');
    }
  };

  return {
    isRunning,
    error,
    startSidecar,
    stopSidecar,
    sendToSidecar,
    sidecarService
  };
};

export default useSidecar; 