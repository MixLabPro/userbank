import { resourceDir, join, homeDir, dataDir } from '@tauri-apps/api/path';
import { readTextFile, exists, writeTextFile } from '@tauri-apps/plugin-fs';

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

export const getHomeDir = async (): Promise<string> => {
    const home = await homeDir();
    return home;
};

export const getCursorConfig = async (): Promise<string> => {
    try {
        const home = await getHomeDir();
        const cursorConfig = await join(home, '.cursor', 'mcp.json');
        console.log("cursorConfig", cursorConfig);
        
        if (await exists(cursorConfig)) {
            const cursorConfigContent = await readTextFile(cursorConfig);
            console.log("cursorConfigContent", cursorConfigContent);
            return cursorConfigContent;
        } else {
            console.log("Cursor配置文件不存在:", cursorConfig);
            return '';
        }
    } catch (error) {
        console.error('读取Cursor配置文件失败:', error);
        return '';
    }
};

export const writeCursorConfig = async (config: MCPServersConfig): Promise<void> => {
    try {
        const home = await getHomeDir();
        const cursorConfigPath = await join(home, '.cursor', 'mcp.json');
        
        // 检查Cursor配置文件是否存在
        if (!(await exists(cursorConfigPath))) {
            throw new Error('Cursor配置文件不存在，请确保已安装Cursor编辑器');
        }
        
        let existingConfig: any = {};
        
        // 读取现有配置
        const existingConfigContent = await readTextFile(cursorConfigPath);
        try {
            existingConfig = JSON.parse(existingConfigContent);
        } catch (parseError) {
            console.warn('解析现有Cursor配置失败，将创建新配置:', parseError);
            existingConfig = {};
        }
        
        // 确保 mcpServers 对象存在
        if (!existingConfig.mcpServers) {
            existingConfig.mcpServers = {};
        }
        
        // 插入或替换 userbank 配置
        existingConfig.mcpServers['userbank-sse'] = config.mcpServers['userbank-sse'];
        existingConfig.mcpServers['userbank-stdio'] = config.mcpServers['userbank-stdio'];
        
        // 写入更新后的配置
        const updatedConfigContent = JSON.stringify(existingConfig, null, 2);
        await writeTextFile(cursorConfigPath, updatedConfigContent);
        
        console.log('Cursor配置已更新:', cursorConfigPath);
    } catch (error) {
        console.error('写入Cursor配置文件失败:', error);
        throw error;
    }
};

export const writeClaudeConfig = async (config: MCPServersConfig): Promise<void> => {
    try {
        const dataDirectory = await dataDir();
        console.log("dataDirectory", dataDirectory);
        const claudeConfigPath = await join(dataDirectory, 'Claude', 'claude_desktop_config.json');
        
        // 检查Claude配置文件是否存在
        if (!(await exists(claudeConfigPath))) {
            throw new Error('Claude配置文件不存在，请确保已安装Claude Desktop应用');
        }
        
        let existingConfig: any = {};
        
        // 读取现有配置
        const existingConfigContent = await readTextFile(claudeConfigPath);
        try {
            existingConfig = JSON.parse(existingConfigContent);
        } catch (parseError) {
            console.warn('解析现有Claude配置失败，将创建新配置:', parseError);
            existingConfig = {};
        }
        
        // 确保 mcpServers 对象存在
        if (!existingConfig.mcpServers) {
            existingConfig.mcpServers = {};
        }
        
        // 插入或替换 userbank 配置
        existingConfig.mcpServers['userbank-sse'] = config.mcpServers['userbank-sse'];
        existingConfig.mcpServers['userbank-stdio'] = config.mcpServers['userbank-stdio'];
        
        // 写入更新后的配置
        const updatedConfigContent = JSON.stringify(existingConfig, null, 2);
        await writeTextFile(claudeConfigPath, updatedConfigContent);
        
        console.log('Claude配置已更新:', claudeConfigPath);
    } catch (error) {
        console.error('写入Claude配置文件失败:', error);
        throw error;
    }
}

