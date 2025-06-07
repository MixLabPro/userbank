import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Calendar, Tag, BarChart3, Plus, Edit2, Trash2, RefreshCw, AlertCircle, Database, Table, X, Check, Settings, Download, CheckCircle, Power } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import { listen } from '@tauri-apps/api/event';

import { useProfile } from '../hooks/useProfile';
import { useProfileSQL } from '../hooks/useProfileSQL';
import { useSidecar } from '../hooks/useSidecar';
import { 
  TABLE_TO_TOOL_MAP,
  getTableName,
  getTableDescription
} from '../utils/tableMapping';
import { 
  formatTime, 
  getTagColor, 
  filterRecords, 
  getAllTags,
  createEmptyProfileData 
} from '../utils/dataTransform';
import AddRecordModal from '../components/AddRecordModal';
import EditRecordModal from '../components/EditRecordModal';
import SQLQueryPanel from '../components/SQLQueryPanel';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getResourceDirAndConfig, buildMCPServersConfig, MCPServersConfig, writeCursorConfig, writeClaudeConfig } from '../utils/configManager';

type ViewMode = 'table' | 'sql';

const Index = () => {
  const { t } = useTranslation();
  const [activeTable, setActiveTable] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [deletingRecord, setDeletingRecord] = useState<any>(null);
  const [deletedRecords, setDeletedRecords] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [mcpServersConfig, setMcpServersConfig] = useState<MCPServersConfig | null>(null);
  const [isAddingToCursor, setIsAddingToCursor] = useState(false);
  const [isAddingToClaude, setIsAddingToClaude] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // 升级相关状态
  const [currentVersion, setCurrentVersion] = useState('');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  
  // 开机启动相关状态
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [isCheckingAutostart, setIsCheckingAutostart] = useState(false);
  
  // 启动 sidecar 服务
  const { isRunning: sidecarRunning, error: sidecarError } = useSidecar();

  // 获取资源目录路径和配置文件的函数
  const loadConfigData = async () => {
    try {
      const { resourceDirPath: path, configData: config} = await getResourceDirAndConfig();

      
      // 构建MCP服务器配置
      if (config && path) {
        const mcpConfig = await buildMCPServersConfig(config, path);
        setMcpServersConfig(mcpConfig);
      }
    } catch (error) {
      console.error('加载配置数据失败:', error);
    }
  };

  // 初始化时获取资源目录路径和配置文件
  useEffect(() => {
    loadConfigData();
    
    // 获取当前版本号
    const initVersion = async () => {
      try {
        const version = await getVersion();
        setCurrentVersion(version);
      } catch (error) {
        console.error('获取版本号失败:', error);
      }
    };
    initVersion();

    // 检查开机启动状态
    const checkAutostart = async () => {
      try {
        // 动态导入 autostart 插件
        const { isEnabled } = await import('@tauri-apps/plugin-autostart');
        const enabled = await isEnabled();
        setAutostartEnabled(enabled);
      } catch (error) {
        console.error('检查开机启动状态失败:', error);
      }
    };
    checkAutostart();

    // 监听下载进度事件
    const unlistenProgress = listen('download-progress', (event: any) => {
      const { progress } = event.payload;
      setDownloadProgress(progress);
    });

    // 监听下载完成事件
    const unlistenComplete = listen('download-complete', () => {
      setIsDownloading(false);
      showToast('success', t('updater.downloadComplete'));
    });

    return () => {
      unlistenProgress.then(fn => fn());
      unlistenComplete.then(fn => fn());
    };
  }, [t]);
  
  // 使用 MCP 服务获取数据
  const { data: profileData, loading, error, refreshData } = useProfile();
  
  // 使用 SQL 查询获取数据
  const { 
    data: sqlData, 
    loading: sqlLoading, 
    error: sqlError, 
    refreshData: refreshSQLData,
    updateRecord,
    deleteRecord
  } = useProfileSQL();
  
  // 根据视图模式选择数据源
  const tableData = useMemo(() => {
    if (viewMode === 'sql' && sqlData) {
      return sqlData;
    }
    return profileData || createEmptyProfileData((tableName: string) => getTableDescription(tableName, t));
  }, [viewMode, sqlData, profileData, t]);

  // 获取所有表格名称和统计信息
  const tableStats = useMemo(() => {
    const stats = Object.keys(TABLE_TO_TOOL_MAP).map((key) => {
      const tableInfo = tableData[key as keyof typeof tableData];
      const count = tableInfo && typeof tableInfo === 'object' && 'stats' in tableInfo 
        ? tableInfo.stats.total_records 
        : 0;
      
      return {
        key,
        name: getTableName(key, t),
        count
      };
    });
    
    // 添加"全部"选项
    const totalCount = stats.reduce((sum, stat) => sum + stat.count, 0);
    return [
      { key: 'all', name: t('common.all'), count: totalCount },
      ...stats
    ];
  }, [tableData, t]);

  // 获取当前激活表格的数据
  const currentTableData = useMemo(() => {
    if (activeTable === 'all') {
      // 如果选择了"全部"，合并所有表格的记录
      const allRecords: any[] = [];
      Object.keys(TABLE_TO_TOOL_MAP).forEach((tableKey) => {
        const tableInfo = tableData[tableKey as keyof typeof tableData];
        if (tableInfo && typeof tableInfo === 'object' && 'records' in tableInfo) {
          tableInfo.records.forEach((record: any) => {
            allRecords.push({
              ...record,
              uniqueKey: `${tableKey}-${record.id}`,
              sourceTable: tableKey,
              sourceTableName: getTableName(tableKey, t)
            });
          });
        }
      });
      
      return {
        description: t('common.allRecords'),
        records: allRecords,
        stats: { total_records: allRecords.length }
      };
    }
    
    const tableInfo = tableData[activeTable as keyof typeof tableData];
    if (tableInfo && typeof tableInfo === 'object' && 'records' in tableInfo) {
      return tableInfo;
    }
    
    return { 
      description: getTableDescription(activeTable, t),
      records: [], 
      stats: { total_records: 0 }
    };
  }, [tableData, activeTable, t]);

  // 获取所有标签
  const allTags = useMemo(() => {
    return getAllTags(tableData);
  }, [tableData]);

  // 过滤记录
  const filteredRecords = useMemo(() => {
    return filterRecords(currentTableData.records, searchTerm, selectedTag, deletedRecords);
  }, [currentTableData.records, searchTerm, selectedTag, deletedRecords]);

  // 处理SQL查询结果更新
  const handleSQLDataUpdate = (sqlResults: any[]) => {
    console.log('SQL查询结果更新:', sqlResults);
  };

  // 获取当前状态信息
  const getCurrentStatus = () => {
    if ((viewMode as ViewMode) === 'sql') {
      return {
        loading: sqlLoading,
        error: sqlError,
        hasData: !!sqlData,
        statusText: sqlError ? t('status.sqlQueryFailed') : sqlData ? t('status.sqlDataLoaded') : t('status.useLocalData')
      };
    } else {
      return {
        loading,
        error,
        hasData: !!profileData,
        statusText: error ? t('status.mcpConnectionFailed') : profileData ? t('status.mcpConnected') : t('status.useLocalData')
      };
    }
  };

  const currentStatus = getCurrentStatus();

  // 处理编辑记录
  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  // 处理删除记录
  const handleDeleteRecord = async (record: any) => {
    setDeletingRecord(record);
  };

  // 确认删除记录
  const confirmDeleteRecord = async () => {
    if (!deletingRecord) return;

    try {
      const targetTableName = deletingRecord.sourceTable || activeTable;
      
      const success = await deleteRecord(targetTableName, deletingRecord.id);
      
      if (success) {
        console.log('记录删除成功');
        const recordKey = deletingRecord.uniqueKey || deletingRecord.id.toString();
        setDeletedRecords(prevDeletedRecords => {
          const newDeletedRecords = new Set(prevDeletedRecords);
          newDeletedRecords.add(recordKey);
          return newDeletedRecords;
        });
      } else {
        console.error('删除记录失败');
      }
    } catch (error) {
      console.error('删除记录出错:', error);
    } finally {
      setDeletingRecord(null);
    }
  };

  // 取消删除
  const cancelDeleteRecord = () => {
    setDeletingRecord(null);
  };

  // 处理更新记录
  const handleUpdateRecord = async (tableName: string, recordId: number, content: string, related: string[]) => {
    try {
      const success = await updateRecord(tableName, recordId, content, related);
      return success;
    } catch (error) {
      console.error('更新记录出错:', error);
      return false;
    }
  };

  // 显示Toast消息
  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 添加到Cursor配置
  const handleAddToCursor = async () => {
    if (!mcpServersConfig) {
      showToast('error', t('toast.configNotAvailable'));
      return;
    }

    setIsAddingToCursor(true);
    try {
      await writeCursorConfig(mcpServersConfig);
      showToast('success', t('toast.addToCursorSuccess'));
    } catch (error) {
      console.error('添加到Cursor失败:', error);
      showToast('error', `${t('toast.addToCursorFailed')}: ${error instanceof Error ? error.message : t('common.unknown')}`);
    } finally {
      setIsAddingToCursor(false);
    }
  };

  // 添加到Claude配置
  const handleAddToClaude = async () => {
    if (!mcpServersConfig) {
      showToast('error', t('toast.configNotAvailable'));
      return;
    }

    setIsAddingToClaude(true);
    try {
      await writeClaudeConfig(mcpServersConfig);
      showToast('success', t('toast.addToClaudeSuccess'));
    } catch (error) {
      console.error('添加到Claude失败:', error);
      showToast('error', `${t('toast.addToClaudeFailed')}: ${error instanceof Error ? error.message : t('common.unknown')}`);
    } finally {
      setIsAddingToClaude(false);
    }
  };

  // 检查更新
  const handleCheckUpdate = async () => {
    if (isCheckingUpdate) return;
    
    setIsCheckingUpdate(true);
    setUpdateInfo(null);
    
    try {
      const result = await invoke('check_for_updates') as any;
      
      if (result) {
        setUpdateInfo(result);
        showToast('success', t('updater.updateFound', { version: result.version }));
      } else {
        showToast('success', t('updater.upToDate'));
      }
    } catch (error) {
      console.error('检查更新失败:', error);
      showToast('error', `${t('updater.updateFailed')}: ${error instanceof Error ? error.message : t('common.unknown')}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // 处理开机启动开关
  const handleAutostartChange = async (checked: boolean) => {
    setIsCheckingAutostart(true);
    try {
      // 动态导入 autostart 插件
      const { enable, disable } = await import('@tauri-apps/plugin-autostart');
      
      if (checked) {
        await enable();
      } else {
        await disable();
      }
      setAutostartEnabled(checked);
      showToast('success', checked ? t('toast.autostartEnabled') : t('toast.autostartDisabled'));
    } catch (error) {
      console.error('设置开机启动失败:', error);
      showToast('error', t('toast.autostartFailed'));
    } finally {
      setIsCheckingAutostart(false);
    }
  };

  // 下载并安装更新
  const handleDownloadAndInstall = async () => {
    if (!updateInfo || isDownloading) return;

    const confirmUpdate = window.confirm(
      `${t('updater.updateFound', { version: updateInfo.version })}\n${t('updater.releaseDate')}：${updateInfo.date}\n${t('updater.releaseNotes')}：${updateInfo.body}\n${t('updater.confirmUpdate')}`
    );

    if (!confirmUpdate) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      await invoke('download_and_install_update');
      showToast('success', t('updater.updateSuccess'));
    } catch (error) {
      console.error('下载安装更新失败:', error);
      showToast('error', `${t('updater.updateFailed')}: ${error instanceof Error ? error.message : t('common.unknown')}`);
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-12">
        {/* 页面标题 - 科技感设计 */}
        <div className="mb-16">
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 tracking-tight">
                  UserBank
                  <span className="block text-2xl md:text-3xl lg:text-4xl font-thin text-gray-600 mt-2">
                    {t('navigation.data')}
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {/* 统一状态指示器 - 优先显示 Sidecar 状态，成功时显示 MCP 状态 */}
                <div className="flex items-center gap-2">
                  {sidecarError ? (
                    <>
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm text-gray-500">{t('status.sidecarError')}</span>
                    </>
                  ) : !sidecarRunning ? (
                    <>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-gray-500">{t('status.sidecarStarting')}</span>
                    </>
                  ) : (
                    <>
                      <div className={`w-3 h-3 rounded-full ${currentStatus.error ? 'bg-red-500' : currentStatus.hasData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className="text-sm text-gray-500">
                        {currentStatus.statusText}
                      </span>
                    </>
                  )}
                </div>
                {/* 刷新按钮 */}
                <button
                  onClick={viewMode === 'sql' ? refreshSQLData : refreshData}
                  disabled={currentStatus.loading}
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${currentStatus.loading ? 'animate-spin' : ''}`} />
                </button>
                {/* 设置按钮 */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSettings(!showSettings);
                      // 重新获取配置文件数据
                      if (!showSettings) {
                        loadConfigData();
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  
                  {/* 设置浮层 */}
                  {showSettings && (
                    <>
                      {/* 背景遮罩 */}
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowSettings(false)}
                      />
                      {/* 设置面板 */}
                      <div className="absolute right-0 top-full mt-4 w-120 bg-white rounded-2xl shadow-lg shadow-gray-900/5 border border-gray-100 z-50 transform transition-all duration-300 scale-100 opacity-100">
                        <div className="p-8">
                          {/* 设置标题 */}
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-light text-gray-900 tracking-tight">{t('common.settings')}</h3>
                            <button
                              onClick={() => setShowSettings(false)}
                              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* 语言设置 */}
                          <div className="bg-gray-50 rounded-xl p-6 mb-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                  <Settings className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">{t('common.language')}</h4>
                                  <p className="text-xs text-gray-500 font-light">选择界面语言</p>
                                </div>
                              </div>
                              <LanguageSwitcher />
                            </div>
                          </div>

                          {/* MCP服务器配置 */}
                          <div className="bg-gray-50 rounded-xl p-6 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <Database className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{t('config.mcp')}</h4>
                                <p className="text-xs text-gray-500 font-light">{t('config.mcpDescription')}</p>
                              </div>
                            </div>
                            
                            <div className="bg-white rounded-xl p-4 border border-gray-200 max-h-48 overflow-y-auto mb-6">
                              {mcpServersConfig ? (
                                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                                  {JSON.stringify(mcpServersConfig, null, 2)}
                                </pre>
                              ) : (
                                <div className="flex items-center justify-center py-8">
                                  <div className="text-center">
                                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                                    <div className="text-gray-500 text-sm font-light">{t('common.loading')}</div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 添加到编辑器按钮 */}
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={handleAddToCursor}
                                  disabled={!mcpServersConfig || isAddingToCursor}
                                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-light"
                                >
                                  {isAddingToCursor ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                      <span className="text-sm">{t('common.loading')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Settings className="w-4 h-4" />
                                      <span className="text-sm">{t('config.cursor')}</span>
                                    </>
                                  )}
                                </button>
                                
                                <button
                                  onClick={handleAddToClaude}
                                  disabled={!mcpServersConfig || isAddingToClaude}
                                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-light"
                                >
                                  {isAddingToClaude ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                      <span className="text-sm">{t('common.loading')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Settings className="w-4 h-4" />
                                      <span className="text-sm">{t('config.claude')}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 text-center font-light">
                                {t('config.addToEditorConfig')}
                              </p>
                            </div>
                          </div>
                         {/* 开机启动设置 */}
                         <div className="bg-gray-50 rounded-xl p-6 mb-8">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                  <Power className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900">{t('autostart.title')}</h4>
                                  <p className="text-xs text-gray-500 font-light mt-1">{t('autostart.description')}</p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={autostartEnabled}
                                  onChange={(e) => handleAutostartChange(e.target.checked)}
                                  disabled={isCheckingAutostart}
                                  className="sr-only peer"
                                />
                                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-900/10 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 disabled:opacity-50 shadow-sm"></div>
                              </label>
                            </div>
                            <p className="text-xs text-gray-500 font-light mt-4 pl-13">
                              {t('autostart.hint')}
                            </p>
                          </div>

                         {/* 版本信息和升级检测 */}
                         <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <CheckCircle className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{t('updater.title')}</h4>
                                <p className="text-xs text-gray-500 font-light">检查应用更新</p>
                              </div>
                            </div>
                            
                            {/* 当前版本 */}
                            <div className="bg-white rounded-xl p-4 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 font-light">{t('updater.currentVersion')}</span>
                                <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{currentVersion}</span>
                              </div>
                            </div>

                            {/* 检查更新按钮 */}
                            <button
                              onClick={handleCheckUpdate}
                              disabled={isCheckingUpdate}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-light mb-4"
                            >
                              {isCheckingUpdate ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span className="text-sm">{t('updater.checking')}</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4" />
                                  <span className="text-sm">{t('updater.checkUpdate')}</span>
                                </>
                              )}
                            </button>

                            {/* 更新信息 */}
                            {updateInfo && (
                              <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Download className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-900">{t('updater.updateAvailable')}</span>
                                    <p className="text-xs text-blue-700 font-light">版本 {updateInfo.version}</p>
                                  </div>
                                </div>
                                
                                <div className="bg-white rounded-xl p-4 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-light">{t('updater.releaseDate')}:</span>
                                    <span className="text-sm text-gray-900">{updateInfo.date}</span>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 font-light">{t('updater.releaseNotes')}:</span>
                                    <div className="mt-2 bg-gray-50 rounded-lg p-3 max-h-24 overflow-y-auto">
                                      <p className="text-xs text-gray-700 font-light leading-relaxed">
                                        {updateInfo.body}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 下载安装按钮 */}
                                <button
                                  onClick={handleDownloadAndInstall}
                                  disabled={isDownloading}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed font-light"
                                >
                                  {isDownloading ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                      <span className="text-sm">
                                        {downloadProgress > 0 ? 
                                          t('updater.downloadProgress', { progress: downloadProgress }) : 
                                          t('updater.downloading')
                                        }
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-4 h-4" />
                                      <span className="text-sm">{t('updater.downloadAndInstall')}</span>
                                    </>
                                  )}
                                </button>

                                {/* 下载进度条 */}
                                {isDownloading && downloadProgress > 0 && (
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${downloadProgress}%` }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>     
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute -left-2 top-0 w-1 h-full bg-gradient-to-b from-gray-900 via-gray-600 to-transparent rounded-full"></div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-lg font-light max-w-2xl">
              {t('profile.title')}
            </p>
            {currentStatus.error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{currentStatus.error}</span>
              </div>
            )}
          </div>
        </div>

        {/* 视图模式切换 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-lg shadow-gray-900/5 w-fit">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'table'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Table className="w-4 h-4" />
              {t('common.table')}
            </button>
            <button
              onClick={() => setViewMode('sql')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'sql'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Database className="w-4 h-4" />
              {t('common.sql')}
            </button>
          </div>
        </div>

        {/* 根据视图模式显示不同内容 */}
        {viewMode === 'sql' ? (
          /* SQL查询面板 */
          <SQLQueryPanel onDataUpdate={handleSQLDataUpdate} />
        ) : (
          /* 原有的表格视图 */
          <>
            {/* 统计卡片 - 未来感无边框设计 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-4 mb-16">
              {tableStats.map((stat) => (
                <div
                  key={stat.key}
                  onClick={() => setActiveTable(stat.key)}
                  className={`group relative p-6 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    activeTable === stat.key
                      ? 'bg-gray-900 text-white shadow-2xl shadow-gray-900/20'
                      : 'bg-white hover:bg-gray-50 shadow-lg shadow-gray-900/5 hover:shadow-xl hover:shadow-gray-900/10'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-2xl md:text-3xl font-light mb-2 ${
                      activeTable === stat.key ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stat.count}
                    </div>
                    <div className={`text-sm font-light tracking-wide ${
                      activeTable === stat.key ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {stat.name}
                    </div>
                  </div>
                  {activeTable === stat.key && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-10"></div>
                  )}
                </div>
              ))}
            </div>

            {/* 搜索和过滤区域 - 极简设计 */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-900/5 p-8 mb-12">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* 搜索框 */}
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-gray-900 transition-colors" />
                  <input
                    type="text"
                    placeholder={activeTable === 'all' ? t('common.searchAll') : t('common.searchContent')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* 标签过滤 */}
                <div className="relative w-full lg:min-w-64 lg:w-auto group">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-gray-900 transition-colors" />
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 text-gray-900 appearance-none cursor-pointer"
                  >
                    <option value="">{t('common.allTags')}</option>
                    {allTags.map((tag: string) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 当前表格信息 */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    <span className="font-light">
                      {t('common.currentTable')}: <span className="text-gray-900 font-medium">{currentTableData.description}</span>
                    </span>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <span className="font-light">
                      {t('common.totalRecords')}: <span className="text-gray-900 font-medium">{currentTableData.stats.total_records}</span>
                    </span>
                    <span className="font-light">
                      {t('common.displayRecords')}: <span className="text-gray-900 font-medium">{filteredRecords.length}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 数据列表 - 卡片式无边框设计 */}
            <div className="space-y-6">
              {currentStatus.loading ? (
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-900/5 p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-3">{t('common.loading')}</h3>
                  <p className="text-gray-500 font-light max-w-md mx-auto">
                    {t('messages.loadingData', { source: (viewMode as ViewMode) === 'sql' ? t('common.sql') : 'MCP' })}
                  </p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-900/5 p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-3">{t('messages.noData')}</h3>
                  <p className="text-gray-500 font-light max-w-md mx-auto">
                    {currentTableData.records.length === 0 
                      ? t('messages.tableEmpty', { table: currentTableData.description })
                      : t('messages.noMatchingRecords')
                    }
                  </p>
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <div 
                    key={record.uniqueKey || record.id} 
                    className="group bg-white rounded-2xl shadow-lg shadow-gray-900/5 hover:shadow-xl hover:shadow-gray-900/10 transition-all duration-300 p-8"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        {/* 记录内容 */}
                        <div className="mb-6">
                          <p className="text-gray-900 leading-relaxed text-lg font-light break-words">
                            {record.content}
                          </p>
                        </div>

                        {/* 标签 - 彩色渐变设计 */}
                        {record.keywords && record.keywords.length > 0 && (
                          <div className="mb-6">
                            <div className="flex flex-wrap gap-3">
                              {record.keywords.map((tag: string, tagIndex: number) => (
                                <span
                                  key={`${record.uniqueKey || record.id}-tag-${tagIndex}-${tag}`}
                                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 ${getTagColor(tag)}`}
                                >
                                  <Tag className="w-4 h-4 mr-2" />
                                  <span>{tag}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-400 font-light">
                          {/* 表格来源标识 - 仅在"全部"视图中显示 */}
                          {activeTable === 'all' && record.sourceTable && (
                            <div className="flex items-center">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600`}
                              >
                                <Database className="w-3 h-3 mr-1" />
                                {record.sourceTableName}
                              </span>
                            </div>
                          )}

                          {/* 时间信息 */}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{t('common.created')}: {formatTime(record.created_time)}</span>
                          </div>
                          {record.updated_time && record.updated_time !== record.created_time && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{t('common.updated')}: {formatTime(record.updated_time)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={() => handleEditRecord(record)}
                          className="p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRecord(record)}
                          className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 添加按钮 - 未来感设计 */}
            {activeTable !== 'all' && (
              <div className="fixed bottom-8 right-8">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="group bg-gray-900 hover:bg-black text-white p-4 rounded-2xl shadow-2xl shadow-gray-900/25 hover:shadow-3xl transition-all duration-300 transform hover:scale-110"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
            )}

            {/* 添加记录模态框 */}
            <AddRecordModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSuccess={(viewMode as ViewMode) === 'sql' ? refreshSQLData : refreshData}
              activeTable={activeTable}
              tableDescription={currentTableData.description}
            />

            {/* 编辑记录模态框 */}
            <EditRecordModal
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false);
                setEditingRecord(null);
              }}
              onSuccess={() => {
                if ((viewMode as ViewMode) === 'sql') {
                  refreshSQLData();
                } else {
                  refreshData();
                }
              }}
              record={editingRecord}
              tableName={activeTable}
              tableDescription={currentTableData.description}
              onUpdate={handleUpdateRecord}
            />

            {/* 删除确认对话框 */}
            {deletingRecord && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-300 scale-100">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {t('modal.confirmDelete')}
                    </h3>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {t('modal.confirmDeleteMessage')}
                    </p>
                    
                    {/* 显示要删除的记录内容预览 */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {deletingRecord.content}
                      </p>
                      {deletingRecord.keywords && deletingRecord.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {deletingRecord.keywords.slice(0, 3).map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-200 text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                          {deletingRecord.keywords.length > 3 && (
                            <span className="text-xs text-gray-500">
                              {t('messages.moreItems', { count: deletingRecord.keywords.length - 3 })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={cancelDeleteRecord}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={confirmDeleteRecord}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200"
                      >
                        <Check className="w-4 h-4" />
                        {t('common.confirm')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Toast消息 */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
              toastMessage.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              <div className="flex items-center gap-3">
                {toastMessage.type === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">{toastMessage.message}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
