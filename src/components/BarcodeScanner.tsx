'use client'

import React, { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'

// 为了解决类型问题，我们声明一个扩展的 QrScanner 类型
declare module 'qr-scanner' {
  interface QrScannerOptions {
    preferredCamera?: string | { facingMode: string };
  }
}

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onError }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  // 初始化扫描器
  useEffect(() => {
    let scanner: QrScanner | null = null

    const initScanner = async () => {
      if (videoRef.current && !scannerRef.current) {
        try {
          // 检查浏览器是否支持所需API
          if (!navigator.mediaDevices || !window.MediaStream) {
            throw new Error('浏览器不支持摄像头功能')
          }

          scanner = new QrScanner(
            videoRef.current,
            (result) => {
              console.log('扫描结果:', result)
              // 处理条形码，接受多种格式
              if (result.data && isValidBarcode(result.data)) {
                setScanResult(result.data)
                onScan(result.data)
              }
            },
            {
              onDecodeError: (err) => {
                // 这里忽略解码错误，因为可能不是条形码
                console.log('解码错误:', err)
              },
              maxScansPerSecond: 20, // 设置扫描频率为每秒20次以提高识别率
              highlightScanRegion: true,
              highlightCodeOutline: true,
              returnDetailedScanResult: true,
              preferredCamera: 'environment' // 优先使用后置摄像头
            }
          )
          
          scannerRef.current = scanner
          
          // 启动扫描
          await scanner.start()
          
          // 设置扫描器以专门支持条形码
          scanner.setInversionMode('both'); // 支持正常和反色条形码
          
          // 调整灰度权重以优化条形码识别
          scanner.setGrayscaleWeights(0.2126, 0.7152, 0.0722, false);
          
          // 禁用二维码检测以提高条形码识别速度
          // @ts-ignore
          scanner._qrWorker?.setDetectQrCodes(false);
        } catch (err: any) {
          console.error('初始化扫描器失败:', err)
          const errorMsg = err.name === 'NotAllowedError' 
            ? '请允许访问摄像头权限' 
            : (err.message || '无法访问摄像头，请确保已授予权限')
          setError(errorMsg)
          if (onError) {
            onError(errorMsg)
          }
        }
      }
    }

    if (isScanning) {
      initScanner()
    }

    return () => {
      if (scanner) {
        scanner.stop()
        scanner.destroy()
        scannerRef.current = null
      }
    }
  }, [isScanning, onScan, onError])

  // 验证是否为有效的条形码（支持多种格式）
  const isValidBarcode = (data: string): boolean => {
    // 移除可能的空格并检查
    const cleanData = data.replace(/\s/g, '');
    
    // 支持多种条形码格式
    // EAN-13: 13位数字
    if (/^\d{13}$/.test(cleanData)) {
      return true;
    }
    
    // EAN-8: 8位数字
    if (/^\d{8}$/.test(cleanData)) {
      return true;
    }
    
    // UPC-A: 12位数字
    if (/^\d{12}$/.test(cleanData)) {
      return true;
    }
    
    // CODE-128: 可以包含字母、数字和特殊字符
    if (/^[\x00-\x7F]+$/.test(cleanData) && cleanData.length >= 4) {
      return true;
    }
    
    return false;
  }

  // 控制扫描状态
  const toggleScanning = async () => {
    if (isScanning) {
      // 停止扫描
      if (scannerRef.current) {
        scannerRef.current.stop()
        scannerRef.current.destroy()
        scannerRef.current = null
      }
      setIsScanning(false)
      setScanResult(null)
      setError(null)
    } else {
      // 开始扫描
      try {
        setError(null)
        setIsScanning(true)
      } catch (err: any) {
        console.error('启动扫描失败:', err)
        const errorMsg = err.message || '无法启动扫描功能'
        setError(errorMsg)
        if (onError) {
          onError(errorMsg)
        }
      }
    }
  }

  // 清除扫描结果
  const clearScanResult = () => {
    setScanResult(null)
  }

  return (
    <div className="barcode-scanner">
      <div className="scanner-container relative bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-700">
        {/* 视频显示区域 */}
        <div className="scanner-video w-full h-96 flex items-center justify-center relative">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover"
          />
          
          {/* 扫描区域提示 - 为条形码优化的水平矩形区域 */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-24 border-4 border-green-500 rounded-lg relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 animate-pulse"></div>
                <div className="absolute -inset-4 border-2 border-white border-opacity-20 rounded-xl"></div>
              </div>
            </div>
          )}
          
          {/* 状态覆盖层 */}
          {!isScanning && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <p className="text-white text-center">
                {error ? (
                  <span className="text-red-400">{error}</span>
                ) : (
                  <span>点击"开始扫描"按钮启动摄像头</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* 扫描结果显示 */}
      {scanResult && (
        <div className="scan-result mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-green-800">条形码扫描成功</h3>
              <p className="text-green-700 mt-1 break-all">
                <span className="font-medium">条形码:</span> {scanResult}
              </p>
              <p className="text-sm text-green-600 mt-1">
                长度: {scanResult.replace(/\s/g, '').length} 位
                {scanResult.replace(/\s/g, '').length === 13 && ' (EAN-13)'}
                {scanResult.replace(/\s/g, '').length === 12 && ' (UPC-A)'}
                {scanResult.replace(/\s/g, '').length === 8 && ' (EAN-8)'}
              </p>
            </div>
            <button
              onClick={clearScanResult}
              className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
            >
              清除
            </button>
          </div>
        </div>
      )}
      
      {/* 错误信息显示 */}
      {error && !scanResult && (
        <div className="error-message mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* 扫描控制按钮 */}
      <div className="scanner-controls mt-4 flex justify-center">
        <button
          onClick={toggleScanning}
          disabled={!!error}
          className={`px-6 py-3 rounded-lg font-medium ${
            isScanning 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400'
          } transition-colors`}
        >
          {isScanning ? '停止扫描' : '开始扫描'}
        </button>
      </div>
      
      {/* 使用说明 */}
      <div className="usage-instructions mt-4 text-sm text-gray-600">
        <p className="text-center">
          提示：将条形码对准扫描框即可自动识别
        </p>
        <p className="text-center mt-1 text-xs text-gray-500">
          支持EAN-13、EAN-8、UPC-A和CODE-128等多种条形码格式
        </p>
      </div>
    </div>
  )
}

export default BarcodeScanner