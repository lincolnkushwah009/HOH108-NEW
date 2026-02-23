import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, CreditCard, Building2, Wallet, CheckCircle, AlertCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Input, Select } from '../../components/ui'
import { formatCurrency } from '../../utils/helpers'

const VendorPaymentGateway = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [paymentData, setPaymentData] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [processing, setProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null) // 'success' | 'failed' | null
  const [formData, setFormData] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    upiId: '',
    remarks: ''
  })

  useEffect(() => {
    // Get payment data from location state or sessionStorage
    const data = location.state || JSON.parse(sessionStorage.getItem('vendorPaymentData') || 'null')
    if (data) {
      setPaymentData(data)
    } else {
      // No payment data, redirect back
      navigate('/admin/vendor-invoices')
    }
  }, [location.state, navigate])

  const paymentMethods = [
    { id: 'bank_transfer', label: 'Bank Transfer (NEFT/RTGS)', icon: Building2 },
    { id: 'upi', label: 'UPI Payment', icon: Wallet },
  ]

  const handlePayment = async () => {
    // Validate form
    if (paymentMethod === 'bank_transfer') {
      if (!formData.accountNumber || !formData.ifscCode || !formData.accountHolderName) {
        alert('Please fill all bank details')
        return
      }
    } else if (paymentMethod === 'upi') {
      if (!formData.upiId) {
        alert('Please enter UPI ID')
        return
      }
    }

    setProcessing(true)

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate success (in real app, this would call a payment gateway API)
      const success = Math.random() > 0.1 // 90% success rate for demo

      if (success) {
        setPaymentStatus('success')
        // Clear session storage
        sessionStorage.removeItem('vendorPaymentData')
      } else {
        setPaymentStatus('failed')
      }
    } catch (error) {
      console.error('Payment failed:', error)
      setPaymentStatus('failed')
    } finally {
      setProcessing(false)
    }
  }

  if (!paymentData) {
    return null
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your payment of {formatCurrency(paymentData.amount)} to {paymentData.vendorName} has been processed successfully.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice:</span>
                  <span className="font-medium">{paymentData.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium text-green-600">{formatCurrency(paymentData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-medium">TXN{Date.now()}</span>
                </div>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/vendor-invoices')} className="w-full">
              Back to Invoices
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">
              We couldn't process your payment. Please try again or use a different payment method.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/admin/vendor-invoices')} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setPaymentStatus(null)} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate('/admin/vendor-invoices')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Vendor Payment
                </h2>

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          paymentMethod === method.id
                            ? 'border-[#111111] bg-[#111111]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <method.icon className={`w-6 h-6 mb-2 ${
                          paymentMethod === method.id ? 'text-[#111111]' : 'text-gray-400'
                        }`} />
                        <p className={`text-sm font-medium ${
                          paymentMethod === method.id ? 'text-[#111111]' : 'text-gray-600'
                        }`}>
                          {method.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank Transfer Form */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-4">
                    <Input
                      label="Account Holder Name *"
                      value={formData.accountHolderName}
                      onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                      placeholder="Enter account holder name"
                    />
                    <Input
                      label="Account Number *"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="Enter account number"
                    />
                    <Input
                      label="IFSC Code *"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                      placeholder="Enter IFSC code"
                    />
                    <Input
                      label="Remarks (Optional)"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Payment remarks"
                    />
                  </div>
                )}

                {/* UPI Form */}
                {paymentMethod === 'upi' && (
                  <div className="space-y-4">
                    <Input
                      label="UPI ID *"
                      value={formData.upiId}
                      onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                      placeholder="vendor@upi or 9876543210@upi"
                    />
                    <Input
                      label="Remarks (Optional)"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Payment remarks"
                    />
                  </div>
                )}

                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={handlePayment}
                    loading={processing}
                    className="w-full"
                    size="lg"
                  >
                    {processing ? 'Processing Payment...' : `Pay ${formatCurrency(paymentData.amount)}`}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Summary */}
          <div>
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>

                <div className="space-y-4">
                  <div className="pb-4 border-b">
                    <p className="text-sm text-gray-500 mb-1">Invoice Number</p>
                    <p className="font-medium text-gray-900">{paymentData.invoiceNumber}</p>
                  </div>

                  <div className="pb-4 border-b">
                    <p className="text-sm text-gray-500 mb-1">Vendor</p>
                    <p className="font-medium text-gray-900">{paymentData.vendorName}</p>
                    <p className="text-sm text-gray-500">{paymentData.vendorCode}</p>
                  </div>

                  <div className="pb-4 border-b">
                    <p className="text-sm text-gray-500 mb-1">Payment Amount</p>
                    <p className="text-2xl font-bold text-[#111111]">{formatCurrency(paymentData.amount)}</p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> Please verify all payment details before proceeding. This transaction cannot be reversed once initiated.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VendorPaymentGateway
