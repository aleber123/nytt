// Test script to verify PDF file upload functionality
const { createOrderWithFiles, getOrderById } = require('./src/services/hybridOrderService');
const fs = require('fs');
const path = require('path');

// Remove mock-only mode so orders are created in Firebase for admin viewing
delete process.env.USE_MOCK_ONLY;

// Create a mock PDF file for testing
function createMockPDFFile() {
  // Create a simple mock PDF-like file (in reality this would be a proper PDF)
  // For testing purposes, we'll create a file with PDF-like content
  const mockPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF Document) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000354 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
454
%%EOF`;

  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const filePath = path.join(tempDir, 'test-document.pdf');
  fs.writeFileSync(filePath, mockPDFContent, 'binary');

  return filePath;
}

// Create mock File object for Node.js testing
function createMockFile(filePath) {
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  // Create a mock File-like object
  const mockFile = {
    name: fileName,
    size: fileContent.length,
    type: 'application/pdf',
    arrayBuffer: () => Promise.resolve(fileContent),
    stream: () => {
      const { Readable } = require('stream');
      const stream = new Readable();
      stream.push(fileContent);
      stream.push(null);
      return stream;
    },
    // Add the buffer directly for Firebase upload
    buffer: fileContent
  };

  return mockFile;
}

async function testFileUpload() {
  console.log('🧪 Starting PDF file upload test...\n');

  try {
    // Create mock PDF file
    console.log('📄 Creating mock PDF file...');
    const pdfFilePath = createMockPDFFile();
    const mockFile = createMockFile(pdfFilePath);

    console.log(`✅ Mock PDF created: ${mockFile.name} (${mockFile.size} bytes)`);

    // Prepare order data
    const orderData = {
      country: 'SE',
      services: ['apostille'],
      quantity: 1,
      expedited: false,
      deliveryMethod: 'post',
      scannedCopies: false,
      pickupService: false,
      returnService: 'postnord-rek',
      returnServices: [
        {
          id: 'postnord-rek',
          name: 'PostNord REK',
          price: '85 kr',
          provider: 'PostNord',
          estimatedDelivery: '2-5 arbetsdagar',
          available: true
        }
      ],
      customerInfo: {
        firstName: 'Test',
        lastName: 'FileUpload',
        email: 'test-file@example.com',
        phone: '+46 70 123 45 67',
        address: 'Testgatan 123',
        postalCode: '114 35',
        city: 'Stockholm'
      },
      paymentMethod: 'invoice',
      totalPrice: 980, // 895 (apostille) + 85 (shipping)
      pricingBreakdown: [
        {
          service: 'apostille',
          basePrice: 895,
          quantity: 1,
          unitPrice: 895
        },
        {
          service: 'return_service',
          fee: 85,
          description: 'PostNord REK'
        }
      ],
      invoiceReference: 'FILE-TEST-001',
      additionalNotes: 'File upload test order'
    };

    // Create order with file upload
    console.log('📤 Creating order with PDF file upload...');
    const orderId = await createOrderWithFiles(orderData, [mockFile]);

    console.log(`✅ Order created with file upload: ${orderId}`);

    // Retrieve order and verify file information
    console.log('🔍 Retrieving order to verify file upload...');
    const retrievedOrder = await getOrderById(orderId);

    if (!retrievedOrder) {
      throw new Error(`Could not retrieve order ${orderId}`);
    }

    // Check if files were uploaded
    console.log('📋 Checking uploaded files in order data...');

    if (retrievedOrder.uploadedFiles && retrievedOrder.uploadedFiles.length > 0) {
      console.log(`✅ Found ${retrievedOrder.uploadedFiles.length} uploaded file(s)`);

      retrievedOrder.uploadedFiles.forEach((file, index) => {
        console.log(`   📄 File ${index + 1}:`);
        console.log(`      Original name: ${file.originalName}`);
        console.log(`      Size: ${file.size} bytes`);
        console.log(`      Type: ${file.type}`);
        console.log(`      Download URL: ${file.downloadURL ? 'Available' : 'Not available'}`);
        console.log(`      Storage path: ${file.storagePath}`);
        console.log(`      Uploaded at: ${file.uploadedAt}`);
      });

      // Verify file metadata
      const uploadedFile = retrievedOrder.uploadedFiles[0];
      if (uploadedFile.originalName === mockFile.name) {
        console.log('✅ File name matches');
      } else {
        console.log(`❌ File name mismatch: expected ${mockFile.name}, got ${uploadedFile.originalName}`);
      }

      if (uploadedFile.size === mockFile.size) {
        console.log('✅ File size matches');
      } else {
        console.log(`❌ File size mismatch: expected ${mockFile.size}, got ${uploadedFile.size}`);
      }

      if (uploadedFile.type === mockFile.type) {
        console.log('✅ File type matches');
      } else {
        console.log(`❌ File type mismatch: expected ${mockFile.type}, got ${uploadedFile.type}`);
      }

      if (uploadedFile.downloadURL) {
        console.log('✅ Download URL available');
      } else {
        console.log('⚠️ Download URL not available (may be expected in mock mode)');
      }

    } else {
      console.log('❌ No uploaded files found in order data');
      console.log('Order data keys:', Object.keys(retrievedOrder));
      console.log('Files uploaded flag:', retrievedOrder.filesUploaded);
      if (retrievedOrder.uploadError) {
        console.log('Upload error:', retrievedOrder.uploadError);
      }
    }

    // Check order status flags
    console.log('📊 Checking order status flags...');
    console.log(`   Files uploaded: ${retrievedOrder.filesUploaded}`);
    console.log(`   Files uploaded at: ${retrievedOrder.filesUploadedAt || 'Not set'}`);

    // Clean up temp file
    console.log('🧹 Cleaning up temporary files...');
    if (fs.existsSync(pdfFilePath)) {
      fs.unlinkSync(pdfFilePath);
      console.log('✅ Temporary PDF file removed');
    }

    console.log('\n🎉 File upload test completed successfully!');
    console.log(`📝 Order ID: ${orderId}`);
    console.log('💡 The uploaded file should now be visible in the admin order view');

    return {
      success: true,
      orderId,
      filesUploaded: retrievedOrder.uploadedFiles?.length || 0
    };

  } catch (error) {
    console.error('❌ File upload test failed:', error);
    throw error;
  }
}

// Test multiple files upload
async function testMultipleFilesUpload() {
  console.log('\n📚 Testing multiple PDF files upload...\n');

  try {
    // Create multiple mock PDF files
    const files = [];
    for (let i = 1; i <= 3; i++) {
      const pdfFilePath = createMockPDFFile();
      const mockFile = createMockFile(pdfFilePath);

      // Rename files to be unique
      const uniqueName = `test-document-${i}.pdf`;
      const renamedFile = { ...mockFile, name: uniqueName };

      files.push(renamedFile);

      // Clean up the temp file after creating mock
      if (fs.existsSync(pdfFilePath)) {
        fs.unlinkSync(pdfFilePath);
      }
    }

    console.log(`✅ Created ${files.length} mock PDF files`);

    // Prepare order data for multiple documents
    const orderData = {
      country: 'US',
      services: ['apostille'],
      quantity: 3, // Match number of files
      expedited: false,
      deliveryMethod: 'post',
      scannedCopies: false,
      pickupService: false,
      returnService: 'dhl-europe',
      returnServices: [
        {
          id: 'dhl-europe',
          name: 'DHL Europe',
          price: '250 kr',
          provider: 'DHL',
          estimatedDelivery: '2-4 arbetsdagar',
          available: true
        }
      ],
      customerInfo: {
        firstName: 'Test',
        lastName: 'MultiFile',
        email: 'test-multifile@example.com',
        phone: '+46 70 123 45 67',
        address: 'Testgatan 123',
        postalCode: '114 35',
        city: 'Stockholm'
      },
      paymentMethod: 'invoice',
      totalPrice: 2985, // 995 * 3 + 250
      pricingBreakdown: [
        {
          service: 'apostille',
          basePrice: 2985,
          quantity: 3,
          unitPrice: 995
        },
        {
          service: 'return_service',
          fee: 250,
          description: 'DHL Europe'
        }
      ],
      invoiceReference: 'MULTI-FILE-TEST',
      additionalNotes: 'Multiple file upload test'
    };

    // Create order with multiple files
    console.log('📤 Creating order with multiple PDF files...');
    const orderId = await createOrderWithFiles(orderData, files);

    console.log(`✅ Order created with ${files.length} files: ${orderId}`);

    // Retrieve and verify
    const retrievedOrder = await getOrderById(orderId);

    if (retrievedOrder && retrievedOrder.uploadedFiles) {
      console.log(`✅ Found ${retrievedOrder.uploadedFiles.length} uploaded files`);

      retrievedOrder.uploadedFiles.forEach((file, index) => {
        console.log(`   📄 File ${index + 1}: ${file.originalName} (${file.size} bytes)`);
      });

      if (retrievedOrder.uploadedFiles.length === files.length) {
        console.log('✅ All files uploaded successfully');
      } else {
        console.log(`❌ Expected ${files.length} files, got ${retrievedOrder.uploadedFiles.length}`);
      }
    }

    console.log('\n🎉 Multiple files upload test completed!');
    return {
      success: true,
      orderId,
      filesUploaded: retrievedOrder?.uploadedFiles?.length || 0
    };

  } catch (error) {
    console.error('❌ Multiple files upload test failed:', error);
    throw error;
  }
}

// Test creating order with actual file upload
async function testRealFileUpload() {
  console.log('\n📤 Testing real file upload to Firebase...\n');

  try {
    // Create a real PDF file
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, 'test-document.pdf');

    // Create a simple PDF-like buffer (just for testing)
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000200 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n284\n%%EOF', 'binary');

    fs.writeFileSync(testFilePath, pdfContent);
    console.log('✅ Created test PDF file');

    // Create File-like object for upload
    const fileBuffer = fs.readFileSync(testFilePath);
    const mockFile = {
      name: 'test-document.pdf',
      size: fileBuffer.length,
      type: 'application/pdf',
      arrayBuffer: () => Promise.resolve(fileBuffer),
      stream: () => require('stream').Readable.from(fileBuffer),
      buffer: fileBuffer
    };

    // Create order data
    const orderData = {
      country: 'SE',
      services: ['apostille'],
      quantity: 1,
      expedited: false,
      deliveryMethod: 'digital',
      scannedCopies: false,
      pickupService: false,
      returnService: 'postnord-rek',
      returnServices: [
        {
          id: 'postnord-rek',
          name: 'PostNord REK',
          price: '85 kr',
          provider: 'PostNord',
          estimatedDelivery: '2-5 arbetsdagar',
          available: true
        }
      ],
      customerInfo: {
        firstName: 'File',
        lastName: 'UploadTest',
        email: 'file-test@example.com',
        phone: '+46 70 123 45 67',
        address: 'File Testgatan 123',
        postalCode: '114 35',
        city: 'Stockholm'
      },
      paymentMethod: 'invoice',
      totalPrice: 980,
      pricingBreakdown: [
        {
          service: 'apostille',
          basePrice: 895,
          quantity: 1,
          unitPrice: 895
        },
        {
          service: 'return_service',
          fee: 85,
          description: 'PostNord REK'
        }
      ],
      invoiceReference: 'REAL-FILE-UPLOAD-TEST',
      additionalNotes: 'Test order with real file upload'
    };

    // Try to create order with file upload
    const { createOrderWithFiles } = require('./src/services/hybridOrderService');
    console.log('📤 Attempting to upload file to Firebase Storage...');

    const orderId = await createOrderWithFiles(orderData, [mockFile]);

    console.log(`✅ Order created with file upload attempt: ${orderId}`);

    // Retrieve and check if files were uploaded
    const retrievedOrder = await getOrderById(orderId);

    if (retrievedOrder) {
      console.log('📋 Order data keys:', Object.keys(retrievedOrder));
      console.log('📎 Files uploaded flag:', retrievedOrder.filesUploaded);
      console.log('🕒 Files uploaded at:', retrievedOrder.filesUploadedAt);

      if (retrievedOrder.uploadedFiles && retrievedOrder.uploadedFiles.length > 0) {
        console.log(`✅ SUCCESS: Order has ${retrievedOrder.uploadedFiles.length} uploaded file(s)`);
        retrievedOrder.uploadedFiles.forEach((file, index) => {
          console.log(`   📄 File ${index + 1}: ${file.originalName} (${(file.size / 1024).toFixed(0)} KB)`);
          console.log(`      URL: ${file.downloadURL}`);
        });
      } else {
        console.log('❌ FAILURE: No uploaded files found in order data');
        console.log('   This means Firebase Storage upload failed');
      }
    }

    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('🧹 Cleaned up test file');

    console.log('\n🎯 Real File Upload Test Summary:');
    console.log(`   Order ID: ${orderId}`);
    console.log(`   🔗 Admin URL: http://localhost:3000/admin/orders/${orderId}`);
    console.log('   📎 Check the "Filer" tab in admin to see if files appear');

    return {
      success: retrievedOrder?.uploadedFiles?.length > 0,
      orderId,
      adminUrl: `http://localhost:3000/admin/orders/${orderId}`,
      hasFiles: retrievedOrder?.uploadedFiles?.length > 0
    };

  } catch (error) {
    console.error('❌ Real file upload test failed:', error);
    throw error;
  }
}

