import axios from 'axios';

// 从环境变量获取API密钥
const apiKey = 'ec2dc4ba599e58e5b8755f8575a5f62e'; // 这是.env.local中的API密钥

console.log('Testing OpenWeather API with API key:', apiKey);

async function testWeatherAPI() {
  try {
    console.log('\n1. Testing city weather API...');
    
    // 测试城市天气API
    const cityUrl = `https://api.openweathermap.org/data/2.5/weather?q=Chiba&appid=${apiKey}&units=metric&lang=zh_cn`;
    console.log('Request URL:', cityUrl);
    
    const cityResponse = await axios.get(cityUrl);
    console.log('City API Status:', cityResponse.status);
    console.log('City Data:', JSON.stringify(cityResponse.data, null, 2));
    
    console.log('\n2. Testing OneCall API...');
    
    // 测试OneCall API
    const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=35.6073&lon=140.1065&appid=${apiKey}&units=metric&lang=zh_cn&exclude=minutely`;
    console.log('OneCall Request URL:', oneCallUrl);
    
    const oneCallResponse = await axios.get(oneCallUrl);
    console.log('OneCall API Status:', oneCallResponse.status);
    console.log('OneCall Data (first 500 chars):', JSON.stringify(oneCallResponse.data).substring(0, 500));
    
  } catch (error) {
    console.error('Error occurred:', error.message);
    
    if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data);
    }
  }
}

testWeatherAPI();