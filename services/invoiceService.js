const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Invoice = require('../models/Invoice');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

class InvoiceService {
    /**
     * Generate invoice number
     */
    static async generateInvoiceNumber(restaurantId) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const startOfMonth = new Date(year, new Date().getMonth(), 1);

        // Try to find a unique invoice number
        let sequence = 1;
        let invoiceNumber;
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loop

        while (attempts < maxAttempts) {
            // Generate invoice number with current sequence
            const sequenceStr = String(sequence).padStart(4, '0');
            invoiceNumber = `INV-${year}${month}-${sequenceStr}`;

            // Check if this invoice number already exists for this restaurant
            const existing = await Invoice.findOne({
                restaurantId,
                invoiceNumber
            });

            if (!existing) {
                // Found a unique number
                return invoiceNumber;
            }

            // This number exists, try next sequence
            sequence++;
            attempts++;
        }

        // Fallback: use timestamp if we couldn't find a unique number
        const timestamp = Date.now().toString().slice(-6);
        return `INV-${year}${month}-${timestamp}`;
    }

    /**
     * Calculate GST and totals
     */
    static calculateTaxes(subtotal, discount = 0, discountPercentage = 0, isInterState = false) {
        // Calculate discount amount
        let discountAmount = discount;
        if (discountPercentage > 0) {
            discountAmount = (subtotal * discountPercentage) / 100;
        }

        // Amount after discount
        const amountAfterDiscount = subtotal - discountAmount;

        // Tax calculation (5% GST for restaurants)
        let taxDetails = {
            cgst: { rate: 0, amount: 0 },
            sgst: { rate: 0, amount: 0 },
            igst: { rate: 0, amount: 0 }
        };

        if (isInterState) {
            // IGST for inter-state transactions
            taxDetails.igst.rate = 5;
            taxDetails.igst.amount = (amountAfterDiscount * 5) / 100;
        } else {
            // CGST + SGST for intra-state transactions
            taxDetails.cgst.rate = 2.5;
            taxDetails.cgst.amount = (amountAfterDiscount * 2.5) / 100;
            taxDetails.sgst.rate = 2.5;
            taxDetails.sgst.amount = (amountAfterDiscount * 2.5) / 100;
        }

        const totalTax = taxDetails.cgst.amount + taxDetails.sgst.amount + taxDetails.igst.amount;
        const totalAmount = amountAfterDiscount + totalTax;

        // Round off to nearest rupee
        const grandTotal = Math.round(totalAmount);
        const roundOff = grandTotal - totalAmount;

        return {
            subtotal,
            discount: discountAmount,
            discountPercentage,
            taxDetails,
            totalTax,
            totalAmount,
            roundOff,
            grandTotal
        };
    }

    /**
     * Generate UPI QR Code
     */
    static async generateUPIQRCode(upiId, amount, restaurantName) {
        if (!upiId) return '';

        // UPI payment string format
        const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(restaurantName)}&am=${amount}&cu=INR`;

        try {
            // Generate QR code as base64 data URL
            const qrCode = await QRCode.toDataURL(upiString);
            return qrCode;
        } catch (error) {
            console.error('QR Code generation error:', error);
            return '';
        }
    }

    /**
     * Create invoice from order
     */
    static async createInvoice(orderId, restaurantId, invoiceData = {}) {
        try {
            // Get order details
            const order = await Order.findOne({ _id: orderId, restaurantId })
                .populate('items.menuItemId', 'name');

            if (!order) {
                throw new Error('Order not found');
            }

            // Get restaurant details
            const restaurant = await Restaurant.findById(restaurantId);
            if (!restaurant) {
                throw new Error('Restaurant not found');
            }

            // Generate invoice number
            const invoiceNumber = await this.generateInvoiceNumber(restaurantId);

            // Prepare items
            const items = order.items.map(item => ({
                name: item.name || item.menuItemId?.name || 'Unknown Item',
                quantity: item.quantity,
                price: item.price,
                amount: item.price * item.quantity,
                hsnCode: '996331'
            }));

            // Calculate subtotal
            const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

            // Calculate taxes
            const calculations = this.calculateTaxes(
                subtotal,
                invoiceData.discount || 0,
                invoiceData.discountPercentage || 0,
                invoiceData.isInterState || false
            );

            // Generate UPI QR Code if UPI ID provided
            let qrCodeData = '';
            if (invoiceData.upiId) {
                qrCodeData = await this.generateUPIQRCode(
                    invoiceData.upiId,
                    calculations.grandTotal,
                    restaurant.name
                );
            }

            // Create invoice
            const invoice = await Invoice.create({
                restaurantId,
                orderId,
                invoiceNumber,
                customerName: invoiceData.customerName || 'Walk-in Customer',
                customerPhone: invoiceData.customerPhone || '',
                customerEmail: invoiceData.customerEmail || '',
                customerGSTIN: invoiceData.customerGSTIN || '',
                restaurantDetails: {
                    name: restaurant.name,
                    address: restaurant.address,
                    phone: restaurant.phone,
                    email: restaurant.email,
                    gstNumber: invoiceData.restaurantGSTNumber || '',
                    logo: invoiceData.restaurantLogo || ''
                },
                items,
                tableNumber: order.tableNumber,
                ...calculations,
                paymentMethod: invoiceData.paymentMethod || 'PENDING',
                paymentStatus: invoiceData.paymentStatus || 'UNPAID',
                paidAmount: invoiceData.paidAmount || 0,
                upiId: invoiceData.upiId || '',
                qrCodeData,
                notes: invoiceData.notes || '',
                termsAndConditions: invoiceData.termsAndConditions || 'Thank you for your business! Please visit again.'
            });

            return invoice;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate PDF invoice
     */
    static async generatePDF(invoiceId) {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Header
                doc.fontSize(20).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
                doc.moveDown(0.5);

                // Restaurant Details
                doc.fontSize(16).text(invoice.restaurantDetails.name, { align: 'left' });
                doc.fontSize(10).font('Helvetica');
                doc.text(invoice.restaurantDetails.address);
                doc.text(`Phone: ${invoice.restaurantDetails.phone}`);
                doc.text(`Email: ${invoice.restaurantDetails.email}`);
                if (invoice.restaurantDetails.gstNumber) {
                    doc.text(`GSTIN: ${invoice.restaurantDetails.gstNumber}`);
                }
                doc.moveDown();

                // Invoice Details
                const invoiceY = doc.y;
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text(`Invoice No: ${invoice.invoiceNumber}`, 50, invoiceY);
                doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 350, invoiceY);
                doc.moveDown(0.5);

                // Customer Details
                doc.font('Helvetica-Bold').text('Bill To:', 50);
                doc.font('Helvetica');
                doc.text(invoice.customerName);
                if (invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`);
                if (invoice.customerEmail) doc.text(`Email: ${invoice.customerEmail}`);
                if (invoice.customerGSTIN) doc.text(`GSTIN: ${invoice.customerGSTIN}`);
                if (invoice.tableNumber) doc.text(`Table: ${invoice.tableNumber}`);
                doc.moveDown();

                // Line separator
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(0.5);

                // Table Header
                const tableTop = doc.y;
                doc.font('Helvetica-Bold').fontSize(10);
                doc.text('Item', 50, tableTop);
                doc.text('HSN', 250, tableTop);
                doc.text('Qty', 320, tableTop);
                doc.text('Price', 380, tableTop);
                doc.text('Amount', 480, tableTop, { width: 70, align: 'right' });

                doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
                doc.moveDown(0.5);

                // Items
                doc.font('Helvetica').fontSize(9);
                invoice.items.forEach(item => {
                    const y = doc.y;
                    doc.text(item.name, 50, y, { width: 190 });
                    doc.text(item.hsnCode, 250, y);
                    doc.text(item.quantity.toString(), 320, y);
                    doc.text(`₹${item.price.toFixed(2)}`, 380, y);
                    doc.text(`₹${item.amount.toFixed(2)}`, 480, y, { width: 70, align: 'right' });
                    doc.moveDown(0.8);
                });

                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(0.5);

                // Totals
                const totalsX = 380;
                doc.font('Helvetica').fontSize(10);

                doc.text('Subtotal:', totalsX, doc.y);
                doc.text(`₹${invoice.subtotal.toFixed(2)}`, 480, doc.y, { width: 70, align: 'right' });
                doc.moveDown(0.5);

                if (invoice.discount > 0) {
                    doc.text(`Discount ${invoice.discountPercentage > 0 ? `(${invoice.discountPercentage}%)` : ''}:`, totalsX, doc.y);
                    doc.text(`-₹${invoice.discount.toFixed(2)}`, 480, doc.y, { width: 70, align: 'right' });
                    doc.moveDown(0.5);
                }

                // Tax Details
                if (invoice.taxDetails.cgst.amount > 0) {
                    doc.text(`CGST (${invoice.taxDetails.cgst.rate}%):`, totalsX, doc.y);
                    doc.text(`₹${invoice.taxDetails.cgst.amount.toFixed(2)}`, 480, doc.y, { width: 70, align: 'right' });
                    doc.moveDown(0.5);
                }

                if (invoice.taxDetails.sgst.amount > 0) {
                    doc.text(`SGST (${invoice.taxDetails.sgst.rate}%):`, totalsX, doc.y);
                    doc.text(`₹${invoice.taxDetails.sgst.amount.toFixed(2)}`, 480, doc.y, { width: 70, align: 'right' });
                    doc.moveDown(0.5);
                }

                if (invoice.taxDetails.igst.amount > 0) {
                    doc.text(`IGST (${invoice.taxDetails.igst.rate}%):`, totalsX, doc.y);
                    doc.text(`₹${invoice.taxDetails.igst.amount.toFixed(2)}`, 480, doc.y, { width: 70, align: 'right' });
                    doc.moveDown(0.5);
                }

                if (invoice.roundOff !== 0) {
                    doc.text('Round Off:', totalsX, doc.y);
                    doc.text(`₹${invoice.roundOff.toFixed(2)}`, 480, doc.y, { width: 70, align: 'right' });
                    doc.moveDown(0.5);
                }

                doc.moveTo(380, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(0.5);

                doc.font('Helvetica-Bold').fontSize(12);
                doc.text('Grand Total:', totalsX, doc.y);
                doc.text(`₹${invoice.grandTotal.toFixed(2)}`, 480, doc.y, { width: 70, align: 'right' });
                doc.moveDown();

                // Payment Details
                doc.font('Helvetica').fontSize(10);
                doc.text(`Payment Method: ${invoice.paymentMethod}`, 50, doc.y);
                doc.text(`Payment Status: ${invoice.paymentStatus}`, 50, doc.y);
                doc.moveDown();

                // QR Code for UPI payment
                if (invoice.qrCodeData && invoice.paymentStatus !== 'PAID') {
                    doc.moveDown();
                    doc.font('Helvetica-Bold').text('Scan to Pay via UPI:', 50);
                    doc.image(invoice.qrCodeData, 50, doc.y, { width: 150 });
                    doc.moveDown(10);
                }

                // Terms and Conditions
                if (invoice.termsAndConditions) {
                    doc.moveDown();
                    doc.fontSize(8).font('Helvetica-Oblique');
                    doc.text('Terms & Conditions:', 50);
                    doc.font('Helvetica').text(invoice.termsAndConditions, { width: 500 });
                }

                // Footer
                doc.fontSize(8).text(
                    'This is a computer-generated invoice and does not require a signature.',
                    50,
                    doc.page.height - 50,
                    { align: 'center', width: 500 }
                );

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Update invoice payment status
     */
    static async updatePaymentStatus(invoiceId, paymentData) {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        invoice.paymentMethod = paymentData.paymentMethod || invoice.paymentMethod;
        invoice.paidAmount = paymentData.paidAmount || invoice.paidAmount;

        if (invoice.paidAmount >= invoice.grandTotal) {
            invoice.paymentStatus = 'PAID';
        } else if (invoice.paidAmount > 0) {
            invoice.paymentStatus = 'PARTIAL';
        } else {
            invoice.paymentStatus = 'UNPAID';
        }

        await invoice.save();
        return invoice;
    }
}

module.exports = InvoiceService;
