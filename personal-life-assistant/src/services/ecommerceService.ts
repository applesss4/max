import { supabase } from '@/lib/supabaseClient'

// 商品类型
export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  stock_quantity: number
  shop_id?: string // 添加超市ID字段
  created_at: string
  updated_at: string
}

// 购物车类型
export interface ShoppingCart {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

// 购物车项类型
export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  product?: Product // 关联的商品信息
}

// 订单类型
export interface Order {
  id: string
  user_id: string
  total_amount: number
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
  shipping_address: string | null
  created_at: string
  updated_at: string
}

// 订单项类型
export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number // 下单时的价格
  created_at: string
  updated_at: string
  product?: Product // 关联的商品信息
}

// 购物车详情类型（包含购物车项和商品信息）
export interface CartDetails {
  cart: ShoppingCart
  items: (CartItem & { product: Product & { shop?: { id: string; name: string } } })[]
  total_amount: number
}

// 分类类型
export interface Category {
  id: string
  name: string
  description: string | null
  user_id: string
  created_at: string
  updated_at: string
}

// 超市类型
export interface Shop {
  id: string
  name: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string
}

// ==================== 商品相关API ====================

// 获取所有商品
export const getAllProducts = async (): Promise<{ data: Product[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })
  
  return { data, error }
}

// 根据分类获取商品
export const getProductsByCategory = async (category: string): Promise<{ data: Product[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .order('name', { ascending: true })
  
  return { data, error }
}

// 获取单个商品详情
export const getProductById = async (id: string): Promise<{ data: Product | null, error: any }> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  
  return { data, error }
}

// 获取单个商品详情（包含超市信息）
export const getProductByIdWithShop = async (id: string): Promise<{ data: (Product & { shop?: { id: string; name: string } }) | null, error: any }> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      shop:shops (id, name)
    `)
    .eq('id', id)
    .single()
  
  return { data, error }
}

// 获取同一商品名在不同超市的价格信息
export const getProductPricesByProductName = async (productName: string): Promise<{ data: (Product & { shop?: { id: string; name: string } })[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      shop:shops (id, name)
    `)
    .eq('name', productName)
    .order('price', { ascending: true }) // 按价格升序排列，最低价在前
  
  return { data, error }
}

// 获取所有商品，按名称分组并显示最低价格和超市信息
export const getAllProductsWithPrices = async (): Promise<{ data: (Product & { lowest_price: number; shop_count: number; shop_name: string })[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      shop:shops (name)
    `)
  
  if (error) return { data: null, error }
  
  // 按商品名称分组
  const groupedProducts: { [key: string]: any[] } = {}
  data.forEach((product: any) => {
    if (!groupedProducts[product.name]) {
      groupedProducts[product.name] = []
    }
    groupedProducts[product.name].push(product)
  })
  
  // 为每个商品组创建一个合并的条目
  const mergedProducts = Object.keys(groupedProducts).map(name => {
    const products = groupedProducts[name]
    // 按价格排序，获取最低价
    const sortedProducts = products.sort((a, b) => a.price - b.price)
    const lowestPriceProduct = sortedProducts[0]
    
    return {
      ...lowestPriceProduct,
      lowest_price: lowestPriceProduct.price,
      shop_count: products.length,
      shop_name: lowestPriceProduct.shop?.name || ''
    }
  })
  
  return { data: mergedProducts, error: null }
}

// 根据分类获取商品，按名称分组并显示最低价格和超市信息
export const getProductsByCategoryWithPrices = async (category: string): Promise<{ data: (Product & { lowest_price: number; shop_count: number; shop_name: string })[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      shop:shops (name)
    `)
    .eq('category', category)
  
  if (error) return { data: null, error }
  
  // 按商品名称分组
  const groupedProducts: { [key: string]: any[] } = {}
  data.forEach((product: any) => {
    if (!groupedProducts[product.name]) {
      groupedProducts[product.name] = []
    }
    groupedProducts[product.name].push(product)
  })
  
  // 为每个商品组创建一个合并的条目
  const mergedProducts = Object.keys(groupedProducts).map(name => {
    const products = groupedProducts[name]
    // 按价格排序，获取最低价
    const sortedProducts = products.sort((a, b) => a.price - b.price)
    const lowestPriceProduct = sortedProducts[0]
    
    return {
      ...lowestPriceProduct,
      lowest_price: lowestPriceProduct.price,
      shop_count: products.length,
      shop_name: lowestPriceProduct.shop?.name || ''
    }
  })
  
  return { data: mergedProducts, error: null }
}

