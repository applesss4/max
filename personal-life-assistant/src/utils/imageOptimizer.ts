// 图片优化工具函数

/**
 * 压缩Base64图片数据
 * @param base64String Base64图片数据
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param quality 图片质量 (0-1)
 * @returns Promise<string> 压缩后的Base64图片数据
 */
export const compressBase64Image = (
  base64String: string, 
  maxWidth: number = 800, 
  maxHeight: number = 600, 
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 创建图片对象
    const img = new Image();
    img.src = base64String;
    
    img.onload = () => {
      // 计算新尺寸
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // 创建canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // 绘制图片到canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法获取canvas上下文'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // 转换为Base64并压缩
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * 验证Base64图片数据
 * @param base64String Base64图片数据
 * @returns boolean 是否为有效的Base64图片
 */
export const isValidBase64Image = (base64String: string): boolean => {
  if (!base64String) return false;
  const regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
  return regex.test(base64String);
};

/**
 * 获取Base64图片大小（KB）
 * @param base64String Base64图片数据
 * @returns number 图片大小（KB）
 */
export const getBase64ImageSize = (base64String: string): number => {
  if (!base64String) return 0;
  
  // 移除数据URL前缀
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  
  // 计算大小
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  const sizeInBytes = (base64Data.length * 3) / 4 - padding;
  
  // 转换为KB
  return Math.round(sizeInBytes / 1024);
};