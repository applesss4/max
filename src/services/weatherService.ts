import axios from 'axios';

// 天气数据接口
export interface WeatherData {
  temperature: number; // 温度 (摄氏度)
  condition: string;   // 天气状况
  humidity: number;    // 湿度 (%)
  windSpeed: number;   // 风速 (m/s)
  pressure: number;    // 气压 (hPa)
  visibility: number;  // 能见度 (米)
  city: string;        // 城市名
  country: string;     // 国家
  icon: string;        // 天气图标
  description: string; // 天气描述
  latitude: number;    // 纬度
  longitude: number;   // 经度
}

// 检查环境变量并提供更详细的错误信息
const getApiKey = (): string | null => {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  
  // 在开发环境中检查.env.local文件
  if (process.env.NODE_ENV === 'development') {
    if (!apiKey) {
      console.warn('警告: NEXT_PUBLIC_OPENWEATHER_API_KEY 未在.env.local文件中配置');
    }
  } else {
    // 在生产环境中提供更详细的错误信息
    if (!apiKey) {
      console.error('错误: NEXT_PUBLIC_OPENWEATHER_API_KEY 未配置');
      console.error('请在Vercel项目设置中添加环境变量 NEXT_PUBLIC_OPENWEATHER_API_KEY');
      console.error('或者在部署时确保环境变量已正确设置');
    }
  }
  
  return apiKey || null;
};

// OpenWeather API响应接口
interface OpenWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level: number;
    grnd_level: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust: number;
  };
  clouds: {
    all: number;
  };
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  name: string;
  cod: number;
  message?: string; // 错误信息（可选）
}

// 邮政编码查询响应接口
interface ZipCodeResponse {
  zip: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
}

// OneCall API 响应接口 (当前天气和预报数据)
export interface OneCallResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    }[];
  };
  minutely?: {
    dt: number;
    precipitation: number;
  }[];
  hourly: {
    dt: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    }[];
    pop: number;
  }[];
  daily: {
    dt: number;
    sunrise: number;
    sunset: number;
    moonrise: number;
    moonset: number;
    moon_phase: number;
    temp: {
      day: number;
      min: number;
      max: number;
      night: number;
      eve: number;
      morn: number;
    };
    feels_like: {
      day: number;
      night: number;
      eve: number;
      morn: number;
    };
    pressure: number;
    humidity: number;
    dew_point: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    }[];
    clouds: number;
    pop: number;
    rain?: number;
    uvi: number;
  }[];
}

// Time Machine API 响应接口 (历史数据)
interface TimeMachineResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  data: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    }[];
  }[];
}

// Day Summary API 响应接口 (每日聚合数据)
interface DaySummaryResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  date: number;
  data: {
    temp: {
      min: number;
      max: number;
      mean: number;
    };
    weather: {
      main: string;
      description: string;
    }[];
  };
}

// Overview API 响应接口 (天气概览)
interface OverviewResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    }[];
  };
  today: {
    temp: {
      min: number;
      max: number;
    };
    weather: {
      main: string;
      description: string;
    }[];
    sunrise: number;
    sunset: number;
  };
  daily: {
    dt: number;
    temp: {
      min: number;
      max: number;
    };
    weather: {
      main: string;
      description: string;
    }[];
    pop: number;
  }[];
  overview: string; // 人类可读的天气摘要
  preferences: {
    clothing: {
      upper: string;
      lower: string;
      accessories: string[];
    };
    umbrella: boolean;
    sunscreen: boolean;
    indoors: boolean;
  };
}

/**
 * 获取指定城市的天气数据
 * @param city 城市名
 * @returns 天气数据
 */
