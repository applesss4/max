// CSS优化工具函数

/**
 * 为导出的图片元素应用优化的样式
 * @param element 要应用样式的DOM元素
 */
export const applyExportImageStyles = (element: HTMLElement) => {
  // 设置基础字体颜色，确保在白色背景上清晰可见
  element.style.color = '#000000'; // 使用纯黑色确保可见性
  
  // 设置字体家族为系统默认字体，确保兼容性
  element.style.fontFamily = 'Arial, sans-serif';
  
  // 设置基础字体大小
  element.style.fontSize = '14px';
  
  // 设置行高以改善可读性
  element.style.lineHeight = '1.4';
  
  // 设置背景色为白色
  element.style.backgroundColor = '#ffffff';
  
  // 确保元素可见
  element.style.display = 'block';
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
  table.style.color = '#000000'; // 使用纯黑色确保可见性
  
  // 设置表格字体大小
  table.style.fontSize = '14px';
  
  // 确保表格可见
  table.style.display = 'table';
};

/**
 * 为导出的表头元素应用优化的样式
 * @param header 要应用样式的表头元素
 */
export const applyExportHeaderStyles = (header: HTMLTableHeaderCellElement) => {
  // 设置表头边框
  header.style.border = '2px solid #000000'; // 使用更粗的黑色边框
  
  // 设置表头内边距
  header.style.padding = '12px 10px';
  
  // 设置表头文本对齐
  header.style.textAlign = 'center';
  
  // 设置表头背景色
  header.style.backgroundColor = '#e0e0e0'; // 使用更明显的灰色背景
  
  // 设置表头字体颜色
  header.style.color = '#000000'; // 使用纯黑色
  
  // 设置表头字体加粗
  header.style.fontWeight = '700'; // 更加粗体
  
  // 确保表头可见
  header.style.display = 'table-cell';
};

/**
 * 为导出的表格单元格应用优化的样式
 * @param cell 要应用样式的单元格元素
 */
export const applyExportCellStyles = (cell: HTMLTableCellElement) => {
  // 设置单元格边框
  cell.style.border = '1px solid #000000'; // 使用黑色边框
  
  // 设置单元格内边距
  cell.style.padding = '10px';
  
  // 设置单元格文本对齐
  cell.style.textAlign = 'center';
  
  // 设置单元格字体颜色
  cell.style.color = '#000000'; // 使用纯黑色
  
  // 确保单元格可见
  cell.style.display = 'table-cell';
};

/**
 * 为导出的标题元素应用优化的样式
 * @param title 要应用样式的标题元素
 */
export const applyExportTitleStyles = (title: HTMLHeadingElement) => {
  // 设置标题文本对齐
  title.style.textAlign = 'center';
  
  // 设置标题下边距
  title.style.marginBottom = '25px';
  
  // 设置标题字体颜色
  title.style.color = '#000000'; // 使用纯黑色
  
  // 设置标题字体大小
  title.style.fontSize = '20px'; // 稍大一些的字体
  
  // 设置标题字体加粗
  title.style.fontWeight = '700'; // 更加粗体
  
  // 确保标题可见
  title.style.display = 'block';
};

