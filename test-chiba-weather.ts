import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getWeatherByCity, getOneCallWeather } from './src/services/weatherService';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

console.log('环境变量测试:');
console.log('NEXT_PUBLIC_OPENWEATHER_API_KEY:', process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY);
console.log('API密钥是否存在:', !!process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY);

// 测试函数
async function testChibaWeather() {
  console.log('\n测试千叶天气...');
  
  // 测试千叶天气 (使用英文城市名)
  const chibaWeather = await getWeatherByCity('Chiba');
  console.log('千叶天气:', chibaWeather);
  
  if (chibaWeather) {
    console.log('\n测试千叶完整天气数据...');
    // 使用千葉の经纬度获取完整天气数据
    // 千葉の经纬度大约为: 纬度35.6073, 经度140.1065
    const fullWeather = await getOneCallWeather(35.6073, 140.1065);
    console.log('千叶完整天气数据:', fullWeather ? '获取成功' : '获取失败');
    
    if (fullWeather) {
      console.log('\n一周天气预报:');
      fullWeather.daily.slice(0, 7).forEach((day, index) => {
        const date = new Date(day.dt * 1000);
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const dayName = index === 0 ? '今天' : weekdays[date.getDay()];
        console.log(`${dayName}: 最高${day.temp.max.toFixed(0)}°C, 最低${day.temp.min.toFixed(0)}°C, ${day.weather[0].description}`);
      });
    }
  } else {
    console.log('无法获取千叶天气数据，尝试使用经纬度获取...');
    // 方法2: 如果城市名获取失败，使用经纬度获取
    // 日本千葉の经纬度大约为: 纬度35.6073, 经度140.1065
    const weatherByCoords = await getWeatherByCity('35.6073,140.1065');
    console.log('通过经纬度获取千叶天气:', weatherByCoords);
  }
}

// 运行测试
testChibaWeather().catch(console.error);