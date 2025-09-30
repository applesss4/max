import CryptoJS from 'crypto-js'

// 使用环境变量中的密钥，如果不存在则使用默认值
const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-secret-key-for-password-vault'

/**
 * 加密密码
 * @param password 明文密码
 * @returns 加密后的密码
 */
export function encryptPassword(password: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(password, SECRET_KEY).toString()
    return encrypted
  } catch (error) {
    console.error('加密密码时出错:', error)
    throw new Error('密码加密失败')
  }
}

/**
 * 解密密码
 * @param encryptedPassword 加密的密码
 * @returns 解密后的明文密码
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return decrypted
  } catch (error) {
    console.error('解密密码时出错:', error)
    throw new Error('密码解密失败')
  }
}

/**
 * 生成加密密钥（用于在环境变量中设置）
 * @returns 随机生成的密钥
 */
export function generateEncryptionKey(): string {
  return CryptoJS.lib.WordArray.random(256/8).toString()
}