export const getWeatherByCity = async (city: string): Promise<WeatherData | null> => {
  try {
    // 从环境变量获取API密钥
    const apiKey = getApiKey();
    
    console.log('API密钥是否存在:', !!apiKey);
    if (apiKey) {
      console.log('API密钥长度:', apiKey.length);
    }
    
    if (!apiKey) {
      console.error('OpenWeather API密钥未配置');
      return null;
    }

    // 对城市名称进行URL编码，避免特殊字符问题
    const encodedCity = encodeURIComponent(city);
    
    // 构建API请求URL
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&units=metric&lang=zh_cn`;
    
    console.log(`正在获取城市 "${city}" 的天气数据...`);
    console.log(`请求URL: ${url}`);
    
    // 发送请求
    const response = await axios.get<OpenWeatherResponse>(url);
    
    console.log(`API响应状态: ${response.status}`);
    console.log(`API响应头:`, response.headers);
    
    // 检查响应状态
    if (response.status !== 200) {
      console.error('获取天气数据失败:', response.statusText);
      return null;
    }
    
    const data = response.data;
    
    console.log(`API响应数据:`, data);
    
    // 检查API响应码
    if (data.cod !== 200) {
      console.error('OpenWeather API返回错误:', data.message || `状态码: ${data.cod}`);
      return null;
    }
    
    // 转换数据格式
    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      visibility: data.visibility,
      city: data.name,
      country: data.sys.country,
      icon: data.weather[0].icon,
      description: data.weather[0].description,
      latitude: data.coord.lat,
      longitude: data.coord.lon
    };
    
    console.log(`成功获取城市 "${city}" 的天气数据:`, weatherData);
    
    return weatherData;
  } catch (error: any) {
    console.error('获取天气数据时出错:', error.message);
    
    // 如果是axios错误，提供更多详细信息
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('API响应错误:', error.response.status, error.response.data);
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络请求错误:', error.request);
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
    }
    
    return null;
  }
};

/**
 * 根据经纬度获取天气数据
 * @param lat 纬度
 * @param lon 经度
 * @returns 天气数据
 */
export const getWeatherByCoordinates = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    // 从环境变量获取API密钥
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.error('OpenWeather API密钥未配置');
      return null;
    }

    // 构建API请求URL
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`;
    
    console.log(`正在获取坐标 (${lat}, ${lon}) 的天气数据...`);
    console.log(`请求URL: ${url}`);
    
    // 发送请求
    const response = await axios.get<OpenWeatherResponse>(url);
    
    // 检查响应状态
    if (response.status !== 200) {
      console.error('获取天气数据失败:', response.statusText);
      return null;
    }
    
    const data = response.data;
    
    // 检查API响应码
    if (data.cod !== 200) {
      console.error('OpenWeather API返回错误:', data.message || `状态码: ${data.cod}`);
      return null;
    }
    
    // 转换数据格式
    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      visibility: data.visibility,
      city: data.name,
      country: data.sys.country,
      icon: data.weather[0].icon,
      description: data.weather[0].description,
      latitude: data.coord.lat,
      longitude: data.coord.lon
    };
    
    console.log(`成功获取坐标 (${lat}, ${lon}) 的天气数据:`, weatherData);
    
    return weatherData;
  } catch (error: any) {
    console.error('获取天气数据时出错:', error.message);
    
    // 如果是axios错误，提供更多详细信息
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('API响应错误:', error.response.status, error.response.data);
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络请求错误:', error.request);
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
    }
    
    return null;
  }
};

/**
 * 获取用户位置的天气数据
 * @returns 天气数据
 */
export const getCurrentLocationWeather = async (): Promise<WeatherData | null> => {
  try {
    console.log('正在获取用户位置...');
    
    // 获取用户位置
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    
    console.log('用户位置获取成功:', position.coords);
    
    // 根据位置获取天气数据
    return await getWeatherByCoordinates(
      position.coords.latitude,
      position.coords.longitude
    );
  } catch (error: any) {
    console.error('获取用户位置失败:', error.message);
    return null;
  }
};

/**
 * 通过邮政编码和国家代码获取地理坐标
 * 
 * API调用方式:
 * http://api.openweathermap.org/geo/1.0/zip?zip={zip code},{country code}&appid={API key}
 * 
 * 参数:
 * - zip code: 必需的邮政编码和国家/地区代码以逗号分隔。请使用 ISO 3166 国家/地区代码。
 * - appid: 必需的您唯一的 API 密钥
 * 
 * API调用示例:
 * http://api.openweathermap.org/geo/1.0/zip?zip=E14,GB&appid={API key}
 * 
 * API 响应示例:
 * {
 *   "zip": "90210",
 *   "name": "Beverly Hills",
 *   "lat": 34.0901,
 *   "lon": -118.4065,
 *   "country": "US"
 * }
 * 
 * @param zipCode 邮政编码
 * @param countryCode 国家代码 (ISO 3166)
 * @returns 地理坐标信息
 */