// 创建商品
export const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Product | null, error: any }> => {
  // 验证图片URL格式
  const validatedProduct = {
    ...product,
    image_url: product.image_url && (product.image_url.startsWith('data:image') || product.image_url.startsWith('http')) 
      ? product.image_url 
      : null
  }
  
  // 优化Base64图片数据，减少存储大小
  if (validatedProduct.image_url && validatedProduct.image_url.startsWith('data:image')) {
    // 移除Base64数据中的换行符和空格以减小大小
    validatedProduct.image_url = validatedProduct.image_url.replace(/\s+/g, '');
  }
  
  const { data, error } = await supabase
    .from('products')
    .insert([validatedProduct])
    .select()
    .single()
  
  return { data, error }
}

// 更新商品
export const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<{ data: Product | null, error: any }> => {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

// 删除商品
export const deleteProduct = async (id: string): Promise<{ data: null, error: any }> => {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  
  return { data, error }
}

// ==================== 超市相关API ====================

// 获取用户的超市列表
export const getUserShops = async (userId: string): Promise<{ data: Shop[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })
  
  return { data, error }
}

// 创建超市
export const createShop = async (userId: string, name: string, description?: string): Promise<{ data: { id: string; name: string; description?: string } | null, error: any }> => {
  const { data, error } = await supabase
    .from('shops')
    .insert([{ user_id: userId, name, description }])
    .select()
    .single()
  
  return { data, error }
}

// ==================== 分类相关API ====================

// 获取用户分类列表
export const getUserCategories = async (userId: string): Promise<{ data: Category[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })
  
  return { data, error }
}

// 创建分类
export const createCategory = async (userId: string, name: string, description?: string): Promise<{ data: Category | null, error: any }> => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ user_id: userId, name, description }])
    .select()
    .single()
  
  return { data, error }
}

