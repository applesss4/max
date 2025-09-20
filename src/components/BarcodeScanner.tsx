'use client'

import React, { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'

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
              setScanResult(result.data)
              onScan(result.data)
            },
            {
              onDecodeError: (err) => {
                // 这里忽略解码错误，因为可能不是二维码
                console.log('解码错误:', err)
              },
              maxScansPerSecond: 5,
              highlightScanRegion: true,
              highlightCodeOutline: true,
              returnDetailedScanResult: true
            }
          )
          
          scannerRef.current = scanner
          
          // 启动扫描
          await scanner.start()
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
          
          {/* 扫描区域提示 */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-4 border-green-500 rounded-lg relative">
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
              <h3 className="text-lg font-medium text-green-800">扫描成功</h3>
              <p className="text-green-700 mt-1 break-all">
                <span className="font-medium">条形码:</span> {scanResult}
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
          提示：将条形码或二维码对准扫描框即可自动识别
        </p>
      </div>
    </div>
  )
}

export default BarcodeScanner