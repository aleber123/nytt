// Mock Firebase service for testing without Firebase setup
class MockFirebaseService {
  constructor() {
    this.orders = new Map();
    this.counters = new Map();
    this.counters.set('orders', { currentCount: 0, lastUpdated: new Date().toISOString() });
  }

  // Generate order number
  generateOrderNumber() {
    const counter = this.counters.get('orders');
    counter.currentCount += 1;
    counter.lastUpdated = new Date().toISOString();
    return `SWE${counter.currentCount.toString().padStart(6, '0')}`;
  }

  // Create order
  async createOrder(orderData) {
    const orderId = this.generateOrderNumber();

    const order = {
      id: orderId,
      orderNumber: orderId,
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.orders.set(orderId, order);

    console.log('📦 Mock order created:', orderId);
    console.log('📋 Order data:', order);

    return orderId;
  }

  // Get order by ID
  async getOrderById(orderId) {
    const order = this.orders.get(orderId);
    if (order) {
      console.log('📖 Mock order retrieved:', orderId);
      return order;
    }
    console.log('❌ Mock order not found:', orderId);
    return null;
  }

  // Get all orders
  async getAllOrders() {
    return Array.from(this.orders.values());
  }

  // Update order
  async updateOrder(orderId, updates) {
    const order = this.orders.get(orderId);
    if (order) {
      const updatedOrder = {
        ...order,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.orders.set(orderId, updatedOrder);
      console.log('📝 Mock order updated:', orderId);
      return updatedOrder;
    }
    return null;
  }

  // Delete order
  async deleteOrder(orderId) {
    const deleted = this.orders.delete(orderId);
    if (deleted) {
      console.log('🗑️ Mock order deleted:', orderId);
    }
    return deleted;
  }

  // Get orders by status
  async getOrdersByStatus(status) {
    const orders = Array.from(this.orders.values()).filter(order => order.status === status);
    console.log(`📋 Mock orders with status ${status}:`, orders.length);
    return orders;
  }

  // Get order count
  async getOrderCount() {
    return this.orders.size;
  }

  // Simulate file upload (mock)
  async uploadFile(file, orderId) {
    console.log(`📤 Mock uploading file: ${file.name} (${file.size} bytes) for order ${orderId}`);

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const uploadedFile = {
      originalName: file.name,
      size: file.size,
      type: file.type,
      downloadURL: `https://mock-storage.example.com/documents/${orderId}/${file.name}`,
      storagePath: `documents/${orderId}/${file.name}`,
      uploadedAt: new Date().toISOString()
    };

    console.log(`✅ Mock file uploaded: ${file.name}`);
    return uploadedFile;
  }

  // Simulate multiple file upload
  async uploadFiles(files, orderId) {
    console.log(`📤 Mock uploading ${files.length} files for order ${orderId}`);

    const uploadedFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        const uploadedFile = await this.uploadFile(file, orderId);
        uploadedFiles.push(uploadedFile);
      }
    }

    console.log(`🎉 Mock uploaded ${uploadedFiles.length} files successfully`);
    return uploadedFiles;
  }

  // Clear all data (for testing)
  clear() {
    this.orders.clear();
    this.counters.set('orders', { currentCount: 0, lastUpdated: new Date().toISOString() });
    console.log('🧹 Mock Firebase cleared');
  }
}

// Export singleton instance
const mockFirebase = new MockFirebaseService();

module.exports = {
  mockFirebase,
  MockFirebaseService
};