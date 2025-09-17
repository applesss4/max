// CSS优化工具函数

/**
 * 动态加载CSS文件
 * @param href CSS文件路径
 * @returns Promise<void>
 */
export const loadCSS = (href: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
    
    document.head.appendChild(link);
  });
};

/**
 * 预加载关键CSS
 * @param cssContent CSS内容
 */
export const preloadCriticalCSS = (cssContent: string): void => {
  const style = document.createElement('style');
  style.textContent = cssContent;
  document.head.appendChild(style);
};

/**
 * 添加CSS类名优化
 * @param element HTML元素
 * @param classNames 类名数组
 */
export const addOptimizedClasses = (element: HTMLElement, classNames: string[]): void => {
  // 使用requestAnimationFrame优化DOM操作
  requestAnimationFrame(() => {
    element.classList.add(...classNames);
  });
};

/**
 * 移除CSS类名优化
 * @param element HTML元素
 * @param classNames 类名数组
 */
export const removeOptimizedClasses = (element: HTMLElement, classNames: string[]): void => {
  // 使用requestAnimationFrame优化DOM操作
  requestAnimationFrame(() => {
    element.classList.remove(...classNames);
  });
};

/**
 * 切换CSS类名优化
 * @param element HTML元素
 * @param className 类名
 */
export const toggleOptimizedClass = (element: HTMLElement, className: string): void => {
  // 使用requestAnimationFrame优化DOM操作
  requestAnimationFrame(() => {
    element.classList.toggle(className);
  });
};

/**
 * 检查元素是否包含指定类名
 * @param element HTML元素
 * @param className 类名
 * @returns boolean
 */
export const hasOptimizedClass = (element: HTMLElement, className: string): boolean => {
  return element.classList.contains(className);
};

/**
 * 优化CSS动画性能
 * @param element HTML元素
 * @param animationClass 动画类名
 */
export const optimizeAnimation = (element: HTMLElement, animationClass: string): void => {
  // 添加性能优化类
  addOptimizedClasses(element, ['optimize-animation']);
  
  // 添加动画类
  addOptimizedClasses(element, [animationClass]);
  
  // 动画结束后清理
  element.addEventListener('animationend', () => {
    removeOptimizedClasses(element, [animationClass]);
  }, { once: true });
};

/**
 * 批量处理CSS类名变更
 * @param operations 操作数组
 */
export const batchCSSOperations = (operations: Array<{
  element: HTMLElement;
  type: 'add' | 'remove' | 'toggle';
  classNames: string[];
}>): void => {
  // 使用requestAnimationFrame批量处理DOM操作
  requestAnimationFrame(() => {
    operations.forEach(op => {
      switch (op.type) {
        case 'add':
          op.element.classList.add(...op.classNames);
          break;
        case 'remove':
          op.element.classList.remove(...op.classNames);
          break;
        case 'toggle':
          op.classNames.forEach(className => {
            op.element.classList.toggle(className);
          });
          break;
      }
    });
  });
};