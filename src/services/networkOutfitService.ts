import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * 根据天气条件获取网络穿搭推荐
 * @param temperature 温度
 * @param condition 天气状况
 * @returns 网络推荐的穿搭图片URL数组
 */
export const getNetworkOutfitRecommendation = async (
  temperature: number,
  condition: string
): Promise<string[] | null> => {
  try {
    // 根据温度和天气条件生成搜索关键词
    const searchQuery = generateSearchQuery(temperature, condition);
    
    console.log('生成的搜索关键词:', searchQuery);
    
    // 直接使用Pexels API获取图片（因为我们已经有Pexels API密钥）
    const imageUrls = await getPexelsOutfitImages(searchQuery, 2); // 获取两张图片
    
    console.log('从Pexels获取的图片URLs:', imageUrls);
    
    return imageUrls && imageUrls.length > 0 ? imageUrls : null;
  } catch (error) {
    console.error('获取网络穿搭推荐失败:', error);
    return null;
  }
};

/**
 * 生成搜索关键词
 * @param temperature 温度
 * @param condition 天气状况
 * @returns 搜索关键词
 */
const generateSearchQuery = (temperature: number, condition: string): string => {
  let season = '';
  
  // 根据温度判断季节
  if (temperature > 25) {
    season = 'summer outfit';
  } else if (temperature > 18) {
    season = 'spring autumn outfit';
  } else if (temperature > 10) {
    season = 'autumn outfit';
  } else {
    season = 'winter outfit';
  }
  
  // 根据天气状况添加描述词
  let weatherDesc = '';
  if (condition.includes('雨') || condition.includes('雨')) {
    weatherDesc = 'rainy day';
  } else if (condition.includes('雪') || condition.includes('雪')) {
    weatherDesc = 'snowy day';
  } else if (condition.includes('晴') || condition.includes('晴')) {
    weatherDesc = 'sunny day';
  } else if (condition.includes('云') || condition.includes('阴')) {
    weatherDesc = 'cloudy day';
  }
  
  // 组合搜索关键词 (使用英文以获得更好的搜索结果)
  const query = `${season} ${weatherDesc} fashion`.trim();
  console.log('生成的搜索关键词:', query);
  return query;
};

/**
 * 使用Unsplash API获取穿搭图片（需要API密钥）
 * @param query 搜索关键词
 * @returns 图片URL
 */
export const getUnsplashOutfitImage = async (query: string): Promise<string | null> => {
  try {
    // 注意：需要在.env.local中配置UNSPLASH_ACCESS_KEY
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (!accessKey || accessKey === 'YOUR_UNSPLASH_ACCESS_KEY_HERE') {
      console.warn('Unsplash API密钥未配置');
      return null;
    }
    
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=${accessKey}`;
    
    const response = await axios.get(url);
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      return response.data.results[0].urls.regular;
    }
    
    return null;
  } catch (error) {
    console.error('获取Unsplash图片失败:', error);
    return null;
  }
};

/**
 * 使用Pexels API获取穿搭图片（需要API密钥）
 * @param query 搜索关键词
 * @param count 获取图片数量
 * @returns 图片URL数组
 */
export const getPexelsOutfitImages = async (query: string, count: number = 2): Promise<string[] | null> => {
  try {
    // 注意：需要在.env.local中配置PEXELS_API_KEY
    const apiKey = process.env.PEXELS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_PEXELS_API_KEY_HERE') {
      console.warn('Pexels API密钥未配置');
      return null;
    }
    
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`;
    
    console.log('Pexels API请求URL:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': apiKey
      }
    });
    
    console.log('Pexels API响应:', response.data);
    
    if (response.data && response.data.photos && response.data.photos.length > 0) {
      const imageUrls = response.data.photos.slice(0, count).map((photo: any) => photo.src.medium);
      console.log('获取到的图片URLs:', imageUrls);
      return imageUrls;
    }
    
    console.log('未找到相关图片');
    return null;
  } catch (error) {
    console.error('获取Pexels图片失败:', error);
    return null;
  }
};

/**
 * 搜索穿搭图片 (备用方法)
 * @param query 搜索关键词
 * @returns 图片URL
 */
const searchOutfitImages = async (query: string): Promise<string | null> => {
  try {
    // 注意：实际项目中应该使用正式的图片搜索API，这里仅作示例
    // 由于直接爬取搜索引擎可能违反其服务条款，这里提供一个概念验证的实现
    
    // 构造搜索URL（示例）
    const searchUrl = `https://image.baidu.com/search/index?tn=baiduimage&word=${encodeURIComponent(query)}`;
    
    // 发送请求获取页面内容
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // 使用cheerio解析HTML
    const $ = cheerio.load(response.data);
    
    // 查找图片元素（这需要根据实际页面结构调整）
    const imageElements = $('img');
    
    // 收集图片URL
    const imageUrls: string[] = [];
    imageElements.each((index, element) => {
      const src = $(element).attr('src');
      const dataSrc = $(element).attr('data-src');
      
      if (src && src.startsWith('http') && !src.includes('logo')) {
        imageUrls.push(src);
      } else if (dataSrc && dataSrc.startsWith('http') && !dataSrc.includes('logo')) {
        imageUrls.push(dataSrc);
      }
      
      // 限制数量以避免过多请求
      if (imageUrls.length >= 10) {
        return false; // 相当于break
      }
    });
    
    // 返回第一张图片URL（如果有）
    return imageUrls.length > 0 ? imageUrls[0] : null;
  } catch (error) {
    console.error('搜索图片失败:', error);
    return null;
  }
};