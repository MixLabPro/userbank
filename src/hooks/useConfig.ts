import { useState, useEffect } from 'react';
import { readTextFile, exists } from '@tauri-apps/plugin-fs';
import { resolveResource } from '@tauri-apps/api/path';

interface Config {
  [key: string]: any;
}

export const useConfig = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 尝试从资源目录读取 config.json
      const configPath = await resolveResource('config.json');
      
      // 检查文件是否存在
      const fileExists = await exists(configPath);
      
      if (!fileExists) {
        throw new Error('配置文件 config.json 不存在');
      }
      
      // 读取文件内容
      const configContent = await readTextFile(configPath);
      
      // 解析 JSON
      const parsedConfig = JSON.parse(configContent);
      
      setConfig(parsedConfig);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '读取配置文件失败';
      setError(errorMessage);
      console.error('读取配置文件错误:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshConfig = () => {
    loadConfig();
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    loading,
    error,
    refreshConfig
  };
}; 