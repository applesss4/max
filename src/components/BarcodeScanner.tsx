'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onError }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const scannerContainerRef = useRef<HTMLDivElement>(null)

  // 检查是否为移动设备
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // 初始化扫描器
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null

    const initScanner = async () => {
      if (scannerContainerRef.current && !scannerRef.current) {
        try {
          setIsLoading(true)
          // 清空容器
          scannerContainerRef.current.innerHTML = ''
          
          // 根据设备类型调整扫描区域
          const isMobileDevice = isMobile()
          const qrBoxSize = isMobileDevice 
            ? { width: 250, height: 250 } 
            : { width: 300, height: 150 }
          
          // 创建扫描器实例
          scanner = new Html5QrcodeScanner(
            'barcode-scanner-container',
            {
              fps: 10, // 降低FPS以提高移动设备性能
              qrbox: qrBoxSize,
              aspectRatio: 1.0,
              disableFlip: false,
              rememberLastUsedCamera: true, // 记住上次使用的摄像头
              // 启用多种条形码格式支持
              formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
              ]
            },
            false // 不显示选择文件按钮
          )
          
          scannerRef.current = scanner
          
          // 渲染扫描器
          scanner.render(
            (decodedText, decodedResult) => {
              console.log('扫描结果:', decodedText, decodedResult)
              // 处理条形码，接受多种格式
              if (decodedText && isValidBarcode(decodedText)) {
                setScanResult(decodedText)
                onScan(decodedText)
                // 扫描成功后停止扫描
                stopScanner()
              }
            },
            (errorMessage) => {
              console.log('解码错误:', errorMessage)
              // 只在严重错误时显示错误信息
              if (errorMessage.includes('Permission') || errorMessage.includes('permission')) {
                const errorMsg = '请允许访问摄像头权限才能使用扫描功能'
                setError(errorMsg)
                if (onError) {
                  onError(errorMsg)
                }
              }
            }
          )
        } catch (err: any) {
          console.error('初始化扫描器失败:', err)
          let errorMsg = '无法初始化摄像头，请确保已授予权限并刷新页面重试'
          
          if (err.name === 'NotAllowedError') {
            errorMsg = '请允许访问摄像头权限才能使用扫描功能'
          } else if (err.name === 'NotFoundError' || err.message.includes('NotFoundError')) {
            errorMsg = '未检测到可用的摄像头设备'
          } else if (err.name === 'NotReadableError') {
            errorMsg = '摄像头正在被其他应用占用，请关闭其他应用后重试'
          } else if (err.name === 'OverconstrainedError') {
            errorMsg = '摄像头不支持当前配置，请尝试刷新页面'
          }
          
          setError(errorMsg)
          if (onError) {
            onError(errorMsg)
          }
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (isScanning) {
      initScanner()
    } else {
      stopScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isScanning, onScan, onError])

  // 停止扫描器
  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
      } catch (err) {
        console.log('停止扫描器时出现错误:', err)
      }
      scannerRef.current = null
    }
    if (scannerContainerRef.current) {
      scannerContainerRef.current.innerHTML = ''
    }
  }

  // 验证是否为有效的条形码（支持多种格式）
  const isValidBarcode = (data: string): boolean => {
    // 移除可能的空格并检查
    const cleanData = data.replace(/\s/g, '')
    
    // 支持多种条形码格式
    // EAN-13: 13位数字
    if (/^\d{13}$/.test(cleanData)) {
      return true
    }
    
    // EAN-8: 8位数字
    if (/^\d{8}$/.test(cleanData)) {
      return true
    }
    
    // UPC-A: 12位数字
    if (/^\d{12}$/.test(cleanData)) {
      return true
    }
    
    // CODE-128: 可以包含字母、数字和特殊字符
    if (/^[\x00-\x7F]+$/.test(cleanData) && cleanData.length >= 4) {
      return true
    }
    
    // QR码内容可以是任意文本
    if (cleanData.length > 0) {
      return true
    }
    
    return false
  }

  // 控制扫描状态
  const toggleScanning = async () => {
    if (isScanning) {
      // 停止扫描
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
          <div 
            ref={scannerContainerRef}
            id="barcode-scanner-container"
            className="w-full h-full"
          />
          
          {/* 加载状态覆盖层 */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-2"></div>
                <p>正在初始化摄像头...</p>
              </div>
            </div>
          )}
          
          {/* 状态覆盖层 */}
          {!isScanning && !isLoading && (
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
      {error && !scanResult && !isLoading && (
        <div className="error-message mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          {error.includes('权限') && (
            <p className="text-red-600 text-sm mt-2">
              解决方法：请在浏览器设置中允许摄像头权限，然后刷新页面重试
            </p>
          )}
        </div>
      )}
      
      {/* 扫描控制按钮 */}
      <div className="scanner-controls mt-4 flex justify-center">
        <button
          onClick={toggleScanning}
          disabled={isLoading}
          className={`px-6 py-3 rounded-lg font-medium ${
            isScanning 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400'
          } transition-colors flex items-center`}
        >
          {isLoading ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
              初始化中...
            </>
          ) : isScanning ? (
            '停止扫描'
          ) : (
            '开始扫描'
          )}
        </button>
      </div>
      
      {/* 使用说明 */}
      <div className="usage-instructions mt-4 text-sm text-gray-600">
        <p className="text-center">
          提示：将条形码对准扫描框即可自动识别
        </p>
        <p className="text-center mt-1 text-xs text-gray-500">
          支持EAN-13、EAN-8、UPC-A、UPC-E、CODE-128、CODE-39和QR码等多种格式
        </p>
        <p className="text-center mt-1 text-xs text-gray-500">
          移动端使用时请确保已授予摄像头权限
        </p>
      </div>
    </div>
  )
}

export default BarcodeScanner