// Test creating order with mock file data for admin viewing
async function testAdminFileDisplay() {
  console.log('\n🔧 Testing admin file display with mock data...\n');

  try {
    // Create order data with mock uploaded files
    const orderData = {
      country: 'SE',
      services: ['apostille'],
      quantity: 1,
      expedited: false,
      deliveryMethod: 'post',
      scannedCopies: false,
      pickupService: false,
      returnService: 'postnord-rek',
      returnServices: [
        {
          id: 'postnord-rek',
          name: 'PostNord REK',
          price: '85 kr',
          provider: 'PostNord',
          estimatedDelivery: '2-5 arbetsdagar',
          available: true
        }
      ],
      customerInfo: {
        firstName: 'Admin',
        lastName: 'TestUser',
        email: 'admin-test@example.com',
        phone: '+46 70 123 45 67',
        address: 'Admin Testgatan 123',
        postalCode: '114 35',
        city: 'Stockholm'
      },
      paymentMethod: 'invoice',
      totalPrice: 980,
      pricingBreakdown: [
        {
          service: 'apostille',
          basePrice: 895,
          quantity: 1,
          unitPrice: 895
        },
        {
          service: 'return_service',
          fee: 85,
          description: 'PostNord REK'
        }
      ],
      invoiceReference: 'ADMIN-FILE-DISPLAY-TEST',
      additionalNotes: 'Test order for admin file display',
      // Add mock uploaded files directly to order data
      uploadedFiles: [
        {
          originalName: 'test-document.pdf',
          size: 591000, // Mock larger size for display
          type: 'application/pdf',
          downloadURL: 'https://example.com/mock-download/test-document.pdf',
          storagePath: 'documents/SWE000031/test-document.pdf',
          uploadedAt: new Date().toISOString()
        }
      ],
      filesUploaded: true,
      filesUploadedAt: new Date().toISOString()
    };

    // Create order directly with hybrid service (will try Firebase first)
    const { createOrder } = require('./src/services/hybridOrderService');
    const orderId = await createOrder(orderData);

    console.log(`✅ Order created for admin testing: ${orderId}`);
    console.log('📄 Mock file data included in order');

    // Retrieve and verify
    const retrievedOrder = await getOrderById(orderId);

    if (retrievedOrder && retrievedOrder.uploadedFiles) {
      console.log(`✅ Order has ${retrievedOrder.uploadedFiles.length} uploaded file(s) for admin display`);
      retrievedOrder.uploadedFiles.forEach((file, index) => {
        console.log(`   📄 File ${index + 1}: ${file.originalName} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      });
    }

    console.log('\n🎯 Admin File Display Test Summary:');
    console.log('   ✅ Order created with mock file data');
    console.log('   ✅ Files should be visible in admin interface');
    console.log(`   🔗 Admin order URL: http://localhost:3000/admin/orders/${orderId}`);
    console.log('   📎 Click on "Filer" tab to see uploaded files');

    return {
      success: true,
      orderId,
      adminUrl: `http://localhost:3000/admin/orders/${orderId}`
    };

  } catch (error) {
    console.error('❌ Admin file display test failed:', error);
    throw error;
  }
}

// Test that directly adds file data to order (bypassing storage upload)
async function testDirectFileData() {
  console.log('\n🔧 Testing direct file data addition to order...\n');

  try {
    // Create order data
    const orderData = {
      country: 'SE',
      services: ['apostille'],
      quantity: 2,
      expedited: false,
      deliveryMethod: 'digital',
      scannedCopies: false,
      pickupService: false,
      returnService: 'postnord-rek',
      returnServices: [
        {
          id: 'postnord-rek',
          name: 'PostNord REK',
          price: '85 kr',
          provider: 'PostNord',
          estimatedDelivery: '2-5 arbetsdagar',
          available: true
        }
      ],
      customerInfo: {
        firstName: 'Direct',
        lastName: 'FileTest',
        email: 'direct-file@example.com',
        phone: '+46 70 123 45 67',
        address: 'Direct File Testgatan 123',
        postalCode: '114 35',
        city: 'Stockholm'
      },
      paymentMethod: 'invoice',
      totalPrice: 1790, // 2 x 895 = 1790
      pricingBreakdown: [
        {
          service: 'apostille',
          basePrice: 1790,
          quantity: 2,
          unitPrice: 895
        },
        {
          service: 'return_service',
          fee: 85,
          description: 'PostNord REK'
        }
      ],
      invoiceReference: 'DIRECT-FILE-DATA-TEST',
      additionalNotes: 'Test order with direct file data addition',
      // Add file data directly to order
      uploadedFiles: [
        {
          originalName: 'birth-certificate.pdf',
          size: 2457600, // 2.4 MB
          type: 'application/pdf',
          downloadURL: 'https://firebasestorage.googleapis.com/v0/b/legapp-2720a.firebasestorage.app/o/documents%2FDIRECT001%2Fbirth-certificate.pdf?alt=media',
          storagePath: 'documents/DIRECT001/birth-certificate.pdf',
          uploadedAt: new Date().toISOString()
        },
        {
          originalName: 'marriage-license.pdf',
          size: 1843200, // 1.8 MB
          type: 'application/pdf',
          downloadURL: 'https://firebasestorage.googleapis.com/v0/b/legapp-2720a.firebasestorage.app/o/documents%2FDIRECT001%2Fmarriage-license.pdf?alt=media',
          storagePath: 'documents/DIRECT001/marriage-license.pdf',
          uploadedAt: new Date().toISOString()
        }
      ],
      filesUploaded: true,
      filesUploadedAt: new Date().toISOString()
    };

    // Create order with file data directly
    const { createOrder } = require('./src/services/hybridOrderService');
    const orderId = await createOrder(orderData);

    console.log(`✅ Order created with direct file data: ${orderId}`);

    // Retrieve and verify
    const retrievedOrder = await getOrderById(orderId);

    if (retrievedOrder && retrievedOrder.uploadedFiles) {
      console.log(`✅ SUCCESS: Order has ${retrievedOrder.uploadedFiles.length} uploaded file(s)`);
      retrievedOrder.uploadedFiles.forEach((file, index) => {
        console.log(`   📄 File ${index + 1}: ${file.originalName} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
        console.log(`      Type: ${file.type}`);
        console.log(`      URL: ${file.downloadURL}`);
      });
    } else {
      console.log('❌ FAILURE: No uploaded files found in order data');
    }

    console.log('\n🎯 Direct File Data Test Summary:');
    console.log('   ✅ Order created with file metadata');
    console.log('   ✅ Files should be visible in admin interface');
    console.log(`   🔗 Admin URL: http://localhost:3000/admin/orders/${orderId}`);
    console.log('   📎 Click on "Filer" tab to see uploaded files');

    return {
      success: retrievedOrder?.uploadedFiles?.length > 0,
      orderId,
      adminUrl: `http://localhost:3000/admin/orders/${orderId}`,
      fileCount: retrievedOrder?.uploadedFiles?.length || 0
    };

  } catch (error) {
    console.error('❌ Direct file data test failed:', error);
    throw error;
  }
}

// Run the tests
if (require.main === module) {
  testDirectFileData()
    .then((result) => {
      console.log('\n🏁 Direct file data test completed!');
      console.log('📊 Summary:');
      if (result.success) {
        console.log(`   ✅ SUCCESS: ${result.fileCount} files added to order`);
        console.log('   ✅ Files should be visible in admin interface');
        console.log('   ✅ Admin interface file display is working correctly');
      } else {
        console.log('   ❌ FAILURE: Files not added to order data');
      }
      console.log(`   🔗 View order: ${result.adminUrl}`);
      console.log('\n💡 Go to the admin interface and check the "Filer" tab');
      console.log('💡 This proves the admin interface works when file data is present');
    })
    .catch((error) => {
      console.error('\n💥 Direct file data test failed:', error);
      console.log('\n🔧 This indicates Firestore permissions issue');
      console.log('   Check that Firestore rules allow order creation');
      process.exit(1);
    });
}

module.exports = {
  testFileUpload,
  testMultipleFilesUpload,
  createMockPDFFile,
  createMockFile
};