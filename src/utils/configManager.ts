import { resourceDir, join } from '@tauri-apps/api/path';
import { readTextFile, exists } from '@tauri-apps/plugin-fs';

// 配置文件数据结构
export interface ConfigData {
  database: {
    path: string;
    filename: string;
  };
  server: {
    port: number;
    host: string;
  };
  system: {
    timezone_offset: number;
    privacy_level: string;
  };
}

// MCP服务器配置结构
export interface MCPServersConfig {
  mcpServers: {
    'userbank-sse': {
      url: string;
    };
    'userbank-stdio': {
      command: string;
    };
  };
}

// 获取资源目录路径和配置文件
export const getResourceDirAndConfig = async (): Promise<{
  resourceDirPath: string;
  configData: ConfigData | null;
  configError: string;
}> => {
  try {
    const path = await resourceDir();
    
    // 读取配置文件
    const configPath = await join(path, 'config.json');
    const configExists = await exists(configPath);

    console.log("configPath", configPath);
    
    if (configExists) {
      const configContent = await readTextFile(configPath);
      const parsedConfig = JSON.parse(configContent) as ConfigData;
      console.log("parsedConfig", parsedConfig);
      
      return {
        resourceDirPath: path,
        configData: parsedConfig,
        configError: ''
      };
    } else {
      return {
        resourceDirPath: path,
        configData: null,
        configError: '配置文件不存在'
      };
    }
  } catch (error) {
    console.error('获取资源目录路径或读取配置文件失败:', error);
    return {
      resourceDirPath: '获取路径失败',
      configData: null,
      configError: `读取配置文件失败: ${error}`
    };
  }
};

// 获取MCP URL
export const getMCPUrl = (configData: ConfigData | null): string => {
  const defaultPort = 8088;
  const port = configData?.server?.port || defaultPort;
  return `http://127.0.0.1:${port}/sse`;
};

// 获取可执行文件路径
export const getExecutablePath = async (resourceDirPath: string): Promise<string> => {
  try {
    const isWindows = navigator.platform.toLowerCase().includes('win');
    const executableName = isWindows ? 'UserBank_Stdio_Core.exe' : 'UserBank_Stdio_Core';
    const executablePath = await join(resourceDirPath, executableName);
    return executablePath;
  } catch (error) {
    console.error('获取可执行文件路径失败:', error);
    return '';
  }
};

// 构建MCP服务器配置
export const buildMCPServersConfig = async (
  configData: ConfigData | null,
  resourceDirPath: string
): Promise<MCPServersConfig> => {
  const mcpUrl = getMCPUrl(configData);
  const executablePath = await getExecutablePath(resourceDirPath);
  
  return {
    mcpServers: {
      'userbank-sse': {
        url: mcpUrl
      },
      'userbank-stdio': {
        command: executablePath
      }
    }
  };
}; 