export const getCoordinatesByZipCode = async (zipCode: string, countryCode: string): Promise<ZipCodeResponse | null> => {
  try {
    // 从环境变量获取API密钥
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.error('OpenWeather API密钥未配置');
      return null;
    }

    // 构建API请求URL
    const url = `https://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},${countryCode}&appid=${apiKey}`;
    
    console.log(`正在获取邮政编码 "${zipCode}" 的地理坐标...`);
    console.log(`请求URL: ${url}`);
    
    // 发送请求
    const response = await axios.get<ZipCodeResponse>(url);
    
    // 检查响应状态
    if (response.status !== 200) {
      console.error('获取地理坐标失败:', response.statusText);
      return null;
    }
    
    const data = response.data;
    
    console.log(`成功获取邮政编码 "${zipCode}" 的地理坐标:`, data);
    
    return data;
  } catch (error: any) {
    console.error('获取地理坐标时出错:', error.message);
    
    // 如果是axios错误，提供更多详细信息
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('API响应错误:', error.response.status, error.response.data);
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络请求错误:', error.request);
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
    }
    
    return null;
  }
};

/**
 * 通过邮政编码和国家代码获取天气数据
 * @param zipCode 邮政编码
 * @param countryCode 国家代码 (ISO 3166)
 * @returns 天气数据
 */
export const getWeatherByZipCode = async (zipCode: string, countryCode: string): Promise<WeatherData | null> => {
  try {
    // 首先通过邮政编码获取地理坐标
    const coordinates = await getCoordinatesByZipCode(zipCode, countryCode);
    
    if (!coordinates) {
      console.error('无法获取邮政编码对应的地理坐标');
      return null;
    }
    
    // 然后通过地理坐标获取天气数据
    return await getWeatherByCoordinates(coordinates.lat, coordinates.lon);
  } catch (error: any) {
    console.error('通过邮政编码获取天气数据时出错:', error.message);
    return null;
  }
};

/**
 * 获取当前位置的完整天气数据（包括当前天气和预报）
 * 
 * API 调用格式:
 * https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&appid={API密钥}
 * 
 * @param lat 纬度
 * @param lon 经度
 * @returns 完整的天气数据（当前天气和预报）
 */
export const getOneCallWeather = async (lat: number, lon: number): Promise<OneCallResponse | null> => {
  try {
    // 从环境变量获取API密钥
    const apiKey = getApiKey();
    
    console.log('API密钥是否存在 (OneCall):', !!apiKey);
    if (apiKey) {
      console.log('API密钥长度 (OneCall):', apiKey.length);
    }
    
    if (!apiKey) {
      console.error('OpenWeather API密钥未配置');
      return null;
    }

    // 构建API请求URL
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn&exclude=minutely`;
    
    console.log('构建的OneCall API URL:', url);
    
    console.log(`正在获取坐标 (${lat}, ${lon}) 的完整天气数据...`);
    console.log(`请求URL: ${url}`);
    
    // 发送请求
    const response = await axios.get<OneCallResponse>(url);
    
    console.log(`OneCall API响应状态: ${response.status}`);
    console.log(`OneCall API响应头:`, response.headers);
    
    // 检查响应状态
    if (response.status !== 200) {
      console.error('获取完整天气数据失败:', response.statusText);
      return null;
    }
    
    const data = response.data;
    
    console.log(`成功获取坐标 (${lat}, ${lon}) 的完整天气数据`, data);
    
    // 验证数据结构
    if (!data.current || !data.daily || !data.hourly) {
      console.warn('OneCall API返回的数据结构不完整:', data);
    }
    
    return data;
  } catch (error: any) {
    console.error('获取完整天气数据时出错:', error.message);
    
    // 如果是axios错误，提供更多详细信息
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('API响应错误:', error.response.status, error.response.data);
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络请求错误:', error.request);
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
    }
    
    return null;
  }
};

/**
 * 获取指定时间的历史天气数据
 * 
 * API 调用格式:
 * https://api.openweathermap.org/data/3.0/onecall/timemachine?lat={lat}&lon={lon}&dt={time}&appid={API密钥}
 * 
 * @param lat 纬度
 * @param lon 经度
 * @param timestamp Unix时间戳
 * @returns 历史天气数据
 */
export const getHistoricalWeather = async (lat: number, lon: number, timestamp: number): Promise<TimeMachineResponse | null> => {
  try {
    // 从环境变量获取API密钥
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.error('OpenWeather API密钥未配置');
      return null;
    }

    // 构建API请求URL
    const url = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${timestamp}&appid=${apiKey}&units=metric&lang=zh_cn`;
    
    console.log(`正在获取坐标 (${lat}, ${lon}) 在时间 ${timestamp} 的历史天气数据...`);
    console.log(`请求URL: ${url}`);
    
    // 发送请求
    const response = await axios.get<TimeMachineResponse>(url);
    
    // 检查响应状态
    if (response.status !== 200) {
      console.error('获取历史天气数据失败:', response.statusText);
      return null;
    }
    
    const data = response.data;
    
    console.log(`成功获取坐标 (${lat}, ${lon}) 在时间 ${timestamp} 的历史天气数据`);
    
    return data;
  } catch (error: any) {
    console.error('获取历史天气数据时出错:', error.message);
    
    // 如果是axios错误，提供更多详细信息
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('API响应错误:', error.response.status, error.response.data);
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络请求错误:', error.request);
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
    }
    
    return null;
  }
};

