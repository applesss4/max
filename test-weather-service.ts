import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  getWeatherByCity, 
  getCoordinatesByZipCode, 
  getWeatherByZipCode,
  getOneCallWeather,
  getWeatherOverview,
  getWeatherAssistantUrl
} from './src/services/weatherService';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

console.log('环境变量测试:');
console.log('NEXT_PUBLIC_OPENWEATHER_API_KEY:', process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY);
console.log('API密钥是否存在:', !!process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY);

// 测试函数
async function testWeatherService() {
  console.log('\n测试天气服务...');
  
  // 测试北京天气 (使用英文城市名)
  const beijingWeather = await getWeatherByCity('Beijing');
  console.log('北京天气:', beijingWeather);
  
  // 测试东京天气 (使用英文城市名)
  const tokyoWeather = await getWeatherByCity('Tokyo');
  console.log('东京天气:', tokyoWeather);
  
  // 测试通过邮政编码获取地理坐标
  console.log('\n测试通过邮政编码获取地理坐标...');
  const coordinates = await getCoordinatesByZipCode('E14', 'GB');
  console.log('伦敦E14地区坐标:', coordinates);
  
  // 测试通过邮政编码获取天气数据
  console.log('\n测试通过邮政编码获取天气数据...');
  const weatherByZip = await getWeatherByZipCode('E14', 'GB');
  console.log('伦敦E14地区天气:', weatherByZip);
  
  // 测试 OneCall API (当前天气和预报数据)
  console.log('\n测试 OneCall API (当前天气和预报数据)...');
  // 使用伦敦的坐标进行测试
  const oneCallData = await getOneCallWeather(51.4969, -0.0087);
  console.log('OneCall 数据:', oneCallData ? '获取成功' : '获取失败');
  
  // 测试 Overview API (天气概览)
  console.log('\n测试 Overview API (天气概览)...');
  const overviewData = await getWeatherOverview(51.4969, -0.0087);
  console.log('天气概览数据:', overviewData ? '获取成功' : '获取失败');
  
  // 测试天气助手URL
  console.log('\n测试天气助手URL...');
  const assistantUrl = getWeatherAssistantUrl();
  console.log('天气助手URL:', assistantUrl);
}

// 运行测试
console.log('注意: 如果API密钥无效，所有请求将返回401错误。请确保在.env.local文件中配置了有效的OpenWeather API密钥。');
testWeatherService().catch(console.error);