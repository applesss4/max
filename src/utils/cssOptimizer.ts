// CSS优化工具函数

/**
 * 为导出的图片元素应用优化的样式
 * @param element 要应用样式的DOM元素
 */
export const applyExportImageStyles = (element: HTMLElement) => {
  // 设置基础字体颜色，确保在白色背景上清晰可见
  element.style.color = '#333333';
  
  // 设置字体家族为系统默认字体，确保兼容性
  element.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  
  // 设置基础字体大小
  element.style.fontSize = '14px';
  
  // 设置行高以改善可读性
  element.style.lineHeight = '1.4';
  
  // 设置背景色为白色
  element.style.backgroundColor = '#ffffff';
  
  // 添加抗锯齿渲染以改善字体显示效果（使用类型断言）
  (element.style as any).webkitFontSmoothing = 'antialiased';
  (element.style as any).mozOsxFontSmoothing = 'grayscale';
  
  // 确保文本渲染优化
  (element.style as any).textRendering = 'optimizeLegibility';
};

/**
 * 为导出的表格元素应用优化的样式
 * @param table 要应用样式的表格元素
 */
export const applyExportTableStyles = (table: HTMLTableElement) => {
  // 设置表格边框合并
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';
  
  // 设置表格字体颜色
  table.style.color = '#333333';
  
  // 设置表格字体大小
  table.style.fontSize = '14px';
};

/**
 * 为导出的表头元素应用优化的样式
 * @param header 要应用样式的表头元素
 */
export const applyExportHeaderStyles = (header: HTMLTableHeaderCellElement) => {
  // 设置表头边框
  header.style.border = '1px solid #cccccc';
  
  // 设置表头内边距
  header.style.padding = '10px 8px';
  
  // 设置表头文本对齐
  header.style.textAlign = 'center';
  
  // 设置表头背景色
  header.style.backgroundColor = '#f0f0f0';
  
  // 设置表头字体颜色
  header.style.color = '#333333';
  
  // 设置表头字体加粗
  header.style.fontWeight = '600';
};

/**
 * 为导出的表格单元格应用优化的样式
 * @param cell 要应用样式的单元格元素
 */
export const applyExportCellStyles = (cell: HTMLTableCellElement) => {
  // 设置单元格边框
  cell.style.border = '1px solid #cccccc';
  
  // 设置单元格内边距
  cell.style.padding = '8px';
  
  // 设置单元格文本对齐
  cell.style.textAlign = 'center';
  
  // 设置单元格字体颜色
  cell.style.color = '#333333';
};

/**
 * 为导出的标题元素应用优化的样式
 * @param title 要应用样式的标题元素
 */
export const applyExportTitleStyles = (title: HTMLHeadingElement) => {
  // 设置标题文本对齐
  title.style.textAlign = 'center';
  
  // 设置标题下边距
  title.style.marginBottom = '20px';
  
  // 设置标题字体颜色
  title.style.color = '#333333';
  
  // 设置标题字体大小
  title.style.fontSize = '18px';
  
  // 设置标题字体加粗
  title.style.fontWeight = '600';
};

/**
 * 获取优化的html2canvas配置选项
 * @returns html2canvas配置选项
 */
export const getOptimizedHtml2CanvasOptions = () => {
  return {
    backgroundColor: '#ffffff',
    scale: 2, // 提高图片质量
    useCORS: true,
    allowTaint: true,
    logging: false, // 禁用日志以提高性能
    // 优化移动端渲染
    pixelRatio: Math.min(window.devicePixelRatio || 2, 2),
    // 确保字体正确渲染
    letterRendering: true,
    // 启用硬件加速
    foreignObjectRendering: true
  };
};