// 更新分类
export const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>): Promise<{ data: Category | null, error: any }> => {
  const { data, error } = await supabase
    .from('categories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

// 删除分类
export const deleteCategory = async (id: string): Promise<{ data: null, error: any }> => {
  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
  
  return { data, error }
}

// ==================== 购物车相关API ====================

interface CartItemWithProduct extends CartItem {
  product: Product;
}

// 获取用户购物车（包括购物车项和商品信息）
export const getUserCart = async (userId: string): Promise<{ data: CartDetails | null, error: any }> => {
  try {
    console.log('获取用户购物车，用户ID:', userId);
    
    // 首先获取用户的购物车
    let { data: cart, error: cartError } = await supabase
      .from('shopping_carts')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    console.log('查询购物车结果:', { cart, cartError });
    
    // 如果购物车不存在，则创建一个
    if (!cart && (!cartError || cartError.code === 'PGRST116')) {
      console.log('购物车不存在，创建新购物车');
      const { data: newCart, error: newCartError } = await supabase
        .from('shopping_carts')
        .insert([{ user_id: userId }])
        .select()
        .single()
      
      console.log('创建购物车结果:', { newCart, newCartError });
      
      if (newCartError) {
        console.error('创建购物车失败:', newCartError);
        throw newCartError;
      }
      cart = newCart;
    }
    
    if (cartError && cartError.code !== 'PGRST116') {
      console.error('获取购物车错误:', cartError);
      throw cartError;
    }
    
    if (!cart) {
      console.error('无法创建或获取购物车');
      throw new Error('无法创建或获取购物车');
    }
    
    console.log('获取到购物车:', cart);
    
    // 获取购物车中的商品项（包括商品信息和超市信息）
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        product_id,
        quantity,
        created_at,
        updated_at,
        product:products (
          *,
          shop:shops (id, name)
        )
      `)
      .eq('cart_id', cart.id)
    
    console.log('获取购物车项结果:', { cartItems, itemsError });
    
    if (itemsError) {
      console.error('获取购物车项错误:', itemsError);
      throw itemsError;
    }
    
    // 转换数据格式以匹配CartDetails类型
    const transformedItems = (cartItems || [])
      .filter((item: any) => item.product !== null && item.product !== undefined) // 过滤掉没有关联商品的项
      .map((item: any) => {
        // 创建符合类型的对象
        const cartItem: CartItem & { product: Product & { shop?: { id: string; name: string } } } = {
          id: item.id,
          cart_id: item.cart_id,
          product_id: item.product_id,
          quantity: item.quantity,
          created_at: item.created_at,
          updated_at: item.updated_at,
          product: item.product as Product & { shop?: { id: string; name: string } }
        };
        return cartItem;
      });
    
    // 计算总金额
    const totalAmount = transformedItems.reduce((sum, item) => {
      return sum + (item.quantity * (item.product?.price || 0));
    }, 0);
    
    const cartDetails: CartDetails = {
      cart,
      items: transformedItems,
      total_amount: totalAmount
    };
    
    return { data: cartDetails, error: null };
  } catch (error) {
    console.error('获取用户购物车失败:', error);
    return { data: null, error };
  }
}

// 添加商品到购物车
export const addToCart = async (userId: string, productId: string, quantity: number = 1): Promise<{ data: CartItem | null, error: any }> => {
  try {
    // 获取或创建用户的购物车
    let { data: cart, error: cartError } = await supabase
      .from('shopping_carts')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    // 如果购物车不存在，则创建一个
    if (!cart && (!cartError || cartError.code === 'PGRST116')) {
      const { data: newCart, error: newCartError } = await supabase
        .from('shopping_carts')
        .insert([{ user_id: userId }])
        .select()
        .single()
      
      if (newCartError) throw newCartError
      cart = newCart
    }
    
    if (cartError && cartError.code !== 'PGRST116') throw cartError
    if (!cart) throw new Error('无法创建或获取购物车')
    
    // 检查商品是否已在购物车中
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .single()
    
    if (existingError && existingError.code !== 'PGRST116') throw existingError
    
    let cartItem
    if (existingItem) {
      // 如果商品已在购物车中，则更新数量
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      cartItem = updatedItem
    } else {
      // 如果商品不在购物车中，则添加新项
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert([{
          cart_id: cart.id,
          product_id: productId,
          quantity: quantity
        }])
        .select(`
          id,
          cart_id,
          product_id,
          quantity,
          created_at,
          updated_at,
          product:products (*)
        `)
        .single()
      
      if (insertError) throw insertError
      cartItem = newItem
    }
    
    return { data: cartItem, error: null }
  } catch (error) {
    console.error('添加到购物车失败:', error)
    return { data: null, error }
  }
}

// 更新购物车商品数量
export const updateCartItemQuantity = async (cartItemId: string, quantity: number): Promise<{ data: CartItem | null, error: any }> => {
  try {
    // 如果数量为0或负数，则删除该项
    if (quantity <= 0) {
      const { data, error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
      
      return { data: null, error }
    }
    
    // 更新数量
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single()
    
    return { data, error }
  } catch (error) {
    console.error('更新购物车商品数量失败:', error)
    return { data: null, error }
  }
}

// 从购物车删除商品
export const removeCartItem = async (cartItemId: string): Promise<{ data: null, error: any }> => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
    
    return { data, error }
  } catch (error) {
    console.error('从购物车删除商品失败:', error)
    return { data: null, error }
  }
}

// 清空购物车
export const clearCart = async (cartId: string): Promise<{ data: null, error: any }> => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
    
    return { data, error }
  } catch (error) {
    console.error('清空购物车失败:', error)
    return { data: null, error }
  }
}

// ==================== 订单相关API ====================

// 创建订单
export const createOrder = async (
  userId: string, 
  shippingAddress: string
): Promise<{ data: Order | null, error: any }> => {
  try {
    // 获取用户购物车详情
    const { data: cartDetails, error: cartError } = await getUserCart(userId)
    if (cartError) throw cartError
    if (!cartDetails) throw new Error('购物车为空')
    
    // 检查购物车是否为空
    if (cartDetails.items.length === 0) {
      throw new Error('购物车为空，无法创建订单')
    }
    
    // 开始数据库事务
    const { data: order, error: orderError } = await supabase.rpc('create_order_with_items', {
      user_id: userId,
      shipping_address: shippingAddress,
      total_amount: cartDetails.total_amount
    })
    
    if (orderError) throw orderError
    
    // 清空购物车
    await clearCart(cartDetails.cart.id)
    
    return { data: order, error: null }
  } catch (error) {
    console.error('创建订单失败:', error)
    return { data: null, error }
  }
}

// 获取用户订单列表
export const getUserOrders = async (userId: string): Promise<{ data: Order[] | null, error: any }> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  } catch (error) {
    console.error('获取用户订单列表失败:', error)
    return { data: null, error }
  }
}

// 获取订单详情（包括订单项和商品信息）
export const getOrderDetails = async (orderId: string): Promise<{ data: { order: Order, items: OrderItem[] } | null, error: any }> => {
  try {
    // 获取订单信息
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (orderError) throw orderError
    
    // 获取订单项（包括商品信息和超市信息）
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        product_id,
        quantity,
        price,
        created_at,
        updated_at,
        products (
          *,
          shop:shops (id, name)
        )
      `)
      .eq('order_id', orderId)
    
    if (itemsError) throw itemsError
    
    return {
      data: {
        order,
        items: orderItems.map(item => ({
          ...item,
          product: item.products as unknown as Product
        }))
      },
      error: null
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    return { data: null, error }
  }
}

// 更新订单状态
export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<{ data: Order | null, error: any }> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single()
    
    return { data, error }
  } catch (error) {
    console.error('更新订单状态失败:', error)
    return { data: null, error }
  }
}