/**
 * 获取指定日期的天气摘要数据
 * 
 * API 调用格式:
 * https://api.openweathermap.org/data/3.0/onecall/day_summary?lat={lat}&lon={lon}&date={date}&appid={API密钥}
 * 
 * @param lat 纬度
 * @param lon 经度
 * @param date 日期 (格式: YYYY-MM-DD)
 * @returns 指定日期的天气摘要数据
 */
export const getDaySummary = async (lat: number, lon: number, date: string): Promise<DaySummaryResponse | null> => {
  try {
    // 从环境变量获取API密钥
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.error('OpenWeather API密钥未配置');
      return null;
    }

    // 构建API请求URL
    const url = `https://api.openweathermap.org/data/3.0/onecall/day_summary?lat=${lat}&lon=${lon}&date=${date}&appid=${apiKey}&units=metric&lang=zh_cn`;
    
    console.log(`正在获取坐标 (${lat}, ${lon}) 在日期 ${date} 的天气摘要数据...`);
    console.log(`请求URL: ${url}`);
    
    // 发送请求
    const response = await axios.get<DaySummaryResponse>(url);
    
    // 检查响应状态
    if (response.status !== 200) {
      console.error('获取天气摘要数据失败:', response.statusText);
      return null;
    }
    
    const data = response.data;
    
    console.log(`成功获取坐标 (${lat}, ${lon}) 在日期 ${date} 的天气摘要数据`);
    
    return data;
  } catch (error: any) {
    console.error('获取天气摘要数据时出错:', error.message);
    
    // 如果是axios错误，提供更多详细信息
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('API响应错误:', error.response.status, error.response.data);
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络请求错误:', error.request);
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
    }
    
    return null;
  }
};

/**
 * 获取人类可读的天气概览和建议
 * 
 * API 调用格式:
 * https://api.openweathermap.org/data/3.0/onecall/overview?lat={lat}&lon={lon}&appid={API密钥}
 * 
 * @param lat 纬度
 * @param lon 经度
 * @returns 天气概览和建议
 */
export const getWeatherOverview = async (lat: number, lon: number): Promise<OverviewResponse | null> => {
  try {
    // 从环境变量获取API密钥
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.error('OpenWeather API密钥未配置');
      return null;
    }

    // 构建API请求URL
    const url = `https://api.openweathermap.org/data/3.0/onecall/overview?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`;
    
    console.log(`正在获取坐标 (${lat}, ${lon}) 的天气概览...`);
    console.log(`请求URL: ${url}`);
    
    // 发送请求
    const response = await axios.get<OverviewResponse>(url);
    
    // 检查响应状态
    if (response.status !== 200) {
      console.error('获取天气概览失败:', response.statusText);
      return null;
    }
    
    const data = response.data;
    
    console.log(`成功获取坐标 (${lat}, ${lon}) 的天气概览`);
    
    return data;
  } catch (error: any) {
    console.error('获取天气概览时出错:', error.message);
    
    // 如果是axios错误，提供更多详细信息
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('API响应错误:', error.response.status, error.response.data);
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络请求错误:', error.request);
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
    }
    
    return null;
  }
};

/**
 * 获取天气助手的Web界面URL
 * 
 * URL格式:
 * https://openweathermap.org/weather-assistant?apikey={API key}
 * 
 * @returns 天气助手的URL
 */
export const getWeatherAssistantUrl = (): string | null => {
  try {
    // 从环境变量获取API密钥
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.error('OpenWeather API密钥未配置');
      return null;
    }

    // 构建URL
    const url = `https://openweathermap.org/weather-assistant?apikey=${apiKey}`;
    
    console.log(`天气助手URL: ${url}`);
    
    return url;
  } catch (error: any) {
    console.error('生成天气助手URL时出错:', error.message);
    return null;
  }
};
